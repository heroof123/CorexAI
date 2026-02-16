# 🎵 Corex Ses Sistemi Rehberi

## Ses Dosyaları

### Açılış Müziği
- **Format**: MP3, OGG veya WAV
- **Süre**: 6-8 saniye
- **Dosya Boyutu**: Maksimum 500KB
- **Kalite**: 128kbps MP3 yeterli
- **Dosya Adı**: `startup-sound.mp3`
- **Konum**: `public/startup-sound.mp3`
- **Davranış**: Tek sefer çalar, tekrar etmez

### Bildirim Sesi
- **Format**: Programatik olarak üretilir (Web Audio API)
- **Süre**: 1.5 saniye
- **Tarz**: Kısa, tatlı, dikkat çekici 3 nota
- **Tetikleyiciler**: Error, Warning, Success bildirimleri
- **Ses Seviyesi**: %15 (yumuşak)

## Mevcut Ses Sistemi

### Açılış Sesi
- **Durum**: Programatik olarak üretiliyor
- **Özellikler**:
  - 6 saniyelik dramatik açılış
  - Düşük hum ile başlar (0-1 saniye)
  - Yükselen sweep (1-4 saniye)
  - Harmonik katmanlar (2-5 saniye)
  - Dijital glitch efekti (3-4 saniye)
  - Final chord (4-6 saniye)
  - Yumuşak fade in/out
- **Kontrol**: Title bar'da müzik butonu ile açılıp kapatılabilir

### Bildirim Sesi
- **Durum**: Programatik olarak üretiliyor
- **Özellikler**:
  - 3 nota: A5 → C6 → E6
  - Her nota 0.3 saniye
  - Bell curve envelope
  - Son nota decay efekti ile biter
- **Tetikleme**: Error, Warning, Success bildirimleri için otomatik

## Müzik Tarzı ve Tema

### Açılış Müziği
- **Tarz**: Futuristik, elektronik, sinematik
- **Tema**: AI, teknoloji, gelecek, güç
- **Ruh Hali**: Dramatik, ilham verici, güçlü
- **Enstrümanlar**: Synthesizer, elektronik sesler, dijital efektler
- **Yapı**: Sıfırdan başlayıp yükselir, dorukta biter

### Bildirim Sesi
- **Tarz**: Minimal, tonal, hoş
- **Tema**: Dikkat çekici ama rahatsız etmeyen
- **Ruh Hali**: Bilgilendirici, nazik
- **Yapı**: Yükselen 3 nota sekansı

## AI Müzik Üretici Servisleri

### 1. Suno AI (Önerilen)
- **Website**: https://suno.com
- **Prompt Örneği**: 
  ```
  "6 second dramatic AI startup sound, cinematic electronic intro, starts from silence builds to powerful climax, synthesizer, no loop, single play"
  ```

### 2. Mubert AI
- **Website**: https://mubert.com
- **Kategori**: "Tech", "Cinematic", "Electronic"
- **Ayar**: "Intro", "Build-up", "No loop"

### 3. AIVA
- **Website**: https://aiva.ai
- **Tarz**: "Electronic", "Cinematic"
- **Yapı**: "Intro/Build-up"

## Prompt Önerileri (AI Müzik Servisleri İçin)

### Açılış Müziği Prompt'ları
```
"Dramatic AI startup sound, 6 seconds, starts silent builds to epic climax, no loop, single play, futuristic synthesizer"

"Cinematic tech company intro, electronic build-up from zero to hero, 6 seconds, no repeat, AI theme"

"Powerful AI activation sound, dramatic electronic crescendo, starts from silence, 6 seconds, synthesizer epic"

"Corex AI startup theme, futuristic electronic build, dramatic crescendo, single play, no loop, 6 seconds"
```

### Müzik Açıklaması
```
- Başlangıç: Tam sessizlik veya çok düşük hum
- 0-2 saniye: Yavaş build-up, düşük frekanslı sesler
- 2-4 saniye: Harmonikler eklenir, enerji artar
- 4-6 saniye: Doruk noktası, güçlü final chord
- Bitiş: Keskin son veya kısa fade-out
- Genel: Tek sefer çalar, tekrar etmez
```

## Kod İmplementasyonu

### Açılış Müziği Kontrolü
```typescript
// WelcomeScreen.tsx içinde
const [isMusicEnabled, setIsMusicEnabled] = useState(true);
const [hasPlayedStartupSound, setHasPlayedStartupSound] = useState(false);

// Tek sefer çalma
useEffect(() => {
  if (isMusicEnabled && !hasPlayedStartupSound) {
    playStartupSound();
    setHasPlayedStartupSound(true);
  }
}, [isMusicEnabled, hasPlayedStartupSound]);
```

### Bildirim Sesi Kontrolü
```typescript
// NotificationSystem.tsx içinde
const addNotification = (notification) => {
  // Bildirim ekle
  setNotifications(prev => [...prev, newNotification]);
  
  // Ses çal (sadece önemli bildirimler için)
  if (['error', 'warning', 'success'].includes(notification.type)) {
    playNotificationSound();
  }
};
```

## Ses Seviyesi Ayarları

### Açılış Müziği
- **Mevcut**: %25 ses seviyesi
- **Ayar**: `channelData[i] = finalSample * envelope * 0.25`
- **Önerilen**: 0.15-0.35 arası

### Bildirim Sesi
- **Mevcut**: %15 ses seviyesi
- **Ayar**: `channelData[i] = currentNote * envelope * 0.15`
- **Önerilen**: 0.10-0.20 arası (rahatsız etmemeli)

## Dosya Hazırlama Adımları

1. **Müzik Üretimi**: AI servislerden 6 saniyelik tek çalım müzik
2. **Düzenleme**: Audacity ile başlangıcı tam sessiz yap
3. **Format**: MP3 128kbps'e çevir
4. **Test**: Tek sefer çaldığını kontrol et
5. **Yerleştirme**: `public/startup-sound.mp3` olarak kaydet

## Sorun Giderme

### Müzik Tekrar Ediyor
- Dosyanın loop flag'i kapalı olmalı
- Kod içinde `source.loop = false` ekle
- AI serviste "no loop" belirt

### Ses Çok Yüksek/Düşük
- Kod içinde volume değerlerini ayarla
- Açılış: `0.25` değerini değiştir
- Bildirim: `0.15` değerini değiştir

### Autoplay Engelleniyor
- Modern tarayıcılar autoplay'i engelleyebilir
- İlk kullanıcı etkileşiminden sonra çalar
- Programatik ses fallback'i mevcut