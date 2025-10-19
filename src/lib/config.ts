/**
 * 应用配置管理
 */

// 环境变量配置
export const config = {
  // API配置
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '30000'),
    streamTimeout: parseInt(import.meta.env.VITE_STREAM_TIMEOUT || '60000'),
  },

  // 数据库配置
  database: {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
    enableRealtime: import.meta.env.VITE_ENABLE_REALTIME !== 'false',
  },

  // 应用配置
  app: {
    name: import.meta.env.VITE_APP_NAME || '竖屏短剧策划助手',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    devMode: import.meta.env.VITE_DEV_MODE === 'true',
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  },

  // 功能开关
  features: {
    streaming: import.meta.env.VITE_ENABLE_STREAMING !== 'false',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },

  // 智能体配置
  agents: {
    defaultAgent: 'planner',
    maxRetries: 3,
    retryDelay: 1000,
  },

  // 聊天配置
  chat: {
    maxMessages: 100,
    maxMessageLength: 10000,
    typingDelay: 50,
  },

  // 故事分析配置
  analysis: {
    maxContentLength: 50000,
    supportedTypes: ['five_elements', 'series_analysis', 'plot_points'],
  },
};

// 开发环境日志
if (config.app.devMode) {
  console.log('应用配置:', config);
}

export default config;
