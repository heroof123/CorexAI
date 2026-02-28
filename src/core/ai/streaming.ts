// core/ai/streaming.ts
// Streaming Handler - Manages token-by-token streaming

import { CoreEngine } from '../index';
import { generateMessageId } from '../protocol';

/**
 * Streaming Handler
 * Handles streaming responses from AI models
 */
export class StreamingHandler {
  private core: CoreEngine;

  constructor(core: CoreEngine) {
    this.core = core;
    console.log('🌊 StreamingHandler: Initialized');
  }

  /**
   * Stream a response from AI
   * Uses token-by-token streaming from Rust backend when available
   */
  async streamResponse(options: {
    requestId: string;
    message: string;
    context?: string[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    signal: AbortSignal;
  }): Promise<void> {
    const { requestId, message, context, model, signal } = options;
    const startTime = Date.now();

    console.log(`🌊 StreamingHandler: Starting stream for request: ${requestId}`);

    try {
      // Get AI response using existing aiProvider
      const response = await this.getAIResponse(message, model, context, signal);

      // Check if aborted
      if (signal.aborted) {
        throw new Error('AbortError');
      }

      // Stream word by word (smooth animation)
      await this.streamWordByWord(requestId, response, signal);

      // Send complete message
      const duration = Date.now() - startTime;
      this.core.sendMessage({
        messageId: generateMessageId('streaming-complete'),
        messageType: 'streaming/complete',
        timestamp: Date.now(),
        data: {
          requestId,
          fullResponse: response,
          tokensUsed: this.estimateTokens(response),
          duration
        }
      });

      console.log(`✅ StreamingHandler: Stream completed in ${duration}ms`);
    } catch (error) {
      if (error instanceof Error && error.message === 'AbortError') {
        console.log(`🛑 StreamingHandler: Stream aborted: ${requestId}`);
        throw error; // Re-throw to be handled by AIManager
      }

      console.error(`❌ StreamingHandler: Stream error:`, error);
      throw error;
    }
  }

  /**
   * Get AI response using existing aiProvider
   */
  private async getAIResponse(
    message: string,
    model?: string,
    context?: string[],
    signal?: AbortSignal
  ): Promise<string> {
    // Dynamic import to avoid circular dependencies
    const { callAI } = await import('../../services/ai');

    // Check if aborted before making request
    if (signal?.aborted) {
      throw new Error('AbortError');
    }

    // Prepare conversation history
    const history = [
      { role: 'user', content: message }
    ];

    // Add context if provided
    if (context && context.length > 0) {
      const contextMessage = `Context:\n${context.join('\n\n')}`;
      history.unshift({ role: 'system', content: contextMessage });
    }

    // Call AI - model undefined ise callAI otomatik aktif model seçecek
    const response = await callAI(message, model || '', history);

    return response;
  }

  /**
   * Stream response word by word
   */
  private async streamWordByWord(
    requestId: string,
    response: string,
    signal: AbortSignal
  ): Promise<void> {
    const words = response.split(' ');
    let accumulated = '';

    for (let i = 0; i < words.length; i++) {
      // Check if aborted
      if (signal.aborted) {
        throw new Error('AbortError');
      }

      // Add word to accumulated text
      accumulated += (i > 0 ? ' ' : '') + words[i];

      // Send token message
      this.core.sendMessage({
        messageId: generateMessageId('streaming-token'),
        messageType: 'streaming/token',
        timestamp: Date.now(),
        data: {
          requestId,
          token: words[i],
          accumulated
        }
      });

      // Delay for smooth animation (30ms per word)
      await this.delay(30);
    }
  }

  /**
   * Estimate token count (simple approximation)
   */
  private estimateTokens(text: string): number {
    // Simple estimation: words * 1.3
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 1.3);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Phase 7: Real token streaming from Rust backend
   */
  async streamTokenByToken(options: {
    requestId: string;
    message: string;
    model?: string;
    signal: AbortSignal;
  }): Promise<void> {
    const { requestId, message, model, signal } = options;
    const { listen } = await import('@tauri-apps/api/event');
    const { invoke } = await import('@tauri-apps/api/core');

    let accumulated = '';

    // Listen to stream tokens
    const unlisten = await listen<{ token: string, is_complete: boolean }>('stream-token', (event) => {
      if (signal.aborted) {
        unlisten();
        return;
      }

      accumulated += event.payload.token;

      this.core.sendMessage({
        messageId: generateMessageId('streaming-token'),
        messageType: 'streaming/token',
        timestamp: Date.now(),
        data: {
          requestId,
          token: event.payload.token,
          accumulated
        }
      });

      if (event.payload.is_complete) {
        unlisten();
      }
    });

    // Start streaming request to backend
    try {
      await invoke('chat_with_streaming', {
        request: {
          prompt: message,
          model_path: model,
          max_tokens: 2000,
          temperature: 0.7
        }
      });
    } catch (e) {
      unlisten();
      throw e;
    }
  }
}
