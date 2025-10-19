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
        session_id: request.session_id || this.sessionId,
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
              onEvent({
                type: 'content',
                data: eventData,
                timestamp: new Date().toISOString(),
              });
            } catch (parseError) {
              console.warn('解析流事件失败:', line, parseError);
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

  // 智能体相关API
  async getAgentInfo(agentType: string): Promise<AgentInfo> {
    return this.makeRequest<AgentInfo>(`/${agentType}/info`);
  }

  async chatWithAgent(agentType: string, request: ChatRequest): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>(`/${agentType}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        ...request,
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
    const url = `${this.baseUrl}${API_PREFIX}/${agentType}/chat`;
    
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
              onEvent({
                type: 'content',
                data: eventData,
                timestamp: new Date().toISOString(),
              });
            } catch (parseError) {
              console.warn('解析智能体流事件失败:', line, parseError);
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
      body: JSON.stringify(request),
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

// 创建默认的API客户端实例
export const jubenApi = new JubenApiClient();

// 导出类型和类
export { JubenApiClient };
export type { ChatRequest, ChatResponse, StreamEvent, AgentInfo, HealthResponse, StoryAnalysisRequest };
