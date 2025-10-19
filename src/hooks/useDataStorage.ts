/**
 * 数据存储优化Hook
 * 提供缓存、同步、性能优化等功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createDatabaseAPI } from '@/lib/database';
import { storageConfig, storageStrategies } from '@/lib/storage-config';

// 内存缓存
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = storageConfig.cache.memory.ttl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// 本地存储管理
class LocalStorageManager {
  private prefix = storageConfig.cache.localStorage.prefix;

  set(key: string, data: any, ttl: number = storageConfig.cache.localStorage.ttl) {
    const item = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(item));
  }

  get(key: string): any | null {
    const itemStr = localStorage.getItem(`${this.prefix}${key}`);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(`${this.prefix}${key}`);
        return null;
      }
      return item.data;
    } catch {
      return null;
    }
  }

  delete(key: string) {
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

// 数据存储Hook
export function useDataStorage<T>(userId: string, dataType: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbAPI, setDbAPI] = useState<any>(null);

  // 缓存实例
  const memoryCache = useRef(new MemoryCache());
  const localStorage = useRef(new LocalStorageManager());

  // 实时订阅
  const [subscription, setSubscription] = useState<any>(null);

  // 初始化数据库连接
  useEffect(() => {
    const initDB = () => {
      const api = createDatabaseAPI(userId);
      setDbAPI(api);
    };
    initDB();
  }, [userId]);

  // 获取缓存键
  const getCacheKey = useCallback((key?: string) => {
    return `${dataType}_${userId}${key ? `_${key}` : ''}`;
  }, [dataType, userId]);

  // 从缓存获取数据
  const getFromCache = useCallback((key?: string): T[] | null => {
    const cacheKey = getCacheKey(key);
    
    // 先尝试内存缓存
    let cached = memoryCache.current.get(cacheKey);
    if (cached) return cached;

    // 再尝试本地存储
    cached = localStorage.current.get(cacheKey);
    if (cached) {
      // 重新放入内存缓存
      memoryCache.current.set(cacheKey, cached);
      return cached;
    }

    return null;
  }, [getCacheKey]);

  // 设置缓存
  const setCache = useCallback((data: T[], key?: string) => {
    const cacheKey = getCacheKey(key);
    const strategy = storageStrategies[dataType as keyof typeof storageStrategies];
    
    if (strategy?.cache === 'memory') {
      memoryCache.current.set(cacheKey, data);
    } else if (strategy?.cache === 'localStorage') {
      localStorage.current.set(cacheKey, data);
    }
  }, [getCacheKey, dataType]);

  // 加载数据
  const loadData = useCallback(async (key?: string, forceRefresh: boolean = false) => {
    if (!dbAPI) return;

    setLoading(true);
    setError(null);

    try {
      // 如果不是强制刷新，先尝试从缓存获取
      if (!forceRefresh) {
        const cached = getFromCache(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }
      }

      // 从数据库加载数据
      let freshData: T[];
      switch (dataType) {
        case 'userSessions':
          freshData = await dbAPI.getUserSessions();
          break;
        case 'chatMessages':
          if (!key) throw new Error('Session ID required for chat messages');
          freshData = await dbAPI.getChatMessages(key);
          break;
        case 'notes':
          freshData = await dbAPI.getNotes(key);
          break;
        case 'workflowInstances':
          freshData = await dbAPI.getWorkflowInstances(key);
          break;
        case 'tokenUsage':
          freshData = await dbAPI.getTokenUsageHistory();
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      setData(freshData);
      setCache(freshData, key);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [dbAPI, dataType, getFromCache, setCache]);

  // 创建数据
  const createData = useCallback(async (newData: any, key?: string) => {
    if (!dbAPI) return null;

    try {
      let created;
      switch (dataType) {
        case 'userSessions':
          created = await dbAPI.createUserSession(newData);
          break;
        case 'chatMessages':
          if (!key) throw new Error('Session ID required for chat messages');
          created = await dbAPI.createChatMessage({ ...newData, session_id: key });
          break;
        case 'notes':
          if (!key) throw new Error('Session ID required for notes');
          created = await dbAPI.createNote({ ...newData, session_id: key });
          break;
        case 'workflowInstances':
          created = await dbAPI.createWorkflowInstance(newData);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      // 更新本地状态
      setData(prev => [created, ...prev]);
      
      // 更新缓存
      const cacheKey = getCacheKey(key);
      memoryCache.current.delete(cacheKey);
      localStorage.current.delete(cacheKey);

      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建数据失败');
      return null;
    }
  }, [dbAPI, dataType, getCacheKey]);

  // 更新数据
  const updateData = useCallback(async (id: string, updates: any, key?: string) => {
    if (!dbAPI) return null;

    try {
      let updated;
      switch (dataType) {
        case 'userSessions':
          updated = await dbAPI.updateUserSession(id, updates);
          break;
        case 'chatMessages':
          updated = await dbAPI.updateChatMessage(id, updates);
          break;
        case 'notes':
          updated = await dbAPI.updateNote(id, updates);
          break;
        case 'workflowInstances':
          updated = await dbAPI.updateWorkflowInstance(id, updates);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      // 更新本地状态
      setData(prev => prev.map(item => 
        (item as any).id === id ? updated : item
      ));

      // 更新缓存
      const cacheKey = getCacheKey(key);
      memoryCache.current.delete(cacheKey);
      localStorage.current.delete(cacheKey);

      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新数据失败');
      return null;
    }
  }, [dbAPI, dataType, getCacheKey]);

  // 删除数据
  const deleteData = useCallback(async (id: string, key?: string) => {
    if (!dbAPI) return false;

    try {
      switch (dataType) {
        case 'userSessions':
          await dbAPI.deleteUserSession(id);
          break;
        case 'chatMessages':
          await dbAPI.deleteChatMessage(id);
          break;
        case 'notes':
          await dbAPI.deleteNote(id);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      // 更新本地状态
      setData(prev => prev.filter(item => (item as any).id !== id));

      // 更新缓存
      const cacheKey = getCacheKey(key);
      memoryCache.current.delete(cacheKey);
      localStorage.current.delete(cacheKey);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除数据失败');
      return false;
    }
  }, [dbAPI, dataType, getCacheKey]);

  // 设置实时订阅
  const setupRealtimeSubscription = useCallback((sessionId?: string) => {
    if (!dbAPI || !storageStrategies[dataType as keyof typeof storageStrategies]?.sync) return;

    const strategy = storageStrategies[dataType as keyof typeof storageStrategies];
    if (strategy.sync !== 'realtime') return;

    let sub;
    switch (dataType) {
      case 'chatMessages':
        if (sessionId) {
          sub = dbAPI.subscribeToChatMessages(sessionId, (payload: any) => {
            console.log('Chat message update:', payload);
            loadData(sessionId, true);
          });
        }
        break;
      case 'notes':
        if (sessionId) {
          sub = dbAPI.subscribeToNotes(sessionId, (payload: any) => {
            console.log('Note update:', payload);
            loadData(sessionId, true);
          });
        }
        break;
      case 'workflowInstances':
        sub = dbAPI.subscribeToWorkflowInstances((payload: any) => {
          console.log('Workflow update:', payload);
          loadData(undefined, true);
        });
        break;
    }

    if (sub) {
      setSubscription(sub);
    }
  }, [dbAPI, dataType, loadData]);

  // 清理订阅
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [subscription]);

  // 清理缓存
  const clearCache = useCallback(() => {
    memoryCache.current.clear();
    localStorage.current.clear();
  }, []);

  // 刷新数据
  const refresh = useCallback((key?: string) => {
    return loadData(key, true);
  }, [loadData]);

  return {
    data,
    loading,
    error,
    loadData,
    createData,
    updateData,
    deleteData,
    refresh,
    clearCache,
    setupRealtimeSubscription,
  };
}

// 专门的Hook用于不同类型的数据
export function useUserSessions(userId: string) {
  return useDataStorage(userId, 'userSessions');
}

export function useChatMessages(userId: string, sessionId?: string) {
  const storage = useDataStorage(userId, 'chatMessages');
  
  useEffect(() => {
    if (sessionId) {
      storage.loadData(sessionId);
      storage.setupRealtimeSubscription(sessionId);
    }
  }, [sessionId, storage]);

  return storage;
}

export function useNotes(userId: string, sessionId?: string) {
  const storage = useDataStorage(userId, 'notes');
  
  useEffect(() => {
    if (sessionId) {
      storage.loadData(sessionId);
      storage.setupRealtimeSubscription(sessionId);
    }
  }, [sessionId, storage]);

  return storage;
}

export function useWorkflowInstances(userId: string, sessionId?: string) {
  const storage = useDataStorage(userId, 'workflowInstances');
  
  useEffect(() => {
    storage.loadData(sessionId);
    storage.setupRealtimeSubscription();
  }, [sessionId, storage]);

  return storage;
}

export function useTokenUsage(userId: string) {
  return useDataStorage(userId, 'tokenUsage');
}
