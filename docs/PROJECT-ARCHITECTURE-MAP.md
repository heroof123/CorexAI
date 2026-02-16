# 🗺️ Proje Mimarisi Haritası

## 📂 Ana Mantık Dosyaları - Hızlı Erişim

### 🔍 1. Dosya Tarama Mantığı

#### **`src/App.tsx`** - Ana Dosya Tarama
**Satırlar:** ~200-280  
**Fonksiyonlar:**
- `scanAndIndexProject()` - Projeyi tarar ve indeksler
- `loadOrIndexProject()` - Cache kontrol eder, yoksa tarar

**Kısayol:**
```typescript
// Dosya tarama başlangıcı
const scanAndIndexProject = async (path: string) => {
  setIsIndexing(true);
  
  // 1. Tauri ile tüm dosyaları tara
  const allFiles = await invoke<string[]>("scan_project", { path });
  
  // 2. Filtreleme (node_modules, dist vb. atla)
  const filesToIndex = allFiles.filter(shouldIndexFile);
  
  // 3. Batch processing (3'er 3'er)
  const batchSize = 3;
  for (let i = 0; i < filesToIndex.length; i += batchSize) {
    const batch = filesToIndex.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (filePath) => {
        // Dosya oku
        const content = await invoke<string>("read_file", { path: filePath });
        
        // 30KB'dan büyükse atla
        if (content.length > 30000) return;
        
        // Embedding oluştur
        const embedding = await createEmbedding(content);
        
        // İlk 10KB'ı sakla
        indexed.push({
          path: filePath,
          content: content.substring(0, 10000),
          embedding: embedding,
          lastModified: Date.now()
        });
      })
    );
  }
  
  // Cache'e kaydet
  await saveProjectIndex({ projectPath: path, files: indexed });
}
```

---

#### **`src/services/embedding.ts`** - Dosya Filtreleme
**Satırlar:** ~130-200  
**Fonksiyonlar:**
- `shouldIndexFile()` - Hangi dosyaların indeksleneceğini belirler
- `findRelevantFiles()` - İlgili dosyaları bulur (embedding similarity)

**Kısayol:**
```typescript
// Hangi dosyalar indekslenecek?
export function shouldIndexFile(filePath: string): boolean {
  // Atlanacak klasörler
  const ignoredDirs = [
    'node_modules', 'dist', 'build', '.git', 
    '.next', 'target', 'out', 'coverage'
  ];
  
  // Atlanacak uzantılar
  const ignoredExtensions = [
    '.png', '.jpg', '.gif', '.svg',  // Resimler
    '.mp4', '.mp3', '.wav',          // Medya
    '.zip', '.tar', '.gz',           // Arşivler
    '.pdf', '.exe', '.dll',          // Binary
    '.lock', '.log', '.map'          // Lock/log dosyaları
  ];
  
  // Kontrol et
  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/');
  
  // Klasör kontrolü
  if (pathParts.some(part => ignoredDirs.includes(part))) {
    return false;
  }
  
  // Uzantı kontrolü
  const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
  if (ignoredExtensions.includes(ext)) {
    return false;
  }
  
  return true;
}
```

---

#### **`src-tauri/src/commands.rs`** - Rust Dosya Tarama
**Satırlar:** ~1-50  
**Fonksiyonlar:**
- `scan_project()` - Dosya sistemini tarar (Rust)

**Kısayol:**
```rust
#[tauri::command]
pub fn scan_project(path: String) -> Result<Vec<String>, String> {
    let mut files = Vec::new();
    
    // Recursive olarak tüm dosyaları tara
    fn visit_dirs(dir: &Path, files: &mut Vec<String>) -> io::Result<()> {
        if dir.is_dir() {
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();
                
                if path.is_dir() {
                    visit_dirs(&path, files)?;
                } else {
                    files.push(path.to_string_lossy().to_string());
                }
            }
        }
        Ok(())
    }
    
    visit_dirs(Path::new(&path), &mut files)
        .map_err(|e| e.to_string())?;
    
    Ok(files)
}
```

---

### 💬 2. AI'a Gönderilen Prompt Oluşturma

#### **`src/services/ai.ts`** - Prompt Builder
**Satırlar:** ~380-550  
**Fonksiyonlar:**
- `buildContext()` - AI'ya gönderilecek prompt'u oluşturur
- `sendToAI()` - Prompt'u AI'ya gönderir

**Kısayol:**
```typescript
// Prompt oluşturma
export async function buildContext(
  userMessage: string,
  relevantFiles: Array<{ path: string; content: string; score: number }>,
  currentFile?: { path: string; content: string },
  totalIndexedFiles?: number,
  allFiles?: Array<...>
): Promise<string> {
  let context = "";
  
  // 1. System Prompt
  context += `Sen Corex AI'sın - arkadaş canlısı bir kod asistanı.

PROJE: ${conversationContext.projectContext.name}
TÜR: ${conversationContext.projectContext.type}
TOPLAM DOSYA: ${totalIndexedFiles}

💬 KONUŞMA TARZI:
- Samimi ve dostane ol
- Emoji kullan 😊
`;

  // 2. Proje açıklama modunda önemli dosyaları ekle
  if (isProjectExplanation && allFiles) {
    const { getImportantFiles } = await import('./contextProvider');
    const importantFiles = getImportantFiles(allFiles);
    
    context += "=== PROJE YAPISI ===\n\n";
    context += "📋 Önemli Dosyalar:\n\n";
    
    importantFiles.forEach(file => {
      context += `✅ ${file.path.split(/[\\/]/).pop()}\n`;
      context += "```" + getFileExtension(file.path) + "\n";
      context += file.content.substring(0, 500); // İlk 500 karakter
      context += "\n```\n\n";
    });
  }
  
  // 3. İlgili dosyaları ekle (embedding ile bulunan)
  if (relevantFiles.length > 0) {
    context += "=== İLGİLİ DOSYALAR ===\n\n";
    
    relevantFiles.forEach(file => {
      context += `📄 ${file.path}\n`;
      context += `DURUM: ✅ MEVCUT DOSYA (${(file.score * 100).toFixed(1)}%)\n`;
      context += "```\n";
      context += file.content.substring(0, 2500); // İlk 2500 karakter
      context += "\n```\n\n";
    });
  }
  
  // 4. Açık dosyayı ekle
  if (currentFile) {
    context += "=== AÇIK DOSYA ===\n\n";
    context += `📄 ${currentFile.path}\n`;
    context += "```\n";
    context += currentFile.content.substring(0, 2000); // İlk 2000 karakter
    context += "\n```\n\n";
  }
  
  // 5. Kullanıcı mesajını ekle
  context += "=== MESAJ ===\n\n";
  context += userMessage;
  
  return context;
}
```

**Örnek Prompt Çıktısı:**
```
Sen Corex AI'sın - arkadaş canlısı bir kod asistanı.

PROJE: local-ai
TÜR: javascript/typescript
TOPLAM DOSYA: 150

=== PROJE YAPISI ===

📋 Önemli Dosyalar:

✅ package.json
```json
{
  "name": "local-ai",
  "dependencies": {
    "react": "^18.2.0"
  }
}
```

=== İLGİLİ DOSYALAR ===

📄 src/App.tsx
DURUM: ✅ MEVCUT DOSYA (85.3%)
```typescript
import { useState } from 'react';
...
```

=== MESAJ ===

projesinin mimarisini açıkla
```

---

#### **`src/services/contextProvider.ts`** - Context Sağlayıcı
**Satırlar:** ~1-100  
**Fonksiyonlar:**
- `getImportantFiles()` - Önemli dosyaları bulur (package.json, README vb.)
- `getProjectStructureFiles()` - Ana yapı dosyalarını bulur
- `hybridSearch()` - Embedding + Keyword + Filename ile arama

**Kısayol:**
```typescript
// Önemli dosyaları bul
export function getImportantFiles(fileIndex: Array<...>): Array<...> {
  const importantPatterns = [
    /package\.json$/,
    /tsconfig\.json$/,
    /README\.md$/i,
    /vite\.config\.(ts|js)$/,
    /Cargo\.toml$/,
    /tauri\.conf\.json$/
  ];
  
  return fileIndex.filter(file => 
    importantPatterns.some(pattern => pattern.test(file.path))
  );
}

// Hybrid search - Embedding + Keyword + Filename
export function hybridSearch(
  query: string,
  fileIndex: Array<...>,
  queryEmbedding: number[],
  topK: number = 5
): Array<...> {
  const results = fileIndex.map(file => {
    // 1. Embedding similarity (0-1)
    const embeddingScore = cosineSimilarity(queryEmbedding, file.embedding);
    
    // 2. Keyword match (0-1)
    const queryWords = query.toLowerCase().split(/\s+/);
    const fileText = (file.path + ' ' + file.content).toLowerCase();
    const keywordScore = queryWords.filter(w => fileText.includes(w)).length / queryWords.length;
    
    // 3. File name match (0-1)
    const fileName = file.path.split(/[\\/]/).pop()?.toLowerCase() || '';
    const fileNameScore = queryWords.some(w => fileName.includes(w)) ? 0.5 : 0;
    
    // Weighted combination
    const finalScore = 
      embeddingScore * 0.6 +  // Embedding en önemli
      keywordScore * 0.3 +     // Keyword ikinci
      fileNameScore * 0.1;     // Dosya adı bonus
    
    return { path: file.path, content: file.content, score: finalScore };
  });
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(f => f.score > 0.15);
}
```

---

### 🎯 3. Token Limit ve Optimizasyon

#### **`src/services/ai.ts`** - Token Optimizasyonu
**Satırlar:** ~150-170, ~450-480  
**Optimizasyonlar:**
- Conversation history: Son 20 mesaj
- Dosya içeriği: Max 2500 karakter
- Açık dosya: Max 2000 karakter
- Önemli dosyalar: Max 500 karakter

**Kısayol:**
```typescript
// Conversation history limiti
if (conversationContext.history.length > 21) {
  conversationContext.history = [
    conversationContext.history[0], // System prompt tut
    ...conversationContext.history.slice(-20) // Son 20 mesaj
  ];
}

// Dosya içeriği limiti
context += file.content.substring(0, 2500); // Max 2500 karakter
if (file.content.length > 2500) {
  context += "\n... (devamı var)";
}

// Açık dosya limiti
context += currentFile.content.substring(0, 2000); // Max 2000 karakter

// Önemli dosyalar limiti
context += file.content.substring(0, 500); // Max 500 karakter
```

**Token Hesaplama (Yaklaşık):**
```typescript
// Basit token hesaplama
function estimateTokens(text: string): number {
  // ~4 karakter = 1 token (yaklaşık)
  return Math.ceil(text.length / 4);
}

// Örnek kullanım
const tokens = estimateTokens(context);
console.log(`Prompt: ${tokens} token`);

// Limit kontrolü
if (tokens > 8000) {
  console.warn('⚠️ Token limiti aşılıyor!');
  // İçeriği kısalt
}
```

---

#### **`src/services/embedding.ts`** - Dosya Boyutu Limiti
**Satırlar:** ~100-120  
**Limitler:**
- İndeksleme: Max 30KB
- Saklama: Max 10KB

**Kısayol:**
```typescript
// İndeksleme sırasında dosya boyutu kontrolü
const content = await invoke<string>("read_file", { path: filePath });

// 30KB'dan büyükse atla
if (content.length > 30000) {
  console.log(`⏭️ Atlandı (çok büyük): ${filePath} (${content.length} karakter)`);
  return;
}

// Embedding oluştur
const embedding = await createEmbedding(content);

// Sadece ilk 10KB'ı sakla (memory tasarrufu)
indexed.push({
  path: filePath,
  content: content.substring(0, 10000), // ✅ İLK 10KB
  embedding: embedding,
  lastModified: Date.now()
});
```

---

### 🌳 4. Tree Yapısı (UI)

#### **`src/components/filetree.tsx`** - Dosya Ağacı
**Satırlar:** ~1-200  
**Özellikler:**
- Klasör açma/kapama
- Dosya seçme
- Hiyerarşik görünüm

**Not:** Şu anda tree yapısı sadece UI'da, AI'ya gönderilmiyor.

**Kısayol (AI'ya göndermek için):**
```typescript
// Tree yapısı oluşturma (eklenebilir)
function generateFileTree(files: string[]): string {
  const tree: any = {};
  
  files.forEach(file => {
    const parts = file.split(/[\\/]/);
    let current = tree;
    
    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? null : {};
      }
      current = current[part];
    });
  });
  
  function printTree(obj: any, prefix: string = ''): string {
    let result = '';
    const keys = Object.keys(obj);
    
    keys.forEach((key, index) => {
      const isLast = index === keys.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      result += prefix + connector + key + '\n';
      
      if (obj[key] !== null) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        result += printTree(obj[key], newPrefix);
      }
    });
    
    return result;
  }
  
  return printTree(tree);
}

// Kullanım
const treeString = generateFileTree([
  'src/App.tsx',
  'src/components/ChatPanel.tsx',
  'src/services/ai.ts'
]);

console.log(treeString);
// Çıktı:
// src/
// ├── App.tsx
// ├── components/
// │   └── ChatPanel.tsx
// └── services/
//     └── ai.ts
```

---

## 📊 Akış Diyagramları

### Dosya Tarama Akışı
```
Kullanıcı Proje Seçer
        ↓
App.tsx → handleProjectSelect()
        ↓
loadOrIndexProject()
        ↓
Cache var mı? → Evet → Yükle
        ↓ Hayır
scanAndIndexProject()
        ↓
Tauri → scan_project() (Rust)
        ↓
Tüm dosyalar listelenir
        ↓
shouldIndexFile() ile filtrele
        ↓
3'er 3'er batch processing
        ↓
Her dosya için:
  - İçerik oku (max 30KB)
  - Embedding oluştur
  - İlk 10KB'ı sakla
        ↓
saveProjectIndex() → Cache'e kaydet
        ↓
Proje hazır! ✅
```

### AI Prompt Gönderme Akışı
```
Kullanıcı Mesaj Yazar
        ↓
App.tsx → sendMessage()
        ↓
createEmbedding(userMessage)
        ↓
hybridSearch() → İlgili dosyaları bul
  - Embedding similarity
  - Keyword match
  - Filename match
        ↓
buildContext() → Prompt oluştur
  - System prompt
  - Önemli dosyalar (500 char)
  - İlgili dosyalar (2500 char)
  - Açık dosya (2000 char)
  - Kullanıcı mesajı
        ↓
sendToAI() → LM Studio'ya gönder
        ↓
AI Cevabı Gelir
        ↓
parseAIResponse() → Parse et
  - Kod bloklarını ayır
  - Temiz metin oluştur
        ↓
Kod blokları → "Bekleyen Değişiklikler"
Temiz metin → Chat'te göster
        ↓
Tamamlandı! ✅
```

---

## 🎯 Hızlı Referans

| Özellik | Dosya | Satır | Fonksiyon |
|---------|-------|-------|-----------|
| Dosya Tarama | `src/App.tsx` | ~200-280 | `scanAndIndexProject()` |
| Dosya Filtreleme | `src/services/embedding.ts` | ~130-200 | `shouldIndexFile()` |
| Rust Tarama | `src-tauri/src/commands.rs` | ~1-50 | `scan_project()` |
| Prompt Oluşturma | `src/services/ai.ts` | ~380-550 | `buildContext()` |
| Önemli Dosyalar | `src/services/contextProvider.ts` | ~10-30 | `getImportantFiles()` |
| Hybrid Search | `src/services/contextProvider.ts` | ~40-80 | `hybridSearch()` |
| Token Limiti | `src/services/ai.ts` | ~150-170 | Conversation history |
| Dosya Boyutu | `src/services/embedding.ts` | ~100-120 | 30KB / 10KB limit |
| Tree UI | `src/components/filetree.tsx` | ~1-200 | Tree component |

---

## 💡 Eklenebilecek Özellikler

### 1. Token Counter
```typescript
// src/services/tokenCounter.ts (YENİ)
export function countTokens(text: string): number {
  // GPT tokenizer benzeri
  return Math.ceil(text.length / 4);
}

export function limitTokens(text: string, maxTokens: number): string {
  const tokens = countTokens(text);
  if (tokens <= maxTokens) return text;
  
  const maxChars = maxTokens * 4;
  return text.substring(0, maxChars) + '...';
}
```

### 2. Tree Generator (AI için)
```typescript
// src/services/treeGenerator.ts (YENİ)
export function generateFileTree(files: string[]): string {
  // Yukarıdaki kodu kullan
}
```

### 3. Dynamic Token Limit
```typescript
// src/services/ai.ts'e ekle
const MODEL_LIMITS = {
  'qwen2.5-7b': 32768,
  'llama-3.1-8b': 8192,
  'gpt-4': 8192
};

function getTokenLimit(modelId: string): number {
  return MODEL_LIMITS[modelId] || 8192;
}
```

---

**Oluşturulma Tarihi:** 31 Ocak 2026  
**Durum:** ✅ Güncel  
**Amaç:** Proje mimarisine hızlı erişim ve referans
