# 增强流式聊天功能使用指南

## 概述

基于nova-red-book-scribe-main项目的流式输出实现，我们对juben项目的流式聊天功能进行了增强，添加了心跳检测、连接状态监控、自动重连等高级功能。

## 主要功能特性

### 1. 心跳检测机制
- **自动心跳**: 在流式对话进行时自动发送心跳请求
- **心跳间隔**: 可配置心跳检测间隔（默认5秒）
- **心跳状态监控**: 实时显示心跳状态（活跃/停止/异常）
- **连接保活**: 通过心跳保持与后端的连接活跃

### 2. 连接状态管理
- **连接状态**: 支持连接中、已连接、已断开、重连中四种状态
- **状态可视化**: 通过ConnectionStatus组件实时显示连接状态
- **自动重连**: 连接断开时自动尝试重连
- **重连策略**: 指数退避算法，避免频繁重连

### 3. 增强的流式输出
- **多类型内容处理**: 支持content、message、thought、answer等多种内容类型
- **元数据更新**: 实时更新流式输出的元数据信息
- **错误处理**: 完善的错误处理和恢复机制
- **用户中断**: 支持用户主动中断流式输出

## 核心组件

### 1. useStreamChat Hook

增强的流式聊天Hook，提供完整的流式对话功能：

```typescript
const streamChat = useStreamChat({
  onStart: () => console.log('开始流式对话'),
  onUpdate: (content, metadata) => {
    // 实时更新内容
    setMarkdown(content);
  },
  onComplete: (finalContent, metadata) => {
    // 对话完成处理
    console.log('对话完成', finalContent);
  },
  onError: (error) => {
    // 错误处理
    console.error('对话错误', error);
  },
  onConnectionChange: (status) => {
    // 连接状态变化
    console.log('连接状态:', status);
  },
  onHeartbeat: (status) => {
    // 心跳状态变化
    console.log('心跳状态:', status);
  },
  enableHeartbeat: true,        // 启用心跳检测
  heartbeatInterval: 5000,      // 心跳间隔(毫秒)
  maxReconnectAttempts: 3,      // 最大重连次数
  reconnectDelay: 1000,         // 重连延迟(毫秒)
});
```

### 2. ConnectionStatus 组件

连接状态显示组件，提供实时状态监控：

```typescript
<ConnectionStatus
  connectionStatus={streamChat.connectionStatus}
  heartbeatStatus={streamChat.heartbeatStatus}
  lastHeartbeat={streamChat.lastHeartbeat}
  reconnectAttempts={streamChat.reconnectAttempts}
  maxReconnectAttempts={3}
  onRetry={() => {
    // 手动重试逻辑
  }}
/>
```

### 3. 简化状态组件

如果只需要简单的状态指示：

```typescript
<SimpleConnectionStatus
  connectionStatus={streamChat.connectionStatus}
  heartbeatStatus={streamChat.heartbeatStatus}
/>
```

## API接口

### 心跳检测API

```typescript
// 发送心跳请求
await jubenApi.heartbeat(sessionId, userId);
```

### 增强的流式聊天API

```typescript
// 开始流式对话
await streamChat.startStream(
  {
    message: '用户消息',
    agent_type: 'planner',
    session_id: 'session_123',
    user_id: 'user_456',
    context: {
      conversation_history: [],
    },
  },
  'planner' // 智能体类型
);

// 停止流式对话
streamChat.stopStream();

// 重置状态
streamChat.reset();
```

## 状态说明

### 连接状态 (connectionStatus)
- `connecting`: 正在连接
- `connected`: 已连接
- `disconnected`: 已断开
- `reconnecting`: 正在重连

### 心跳状态 (heartbeatStatus)
- `active`: 心跳正常
- `inactive`: 心跳停止
- `error`: 心跳异常

## 配置选项

### StreamChatOptions 配置

```typescript
interface StreamChatOptions {
  onStart?: () => void;                    // 开始回调
  onUpdate?: (content: string, metadata: any) => void;  // 更新回调
  onComplete?: (finalContent: string, metadata: any) => void;  // 完成回调
  onError?: (error: string) => void;       // 错误回调
  onConnectionChange?: (status: string) => void;  // 连接状态变化回调
  onHeartbeat?: (status: string) => void;  // 心跳状态变化回调
  enableHeartbeat?: boolean;               // 是否启用心跳
  heartbeatInterval?: number;              // 心跳间隔(毫秒)
  maxReconnectAttempts?: number;           // 最大重连次数
  reconnectDelay?: number;                 // 重连延迟(毫秒)
}
```

## 使用示例

### 在Chat页面中使用

```typescript
import { useStreamChat } from '@/hooks/useStreamChat';
import { ConnectionStatus } from '@/components/ConnectionStatus';

const Chat = () => {
  const streamChat = useStreamChat({
    enableHeartbeat: true,
    heartbeatInterval: 5000,
    maxReconnectAttempts: 3,
    onConnectionChange: (status) => {
      console.log('连接状态变化:', status);
    },
  });

  const handleSend = async () => {
    await streamChat.startStream(
      {
        message: input,
        agent_type: selectedAgent,
        session_id: currentSessionId,
        user_id: currentUserId,
      },
      selectedAgent
    );
  };

  return (
    <div>
      {/* 连接状态显示 */}
      <ConnectionStatus
        connectionStatus={streamChat.connectionStatus}
        heartbeatStatus={streamChat.heartbeatStatus}
        lastHeartbeat={streamChat.lastHeartbeat}
        reconnectAttempts={streamChat.reconnectAttempts}
        maxReconnectAttempts={3}
      />
      
      {/* 聊天界面 */}
      <div>
        {streamChat.isStreaming && (
          <div>正在生成回复...</div>
        )}
        <div>{streamChat.content}</div>
      </div>
    </div>
  );
};
```

## 测试工具

### 运行测试

```typescript
import { enhancedStreamTester } from '@/utils/test-enhanced-stream';

// 运行所有测试
await enhancedStreamTester.runAllTests();

// 测试流式对话
await enhancedStreamTester.testStreamChat();
```

### 浏览器控制台测试

在浏览器控制台中运行：

```javascript
// 运行所有测试
testEnhancedStream();

// 测试流式对话
testStreamChat();
```

## 最佳实践

### 1. 错误处理
- 始终监听onError回调
- 提供用户友好的错误提示
- 实现优雅的降级方案

### 2. 连接管理
- 监控连接状态变化
- 在连接断开时暂停用户操作
- 提供手动重连选项

### 3. 性能优化
- 合理设置心跳间隔
- 避免过频繁的重连尝试
- 及时清理定时器和监听器

### 4. 用户体验
- 显示清晰的连接状态
- 提供操作反馈
- 支持用户中断操作

## 故障排除

### 常见问题

1. **心跳检测失败**
   - 检查后端心跳API是否可用
   - 确认网络连接正常
   - 检查session_id和user_id是否正确

2. **连接状态异常**
   - 检查WebSocket连接状态
   - 确认后端服务是否正常运行
   - 查看浏览器控制台错误信息

3. **流式输出中断**
   - 检查网络稳定性
   - 确认后端流式API是否正常
   - 查看AbortController是否正确处理

### 调试技巧

1. **启用详细日志**
   ```typescript
   const streamChat = useStreamChat({
     onConnectionChange: (status) => console.log('连接状态:', status),
     onHeartbeat: (status) => console.log('心跳状态:', status),
     onError: (error) => console.error('错误:', error),
   });
   ```

2. **监控网络请求**
   - 打开浏览器开发者工具
   - 查看Network标签页
   - 监控心跳和流式请求

3. **状态检查**
   ```typescript
   console.log('当前状态:', {
     connectionStatus: streamChat.connectionStatus,
     heartbeatStatus: streamChat.heartbeatStatus,
     isStreaming: streamChat.isStreaming,
     reconnectAttempts: streamChat.reconnectAttempts,
   });
   ```

## 更新日志

### v1.0.0 (当前版本)
- ✅ 添加心跳检测机制
- ✅ 实现连接状态监控
- ✅ 支持自动重连功能
- ✅ 增强流式输出处理
- ✅ 创建ConnectionStatus组件
- ✅ 完善错误处理机制
- ✅ 添加测试工具

## 技术支持

如有问题或建议，请联系开发团队或查看相关文档。
