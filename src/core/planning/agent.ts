// core/planning/agent.ts
// Planning Agent - Breaks down complex tasks into steps

import { CoreEngine } from '../index';
import { generateMessageId } from '../protocol';
import { performanceMonitor } from '../../utils/performance-monitor';
import { errorHandler, ErrorSeverity, retry } from '../../utils/error-handler';

export interface PlanStep {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export interface Plan {
  id: string;
  task: string;
  steps: PlanStep[];
  currentStep: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
}

/**
 * Planning Agent
 * Breaks down complex tasks and executes them step by step
 */
export class PlanningAgent {
  private core: CoreEngine;
  private activePlans: Map<string, Plan> = new Map();
  
  constructor(core: CoreEngine) {
    this.core = core;
    console.log('📋 PlanningAgent: Initialized');
  }
  
  /**
   * Handle plan request from GUI
   */
  async handlePlanRequest(data: {
    requestId: string;
    task: string;
    context?: string[];
  }): Promise<void> {
    console.log(`📋 PlanningAgent: Creating plan for: ${data.task}`);
    
    // Start performance monitoring
    performanceMonitor.start(`planning-request-${data.requestId}`);
    
    try {
      // Create plan using AI with retry logic
      const plan = await retry(
        async () => await this.createPlan(data.task, data.context),
        {
          maxAttempts: 3,
          delay: 1000,
          context: {
            component: 'PlanningAgent',
            operation: 'handlePlanRequest',
            metadata: { requestId: data.requestId, task: data.task }
          }
        }
      );
      
      this.activePlans.set(data.requestId, plan);
      
      // Send plan to GUI
      this.core.sendMessage({
        messageId: generateMessageId('planning-progress'),
        messageType: 'planning/progress',
        timestamp: Date.now(),
        data: {
          requestId: data.requestId,
          plan: plan,
          currentStep: 0,
          totalSteps: plan.steps.length
        }
      });
      
      // Execute plan
      await this.executePlan(data.requestId, plan);
      
      // End performance monitoring
      performanceMonitor.end(`planning-request-${data.requestId}`, {
        requestId: data.requestId,
        stepCount: plan.steps.length,
        success: plan.status === 'completed'
      });
      
    } catch (error) {
      console.error('❌ PlanningAgent: Error:', error);
      
      // Log error
      errorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        {
          component: 'PlanningAgent',
          operation: 'handlePlanRequest',
          metadata: {
            requestId: data.requestId,
            task: data.task
          }
        }
      );
      
      // End performance monitoring (error)
      performanceMonitor.end(`planning-request-${data.requestId}`, {
        requestId: data.requestId,
        error: true
      });
      
      throw error;
    }
  }
  
  /**
   * Create a plan using AI
   */
  private async createPlan(task: string, context?: string[]): Promise<Plan> {
    performanceMonitor.start('planning-create-plan');
    
    try {
    // Use AI to break down the task
    const { callAI } = await import('../../services/ai');
    
    const prompt = `Görevi adım adım plana dönüştür. Her adım kısa ve net olmalı.

Görev: ${task}

${context ? `Bağlam:\n${context.join('\n')}` : ''}

Planı şu formatta ver (JSON):
{
  "steps": [
    "Adım 1 açıklaması",
    "Adım 2 açıklaması",
    "Adım 3 açıklaması"
  ]
}

Sadece JSON döndür, başka açıklama yapma.`;

    const response = await callAI(prompt, '', [
      { role: 'user', content: prompt }
    ]);
    
    // Parse AI response
    let steps: string[] = [];
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        steps = parsed.steps || [];
      }
    } catch (e) {
      // Fallback: split by lines
      steps = response.split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 10);
    }
    
      // Create plan
      const plan: Plan = {
        id: `plan-${Date.now()}`,
        task,
        steps: steps.map((desc, i) => ({
          id: `step-${i}`,
          description: desc,
          status: 'pending'
        })),
        currentStep: 0,
        status: 'planning'
      };
      
      performanceMonitor.end('planning-create-plan', {
        stepCount: steps.length,
        hasContext: !!context
      });
      
      return plan;
      
    } catch (error) {
      errorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        {
          component: 'PlanningAgent',
          operation: 'createPlan',
          metadata: { task }
        }
      );
      
      performanceMonitor.end('planning-create-plan', { error: true });
      throw error;
    }
  }
  
  /**
   * Execute a plan step by step
   */
  private async executePlan(requestId: string, plan: Plan): Promise<void> {
    performanceMonitor.start(`planning-execute-${requestId}`);
    plan.status = 'executing';
    
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      plan.currentStep = i;
      
      // Update step status
      step.status = 'in-progress';
      this.sendProgress(requestId, plan);
      
      try {
        // Execute step with retry logic
        const result = await retry(
          async () => await this.executeStep(step, plan.task),
          {
            maxAttempts: 2,
            delay: 500,
            context: {
              component: 'PlanningAgent',
              operation: 'executePlan',
              metadata: { requestId, stepId: step.id }
            }
          }
        );
        
        step.status = 'completed';
        step.result = result;
        
      } catch (error) {
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : 'Unknown error';
        plan.status = 'failed';
        
        errorHandler.handle(
          error instanceof Error ? error : new Error(String(error)),
          ErrorSeverity.ERROR,
          {
            component: 'PlanningAgent',
            operation: 'executePlan',
            metadata: {
              requestId,
              stepId: step.id,
              stepDescription: step.description
            }
          }
        );
        
        break;
      }
      
      this.sendProgress(requestId, plan);
    }
    
    // Send completion
    if (plan.status !== 'failed') {
      plan.status = 'completed';
    }
    
    this.core.sendMessage({
      messageId: generateMessageId('planning-complete'),
      messageType: 'planning/complete',
      timestamp: Date.now(),
      data: {
        requestId,
        plan,
        success: plan.status === 'completed'
      }
    });
    
    performanceMonitor.end(`planning-execute-${requestId}`, {
      requestId,
      totalSteps: plan.steps.length,
      completedSteps: plan.steps.filter(s => s.status === 'completed').length,
      success: plan.status === 'completed'
    });
    
    this.activePlans.delete(requestId);
  }
  
  /**
   * Execute a single step
   */
  private async executeStep(step: PlanStep, task: string): Promise<string> {
    performanceMonitor.start(`planning-step-${step.id}`);
    
    try {
      const { callAI } = await import('../../services/ai');
      
      const prompt = `Görev: ${task}
Adım: ${step.description}

Bu adımı gerçekleştir ve sonucu kısaca açıkla (maksimum 2 cümle).`;

      const result = await callAI(prompt, '', [
        { role: 'user', content: prompt }
      ]);
      
      performanceMonitor.end(`planning-step-${step.id}`, {
        stepId: step.id,
        resultLength: result.length
      });
      
      return result;
      
    } catch (error) {
      performanceMonitor.end(`planning-step-${step.id}`, {
        stepId: step.id,
        error: true
      });
      throw error;
    }
  }
  
  /**
   * Send progress update
   */
  private sendProgress(requestId: string, plan: Plan): void {
    this.core.sendMessage({
      messageId: generateMessageId('planning-progress'),
      messageType: 'planning/progress',
      timestamp: Date.now(),
      data: {
        requestId,
        plan,
        currentStep: plan.currentStep,
        totalSteps: plan.steps.length
      }
    });
  }
  
  /**
   * Get active plan
   */
  getActivePlan(requestId: string): Plan | undefined {
    return this.activePlans.get(requestId);
  }
  
  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    this.activePlans.clear();
    console.log('✅ PlanningAgent: Cleanup complete');
  }
}
