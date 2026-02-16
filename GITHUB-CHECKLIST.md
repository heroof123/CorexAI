# GitHub Yayınlama Kontrol Listesi

## ✅ Tamamlanan İşlemler

- [x] README.md güncellendi
  - Daha detaylı açıklamalar eklendi
  - Windows kullanıcıları için özel talimatlar
  - "Why Corex?" bölümü eklendi
  - Güvenlik ve gizlilik vurgusu yapıldı
  
- [x] LICENSE dosyası oluşturuldu (MIT)

- [x] GitHub issue templates eklendi
  - Bug report template
  - Feature request template
  
- [x] Pull request template eklendi

- [x] SECURITY.md dosyası oluşturuldu

- [x] .gitignore kontrol edildi (zaten iyi durumda)

## 📋 Yayınlamadan Önce Yapılacaklar

### 1. Hassas Bilgileri Kontrol Et
```bash
# .env dosyasının git'e eklenmediğinden emin ol
git status

# Eğer .env varsa:
git rm --cached .env
```

### 2. .env.example'ı Kontrol Et
- [ ] Gerçek API anahtarları yok
- [ ] Sadece örnek değerler var
- [ ] Tüm gerekli değişkenler listelenmiş

### 3. GitHub Repository Oluştur
```bash
# GitHub'da yeni repo oluştur (web arayüzünden)
# Sonra:
git init
git add .
git commit -m "Initial commit: Corex IDE v0.1.0"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/corex.git
git push -u origin main
```

### 4. Repository Ayarları (GitHub web arayüzünde)
- [ ] Description ekle: "AI-Powered Code Editor with local LLM support"
- [ ] Topics ekle: `ide`, `code-editor`, `ai`, `tauri`, `react`, `rust`, `llm`, `local-ai`
- [ ] Website ekle (varsa)
- [ ] Issues'ı aktif et
- [ ] Discussions'ı aktif et (isteğe bağlı)
- [ ] Wiki'yi aktif et (isteğe bağlı)

### 5. README'de Güncelle
- [ ] `yourusername` yerine gerçek GitHub kullanıcı adını yaz
- [ ] Screenshot ekle (isteğe bağlı ama önerilir)
- [ ] Demo GIF/video ekle (isteğe bağlı)

### 6. İlk Release Oluştur
```bash
# GitHub'da Releases > Create a new release
# Tag: v0.1.0
# Title: Corex IDE v0.1.0 - Initial Release
# Description: İlk kararlı sürüm, temel özellikler
```

### 7. Opsiyonel İyileştirmeler
- [ ] GitHub Actions ekle (CI/CD)
- [ ] Codecov entegrasyonu
- [ ] Dependabot aktif et
- [ ] Code of Conduct ekle
- [ ] Changelog dosyası oluştur

## 🎯 Yayınlandıktan Sonra

### Tanıtım
- [ ] Reddit'te paylaş (r/programming, r/rust, r/reactjs)
- [ ] Twitter/X'te duyur
- [ ] Dev.to'da makale yaz
- [ ] Hacker News'e gönder
- [ ] Product Hunt'a ekle

### Topluluk
- [ ] İlk issue'lara cevap ver
- [ ] PR'ları incele
- [ ] Discussions'da aktif ol
- [ ] Düzenli güncellemeler yap

## 📝 Notlar

- Projenin MIT lisanslı olduğundan emin ol
- SECURITY.md'deki email adresini güncelle
- Düzenli commit'ler yap (günlük/haftalık)
- Semantic versioning kullan (v0.1.0, v0.2.0, vb.)

## 🚀 Hızlı Başlangıç Komutları

```bash
# 1. Repo'yu hazırla
git init
git add .
git commit -m "Initial commit: Corex IDE v0.1.0"

# 2. GitHub'a yükle (önce GitHub'da repo oluştur)
git remote add origin https://github.com/KULLANICI_ADIN/corex.git
git branch -M main
git push -u origin main

# 3. Tag oluştur
git tag -a v0.1.0 -m "Initial release"
git push origin v0.1.0
```

## ⚠️ Önemli Uyarılar

1. **Hassas Bilgiler**: .env dosyasını asla commit'leme
2. **API Anahtarları**: Gerçek API anahtarlarını paylaşma
3. **Büyük Dosyalar**: node_modules ve dist klasörlerini commit'leme
4. **Lisans**: MIT lisansını kullanıyorsan, bunu README'de belirt

---

**Başarılar! 🎉**
