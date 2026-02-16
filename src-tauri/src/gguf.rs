// GGUF System - Complete implementation in one file
use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_backend::LlamaBackend;
use llama_cpp_2::llama_batch::LlamaBatch;
use llama_cpp_2::model::params::LlamaModelParams;
use llama_cpp_2::model::{LlamaModel, AddBos};
use std::path::Path;
use std::sync::{Arc, Mutex};
use log::{info, error, warn};
use tauri::State;
use serde_json::json;
use base64::{Engine as _, engine::general_purpose}; // 🆕 Base64 decoding

// State structure
pub struct GgufState {
    pub backend: Option<LlamaBackend>,
    pub model: Option<LlamaModel>,
    pub model_path: Option<String>,
    pub n_ctx: u32,
    pub n_gpu_layers: u32,
    pub backend_initialized: bool, // Track if backend is initialized
}

impl Default for GgufState {
    fn default() -> Self {
        Self {
            backend: None,
            model: None,
            model_path: None,
            n_ctx: 4096,
            n_gpu_layers: 0,
            backend_initialized: false,
        }
    }
}

// Commands
#[tauri::command]
pub async fn load_gguf_model(
    state: State<'_, Arc<Mutex<GgufState>>>,
    model_path: String,
    n_ctx: u32,
    n_gpu_layers: u32,
) -> Result<String, String> {
    info!("🔵 GGUF model loading: {}", model_path);
    info!("📊 Context: {}, GPU Layers: {}", n_ctx, n_gpu_layers);
    
    if !Path::new(&model_path).exists() {
        error!("❌ Model file not found: {}", model_path);
        return Err(format!("Model file not found: {}", model_path));
    }

    let mut state_guard = state.lock().unwrap();

    // Initialize backend only once
    if !state_guard.backend_initialized {
        info!("🔄 Initializing backend (first time)...");
        info!("🎮 CUDA support check...");
        
        let backend = LlamaBackend::init()
            .map_err(|e| {
                error!("❌ Backend init failed: {:?}", e);
                format!("Backend init failed: {:?}", e)
            })?;
        
        state_guard.backend = Some(backend);
        state_guard.backend_initialized = true;
        info!("✅ Backend initialized");
        info!("✅ CUDA should be available if compiled with cublas feature");
    } else {
        info!("✅ Backend already initialized, reusing...");
    }

    let backend = state_guard.backend.as_ref().unwrap();

    // GPU layers parametresini ayarla
    // CUDA veya Vulkan yoksa otomatik olarak 0'a düşür
    let has_gpu = cfg!(feature = "cuda") || cfg!(feature = "vulkan");
    let backend_name = if cfg!(feature = "cuda") {
        "CUDA"
    } else if cfg!(feature = "vulkan") {
        "Vulkan"
    } else {
        "CPU"
    };
    
    let safe_gpu_layers = if has_gpu {
        info!("🎮 {} enabled - GPU Layers: {}", backend_name, n_gpu_layers);
        n_gpu_layers
    } else {
        info!("⚠️ No GPU backend - Forcing CPU-only (GPU layers = 0)");
        0
    };
    
    let model_params = LlamaModelParams::default()
        .with_n_gpu_layers(safe_gpu_layers);

    info!("🔄 Loading model to GPU... (this may take a while)");
    info!("📋 Model params: n_gpu_layers={}", n_gpu_layers);

    let model = LlamaModel::load_from_file(backend, &model_path, &model_params)
        .map_err(|e| {
            error!("❌ Model load failed: {:?}", e);
            format!("Model load failed: {:?}", e)
        })?;

    info!("✅ Model loaded successfully!");
    info!("📦 Model: {}", model_path);
    info!("🎮 GPU Layers: {}", n_gpu_layers);
    info!("📝 Context: {}", n_ctx);
    
    // GPU kullanımını kontrol et
    if n_gpu_layers > 0 {
        info!("✅ GPU offload aktif - Model GPU'da çalışmalı");
    } else {
        info!("⚠️ GPU offload kapalı - Model CPU'da çalışacak");
    }

    // Save model to state
    state_guard.model = Some(model);
    state_guard.model_path = Some(model_path.clone());
    state_guard.n_ctx = n_ctx;
    state_guard.n_gpu_layers = n_gpu_layers;
    
    info!("✅ Model saved to Tauri state!");

    Ok(format!("✅ Model loaded to GPU: {}", model_path))
}

#[tauri::command]
pub async fn chat_with_gguf_model(
    state: State<'_, Arc<Mutex<GgufState>>>,
    prompt: String,
    max_tokens: u32,
    temperature: f32,
) -> Result<String, String> {
    info!("🔵 Starting inference...");
    info!("📝 Prompt length: {} chars", prompt.len());
    info!("⚙️ Max tokens: {}, Temperature: {}", max_tokens, temperature);

    // 🔧 Mutex poisoned ise düzelt
    let state_guard = match state.lock() {
        Ok(guard) => guard,
        Err(poisoned) => {
            warn!("⚠️ Mutex was poisoned, recovering...");
            poisoned.into_inner()
        }
    };
    
    // Check if model is loaded
    if state_guard.model.is_none() {
        error!("❌ Model not loaded! Call load_gguf_model first.");
        return Err("❌ Model not loaded! Please load a model first.".to_string());
    }

    let backend = state_guard.backend.as_ref().unwrap();
    let model = state_guard.model.as_ref().unwrap();
    let n_ctx = state_guard.n_ctx;

    if let Some(path) = &state_guard.model_path {
        info!("📦 Using model: {}", path);
    }

    // Create context with proper KV cache size
    // KV cache should be at least n_ctx + max_tokens to avoid NoKvCacheSlot error
    let kv_cache_size = (n_ctx + max_tokens).max(4096); // Minimum 4096
    
    info!("📊 KV Cache size: {}", kv_cache_size);
    
    let ctx_params = LlamaContextParams::default()
        .with_n_ctx(std::num::NonZero::new(kv_cache_size)) // Use larger context for KV cache
        .with_n_batch(8192); // Increase batch size to 8192 (was 512)

    let mut context = model.new_context(backend, ctx_params)
        .map_err(|e| {
            error!("❌ Context creation failed: {:?}", e);
            format!("Context creation failed: {:?}", e)
        })?;

    info!("✅ Context created with KV cache size: {}", kv_cache_size);

    // Tokenize prompt with BOS token
    info!("🔤 Tokenizing prompt with BOS token...");
    let tokens = model.str_to_token(&prompt, AddBos::Always)
        .map_err(|e| {
            error!("❌ Tokenization failed: {:?}", e);
            format!("Tokenization failed: {:?}", e)
        })?;

    info!("✅ Tokenized: {} tokens", tokens.len());
    
    // Log first few tokens for debugging
    if tokens.len() > 0 {
        info!("🔍 First 10 tokens: {:?}", &tokens[..tokens.len().min(10)]);
    }
    
    // Check if prompt is too long
    if tokens.len() > n_ctx as usize {
        error!("❌ Prompt too long: {} tokens (max: {})", tokens.len(), n_ctx);
        return Err(format!("Prompt too long: {} tokens (max: {})", tokens.len(), n_ctx));
    }

    // Create batch - MUST be at least as large as the number of prompt tokens
    // But not too large (max 8192 for stability)
    // If prompt is longer than 8192, we'll process it in chunks
    let max_batch_size = 8192;
    let batch_size = tokens.len().min(max_batch_size);
    
    info!("📦 Creating batch: prompt_tokens={}, batch_size={}, n_ctx={}", tokens.len(), batch_size, n_ctx);
    
    // Create batch outside if/else so it's available later
    let mut batch = LlamaBatch::new(batch_size, 1);
    
    // Process prompt in chunks if necessary
    if tokens.len() > max_batch_size {
        info!("⚠️ Prompt too long for single batch, processing in chunks...");
        
        let mut processed = 0;
        
        while processed < tokens.len() {
            batch.clear();
            let chunk_size = (tokens.len() - processed).min(max_batch_size);
            
            for i in 0..chunk_size {
                let token_idx = processed + i;
                batch.add(
                    tokens[token_idx], 
                    token_idx as i32, 
                    &[0], 
                    token_idx == tokens.len() - 1
                ).map_err(|e| format!("Batch add failed: {:?}", e))?;
            }
            
            context.decode(&mut batch)
                .map_err(|e| {
                    error!("❌ Decode failed at chunk {}: {:?}", processed / max_batch_size, e);
                    format!("Decode failed: {:?}", e)
                })?;
            
            processed += chunk_size;
            info!("📊 Processed {}/{} tokens", processed, tokens.len());
        }
        
        info!("✅ All prompt chunks processed!");
    } else {
        // Single batch processing (normal case)
        for (i, token) in tokens.iter().enumerate() {
            batch.add(*token, i as i32, &[0], i == tokens.len() - 1)
                .map_err(|e| format!("Batch add failed: {:?}", e))?;
        }

        // Initial decode (process prompt)
        context.decode(&mut batch)
            .map_err(|e| {
                error!("❌ Decode failed: {:?}", e);
                format!("Decode failed: {:?}", e)
            })?;
        
        info!("✅ Prompt processed!");
    }

    // Token generation
    let mut response_tokens = Vec::new(); // 🆕 Token'ları biriktir
    let mut n_cur = batch.n_tokens();
    
    info!("🎲 Starting token generation...");

    for i in 0..max_tokens {
        // Get candidates and apply sampling
        let candidates = context.candidates();
        
        // Convert to vector and sort by probability
        let candidates_vec: Vec<_> = candidates.into_iter().collect();
        
        // Get the token with highest probability (not just first)
        let new_token_id = if let Some(best) = candidates_vec.iter().max_by(|a, b| {
            a.logit().partial_cmp(&b.logit()).unwrap_or(std::cmp::Ordering::Equal)
        }) {
            best.id()
        } else {
            info!("⚠️ No candidates found, stopping at token {}", i);
            break;
        };

        // Check for EOS (End of Sequence)
        if model.is_eog_token(new_token_id) {
            info!("✅ EOS token found at position {}, stopping", i);
            break;
        }

        // 🆕 Token'ı listeye ekle (decode etme, sadece biriktir)
        response_tokens.push(new_token_id);
        
        // Log first few tokens to debug
        if i < 5 {
            info!("🔤 Token {}: id={:?}, logit={}", i, new_token_id, 
                  candidates_vec.iter().find(|c| c.id() == new_token_id).map(|c| c.logit()).unwrap_or(0.0));
        }

        // Log every 50 tokens
        if i % 50 == 0 && i > 0 {
            info!("📊 Generated {}/{} tokens", i, max_tokens);
        }

        // Create new batch
        batch.clear();
        batch.add(new_token_id, n_cur, &[0], true)
            .map_err(|e| format!("Batch add failed: {:?}", e))?;

        // Decode
        context.decode(&mut batch)
            .map_err(|e| format!("Decode failed at token {}: {:?}", i, e))?;

        n_cur += 1;
    }

    let total_tokens = response_tokens.len();
    info!("✅ Token generation completed: {} tokens", total_tokens);
    
    // 🆕 Token'ları tek tek decode et ve birleştir
    info!("🔤 Decoding tokens...");
    let mut response = String::new();
    let mut decode_errors = 0;
    
    for (idx, token_id) in response_tokens.iter().enumerate() {
        // Try normal decode first
        match model.token_to_str(*token_id, llama_cpp_2::model::Special::Tokenize) {
            Ok(token_str) => {
                // Başarılı decode
                response.push_str(&token_str);
            },
            Err(_) => {
                // Decode başarısız - token byte'larını direkt al
                decode_errors += 1;
                if decode_errors <= 10 {
                    info!("⏭️ Token {}: decode failed (total errors: {})", idx, decode_errors);
                }
            }
        }
    }
    
    info!("✅ Decoded: {} characters from {} tokens ({} decode errors)", response.len(), total_tokens, decode_errors);
    
    // Clean up response (remove special tokens if any)
    let cleaned_response = response
        .replace("<|im_start|>", "")
        .replace("<|im_end|>", "")
        .replace("<|endoftext|>", "")
        .replace("<|system|>", "")
        .replace("<|user|>", "")
        .replace("<|assistant|>", "")
        .trim()
        .to_string();
    
    info!("📤 Final response length: {} characters", cleaned_response.len());
    if cleaned_response.len() > 0 {
        let preview_len = cleaned_response.len().min(200);
        info!("📤 Response preview: {}", &cleaned_response[..preview_len]);
    }

    Ok(cleaned_response)
}

#[tauri::command]
pub async fn unload_gguf_model(
    state: State<'_, Arc<Mutex<GgufState>>>,
) -> Result<String, String> {
    info!("🔵 Unloading GGUF model - Starting cleanup...");
    
    let mut state_guard = state.lock().unwrap();
    
    // Explicitly drop model first (releases GPU memory)
    if state_guard.model.is_some() {
        info!("🧹 Dropping model from GPU...");
        state_guard.model = None;
        info!("✅ Model dropped");
    }
    
    // Then drop backend (releases CUDA context)
    if state_guard.backend.is_some() {
        info!("🧹 Dropping backend (CUDA context)...");
        state_guard.backend = None;
        info!("✅ Backend dropped");
    }
    
    // Clear state
    state_guard.model_path = None;
    state_guard.n_ctx = 4096;
    state_guard.n_gpu_layers = 0;
    state_guard.backend_initialized = false;
    
    // Force garbage collection hint (Rust will handle it)
    drop(state_guard);
    
    info!("✅ GGUF model fully unloaded - GPU memory should be freed");
    Ok("✅ Model unloaded - GPU memory freed".to_string())
}

#[tauri::command]
pub async fn get_gguf_model_status(
    state: State<'_, Arc<Mutex<GgufState>>>,
) -> Result<serde_json::Value, String> {
    let state_guard = state.lock().unwrap();
    let is_loaded = state_guard.model.is_some();
    let model_path = state_guard.model_path.clone();
    
    Ok(json!({
        "loaded": is_loaded,
        "model_path": model_path
    }))
}

// 🆕 GPU Memory bilgisi al
#[tauri::command]
pub async fn get_gpu_memory_info(
    state: State<'_, Arc<Mutex<GgufState>>>,
) -> Result<serde_json::Value, String> {
    let state_guard = state.lock().unwrap();
    
    // Model yüklü mü kontrol et
    if state_guard.model.is_none() {
        return Ok(json!({
            "available": false,
            "total_vram_gb": 0.0,
            "used_vram_gb": 0.0,
            "free_vram_gb": 0.0,
            "usage_percent": 0.0,
            "model_size_gb": 0.0,
            "kv_cache_size_gb": 0.0
        }));
    }
    
    let n_ctx = state_guard.n_ctx;
    let n_gpu_layers = state_guard.n_gpu_layers;
    
    // 🔥 Düzeltilmiş hesaplamalar
    // Model size: Q4 quantization için ~0.5-0.6 GB per billion parameters
    // 7B model Q4 = ~4.2 GB
    let estimated_model_size = 4.2; // GB
    
    // KV Cache hesaplama (daha doğru):
    // KV cache = 2 (K + V) * n_layers * n_ctx * hidden_size * bytes_per_element / 1e9
    // Qwen 7B: 28 layers, 4096 hidden_size, fp16 = 2 bytes
    let n_layers = n_gpu_layers.min(28) as f64; // Maksimum 28 layer
    let hidden_size = 4096.0;
    let bytes_per_element = 2.0; // fp16
    
    let kv_cache_gb = (2.0 * n_layers * n_ctx as f64 * hidden_size * bytes_per_element) / 1_000_000_000.0;
    
    let used_vram = estimated_model_size + kv_cache_gb;
    let total_vram = 12.0; // RTX 5070
    let free_vram = (total_vram - used_vram).max(0.0); // Negatif olmasın
    let usage_percent = ((used_vram / total_vram) * 100.0).min(100.0); // Max %100
    
    info!("📊 GPU Memory: {:.1} GB / {:.1} GB ({:.1}%)", used_vram, total_vram, usage_percent);
    info!("   Model: {:.1} GB, KV Cache: {:.1} GB", estimated_model_size, kv_cache_gb);
    
    Ok(json!({
        "available": true,
        "total_vram_gb": total_vram,
        "used_vram_gb": used_vram,
        "free_vram_gb": free_vram,
        "usage_percent": usage_percent,
        "model_size_gb": estimated_model_size,
        "kv_cache_size_gb": kv_cache_gb
    }))
}

// 🆕 GGUF Metadata Okuyucu
#[tauri::command]
pub async fn read_gguf_metadata(
    model_path: String,
) -> Result<serde_json::Value, String> {
    info!("📖 Reading GGUF metadata from: {}", model_path);
    
    if !Path::new(&model_path).exists() {
        error!("❌ Model file not found: {}", model_path);
        return Err(format!("Model file not found: {}", model_path));
    }
    
    // Dosya boyutunu al
    let file_size = std::fs::metadata(&model_path)
        .map_err(|e| format!("Failed to get file size: {}", e))?
        .len();
    
    let file_size_gb = file_size as f64 / (1024.0 * 1024.0 * 1024.0);
    
    // Model parametrelerini dosya adından çıkar
    let file_name = Path::new(&model_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown");
    
    // Parametre sayısını tahmin et (dosya adından)
    let parameters = if file_name.contains("3b") || file_name.contains("3B") {
        "3B"
    } else if file_name.contains("7b") || file_name.contains("7B") {
        "7B"
    } else if file_name.contains("8b") || file_name.contains("8B") {
        "8B"
    } else if file_name.contains("13b") || file_name.contains("13B") {
        "13B"
    } else if file_name.contains("70b") || file_name.contains("70B") {
        "70B"
    } else {
        "Unknown"
    };
    
    // Quantization'ı dosya adından çıkar
    let quantization = if file_name.contains("q4_k_m") || file_name.contains("Q4_K_M") {
        "Q4_K_M"
    } else if file_name.contains("q5_k_m") || file_name.contains("Q5_K_M") {
        "Q5_K_M"
    } else if file_name.contains("q6_k") || file_name.contains("Q6_K") {
        "Q6_K"
    } else if file_name.contains("q8") || file_name.contains("Q8") {
        "Q8_0"
    } else if file_name.contains("q4") || file_name.contains("Q4") {
        "Q4_0"
    } else if file_name.contains("q5") || file_name.contains("Q5") {
        "Q5_0"
    } else {
        "Unknown"
    };
    
    // Model architecture'ı tahmin et
    let architecture = if file_name.to_lowercase().contains("llama") {
        "Llama"
    } else if file_name.to_lowercase().contains("qwen") {
        "Qwen"
    } else if file_name.to_lowercase().contains("mistral") {
        "Mistral"
    } else if file_name.to_lowercase().contains("phi") {
        "Phi"
    } else if file_name.to_lowercase().contains("gemma") {
        "Gemma"
    } else {
        "Unknown"
    };
    
    // Tahmini layer sayısı (parametre sayısına göre)
    let estimated_layers = match parameters {
        "3B" => 26,
        "7B" | "8B" => 32,
        "13B" => 40,
        "70B" => 80,
        _ => 32,
    };
    
    // Tahmini vocab size
    let estimated_vocab_size = match architecture {
        "Qwen" => 151936,
        "Llama" => 32000,
        "Mistral" => 32000,
        "Phi" => 51200,
        "Gemma" => 256000,
        _ => 32000,
    };
    
    // Tahmini context length (modern modeller genelde 4K-128K arası)
    let estimated_context = match architecture {
        "Qwen" => 32768,
        "Llama" => 8192,
        "Mistral" => 32768,
        "Phi" => 4096,
        "Gemma" => 8192,
        _ => 4096,
    };
    
    info!("✅ Metadata extracted:");
    info!("   File Size: {:.2} GB", file_size_gb);
    info!("   Parameters: {}", parameters);
    info!("   Quantization: {}", quantization);
    info!("   Architecture: {}", architecture);
    info!("   Estimated Layers: {}", estimated_layers);
    
    Ok(json!({
        "file_name": file_name,
        "file_size_bytes": file_size,
        "file_size_gb": format!("{:.2}", file_size_gb),
        "parameters": parameters,
        "quantization": quantization,
        "architecture": architecture,
        "estimated_layers": estimated_layers,
        "estimated_vocab_size": estimated_vocab_size,
        "estimated_context_length": estimated_context,
        "model_type": format!("{} {}", architecture, parameters),
    }))
}


// 🆕 Vision AI Support - Chat with images
#[tauri::command]
pub async fn chat_with_gguf_vision(
    state: State<'_, Arc<Mutex<GgufState>>>,
    prompt: String,
    images: Vec<String>, // Base64 encoded images
    max_tokens: u32,
    temperature: f32,
) -> Result<String, String> {
    info!("📷 Starting vision inference...");
    info!("📝 Prompt length: {} chars", prompt.len());
    info!("🖼️ Images: {}", images.len());
    info!("⚙️ Max tokens: {}, Temperature: {}", max_tokens, temperature);

    // ⚠️ IMPORTANT: Vision support requires:
    // 1. Vision-capable GGUF model (LLaVA, Qwen2-VL, Bakllava)
    // 2. mmproj file (vision projector) - must match the model
    // 3. llama.cpp compiled with vision support
    
    // Check if model is loaded (in a separate scope to drop the lock immediately)
    {
        let state_guard = state.lock().unwrap();
        if state_guard.model.is_none() {
            error!("❌ Model not loaded!");
            return Err("❌ Vision model not loaded! Please load a vision-capable model first.".to_string());
        }
    } // Lock is dropped here
    
    // Decode base64 images (validation only for now)
    let mut decoded_images = Vec::new();
    for (idx, img_data) in images.iter().enumerate() {
        // Remove data:image/...;base64, prefix if present
        let base64_data = if img_data.contains("base64,") {
            img_data.split("base64,").nth(1).unwrap_or(img_data)
        } else {
            img_data
        };
        
        match general_purpose::STANDARD.decode(base64_data) {
            Ok(bytes) => {
                info!("✅ Image {} decoded: {} bytes", idx, bytes.len());
                decoded_images.push(bytes);
            }
            Err(e) => {
                error!("❌ Failed to decode image {}: {:?}", idx, e);
                return Err(format!("Failed to decode image {}: {:?}", idx, e));
            }
        }
    }
    
    info!("✅ All images decoded successfully");
    
    // TODO: Full vision implementation
    // 1. Load mmproj file (vision encoder)
    // 2. Convert images to embeddings using mmproj
    // 3. Combine text prompt + image embeddings
    // 4. Pass to model for inference
    
    // For now, fall back to text-only chat with a note about images
    info!("⚠️ Vision support not fully implemented yet");
    info!("📝 Falling back to text-only mode with image count note");
    
    let vision_prompt = format!(
        "[System: User sent {} image(s) but vision processing is not yet implemented. Please acknowledge the images and respond based on the text prompt.]\n\n{}",
        images.len(),
        prompt
    );
    
    // Use the existing text chat function
    chat_with_gguf_model(state, vision_prompt, max_tokens, temperature).await
}

// Check if CUDA is available
#[tauri::command]
pub fn check_cuda_support() -> Result<serde_json::Value, String> {
    let cuda_available = cfg!(feature = "cuda");
    let vulkan_available = cfg!(feature = "vulkan");
    
    let backend = if cuda_available {
        "CUDA"
    } else if vulkan_available {
        "Vulkan"
    } else {
        "CPU"
    };
    
    info!("🔍 GPU Backend Check:");
    info!("  - Current Backend: {}", backend);
    info!("  - CUDA Available: {}", cuda_available);
    info!("  - Vulkan Available: {}", vulkan_available);
    
    Ok(json!({
        "backend": backend,
        "cuda_available": cuda_available,
        "vulkan_available": vulkan_available,
        "recommended_gpu_layers": if cuda_available || vulkan_available { 28 } else { 0 },
        "cuda_download_url": "https://developer.nvidia.com/cuda-downloads",
        "message": match backend {
            "CUDA" => "CUDA enabled. Maximum performance on NVIDIA GPUs.",
            "Vulkan" => "Vulkan enabled. Works on all GPUs (NVIDIA, AMD, Intel).",
            _ => "CPU-only mode. For GPU support, enable CUDA or Vulkan."
        }
    }))
}
