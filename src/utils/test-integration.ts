/**
 * 前后端集成测试工具
 * 验证数据流和API连接
 */

import { createDatabaseAPI } from '@/lib/database';
import { createAnalysisAPI } from '@/lib/analysis-api';
import { jubenApi } from '@/lib/api';

export class IntegrationTester {
  private userId: string;
  private dbAPI: any;
  private analysisAPI: any;

  constructor(userId: string = "test_user_001") {
    this.userId = userId;
    this.dbAPI = createDatabaseAPI(userId);
    this.analysisAPI = createAnalysisAPI(userId);
  }

  // 测试数据库连接
  async testDatabaseConnection(): Promise<boolean> {
    try {
      console.log('测试数据库连接...');
      const sessions = await this.dbAPI.getUserSessions();
      console.log('数据库连接成功，会话数量:', sessions.length);
      return true;
    } catch (error) {
      console.error('数据库连接失败:', error);
      return false;
    }
  }

  // 测试用户会话创建
  async testUserSessionCreation(): Promise<string | null> {
    try {
      console.log('测试用户会话创建...');
      const sessionData = {
        session_id: `test_session_${Date.now()}`,
        metadata: {
          title: '集成测试会话',
          description: '用于测试前后端集成的会话',
        },
        preferences: {},
        usage_stats: {},
      };

      const session = await this.dbAPI.createUserSession(sessionData);
      console.log('会话创建成功:', session.session_id);
      return session.session_id;
    } catch (error) {
      console.error('会话创建失败:', error);
      return null;
    }
  }

  // 测试笔记创建
  async testNoteCreation(sessionId: string): Promise<string | null> {
    try {
      console.log('测试笔记创建...');
      const noteData = {
        action: 'integration_test',
        name: `test_note_${Date.now()}`,
        title: '集成测试笔记',
        context: '这是一个用于测试前后端集成的笔记内容',
        select_status: 0,
        priority: 1,
        tags: ['test', 'integration'],
        category: 'test',
        session_id: sessionId,
      };

      const note = await this.dbAPI.createNote(noteData);
      console.log('笔记创建成功:', note.id);
      return note.id;
    } catch (error) {
      console.error('笔记创建失败:', error);
      return null;
    }
  }

  // 测试分析结果保存
  async testAnalysisResultSave(sessionId: string): Promise<string | null> {
    try {
      console.log('测试分析结果保存...');
      const analysisResult = await this.analysisAPI.saveAnalysisResult({
        session_id: sessionId,
        analysis_type: 'five_elements',
        input_content: '测试故事内容：一个关于友谊的故事',
        context: { test: true },
      }, '这是分析结果内容', { test_metadata: true });

      console.log('分析结果保存成功:', analysisResult.id);
      return analysisResult.id;
    } catch (error) {
      console.error('分析结果保存失败:', error);
      return null;
    }
  }

  // 测试API连接
  async testApiConnection(): Promise<boolean> {
    try {
      console.log('测试API连接...');
      const health = await jubenApi.getHealth();
      console.log('API连接成功:', health.status);
      return true;
    } catch (error) {
      console.error('API连接失败:', error);
      return false;
    }
  }

  // 运行完整集成测试
  async runFullIntegrationTest(): Promise<{
    success: boolean;
    results: {
      database: boolean;
      api: boolean;
      session: boolean;
      note: boolean;
      analysis: boolean;
    };
    sessionId?: string;
  }> {
    console.log('开始完整集成测试...');
    
    const results = {
      database: false,
      api: false,
      session: false,
      note: false,
      analysis: false,
    };

    let sessionId: string | null = null;

    // 测试数据库连接
    results.database = await this.testDatabaseConnection();

    // 测试API连接
    results.api = await this.testApiConnection();

    if (results.database) {
      // 测试会话创建
      sessionId = await this.testUserSessionCreation();
      results.session = sessionId !== null;

      if (sessionId) {
        // 测试笔记创建
        const noteId = await this.testNoteCreation(sessionId);
        results.note = noteId !== null;

        // 测试分析结果保存
        const analysisId = await this.testAnalysisResultSave(sessionId);
        results.analysis = analysisId !== null;
      }
    }

    const success = Object.values(results).every(result => result);

    console.log('集成测试完成:', {
      success,
      results,
      sessionId,
    });

    return {
      success,
      results,
      sessionId,
    };
  }

  // 清理测试数据
  async cleanupTestData(sessionId?: string): Promise<void> {
    if (!sessionId) return;

    try {
      console.log('清理测试数据...');
      await this.dbAPI.deleteUserSession(sessionId);
      console.log('测试数据清理完成');
    } catch (error) {
      console.error('清理测试数据失败:', error);
    }
  }
}

// 导出测试函数
export async function runIntegrationTest(): Promise<void> {
  const tester = new IntegrationTester();
  const result = await tester.runFullIntegrationTest();
  
  if (result.success) {
    console.log('✅ 所有集成测试通过！');
  } else {
    console.log('❌ 部分集成测试失败:', result.results);
  }

  // 清理测试数据
  if (result.sessionId) {
    await tester.cleanupTestData(result.sessionId);
  }
}

// 导出测试器类
export { IntegrationTester };
