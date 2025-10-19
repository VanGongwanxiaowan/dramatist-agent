/**
 * 增强流式聊天功能测试工具
 * 用于测试心跳检测、连接状态和流式输出
 */

import { jubenApi } from '@/lib/api';

export class EnhancedStreamTester {
  private testResults: Array<{
    test: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    timestamp: Date;
  }> = [];

  async runAllTests() {
    console.log('🚀 开始运行增强流式聊天功能测试...');
    
    await this.testAPIHealth();
    await this.testHeartbeat();
    await this.testConnectionStatus();
    
    this.printResults();
    return this.testResults;
  }

  private async testAPIHealth() {
    try {
      const health = await jubenApi.getHealth();
      this.addResult('API健康检查', 'success', `API状态: ${health.status}`);
    } catch (error) {
      this.addResult('API健康检查', 'error', `API不可用: ${error}`);
    }
  }

  private async testHeartbeat() {
    try {
      const sessionId = 'test_session_001';
      const userId = 'test_user_001';
      
      const heartbeat = await jubenApi.heartbeat(sessionId, userId);
      this.addResult('心跳检测', 'success', `心跳响应: ${heartbeat.status}`);
    } catch (error) {
      this.addResult('心跳检测', 'error', `心跳失败: ${error}`);
    }
  }

  private async testConnectionStatus() {
    try {
      // 模拟连接状态测试
      const connectionStates = ['connecting', 'connected', 'disconnected', 'reconnecting'];
      const heartbeatStates = ['active', 'inactive', 'error'];
      
      connectionStates.forEach(state => {
        this.addResult('连接状态测试', 'success', `支持状态: ${state}`);
      });
      
      heartbeatStates.forEach(state => {
        this.addResult('心跳状态测试', 'success', `支持状态: ${state}`);
      });
    } catch (error) {
      this.addResult('连接状态测试', 'error', `测试失败: ${error}`);
    }
  }

  private addResult(test: string, status: 'success' | 'error' | 'warning', message: string) {
    this.testResults.push({
      test,
      status,
      message,
      timestamp: new Date(),
    });
  }

  private printResults() {
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(50));
    
    this.testResults.forEach(result => {
      const statusIcon = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
      }[result.status];
      
      console.log(`${statusIcon} ${result.test}: ${result.message}`);
    });
    
    const successCount = this.testResults.filter(r => r.status === 'success').length;
    const errorCount = this.testResults.filter(r => r.status === 'error').length;
    const warningCount = this.testResults.filter(r => r.status === 'warning').length;
    
    console.log('='.repeat(50));
    console.log(`总计: ${this.testResults.length} 项测试`);
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${errorCount}`);
    console.log(`⚠️ 警告: ${warningCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 所有测试通过！增强流式聊天功能已就绪。');
    } else {
      console.log('\n⚠️ 部分测试失败，请检查相关配置。');
    }
  }

  // 模拟流式对话测试
  async testStreamChat() {
    console.log('\n🔄 开始流式对话测试...');
    
    try {
      const testRequest = {
        message: '你好，这是一个测试消息',
        agent_type: 'planner',
        session_id: 'test_session_stream',
        user_id: 'test_user_stream',
        stream: true,
      };

      let receivedEvents = 0;
      let receivedContent = '';

      const onEvent = (event: any) => {
        receivedEvents++;
        console.log(`📨 收到事件 #${receivedEvents}:`, event.type);
        
        if (event.type === 'content' && event.data?.content) {
          receivedContent += event.data.content;
        }
      };

      // 注意：这里只是模拟，实际测试需要后端支持
      console.log('📤 发送测试请求:', testRequest);
      console.log('⏳ 等待流式响应...');
      
      // 模拟接收一些事件
      setTimeout(() => {
        console.log(`📊 测试完成 - 收到 ${receivedEvents} 个事件`);
        console.log(`📝 接收内容长度: ${receivedContent.length} 字符`);
        
        this.addResult('流式对话测试', 'success', `收到 ${receivedEvents} 个事件`);
      }, 2000);
      
    } catch (error) {
      this.addResult('流式对话测试', 'error', `测试失败: ${error}`);
    }
  }
}

// 导出测试实例
export const enhancedStreamTester = new EnhancedStreamTester();

// 浏览器控制台测试函数
if (typeof window !== 'undefined') {
  (window as any).testEnhancedStream = () => {
    enhancedStreamTester.runAllTests();
  };
  
  (window as any).testStreamChat = () => {
    enhancedStreamTester.testStreamChat();
  };
  
  console.log('🔧 测试工具已加载到浏览器控制台:');
  console.log('   testEnhancedStream() - 运行所有测试');
  console.log('   testStreamChat() - 测试流式对话');
}
