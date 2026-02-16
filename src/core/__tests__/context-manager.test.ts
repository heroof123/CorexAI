// core/__tests__/context-manager.test.ts
// Unit tests for ContextManager

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextManager } from '../context/manager';
import { CoreEngine } from '../index';

describe('ContextManager', () => {
  let mockCore: CoreEngine;
  let contextManager: ContextManager;

  beforeEach(() => {
    mockCore = {
      sendMessage: vi.fn(),
    } as any;

    contextManager = new ContextManager(mockCore);
  });

  describe('handleContextRequest', () => {
    it('should send context update message', async () => {
      const requestData = {
        requestId: 'ctx-1',
        query: 'test query',
        maxFiles: 5,
      };

      // Mock project index
      vi.mock('../../services/db', () => ({
        getProjectIndex: vi.fn().mockResolvedValue({
          files: [
            {
              path: 'test.ts',
              content: 'test content',
              embedding: [],
            },
          ],
        }),
      }));

      await contextManager.handleContextRequest(requestData);

      expect(mockCore.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          messageType: 'context/update',
        })
      );
    });
  });

  describe('trackFileAccess', () => {
    it('should track file access time', () => {
      const filePath = 'test.ts';

      contextManager.trackFileAccess(filePath);

      // Should not throw
      expect(() => contextManager.trackFileAccess(filePath)).not.toThrow();
    });
  });

  describe('clearCache', () => {
    it('should clear cache', () => {
      contextManager.trackFileAccess('test1.ts');
      contextManager.trackFileAccess('test2.ts');

      contextManager.clearCache();

      // Should not throw
      expect(() => contextManager.clearCache()).not.toThrow();
    });
  });
});
