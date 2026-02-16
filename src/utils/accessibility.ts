/**
 * Accessibility Utilities
 * ARIA labels, keyboard navigation, screen reader support
 */

/**
 * Generate unique ID for ARIA attributes
 */
let idCounter = 0;
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * ARIA Live Region Announcer
 * Announces messages to screen readers
 */
class AriaAnnouncer {
  private container: HTMLDivElement | null = null;

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.setAttribute('role', 'status');
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      this.container.className = 'sr-only';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const container = this.ensureContainer();
    container.setAttribute('aria-live', priority);
    container.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      container.textContent = '';
    }, 1000);
  }

  cleanup() {
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
    }
  }
}

export const ariaAnnouncer = new AriaAnnouncer();

/**
 * Keyboard Navigation Helper
 */
export const KeyboardNav = {
  /**
   * Handle arrow key navigation in a list
   */
  handleArrowKeys(
    e: KeyboardEvent,
    currentIndex: number,
    itemCount: number,
    onSelect: (index: number) => void
  ) {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, itemCount - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = itemCount - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(currentIndex);
        return;
    }

    if (newIndex !== currentIndex) {
      onSelect(newIndex);
    }
  },

  /**
   * Handle tab navigation
   */
  trapFocus(container: HTMLElement, e: KeyboardEvent) {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }
};

/**
 * ARIA Attributes Builder
 */
export const AriaBuilder = {
  /**
   * Button attributes
   */
  button(label: string, options: {
    pressed?: boolean;
    expanded?: boolean;
    disabled?: boolean;
    controls?: string;
  } = {}) {
    return {
      role: 'button',
      'aria-label': label,
      'aria-pressed': options.pressed,
      'aria-expanded': options.expanded,
      'aria-disabled': options.disabled,
      'aria-controls': options.controls,
      tabIndex: options.disabled ? -1 : 0
    };
  },

  /**
   * Link attributes
   */
  link(label: string, options: {
    current?: boolean;
    disabled?: boolean;
  } = {}) {
    return {
      role: 'link',
      'aria-label': label,
      'aria-current': options.current ? 'page' : undefined,
      'aria-disabled': options.disabled,
      tabIndex: options.disabled ? -1 : 0
    };
  },

  /**
   * Menu attributes
   */
  menu(label: string) {
    return {
      role: 'menu',
      'aria-label': label
    };
  },

  menuItem(label: string, options: {
    disabled?: boolean;
    selected?: boolean;
  } = {}) {
    return {
      role: 'menuitem',
      'aria-label': label,
      'aria-disabled': options.disabled,
      'aria-selected': options.selected,
      tabIndex: options.disabled ? -1 : 0
    };
  },

  /**
   * Dialog attributes
   */
  dialog(label: string, describedBy?: string) {
    return {
      role: 'dialog',
      'aria-label': label,
      'aria-describedby': describedBy,
      'aria-modal': true
    };
  },

  /**
   * List attributes
   */
  list(label: string) {
    return {
      role: 'list',
      'aria-label': label
    };
  },

  listItem(label: string, options: {
    selected?: boolean;
    index?: number;
    total?: number;
  } = {}) {
    return {
      role: 'listitem',
      'aria-label': label,
      'aria-selected': options.selected,
      'aria-posinset': options.index !== undefined ? options.index + 1 : undefined,
      'aria-setsize': options.total,
      tabIndex: 0
    };
  },

  /**
   * Tab attributes
   */
  tabList(label: string) {
    return {
      role: 'tablist',
      'aria-label': label
    };
  },

  tab(label: string, options: {
    selected?: boolean;
    controls?: string;
  } = {}) {
    return {
      role: 'tab',
      'aria-label': label,
      'aria-selected': options.selected,
      'aria-controls': options.controls,
      tabIndex: options.selected ? 0 : -1
    };
  },

  tabPanel(labelledBy: string) {
    return {
      role: 'tabpanel',
      'aria-labelledby': labelledBy,
      tabIndex: 0
    };
  },

  /**
   * Form attributes
   */
  input(label: string, options: {
    required?: boolean;
    invalid?: boolean;
    describedBy?: string;
  } = {}) {
    return {
      'aria-label': label,
      'aria-required': options.required,
      'aria-invalid': options.invalid,
      'aria-describedby': options.describedBy
    };
  },

  /**
   * Status attributes
   */
  status(label: string, live: 'polite' | 'assertive' = 'polite') {
    return {
      role: 'status',
      'aria-label': label,
      'aria-live': live,
      'aria-atomic': true
    };
  },

  /**
   * Alert attributes
   */
  alert(label: string) {
    return {
      role: 'alert',
      'aria-label': label,
      'aria-live': 'assertive',
      'aria-atomic': true
    };
  }
};

/**
 * Focus Management
 */
export const FocusManager = {
  /**
   * Save current focus
   */
  saveFocus(): HTMLElement | null {
    return document.activeElement as HTMLElement;
  },

  /**
   * Restore focus
   */
  restoreFocus(element: HTMLElement | null) {
    element?.focus();
  },

  /**
   * Focus first element in container
   */
  focusFirst(container: HTMLElement) {
    const focusable = container.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  },

  /**
   * Focus element by ID
   */
  focusById(id: string) {
    const element = document.getElementById(id);
    element?.focus();
  }
};

/**
 * Screen Reader Only CSS Class
 * Add to global CSS:
 * 
 * .sr-only {
 *   position: absolute;
 *   width: 1px;
 *   height: 1px;
 *   padding: 0;
 *   margin: -1px;
 *   overflow: hidden;
 *   clip: rect(0, 0, 0, 0);
 *   white-space: nowrap;
 *   border-width: 0;
 * }
 */

/**
 * High Contrast Mode Detection
 */
export function isHighContrastMode(): boolean {
  // Check for Windows High Contrast Mode
  if (window.matchMedia) {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }
  return false;
}

/**
 * Reduced Motion Detection
 */
export function prefersReducedMotion(): boolean {
  if (window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

/**
 * Color Contrast Checker
 * WCAG 2.1 Level AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Simple RGB to luminance (assumes hex color)
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG standards
 */
export function meetsWCAG(
  color1: string,
  color2: string,
  level: 'AA' | 'AAA' = 'AA',
  large: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);
  
  if (level === 'AAA') {
    return large ? ratio >= 4.5 : ratio >= 7;
  }
  
  return large ? ratio >= 3 : ratio >= 4.5;
}
