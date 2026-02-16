// services/realStreaming.ts
// Real streaming implementation using Tauri events

import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export interface StreamingCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

export interface StreamingRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
}

/**
 * Real streaming chat using Tauri events
 * This is the Cursor-like streaming implementation
 */
export async function chatWithRealStreaming(
  request: StreamingRequest,
  callbacks: StreamingCallbacks
): Promise<string> {
  let fullResponse = "";
  let unlistenToken: UnlistenFn | null = null;
  let unlistenComplete: UnlistenFn | null = null;
  let unlistenStart: UnlistenFn | null = null;

  try {
    // Setup event listeners
    unlistenStart = await listen("stream-start", () => {
      console.log("🌊 Stream started");
      callbacks.onStart?.();
    });

    unlistenToken = await listen<{ token: string; is_complete: boolean }>(
      "stream-token",
      (event) => {
        const { token, is_complete } = event.payload;

        if (!is_complete && token) {
          fullResponse += token;
          callbacks.onToken?.(token);
        }
      }
    );

    unlistenComplete = await listen<string>("stream-complete", (event) => {
      console.log("✅ Stream complete");
      callbacks.onComplete?.(event.payload);
    });

    // Start streaming
    const result = await invoke<string>("chat_with_streaming", {
      request: {
        prompt: request.prompt,
        max_tokens: request.max_tokens || 2000,
        temperature: request.temperature || 0.7,
      },
    });

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ Streaming error:", errorMsg);
    callbacks.onError?.(errorMsg);
    throw error;
  } finally {
    // Cleanup listeners
    unlistenStart?.();
    unlistenToken?.();
    unlistenComplete?.();
  }
}

/**
 * HTTP streaming (for LM Studio, Ollama)
 */
export async function chatWithHttpStreaming(
  baseUrl: string,
  request: StreamingRequest,
  callbacks: StreamingCallbacks
): Promise<string> {
  let fullResponse = "";
  let unlistenToken: UnlistenFn | null = null;
  let unlistenComplete: UnlistenFn | null = null;
  let unlistenStart: UnlistenFn | null = null;

  try {
    // Setup event listeners
    unlistenStart = await listen("stream-start", () => {
      console.log("🌊 HTTP Stream started");
      callbacks.onStart?.();
    });

    unlistenToken = await listen<{ token: string; is_complete: boolean }>(
      "stream-token",
      (event) => {
        const { token, is_complete } = event.payload;

        if (!is_complete && token) {
          fullResponse += token;
          callbacks.onToken?.(token);
        }
      }
    );

    unlistenComplete = await listen<string>("stream-complete", (event) => {
      console.log("✅ HTTP Stream complete");
      callbacks.onComplete?.(event.payload);
    });

    // Start HTTP streaming
    const result = await invoke<string>("chat_with_http_streaming", {
      baseUrl,
      request: {
        prompt: request.prompt,
        max_tokens: request.max_tokens || 2000,
        temperature: request.temperature || 0.7,
      },
    });

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ HTTP Streaming error:", errorMsg);
    callbacks.onError?.(errorMsg);
    throw error;
  } finally {
    // Cleanup listeners
    unlistenStart?.();
    unlistenToken?.();
    unlistenComplete?.();
  }
}

/**
 * Helper: Create a streaming message updater
 */
export function createStreamingMessageUpdater(
  onUpdate: (text: string) => void
): StreamingCallbacks {
  let accumulated = "";

  return {
    onStart: () => {
      accumulated = "";
      onUpdate("");
    },
    onToken: (token: string) => {
      accumulated += token;
      onUpdate(accumulated);
    },
    onComplete: (fullText: string) => {
      accumulated = fullText;
      onUpdate(fullText);
    },
    onError: (error: string) => {
      console.error("Streaming error:", error);
    },
  };
}
