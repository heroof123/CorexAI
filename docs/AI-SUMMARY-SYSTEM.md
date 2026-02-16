# 🧠 AI Summary System (Özet Sistemi)

## 📋 Genel Bakış

Corex IDE'de AI ile uzun konuşmalarda context kaybını önlemek için **otomatik özet sistemi** eklendi.

## 🎯 Amaç

- **Problem:** Uzun konuşmalarda eski mesajlar silinince AI "önceki planı unuttum" diyor
- **Çözüm:** Her 10 mesajda bir AI konuşmayı özetliyor, özet korunuyor

## 🔧 Nasıl Çalışır?

### 1. Mesaj Sayacı
```typescript
conversationContext.messagesSinceLastSummary = 0;
```
- Her mesajda (user, assistant, tool) sayaç +1 artıyor
- 10'a ulaşınca özet oluşturuluyor

### 2. Özet Oluşturma
```typescript
async function generateSummary(messages): Promise<string>
```
- Son 10 mesajı alıyor
- AI'ya "özetle" prompt'u gönderiyor
- Maksimum 5 cümle özet alıyor
- Türkçe özet döndürüyor

### 3. Özet Kullanımı
```typescript
if (conversationContext.summary) {
  historyWithSummary.splice(1, 0, summaryMessage);
}
```
- Özet varsa system prompt'tan hemen sonra ekleniyor
- AI her cevabında özeti görüyor
- Eski mesajlar silinse bile özet kalıyor

## 📊 Örnek Akış

```
Mesaj 1-9: Normal konuşma
Mesaj 10: ✅ Özet oluşturuldu!

History:
[0] System Prompt
[1] 📝 Özet: "Kullanıcı login sistemi istedi, button oluşturuldu..."
[2] Son mesajlar...
```

## 🎨 Özet Formatı

```
📝 Önceki Konuşma Özeti:
Kullanıcı bir login butonu istedi. 
Button component'i oluşturuldu ve App.tsx'e eklendi. 
Dark mode özelliği de eklendi.
Test başarılı oldu.

---
```

## 🔄 Özet Yenileme

- Her 10 mesajda bir **yeni özet** oluşturuluyor
- Eski özet **üzerine yazılıyor** (biriktirmiyor)
- Konuşma sıfırlanınca özet de **temizleniyor**

## 💾 Veri Yapısı

```typescript
interface ConversationContext {
  summary: string | null;              // Mevcut özet
  messagesSinceLastSummary: number;    // Son özetten sonraki mesaj sayısı
  history: Array<Message>;             // Mesaj geçmişi
  // ... diğer alanlar
}
```

## 🚀 Avantajlar

✅ **Context kaybı yok:** AI önceki konuşmayı hatırlıyor
✅ **Token tasarrufu:** Eski mesajlar yerine kısa özet
✅ **Otomatik:** Kullanıcı hiçbir şey yapmıyor
✅ **Akıllı:** AI kendi özetini oluşturuyor

## ⚙️ Ayarlar

```typescript
// Özet oluşturma sıklığı (mesaj sayısı)
const SUMMARY_INTERVAL = 10;

// Özet maksimum uzunluk
const MAX_SUMMARY_SENTENCES = 5;
```

## 🔍 Debug

Console'da şu logları göreceksin:

```
📝 10 mesaj geçti, özet oluşturuluyor...
✅ Özet oluşturuldu: Kullanıcı login sistemi istedi...
📌 Özet history'ye eklendi
🔄 Konuşma sıfırlandı (özet dahil)
```

## 🎯 Gelecek İyileştirmeler

- [ ] Özet kalitesini artır (daha detaylı prompt)
- [ ] Özet geçmişi tut (son 3 özet)
- [ ] Kullanıcı özet sıklığını ayarlayabilsin
- [ ] Özeti manuel tetikle butonu
- [ ] Özeti UI'da göster

## 📝 Notlar

- Özet oluşturma **asenkron** (AI çağrısı yapıyor)
- Hata durumunda boş özet döndürüyor (crash yok)
- System prompt **asla silinmiyor**
- Özet **her zaman Türkçe**

---

**Ekleme Tarihi:** 8 Şubat 2026
**Durum:** ✅ Aktif
**Test Durumu:** Bekliyor
