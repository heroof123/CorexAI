// core/ai/manager.ts
// AI Manager - Handles all AI-related operations

import { CoreEngine } from '../index';
import { StreamingHandler } from './streaming';
import { generateMessageId } from '../protocol';
import { performanceMonitor } from '../../utils/performance-monitor';
import { errorHandler, ErrorSeverity, retry } from '../../utils/error-handler';

/**
 * AI Manager
 * Coordinates AI operations, manages active requests, and handles streaming
 */
export class AIManager {
  private core: CoreEngine;
  private streamingHandler: StreamingHandler;
  private activeRequests: Map<string, AbortController>;

  constructor(core: CoreEngine) {
    this.core = core;
    this.streamingHandler = new StreamingHandler(core);
    this.activeRequests = new Map();

    console.log('🤖 AIManager: Initialized');
  }

  /**
   * Handle chat request from GUI
   */
  async handleChatRequest(data: {
    requestId: string;
    message: string;
    context?: string[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<void> {
    console.log(`💬 AIManager: Handling chat request: ${data.requestId}`);

    // Start performance monitoring
    performanceMonitor.start(`ai-chat-${data.requestId}`);

    // Create abort controller for this request
    const abortController = new AbortController();
    this.activeRequests.set(data.requestId, abortController);

    // Notify streaming start
    this.core.sendMessage({
      messageId: generateMessageId('streaming-start'),
      messageType: 'streaming/start',
      timestamp: Date.now(),
      data: {
        requestId: data.requestId,
        model: data.model || 'default'
      }
    });

    try {
      // Stream the response with retry logic
      await retry(
        async () => {
          await this.streamingHandler.streamResponse({
            requestId: data.requestId,
            message: data.message,
            context: data.context,
            model: data.model,
            temperature: data.temperature,
            maxTokens: data.maxTokens,
            signal: abortController.signal
          });
        },
        {
          maxAttempts: 2, // Only retry once for AI requests
          delay: 500,
          context: {
            component: 'AIManager',
            operation: 'handleChatRequest',
            metadata: { requestId: data.requestId, model: data.model }
          }
        }
      );

      console.log(`✅ AIManager: Chat request completed: ${data.requestId}`);

      // End performance monitoring
      performanceMonitor.end(`ai-chat-${data.requestId}`, {
        requestId: data.requestId,
        model: data.model,
        messageLength: data.message.length
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`🛑 AIManager: Generation stopped by user: ${data.requestId}`);

        // End performance monitoring (aborted)
        performanceMonitor.end(`ai-chat-${data.requestId}`, {
          requestId: data.requestId,
          aborted: true
        });
      } else {
        console.error(`❌ AIManager: Error in chat request:`, error);

        // Log error
        errorHandler.handle(
          error instanceof Error ? error : new Error(String(error)),
          ErrorSeverity.ERROR,
          {
            component: 'AIManager',
            operation: 'handleChatRequest',
            metadata: {
              requestId: data.requestId,
              model: data.model,
              messageLength: data.message.length
            }
          }
        );

        // End performance monitoring (error)
        performanceMonitor.end(`ai-chat-${data.requestId}`, {
          requestId: data.requestId,
          error: true
        });

        // Send error message
        this.core.sendMessage({
          messageId: generateMessageId('streaming-error'),
          messageType: 'streaming/error',
          timestamp: Date.now(),
          data: {
            requestId: data.requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }
        });
      }
    } finally {
      // Cleanup
      this.activeRequests.delete(data.requestId);
    }
  }

  /**
   * Stop ongoing generation
   */
  async stopGeneration(requestId: string): Promise<void> {
    console.log(`🛑 AIManager: Stopping generation: ${requestId}`);

    performanceMonitor.start(`ai-stop-${requestId}`);

    try {
      const controller = this.activeRequests.get(requestId);
      if (controller) {
        controller.abort();
        this.activeRequests.delete(requestId);
        console.log(`✅ AIManager: Generation stopped: ${requestId}`);

        performanceMonitor.end(`ai-stop-${requestId}`, { requestId });
      } else {
        console.warn(`⚠️ AIManager: No active request found: ${requestId}`);

        errorHandler.handle(
          `No active request found: ${requestId}`,
          ErrorSeverity.WARNING,
          {
            component: 'AIManager',
            operation: 'stopGeneration',
            metadata: { requestId }
          }
        );

        performanceMonitor.end(`ai-stop-${requestId}`, { requestId, notFound: true });
      }
    } catch (error) {
      errorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        {
          component: 'AIManager',
          operation: 'stopGeneration',
          metadata: { requestId }
        }
      );

      performanceMonitor.end(`ai-stop-${requestId}`, { requestId, error: true });
      throw error;
    }
  }

  /**
   * Regenerate a response
   */
  async regenerateResponse(data: {
    messageId: string;
    newPrompt?: string;
  }): Promise<void> {
    console.log(`🔄 AIManager: Regenerating response: ${data.messageId}`);

    performanceMonitor.start(`ai-regenerate-${data.messageId}`);

    try {
      // Regeneration uses the newPrompt (provided by UI when user clicks ↺ button)
      // or falls back to emitting an error asking for it
      const userMessage = data.newPrompt;

      if (!userMessage) {
        // Notify GUI to ask user for the message to regenerate
        this.core.sendMessage({
          messageId: generateMessageId('streaming-error'),
          messageType: 'streaming/error',
          timestamp: Date.now(),
          data: {
            requestId: `regen-${data.messageId}`,
            error: 'Regeneration requires the original user message (newPrompt). Please provide it.',
          }
        });
        performanceMonitor.end(`ai-regenerate-${data.messageId}`, {
          messageId: data.messageId,
          skipped: true
        });
        return;
      }

      // Build new requestId for this regeneration attempt
      const regenRequestId = `regen-${data.messageId}-${Date.now()}`;

      console.log(`🔄 AIManager: Regenerating with prompt: "${userMessage.substring(0, 60)}..."`);

      // Notify UI that regeneration streaming starts (reuses streaming/start)
      this.core.sendMessage({
        messageId: generateMessageId('streaming-start'),
        messageType: 'streaming/start',
        timestamp: Date.now(),
        data: { requestId: regenRequestId, model: 'regeneration' }
      });

      // Send as a new chat request
      await this.handleChatRequest({
        requestId: regenRequestId,
        message: userMessage,
      });

      console.log(`✅ AIManager: Regeneration complete for ${data.messageId}`);

      performanceMonitor.end(`ai-regenerate-${data.messageId}`, {
        messageId: data.messageId,
        regenRequestId,
        success: true
      });

    } catch (error) {
      errorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        {
          component: 'AIManager',
          operation: 'regenerateResponse',
          metadata: { messageId: data.messageId }
        }
      );

      performanceMonitor.end(`ai-regenerate-${data.messageId}`, {
        messageId: data.messageId,
        error: true
      });
      throw error;
    }
  }

  /**
   * Get active request count
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Check if a request is active
   */
  isRequestActive(requestId: string): boolean {
    return this.activeRequests.has(requestId);
  }

  /**
   * Cleanup - stop all active requests
   */
  async cleanup(): Promise<void> {
    console.log(`🧹 AIManager: Cleaning up ${this.activeRequests.size} active requests`);

    // Abort all active requests
    for (const [requestId, controller] of this.activeRequests.entries()) {
      console.log(`🛑 AIManager: Aborting request: ${requestId}`);
      controller.abort();
    }

    this.activeRequests.clear();
    console.log('✅ AIManager: Cleanup complete');
  }
}
