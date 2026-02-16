import { useState, useRef, DragEvent } from 'react';

/**
 * Drag and Drop Hook
 * Easy drag & drop for files, folders, and elements
 * 
 * @example
 * const { isDragging, dragHandlers } = useDragAndDrop({
 *   onDrop: (files) => console.log('Dropped:', files)
 * });
 * 
 * <div {...dragHandlers} className={isDragging ? 'dragging' : ''}>
 *   Drop files here
 * </div>
 */

interface UseDragAndDropOptions {
  onDrop?: (files: File[]) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  accept?: string[]; // ['image/*', '.pdf', '.txt']
  multiple?: boolean;
  maxSize?: number; // bytes
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}) {
  const {
    onDrop,
    onDragEnter,
    onDragLeave,
    accept = [],
    multiple = true,
    maxSize
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
      onDragEnter?.();
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
      onDragLeave?.();
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      
      // Filter by accept types
      let filteredFiles = files;
      if (accept.length > 0) {
        filteredFiles = files.filter(file => {
          return accept.some(type => {
            if (type.endsWith('/*')) {
              const category = type.split('/')[0];
              return file.type.startsWith(category + '/');
            }
            if (type.startsWith('.')) {
              return file.name.endsWith(type);
            }
            return file.type === type;
          });
        });
      }
      
      // Filter by size
      if (maxSize) {
        filteredFiles = filteredFiles.filter(file => file.size <= maxSize);
      }
      
      // Filter by multiple
      if (!multiple && filteredFiles.length > 0) {
        filteredFiles = [filteredFiles[0]];
      }
      
      if (filteredFiles.length > 0) {
        onDrop?.(filteredFiles);
      }
    }
  };

  return {
    isDragging,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop
    }
  };
}

/**
 * Draggable Component
 * Makes any element draggable
 */
interface DraggableProps {
  children: React.ReactNode;
  data: any;
  onDragStart?: (data: any) => void;
  onDragEnd?: () => void;
  className?: string;
}

export function Draggable({ children, data, onDragStart, onDragEnd, className = '' }: DraggableProps) {
  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    onDragStart?.(data);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`cursor-move ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Droppable Component
 * Makes any element a drop target
 */
interface DroppableProps {
  children: React.ReactNode;
  onDrop: (data: any) => void;
  accept?: string[];
  className?: string;
  activeClassName?: string;
}

export function Droppable({ 
  children, 
  onDrop, 
  accept = [], 
  className = '',
  activeClassName = 'bg-blue-500/10 border-blue-500'
}: DroppableProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        
        // Check if data type is accepted
        if (accept.length === 0 || accept.includes(data.type)) {
          onDrop(data);
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${className} ${isOver ? activeClassName : ''}`}
    >
      {children}
    </div>
  );
}

/**
 * File Drop Zone Component
 * Dedicated component for file uploads
 */
interface FileDropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
}

export function FileDropZone({
  onDrop,
  accept = [],
  multiple = true,
  maxSize,
  className = '',
  children
}: FileDropZoneProps) {
  const { isDragging, dragHandlers } = useDragAndDrop({
    onDrop,
    accept,
    multiple,
    maxSize
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onDrop(files);
    }
  };

  return (
    <>
      <div
        {...dragHandlers}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/50'
          }
          ${className}
        `}
      >
        {children || (
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl">📁</div>
            <div className="text-neutral-300 font-medium">
              {isDragging ? 'Dosyaları bırakın' : 'Dosya yüklemek için tıklayın veya sürükleyin'}
            </div>
            <div className="text-sm text-neutral-500">
              {accept.length > 0 && `Desteklenen: ${accept.join(', ')}`}
              {maxSize && ` • Maks: ${(maxSize / 1024 / 1024).toFixed(0)} MB`}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}

/**
 * Sortable List Component
 * Drag to reorder items
 */
interface SortableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

export function SortableList<T>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
  className = ''
}: SortableListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && overIndex !== null && draggedIndex !== overIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(overIndex, 0, removed);
      onReorder(newItems);
    }
    setDraggedIndex(null);
    setOverIndex(null);
  };

  const handleDrop = (index: number) => {
    setOverIndex(index);
  };

  return (
    <div className={className}>
      {items.map((item, index) => (
        <Draggable
          key={keyExtractor(item)}
          data={{ type: 'sortable-item', index }}
          onDragStart={() => handleDragStart(index)}
          onDragEnd={handleDragEnd}
        >
          <Droppable
            onDrop={() => handleDrop(index)}
            accept={['sortable-item']}
            className={`
              transition-all duration-200
              ${draggedIndex === index ? 'opacity-50' : ''}
              ${overIndex === index ? 'border-t-2 border-blue-500' : ''}
            `}
          >
            {renderItem(item, index)}
          </Droppable>
        </Draggable>
      ))}
    </div>
  );
}
