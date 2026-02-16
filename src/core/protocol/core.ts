// core/protocol/core.ts
// Messages sent from Core to Extension (and forwarded to GUI)

import { MessageWithData } from './types';

/**
 * Union type of all Core messages
 */
export type CoreMessage =
  | StreamingStartMessage
  | StreamingTokenMessage
  | StreamingCompleteMessage
  | StreamingErrorMessage
  | ContextUpdateMessage
  | PlanningProgressMessage
  | PlanningCompleteMessage
  | ErrorMessage;

// ============================================================================
// Streaming Messages
// ============================================================================

/**
 * Sent when streaming starts
 */
export interface StreamingStartMessage extends MessageWithData<{
  requestId: string;
  model: string;
}> {
  messageType: 'streaming/start';
}

/**
 * Sent for each token during streaming
 */
export interface StreamingTokenMessage extends MessageWithData<{
  requestId: string;
  token: string;
  accumulated: string;
}> {
  messageType: 'streaming/token';
}

/**
 * Sent when streaming completes successfully
 */
export interface StreamingCompleteMessage extends MessageWithData<{
  requestId: string;
  fullResponse: string;
  tokensUsed: number;
  duration: number;
}> {
  messageType: 'streaming/complete';
}

/**
 * Sent when streaming encounters an error
 */
export interface StreamingErrorMessage extends MessageWithData<{
  requestId: string;
  error: string;
  stack?: string;
}> {
  messageType: 'streaming/error';
}

// ============================================================================
// Context Messages
// ============================================================================

/**
 * Sent when context is updated
 */
export interface ContextUpdateMessage extends MessageWithData<{
  requestId: string;
  files: Array<{
    path: string;
    content: string;
    relevanceScore: number;
  }>;
  totalTokens: number;
}> {
  messageType: 'context/update';
}

// ============================================================================
// Planning Messages
// ============================================================================

/**
 * Sent during planning progress
 */
export interface PlanningProgressMessage extends MessageWithData<{
  requestId: string;
  plan: {
    id: string;
    task: string;
    steps: Array<{
      id: string;
      description: string;
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      result?: string;
      error?: string;
    }>;
    currentStep: number;
    status: 'planning' | 'executing' | 'completed' | 'failed';
  };
  currentStep: number;
  totalSteps: number;
}> {
  messageType: 'planning/progress';
}

/**
 * Sent when planning completes
 */
export interface PlanningCompleteMessage extends MessageWithData<{
  requestId: string;
  plan: {
    id: string;
    task: string;
    steps: Array<{
      id: string;
      description: string;
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      result?: string;
      error?: string;
    }>;
    currentStep: number;
    status: 'planning' | 'executing' | 'completed' | 'failed';
  };
  success: boolean;
}> {
  messageType: 'planning/complete';
}

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Generic error message
 */
export interface ErrorMessage extends MessageWithData<{
  requestId?: string;
  error: string;
  stack?: string;
  context?: Record<string, any>;
}> {
  messageType: 'error';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if a message is a CoreMessage
 */
export function isCoreMessage(message: any): message is CoreMessage {
  return (
    message &&
    typeof message === 'object' &&
    'messageId' in message &&
    'messageType' in message &&
    'timestamp' in message
  );
}

/**
 * Type guard for streaming messages
 */
export function isStreamingMessage(
  message: CoreMessage
): message is StreamingStartMessage | StreamingTokenMessage | StreamingCompleteMessage | StreamingErrorMessage {
  return message.messageType.startsWith('streaming/');
}

/**
 * Type guard for planning messages
 */
export function isPlanningMessage(
  message: CoreMessage
): message is PlanningProgressMessage | PlanningCompleteMessage {
  return message.messageType.startsWith('planning/');
}
