/**
 * 竖屏短剧策划助手 - API集成层
 * 基于juben后端API提供统一的接口调用
 */

import config from './config';

// 基础配置
const API_BASE_URL = config.api.baseUrl;
const API_PREFIX = '/juben';

// 类型定义
export interface ChatRequest {
  message: string;
  agent_type?: string;
  session_id?: string;
  user_id?: string;
  context?: Record<string, any>;
  stream?: boolean;
}

export interface ChatResponse {
  message: string;
  agent_type: string;
  session_id: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface StreamEvent {
  type: 'content' | 'metadata' | 'error' | 'done';
  data: any;
  timestamp: string;
}

// 智能体流式消息类型
export interface AgentStreamMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  content: string;
  contentType: 'thought' | 'action' | 'result' | 'error' | 'complete';
  timestamp: string;
  metadata?: {
    tokensUsed?: number;
    duration?: number;
    toolsUsed?: string[];
    confidence?: number;
  };
  isStreaming?: boolean;
  isComplete?: boolean;
}

// 智能体会话类型
export interface AgentSession {
  id: string;
  sessionId: string;
  projectId: string;
  title: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  agents: string[];
  messages: AgentStreamMessage[];
  startTime: string;
  endTime?: string;
  totalTokens?: number;
  totalCost?: number;
}

// 智能体流式事件类型
export interface AgentStreamEvent {
  type: 'session_start' | 'session_update' | 'message' | 'agent_status' | 'error' | 'complete';
  data: any;
  timestamp: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'inactive';
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: string;
  dependencies: Record<string, string>;
}

export interface StoryAnalysisRequest {
  content: string;
  analysis_type: 'five_elements' | 'series_analysis' | 'plot_points';
  context?: Record<string, any>;
}

// API客户端类
class JubenApiClient {
  private baseUrl: string;
  private sessionId: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${API_PREFIX}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // 聊天相关API
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        ...request,
        // 统一使用 input 字段，确保与后端API一致
        input: request.message || (request as any).input || (request as any).content || '',
        // 保留 message 字段用于兼容性
        message: request.message || (request as any).input || (request as any).content || '',
        session_id: request.session_id || this.sessionId,
        user_id: request.user_id || 'demo_user',
      }),
    });
  }

  async chatStream(
    request: ChatRequest,
    onEvent: (event: StreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${this.baseUrl}${API_PREFIX}/chat`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        input: request.message || (request as any).input || (request as any).content || '',
        user_id: request.user_id || 'demo_user',
        session_id: request.session_id || this.sessionId,
        enable_web_search: request.context?.enable_web_search || false,
        enable_knowledge_base: request.context?.enable_knowledge_base || false,
        model_provider: request.context?.model_provider || 'openai',
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`流式聊天请求失败: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('没有响应流');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6).trim();
            if (dataContent === '[DONE]') {
              onEvent({
                type: 'done',
                data: null,
                timestamp: new Date().toISOString(),
              });
              continue;
            }
            if (dataContent === '') continue;

            try {
              const eventData = JSON.parse(dataContent);
              
              // 统一处理后端流式响应格式
              let eventType = 'content';
              let eventData_content = '';
              let eventData_metadata = {};
              
              if (eventData.event_type) {
                // 后端格式：{event_type: "message", data: "content", timestamp: "..."}
                eventType = eventData.event_type === 'message' ? 'content' : eventData.event_type;
                eventData_content = eventData.data || eventData.message || '';
                eventData_metadata = eventData.metadata || {};
              } else if (eventData.type) {
                // 前端格式：{type: "content", data: {...}}
                eventType = eventData.type;
                eventData_content = eventData.data?.content || eventData.data || '';
                eventData_metadata = eventData.data?.metadata || eventData.metadata || {};
              } else {
                // 直接内容格式
                eventData_content = eventData.content || eventData.message || eventData;
                eventData_metadata = eventData.metadata || {};
              }
              
              // 统一事件格式
              onEvent({
                type: eventType,
                data: {
                  content: eventData_content,
                  metadata: eventData_metadata,
                  agent_type: eventData.agent_type,
                  status: eventData.status,
                },
                timestamp: eventData.timestamp || new Date().toISOString(),
              });
            } catch (parseError) {
              console.warn('解析流事件失败:', line, parseError);
              // 如果JSON解析失败，将原始内容作为文本处理
              onEvent({
                type: 'content',
                data: {
                  content: dataContent,
                  metadata: {},
                },
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('流式请求被用户中断');
      } else {
        console.error('读取流式响应失败:', error);
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  // 系统信息API
  async getModels(): Promise<string[]> {
    return this.makeRequest<string[]>('/models');
  }

  async getConfig(): Promise<Record<string, any>> {
    return this.makeRequest<Record<string, any>>('/config');
  }

  async getHealth(): Promise<HealthResponse> {
    return this.makeRequest<HealthResponse>('/health');
  }

  // 心跳检测API
  async heartbeat(sessionId: string, userId: string): Promise<{ status: string; timestamp: string }> {
    // 后端没有 /heartbeat 端点，改为使用 /health 做心跳检测
    const health = await this.getHealth();
    return { status: health.status, timestamp: new Date().toISOString() };
  }

  // 智能体相关API
  async getAgentInfo(agentType: string): Promise<AgentInfo> {
    return this.makeRequest<AgentInfo>(`/${agentType}/info`);
  }

  async chatWithAgent(agentType: string, request: ChatRequest): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>(`/${agentType}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        ...request,
        input: (request as any).input || request.message || (request as any).content || '',
        message: request.message || (request as any).input || (request as any).content || '',
        session_id: request.session_id || this.sessionId,
      }),
    });
  }

  async chatWithAgentStream(
    agentType: string,
    request: ChatRequest,
    onEvent: (event: StreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    // 根据agentType映射到正确的API端点
    const agentEndpointMap: Record<string, string> = {
      'planner': '/juben/planner/chat',
      'creator': '/juben/creator/chat',
      'evaluation': '/juben/evaluation/chat',
      'websearch': '/juben/websearch/chat',
      'knowledge': '/juben/knowledge/chat',
      'story-analysis': '/juben/story-analysis/analyze',
      'series-analysis': '/juben/series-analysis/analyze',
      'plot-points': '/juben/plot-points-workflow/execute',
      'story-five-elements': '/juben/story-five-elements/chat',
      'series-info': '/juben/series-info/chat',
      'file-reference': '/juben/file-reference/chat',
    };
    
    const endpoint = agentEndpointMap[agentType] || `/juben/${agentType}/chat`;
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        input: request.message || (request as any).input || (request as any).content || '',
        user_id: request.user_id || 'demo_user',
        session_id: request.session_id || this.sessionId,
        enable_web_search: request.context?.enable_web_search || false,
        enable_knowledge_base: request.context?.enable_knowledge_base || false,
        model_provider: request.context?.model_provider || 'openai',
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`智能体流式聊天请求失败: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('没有响应流');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6).trim();
            if (dataContent === '[DONE]') {
              onEvent({
                type: 'done',
                data: null,
                timestamp: new Date().toISOString(),
              });
              continue;
            }
            if (dataContent === '') continue;

            try {
              const eventData = JSON.parse(dataContent);
              
              // 处理后端流式响应格式
              if (eventData.event_type) {
                // 后端格式：{event_type: "message", data: "content", timestamp: "..."}
                onEvent({
                  type: 'content',
                  data: {
                    content: eventData.data || eventData.message || '',
                    metadata: eventData.metadata || {},
                    event_type: eventData.event_type,
                  },
                  timestamp: eventData.timestamp || new Date().toISOString(),
                });
              } else if (eventData.type) {
                // 前端格式：{type: "content", data: {...}}
                onEvent({
                  type: eventData.type,
                  data: eventData.data,
                  timestamp: eventData.timestamp || new Date().toISOString(),
                });
              } else {
                // 直接内容格式
                onEvent({
                  type: 'content',
                  data: {
                    content: eventData.content || eventData.message || eventData,
                    metadata: eventData.metadata || {},
                  },
                  timestamp: new Date().toISOString(),
                });
              }
            } catch (parseError) {
              console.warn('解析智能体流事件失败:', line, parseError);
              // 如果JSON解析失败，将原始内容作为文本处理
              onEvent({
                type: 'content',
                data: {
                  content: dataContent,
                  metadata: {},
                },
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('智能体流式请求被用户中断');
      } else {
        console.error('读取智能体流式响应失败:', error);
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  // 故事分析API
  async analyzeStory(request: StoryAnalysisRequest): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/story-analysis/analyze', {
      method: 'POST',
      // 后端期望 input 字段，这里将 content 映射为 input
      body: JSON.stringify({
        ...request,
        input: (request as any).input || request.content,
      }),
    });
  }

  async analyzeStoryStream(
    request: StoryAnalysisRequest,
    onEvent: (event: StreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${this.baseUrl}${API_PREFIX}/story-analysis/analyze`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        input: (request as any).input || request.content,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`故事分析流式请求失败: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('没有响应流');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6).trim();
            if (dataContent === '[DONE]') {
              onEvent({
                type: 'done',
                data: null,
                timestamp: new Date().toISOString(),
              });
              continue;
            }
            if (dataContent === '') continue;

            try {
              const eventData = JSON.parse(dataContent);
              onEvent({
                type: 'content',
                data: eventData,
                timestamp: new Date().toISOString(),
              });
            } catch (parseError) {
              console.warn('解析故事分析流事件失败:', line, parseError);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('故事分析流式请求被用户中断');
      } else {
        console.error('读取故事分析流式响应失败:', error);
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  // 系列分析API
  async analyzeSeries(request: ChatRequest): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/series-analysis/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async analyzeSeriesStream(
    request: ChatRequest,
    onEvent: (event: StreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${this.baseUrl}${API_PREFIX}/series-analysis/analyze`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        stream: true,
        session_id: request.session_id || this.sessionId,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`系列分析流式请求失败: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('没有响应流');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6).trim();
            if (dataContent === '[DONE]') {
              onEvent({
                type: 'done',
                data: null,
                timestamp: new Date().toISOString(),
              });
              continue;
            }
            if (dataContent === '') continue;

            try {
              const eventData = JSON.parse(dataContent);
              onEvent({
                type: 'content',
                data: eventData,
                timestamp: new Date().toISOString(),
              });
            } catch (parseError) {
              console.warn('解析系列分析流事件失败:', line, parseError);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('系列分析流式请求被用户中断');
      } else {
        console.error('读取系列分析流式响应失败:', error);
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  // 情节点工作流API
  async executePlotPointsWorkflow(request: ChatRequest): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/plot-points-workflow/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async executePlotPointsWorkflowStream(
    request: ChatRequest,
    onEvent: (event: StreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${this.baseUrl}${API_PREFIX}/plot-points-workflow/execute`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        stream: true,
        session_id: request.session_id || this.sessionId,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`情节点工作流流式请求失败: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('没有响应流');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6).trim();
            if (dataContent === '[DONE]') {
              onEvent({
                type: 'done',
                data: null,
                timestamp: new Date().toISOString(),
              });
              continue;
            }
            if (dataContent === '') continue;

            try {
              const eventData = JSON.parse(dataContent);
              onEvent({
                type: 'content',
                data: eventData,
                timestamp: new Date().toISOString(),
              });
            } catch (parseError) {
              console.warn('解析情节点工作流流事件失败:', line, parseError);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('情节点工作流流式请求被用户中断');
      } else {
        console.error('读取情节点工作流流式响应失败:', error);
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  // 知识库API
  async getKnowledgeCollections(): Promise<string[]> {
    return this.makeRequest<string[]>('/knowledge/collections');
  }

  async searchKnowledge(query: string, collection?: string): Promise<any[]> {
    return this.makeRequest<any[]>('/knowledge/search', {
      method: 'POST',
      body: JSON.stringify({ query, collection }),
    });
  }

  // 网络搜索API
  async searchWeb(query: string, num_results: number = 5): Promise<any[]> {
    return this.makeRequest<any[]>('/search/web', {
      method: 'POST',
      body: JSON.stringify({ query, num_results }),
    });
  }

  // 文件引用API
  async analyzeFileReference(request: ChatRequest): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/file-reference/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async analyzeFileReferenceStream(
    request: ChatRequest,
    onEvent: (event: StreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${this.baseUrl}${API_PREFIX}/file-reference/chat`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        stream: true,
        session_id: request.session_id || this.sessionId,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`文件引用分析流式请求失败: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('没有响应流');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6).trim();
            if (dataContent === '[DONE]') {
              onEvent({
                type: 'done',
                data: null,
                timestamp: new Date().toISOString(),
              });
              continue;
            }
            if (dataContent === '') continue;

            try {
              const eventData = JSON.parse(dataContent);
              onEvent({
                type: 'content',
                data: eventData,
                timestamp: new Date().toISOString(),
              });
            } catch (parseError) {
              console.warn('解析文件引用分析流事件失败:', line, parseError);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('文件引用分析流式请求被用户中断');
      } else {
        console.error('读取文件引用分析流式响应失败:', error);
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  // 获取新的会话ID
  getSessionId(): string {
    return this.sessionId;
  }

  // 重置会话ID
  resetSession(): void {
    this.sessionId = this.generateSessionId();
  }
}

// 智能体流式API扩展
export class AgentStreamingAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // 启动智能体会话
  async startSession(projectId: string, agents: string[], title?: string): Promise<AgentSession> {
    const response = await fetch(`${this.baseUrl}${API_PREFIX}/agents/start-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        projectId, 
        agents, 
        title: title || `智能体协作会话 - ${new Date().toLocaleString()}` 
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start agent session: ${response.statusText}`);
    }

    return response.json();
  }

  // 停止智能体会话
  async stopSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${API_PREFIX}/agents/stop-session/${sessionId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to stop agent session: ${response.statusText}`);
    }
  }

  // 发送消息到智能体
  async sendMessage(sessionId: string, message: string, targetAgent?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${API_PREFIX}/agents/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message, targetAgent }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
  }

  // 获取会话历史
  async getSessionHistory(sessionId: string): Promise<AgentStreamMessage[]> {
    const response = await fetch(`${this.baseUrl}${API_PREFIX}/agents/session/${sessionId}/history`);

    if (!response.ok) {
      throw new Error(`Failed to get session history: ${response.statusText}`);
    }

    return response.json();
  }

  // 创建流式连接
  createStreamConnection(sessionId: string, projectId: string): EventSource {
    return new EventSource(`${this.baseUrl}${API_PREFIX}/agents/stream/agents/${sessionId}?projectId=${projectId}`);
  }
}

// 创建默认的API客户端实例
export const jubenApi = new JubenApiClient();

// 创建智能体流式API实例
export const agentStreamingApi = new AgentStreamingAPI();

// 导出类型和类
export { JubenApiClient };
export type { 
  ChatRequest, 
  ChatResponse, 
  StreamEvent, 
  AgentInfo, 
  HealthResponse, 
  StoryAnalysisRequest,
  AgentStreamMessage,
  AgentSession,
  AgentStreamEvent
};
