# 🔐 OAuth Hesap Bağlama Kurulum Rehberi

Bu rehber, Corex IDE'de GitHub ve Microsoft hesap bağlama özelliğini aktif etmek için gereken adımları açıklar.

---

## 📋 İçindekiler

1. [GitHub OAuth Kurulumu](#github-oauth-kurulumu)
2. [Microsoft OAuth Kurulumu](#microsoft-oauth-kurulumu)
3. [Ortam Değişkenlerini Ayarlama](#ortam-değişkenlerini-ayarlama)
4. [Test Etme](#test-etme)
5. [Sorun Giderme](#sorun-giderme)

---

## 🐙 GitHub OAuth Kurulumu

### Adım 1: OAuth App Oluşturma

1. GitHub'da oturum açın
2. [Developer Settings](https://github.com/settings/developers) sayfasına gidin
3. Sol menüden **"OAuth Apps"** seçin
4. **"New OAuth App"** butonuna tıklayın

### Adım 2: Uygulama Bilgilerini Doldurun

```
Application name: Corex IDE
Homepage URL: http://localhost:1420
Application description: AI-powered Code Editor
Authorization callback URL: http://localhost:1420/auth/github/callback
```

### Adım 3: Client ID ve Secret Alın

- **Register application** butonuna tıklayın
- **Client ID** otomatik oluşturulacak (kopyalayın)
- **Generate a new client secret** butonuna tıklayın
- **Client Secret** oluşturulacak (kopyalayın - bir daha gösterilmeyecek!)

### Adım 4: İzinler (Scopes)

Corex IDE şu izinleri kullanır:
- `user:email` - Email adresini okuma
- `repo` - Repository'lere erişim (opsiyonel)

---

## 🪟 Microsoft OAuth Kurulumu

### Adım 1: Azure Portal'da App Registration

1. [Azure Portal](https://portal.azure.com) oturum açın
2. **"Azure Active Directory"** → **"App registrations"** gidin
3. **"New registration"** butonuna tıklayın

### Adım 2: Uygulama Bilgilerini Doldurun

```
Name: Corex IDE
Supported account types: Accounts in any organizational directory and personal Microsoft accounts
Redirect URI: 
  - Platform: Web
  - URL: http://localhost:1420/auth/microsoft/callback
```

### Adım 3: Client ID ve Secret Alın

**Client ID:**
- Overview sayfasında **"Application (client) ID"** görünür (kopyalayın)

**Client Secret:**
1. Sol menüden **"Certificates & secrets"** seçin
2. **"New client secret"** butonuna tıklayın
3. Description: "Corex IDE Secret"
4. Expires: 24 months (önerilen)
5. **Add** butonuna tıklayın
6. **Value** sütunundaki değeri kopyalayın (bir daha gösterilmeyecek!)

### Adım 4: API İzinleri

1. Sol menüden **"API permissions"** seçin
2. **"Add a permission"** → **"Microsoft Graph"** → **"Delegated permissions"**
3. Şu izinleri ekleyin:
   - `User.Read` - Kullanıcı profilini okuma
   - `openid` - OpenID Connect
   - `profile` - Profil bilgileri
   - `email` - Email adresi

4. **"Grant admin consent"** butonuna tıklayın (opsiyonel ama önerilen)

---

## ⚙️ Ortam Değişkenlerini Ayarlama

### Adım 1: .env Dosyası Oluşturun

Proje kök dizininde `.env` dosyası oluşturun:

```bash
# Proje kök dizininde
cp .env.example .env
```

### Adım 2: Credentials'ı Ekleyin

`.env` dosyasını düzenleyin:

```env
# GitHub OAuth
VITE_GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
VITE_GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678

# Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
VITE_MICROSOFT_CLIENT_SECRET=AbC~1234567890aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

### Adım 3: .gitignore Kontrolü

`.env` dosyasının `.gitignore`'da olduğundan emin olun:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

---

## 🧪 Test Etme

### Adım 1: Uygulamayı Başlatın

```bash
# Geliştirme modu
npm run tauri:dev

# veya
npm run dev
```

### Adım 2: Accounts Panelini Açın

1. Sol taraftaki Activity Bar'dan **👤 Accounts** ikonuna tıklayın
2. GitHub veya Microsoft kartında **"Sign in"** butonuna tıklayın

### Adım 3: OAuth Flow'u Tamamlayın

1. Tarayıcı otomatik açılacak
2. İzinleri onaylayın
3. "Authentication Successful" mesajını görün
4. Tarayıcı penceresi kapanacak
5. Corex IDE'de hesabınız bağlı görünecek

### Beklenen Sonuç

✅ Hesap kartında:
- Profil fotoğrafınız
- Kullanıcı adınız
- Email adresiniz
- Yeşil durum göstergesi
- "Sign Out" butonu

---

## 🔧 Sorun Giderme

### Hata: "Invalid client_id"

**Çözüm:**
- `.env` dosyasındaki Client ID'yi kontrol edin
- Boşluk veya özel karakter olmadığından emin olun
- Uygulamayı yeniden başlatın (`npm run tauri:dev`)

### Hata: "Redirect URI mismatch"

**Çözüm:**
- OAuth App ayarlarında callback URL'i kontrol edin
- Tam olarak şu olmalı: `http://localhost:1420/auth/github/callback`
- Port numarasını kontrol edin (Tauri default: 1420)

### Hata: "OAuth timeout"

**Çözüm:**
- Tarayıcıda popup blocker kapalı olmalı
- 5 dakika içinde OAuth flow'u tamamlayın
- Firewall/antivirus localhost:1420'yi engelliyor olabilir

### Hata: "Failed to exchange code for token"

**Çözüm:**
- Client Secret'ı kontrol edin
- Secret'ın süresi dolmuş olabilir (yeni oluşturun)
- CORS ayarlarını kontrol edin

### Token Expired Uyarısı

**Çözüm:**
- "Refresh Token" butonuna tıklayın
- Veya "Sign Out" → "Sign In" yapın
- Refresh token yoksa yeniden giriş yapın

---

## 🔒 Güvenlik Notları

### ✅ Yapılması Gerekenler

- `.env` dosyasını **asla** Git'e commit etmeyin
- Client Secret'ları güvenli saklayın
- Production'da environment variables kullanın
- Token'ları şifreli saklayın (localStorage'da plain text)

### ⚠️ Dikkat Edilmesi Gerekenler

- Client Secret'lar frontend kodunda görünür (Tauri backend'e taşınmalı)
- Localhost dışında kullanım için HTTPS gerekli
- Token refresh mekanizması implement edilmeli
- Rate limiting eklenebilir

---

## 📚 Ek Kaynaklar

### GitHub OAuth Dokümantasyonu
- [Creating an OAuth App](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app)
- [Authorizing OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)

### Microsoft OAuth Dokümantasyonu
- [Register an application](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [OAuth 2.0 authorization code flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

### Tauri OAuth
- [Tauri Deep Linking](https://tauri.app/v1/guides/features/deep-link)
- [Tauri Window Management](https://tauri.app/v1/api/js/window)

---

## 🎯 Sonraki Adımlar

Hesap bağlama çalıştıktan sonra:

1. **Token Yenileme**: Otomatik token refresh ekleyin
2. **Profil Senkronizasyonu**: Ayarları cloud'a kaydedin
3. **Git Entegrasyonu**: GitHub token'ı ile Git işlemleri
4. **Gist Desteği**: Kod snippet'leri Gist'e kaydedin
5. **OneDrive Sync**: Microsoft hesabı ile dosya senkronizasyonu

---

**Hazırlayan:** Corex Development Team  
**Tarih:** Şubat 2026  
**Versiyon:** 1.0.0

