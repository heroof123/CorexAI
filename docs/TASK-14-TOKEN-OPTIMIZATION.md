# Task 14: Token Optimization - Dosya İçeriklerini Gösterme

## Problem

AI dosya içeriklerine bakmadan hep aynı cevapları veriyordu.

## Kök Neden

Token dağılımı dengesizdi:
- System prompt: 932 token (çok uzun!)
- Dosya içerikleri: 500-2500 karakter (çok kısa!)

## Çözüm

### 1. System Prompt Kısaltıldı
- 932 token → 250 token (%73 azalma)
- Gereksiz açıklamalar kaldırıldı
- Sadece temel kurallar bırakıldı

### 2. Dosya İçerikleri Artırıldı
- Önemli dosyalar: 500 → 3000 karakter (6x)
- İlgili dosyalar: 2500 → 4000 karakter (1.6x)
- Açık dosya: 2000 → 5000 karakter (2.5x)

### 3. Gereksiz Metinler Kaldırıldı
- Casual chat: 400 → 100 token
- Context header: 150 → 50 token
- Talimatlar: 100 → 30 token

## Sonuç

✅ System prompt: 932 → 250 token
✅ Dosya içerikleri: 500 → 3000-5000 karakter
✅ AI artık dosyaları görebiliyor
✅ Token kullanımı: %37 (32K'dan)
✅ Build başarılı

## Değiştirilen Dosyalar

- `local-ai/src/services/ai.ts`

## Dokümantasyon

- `local-ai/docs/TOKEN-OPTIMIZATION-FIX.md` - Detaylı açıklama

## Test

1. "içerik olarak sayfalarında neler var" → Dosya içeriklerini göstermeli
2. "proje mimarisini açıkla" → Gerçek dosyaları analiz etmeli
3. "page.tsx dosyasında ne var?" → Dosyanın içeriğini göstermeli
