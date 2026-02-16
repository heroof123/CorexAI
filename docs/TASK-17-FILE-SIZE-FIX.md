# Task 17: Yerel GGUF Model Dosya Boyutu Düzeltmesi

## Durum: ✅ Tamamlandı

## Problem
Model karşılaştırma özelliğinde, yerel olarak eklenen GGUF modellerin dosya boyutu "Bilinmiyor" olarak görünüyordu. Bu, karşılaştırma tablosunda VRAM hesaplamalarının yanlış çıkmasına neden oluyordu.

## Çözüm

### 1. Frontend Değişiklikleri
**Dosya:** `local-ai/src/components/GGUFModelBrowser.tsx`

`selectLocalFile()` fonksiyonu güncellendi:
- Tauri'nin `get_file_size` komutu ile dosya boyutu alınıyor
- Dosya boyutu byte cinsinden kaydediliyor (`sizeBytes`)
- GB cinsinden formatlanmış string oluşturuluyor (`size`)
- Dosya adından quantization ve parametre sayısı otomatik çıkarılıyor
- Toast notification ile kullanıcıya bilgi veriliyor

```typescript
// Dosya boyutunu al
const fileInfo = await invoke<{ size: number }>('get_file_size', { path: selected });
sizeBytes = fileInfo.size;
const sizeGB = (sizeBytes / (1024 ** 3)).toFixed(1);
sizeStr = `${sizeGB} GB`;
```

### 2. Backend Değişiklikleri

#### Rust Command Eklendi
**Dosya:** `local-ai/src-tauri/src/commands.rs`

Yeni `get_file_size` komutu eklendi:
```rust
#[tauri::command]
pub async fn get_file_size(path: String) -> Result<serde_json::Value, String> {
    let metadata = fs::metadata(&path).map_err(|e| format!("Failed to get file size: {}", e))?;
    
    Ok(json!({
        "size": metadata.len()
    }))
}
```

#### Command Registration
**Dosya:** `local-ai/src-tauri/src/main.rs`

`get_file_size` komutu handler listesine eklendi:
```rust
.invoke_handler(tauri::generate_handler![
    // ... diğer komutlar
    commands::get_file_size,
    // ...
])
```

## Özellikler

### Otomatik Bilgi Çıkarma
Dosya adından otomatik olarak:
- **Quantization:** `Q4_K_M`, `Q5_K_M`, `Q6_K` vb.
- **Parametre sayısı:** `7B`, `13B`, `70B` vb.

### Örnek Dosya Adları
- `qwen2.5-7b-instruct-q4_k_m.gguf` → 7B, Q4_K_M
- `llama-3.1-8b-q5_k_m.gguf` → 8B, Q5_K_M
- `mistral-7b-instruct-v0.2.Q6_K.gguf` → 7B, Q6_K

## Sonuç

Artık yerel olarak eklenen GGUF modellerin:
- ✅ Dosya boyutu doğru görünüyor
- ✅ Model karşılaştırma tablosunda VRAM hesaplamaları doğru
- ✅ Quantization ve parametre bilgileri otomatik çıkarılıyor
- ✅ Kullanıcı dostu toast bildirimleri

## Test Edildi
- ✅ Rust kodu derleniyor (`cargo check`)
- ✅ Dosya boyutu API'si çalışıyor
- ✅ Frontend entegrasyonu tamamlandı

## İlgili Dosyalar
- `local-ai/src/components/GGUFModelBrowser.tsx`
- `local-ai/src/components/ModelComparison.tsx`
- `local-ai/src-tauri/src/commands.rs`
- `local-ai/src-tauri/src/main.rs`
