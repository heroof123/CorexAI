# Vision AI Support - Resim Analizi

## 📷 Durum: BETA (Kısmi Implementasyon)

Vision AI desteği eklendi! Kullanıcılar artık chat'e resim yükleyebilir ve AI'ya gösterebilir.

## ✅ Tamamlanan Özellikler

### Frontend (100% Tamamlandı)
- ✅ Resim yükleme butonu (📷 icon)
- ✅ Multi-image support (birden fazla resim)
- ✅ Base64 encoding
- ✅ Resim preview ve silme
- ✅ Format: `[IMAGES:n]\n[IMAGE_0]:base64...\n\nMessage`

### Backend (50% Tamamlandı)
- ✅ `chat_with_gguf_vision` Rust komutu eklendi
- ✅ Base64 image decoding
- ✅ Image validation
- ⚠️ **mmproj yükleme sistemi YOK** (kritik eksik)
- ⚠️ **Vision embedding YOK** (kritik eksik)
- 🔄 Şu an text-only fallback kullanıyor

## 🔧 Teknik Detaylar

### Rust Backend (`src-tauri/src/gguf.rs`)
```rust
#[tauri::command]
pub async fn chat_with_gguf_vision(
    state: State<'_, Arc<Mutex<GgufState>>>,
    prompt: String,
    images: Vec<String>, // Base64 encoded
    max_tokens: u32,
    temperature: f32,
) -> Result<String, String>
```

**Şu anki davranış:**
- Resimleri base64'ten decode ediyor ✅
- Resim sayısını loglara yazıyor ✅
- Text-only chat'e fallback yapıyor ⚠️
- Kullanıcıya "X resim gönderildi ama vision işleme henüz yok" notu ekliyor

### Frontend (`src/services/aiProvider.ts`)
```typescript
function parseImagesFromMessage(message: string): { 
  cleanMessage: string; 
  images: string[] 
}
```

**Mesaj formatı:**
```
[IMAGES:2]
[IMAGE_0]:data:image/png;base64,iVBORw0KG...
[IMAGE_1]:data:image/jpeg;base64,/9j/4AAQ...

Kullanıcının mesajı buraya gelir
```

## 🎯 Vision Model Gereksinimleri

### 1. Vision-Capable GGUF Model
- **LLaVA 1.6** (Önerilen) ⭐
- Qwen2-VL (mmproj henüz yok)
- Bakllava
- MobileVLM

### 2. mmproj Dosyası (Vision Projector)
- **Kritik:** Her model için özel mmproj gerekli
- LLaVA mmproj ≠ Qwen mmproj
- Boyut: ~600 MB - 1.5 GB
- Format: `.gguf` veya `.bin`

### 3. llama.cpp Vision Support
- llama.cpp'nin vision branch'i gerekli
- `llama-cpp-2` crate'inin vision feature'ı

## � Örnek Model İndirme

### LLaVA 1.6 (Önerilen)
```bash
# Model (7B Q4_K_M)
https://huggingface.co/cjpais/llava-1.6-mistral-7b-gguf/resolve/main/llava-v1.6-mistral-7b.Q4_K_M.gguf

# mmproj (Vision Encoder)
https://huggingface.co/cjpais/llava-1.6-mistral-7b-gguf/resolve/main/mmproj-model-f16.gguf
```

## 🚧 Eksik Özellikler (TODO)

### 1. mmproj Yükleme Sistemi
```rust
// TODO: GgufState'e mmproj ekle
pub struct GgufState {
    pub backend: Option<LlamaBackend>,
    pub model: Option<LlamaModel>,
    pub mmproj: Option<MmProj>, // 🆕 Eklenecek
    pub model_path: Option<String>,
    pub mmproj_path: Option<String>, // 🆕 Eklenecek
    // ...
}
```

### 2. Vision Embedding
```rust
// TODO: Resimleri mmproj ile embed et
let image_embeddings = mmproj.encode_images(&decoded_images)?;
```

### 3. Multimodal Prompt
```rust
// TODO: Text + image embeddings'i birleştir
let multimodal_prompt = combine_text_and_images(prompt, image_embeddings)?;
```

## 🎮 Kullanım (Şu Anki Durum)

1. Chat panelinde 📷 butonuna tıkla
2. Resim seç (PNG, JPG, WebP)
3. Preview'da görüntüle
4. Mesaj yaz ve gönder
5. ⚠️ AI resmi göremez ama "X resim gönderildi" notunu alır

## 🔮 Gelecek Planlar

### Faz 1: mmproj Desteği (P1)
- [ ] mmproj dosyası seçme UI
- [ ] mmproj yükleme fonksiyonu
- [ ] Model + mmproj eşleştirme kontrolü

### Faz 2: Vision Inference (P1)
- [ ] Image embedding generation
- [ ] Multimodal prompt construction
- [ ] Vision model inference

### Faz 3: Gelişmiş Özellikler (P2)
- [ ] Resim crop/resize
- [ ] Multiple image support (şu an UI'da var, backend'de yok)
- [ ] Vision model karşılaştırma
- [ ] OCR optimizasyonu

## 📝 Notlar

- **12 GB VRAM:** LLaVA 1.6 7B Q4_K_M rahatça çalışır
- **mmproj boyutu:** Model boyutuna ek ~1 GB VRAM
- **Context length:** Vision modeller genelde 4K-8K context kullanır
- **Performance:** Vision inference text-only'den ~2-3x daha yavaş

## 🔗 Kaynaklar

- [LLaVA Models](https://huggingface.co/cjpais/llava-1.6-mistral-7b-gguf)
- [llama.cpp Vision](https://github.com/ggerganov/llama.cpp/tree/master/examples/llava)
- [Qwen2-VL](https://huggingface.co/Qwen/Qwen2-VL-7B-Instruct-GGUF)

---

**Son Güncelleme:** Vision AI backend komutu eklendi, mmproj implementasyonu bekleniyor.
