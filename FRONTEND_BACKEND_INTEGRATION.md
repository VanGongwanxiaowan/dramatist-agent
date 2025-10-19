# 前后端集成指南

本文档说明如何运行和测试前端与后端的数据集成功能。

## 概述

我们已经完成了以下前后端集成工作：

### ✅ 已完成的功能

1. **Notes页面** - 从数据库获取真实笔记数据
   - 支持创建、编辑、删除笔记
   - 按会话和动作类型过滤
   - 实时数据同步

2. **Projects页面** - 从数据库获取真实项目数据
   - 将会话作为项目管理
   - 支持项目创建、编辑、删除
   - 项目状态和类型管理

3. **Chat页面** - 已集成数据库
   - 聊天消息持久化存储
   - 会话管理
   - 实时消息同步

4. **StoryAnalysis页面** - 新增数据持久化
   - 分析结果自动保存到数据库
   - 历史记录查看和管理
   - 分析结果导出功能

## 数据库架构

### 主要数据表

1. **user_sessions** - 用户会话表
   - 存储项目/会话信息
   - 支持会话类型和状态管理

2. **chat_messages** - 聊天消息表
   - 存储对话历史
   - 支持消息类型和元数据

3. **notes** - 笔记表
   - 存储创作笔记和分析结果
   - 支持标签、优先级、分类

4. **token_usage** - Token使用统计
   - 记录API调用统计
   - 成本分析

## 环境配置

### 1. 后端配置

确保后端服务正在运行：

```bash
cd /Users/gongfan/Desktop/HuaCeAI/juben
# 启动后端服务
python start_enhanced.py
```

### 2. 前端配置

创建环境配置文件：

```bash
cd /Users/gongfan/Desktop/HuaCeAI/juben/dramatist-agent
```

创建 `.env.local` 文件：

```env
# API配置
VITE_API_BASE_URL=http://localhost:8000
VITE_REQUEST_TIMEOUT=30000
VITE_STREAM_TIMEOUT=60000

# 数据库配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENABLE_REALTIME=true

# 应用配置
VITE_APP_NAME=竖屏短剧策划助手
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=true
VITE_DEBUG_MODE=true

# 功能开关
VITE_ENABLE_STREAMING=true
VITE_ENABLE_ANALYTICS=false
```

### 3. 启动前端

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 测试集成

### 1. 运行集成测试

在浏览器开发者控制台中运行：

```javascript
// 导入测试工具
import { runIntegrationTest } from './src/utils/test-integration.ts';

// 运行测试
runIntegrationTest();
```

### 2. 手动测试步骤

1. **测试Notes功能**
   - 访问 `/notes` 页面
   - 选择会话
   - 创建新笔记
   - 验证数据保存和加载

2. **测试Projects功能**
   - 访问 `/projects` 页面
   - 创建新项目
   - 编辑项目信息
   - 验证数据持久化

3. **测试StoryAnalysis功能**
   - 访问 `/story-analysis` 页面
   - 选择会话和分析类型
   - 输入故事内容进行分析
   - 查看历史记录

4. **测试Chat功能**
   - 访问 `/chat` 页面
   - 创建新对话
   - 发送消息
   - 验证消息保存

## 数据流说明

### 1. 数据获取流程

```
前端组件 → useDataStorage Hook → DatabaseAPI → Supabase → 数据库
```

### 2. 数据更新流程

```
用户操作 → 前端组件 → DatabaseAPI → Supabase → 数据库 → 实时同步 → 前端更新
```

### 3. 缓存策略

- **内存缓存**: 5分钟TTL，快速访问
- **本地存储**: 24小时TTL，离线支持
- **实时同步**: WebSocket连接，即时更新

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查Supabase配置
   - 验证网络连接
   - 确认数据库服务状态

2. **API连接失败**
   - 检查后端服务状态
   - 验证API地址配置
   - 检查CORS设置

3. **数据同步问题**
   - 检查实时连接状态
   - 验证用户权限
   - 查看控制台错误

### 调试工具

1. **浏览器开发者工具**
   - Network标签查看API请求
   - Console查看错误信息
   - Application标签查看本地存储

2. **集成测试工具**
   ```javascript
   // 在控制台运行
   const tester = new IntegrationTester();
   tester.runFullIntegrationTest();
   ```

## 性能优化

### 1. 数据加载优化

- 分页加载大量数据
- 虚拟滚动长列表
- 懒加载非关键数据

### 2. 缓存优化

- 智能缓存策略
- 数据预取
- 缓存失效管理

### 3. 实时同步优化

- 连接池管理
- 断线重连
- 消息队列

## 安全考虑

### 1. 数据安全

- 行级安全策略(RLS)
- 数据加密传输
- 访问权限控制

### 2. API安全

- 请求频率限制
- 输入验证
- 错误信息脱敏

## 部署说明

### 1. 生产环境配置

```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
```

### 2. 构建部署

```bash
# 构建生产版本
npm run build

# 部署到服务器
npm run preview
```

## 更新日志

### v1.0.0 (当前版本)

- ✅ 完成Notes页面数据库集成
- ✅ 完成Projects页面数据库集成
- ✅ 完成StoryAnalysis页面数据持久化
- ✅ 优化Chat页面数据管理
- ✅ 添加集成测试工具
- ✅ 实现实时数据同步

## 贡献指南

1. 遵循现有代码风格
2. 添加适当的类型定义
3. 编写测试用例
4. 更新文档

## 支持

如有问题，请查看：
1. 控制台错误信息
2. 网络请求状态
3. 数据库连接状态
4. 集成测试结果
