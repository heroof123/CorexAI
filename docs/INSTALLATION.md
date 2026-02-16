# 📦 Installation & Migration Guide

Bu dosya, yeni yapılandırılmış sisteme geçiş için adım adım talimatlar içerir.

## 🔄 Dosya Yapısı Değişiklikleri

### Eski Yapı:
```
src/
├── App.tsx
├── embedding.ts
└── components/
    ├── (bileşenler)
```

### Yeni Yapı:
```
src/
├── App.tsx                 # ✨ YENİ: Tamamen yeniden yazıldı
├── components/             # ✅ Aynı kalıyor
│   ├── FileTree.tsx
│   ├── Editor.tsx
│   ├── ChatPanel.tsx
│   └── DiffViewer.tsx
├── services/              # 🆕 YENİ: Servisler ayrıldı
│   ├── ai.ts
│   ├── embedding.ts
│   └── db.ts
└── types/                 # ✅ Aynı kalıyor
    └── index.ts
```

## 📝 Adım Adım Kurulum

### 1️⃣ Yedek Alın
```bash
# Mevcut projenizin yedeğini alın
cp -r src src-backup
```

### 2️⃣ Services Klasörünü Oluşturun
```bash
mkdir -p src/services
```

### 3️⃣ Dosyaları Taşıyın

**Eski embedding.ts'i services altına taşıyın:**
```bash
# Eski embedding.ts'i services klasörüne taşı
mv src/embedding.ts src/services/embedding.ts
```

**Eğer varsa ai.ts ve db.ts'i taşıyın:**
```bash
# Eğer src klasöründe varsa
mv src/ai.ts src/services/ai.ts
mv src/db.ts src/services/db.ts
```

### 4️⃣ Yeni Dosyaları Ekleyin

Ben size hazır dosyalar göndereceğim. Bunları şu şekilde yerleştirin:

**App-new.tsx → App.tsx olarak değiştirin:**
```bash
# Eski App.tsx'i yedekleyin
mv src/App.tsx src/App-old.tsx

# Yeni App.tsx'i kopyalayın (ben göndereceğim)
# Dosyayı src/App.tsx olarak kaydedin
```

**Services dosyalarını ekleyin:**
- `services-ai.ts` → `src/services/ai.ts`
- `services-embedding.ts` → `src/services/embedding.ts`
- `services-db.ts` → `src/services/db.ts`

### 5️⃣ Import Yollarını Düzeltin

Bileşenlerinizde (`components/` altında) eğer `embedding.ts` veya diğer servisleri import ediyorsanız, yolları güncelleyin:

**Eski:**
```typescript
import { createEmbedding } from "../embedding";
```

**Yeni:**
```typescript
import { createEmbedding } from "../services/embedding";
```

### 6️⃣ Bağımlılıkları Kontrol Edin

package.json'da şunların olduğundan emin olun:
```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.7.0",
    "@xenova/transformers": "^2.17.2",
    "diff": "^8.0.3",
    "idb": "^8.0.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  }
}
```

Eksik varsa yükleyin:
```bash
npm install
```

### 7️⃣ Tauri Komutlarını Kontrol Edin

`src-tauri/src/main.rs` dosyanızda şu komutların olduğundan emin olun:

```rust
#[tauri::command]
fn scan_project(path: String) -> Result<Vec<String>, String> {
    // Proje dosyalarını tarayan kod
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    // Dosya okuyan kod
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    // Dosya yazan kod
}

#[tauri::command]
async fn chat_with_ai(message: String) -> Result<String, String> {
    // AI ile konuşan kod
}
```

### 8️⃣ Çalıştırın ve Test Edin

```bash
npm run tauri dev
```

## 🔍 Değişikliklerin Özeti

### App.tsx
- ✅ State management iyileştirildi
- ✅ IndexedDB caching eklendi
- ✅ Conversation history kaydetme
- ✅ Batch indexing (5'li gruplar halinde)
- ✅ Better error handling
- ✅ Unsaved changes warning
- ✅ Code action system (accept/reject)

### Services/ai.ts
- ✅ Daha iyi AI response parsing
- ✅ File mention extraction (@filename)
- ✅ Improved context building
- ✅ Better file path detection

### Services/embedding.ts
- ✅ Batch embedding creation
- ✅ Better file filtering
- ✅ Optimized similarity search
- ✅ Threshold adjustment (0.25)

### Services/db.ts
- ✅ Complete IndexedDB wrapper
- ✅ Project index caching
- ✅ Conversation persistence
- ✅ Storage size utilities

## ⚠️ Breaking Changes

### Import Paths
```typescript
// ÖNCE:
import { createEmbedding } from "./embedding";

// SONRA:
import { createEmbedding } from "./services/embedding";
```

### Type Imports
```typescript
// Tüm tipler types/index.ts'den gelir
import { Message, CodeAction, FileIndex } from "./types";
```

## 🧪 Test Senaryoları

Sistemi test etmek için:

1. **Proje Açma:**
   - Büyük bir projeyi açın (100+ dosya)
   - İlk indexing'in bittiğini bekleyin
   - Projeyi kapatıp tekrar açın (cache'den yüklenmeli, çok hızlı)

2. **AI Chat:**
   - "Explain this project" sorun
   - "@App.tsx what does this do?" sorun
   - Kod değişikliği isteyin

3. **Code Actions:**
   - AI'dan kod önerisi alın
   - Diff viewer'da inceleyin
   - Accept/Reject butonlarını test edin

4. **Editor:**
   - Bir dosya açın
   - Değişiklik yapın
   - Ctrl+S ile kaydedin
   - Başka dosya açmaya çalışın (unsaved warning görmeli)

## 🐛 Sorun Giderme

### Module not found hatası
```bash
# node_modules'ü temizleyin
rm -rf node_modules package-lock.json
npm install
```

### Tauri build hatası
```bash
# Rust bağımlılıklarını güncelleyin
cd src-tauri
cargo clean
cargo build
```

### IndexedDB hatası
```bash
# Browser'da console'u açın
# Application -> Storage -> IndexedDB
# local-ai-ide-db'yi silin
# Sayfayı yenileyin
```

## 📞 Yardım

Sorun yaşarsanız:
1. Console'daki hataları kontrol edin
2. Network tab'ında AI isteklerini kontrol edin
3. src-backup'tan eski dosyaları geri yükleyebilirsiniz

## ✅ Tamamlandığında

Şunları görmelisiniz:
- ✅ Modern, temiz UI
- ✅ Hızlı proje yükleme (cache sayesinde)
- ✅ Context-aware AI responses
- ✅ Code diff preview
- ✅ Saved conversations

Başarılar! 🚀
