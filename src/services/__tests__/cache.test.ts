import { describe, it, expect, beforeEach } from 'vitest';
import { cacheManager } from '../cache';

describe('Cache Service', () => {
  beforeEach(() => {
    cacheManager.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cacheManager.set('test-key', { data: 'test-value' });
      const result = cacheManager.get('test-key');
      
      expect(result).toEqual({ data: 'test-value' });
    });

    it('should return null for non-existent keys', () => {
      const result = cacheManager.get('non-existent');
      
      expect(result).toBeNull();
    });

    it('should handle different data types', () => {
      cacheManager.set('string', 'hello');
      cacheManager.set('number', 42);
      cacheManager.set('object', { foo: 'bar' });
      cacheManager.set('array', [1, 2, 3]);
      
      expect(cacheManager.get('string')).toBe('hello');
      expect(cacheManager.get('number')).toBe(42);
      expect(cacheManager.get('object')).toEqual({ foo: 'bar' });
      expect(cacheManager.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      cacheManager.set('temp-key', 'temp-value', 100); // 100ms TTL
      
      expect(cacheManager.get('temp-key')).toBe('temp-value');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cacheManager.get('temp-key')).toBeNull();
    });

    it('should not expire entries without TTL', async () => {
      cacheManager.set('permanent-key', 'permanent-value');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cacheManager.get('permanent-key')).toBe('permanent-value');
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cacheManager.set('existing', 'value');
      
      expect(cacheManager.has('existing')).toBe(true);
    });

    it('should return false for non-existing keys', () => {
      expect(cacheManager.has('non-existing')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      cacheManager.set('expiring', 'value', 50);
      
      expect(cacheManager.has('expiring')).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cacheManager.has('expiring')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove entries', () => {
      cacheManager.set('to-delete', 'value');
      
      expect(cacheManager.has('to-delete')).toBe(true);
      
      cacheManager.delete('to-delete');
      
      expect(cacheManager.has('to-delete')).toBe(false);
    });

    it('should not throw on non-existent keys', () => {
      expect(() => cacheManager.delete('non-existent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.set('key3', 'value3');
      
      cacheManager.clear();
      
      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.has('key2')).toBe(false);
      expect(cacheManager.has('key3')).toBe(false);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      
      const stats = cacheManager.getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.hits).toBeGreaterThanOrEqual(0);
      expect(stats.misses).toBeGreaterThanOrEqual(0);
    });

    it('should track hits and misses', () => {
      cacheManager.set('key', 'value');
      
      const statsBefore = cacheManager.getCacheStats();
      
      cacheManager.get('key'); // hit
      cacheManager.get('non-existent'); // miss
      
      const statsAfter = cacheManager.getCacheStats();
      
      expect(statsAfter.hits).toBe(statsBefore.hits + 1);
      expect(statsAfter.misses).toBe(statsBefore.misses + 1);
    });
  });

  describe('memory management', () => {
    it('should handle large datasets', () => {
      for (let i = 0; i < 1000; i++) {
        cacheManager.set(`key-${i}`, { data: `value-${i}` });
      }
      
      const stats = cacheManager.getCacheStats();
      expect(stats.size).toBe(1000);
    });

    it('should cleanup expired entries', async () => {
      for (let i = 0; i < 10; i++) {
        cacheManager.set(`temp-${i}`, `value-${i}`, 50);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Trigger cleanup by accessing cache
      cacheManager.get('temp-0');
      
      const stats = cacheManager.getCacheStats();
      expect(stats.size).toBeLessThan(10);
    });
  });
});
