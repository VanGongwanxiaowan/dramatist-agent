/**
 * 高性能的Intersection Observer Hook
 * 用于实现滚动动画和懒加载
 */

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  freezeOnceVisible?: boolean;
  triggerOnce?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: React.RefObject<HTMLElement>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    freezeOnceVisible = false,
    triggerOnce = false
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const ref = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 清理之前的observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        
        setEntry(entry);
        
        if (triggerOnce && isElementIntersecting) {
          setIsIntersecting(true);
          // 触发一次后停止观察
          observerRef.current?.disconnect();
        } else if (!triggerOnce) {
          setIsIntersecting(isElementIntersecting);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, freezeOnceVisible, triggerOnce]);

  // 如果设置了freezeOnceVisible，一旦可见就不再更新状态
  useEffect(() => {
    if (freezeOnceVisible && isIntersecting) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    }
  }, [freezeOnceVisible, isIntersecting]);

  return { ref, isIntersecting, entry };
}

export default useIntersectionObserver;
