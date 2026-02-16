# Task 16: GPU Unload ve Context Length Düzeltmeleri

## Tarih: 2026-02-01

## Yapılan Değişiklikler

### 1. GPU'dan Model Kaldırma (Unload) Özelliği

**Problem**: Model GPU'ya yüklendiğinde, uygulamadan kaldırılsa bile GPU'da kalıyordu. Farklı bir model yüklemek için uygulamayı yeniden başlatmak gerekiyordu.

**Çözüm**:
- `unloadFromGPU()` fonksiyonu eklendi
- GPU'da aktif model takibi için `activeGpuModel` state'i eklendi
- "🎮 GPU'dan Kaldır" butonu eklendi (sadece model GPU'da yüklüyken görünür)
- Model listesinde GPU'da aktif olan model 🎮 ikonu ile işaretleniyor

**Kullanım**:
1. Model GPU'ya yüklendiğinde "🎮 GPU'dan Kaldır" butonu görünür
2. Butona tıklandığında:
   - Model GPU'dan kaldırılır
   - `gguf-active-model` localStorage'dan silinir
   - AI Settings'de GGUF modelleri pasif yapılır
   - Başka bir model yüklenebilir

**Dosyalar**:
- `local-ai/src/components/GGUFModelBrowser.tsx`
  - `unloadFromGPU()` fonksiyonu eklendi (satır ~430)
  - `activeGpuModel` state eklendi
  - GPU status kontrolü `useEffect`'e eklendi
  - UI'da unload butonu eklendi (hem üstte hem Model Ayarları panelinde)
  - Buton her zaman görünür (model yoksa disabled)

### 2. Context Length Ayarı - Preset Butonlar ile Kolay Seçim

**Problem**: 
- Slider ile rastgele değerler seçilebiliyordu (8888, 105984 gibi)
- Kullanıcı hangi değeri seçeceğini bilemiyordu
- LM Studio ve Ollama'da Max Tokens düzenlenebiliyordu
- GGUF'ta context length sabit kalıyordu

**Çözüm**:
- Slider kaldırıldı, yerine **6 preset buton** eklendi
- Her buton optimize edilmiş değerler içeriyor
- Görsel geri bildirim ve açıklamalar eklendi

**Preset Değerler**:
| Buton | Değer | Açıklama | Kullanım |
|-------|-------|----------|----------|
| 4K ⚡ | 4096 | Hızlı | Kısa konuşmalar, hızlı başlatma |
| 8K ✅ | 8192 | Standart | Normal kullanım, dengeli |
| 16K 📚 | 16384 | Uzun | Uzun konuşmalar |
| 32K 🔥 | 32768 | Çok Uzun | Büyük dosya analizi |
| 64K 💪 | 65536 | Maksimum | Çok uzun context |
| 128K 🚀 | 131072 | Ultra | Maksimum bağlam (yüksek VRAM) |

**Akış**:
1. GGUF Model Browser → Model seç
2. Model Ayarları panelinde context length slider'ı ayarla (örn: 8192)
3. "Ayarları Uygula ve Kullan" butonuna bas
4. Model GPU'ya `n_ctx=8192` ile yüklenir
5. Terminal'de `n_ctx=8192` görünür

**Dosyalar**:
- `local-ai/src/components/GGUFModelBrowser.tsx`
  - Context length input'u düzenlenebilir yapıldı
  - AI Settings'den okuma kaldırıldı
  - `applyModelConfig()` basitleştirildi
  - `contextLength` state'i direkt kullanılıyor

## Karşılaştırma: LM Studio vs GGUF

| Özellik | LM Studio | GGUF (Direkt) |
|---------|-----------|---------------|
| Context Length | AI Settings'den düzenlenebilir | Model Browser'dan düzenlenebilir |
| GPU Unload | Otomatik (LM Studio kapatılınca) | Manuel buton ile |
| Model Değiştirme | LM Studio'da değiştir | GPU'dan kaldır → Yeni model yükle |
| Ayar Yeri | AI Ayarları → Modeller | GGUF Model Browser → Model Ayarları |

## Test Senaryoları

### GPU Unload Testi:
1. ✅ GGUF model GPU'ya yükle
2. ✅ "🎮 GPU'dan Kaldır" butonunun göründüğünü doğrula
3. ✅ Butona tıkla
4. ✅ Model GPU'dan kaldırıldığını doğrula
5. ✅ Başka bir model yükle (uygulama yeniden başlatmadan)

### Context Length Testi:
1. ✅ GGUF Model Browser → Model seç
2. ✅ Context Length slider'ı 8192'ye ayarla
3. ✅ "Ayarları Uygula ve Kullan" butonuna bas
4. ✅ Terminal'de `n_ctx=8192` görünmeli
5. ✅ 16384, 32768, 65536 değerleri ile test et

### Farklı Modeller Farklı Context Testi:
1. ✅ Model A'yı 4096 context ile yükle
2. ✅ GPU'dan kaldır
3. ✅ Model B'yi 16384 context ile yükle
4. ✅ Her model kendi context'i ile çalışmalı

## Teknik Detaylar

### Context Length Slider:
```typescript
<input
  type="range"
  min="512"
  max="131072"
  step="512"
  value={contextLength}
  onChange={(e) => setContextLength(parseInt(e.target.value))}
  className="w-full"
/>
```

### Basitleştirilmiş Context Kullanımı:
```typescript
const applyModelConfig = async () => {
  // Direkt UI'daki değeri kullan
  const aiSettingsMaxTokens = contextLength; // 8192
  
  const ggufConfig = {
    contextLength: aiSettingsMaxTokens,
    ...
  };
  
  await loadGgufModel({
    contextLength: aiSettingsMaxTokens,
    maxTokens: aiSettingsMaxTokens
  });
};
```

## Bilinen Sınırlamalar

1. Context length maksimum 128K tokens
2. Yüksek context (>32K) çok VRAM gerektirir
3. GPU unload işlemi birkaç saniye sürebilir
4. Her model değişikliğinde GPU'dan kaldırma gerekli

## Kullanıcı Deneyimi İyileştirmeleri

### Öncesi:
- ❌ Context length AI Settings'den ayarlanıyordu (karmaşık)
- ❌ GGUF için sabit kalıyordu
- ❌ Her model için aynı context kullanılıyordu

### Sonrası:
- ✅ Context length model ayarları panelinde (kolay erişim)
- ✅ Slider ile hızlı ayarlama
- ✅ Her model kendi context'i ile yüklenebilir
- ✅ Görsel geri bildirim (emoji + açıklama)

## Sonraki Adımlar

- [ ] Context length'i model yükleme sırasında dinamik olarak ayarlama
- [ ] GPU memory kullanımını gösterme
- [ ] Önerilen context length hesaplama (model boyutuna göre)
- [ ] Context length presets (Hızlı: 2K, Standart: 8K, Uzun: 32K)

## İlgili Dosyalar

- `local-ai/src/components/GGUFModelBrowser.tsx` - Ana değişiklikler
- `local-ai/src/services/ggufProvider.ts` - `unloadGgufModel()` fonksiyonu
- `local-ai/src/services/aiProvider.ts` - Context kullanımı

## Notlar

- Context length artık her model için ayrı ayrı ayarlanabilir
- LM Studio ve Ollama ile aynı kullanıcı deneyimi sağlandı
- GPU unload özelliği model değiştirmeyi kolaylaştırdı
- Slider kullanımı daha sezgisel ve hızlı
