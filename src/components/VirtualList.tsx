import { useState, useEffect, useRef } from 'react';

/**
 * Virtual List Component - Renders only visible items for performance
 * Perfect for large file trees, search results, logs
 * 
 * @example
 * <VirtualList
 *   items={files}
 *   itemHeight={32}
 *   height={600}
 *   renderItem={(file) => <FileItem file={file} />}
 * />
 */

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 3,
  className = ''
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => (
            <div
              key={startIndex + i}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Virtual Grid Component - 2D virtualization for grids
 */
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  width: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  width,
  height,
  renderItem,
  gap = 8,
  className = ''
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const columns = Math.floor(width / (itemWidth + gap));
  const rows = Math.ceil(items.length / columns);
  const totalHeight = rows * (itemHeight + gap);

  const visibleRows = Math.ceil(height / (itemHeight + gap));
  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - 1);
  const endRow = Math.min(rows - 1, startRow + visibleRows + 1);

  const visibleItems: T[] = [];
  for (let row = startRow; row <= endRow; row++) {
    const startIdx = row * columns;
    const endIdx = Math.min(items.length, startIdx + columns);
    visibleItems.push(...items.slice(startIdx, endIdx));
  }

  const offsetY = startRow * (itemHeight + gap);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height, width }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
            gap: `${gap}px`
          }}
        >
          {visibleItems.map((item, i) => (
            <div key={startRow * columns + i}>
              {renderItem(item, startRow * columns + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Auto-sized Virtual List - Automatically calculates item heights
 */
interface AutoVirtualListProps<T> {
  items: T[];
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  estimatedItemHeight?: number;
  className?: string;
}

export function AutoVirtualList<T>({
  items,
  height,
  renderItem,
  estimatedItemHeight = 40,
  className = ''
}: AutoVirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    // Measure rendered items
    itemRefs.current.forEach((element, index) => {
      const height = element.getBoundingClientRect().height;
      if (itemHeights.get(index) !== height) {
        setItemHeights(prev => new Map(prev).set(index, height));
      }
    });
  });

  const getItemHeight = (index: number) => {
    return itemHeights.get(index) || estimatedItemHeight;
  };

  const getTotalHeight = () => {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += getItemHeight(i);
    }
    return total;
  };

  const getItemOffset = (index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  };

  const findStartIndex = () => {
    let offset = 0;
    for (let i = 0; i < items.length; i++) {
      const itemHeight = getItemHeight(i);
      if (offset + itemHeight > scrollTop) {
        return Math.max(0, i - 1);
      }
      offset += itemHeight;
    }
    return 0;
  };

  const startIndex = findStartIndex();
  let endIndex = startIndex;
  let currentOffset = getItemOffset(startIndex);

  while (currentOffset < scrollTop + height && endIndex < items.length) {
    currentOffset += getItemHeight(endIndex);
    endIndex++;
  }

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = getItemOffset(startIndex);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: getTotalHeight(), position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => {
            const index = startIndex + i;
            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) itemRefs.current.set(index, el);
                  else itemRefs.current.delete(index);
                }}
              >
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
