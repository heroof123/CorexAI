# 🔥 Crash Analizi ve Çözümler

## 🐛 Tespit Edilen Sorunlar

### 1. **Embedding Timeout Çok Kısa (15 saniye)**
**Sorun:** BGE embedding için 15 saniye timeout var. Büyük projeler için yetersiz.
```typescript
// embedding.ts - Satır 32
setTimeout(() => reject(new Error('BGE Embedding zaman aşımı (15 saniye)')), 15000);
```

**Etki:** 
- Büyük dosyalar için embedding oluşturulamıyor
- Timeout sonrası crash oluyor
- Xenova'ya geçiş yapılıyor ama bu da yavaş

### 2. **Dosya Boyutu Limiti Çok Yüksek (100KB)**
**Sorun:** 100KB'tan büyük dosyalar atlanıyor ama bu bile çok büyük.
```typescript
// App.tsx - Satır 306
if (content.length > 100000) {
  console.log(`⏭️ Atlandı (çok büyük): ${filePath}`);
  return;
}
```

**Etki:**
- 100KB'lık dosyalar hala embedding'e gönderiliyor
- Memory overflow
- Tarayıcı/Tauri crash

### 3. **Batch Size Çok Küçük (5 dosya)**
**Sorun:** Her seferinde sadece 5 dosya işleniyor.
```typescript
// App.tsx - Satır 297
const batchSize = 5;
```

**Etki:**
- Çok fazla iteration
- Her batch'te memory allocation
- Yavaş indeksleme

### 4. **Tüm Dosya İçeriği Memory'de Tutuluyor**
**Sorun:** `indexed` array'ine tüm dosya içerikleri ekleniyor.
```typescript
// App.tsx - Satır 313
indexed.push({
  path: filePath,
  content: content, // ❌ TÜM İÇERİK MEMORY'DE!
  embedding: embedding,
  lastModified: Date.now()
});
```

**Etki:**
- 100+ dosya × 50KB = 5MB+ memory
- Embedding'ler de ekleniyor (her biri ~1.5KB)
- Total: 10-20MB+ memory kullanımı
- Tauri/Browser crash

### 5. **Proje Analizi Çok Uzun Mesaj Üretiyor**
**Sorun:** `analyzeProjectStructure` çok detaylı analiz yapıyor.
```typescript
// App.tsx - Satır 117-210
return `🎯 **${projectName}** projesini analiz ettim!
... (100+ satır markdown)
`;
```

**Etki:**
- İlk mesaj çok uzun
- AI context'i dolduruyor
- LM Studio'ya gönderildiğinde token limiti aşılıyor

### 6. **AI Context Limiti Aşılıyor**
**Sorun:** Qwen 7B'nin context limiti 32768 token ama:
- Proje analizi: ~2000 token
- Sistem prompt: ~1500 token
- İlgili dosyalar (5×3000 karakter): ~4000 token
- **TOPLAM: 7500+ token sadece ilk mesajda!**

**Etki:**
- LM Studio context overflow
- Uygulama crash

## 🔧 Çözümler

### Çözüm 1: Dosya Boyutu Limitini Düşür
```typescript
// 100KB → 30KB
if (content.length > 30000) {
  console.log(`⏭️ Atlandı (çok büyük): ${filePath}`);
  return;
}
```

### Çözüm 2: Embedding Timeout'u Artır
```typescript
// 15 saniye → 30 saniye
setTimeout(() => reject(new Error('BGE Embedding zaman aşımı (30 saniye)')), 30000);
```

### Çözüm 3: Dosya İçeriğini Truncate Et
```typescript
// Sadece ilk 10KB'ı sakla
indexed.push({
  path: filePath,
  content: content.substring(0, 10000), // ✅ İLK 10KB
  embedding: embedding,
  lastModified: Date.now()
});
```

### Çözüm 4: Batch Size'ı Artır
```typescript
// 5 → 3 (daha az concurrent işlem)
const batchSize = 3;
```

### Çözüm 5: Proje Analizini Kısalt
```typescript
// Detaylı analiz yerine kısa özet
return `✅ Proje yüklendi: ${projectName}
📊 ${indexed.length} dosya indekslendi
🔧 ${projectType}${framework}

Soru sorabilirsin! 🚀`;
```

### Çözüm 6: İlgili Dosya Sayısını Azalt
```typescript
// buildContext'te 5 → 3 dosya
const relevantFiles = findRelevantFiles(queryEmbedding, fileIndex, 3);
```

### Çözüm 7: Dosya İçeriğini Daha Fazla Kısalt
```typescript
// buildContext'te 3000 → 1500 karakter
context += file.content.substring(0, 1500);
```

## 📊 Beklenen İyileştirmeler

### Öncesi:
- ❌ 100KB dosyalar işleniyor
- ❌ Tüm içerik memory'de
- ❌ 15 saniye timeout
- ❌ 5 dosya batch
- ❌ Uzun proje analizi
- ❌ 7500+ token ilk mesaj
- ❌ Crash oluyor

### Sonrası:
- ✅ 30KB limit (70% azalma)
- ✅ Sadece 10KB saklanıyor (90% azalma)
- ✅ 30 saniye timeout (2x artış)
- ✅ 3 dosya batch (daha stabil)
- ✅ Kısa proje analizi (80% azalma)
- ✅ ~2500 token ilk mesaj (67% azalma)
- ✅ Crash önleniyor

## 🎯 Memory Kullanımı

### Öncesi:
```
100 dosya × 50KB = 5MB (içerik)
100 dosya × 1.5KB = 150KB (embedding)
TOPLAM: ~5.15MB
```

### Sonrası:
```
100 dosya × 10KB = 1MB (içerik)
100 dosya × 1.5KB = 150KB (embedding)
TOPLAM: ~1.15MB (78% azalma!)
```

## 🚀 Uygulama

Şimdi bu değişiklikleri uygulayacağım:
1. Dosya boyutu limiti: 100KB → 30KB
2. İçerik truncate: Tam → 10KB
3. Embedding timeout: 15s → 30s
4. Batch size: 5 → 3
5. Proje analizi: Uzun → Kısa
6. İlgili dosya: 5 → 3
7. Dosya içeriği: 3000 → 1500 karakter

---

**Tarih:** 31 Ocak 2026
**Durum:** 🔧 Analiz tamamlandı, düzeltmeler uygulanacak
