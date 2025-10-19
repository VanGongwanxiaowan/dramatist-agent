# 竖屏短剧策划助手前端

基于React + TypeScript + Vite构建的现代化前端应用，为竖屏短剧策划助手提供完整的用户界面。

## 功能特性

### 🎬 核心功能
- **智能对话**: 与多种AI智能体进行实时对话
- **故事分析**: 故事五元素分析、系列分析、情节点工作流
- **智能体管理**: 管理和监控各种AI智能体的状态
- **流式输出**: 实时流式响应，提供流畅的用户体验

### 🤖 支持的智能体
- 短剧策划智能体
- 短剧创作智能体
- 剧本评估智能体
- 网络搜索助手
- 知识库查询助手
- 文件引用解析助手
- 故事五元素分析
- 已播剧集分析
- 大情节点工作流
- 故事大纲生成
- 大情节点分析

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: shadcn/ui + Tailwind CSS
- **状态管理**: React Query
- **路由**: React Router
- **Markdown渲染**: react-markdown
- **图标**: Lucide React

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── ui/             # UI基础组件
│   └── Header.tsx      # 导航头部
├── hooks/              # 自定义Hooks
│   └── useStreamChat.ts # 流式聊天Hook
├── lib/                # 工具库
│   ├── api.ts          # API客户端
│   └── config.ts       # 配置管理
├── pages/              # 页面组件
│   ├── Chat.tsx        # 智能对话页面
│   ├── StoryAnalysis.tsx # 故事分析页面
│   ├── Agents.tsx      # 智能体管理页面
│   └── ...
└── App.tsx             # 应用入口
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 配置环境变量
创建 `.env.local` 文件：
```env
# API基础URL
VITE_API_BASE_URL=http://localhost:8000

# 应用配置
VITE_APP_NAME=竖屏短剧策划助手
VITE_APP_VERSION=1.0.0

# 功能开关
VITE_ENABLE_STREAMING=true
VITE_ENABLE_ANALYTICS=false
```

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

### 构建生产版本
```bash
npm run build
```

## API集成

### 流式聊天
```typescript
import { useStreamChat } from '@/hooks/useStreamChat';

const streamChat = useStreamChat({
  onStart: () => console.log('开始聊天'),
  onUpdate: (content, metadata) => console.log('更新内容', content),
  onComplete: (finalContent, metadata) => console.log('完成', finalContent),
  onError: (error) => console.error('错误', error),
});

// 开始流式聊天
await streamChat.startStream({
  message: '你好',
  agent_type: 'planner',
  session_id: 'session_123',
});
```

### 故事分析
```typescript
import { useStoryAnalysisStream } from '@/hooks/useStreamChat';

const storyAnalysis = useStoryAnalysisStream({
  onComplete: (content, metadata) => console.log('分析完成', content),
});

// 分析故事
await storyAnalysis.analyzeStory(
  '故事内容...',
  'five_elements',
  { context: 'additional context' }
);
```

## 主要页面

### 智能对话页面 (`/chat`)
- 支持多种智能体选择
- 实时流式对话
- 对话历史管理
- Markdown渲染支持

### 故事分析页面 (`/story-analysis`)
- 故事五元素分析
- 已播剧集分析
- 情节点工作流
- 结果导出功能

### 智能体管理页面 (`/agents`)
- 智能体状态监控
- 功能详情查看
- 性能指标展示
- 测试功能

## 配置说明

### API配置
```typescript
// src/lib/config.ts
export const config = {
  api: {
    baseUrl: 'http://localhost:8000',
    timeout: 30000,
    streamTimeout: 60000,
  },
  // ...
};
```

### 智能体配置
支持配置默认智能体、重试次数、延迟等参数。

## 开发指南

### 添加新的智能体
1. 在 `src/lib/api.ts` 中添加对应的API方法
2. 在 `src/pages/Agents.tsx` 中添加智能体信息
3. 在 `src/pages/Chat.tsx` 中添加智能体选项

### 添加新的页面
1. 在 `src/pages/` 目录下创建新页面组件
2. 在 `src/App.tsx` 中添加路由
3. 在 `src/components/Header.tsx` 中添加导航链接

### 自定义Hook
参考 `src/hooks/useStreamChat.ts` 的实现方式创建自定义Hook。

## 部署

### 构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

### 部署到生产环境
将 `dist/` 目录部署到Web服务器即可。

## 故障排除

### 常见问题

1. **API连接失败**
   - 检查 `VITE_API_BASE_URL` 配置
   - 确认后端服务正在运行
   - 检查网络连接

2. **流式输出不工作**
   - 检查 `VITE_ENABLE_STREAMING` 配置
   - 确认后端支持流式响应
   - 检查浏览器控制台错误

3. **组件样式问题**
   - 确认 Tailwind CSS 配置正确
   - 检查 shadcn/ui 组件安装

### 调试模式
设置 `VITE_DEBUG_MODE=true` 启用调试日志。

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。