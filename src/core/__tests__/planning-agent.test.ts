// core/__tests__/planning-agent.test.ts
// Unit tests for PlanningAgent

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanningAgent } from '../planning/agent';
import { CoreEngine } from '../index';

describe('PlanningAgent', () => {
  let mockCore: CoreEngine;
  let planningAgent: PlanningAgent;

  beforeEach(() => {
    mockCore = {
      sendMessage: vi.fn(),
    } as any;

    planningAgent = new PlanningAgent(mockCore);
  });

  describe('handlePlanRequest', () => {
    it('should create and execute plan', async () => {
      const requestData = {
        requestId: 'plan-1',
        task: 'Create a login page',
        context: [],
      };

      // Mock AI response
      vi.mock('../../services/aiProvider', () => ({
        callAI: vi.fn().mockResolvedValue(
          JSON.stringify({
            steps: ['Create HTML', 'Add CSS', 'Add JavaScript'],
          })
        ),
      }));

      await planningAgent.handlePlanRequest(requestData);

      // Should send progress messages
      expect(mockCore.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          messageType: 'planning/progress',
        })
      );

      // Should send complete message
      expect(mockCore.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          messageType: 'planning/complete',
        })
      );
    });
  });

  describe('getActivePlan', () => {
    it('should return undefined for non-existent plan', () => {
      const plan = planningAgent.getActivePlan('non-existent');
      expect(plan).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should clear all active plans', async () => {
      await planningAgent.cleanup();

      // Should not throw
      expect(() => planningAgent.cleanup()).not.toThrow();
    });
  });
});
