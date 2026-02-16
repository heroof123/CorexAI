import React, { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export default function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const { startIndex, visibleItems } = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan, items]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              className="flex items-center"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    renderTime: 0,
    componentCount: 0
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime))
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    // Memory monitoring
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memory: Math.round(memory.usedJSHeapSize / 1024 / 1024)
        }));
      }
    }, 1000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
    };
  }, []);

  const measureRenderTime = (componentName: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    
    console.log(`${componentName} render time: ${end - start}ms`);
    
    setMetrics(prev => ({
      ...prev,
      renderTime: end - start
    }));
  };

  return { metrics, measureRenderTime };
}

// Lazy loading component
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazyComponent({ 
  children, 
  fallback = <div>Loading...</div>,
  rootMargin = '50px',
  threshold = 0.1
}: LazyComponentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  useEffect(() => {
    if (isVisible && !isLoaded) {
      // Simulate loading delay
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isLoaded]);

  return (
    <div ref={ref}>
      {isLoaded ? children : fallback}
    </div>
  );
}

// Debounced input hook
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Memoized search hook
export function useMemoizedSearch<T>(
  items: T[],
  searchTerm: string,
  searchFn: (item: T, term: string) => boolean,
  deps: any[] = []
) {
  return useMemo(() => {
    if (!searchTerm.trim()) return items;
    return items.filter(item => searchFn(item, searchTerm));
  }, [items, searchTerm, ...deps]);
}

// Performance optimized file tree component
interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  isExpanded?: boolean;
}

interface OptimizedFileTreeProps {
  nodes: FileTreeNode[];
  onNodeClick: (node: FileTreeNode) => void;
  onNodeExpand: (path: string) => void;
  selectedPath?: string;
  maxHeight?: number;
}

export function OptimizedFileTree({
  nodes,
  onNodeClick,
  onNodeExpand,
  selectedPath,
  maxHeight = 400
}: OptimizedFileTreeProps) {
  const flattenedNodes = useMemo(() => {
    const flatten = (nodes: FileTreeNode[], depth = 0): Array<FileTreeNode & { depth: number }> => {
      const result: Array<FileTreeNode & { depth: number }> = [];
      
      for (const node of nodes) {
        result.push({ ...node, depth });
        
        if (node.isDirectory && node.isExpanded && node.children) {
          result.push(...flatten(node.children, depth + 1));
        }
      }
      
      return result;
    };
    
    return flatten(nodes);
  }, [nodes]);

  const renderNode = (node: FileTreeNode & { depth: number }) => (
    <div
      key={node.path}
      className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-[var(--color-hover)] ${
        selectedPath === node.path ? 'bg-[var(--color-primary)] text-white' : ''
      }`}
      style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
      onClick={() => onNodeClick(node)}
    >
      {node.isDirectory && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNodeExpand(node.path);
          }}
          className="w-4 h-4 flex items-center justify-center"
        >
          {node.isExpanded ? '📂' : '📁'}
        </button>
      )}
      
      <span className="w-4 h-4 flex items-center justify-center text-xs">
        {node.isDirectory ? (node.isExpanded ? '📂' : '📁') : '📄'}
      </span>
      
      <span className="flex-1 text-xs truncate">{node.name}</span>
    </div>
  );

  return (
    <VirtualizedList
      items={flattenedNodes}
      itemHeight={24}
      containerHeight={maxHeight}
      renderItem={renderNode}
      className="border border-[var(--color-border)] rounded"
    />
  );
}

// Code splitting utility
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  FallbackComponent?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFn);
  
  return function WrappedComponent(props: React.ComponentProps<T>) {
    return (
      <React.Suspense fallback={FallbackComponent ? <FallbackComponent /> : <div>Loading...</div>}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}

// Memory leak prevention hook
export function useCleanup(cleanup: () => void, deps: any[] = []) {
  useEffect(() => {
    return cleanup;
  }, deps);
}

// Optimized event handler
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  return useMemo(() => callback, deps);
}