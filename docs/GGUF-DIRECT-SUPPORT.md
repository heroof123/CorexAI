# GGUF Direct Support - LM Studio/Ollama Olmadan Model Çalıştırma

## Özellik

Artık GGUF model dosyalarını **direkt** çalıştırabilirsiniz! LM Studio veya Ollama'ya gerek yok.

## Nasıl Çalışır?

### Rust Tarafı (Backend)

**llama.cpp binding** kullanarak GGUF dosyalarını direkt yükler ve çalıştırır:

```rust
// gguf_manager.rs
pub struct GgufModelManager {
    backend: LlamaBackend,
    model: Option<LlamaModel>,
    context: Option<LlamaContext>,
}

// Model yükle
manager.load_model("model.gguf", 32768, 35)?;

// Generate
let response = manager.generate("Merhaba", 512, 0.7)?;
```

### TypeScript Tarafı (Frontend)

```typescript
// ggufProvider.ts
import { loadGgufModel, chatWithGgufModel } from './ggufProvider';

// Model yükle
await loadGgufModel({
  modelPath: "/path/to/model.gguf",
  contextLength: 32768,
  gpuLayers: 35,
  temperature: 0.7,
  maxTokens: 512
});

// Chat
const response = await chatWithGgufModel("Merhaba", 512, 0.7);
```

## Kullanım

### 1. AI Settings'den GGUF Provider Seç

```
AI Ayarları → Providers → GGUF (Direkt)
```

### 2. GGUF Dosyası Seç

```typescript
import { selectGgufFile } from './ggufProvider';

const modelPath = await selectGgufFile();
// Kullanıcı .gguf dosyasını seçer
```

### 3. Model Yükle

```typescript
await loadGgufModel({
  modelPath: modelPath,
  contextLength: 32768,  // Context window
  gpuLayers: 35,         // GPU'da çalışacak layer sayısı
  temperature: 0.7,
  maxTokens: 512
});
```

### 4. Chat

```typescript
const response = await chatWithGgufModel(
  "Merhaba, nasılsın?",
  512,    // max tokens
  0.7     // temperature
);
```

## Avantajlar

### ✅ LM Studio/Ollama Gerekmez
- Harici program yok
- Tek executable
- Daha az RAM kullanımı

### ✅ Daha Hızlı Başlangıç
- Model direkt yüklenir
- API server yok
- Daha az overhead

### ✅ Daha Fazla Kontrol
- GPU layer sayısı ayarlanabilir
- Context length ayarlanabilir
- Temperature ayarlanabilir

### ✅ Offline Çalışır
- İnternet gerekmez
- Localhost server gerekmez
- Tamamen local

## Dezavantajlar

### ❌ Daha Karmaşık Build
- Rust dependencies
- Platform-specific build
- llama.cpp compile gerekli

### ❌ Daha Büyük Executable
- llama.cpp dahil
- ~50-100 MB daha büyük

### ❌ İlk Yükleme Yavaş
- Model RAM'e yüklenir
- 7B model: ~5-10 saniye
- 13B model: ~10-20 saniye

## Teknik Detaylar

### Dependencies

**Cargo.toml:**
```toml
[dependencies]
llama-cpp-2 = "0.1.77"
tokio = { version = "1", features = ["full"] }
```

### Rust Commands

```rust
// Model yükle
#[tauri::command]
pub async fn load_gguf_model(
    model_path: String,
    n_ctx: u32,
    n_gpu_layers: i32,
    state: State<'_, Mutex<Option<GgufModelManager>>>
) -> Result<String, String>

// Chat
#[tauri::command]
pub async fn chat_with_gguf_model(
    prompt: String,
    max_tokens: u32,
    temperature: f32,
    state: State<'_, Mutex<Option<GgufModelManager>>>
) -> Result<String, String>

// Unload
#[tauri::command]
pub async fn unload_gguf_model(
    state: State<'_, Mutex<Option<GgufModelManager>>>
) -> Result<String, String>

// Status
#[tauri::command]
pub async fn get_gguf_model_status(
    state: State<'_, Mutex<Option<GgufModelManager>>>
) -> Result<serde_json::Value, String>
```

### TypeScript API

```typescript
// Model yükle
export async function loadGgufModel(config: GgufModelConfig): Promise<string>

// Chat
export async function chatWithGgufModel(
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<string>

// Unload
export async function unloadGgufModel(): Promise<string>

// Status
export async function getGgufModelStatus(): Promise<GgufModelStatus>

// Dosya seç
export async function selectGgufFile(): Promise<string | null>
```

## Hibrit Sistem

Artık 3 mod var:

### 1. LM Studio (Mevcut)
```
✅ Kolay kurulum
✅ GUI var
❌ Harici program gerekli
```

### 2. Ollama (Yeni)
```
✅ Kolay kurulum
✅ Model yönetimi
❌ Harici program gerekli
```

### 3. GGUF Direct (Yeni!)
```
✅ Harici program yok
✅ Tek executable
❌ Daha karmaşık build
```

## Kullanıcı Seçer

```typescript
// AI Settings'de:
- "LM Studio kullan" → localhost:1234
- "Ollama kullan" → localhost:11434
- "GGUF dosyası yükle" → Direkt çalıştır
```

## Build

### Windows:
```bash
cd src-tauri
cargo build --release
```

### Linux:
```bash
cd src-tauri
cargo build --release
```

### macOS:
```bash
cd src-tauri
cargo build --release
```

## Test

```bash
# Rust testleri
cd src-tauri
cargo test

# Model yükle testi
cargo run --example load_model
```

## Performans

### 7B Model (Qwen 2.5 Coder):
- Yükleme: ~5-10 saniye
- İlk token: ~100-200ms
- Sonraki tokenlar: ~50-100ms
- RAM: ~8-10 GB
- VRAM (GPU): ~6-8 GB

### 13B Model:
- Yükleme: ~10-20 saniye
- İlk token: ~200-400ms
- Sonraki tokenlar: ~100-200ms
- RAM: ~16-20 GB
- VRAM (GPU): ~12-16 GB

## Gelecek İyileştirmeler

1. ✅ Model cache (hızlı yeniden yükleme)
2. ✅ Streaming support (token by token)
3. ✅ Multiple model support (aynı anda birden fazla)
4. ✅ Model quantization (daha az RAM)
5. ✅ GPU optimization (daha hızlı)

## Dosyalar

- ✅ `local-ai/src-tauri/Cargo.toml` - Dependencies
- ✅ `local-ai/src-tauri/src/gguf_manager.rs` - GGUF Manager
- ✅ `local-ai/src-tauri/src/commands.rs` - Tauri commands
- ✅ `local-ai/src-tauri/src/main.rs` - Main entry
- ✅ `local-ai/src/services/ggufProvider.ts` - TypeScript API
- ✅ `local-ai/src/components/AISettings.tsx` - UI

## Notlar

- llama.cpp compile süresi uzun olabilir (ilk build: 5-10 dakika)
- GPU desteği için CUDA/Metal/Vulkan gerekli
- Model dosyası büyük olabilir (7B: ~4GB, 13B: ~8GB)
- İlk yükleme yavaş ama sonrası hızlı
