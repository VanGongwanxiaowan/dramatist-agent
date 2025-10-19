/**
 * 故事分析API集成
 * 提供分析结果的持久化存储和管理
 */

import { createDatabaseAPI } from './database';
import config from './config';

// 分析结果类型定义
export interface AnalysisResult {
  id: string;
  user_id: string;
  session_id: string;
  analysis_type: string;
  input_content: string;
  result_content: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface AnalysisRequest {
  session_id: string;
  analysis_type: 'five_elements' | 'series_analysis' | 'plot_points';
  input_content: string;
  context?: any;
}

// 分析API类
export class AnalysisAPI {
  private userId: string;
  private dbAPI: any;

  constructor(userId: string) {
    this.userId = userId;
    this.dbAPI = createDatabaseAPI(userId);
  }

  // 保存分析结果到Notes表
  async saveAnalysisResult(request: AnalysisRequest, resultContent: string, metadata: any = {}): Promise<AnalysisResult> {
    try {
      const noteData = {
        action: `analysis_${request.analysis_type}`,
        name: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `故事分析 - ${this.getAnalysisTypeLabel(request.analysis_type)}`,
        context: resultContent,
        select_status: 0,
        priority: 0,
        tags: [request.analysis_type, 'story_analysis'],
        category: 'analysis',
        metadata: {
          analysis_type: request.analysis_type,
          input_content: request.input_content,
          result_content: resultContent,
          session_id: request.session_id,
          context: request.context,
          ...metadata,
        },
        session_id: request.session_id,
      };

      const savedNote = await this.dbAPI.createNote(noteData);
      
      return {
        id: savedNote.id,
        user_id: this.userId,
        session_id: request.session_id,
        analysis_type: request.analysis_type,
        input_content: request.input_content,
        result_content: resultContent,
        metadata: savedNote.metadata,
        created_at: savedNote.created_at,
        updated_at: savedNote.updated_at,
      };
    } catch (error) {
      console.error('保存分析结果失败:', error);
      throw error;
    }
  }

  // 获取分析历史
  async getAnalysisHistory(sessionId: string, analysisType?: string): Promise<AnalysisResult[]> {
    try {
      let notes;
      
      if (analysisType) {
        notes = await this.dbAPI.getNotes(sessionId, `analysis_${analysisType}`);
      } else {
        notes = await this.dbAPI.getNotes(sessionId);
      }

      // 过滤出分析类型的notes
      const analysisNotes = notes.filter(note => 
        note.action.startsWith('analysis_') && 
        note.category === 'analysis'
      );

      return analysisNotes.map(note => ({
        id: note.id,
        user_id: this.userId,
        session_id: sessionId,
        analysis_type: note.metadata?.analysis_type || 'unknown',
        input_content: note.metadata?.input_content || '',
        result_content: note.context,
        metadata: note.metadata,
        created_at: note.created_at,
        updated_at: note.updated_at,
      }));
    } catch (error) {
      console.error('获取分析历史失败:', error);
      throw error;
    }
  }

  // 删除分析结果
  async deleteAnalysisResult(analysisId: string): Promise<void> {
    try {
      await this.dbAPI.deleteNote(analysisId);
    } catch (error) {
      console.error('删除分析结果失败:', error);
      throw error;
    }
  }

  // 更新分析结果
  async updateAnalysisResult(analysisId: string, updates: Partial<AnalysisResult>): Promise<AnalysisResult> {
    try {
      const updateData: any = {};
      
      if (updates.result_content) {
        updateData.context = updates.result_content;
      }
      
      if (updates.metadata) {
        updateData.metadata = {
          ...updateData.metadata,
          ...updates.metadata,
        };
      }

      const updatedNote = await this.dbAPI.updateNote(analysisId, updateData);
      
      return {
        id: updatedNote.id,
        user_id: this.userId,
        session_id: updatedNote.session_id,
        analysis_type: updatedNote.metadata?.analysis_type || 'unknown',
        input_content: updatedNote.metadata?.input_content || '',
        result_content: updatedNote.context,
        metadata: updatedNote.metadata,
        created_at: updatedNote.created_at,
        updated_at: updatedNote.updated_at,
      };
    } catch (error) {
      console.error('更新分析结果失败:', error);
      throw error;
    }
  }

  // 获取分析统计
  async getAnalysisStats(sessionId: string): Promise<any> {
    try {
      const notes = await this.dbAPI.getNotes(sessionId);
      const analysisNotes = notes.filter(note => 
        note.action.startsWith('analysis_') && 
        note.category === 'analysis'
      );

      const stats = {
        total_analyses: analysisNotes.length,
        by_type: {} as Record<string, number>,
        recent_analyses: analysisNotes
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5),
      };

      // 按类型统计
      analysisNotes.forEach(note => {
        const analysisType = note.metadata?.analysis_type || 'unknown';
        stats.by_type[analysisType] = (stats.by_type[analysisType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('获取分析统计失败:', error);
      throw error;
    }
  }

  // 导出分析结果
  async exportAnalysisResults(sessionId: string, analysisType?: string): Promise<string> {
    try {
      const analyses = await this.getAnalysisHistory(sessionId, analysisType);
      
      const exportData = {
        export_info: {
          timestamp: new Date().toISOString(),
          user_id: this.userId,
          session_id: sessionId,
          analysis_type: analysisType || 'all',
          total_count: analyses.length,
        },
        analyses: analyses.map(analysis => ({
          id: analysis.id,
          analysis_type: analysis.analysis_type,
          input_content: analysis.input_content,
          result_content: analysis.result_content,
          metadata: analysis.metadata,
          created_at: analysis.created_at,
        })),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出分析结果失败:', error);
      throw error;
    }
  }

  // 获取分析类型标签
  private getAnalysisTypeLabel(analysisType: string): string {
    const labels: Record<string, string> = {
      'five_elements': '故事五元素分析',
      'series_analysis': '已播剧集分析',
      'plot_points': '情节点分析',
    };
    
    return labels[analysisType] || analysisType;
  }
}

// 创建分析API实例的工厂函数
export function createAnalysisAPI(userId: string): AnalysisAPI {
  return new AnalysisAPI(userId);
}

// 导出类型和类
export type { AnalysisResult, AnalysisRequest };
