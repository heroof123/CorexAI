/**
 * Performance utilities for optimization
 */

/**
 * Debounce function - delays execution until after wait time
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution frequency
 * @param func - Function to throttle
 * @param limit - Minimum time between executions in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoize function results - caches based on arguments
 * @param func - Function to memoize
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Request animation frame throttle - for smooth animations
 * @param func - Function to throttle
 * @returns RAF-throttled function
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * Batch updates - collects multiple calls and executes once
 * @param func - Function to batch
 * @param wait - Wait time in milliseconds
 * @returns Batched function
 */
export function batch<T>(
  func: (items: T[]) => void,
  wait: number = 100
): (item: T) => void {
  let items: T[] = [];
  let timeout: NodeJS.Timeout | null = null;

  return function batchedFunction(item: T) {
    items.push(item);

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(items);
      items = [];
      timeout = null;
    }, wait);
  };
}

/**
 * Measure performance of a function
 * @param name - Name for the measurement
 * @param func - Function to measure
 * @returns Function result
 */
export async function measurePerformance<T>(
  name: string,
  func: () => T | Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await func();
    const end = performance.now();
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`❌ ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Lazy load module - dynamic import with loading state
 * @param importFunc - Dynamic import function
 * @returns Promise with module
 */
export async function lazyLoad<T>(
  importFunc: () => Promise<T>
): Promise<T> {
  return measurePerformance('Lazy load', importFunc);
}

/**
 * Chunk array for batch processing
 * @param array - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Process array in batches with delay
 * @param array - Array to process
 * @param batchSize - Items per batch
 * @param processor - Function to process each item
 * @param delay - Delay between batches in milliseconds
 */
export async function processBatches<T>(
  array: T[],
  batchSize: number,
  processor: (item: T) => Promise<void> | void,
  delay: number = 0
): Promise<void> {
  const chunks = chunkArray(array, batchSize);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    await Promise.all(chunk.map(processor));
    
    if (delay > 0 && i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Create a simple LRU cache
 * @param maxSize - Maximum cache size
 * @returns Cache object
 */
export function createLRUCache<K, V>(maxSize: number = 100) {
  const cache = new Map<K, V>();

  return {
    get(key: K): V | undefined {
      if (!cache.has(key)) return undefined;
      
      // Move to end (most recently used)
      const value = cache.get(key)!;
      cache.delete(key);
      cache.set(key, value);
      return value;
    },

    set(key: K, value: V): void {
      // Remove if exists (to update position)
      if (cache.has(key)) {
        cache.delete(key);
      }
      
      // Remove oldest if at capacity
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
          cache.delete(firstKey);
        }
      }
      
      cache.set(key, value);
    },

    has(key: K): boolean {
      return cache.has(key);
    },

    clear(): void {
      cache.clear();
    },

    get size(): number {
      return cache.size;
    }
  };
}
