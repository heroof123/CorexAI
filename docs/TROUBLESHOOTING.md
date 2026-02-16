# 🔧 Sorun Giderme Rehberi

## ❌ "Sistem belirtilen yolu bulamıyor" Hatası

### Neden Oluyor?
AI kod önerisi yaparken tam dosya yolunu yazmıyor veya yanlış yazıyor.

### Çözüm:
Yeni güncellemeler ile artık:
1. ✅ Dosya adı eşleştirme yapılıyor
2. ✅ Eksik dosya yolları otomatik bulunuyor  
3. ✅ Hata durumunda açıklayıcı mesaj veriliyor

### AI'ya Nasıl Sormalı?

#### ❌ YANLIŞ:
```
"Communities.ts dosyasına yeni bir field ekle"
```

#### ✅ DOĞRU:
```
"lib/data/communities.ts dosyasındaki Community type'ına createdBy field'ı ekle"
```

veya

```
"@lib/data/communities.ts dosyasına createdBy ekle"
```

### Manuel Düzeltme

Eğer AI yanlış dosya yolu verirse:

1. **Diff viewer'da dosya adını kontrol edin**
2. **File Tree'den doğru dosyayı bulun**
3. **O dosyayı açın**
4. **AI'ya tekrar sorun ama bu sefer:**
   ```
   "Şu an açık olan dosyaya createdBy field'ı ekle"
   ```

## 🔍 Diff Viewer Sadece "+" İşaretleri Gösteriyorsa

### Neden Oluyor?
AI sadece eklenecek satırları gönderiyor, tam dosya içeriği yok.

### Çözüm:
AI'ya şöyle sorun:

```
"lib/data/communities.ts dosyasının TAMAMINI createdBy field'ı eklenmiş haliyle yaz"
```

veya

```
"Dosyanın tüm içeriğini değişikliklerle birlikte göster"
```

## 🎯 İdeal AI Sohbet Akışı

### AI Nasıl Cevap Veriyor?

Sistem artık **otomatik olarak** sorunuza göre mod değiştiriyor:

#### 📝 Analiz/Öneri Modu (Kod YOK)
Şu kelimeler varsa aktif olur: `analiz`, `açıkla`, `öner`, `nasıl`, `nedir`, `anlat`

**Örnek Sorular:**
```
✅ "Bu projeyi analiz et"
✅ "Proje ile alakalı öneriler ver"
✅ "Nasıl geliştirebilirim?"
✅ "Bu dosya ne yapar?"
✅ "Authentication nasıl çalışıyor?"
```

**AI Cevabı:**
```
📊 Proje Analizi:

Bu bir React + TypeScript web uygulamasıdır...

💡 Öneriler:
1. ✅ Dark mode eklenebilir
2. ⚠️ Error handling eksik
3. 🔧 Test coverage artırılabilir

🚀 Sonraki Adımlar:
- TypeScript strict mode aktif edilmeli
- API endpoint'leri dokümante edilmeli
```

#### 💻 Kod Modu (TAM KOD)
Şu kelimeler varsa aktif olur: `ekle`, `yaz`, `oluştur`, `değiştir`, `düzelt`

**Örnek Sorular:**
```
✅ "Button component'e loading state ekle"
✅ "API error handling'i düzelt"
✅ "Dark mode toggle oluştur"
```

**AI Cevabı:**
```
İşte güncellenmiş Button component:

`src/components/Button.tsx`
```typescript
import React from 'react';
// TAM KOD BURAYA
```
```

### 1. Proje Analizi (Sade, Kod YOK)
```
"Bu projeyi analiz et ve ana yapısını açıkla"
```

### 2. Özel Dosya İnceleme
```
"@lib/data/communities.ts dosyasını incele ve ne yaptığını anlat"
```

### 3. Kod Değişikliği İsteği
```
"lib/data/communities.ts dosyasına createdBy: string field'ı ekle.
Dosyanın tamamını değişiklikle birlikte göster."
```

### 4. Diff İnceleme
- Split/Unified görünüm değiştir
- Değişiklikleri incele
- Accept veya Reject

## 🐛 Yaygın Hatalar

### 1. "Index kayboldu" gibi davranıyor
**Çözüm:** Console'da şunu kontrol edin:
```javascript
console.log("💾 Total indexed files:", fileIndex.length);
```
Eğer 0 ise, projeyi tekrar açın.

### 2. Alakasız dosyalar buluyor
**Çözüm:** Daha spesifik sorun:
```
"@components/Button.tsx dosyasına dark mode desteği ekle"
```

### 3. Code actions görünmüyor
**Çözüm:** AI'ya şunu söyleyin:
```
"Değişiklikleri kod bloğu olarak göster:
`src/dosya.ts`
```typescript
// kod buraya
```
```

## 📊 Debug Kontrol Listesi

### Console'da kontrol edin:
1. `📂 Relevant files:` - Hangi dosyalar bulundu?
2. `💾 Total indexed files:` - Kaç dosya indexed?
3. `📤 Context length:` - AI'ya ne kadar bilgi gönderildi?
4. `📍 Matched file path:` - Dosya yolu doğru eşleşti mi?

### Sorun devam ediyorsa:
1. Tarayıcı console'unu açın (F12)
2. Hatayı kopyalayın
3. Dosya yolunu kontrol edin
4. File tree'de dosyanın gerçekten var olduğunu doğrulayın

## 💡 Pro İpuçları

### Hızlı Dosya Referansı
```
@dosyaadi.ts   →   File Tree'den otomatik bulunur
```

### Çoklu Dosya Değişikliği
Her dosya için ayrı soru sorun:
```
1. "@routes.ts dosyasına yeni route ekle"
   [accept]
   
2. "@api.ts dosyasına handler ekle"
   [accept]
```

### Cache Temizleme
Eğer eski kod görüyorsanız:
```javascript
// Browser Console'da
indexedDB.deleteDatabase('local-ai-ide-db');
// Sonra sayfayı yenileyin
```

## 🚀 Performans İpuçları

### Büyük Projeler İçin
- İlk indexing 5-10 dakika sürebilir
- Cache'den ikinci açılış 1-2 saniye
- 251 dosya ≈ 200MB cache

### Hızlı İndexing
```bash
# Gereksiz dosyaları .gitignore'a ekleyin
node_modules/
dist/
build/
*.log
```

## ✅ Test Senaryosu

Sistemi test etmek için:

```
1. Proje aç → ✓ 251 files indexed
2. "Projeyi analiz et" → ✓ AI analiz yapıyor
3. "@communities.ts'e field ekle" → ✓ Kod önerisi geliyor
4. Diff'i incele → ✓ Değişiklikler görünüyor
5. Accept → ✓ Dosya güncelleniyor
6. Dosyayı aç → ✓ Değişiklikler uygulanmış
```

Tüm adımlar ✓ ise sistem çalışıyor! 🎉
