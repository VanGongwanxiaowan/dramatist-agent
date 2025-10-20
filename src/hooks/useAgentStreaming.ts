/**
 * 智能体流式展示Hook
 * 管理智能体的流式输出和状态
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AgentStreamMessage, StreamSession } from '@/components/AgentStreamContainer';

// 智能体流式状态
export interface AgentStreamingState {
  session: StreamSession | null;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastMessageTime: Date | null;
  error: string | null;
}

// 智能体流式选项
export interface AgentStreamingOptions {
  onSessionStart?: (session: StreamSession) => void;
  onSessionUpdate?: (session: StreamSession) => void;
  onSessionComplete?: (session: StreamSession) => void;
  onMessageReceived?: (message: AgentStreamMessage) => void;
  onAgentStatusChange?: (agentId: string, status: string) => void;
  onError?: (error: string) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
  idleTimeoutMs?: number;
}

// 智能体流式事件
export interface AgentStreamEvent {
  type: 'session_start' | 'session_update' | 'message' | 'agent_status' | 'error' | 'complete';
  data: any;
  timestamp: string;
}

export function useAgentStreaming(options: AgentStreamingOptions = {}) {
  const {
    onSessionStart,
    onSessionUpdate,
    onSessionComplete,
    onMessageReceived,
    onAgentStatusChange,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatIntervalMs = 15000,
    idleTimeoutMs = 30000
  } = options;

  const [state, setState] = useState<AgentStreamingState>({
    session: null,
    isConnected: false,
    connectionStatus: 'disconnected',
    lastMessageTime: null,
    error: null
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 更新会话状态
  const updateSession = useCallback((updates: Partial<StreamSession>) => {
    setState(prev => ({
      ...prev,
      session: prev.session ? { ...prev.session, ...updates } : null
    }));

    if (state.session) {
      const updatedSession = { ...state.session, ...updates };
      onSessionUpdate?.(updatedSession);
    }
  }, [state.session, onSessionUpdate]);

  // 添加消息
  const addMessage = useCallback((message: AgentStreamMessage) => {
    if (!state.session) return;

    const updatedSession = {
      ...state.session,
      messages: [...state.session.messages, message]
    };

    setState(prev => ({
      ...prev,
      session: updatedSession,
      lastMessageTime: new Date()
    }));

    onMessageReceived?.(message);
    onSessionUpdate?.(updatedSession);
  }, [state.session, onMessageReceived, onSessionUpdate]);

  // 更新智能体状态
  const updateAgentStatus = useCallback((agentId: string, status: string) => {
    onAgentStatusChange?.(agentId, status);
  }, [onAgentStatusChange]);

  // 处理流式事件
  const handleStreamEvent = useCallback((event: AgentStreamEvent) => {
    switch (event.type) {
      case 'session_start':
        const newSession: StreamSession = {
          id: event.data.id,
          sessionId: event.data.sessionId,
          projectId: event.data.projectId,
          title: event.data.title,
          status: 'running',
          agents: event.data.agents || [],
          messages: [],
          startTime: event.data.startTime,
          totalTokens: 0,
          totalCost: 0
        };

        setState(prev => ({
          ...prev,
          session: newSession,
          connectionStatus: 'connected',
          isConnected: true,
          error: null
        }));

        onSessionStart?.(newSession);
        break;

      case 'session_update':
        updateSession(event.data);
        break;

      case 'message':
        addMessage(event.data);
        break;

      case 'agent_status':
        updateAgentStatus(event.data.agentId, event.data.status);
        break;

      case 'complete':
        updateSession({ 
          status: 'completed', 
          endTime: event.data.endTime 
        });
        onSessionComplete?.(state.session!);
        break;

      case 'error':
        setState(prev => ({
          ...prev,
          error: event.data.message,
          connectionStatus: 'error'
        }));
        onError?.(event.data.message);
        break;
    }
  }, [updateSession, addMessage, updateAgentStatus, onSessionStart, onSessionComplete, onError, state.session]);

  // 连接流式服务
  const connect = useCallback((sessionId: string, projectId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState(prev => ({
      ...prev,
      connectionStatus: 'connecting',
      error: null
    }));

    const eventSource = new EventSource(`/api/agents/stream/agents/${sessionId}?projectId=${projectId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setState(prev => ({
        ...prev,
        connectionStatus: 'connected',
        isConnected: true,
        error: null
      }));
      reconnectAttemptsRef.current = 0;

      // 启动心跳/空闲检测计时器
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      heartbeatTimerRef.current = setInterval(() => {
        const last = (state.lastMessageTime || new Date());
        const elapsed = Date.now() - last.getTime();
        if (elapsed > idleTimeoutMs) {
          // 超时未收到事件，尝试重连
          try { eventSource.close(); } catch {}
          eventSourceRef.current = null;
          if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            // 直接重连
            connect(sessionId, projectId);
          }
        }
      }, heartbeatIntervalMs);
    };

    eventSource.onmessage = (event) => {
      try {
        const streamEvent: AgentStreamEvent = JSON.parse(event.data);
        handleStreamEvent(streamEvent);
        setState(prev => ({ ...prev, lastMessageTime: new Date() }));
      } catch (error) {
        console.error('Failed to parse stream event:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to parse stream event'
        }));
      }
    };

    eventSource.onerror = (error) => {
      console.error('Stream connection error:', error);
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        isConnected: false,
        error: 'Connection error'
      }));

      eventSource.close();
      eventSourceRef.current = null;

      // 自动重连
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect(sessionId, projectId);
        }, reconnectInterval);
      }
    };
  }, [handleStreamEvent, autoReconnect, reconnectInterval, maxReconnectAttempts, heartbeatIntervalMs, idleTimeoutMs, state.lastMessageTime]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      connectionStatus: 'disconnected',
      isConnected: false
    }));

    reconnectAttemptsRef.current = 0;
  }, []);

  // 手动重连
  const reconnect = useCallback(() => {
    if (!state.session) return;
    const { sessionId, projectId } = state.session;
    disconnect();
    connect(sessionId, projectId);
  }, [state.session, disconnect, connect]);

  // 启动智能体会话
  const startSession = useCallback(async (projectId: string, agents: string[], title?: string) => {
    try {
      const response = await fetch('/api/agents/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          agents,
          title: title || `智能体协作会话 - ${new Date().toLocaleString()}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start agent session');
      }

      const result = await response.json();
      connect(result.sessionId, projectId);
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }, [connect]);

  // 停止智能体会话
  const stopSession = useCallback(async () => {
    if (!state.session) return;

    try {
      await fetch(`/api/agents/stop-session/${state.session.sessionId}`, {
        method: 'POST',
      });

      updateSession({ status: 'completed', endTime: new Date().toISOString() });
      disconnect();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to stop session'
      }));
    }
  }, [state.session, updateSession, disconnect]);

  // 发送消息到智能体
  const sendMessage = useCallback(async (message: string, targetAgent?: string) => {
    if (!state.session) return;

    try {
      const response = await fetch(`/api/agents/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: state.session.sessionId,
          message,
          targetAgent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }));
      throw error;
    }
  }, [state.session]);

  // 清理资源
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // 状态
    session: state.session,
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    lastMessageTime: state.lastMessageTime,
    error: state.error,

    // 方法
    startSession,
    stopSession,
    sendMessage,
    connect,
    reconnect,
    disconnect,
    updateSession,
    addMessage,

    // 统计信息
    getStats: () => {
      if (!state.session) return null;
      
      return {
        totalMessages: state.session.messages.length,
        completedAgents: state.session.messages.filter(msg => msg.contentType === 'complete').length,
        errorCount: state.session.messages.filter(msg => msg.contentType === 'error').length,
        totalTokens: state.session.messages.reduce((sum, msg) => sum + (msg.metadata?.tokensUsed || 0), 0),
        totalCost: state.session.totalCost || 0,
        duration: state.session.endTime 
          ? new Date(state.session.endTime).getTime() - new Date(state.session.startTime).getTime()
          : Date.now() - new Date(state.session.startTime).getTime()
      };
    }
  };
}

export default useAgentStreaming;
