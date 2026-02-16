// core/protocol/types.ts
// Base message types for Continue.dev-style architecture

/**
 * Base message interface
 * All messages in the system extend this interface
 */
export interface Message {
  /** Unique message identifier */
  messageId: string;
  /** Type of the message (e.g., 'streaming/start', 'chat/request') */
  messageType: string;
  /** Timestamp when the message was created */
  timestamp: number;
}

/**
 * Message with typed data payload
 * Used for messages that carry data
 */
export interface MessageWithData<T> extends Message {
  /** Typed data payload */
  data: T;
}

/**
 * Response message with success/error handling
 * Used for request-response patterns
 */
export interface ResponseMessage<T> extends Message {
  /** Whether the operation was successful */
  success: boolean;
  /** Response data (if successful) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Error message
 * Used to communicate errors across layers
 */
export interface ErrorMessage extends Message {
  messageType: 'error';
  data: {
    /** Request ID that caused the error */
    requestId?: string;
    /** Error message */
    error: string;
    /** Error stack trace (optional) */
    stack?: string;
  };
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(prefix: string = 'msg'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}-${timestamp}-${random}`;
}
