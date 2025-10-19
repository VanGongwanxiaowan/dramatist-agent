/**
 * 前端数据库API集成
 * 直接连接Supabase数据库，获取实际数据
 */

import { createClient } from '@supabase/supabase-js';

// 数据库类型定义
export interface Database {
  public: {
    Tables: {
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          created_at: string;
          updated_at: string;
          last_activity_at: string;
          status: string;
          session_type: string;
          metadata: any;
          preferences: any;
          usage_stats: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string;
          status?: string;
          session_type?: string;
          metadata?: any;
          preferences?: any;
          usage_stats?: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string;
          status?: string;
          session_type?: string;
          metadata?: any;
          preferences?: any;
          usage_stats?: any;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          message_type: string;
          content: string;
          agent_name: string | null;
          message_metadata: any;
          parent_message_id: string | null;
          message_order: number;
          is_edited: boolean;
          edit_history: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          message_type: string;
          content: string;
          agent_name?: string | null;
          message_metadata?: any;
          parent_message_id?: string | null;
          message_order?: number;
          is_edited?: boolean;
          edit_history?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          message_type?: string;
          content?: string;
          agent_name?: string | null;
          message_metadata?: any;
          parent_message_id?: string | null;
          message_order?: number;
          is_edited?: boolean;
          edit_history?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          action: string;
          name: string;
          title: string | null;
          context: string;
          select_status: number;
          priority: number;
          tags: string[];
          category: string | null;
          metadata: any;
          is_archived: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          action: string;
          name: string;
          title?: string | null;
          context: string;
          select_status?: number;
          priority?: number;
          tags?: string[];
          category?: string | null;
          metadata?: any;
          is_archived?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          action?: string;
          name?: string;
          title?: string | null;
          context?: string;
          select_status?: number;
          priority?: number;
          tags?: string[];
          category?: string | null;
          metadata?: any;
          is_archived?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workflow_instances: {
        Row: {
          id: string;
          workflow_id: string;
          workflow_type: string;
          user_id: string;
          session_id: string;
          status: string;
          current_step: number;
          total_steps: number;
          instruction: string;
          context: any;
          results: any;
          error_info: any;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          workflow_type: string;
          user_id: string;
          session_id: string;
          status?: string;
          current_step?: number;
          total_steps: number;
          instruction: string;
          context?: any;
          results?: any;
          error_info?: any;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          workflow_type?: string;
          user_id?: string;
          session_id?: string;
          status?: string;
          current_step?: number;
          total_steps?: number;
          instruction?: string;
          context?: any;
          results?: any;
          error_info?: any;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      token_usage: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          agent_name: string;
          model_provider: string;
          model_name: string;
          request_tokens: number;
          response_tokens: number;
          total_tokens: number;
          cost_points: number;
          cost_usd: number;
          request_timestamp: string;
          billing_summary: any;
          usage_category: string;
          efficiency_score: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          agent_name: string;
          model_provider: string;
          model_name: string;
          request_tokens?: number;
          response_tokens?: number;
          total_tokens?: number;
          cost_points?: number;
          cost_usd?: number;
          request_timestamp?: string;
          billing_summary?: any;
          usage_category?: string;
          efficiency_score?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          agent_name?: string;
          model_provider?: string;
          model_name?: string;
          request_tokens?: number;
          response_tokens?: number;
          total_tokens?: number;
          cost_points?: number;
          cost_usd?: number;
          request_timestamp?: string;
          billing_summary?: any;
          usage_category?: string;
          efficiency_score?: number;
        };
      };
    };
    Views: {
      user_session_stats: {
        Row: {
          user_id: string;
          total_sessions: number;
          active_sessions: number;
          sessions_last_24h: number;
          sessions_last_7d: number;
          last_activity: string;
          first_session_created: string;
          avg_session_duration_seconds: number;
        };
      };
      conversation_stats: {
        Row: {
          user_id: string;
          session_id: string;
          total_messages: number;
          user_messages: number;
          assistant_messages: number;
          system_messages: number;
          error_messages: number;
          function_calls: number;
          first_message_at: string;
          last_message_at: string;
          avg_message_length: number;
        };
      };
      token_usage_stats: {
        Row: {
          user_id: string;
          total_requests: number;
          total_tokens_used: number;
          total_cost_points: number;
          total_cost_usd: number;
          avg_tokens_per_request: number;
          avg_efficiency_score: number;
          requests_last_24h: number;
          tokens_last_24h: number;
          requests_last_7d: number;
          tokens_last_7d: number;
        };
      };
    };
  };
}

import config from './config';

// Supabase客户端配置
const supabaseUrl = config.database.supabaseUrl;
const supabaseKey = config.database.supabaseKey;

// 创建Supabase客户端
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// 数据库API类
export class DatabaseAPI {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // 用户会话管理
  async getUserSessions() {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', this.userId)
      .order('last_activity_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createUserSession(sessionData: Database['public']['Tables']['user_sessions']['Insert']) {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({ ...sessionData, user_id: this.userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserSession(sessionId: string, updates: Database['public']['Tables']['user_sessions']['Update']) {
    const { data, error } = await supabase
      .from('user_sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteUserSession(sessionId: string) {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  // 聊天消息管理
  async getChatMessages(sessionId: string, limit: number = 100) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', this.userId)
      .eq('session_id', sessionId)
      .order('message_order', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async createChatMessage(messageData: Database['public']['Tables']['chat_messages']['Insert']) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ ...messageData, user_id: this.userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateChatMessage(messageId: string, updates: Database['public']['Tables']['chat_messages']['Update']) {
    const { data, error } = await supabase
      .from('chat_messages')
      .update(updates)
      .eq('id', messageId)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteChatMessage(messageId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  // Notes管理
  async getNotes(sessionId: string, action?: string) {
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', this.userId)
      .eq('session_id', sessionId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async createNote(noteData: Database['public']['Tables']['notes']['Insert']) {
    const { data, error } = await supabase
      .from('notes')
      .insert({ ...noteData, user_id: this.userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateNote(noteId: string, updates: Database['public']['Tables']['notes']['Update']) {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteNote(noteId: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  // 工作流管理
  async getWorkflowInstances(sessionId?: string) {
    let query = supabase
      .from('workflow_instances')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async createWorkflowInstance(workflowData: Database['public']['Tables']['workflow_instances']['Insert']) {
    const { data, error } = await supabase
      .from('workflow_instances')
      .insert({ ...workflowData, user_id: this.userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateWorkflowInstance(workflowId: string, updates: Database['public']['Tables']['workflow_instances']['Update']) {
    const { data, error } = await supabase
      .from('workflow_instances')
      .update(updates)
      .eq('workflow_id', workflowId)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Token使用统计
  async getTokenUsageStats() {
    const { data, error } = await supabase
      .from('token_usage_stats')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) throw error;
    return data;
  }

  async getTokenUsageHistory(limit: number = 100) {
    const { data, error } = await supabase
      .from('token_usage')
      .select('*')
      .eq('user_id', this.userId)
      .order('request_timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // 统计视图
  async getUserSessionStats() {
    const { data, error } = await supabase
      .from('user_session_stats')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) throw error;
    return data;
  }

  async getConversationStats(sessionId: string) {
    const { data, error } = await supabase
      .from('conversation_stats')
      .select('*')
      .eq('user_id', this.userId)
      .eq('session_id', sessionId)
      .single();

    if (error) throw error;
    return data;
  }

  // 实时订阅
  subscribeToChatMessages(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${this.userId},session_id=eq.${sessionId}`
      }, callback)
      .subscribe();
  }

  subscribeToNotes(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel('notes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${this.userId},session_id=eq.${sessionId}`
      }, callback)
      .subscribe();
  }

  subscribeToWorkflowInstances(callback: (payload: any) => void) {
    return supabase
      .channel('workflow_instances')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workflow_instances',
        filter: `user_id=eq.${this.userId}`
      }, callback)
      .subscribe();
  }
}

// 创建数据库API实例的工厂函数
export function createDatabaseAPI(userId: string): DatabaseAPI {
  return new DatabaseAPI(userId);
}

// 导出类型
export type { Database };
