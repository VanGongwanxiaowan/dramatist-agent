/**
 * 性能监控Hook
 * 监控页面加载性能和用户交互性能
 */

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  loadTime: number; // 页面加载时间
}

interface UsePerformanceMonitorReturn {
  metrics: PerformanceMetrics | null;
  isReady: boolean;
  getCurrentMetrics: () => PerformanceMetrics | null;
}

export function usePerformanceMonitor(): UsePerformanceMonitorReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isReady, setIsReady] = useState(false);
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    // 检查浏览器是否支持Performance API
    if (!('performance' in window)) {
      console.warn('Performance API not supported');
      return;
    }

    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      // 计算基础指标
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;

      // 使用Performance Observer收集更多指标
      if ('PerformanceObserver' in window) {
        try {
          // LCP (Largest Contentful Paint)
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              setMetrics(prev => ({
                ...prev,
                lcp: lastEntry.startTime
              } as PerformanceMetrics));
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // FID (First Input Delay)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              setMetrics(prev => ({
                ...prev,
                fid: entry.processingStart - entry.startTime
              } as PerformanceMetrics));
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // CLS (Cumulative Layout Shift)
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            setMetrics(prev => ({
              ...prev,
              cls: clsValue
            } as PerformanceMetrics));
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // 保存observer引用以便清理
          observerRef.current = lcpObserver;
        } catch (error) {
          console.warn('Performance Observer not fully supported:', error);
        }
      }

      // 设置基础指标
      setMetrics({
        fcp,
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: navigation.responseStart - navigation.fetchStart,
        loadTime
      });

      setIsReady(true);
    };

    // 等待页面完全加载后收集指标
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }

    return () => {
      window.removeEventListener('load', collectMetrics);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const getCurrentMetrics = (): PerformanceMetrics | null => {
    if (!metrics) return null;

    // 实时更新一些指标
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      return {
        ...metrics,
        ttfb: navigation.responseStart - navigation.fetchStart,
        loadTime: navigation.loadEventEnd - navigation.fetchStart
      };
    }

    return metrics;
  };

  return {
    metrics,
    isReady,
    getCurrentMetrics
  };
}

export default usePerformanceMonitor;
