# Task 15: GGUF Direct Support - Hibrit AI Sistemi

## Hedef

LM Studio/Ollama olmadan GGUF dosyalarını direkt çalıştırma desteği ekle.

## Yapılanlar

### 1. Rust Backend (GGUF Manager)

**Dosyalar:**
- ✅ `src-tauri/Cargo.toml` - llama-cpp-2 dependency eklendi
- ✅ `src-tauri/src/gguf_manager.rs` - GGUF model manager
- ✅ `src-tauri/src/commands.rs` - Tauri commands
- ✅ `src-tauri/src/main.rs` - Module ve state eklendi

**Özellikler:**
- Model yükleme (load_gguf_model)
- Chat (chat_with_gguf_model)
- Model unload (unload_gguf_model)
- Status kontrolü (get_gguf_model_status)

### 2. TypeScript Frontend (GGUF Provider)

**Dosyalar:**
- ✅ `src/services/ggufProvider.ts` - GGUF API wrapper
- ✅ `src/components/AISettings.tsx` - GGUF provider eklendi

**Özellikler:**
- Model yükleme
- Chat
- Dosya seçme (dialog)
- Status kontrolü

### 3. Hibrit Sistem

Artık 3 mod destekleniyor:

**1. LM Studio (Mevcut)**
```
Icon: 🖥️
URL: http://localhost:1234/v1
Durum: Aktif
```

**2. Ollama (Yeni)**
```
Icon: 🦙
URL: http://localhost:11434/v1
Durum: Pasif
```

**3. GGUF Direct (Yeni!)**
```
Icon: 📦
URL: internal://gguf
Durum: Pasif
Özellik: LM Studio/Ollama gerekmez!
```

## Kullanım

### Model Yükle:
```typescript
import { loadGgufModel } from './ggufProvider';

await loadGgufModel({
  modelPath: "/path/to/model.gguf",
  contextLength: 32768,
  gpuLayers: 35,
  temperature: 0.7,
  maxTokens: 512
});
```

### Chat:
```typescript
import { chatWithGgufModel } from './ggufProvider';

const response = await chatWithGgufModel(
  "Merhaba",
  512,  // max tokens
  0.7   // temperature
);
```

## Avantajlar

✅ LM Studio/Ollama gerekmez
✅ Tek executable
✅ Daha hızlı başlangıç
✅ Daha fazla kontrol
✅ Offline çalışır

## Dezavantajlar

❌ Daha karmaşık build
❌ Daha büyük executable (~50-100 MB)
❌ İlk yükleme yavaş (5-10 saniye)

## Build Durumu

⏳ Build devam ediyor...
- llama.cpp compile ediliyor
- İlk build: 5-10 dakika
- Sonraki buildler: 1-2 dakika

## Sonraki Adımlar

1. ⏳ Build tamamlanmasını bekle
2. 🔜 UI'da GGUF model seçme ekranı ekle
3. 🔜 Model yükleme progress bar
4. 🔜 GPU layer ayarı UI'da
5. 🔜 Context length ayarı UI'da

## Dokümantasyon

- `GGUF-DIRECT-SUPPORT.md` - Detaylı teknik dokümantasyon

## Test

Build tamamlandıktan sonra:

```bash
# Rust testleri
cd src-tauri
cargo test

# Uygulama çalıştır
npm run tauri dev
```

## Notlar

- llama.cpp compile süresi uzun (ilk build)
- GPU desteği için CUDA/Metal/Vulkan gerekli
- Model dosyası büyük (7B: ~4GB)
- İlk yükleme yavaş ama sonrası hızlı
