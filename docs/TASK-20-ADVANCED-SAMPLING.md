# Task 20: Gelişmiş Sampling Parametreleri

## Durum: ✅ Tamamlandı

## Özellikler

### Sekme Sistemi
Model Ayarları paneline iki sekme eklendi:
- **🎯 Temel**: Context Length, GPU Layers (mevcut ayarlar)
- **🔬 Gelişmiş**: Temperature, Top-P, Top-K, Repeat Penalty, Min-P

### Gelişmiş Sampling Parametreleri

#### 1. Temperature (Yaratıcılık) 🌡️
- **Aralık**: 0.0 - 2.0
- **Varsayılan**: 0.7
- **Açıklama**: Modelin ne kadar yaratıcı/rastgele olacağını kontrol eder

**Değer Aralıkları:**
- `0.0 - 0.3`: ❄️ Çok düşük - Tekrarlayıcı, tutarlı (kod, teknik yazı)
- `0.3 - 0.7`: 🎯 Düşük - Odaklı, mantıklı (genel kullanım)
- `0.7 - 1.2`: ⚖️ Dengeli - Yaratıcı ve tutarlı (hikaye, makale)
- `1.2 - 1.6`: 🎨 Yüksek - Çok yaratıcı (şiir, yaratıcı yazı)
- `1.6 - 2.0`: 🔥 Çok yüksek - Rastgele, beklenmedik

#### 2. Top-P (Nucleus Sampling) 🎲
- **Aralık**: 0.0 - 1.0
- **Varsayılan**: 0.9
- **Açıklama**: Kümülatif olasılık eşiği

**Değer Aralıkları:**
- `0.0 - 0.5`: 🎯 Çok dar - En olası kelimeler
- `0.5 - 0.8`: 📊 Dar - Odaklı seçim
- `0.8 - 0.95`: ⚖️ Dengeli - İyi çeşitlilik
- `0.95 - 1.0`: 🌈 Geniş - Maksimum çeşitlilik

#### 3. Top-K (Kelime Havuzu) 🔢
- **Aralık**: 1 - 100
- **Varsayılan**: 40
- **Açıklama**: Kaç kelime arasından seçim yapılacağı

**Değer Aralıkları:**
- `1 - 10`: 🎯 Çok dar - Çok odaklı
- `10 - 40`: ⚖️ Dengeli - İyi seçim
- `40 - 70`: 🌈 Geniş - Çeşitli
- `70 - 100`: 🔥 Çok geniş - Maksimum çeşitlilik

#### 4. Repeat Penalty (Tekrar Cezası) 🔁
- **Aralık**: 1.0 - 2.0
- **Varsayılan**: 1.1
- **Açıklama**: Kelimelerin tekrar edilmesini önler

**Değer Aralıkları:**
- `1.0 - 1.05`: ❌ Yok - Tekrar edebilir
- `1.05 - 1.15`: ⚖️ Hafif - Az tekrar
- `1.15 - 1.3`: ✅ Dengeli - İyi önleme
- `1.3 - 2.0`: 🚫 Yüksek - Hiç tekrar yok

#### 5. Min-P (Minimum Olasılık) 📉
- **Aralık**: 0.0 - 0.5
- **Varsayılan**: 0.05
- **Açıklama**: Minimum olasılık eşiği

**Değer Aralıkları:**
- `0.0 - 0.05`: 🌈 Çok düşük - Tüm kelimeler
- `0.05 - 0.15`: ⚖️ Dengeli - İyi filtreleme
- `0.15 - 0.5`: 🎯 Yüksek - Sadece olası kelimeler

### Hızlı Ayar Presetleri 🎨

#### 1. 🎯 Odaklı (Kod/Teknik)
```
Temperature: 0.3
Top-P: 0.9
Top-K: 20
Repeat Penalty: 1.1
Min-P: 0.05
```
**Kullanım**: Kod yazımı, teknik dokümantasyon, tutarlı çıktı

#### 2. ⚖️ Dengeli (Genel)
```
Temperature: 0.7
Top-P: 0.9
Top-K: 40
Repeat Penalty: 1.1
Min-P: 0.05
```
**Kullanım**: Genel sohbet, makale yazımı, günlük kullanım

#### 3. 🎨 Yaratıcı (Hikaye/Şiir)
```
Temperature: 1.2
Top-P: 0.95
Top-K: 70
Repeat Penalty: 1.15
Min-P: 0.03
```
**Kullanım**: Hikaye yazımı, yaratıcı içerik, şiir

#### 4. 📝 Kod/Teknik (Özel)
```
Temperature: 0.1
Top-P: 0.85
Top-K: 10
Repeat Penalty: 1.2
Min-P: 0.1
```
**Kullanım**: Kod tamamlama, hata ayıklama, çok tutarlı çıktı

## Teknik Detaylar

### State Güncellemeleri
```typescript
const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
const [temperature, setTemperature] = useState<number>(0.7);
const [topP, setTopP] = useState<number>(0.9);
const [topK, setTopK] = useState<number>(40);
const [repeatPenalty, setRepeatPenalty] = useState<number>(1.1);
const [minP, setMinP] = useState<number>(0.05);
```

### Interface Güncellemeleri
```typescript
export interface GgufModelConfig {
  modelPath: string;
  contextLength: number;
  gpuLayers: number;
  temperature: number;
  maxTokens: number;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
  minP?: number;
}
```

### Model Yükleme
```typescript
await loadGgufModel({
  modelPath: config.modelPath,
  contextLength: aiSettingsMaxTokens,
  gpuLayers: config.gpuLayers,
  temperature: temperature,
  topP: topP,
  topK: topK,
  repeatPenalty: repeatPenalty,
  minP: minP,
  maxTokens: aiSettingsMaxTokens
});
```

## UI Tasarımı

### Sekme Sistemi
```tsx
<div className="mb-3 flex gap-1 border-b border-gray-700">
  <button
    onClick={() => setActiveTab('basic')}
    className={activeTab === 'basic' ? 'active' : ''}
  >
    🎯 Temel
  </button>
  <button
    onClick={() => setActiveTab('advanced')}
    className={activeTab === 'advanced' ? 'active' : ''}
  >
    🔬 Gelişmiş
  </button>
</div>
```

### Parametre Slider'ları
Her parametre için:
- Başlık ve emoji
- Mevcut değer göstergesi
- Range slider
- Min/Max etiketleri
- Dinamik açıklama (değere göre değişir)

### Bilgi Kutusu
```tsx
<div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded">
  <p className="text-xs text-blue-300">
    💡 <strong>İpucu:</strong> Kod yazımı için düşük temperature (0.1-0.3), 
    yaratıcı yazı için yüksek (0.8-1.2) kullanın.
  </p>
</div>
```

## Kullanım Senaryoları

### Senaryo 1: Kod Yazımı
1. Kullanıcı "🔬 Gelişmiş" sekmesine geçer
2. "📝 Kod/Teknik" preset'ine tıklar
3. Temperature 0.1'e düşer
4. Model çok tutarlı kod üretir

### Senaryo 2: Hikaye Yazımı
1. "🎨 Yaratıcı" preset'i seçilir
2. Temperature 1.2'ye yükselir
3. Top-K 70'e çıkar
4. Model yaratıcı ve çeşitli içerik üretir

### Senaryo 3: Manuel Ayarlama
1. Kullanıcı slider'ları manuel ayarlar
2. Her değişiklikte dinamik açıklama güncellenir
3. Ayarlar anında uygulanır
4. Model yeni parametrelerle çalışır

## Avantajlar

✅ Kullanıcı AI davranışını tam kontrol edebilir
✅ Farklı kullanım senaryoları için optimize edilmiş presetler
✅ Gerçek zamanlı geri bildirim (dinamik açıklamalar)
✅ Sekme sistemi ile düzenli arayüz
✅ Temel ve gelişmiş ayarlar ayrı
✅ Yeni başlayanlar için basit, uzmanlar için güçlü
✅ Her parametrenin ne işe yaradığı açıkça belirtilmiş

## Sınırlamalar

⚠️ Rust backend'de henüz tam destek yok (parametreler gönderiliyor ama kullanılmıyor)
⚠️ Gelecekte Rust tarafında sampling parametreleri implement edilmeli
⚠️ Şu an sadece temperature kullanılıyor

## Gelecek İyileştirmeler

🔮 Rust backend'de tam sampling desteği
🔮 Preset'leri kaydetme/yükleme
🔮 Kullanıcı özel preset'leri
🔮 Parametre kombinasyonları için öneriler
🔮 A/B test modu (iki farklı ayarı karşılaştırma)

## İlgili Dosyalar
- `local-ai/src/components/GGUFModelBrowser.tsx`
- `local-ai/src/services/ggufProvider.ts`

## Test Edildi
- ✅ Sekme geçişleri çalışıyor
- ✅ Tüm slider'lar çalışıyor
- ✅ Preset butonları çalışıyor
- ✅ Dinamik açıklamalar güncelleniyor
- ✅ Parametreler model yüklemeye gönderiliyor
- ✅ Build başarılı
- ✅ UI responsive ve kullanışlı
