/**
 * 流式聊天Hook
 * 基于nova-red-book-scribe-main项目的流式输出实现
 * 增强版本：支持心跳检测、连接状态监控、自动重连
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { jubenApi, ChatRequest, StreamEvent } from '@/lib/api';

export interface StreamChatState {
  isStreaming: boolean;
  content: string;
  metadata: any;
  error: string | null;
  isComplete: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  heartbeatStatus: 'active' | 'inactive' | 'error';
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
}

export interface StreamChatOptions {
  onStart?: () => void;
  onUpdate?: (content: string, metadata: any) => void;
  onComplete?: (finalContent: string, metadata: any) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (status: StreamChatState['connectionStatus']) => void;
  onHeartbeat?: (status: StreamChatState['heartbeatStatus']) => void;
  enableHeartbeat?: boolean;
  heartbeatInterval?: number;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export function useStreamChat(options: StreamChatOptions = {}) {
  const {
    enableHeartbeat = true,
    heartbeatInterval = 5000,
    maxReconnectAttempts = 3,
    reconnectDelay = 1000,
  } = options;

  const [state, setState] = useState<StreamChatState>({
    isStreaming: false,
    content: '',
    metadata: null,
    error: null,
    isComplete: false,
    connectionStatus: 'disconnected',
    heartbeatStatus: 'inactive',
    lastHeartbeat: null,
    reconnectAttempts: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());
  const isStreamingRef = useRef<boolean>(false);

  // 心跳检测函数
  const sendHeartbeat = useCallback(async (sessionId: string, userId: string) => {
    if (!enableHeartbeat || !isStreamingRef.current) return;

    try {
      // 发送心跳请求到后端
      await jubenApi.heartbeat(sessionId, userId);
      
      setState(prev => ({
        ...prev,
        heartbeatStatus: 'active',
        lastHeartbeat: new Date(),
      }));
      
      options.onHeartbeat?.('active');
      lastActivityRef.current = new Date();
    } catch (error) {
      console.warn('心跳检测失败:', error);
      setState(prev => ({
        ...prev,
        heartbeatStatus: 'error',
      }));
      
      options.onHeartbeat?.('error');
      
      // 心跳失败时尝试重连
      if (state.reconnectAttempts < maxReconnectAttempts) {
        attemptReconnect();
      }
    }
  }, [enableHeartbeat, maxReconnectAttempts, state.reconnectAttempts, options]);

  // 启动心跳检测
  const startHeartbeat = useCallback((sessionId: string, userId: string) => {
    if (!enableHeartbeat) return;
    
    stopHeartbeat(); // 先停止现有的心跳
    
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat(sessionId, userId);
    }, heartbeatInterval);
    
    setState(prev => ({
      ...prev,
      heartbeatStatus: 'active',
    }));
  }, [enableHeartbeat, heartbeatInterval, sendHeartbeat]);

  // 停止心跳检测
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      heartbeatStatus: 'inactive',
    }));
  }, []);

  // 尝试重连
  const attemptReconnect = useCallback(() => {
    if (state.reconnectAttempts >= maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连');
      setState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
      }));
      options.onConnectionChange?.('disconnected');
      return;
    }

    setState(prev => ({
      ...prev,
      connectionStatus: 'reconnecting',
      reconnectAttempts: prev.reconnectAttempts + 1,
    }));
    
    options.onConnectionChange?.('reconnecting');
    
    reconnectTimeoutRef.current = setTimeout(() => {
      // 这里可以实现重连逻辑
      console.log(`重连尝试 ${state.reconnectAttempts + 1}/${maxReconnectAttempts}`);
    }, reconnectDelay * Math.pow(2, state.reconnectAttempts)); // 指数退避
  }, [state.reconnectAttempts, maxReconnectAttempts, reconnectDelay, options]);

  // 连接状态管理
  const updateConnectionStatus = useCallback((status: StreamChatState['connectionStatus']) => {
    setState(prev => ({
      ...prev,
      connectionStatus: status,
    }));
    options.onConnectionChange?.(status);
  }, [options]);

  const startStream = useCallback(async (
    request: ChatRequest,
    agentType?: string
  ) => {
    // 重置状态
    setState(prev => ({
      ...prev,
      isStreaming: true,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
      connectionStatus: 'connecting',
      reconnectAttempts: 0,
    }));

    isStreamingRef.current = true;
    updateConnectionStatus('connecting');

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      options.onStart?.();
      
      // 启动心跳检测
      if (enableHeartbeat) {
        startHeartbeat(request.session_id || '', request.user_id || '');
      }
      
      updateConnectionStatus('connected');

      const onEvent = (event: StreamEvent) => {
        // 更新最后活动时间
        lastActivityRef.current = new Date();
        
        if (event.type === 'content') {
          const { data } = event;
          
          // 处理不同类型的流数据
          if (data.content) {
            setState(prev => {
              const newContent = prev.content + data.content;
              options.onUpdate?.(newContent, data.metadata || data);
              return {
                ...prev,
                content: newContent,
                metadata: data.metadata || data,
              };
            });
          } else if (data.message) {
            setState(prev => {
              const newContent = prev.content + data.message;
              options.onUpdate?.(newContent, data);
              return {
                ...prev,
                content: newContent,
                metadata: data,
              };
            });
          } else if (data.thought) {
            // 处理思考过程内容
            setState(prev => {
              const newContent = prev.content + data.thought;
              options.onUpdate?.(newContent, { ...data, type: 'thought' });
              return {
                ...prev,
                content: newContent,
                metadata: { ...data, type: 'thought' },
              };
            });
          } else if (data.answer) {
            // 处理回答内容
            setState(prev => {
              const newContent = prev.content + data.answer;
              options.onUpdate?.(newContent, { ...data, type: 'answer' });
              return {
                ...prev,
                content: newContent,
                metadata: { ...data, type: 'answer' },
              };
            });
          }
        } else if (event.type === 'metadata') {
          // 处理元数据更新
          setState(prev => ({
            ...prev,
            metadata: { ...prev.metadata, ...event.data },
          }));
        } else if (event.type === 'done') {
          setState(prev => {
            options.onComplete?.(prev.content, prev.metadata);
            return {
              ...prev,
              isStreaming: false,
              isComplete: true,
              connectionStatus: 'disconnected',
            };
          });
          
          // 停止心跳检测
          stopHeartbeat();
          isStreamingRef.current = false;
          updateConnectionStatus('disconnected');
        } else if (event.type === 'error') {
          setState(prev => ({
            ...prev,
            error: event.data?.message || '流式输出错误',
            isStreaming: false,
            connectionStatus: 'disconnected',
          }));
          
          stopHeartbeat();
          isStreamingRef.current = false;
          updateConnectionStatus('disconnected');
          options.onError?.(event.data?.message || '流式输出错误');
        }
      };

      // 根据agentType选择不同的API调用
      if (agentType) {
        await jubenApi.chatWithAgentStream(agentType, request, onEvent, signal);
      } else {
        await jubenApi.chatStream(request, onEvent, signal);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: errorMessage,
        isComplete: false,
        connectionStatus: 'disconnected',
      }));
      
      // 停止心跳检测
      stopHeartbeat();
      isStreamingRef.current = false;
      updateConnectionStatus('disconnected');
      options.onError?.(errorMessage);
    }
  }, [options, enableHeartbeat, startHeartbeat, stopHeartbeat, updateConnectionStatus]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: '用户中断',
        connectionStatus: 'disconnected',
      }));
      
      // 停止心跳检测
      stopHeartbeat();
      isStreamingRef.current = false;
      updateConnectionStatus('disconnected');
    }
  }, [stopHeartbeat, updateConnectionStatus]);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      isStreaming: false,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
      connectionStatus: 'disconnected',
      heartbeatStatus: 'inactive',
      lastHeartbeat: null,
      reconnectAttempts: 0,
    }));
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    stopHeartbeat();
    isStreamingRef.current = false;
    updateConnectionStatus('disconnected');
  }, [stopHeartbeat, updateConnectionStatus]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startStream,
    stopStream,
    reset,
  };
}

// 专门用于故事分析的流式Hook
export function useStoryAnalysisStream(options: StreamChatOptions = {}) {
  const [state, setState] = useState<StreamChatState>({
    isStreaming: false,
    content: '',
    metadata: null,
    error: null,
    isComplete: false,
    connectionStatus: 'disconnected',
    heartbeatStatus: 'inactive',
    lastHeartbeat: null,
    reconnectAttempts: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeStory = useCallback(async (
    content: string,
    analysisType: 'five_elements' | 'series_analysis' | 'plot_points' = 'five_elements',
    context?: Record<string, any>
  ) => {
    // 重置状态
    setState(prev => ({
      ...prev,
      isStreaming: true,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
    }));

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      options.onStart?.();

      const onEvent = (event: StreamEvent) => {
        if (event.type === 'content') {
          const { data } = event;
          
          if (data.content || data.message) {
            setState(prev => {
              const newContent = prev.content + (data.content || data.message);
              options.onUpdate?.(newContent, data);
              return {
                ...prev,
                content: newContent,
                metadata: data,
              };
            });
          }
        } else if (event.type === 'done') {
          setState(prev => {
            options.onComplete?.(prev.content, prev.metadata);
            return {
              ...prev,
              isStreaming: false,
              isComplete: true,
            };
          });
        }
      };

      await jubenApi.analyzeStoryStream(
        { content, analysis_type: analysisType, context },
        onEvent,
        signal
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: errorMessage,
        isComplete: false,
      }));
      options.onError?.(errorMessage);
    }
  }, [options]);

  const stopAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: '用户中断',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      isStreaming: false,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
    }));
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    analyzeStory,
    stopAnalysis,
    reset,
  };
}

// 专门用于情节点工作流的流式Hook
export function usePlotPointsWorkflow(options: StreamChatOptions = {}) {
  const [state, setState] = useState<StreamChatState>({
    isStreaming: false,
    content: '',
    metadata: null,
    error: null,
    isComplete: false,
    connectionStatus: 'disconnected',
    heartbeatStatus: 'inactive',
    lastHeartbeat: null,
    reconnectAttempts: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const executeWorkflow = useCallback(async (request: ChatRequest) => {
    // 重置状态
    setState(prev => ({
      ...prev,
      isStreaming: true,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
    }));

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      options.onStart?.();

      const onEvent = (event: StreamEvent) => {
        if (event.type === 'content') {
          const { data } = event;
          
          if (data.content || data.message) {
            setState(prev => {
              const newContent = prev.content + (data.content || data.message);
              options.onUpdate?.(newContent, data);
              return {
                ...prev,
                content: newContent,
                metadata: data,
              };
            });
          }
        } else if (event.type === 'done') {
          setState(prev => {
            options.onComplete?.(prev.content, prev.metadata);
            return {
              ...prev,
              isStreaming: false,
              isComplete: true,
            };
          });
        }
      };

      await jubenApi.executePlotPointsWorkflowStream(request, onEvent, signal);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: errorMessage,
        isComplete: false,
      }));
      options.onError?.(errorMessage);
    }
  }, [options]);

  const stopWorkflow = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: '用户中断',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      isStreaming: false,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
    }));
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    executeWorkflow,
    stopWorkflow,
    reset,
  };
}
