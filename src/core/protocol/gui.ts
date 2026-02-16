// core/protocol/gui.ts
// Messages sent from GUI to Extension (and forwarded to Core)

import { MessageWithData } from './types';

/**
 * Union type of all GUI messages
 */
export type GUIMessage =
  | ChatRequestMessage
  | StopGenerationMessage
  | RegenerateMessage
  | ContextRequestMessage
  | PlanTaskMessage
  | FileOpenMessage
  | FileEditMessage;

// ============================================================================
// Chat Messages
// ============================================================================

/**
 * Request to send a chat message
 */
export interface ChatRequestMessage extends MessageWithData<{
  requestId: string;
  message: string;
  context?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}> {
  messageType: 'chat/request';
}

/**
 * Request to stop ongoing generation
 */
export interface StopGenerationMessage extends MessageWithData<{
  requestId: string;
}> {
  messageType: 'chat/stop';
}

/**
 * Request to regenerate a message
 */
export interface RegenerateMessage extends MessageWithData<{
  messageId: string;
  newPrompt?: string;
}> {
  messageType: 'chat/regenerate';
}

// ============================================================================
// Context Messages
// ============================================================================

/**
 * Request context for a query
 */
export interface ContextRequestMessage extends MessageWithData<{
  requestId: string;
  query: string;
  maxFiles?: number;
  maxTokens?: number;
}> {
  messageType: 'context/request';
}

// ============================================================================
// Planning Messages
// ============================================================================

/**
 * Request to plan a task
 */
export interface PlanTaskMessage extends MessageWithData<{
  requestId: string;
  task: string;
  context?: string[];
}> {
  messageType: 'planning/request';
}

// ============================================================================
// IDE Messages
// ============================================================================

/**
 * Notify that a file was opened
 */
export interface FileOpenMessage extends MessageWithData<{
  filePath: string;
  content?: string;
}> {
  messageType: 'ide/file-open';
}

/**
 * Notify that a file was edited
 */
export interface FileEditMessage extends MessageWithData<{
  filePath: string;
  changes: Array<{
    startLine: number;
    endLine: number;
    newText: string;
  }>;
}> {
  messageType: 'ide/file-edit';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if a message is a GUIMessage
 */
export function isGUIMessage(message: any): message is GUIMessage {
  return (
    message &&
    typeof message === 'object' &&
    'messageId' in message &&
    'messageType' in message &&
    'timestamp' in message
  );
}

/**
 * Type guard for chat messages
 */
export function isChatMessage(
  message: GUIMessage
): message is ChatRequestMessage | StopGenerationMessage | RegenerateMessage {
  return message.messageType.startsWith('chat/');
}

/**
 * Type guard for IDE messages
 */
export function isIDEMessage(
  message: GUIMessage
): message is FileOpenMessage | FileEditMessage {
  return message.messageType.startsWith('ide/');
}

/**
 * Create a chat request message
 */
export function createChatRequest(
  message: string,
  options?: {
    context?: string[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): ChatRequestMessage {
  return {
    messageId: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    messageType: 'chat/request',
    timestamp: Date.now(),
    data: {
      requestId: `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      message,
      ...options,
    },
  };
}

/**
 * Create a stop generation message
 */
export function createStopGeneration(requestId: string): StopGenerationMessage {
  return {
    messageId: `stop-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    messageType: 'chat/stop',
    timestamp: Date.now(),
    data: { requestId },
  };
}

/**
 * Create a context request message
 */
export function createContextRequest(
  query: string,
  options?: {
    maxFiles?: number;
    maxTokens?: number;
  }
): ContextRequestMessage {
  return {
    messageId: `ctx-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    messageType: 'context/request',
    timestamp: Date.now(),
    data: {
      requestId: `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      query,
      ...options,
    },
  };
}
