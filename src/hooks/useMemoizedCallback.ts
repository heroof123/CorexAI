import { useCallback, useRef } from 'react';

/**
 * Memoized callback hook with stable reference
 * Always returns the same function reference but uses latest values
 * 
 * @param callback - Function to memoize
 * @returns Memoized callback with stable reference
 * 
 * @example
 * const handleClick = useMemoizedCallback((id: string) => {
 *   // Uses latest state/props but function reference never changes
 *   console.log('Clicked:', id, someState);
 * });
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  
  // Update ref on every render to capture latest values
  callbackRef.current = callback;

  // Return stable function reference
  return useCallback(((...args) => {
    return callbackRef.current(...args);
  }) as T, []);
}
