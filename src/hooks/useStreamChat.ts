/**
 * 流式聊天Hook
 * 基于nova-red-book-scribe-main项目的流式输出实现
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { jubenApi, ChatRequest, StreamEvent } from '@/lib/api';

export interface StreamChatState {
  isStreaming: boolean;
  content: string;
  metadata: any;
  error: string | null;
  isComplete: boolean;
}

export interface StreamChatOptions {
  onStart?: () => void;
  onUpdate?: (content: string, metadata: any) => void;
  onComplete?: (finalContent: string, metadata: any) => void;
  onError?: (error: string) => void;
}

export function useStreamChat(options: StreamChatOptions = {}) {
  const [state, setState] = useState<StreamChatState>({
    isStreaming: false,
    content: '',
    metadata: null,
    error: null,
    isComplete: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (
    request: ChatRequest,
    agentType?: string
  ) => {
    // 重置状态
    setState({
      isStreaming: true,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
    });

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      options.onStart?.();

      const onEvent = (event: StreamEvent) => {
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
      }));
      options.onError?.(errorMessage);
    }
  }, [options]);

  const stopStream = useCallback(() => {
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
    setState({
      isStreaming: false,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
    });
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
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeStory = useCallback(async (
    content: string,
    analysisType: 'five_elements' | 'series_analysis' | 'plot_points' = 'five_elements',
    context?: Record<string, any>
  ) => {
    // 重置状态
    setState({
      isStreaming: true,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
    });

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
    setState({
      isStreaming: false,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
    });
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
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const executeWorkflow = useCallback(async (request: ChatRequest) => {
    // 重置状态
    setState({
      isStreaming: true,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
    });

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
    setState({
      isStreaming: false,
      content: '',
      metadata: null,
      error: null,
      isComplete: false,
    });
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
