// core/protocol/index.ts
// Central export point for all protocol types

// Base types
export * from './types';

// Core messages (Core → Extension → GUI)
export * from './core';

// GUI messages (GUI → Extension → Core)
export * from './gui';

// Re-export commonly used types for convenience
export type {
  Message,
  MessageWithData,
  ResponseMessage,
  ErrorMessage,
} from './types';

export type {
  CoreMessage,
  StreamingStartMessage,
  StreamingTokenMessage,
  StreamingCompleteMessage,
  StreamingErrorMessage,
  ContextUpdateMessage,
  PlanningProgressMessage,
  PlanningCompleteMessage,
} from './core';

export type {
  GUIMessage,
  ChatRequestMessage,
  StopGenerationMessage,
  RegenerateMessage,
  ContextRequestMessage,
  PlanTaskMessage,
  FileOpenMessage,
  FileEditMessage,
} from './gui';

// Re-export helper functions
export {
  generateMessageId,
} from './types';

export {
  isCoreMessage,
  isStreamingMessage,
  isPlanningMessage,
} from './core';

export {
  isGUIMessage,
  isChatMessage,
  isIDEMessage,
  createChatRequest,
  createStopGeneration,
  createContextRequest,
} from './gui';
