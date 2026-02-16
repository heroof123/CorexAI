# AI Davranış İyileştirmeleri - EVRENSEL SİSTEM

## 🌍 Evrensel Sistem

**ÖNEMLİ:** Bu sistem sadece Qwen için değil, **TÜM AI modelleri** için geçerlidir:
- ✅ Qwen 2.5 (7B, 3B, vb.)
- ✅ Mistral (7B, 8x7B, vb.)
- ✅ Llama (3.1, 3.2, vb.)
- ✅ GPT (3.5, 4, vb.)
- ✅ Claude (Sonnet, Opus, vb.)
- ✅ Gemini
- ✅ Diğer tüm local ve cloud AI modelleri

Hangi modeli eklerseniz ekleyin, aynı kurallar geçerli olacak!

## 🎯 Yapılan Değişiklikler

### 1. Sistem Prompt Güçlendirmesi (`src/services/ai.ts`) - EVRENSEL

**Sorun:** AI yarım kod yazıp "Özür dilerim, ancak..." gibi cümlelerle duruyordu.

**Çözüm:**
- 🌍 **EVRENSEL KURALLAR** eklendi - Tüm AI modelleri için geçerli
- ⚠️ Kritik uyarılar eklendi: "ASLA ÖZÜR DİLEME, ASLA YARIM BIRAKMA!"
- 🚫 Yasaklı cümleler listesi eklendi (kullanıcının gördüğü gerçek örneklerle)
- 💡 Doğru/Yanlış davranış örnekleri eklendi
- ✅ Zorunlu kurallar vurgulandı
- 🌍 "Bu kurallar Qwen, Mistral, Llama, GPT, Claude - TÜM modeller için geçerli!" notu eklendi

**Evrensel Kurallar (Tüm Roller için):**
```typescript
const universalRules = `
⚠️ KRİTİK EVRENSEL KURALLAR (TÜM AI MODELLERİ İÇİN):
- ASLA ÖZÜR DİLEME! ("Özür dilerim, ancak..." YASAK)
- ASLA "YAPABİLİR MİSİNİZ?" DEME!
- ASLA YARIM BIRAKMA! İşi tamamen bitir!
- ASLA "Bilgilerimde yok" DEME! Elindeki bilgiyle devam et!
- TÜRKÇE cevap ver!
`;
```

**Eklenen Yasaklı Cümleler (Tüm Modeller):**
```
- "Özür dilerim, ancak 'Responsive Tasarım' önerisi uygulanamadığını..."
- "Eğer sizin için nasıl yapabileceğimi bana anlatabilir misiniz?"
- "Bu konuda herhangi bir şey bulunmuyor"
- "Yapabilir misiniz?"
- "Devamını siz tamamlayın"
```

### 2. Context Builder Güçlendirmesi (`src/services/ai.ts`) - EVRENSEL

**Değişiklikler:**
- 🌍 "EVRENSEL SİSTEM - Hangi AI modeli olursan ol" başlığı eklendi
- Her mesajda kritik uyarılar tekrarlanıyor
- "ASLA ÖZÜR DİLEME!" vurgusu eklendi
- "İŞİ TAMAMEN BİTİR, YARIM BIRAKMA!" talimatı eklendi
- Kod isteklerinde: "TÜM DOSYALARI TAMAMLA, eksik bırakma!"
- "Bu kurallar Qwen, Mistral, Llama, GPT, Claude - TÜM modeller için geçerli!" notu

### 3. AI Provider Ayarları (`src/services/aiProvider.ts`)

**Değişiklikler:**
- ⏱️ Timeout 30 saniyeden **60 saniyeye** çıkarıldı (daha uzun cevaplar için)
- 🌡️ Temperature **+0.1** artırıldı (daha yaratıcı ve eksiksiz cevaplar)
- 📝 Max tokens **8192'ye** çıkarıldı (daha uzun kod üretimi için)

**Önceki Ayarlar:**
```typescript
temperature: 0.5
max_tokens: 4096
timeout: 30000ms
```

**Yeni Ayarlar:**
```typescript
temperature: 0.6 (0.5 + 0.1)
max_tokens: 8192
timeout: 60000ms
```

## 🧪 Test Senaryoları

### Test 1: Film Uygulaması
```
Kullanıcı: "Film uygulaması yap"
Beklenen: Tam çalışır kod, özür yok, tamamlanmış
```

### Test 2: Responsive Tasarım
```
Kullanıcı: "Responsive tasarım ekle"
Beklenen: Direkt kod, "yapabilir misiniz?" yok
```

### Test 3: Çoklu Dosya
```
Kullanıcı: "Todo uygulaması yap"
Beklenen: Birden fazla dosya, hepsi tam, yarım yok
```

## 📊 Beklenen Davranış Değişiklikleri

### Önceki Davranış ❌
```
AI: "Dosya oluşturdum, birkaç kod yazdım..."
AI: "Özür dilerim, ancak 'Responsive Tasarım' önerisi uygulanamadığını..."
AI: "Eğer sizin için nasıl yapabileceğimi bana anlatabilir misiniz?"
```

### Yeni Davranış ✅
```
AI: "Tamam! İşte çalışır film uygulaması:"
AI: [3-4 dosya, TAM KOD, ÇALIŞIR]
AI: "Hazır! npm install yapıp çalıştırabilirsin. 🎬"
```

## 🔧 Ek Ayarlar (İsteğe Bağlı)

Eğer AI hala yarım bırakıyorsa, LM Studio ayarlarından:

1. **Context Length:** 8192 veya daha fazla
2. **Max Response Length:** 4096 veya daha fazla
3. **Temperature:** 0.6-0.7 arası
4. **Top P:** 0.9
5. **Repeat Penalty:** 1.1

## 📝 Notlar

- Değişiklikler `src/services/ai.ts` ve `src/services/aiProvider.ts` dosyalarında
- Sistem prompt'u her AI çağrısında gönderiliyor
- Context builder her mesajda kritik talimatları tekrarlıyor
- Timeout artırıldı, böylece AI daha uzun cevaplar verebilir

## 🚀 Kullanım

1. Projeyi yeniden build edin: `npm run build`
2. Uygulamayı başlatın: `npm run tauri dev`
3. Bir proje açın ve AI ile test edin
4. "Film uygulaması yap" gibi komutlar deneyin

## 🌍 Yeni AI Modeli Ekleme

Sistem evrensel olduğu için, yeni bir AI modeli eklemek çok kolay:

### Örnek: Mistral Ekleme

1. **AI Settings'e git** (⚙️ simgesi)
2. **"Add Provider"** butonuna tıkla
3. Bilgileri gir:
   ```
   Name: Mistral
   Type: Local
   Base URL: http://127.0.0.1:1234/v1
   ```
4. **Model ekle:**
   ```
   Model Name: mistral-7b-instruct
   Display Name: Mistral 7B
   Roles: coder, chat
   ```
5. **Aktif et** ve kullan!

### Örnek: Llama Ekleme

1. **AI Settings'e git**
2. **"Add Provider"** butonuna tıkla
3. Bilgileri gir:
   ```
   Name: Llama
   Type: Local
   Base URL: http://127.0.0.1:1234/v1
   ```
4. **Model ekle:**
   ```
   Model Name: llama-3.1-8b-instruct
   Display Name: Llama 3.1 8B
   Roles: chat, planner
   ```
5. **Aktif et** ve kullan!

**NOT:** Hangi modeli eklerseniz ekleyin, aynı kurallar geçerli olacak:
- ✅ Özür dilemeyecek
- ✅ Tam kod yazacak
- ✅ İşi bitirecek
- ✅ Kiro gibi davranacak

## 🐛 Sorun Giderme

Eğer AI hala yarım bırakıyorsa:

1. **LM Studio'yu kontrol edin:** Çalışıyor mu?
2. **Model yüklü mü:** Qwen 2.5 7B yüklü olmalı
3. **Context length:** LM Studio'da yeterince büyük mü?
4. **Console logları:** Tarayıcı konsolunda hata var mı?

## 📞 Destek

Sorun devam ederse:
- Console loglarını kontrol edin
- LM Studio loglarını kontrol edin
- Model ayarlarını kontrol edin
