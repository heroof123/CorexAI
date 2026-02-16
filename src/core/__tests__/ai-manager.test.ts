// core/__tests__/ai-manager.test.ts
// Unit tests for AIManager

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIManager } from '../ai/manager';
import { CoreEngine } from '../index';

describe('AIManager', () => {
  let mockCore: CoreEngine;
  let aiManager: AIManager;

  beforeEach(() => {
    // Mock CoreEngine
    mockCore = {
      sendMessage: vi.fn(),
    } as any;

    aiManager = new AIManager(mockCore);
  });

  describe('handleChatRequest', () => {
    it('should handle chat request and send streaming start message', async () => {
      const requestData = {
        requestId: 'test-req-1',
        message: 'Hello AI',
        context: [],
      };

      // Mock AI response
      vi.mock('../../services/aiProvider', () => ({
        callAI: vi.fn().mockResolvedValue('Hello! How can I help?'),
      }));

      await aiManager.handleChatRequest(requestData);

      // Verify streaming start message was sent
      expect(mockCore.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          messageType: 'streaming/start',
          data: expect.objectContaining({
            requestId: 'test-req-1',
          }),
        })
      );
    });

    it('should track active requests', async () => {
      const requestData = {
        requestId: 'test-req-2',
        message: 'Test message',
      };

      // Start request (don't await to check active state)
      const promise = aiManager.handleChatRequest(requestData);

      // Check if request is active
      expect(aiManager.isRequestActive('test-req-2')).toBe(true);

      await promise;

      // After completion, should not be active
      expect(aiManager.isRequestActive('test-req-2')).toBe(false);
    });
  });

  describe('stopGeneration', () => {
    it('should stop active generation', async () => {
      const requestId = 'test-req-3';

      // Start a request
      const promise = aiManager.handleChatRequest({
        requestId,
        message: 'Test',
      });

      // Stop it
      await aiManager.stopGeneration(requestId);

      // Should not be active anymore
      expect(aiManager.isRequestActive(requestId)).toBe(false);

      // Wait for promise to settle
      await promise.catch(() => {
        /* ignore abort error */
      });
    });

    it('should handle stopping non-existent request', async () => {
      // Should not throw
      await expect(
        aiManager.stopGeneration('non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should abort all active requests', async () => {
      // Start multiple requests
      const promises = [
        aiManager.handleChatRequest({ requestId: 'req-1', message: 'Test 1' }),
        aiManager.handleChatRequest({ requestId: 'req-2', message: 'Test 2' }),
      ];

      // Cleanup
      await aiManager.cleanup();

      // All requests should be aborted
      expect(aiManager.getActiveRequestCount()).toBe(0);

      // Wait for promises to settle
      await Promise.allSettled(promises);
    });
  });
});
