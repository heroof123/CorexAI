# 🚀 OAuth Hızlı Başlangıç

Hesap bağlama özelliğini 5 dakikada aktif edin!

---

## ✅ Gereksinimler

- ✅ GitHub hesabı (GitHub OAuth için)
- ✅ Microsoft hesabı (Microsoft OAuth için)
- ✅ İnternet bağlantısı
- ✅ Tarayıcı (popup'lara izin verin)

---

## 📝 Hızlı Kurulum

### 1. OAuth App Oluşturun

#### GitHub:
```
1. https://github.com/settings/developers
2. "New OAuth App"
3. Callback URL: http://localhost:1420/auth/github/callback
4. Client ID ve Secret'ı kopyalayın
```

#### Microsoft:
```
1. https://portal.azure.com
2. "App registrations" → "New registration"
3. Redirect URI: http://localhost:1420/auth/microsoft/callback
4. Client ID ve Secret'ı kopyalayın
```

### 2. .env Dosyası Oluşturun

```bash
# Proje kök dizininde
cp .env.example .env
```

### 3. Credentials'ı Ekleyin

`.env` dosyasını düzenleyin:

```env
VITE_GITHUB_CLIENT_ID=your_client_id
VITE_GITHUB_CLIENT_SECRET=your_client_secret

VITE_MICROSOFT_CLIENT_ID=your_client_id
VITE_MICROSOFT_CLIENT_SECRET=your_client_secret
```

### 4. Uygulamayı Başlatın

```bash
npm run tauri:dev
```

### 5. Test Edin

1. Sol panelde **👤 Accounts** ikonuna tıklayın
2. **"Sign in with GitHub"** veya **"Sign in with Microsoft"** butonuna tıklayın
3. Tarayıcıda izinleri onaylayın
4. Başarılı! ✅

---

## 🎯 Sonuç

Artık hesaplarınız bağlı! Şunları yapabilirsiniz:

- ✅ Profil bilgilerinizi görün
- ✅ Token durumunu kontrol edin
- ✅ Token'ı yenileyin
- ✅ Hesaptan çıkış yapın

---

## 📚 Detaylı Dokümantasyon

Daha fazla bilgi için: [OAUTH-SETUP-GUIDE.md](./OAUTH-SETUP-GUIDE.md)

---

## ❓ Sorun mu var?

**Hata: "Invalid client_id"**
→ `.env` dosyasını kontrol edin ve uygulamayı yeniden başlatın

**Hata: "Redirect URI mismatch"**
→ OAuth App ayarlarında callback URL'i kontrol edin

**Tarayıcı açılmıyor**
→ Popup blocker'ı kapatın

---

**Hazır!** 🎉 Artık OAuth entegrasyonu çalışıyor.
