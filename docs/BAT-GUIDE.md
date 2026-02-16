# 🚀 Batch Dosyaları Kullanım Kılavuzu

## 📋 Dosyalar ve Kullanımları

### 1️⃣ **setup.bat** - İlk Kurulum
**Ne yapar:**
- Node.js, npm, Rust'ın yüklü olup olmadığını kontrol eder
- npm dependencies yükler
- Gerekli klasörleri oluşturur

**Ne zaman kullanılır:**
- İlk defa projeyi kurarken
- Temiz kurulum yapmak istediğinizde

**Kullanım:**
```bash
# Projenin ana dizininde
setup.bat
```

---

### 2️⃣ **start-dev.bat** - Geliştirme Modu
**Ne yapar:**
- node_modules yoksa yükler
- Rust kontrolü yapar
- Development server'ı başlatır (`npm run tauri dev`)

**Ne zaman kullanılır:**
- Her gün kod yazarken
- Projeyi test ederken

**Kullanım:**
```bash
# Çift tıkla veya terminal'de:
start-dev.bat
```

**Çıkmak için:** `Ctrl+C`

---

### 3️⃣ **build.bat** - Production Build
**Ne yapar:**
- Production build yapar
- .exe installer oluşturur
- Build klasörünü açar

**Ne zaman kullanılır:**
- Uygulamayı dağıtmak için
- Final sürüm oluştururken

**Kullanım:**
```bash
build.bat
```

**Sonuç:**
- EXE: `src-tauri/target/release/local-ai.exe`
- Installer: `src-tauri/target/release/bundle/`

---

### 4️⃣ **clean.bat** - Temizlik
**Ne yapar:**
- node_modules siler
- Tauri build cache temizler
- npm cache temizler
- package-lock.json siler

**Ne zaman kullanılır:**
- Garip hatalar olunca
- Temiz baştan başlamak isteyince
- Disk alanı açmak için

**Kullanım:**
```bash
clean.bat
```

⚠️ **UYARI:** Sonra tekrar `setup.bat` çalıştırmanız gerekir!

---

## 🎯 Günlük İş Akışı

### İlk Gün (Kurulum):
```
1. setup.bat          → Kurulum yap
2. Dosyaları yerleştir → ai.ts, App.tsx vs.
3. start-dev.bat      → Başlat ve test et
```

### Normal Günler:
```
1. start-dev.bat      → Çalıştır
2. Kod yaz            → VS Code'da
3. Test et            → Uygulama otomatik yenilenir
4. Ctrl+C             → Kapat
```

### Release Günü:
```
1. build.bat          → Build yap
2. Test et            → .exe'yi çalıştır
3. Dağıt              → Installer'ı paylaş
```

### Sorun Çözme:
```
1. clean.bat          → Temizle
2. setup.bat          → Yeniden kur
3. start-dev.bat      → Başlat
```

---

## 🖱️ Hızlı Erişim İpuçları

### Masaüstü Kısayolu Oluştur:

1. **start-dev.bat** üzerine sağ tık
2. "Kısayol oluştur"
3. Kısayolu masaüstüne taşı
4. İstersen isim değiştir: "🚀 AI IDE"

Artık her seferinde masaüstünden çift tıkla! 🎉

### Icon Değiştir:

1. Kısayol üzerine sağ tık → Özellikler
2. "Simge Değiştir"
3. İstediğin iconu seç

---

## 📊 Batch Dosyası Karşılaştırması

| Dosya | Hız | Amaç | Sıklık |
|-------|-----|------|--------|
| **setup.bat** | 2-5 dk | Kurulum | Bir kere |
| **start-dev.bat** | 10-30 sn | Geliştirme | Her gün |
| **build.bat** | 5-10 dk | Release | Nadiren |
| **clean.bat** | 30 sn | Temizlik | Sorun olunca |

---

## 🐛 Sorun Giderme

### "Rust bulunamadı" hatası:
```
1. https://rustup.rs/ adresinden Rust yükle
2. Bilgisayarı yeniden başlat
3. setup.bat'ı tekrar çalıştır
```

### "npm install failed" hatası:
```
1. clean.bat çalıştır
2. İnternet bağlantısını kontrol et
3. setup.bat'ı tekrar çalıştır
```

### Uygulama açılmıyor:
```
1. clean.bat
2. setup.bat
3. start-dev.bat
```

### Port zaten kullanımda:
```
1. Ctrl+C ile mevcut server'ı kapat
2. Veya başka bir terminal penceresini kapat
3. start-dev.bat'ı tekrar çalıştır
```

---

## 💡 Pro İpuçları

### Terminal Açık Kalmasın İstiyorsan:
`start-dev.bat` yerine şunu kullan:
```batch
start "" cmd /c start-dev.bat
```

### Otomatik Başlatma (Windows Startup):
1. `Win+R` → `shell:startup`
2. start-dev.bat kısayolunu buraya kopyala
3. Bilgisayar açılınca otomatik başlar

### Birden Fazla Proje:
Her proje için ayrı klasörde bu bat dosyaları olsun:
```
C:\Projects\
├── ai-ide-1\
│   └── start-dev.bat
├── ai-ide-2\
│   └── start-dev.bat
└── ai-ide-3\
    └── start-dev.bat
```

---

## ✅ Hızlı Başlangıç Checklist

- [ ] 1. setup.bat çalıştır
- [ ] 2. Tüm dosyaları yerleştir
- [ ] 3. start-dev.bat ile test et
- [ ] 4. Masaüstü kısayolu oluştur
- [ ] 5. INSTALLATION.md'yi oku
- [ ] 6. AI-EXAMPLES.md'ye göz at

Hazırsın! 🚀

---

## 📞 Yardım

Sorun mu var?
1. clean.bat çalıştır
2. TROUBLESHOOTING.md'yi kontrol et
3. Console loglarına bak (F12)

Mutlu kodlamalar! 🎉
