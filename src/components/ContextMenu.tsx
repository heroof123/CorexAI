import { useState, useEffect, useRef } from 'react';

/**
 * Context Menu Component - Right-click menu
 * 
 * @example
 * <ContextMenu
 *   items={[
 *     { label: 'Open', onClick: () => {}, icon: '📂' },
 *     { label: 'Delete', onClick: () => {}, icon: '🗑️', danger: true },
 *     { type: 'separator' },
 *     { label: 'Properties', onClick: () => {} }
 *   ]}
 * >
 *   <div>Right-click me</div>
 * </ContextMenu>
 */

export interface ContextMenuItem {
  type?: 'item' | 'separator';
  label?: string;
  icon?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
  className?: string;
}

export function ContextMenu({ items, children, className = '' }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX;
    const y = e.clientY;

    setPosition({ x, y });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    
    item.onClick?.();
    handleClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Adjust position if menu goes off-screen
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10;
    }

    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10;
    }

    if (x !== position.x || y !== position.y) {
      setPosition({ x, y });
    }
  }, [isOpen, position]);

  return (
    <div ref={containerRef} onContextMenu={handleContextMenu} className={className}>
      {children}

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-[#252525] border border-neutral-700 rounded shadow-lg py-1 min-w-[180px] animate-fade-in"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
        >
          {items.map((item, index) => {
            if (item.type === 'separator') {
              return (
                <div
                  key={`separator-${index}`}
                  className="h-px bg-neutral-700 my-1"
                />
              );
            }

            return (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`
                  w-full px-3 py-2 text-left text-sm flex items-center gap-2
                  transition-colors
                  ${item.disabled
                    ? 'text-neutral-500 cursor-not-allowed'
                    : item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-neutral-200 hover:bg-neutral-700'
                  }
                `}
              >
                {item.icon && <span className="text-base">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-neutral-500">{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * useContextMenu Hook - For programmatic context menus
 * 
 * @example
 * const { showContextMenu, ContextMenuComponent } = useContextMenu([
 *   { label: 'Copy', onClick: () => {} },
 *   { label: 'Paste', onClick: () => {} }
 * ]);
 * 
 * <div onContextMenu={showContextMenu}>
 *   Right-click me
 *   {ContextMenuComponent}
 * </div>
 */
export function useContextMenu(items: ContextMenuItem[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const showContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  const hideContextMenu = () => {
    setIsOpen(false);
  };

  const ContextMenuComponent = isOpen ? (
    <ContextMenuPortal
      items={items}
      position={position}
      onClose={hideContextMenu}
    />
  ) : null;

  return {
    showContextMenu,
    hideContextMenu,
    ContextMenuComponent,
    isOpen
  };
}

interface ContextMenuPortalProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

function ContextMenuPortal({ items, position, onClose }: ContextMenuPortalProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    item.onClick?.();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-[#252525] border border-neutral-700 rounded shadow-lg py-1 min-w-[180px] animate-fade-in"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      {items.map((item, index) => {
        if (item.type === 'separator') {
          return (
            <div
              key={`separator-${index}`}
              className="h-px bg-neutral-700 my-1"
            />
          );
        }

        return (
          <button
            key={index}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`
              w-full px-3 py-2 text-left text-sm flex items-center gap-2
              transition-colors
              ${item.disabled
                ? 'text-neutral-500 cursor-not-allowed'
                : item.danger
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-neutral-200 hover:bg-neutral-700'
              }
            `}
          >
            {item.icon && <span className="text-base">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-neutral-500">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
