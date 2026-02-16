import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with text', () => {
    render(<LoadingSpinner text="Loading..." />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    rerender(<LoadingSpinner size="md" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render fullscreen variant', () => {
    const { container } = render(<LoadingSpinner fullScreen />);
    
    const fullscreenDiv = container.querySelector('.fixed.inset-0');
    expect(fullscreenDiv).toBeInTheDocument();
  });

  it('should not render fullscreen by default', () => {
    const { container } = render(<LoadingSpinner />);
    
    const fullscreenDiv = container.querySelector('.fixed.inset-0');
    expect(fullscreenDiv).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingSpinner text="Loading data" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });

  it('should render animation', () => {
    const { container } = render(<LoadingSpinner />);
    
    const animatedElement = container.querySelector('.animate-spin');
    expect(animatedElement).toBeInTheDocument();
  });
});
