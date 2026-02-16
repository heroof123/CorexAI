import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LayoutState {
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  showBottomPanel: boolean;
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  bottomPanelHeight: number;
}

interface LayoutContextType extends LayoutState {
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleBottomPanel: () => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
  resetLayout: () => void;
  saveLayout: () => void;
  loadLayout: () => void;
}

const defaultLayout: LayoutState = {
  showLeftSidebar: true,
  showRightSidebar: true,
  showBottomPanel: true,
  leftSidebarWidth: 320,
  rightSidebarWidth: 256,
  bottomPanelHeight: 256
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<LayoutState>(defaultLayout);

  useEffect(() => {
    loadLayout();
  }, []);

  const toggleLeftSidebar = () => {
    setLayout(prev => ({ ...prev, showLeftSidebar: !prev.showLeftSidebar }));
  };

  const toggleRightSidebar = () => {
    setLayout(prev => ({ ...prev, showRightSidebar: !prev.showRightSidebar }));
  };

  const toggleBottomPanel = () => {
    setLayout(prev => ({ ...prev, showBottomPanel: !prev.showBottomPanel }));
  };

  const setLeftSidebarWidth = (width: number) => {
    setLayout(prev => ({ ...prev, leftSidebarWidth: Math.max(200, Math.min(600, width)) }));
  };

  const setRightSidebarWidth = (width: number) => {
    setLayout(prev => ({ ...prev, rightSidebarWidth: Math.max(200, Math.min(600, width)) }));
  };

  const setBottomPanelHeight = (height: number) => {
    setLayout(prev => ({ ...prev, bottomPanelHeight: Math.max(100, Math.min(500, height)) }));
  };

  const resetLayout = () => {
    setLayout(defaultLayout);
    localStorage.removeItem('corex-layout');
  };

  const saveLayout = () => {
    localStorage.setItem('corex-layout', JSON.stringify(layout));
  };

  const loadLayout = () => {
    try {
      const saved = localStorage.getItem('corex-layout');
      if (saved) {
        const parsedLayout = JSON.parse(saved);
        setLayout({ ...defaultLayout, ...parsedLayout });
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
  };

  // Auto-save layout changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveLayout();
    }, 500);
    return () => clearTimeout(timer);
  }, [layout]);

  return (
    <LayoutContext.Provider
      value={{
        ...layout,
        toggleLeftSidebar,
        toggleRightSidebar,
        toggleBottomPanel,
        setLeftSidebarWidth,
        setRightSidebarWidth,
        setBottomPanelHeight,
        resetLayout,
        saveLayout,
        loadLayout
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}