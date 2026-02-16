// Streaming AI Response Provider
import { invoke } from "@tauri-apps/api/core";

export interface StreamingConfig {
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

// Simulated streaming (chunk-based)
// Gerçek streaming için Rust backend'de event emit gerekli
export async function chatWithStreaming(
  prompt: string,
  maxTokens: number,
  temperature: number,
  config: StreamingConfig
): Promise<string> {
  try {
    // Şimdilik: Tüm cevabı al, sonra chunk'lara böl
    const fullResponse = await invoke<string>('chat_with_gguf_model', {
      prompt,
      maxTokens,
      temperature
    });

    // Simulate streaming by splitting into words
    if (config.onToken) {
      const words = fullResponse.split(' ');
      let accumulated = '';
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        accumulated += (i > 0 ? ' ' : '') + word;
        
        // Emit token
        config.onToken(accumulated);
        
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }

    if (config.onComplete) {
      config.onComplete(fullResponse);
    }

    return fullResponse;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (config.onError) {
      config.onError(errorMsg);
    }
    throw error;
  }
}

// Chunk-based streaming (better simulation)
export async function chatWithChunkedStreaming(
  prompt: string,
  maxTokens: number,
  temperature: number,
  config: StreamingConfig
): Promise<string> {
  try {
    const fullResponse = await invoke<string>('chat_with_gguf_model', {
      prompt,
      maxTokens,
      temperature
    });

    // Split into chunks for smoother streaming (not character by character)
    if (config.onToken) {
      let accumulated = '';
      const chars = fullResponse.split('');
      
      // 🔥 FIXED: Chunk size artırıldı (5 karakter), delay azaltıldı (2ms)
      // Bu sayede daha az güncelleme, daha az jitter
      const chunkSize = 5; // 5 karakter birden
      
      for (let i = 0; i < chars.length; i += chunkSize) {
        const chunk = chars.slice(i, i + chunkSize).join('');
        accumulated += chunk;
        config.onToken(accumulated);
        
        // Daha az delay - daha smooth
        await new Promise(resolve => setTimeout(resolve, 2));
      }
    }

    if (config.onComplete) {
      config.onComplete(fullResponse);
    }

    return fullResponse;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (config.onError) {
      config.onError(errorMsg);
    }
    throw error;
  }
}
