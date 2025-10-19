/**
 * 数据存储配置和优化
 * 为前端提供数据存储的最佳实践配置
 */

// 存储配置
export const storageConfig = {
  // 缓存配置
  cache: {
    // 内存缓存配置
    memory: {
      maxSize: 100, // 最大缓存条目数
      ttl: 5 * 60 * 1000, // 5分钟过期时间
    },
    // 本地存储配置
    localStorage: {
      prefix: 'juben_',
      maxSize: 10 * 1024 * 1024, // 10MB
      ttl: 24 * 60 * 60 * 1000, // 24小时过期时间
    },
  },

  // 分页配置
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    prefetchPages: 2, // 预取页数
  },

  // 实时更新配置
  realtime: {
    enabled: true,
    reconnectInterval: 5000, // 重连间隔
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000, // 心跳间隔
  },

  // 数据同步配置
  sync: {
    batchSize: 50, // 批量同步大小
    syncInterval: 30000, // 同步间隔
    conflictResolution: 'server', // 冲突解决策略: 'server' | 'client' | 'manual'
  },

  // 性能优化配置
  performance: {
    enableVirtualScrolling: true,
    virtualScrollItemHeight: 60,
    enableLazyLoading: true,
    lazyLoadingThreshold: 100,
    enableDebouncing: true,
    debounceDelay: 300,
  },

  // 数据压缩配置
  compression: {
    enabled: true,
    algorithm: 'gzip',
    threshold: 1024, // 大于1KB的数据才压缩
  },
};

// 数据存储策略
export const storageStrategies = {
  // 用户会话数据
  userSessions: {
    cache: 'memory',
    sync: 'realtime',
    persistence: 'database',
    cleanup: {
      inactive: 7 * 24 * 60 * 60 * 1000, // 7天
      expired: 30 * 24 * 60 * 60 * 1000, // 30天
    },
  },

  // 聊天消息数据
  chatMessages: {
    cache: 'memory',
    sync: 'realtime',
    persistence: 'database',
    pagination: {
      enabled: true,
      pageSize: 50,
      maxPages: 20,
    },
    cleanup: {
      old: 90 * 24 * 60 * 60 * 1000, // 90天
    },
  },

  // Notes数据
  notes: {
    cache: 'localStorage',
    sync: 'realtime',
    persistence: 'database',
    indexing: ['action', 'category', 'tags'],
    cleanup: {
      archived: 180 * 24 * 60 * 60 * 1000, // 180天
    },
  },

  // 工作流数据
  workflows: {
    cache: 'memory',
    sync: 'realtime',
    persistence: 'database',
    monitoring: {
      enabled: true,
      interval: 5000, // 5秒检查一次
    },
  },

  // Token使用统计
  tokenUsage: {
    cache: 'localStorage',
    sync: 'batch',
    persistence: 'database',
    aggregation: {
      enabled: true,
      intervals: ['hourly', 'daily', 'weekly'],
    },
    cleanup: {
      old: 90 * 24 * 60 * 60 * 1000, // 90天
    },
  },
};

// 数据验证规则
export const validationRules = {
  userSessions: {
    session_id: { required: true, type: 'string', maxLength: 255 },
    user_id: { required: true, type: 'string', maxLength: 255 },
    status: { required: false, type: 'string', enum: ['active', 'inactive', 'expired', 'suspended'] },
  },

  chatMessages: {
    content: { required: true, type: 'string', maxLength: 50000 },
    message_type: { required: true, type: 'string', enum: ['user', 'assistant', 'system', 'error', 'function_call'] },
    session_id: { required: true, type: 'string', maxLength: 255 },
  },

  notes: {
    action: { required: true, type: 'string', maxLength: 100 },
    name: { required: true, type: 'string', maxLength: 255 },
    context: { required: true, type: 'string', maxLength: 100000 },
    select_status: { required: false, type: 'number', min: 0, max: 2 },
    priority: { required: false, type: 'number', min: 0, max: 2 },
  },
};

// 数据迁移配置
export const migrationConfig = {
  version: '1.0.0',
  migrations: [
    {
      version: '1.0.0',
      description: '初始版本',
      up: () => {
        // 初始化数据迁移逻辑
        console.log('执行数据迁移 1.0.0');
      },
      down: () => {
        // 回滚逻辑
        console.log('回滚数据迁移 1.0.0');
      },
    },
  ],
};

// 数据备份配置
export const backupConfig = {
  enabled: true,
  schedule: '0 2 * * *', // 每天凌晨2点
  retention: 30, // 保留30天
  compression: true,
  encryption: true,
  storage: {
    type: 'local', // 'local' | 's3' | 'gcs'
    path: './backups',
  },
};

// 数据监控配置
export const monitoringConfig = {
  enabled: true,
  metrics: {
    // 数据访问指标
    access: {
      enabled: true,
      trackReads: true,
      trackWrites: true,
      trackDeletes: true,
    },
    // 性能指标
    performance: {
      enabled: true,
      trackLatency: true,
      trackThroughput: true,
      trackErrors: true,
    },
    // 存储指标
    storage: {
      enabled: true,
      trackSize: true,
      trackGrowth: true,
      trackCleanup: true,
    },
  },
  alerts: {
    enabled: true,
    thresholds: {
      latency: 5000, // 5秒
      errorRate: 0.05, // 5%
      storageUsage: 0.8, // 80%
    },
  },
};

// 数据安全配置
export const securityConfig = {
  // 数据加密
  encryption: {
    enabled: true,
    algorithm: 'AES-256-GCM',
    keyRotation: 90 * 24 * 60 * 60 * 1000, // 90天
  },

  // 访问控制
  accessControl: {
    enabled: true,
    rls: true, // 行级安全
    audit: true, // 审计日志
  },

  // 数据脱敏
  dataMasking: {
    enabled: true,
    rules: {
      user_id: 'hash',
      session_id: 'hash',
      content: 'partial', // 部分脱敏
    },
  },
};

// 导出默认配置
export default {
  storageConfig,
  storageStrategies,
  validationRules,
  migrationConfig,
  backupConfig,
  monitoringConfig,
  securityConfig,
};
