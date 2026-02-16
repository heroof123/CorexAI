# 🤖 Corex AI Yapılandırma Rehberi

## AI Ayarları Paneli

Kullanıcılar artık kendi AI modellerini ekleyebilir ve yapılandırabilir! **Gerçek AI bağlantıları yapılır.**

### 🚀 Nasıl Erişilir

1. **Model Selector'dan**: Sağ üstteki AI model butonuna tıklayın → "⚙️ Ayarlar"
2. **Klavye Kısayolu**: `Ctrl + ,` (Ayarlar) → AI sekmesi
3. **Doğrudan**: Model selector açıkken "Ayarlar" butonuna tıklayın

### 📋 Panel Sekmeleri

#### 1. 🏢 AI Sağlayıcıları
- **Mevcut Sağlayıcıları Görüntüle**: LM Studio, Ollama, Custom AI'lar
- **Durum Kontrolü**: Gerçek bağlantı testleri (🟢 Online, 🔴 Offline, 🟡 Test ediliyor)
- **Host + Port Ayarları**: IP adresi ve port numarası belirtebilme
- **Aktif/Pasif**: Sağlayıcıları açıp kapatabilme
- **Silme**: Custom sağlayıcıları silebilme

#### 2. 🧠 Modeller
- **Model Listesi**: Seçili sağlayıcının tüm modelleri
- **Model Ayarları**: Max tokens, temperature, specialty
- **📥 Modelleri Getir**: API'den mevcut modelleri otomatik çekme
- **Aktif/Pasif**: Modelleri açıp kapatabilme
- **Silme**: Custom modelleri silebilme

#### 3. ➕ Yeni Ekle
- **Yeni Sağlayıcı**: OpenAI, Anthropic, Local, Custom
- **Host + Port**: IP adresi ve port ayarları
- **Yeni Model**: Mevcut sağlayıcılara model ekleme

## 🌐 Farklı Bilgisayarlarda Kullanım

### Senaryo 1: Başka Bilgisayarda LM Studio
```
Durum: Arkadaşınızın bilgisayarında LM Studio var (IP: 192.168.1.100)
Çözüm: Yeni sağlayıcı ekleyin

1. AI Ayarları → Yeni Ekle
2. Sağlayıcı Adı: "Arkadaşın LM Studio"
3. Tür: Local
4. Host: 192.168.1.100
5. Port: 1234
6. Test Et → 🟢 Online olmalı
7. Aktif Et
```

### Senaryo 2: Farklı Port'ta Ollama
```
Durum: Ollama farklı port'ta çalışıyor (Port: 8080)
Çözüm: Port ayarını değiştirin

1. AI Ayarları → Yeni Ekle
2. Sağlayıcı Adı: "Custom Ollama"
3. Tür: Local
4. Host: 127.0.0.1
5. Port: 8080
6. Base URL otomatik oluşur: http://127.0.0.1:8080/v1
```

### Senaryo 3: Uzak Sunucuda AI
```
Durum: Sunucuda AI servisi var (IP: 10.0.0.50, Port: 5000)
Çözüm: Uzak bağlantı kurun

1. AI Ayarları → Yeni Ekle
2. Sağlayıcı Adı: "Sunucu AI"
3. Tür: Custom
4. Host: 10.0.0.50
5. Port: 5000
6. API Key: (varsa girin)
7. Test Et ve Aktif Et
```

## � Desteklenen AI Sağlayıcıları

### 1. OpenAI
```
Tür: openai
Base URL: https://api.openai.com/v1
API Key: sk-... (gerekli)
Modeller: gpt-4, gpt-3.5-turbo, gpt-4-turbo
```

### 2. Anthropic (Claude)
```
Tür: anthropic
Base URL: https://api.anthropic.com/v1
API Key: sk-ant-... (gerekli)
Modeller: claude-3-opus, claude-3-sonnet, claude-3-haiku
```

### 3. LM Studio (Local)
```
Tür: local
Host: 127.0.0.1 (veya farklı IP)
Port: 1234 (varsayılan)
Base URL: Otomatik oluşur
API Key: (opsiyonel)
Modeller: Yerel olarak yüklenen modeller
```

### 4. Ollama (Local)
```
Tür: local
Host: 127.0.0.1 (veya farklı IP)
Port: 11434 (varsayılan)
Base URL: Otomatik oluşur
API Key: (gerekli değil)
Modeller: llama3.1, codellama, mistral
```

### 5. Custom AI
```
Tür: custom
Host: [IP Adresi]
Port: [Port Numarası]
Base URL: [Manuel veya otomatik]
API Key: [Varsa]
Modeller: [Manuel ekleme veya API'den getirme]
```

## 📝 Yeni AI Sağlayıcısı Ekleme

### Adım 1: Sağlayıcı Bilgileri
1. **Sağlayıcı Adı**: Örn: "Arkadaşın AI Sunucusu"
2. **Tür**: Local, OpenAI, Anthropic, Custom seçin
3. **Host/IP**: 192.168.1.100, 10.0.0.50 gibi
4. **Port**: 1234, 11434, 8080 gibi
5. **API Key**: Gerekirse API anahtarını girin
6. **İkon**: Emoji seçin (🤖, 🧠, ⚡)
7. **Açıklama**: "Arkadaşın bilgisayarındaki LM Studio"

### Adım 2: Otomatik URL Oluşturma
- **Local/Custom**: `http://[HOST]:[PORT]/v1`
- **OpenAI**: `https://api.openai.com/v1`
- **Anthropic**: `https://api.anthropic.com/v1`

### Adım 3: Bağlantı Testi
- "Test Et" butonuna tıklayın
- Bağlantı durumunu kontrol edin
- 🟢 Online görürseniz devam edin

### Adım 4: Sağlayıcıyı Aktif Edin
- "Aktif" butonuna tıklayın
- Sağlayıcı yeşil çerçeve ile gösterilecek

## 🧠 Yeni Model Ekleme

### Yöntem 1: Manuel Ekleme
1. **Sağlayıcı Seçin**: Dropdown'dan aktif sağlayıcı
2. **Model Bilgileri**:
   - Model Adı: API'de kullanılan ad (örn: gpt-4)
   - Görünen Ad: Kullanıcı dostu ad (örn: GPT-4)
   - Uzmanlık Alanı: Kodlama, Chat, Analiz
   - Max Tokens: Token limiti (varsayılan: 4096)
3. **Model Ekle**: Otomatik aktif olur

### Yöntem 2: API'den Otomatik Getirme
1. **Modeller sekmesi**ne gidin
2. **Sağlayıcı seçin** (dropdown)
3. **"📥 Modelleri Getir"** butonuna tıklayın
4. **Otomatik ekleme**: İlk 5 model otomatik eklenir
5. **Manuel düzenleme**: Sonra ayarları değiştirebilirsiniz

## ⚙️ Popüler Kurulum Senaryoları

### LM Studio (Farklı Bilgisayar)
```json
{
  "name": "Arkadaşın LM Studio",
  "type": "local",
  "host": "192.168.1.100",
  "port": 1234,
  "baseUrl": "http://192.168.1.100:1234/v1",
  "icon": "🖥️",
  "description": "Arkadaşın bilgisayarındaki LM Studio"
}
```

**Kurulum:**
1. Arkadaşınızın IP adresini öğrenin (`ipconfig` / `ifconfig`)
2. LM Studio'da "Local Server" başlatın
3. Firewall'da port 1234'ü açın
4. Corex'te yeni sağlayıcı ekleyin

### Ollama (Farklı Port)
```json
{
  "name": "Custom Ollama",
  "type": "local", 
  "host": "127.0.0.1",
  "port": 8080,
  "baseUrl": "http://127.0.0.1:8080/v1",
  "icon": "🦙",
  "description": "Özel port'ta Ollama"
}
```

**Kurulum:**
1. Ollama'yı farklı port'ta başlatın: `OLLAMA_HOST=0.0.0.0:8080 ollama serve`
2. Corex'te yeni sağlayıcı ekleyin
3. Port'u 8080 olarak ayarlayın

### OpenAI API
```json
{
  "name": "OpenAI",
  "type": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-your-api-key-here",
  "icon": "🧠",
  "description": "OpenAI GPT modelleri"
}
```

**Modeller (📥 Modelleri Getir ile otomatik):**
- gpt-4 → GPT-4 (En güçlü)
- gpt-3.5-turbo → GPT-3.5 Turbo (Hızlı)
- gpt-4-turbo → GPT-4 Turbo (Dengeli)

## 🔒 Güvenlik ve Gizlilik

### API Anahtarları
- **Yerel Depolama**: API anahtarları browser'da güvenli şekilde saklanır
- **Şifreleme**: Hassas veriler şifrelenir
- **Temizleme**: Tarayıcı verilerini temizleyerek silebilirsiniz

### Ağ Güvenliği
- **Firewall**: Gerekli portları açın (1234, 11434, vs.)
- **IP Kısıtlama**: Sadece güvenilir IP'lere izin verin
- **VPN**: Uzak bağlantılar için VPN kullanın

### Veri Gizliliği
- **Yerel İşlem**: Mümkün olduğunca yerel modeller kullanın
- **API Seçimi**: Hangi verilerin hangi AI'ya gideceğini kontrol edin
- **Loglar**: Hassas veriler loglanmaz

## 🚨 Sorun Giderme

### Bağlantı Sorunları
**🔴 Offline Durumu:**
1. **IP/Port kontrolü**: Doğru IP ve port girdiğinizden emin olun
2. **Ping testi**: `ping 192.168.1.100` ile bağlantıyı test edin
3. **Firewall**: Hedef bilgisayarda firewall ayarlarını kontrol edin
4. **Servis durumu**: LM Studio/Ollama'nın çalıştığını kontrol edin

**🟡 Test Ediliyor Takılması:**
1. **Timeout**: 5 saniye bekleyin
2. **Ağ gecikmesi**: Uzak bağlantılarda normal
3. **Port blokajı**: Antivirus/firewall kontrolü

### Model Sorunları
**Model Görünmüyor:**
1. **Sağlayıcı aktif mi**: Provider'ın aktif olduğunu kontrol edin
2. **Model aktif mi**: Model'in aktif olduğunu kontrol edin
3. **API erişimi**: Model'e erişim izniniz var mı kontrol edin

**� Modelleri Getir Çalışmıyor:**
1. **API anahtarı**: Doğru API key girdiğinizden emin olun
2. **Endpoint**: `/models` endpoint'inin çalıştığını kontrol edin
3. **Format**: API'nin OpenAI formatında yanıt verdiğini kontrol edin

### Ağ Sorunları
**Farklı Bilgisayara Bağlanamıyor:**
1. **Aynı ağda mı**: İki bilgisayar aynı WiFi/LAN'da olmalı
2. **IP adresi**: `ipconfig` ile doğru IP'yi öğrenin
3. **Port açık mı**: `telnet 192.168.1.100 1234` ile test edin
4. **Firewall**: Windows Defender/antivirus ayarları

## 💡 İpuçları ve En İyi Uygulamalar

### Ağ Kurulumu
- **Statik IP**: Sunucu bilgisayara statik IP verin
- **Port Forwarding**: Router'da gerekirse port yönlendirme
- **Güvenlik**: Sadece güvenilir ağlarda paylaşın

### Model Seçimi
- **Yerel Ağ**: Hızlı, güvenli, ücretsiz
- **İnternet API**: Güçlü ama ücretli ve yavaş
- **Hibrit**: Basit işler yerel, karmaşık işler API

### Performans
- **Gigabit Ethernet**: WiFi yerine kablolu bağlantı tercih edin
- **Düşük Latency**: Aynı ağdaki bilgisayarlar daha hızlı
- **Model Boyutu**: Küçük modeller daha hızlı yanıt verir

## 🔄 Güncelleme ve Bakım

### Ayarları Yedekleme
```javascript
// Tarayıcı console'da çalıştırın
const backup = localStorage.getItem('corex-ai-providers');
console.log('AI Providers Backup:', backup);
// Çıktıyı kopyalayıp kaydedin
```

### Ayarları Geri Yükleme
```javascript
// Yedek verinizi buraya yapıştırın
const backupData = '[{"id":"lm-studio",...}]';
localStorage.setItem('corex-ai-providers', backupData);
location.reload();
```

### Fabrika Ayarlarına Dönüş
```javascript
// Tüm AI ayarlarını sıfırla
localStorage.removeItem('corex-ai-providers');
location.reload();
```

## 📞 Destek

### Sık Sorulan Sorular
1. **Q: Farklı bilgisayardaki AI'ya nasıl bağlanırım?**
   A: Host kısmına o bilgisayarın IP adresini girin (örn: 192.168.1.100)

2. **Q: Port numarasını nasıl öğrenirim?**
   A: LM Studio: 1234 (varsayılan), Ollama: 11434 (varsayılan)

3. **Q: API anahtarım güvenli mi?**
   A: Evet, yerel olarak şifrelenerek saklanır.

4. **Q: Kaç tane AI ekleyebilirim?**
   A: Sınır yok, ama performans için 5-10 tavsiye edilir.

### Teknik Destek
- **GitHub Issues**: Hata raporları için
- **Discord**: Topluluk desteği
- **Dokümantasyon**: Bu rehber ve diğer dökümanlar

---

🎉 **Artık Corex'te istediğiniz AI modelini, istediğiniz bilgisayardan kullanabilirsiniz!**

Kendi AI sağlayıcınızı ekleyin, farklı IP/Port ayarları yapın ve en iyi deneyimi yaşayın.