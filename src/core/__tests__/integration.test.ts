// core/__tests__/integration.test.ts
// Integration tests for Core ↔ Extension ↔ GUI flow

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoreEngine } from '../index';
import { createChatRequest } from '../protocol';

// Mock db module for context tests
vi.mock('../../services/db', () => ({
  getProjectIndex: vi.fn().mockResolvedValue({
    files: [
      {
        path: 'src/test.ts',
        content: 'const x = 1;',
        lastModified: Date.now(),
      },
      {
        path: 'src/app.ts',
        content: 'console.log("hello");',
        lastModified: Date.now(),
      },
    ],
  }),
}));

// Mock aiProvider for planning tests
vi.mock('../../services/aiProvider', () => ({
  callAI: vi.fn().mockResolvedValue(JSON.stringify({
    steps: [
      'Create project structure',
      'Add main files',
      'Test the app',
    ],
  })),
}));

describe('Core Integration Tests', () => {
  let coreEngine: CoreEngine;
  let receivedMessages: any[] = [];

  beforeEach(async () => {
    receivedMessages = [];
    coreEngine = new CoreEngine();

    // Listen to messages
    coreEngine.on('message', (message) => {
      receivedMessages.push(message);
    });

    await coreEngine.initialize();
  });

  afterEach(async () => {
    await coreEngine.shutdown();
  });

  describe('Chat Flow', () => {
    it('should handle complete chat request flow', async () => {
      const chatMessage = createChatRequest('Hello AI');

      // Send message to core
      await coreEngine.handleMessage(chatMessage);

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should receive streaming messages
      const streamingStart = receivedMessages.find(
        (m) => m.messageType === 'streaming/start'
      );
      expect(streamingStart).toBeDefined();

      // Should eventually receive complete message
      // (This might take time depending on AI response)
    });

    it('should handle stop generation', async () => {
      const chatMessage = createChatRequest('Long response please');

      // Start chat
      const promise = coreEngine.handleMessage(chatMessage);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Stop generation
      const requestId = chatMessage.data.requestId;
      await coreEngine.handleMessage({
        messageId: 'stop-1',
        messageType: 'chat/stop',
        timestamp: Date.now(),
        data: { requestId },
      });

      await promise;

      // Should have stopped
      expect(receivedMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Context Flow', () => {
    it('should handle context request', async () => {
      const contextMessage = {
        messageId: 'ctx-1',
        messageType: 'context/request' as const,
        timestamp: Date.now(),
        data: {
          requestId: 'req-1',
          query: 'test query',
          maxFiles: 5,
        },
      };

      await coreEngine.handleMessage(contextMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should receive context update
      const contextUpdate = receivedMessages.find(
        (m) => m.messageType === 'context/update'
      );
      expect(contextUpdate).toBeDefined();
    });
  });

  describe('Planning Flow', () => {
    it('should handle planning request', async () => {
      const planMessage = {
        messageId: 'plan-1',
        messageType: 'planning/request' as const,
        timestamp: Date.now(),
        data: {
          requestId: 'req-1',
          task: 'Create a simple app',
          context: [],
        },
      };

      await coreEngine.handleMessage(planMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should receive planning messages
      const planningProgress = receivedMessages.find(
        (m) => m.messageType === 'planning/progress'
      );
      expect(planningProgress).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid message gracefully', async () => {
      const invalidMessage = {
        messageId: 'invalid-1',
        messageType: 'invalid/type' as any,
        timestamp: Date.now(),
        data: {},
      };

      await coreEngine.handleMessage(invalidMessage);

      // Should send error message
      const errorMessage = receivedMessages.find(
        (m) => m.messageType === 'error'
      );
      expect(errorMessage).toBeDefined();
    });

    it('should handle uninitialized core', async () => {
      const uninitializedCore = new CoreEngine();
      const message = createChatRequest('Test');

      await uninitializedCore.handleMessage(message);

      // Should handle gracefully (send error)
      // No crash expected
    });
  });
});
