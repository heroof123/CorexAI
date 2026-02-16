# 💬 AI Sohbet Örnekleri

Bu dosya AI ile nasıl etkili iletişim kuracağınızı gösterir.

## 📋 İçindekiler
1. [Analiz ve Öneriler (Kod YOK)](#analiz-ve-öneriler)
2. [Kod Yazma ve Düzenleme](#kod-yazma-ve-düzenleme)
3. [Dosya İnceleme](#dosya-inceleme)
4. [Debugging ve Sorun Çözme](#debugging)

---

## 📊 Analiz ve Öneriler

### ✅ DOĞRU Sorular (Sade cevap alırsınız)

#### 1. Genel Proje Analizi
```
"Bu projeyi analiz et ve ana özelliklerini açıkla"
```

**AI Cevabı:**
```
📊 Proje Analizi:

Bu bir topluluk yönetim platformu...

🏗️ Ana Bileşenler:
• Communities - Topluluk yönetimi
• Conferences - Konferans sistemi
• Admin Panel - Yönetim arayüzü

💡 Güçlü Yanlar:
✅ Type-safe TypeScript kullanımı
✅ Modüler yapı
✅ Clean architecture

⚠️ İyileştirme Alanları:
• Error handling eksik
• Test coverage düşük
• Documentation az
```

#### 2. Öneriler İsteme
```
"Bu projeye hangi yeni özellikler eklenebilir?"
```

**AI Cevabı:**
```
💡 Önerilen Yeni Özellikler:

🔐 Authentication & Security:
1. Two-factor authentication
2. OAuth entegrasyonu
3. Role-based access control

🎨 UI/UX İyileştirmeleri:
1. Dark mode desteği
2. Responsive tasarım
3. Accessibility (WCAG 2.1)

📊 Analytics & Insights:
1. Kullanıcı davranış analizi
2. Dashboard metrics
3. Export/Import özellikleri
```

#### 3. Mimari Analiz
```
"Projenin mimari yapısını açıkla ve önerilerde bulun"
```

**AI Cevabı:**
```
🏗️ Mimari Yapı:

Katmanlar:
├── Data Layer (lib/data/)
│   └── Type definitions
├── Services (services/)
│   └── Business logic
└── Components (components/)
    └── UI layer

✅ İyi Pratikler:
• Separation of concerns
• Type safety
• Modular structure

🔧 İyileştirme Önerileri:
1. State management ekle (Zustand/Redux)
2. API layer soyutlama
3. Error boundary'ler
```

#### 4. Güvenlik Analizi
```
"Projede güvenlik açısından nelere dikkat etmeliyim?"
```

#### 5. Performans İncelemesi
```
"Performans sorunları var mı? Nasıl optimize edebilirim?"
```

#### 6. Best Practices
```
"Hangi best practice'lere uyuluyor, hangilerine uyulmuyor?"
```

---

## 💻 Kod Yazma ve Düzenleme

### ✅ DOĞRU Sorular (Tam kod alırsınız)

#### 1. Yeni Özellik Ekleme
```
"lib/data/communities.ts dosyasına 
createdBy: string ve 
createdAt: Date 
field'larını ekle. Dosyanın tamamını göster."
```

**AI Cevabı:**
```
İşte güncellenmiş Communities type:

`lib/data/communities.ts`
```typescript
export type Community = {
  id: string;
  name: string;
  description: string;
  createdBy: string;      // ✨ EKLENDI
  createdAt: Date;        // ✨ EKLENDI
  members: Member[];
};
// ... tam kod
```
```

#### 2. Fonksiyon Yazma
```
"utils/helpers.ts dosyasına 
validateEmail fonksiyonu yaz.
Regex ile email kontrolü yapsın."
```

#### 3. Component Oluşturma
```
"components/LoadingSpinner.tsx adında
bir loading component oluştur.
Tailwind CSS ile style edilmiş olsun."
```

#### 4. Hata Düzeltme
```
"@api.ts dosyasındaki fetchUsers fonksiyonuna
try-catch ekle ve error handling yap."
```

#### 5. Refactoring
```
"UserService class'ını fonksiyonel hale getir.
Class yerine pure functions kullan."
```

---

## 🔍 Dosya İnceleme

### ✅ DOĞRU Sorular

#### 1. Tek Dosya İnceleme
```
"@lib/data/communities.ts ne işe yarar?"
```

**AI Cevabı:**
```
📄 communities.ts Açıklaması:

Bu dosya topluluk (community) ile ilgili tip tanımlarını içerir.

🎯 Ana Type'lar:
• Community - Temel topluluk bilgileri
• Member - Üye bilgileri
• Permission - Yetki tanımları

💡 Kullanım Alanları:
- Topluluk oluşturma
- Üye yönetimi
- Yetki kontrolü

🔗 İlişkili Dosyalar:
• conference.ts - Konferans tipleri
• routes.ts - Routing tanımları
```

#### 2. Çoklu Dosya Karşılaştırma
```
"@communities.ts ve @conferences.ts dosyalarını karşılaştır.
Ortak pattern'ler var mı?"
```

#### 3. Dosya Bağımlılıkları
```
"@App.tsx hangi dosyaları kullanıyor?
Bağımlılık haritası çıkar."
```

---

## 🐛 Debugging ve Sorun Çözme

### ✅ DOĞRU Sorular

#### 1. Hata Analizi
```
"Login işleminde 'undefined user' hatası alıyorum.
Ne olabilir?"
```

**AI Cevabı:**
```
🔍 Hata Analizi: "undefined user"

Muhtemel Sebepler:

1. ⚠️ Async/Await Hatası:
   - API'dan veri gelmeden kullanılmış olabilir
   - await eksik olabilir

2. ⚠️ State Management:
   - User state initialize olmamış
   - Redux/Context'te veri yok

3. ⚠️ Token/Session:
   - Token expired
   - LocalStorage temizlenmiş

🔧 Çözüm Önerileri:
1. Console'da API response'u kontrol et
2. Loading state ekle
3. Null check ekle: if (user) { ... }
```

#### 2. Performans Sorunu
```
"Sayfa yavaş yükleniyor. Nerede darboğaz var?"
```

#### 3. Type Hatası
```
"TypeScript 'Type X is not assignable to Y' diyor.
Nasıl düzeltebilirim?"
```

---

## 🎭 Karşılaştırma: İyi vs Kötü Sorular

### ❌ KÖTÜ Sorular

```
❌ "Kod yaz"
   → Çok belirsiz

❌ "Bir şey ekle"
   → Ne eklenecek?

❌ "Hata var"
   → Hangi hata?

❌ "İyileştir"
   → Neyi?
```

### ✅ İYİ Sorular

```
✅ "lib/data/communities.ts dosyasına 
   createdBy field'ı ekle ve
   dosyanın tamamını göster"
   → Spesifik, açık, net

✅ "Bu projeyi analiz et ve 
   güvenlik açısından önerilerde bulun"
   → Net hedef, beklenti açık

✅ "@api.ts dosyasındaki fetchUsers 
   fonksiyonuna error handling ekle"
   → Dosya belirtilmiş, istek net

✅ "Authentication akışını açıkla,
   hangi dosyalar kullanılıyor?"
   → Scope tanımlı, açık soru
```

---

## 💡 Pro İpuçları

### 1. @ Sembolü Kullanın
```
"@dosya.ts ne yapar?"           ✅ Otomatik bulunur
"dosya.ts ne yapar?"            ❌ Bulunamayabilir
```

### 2. Cevap Tipini Belirtin
```
"Analiz et"                      → Sade cevap
"Analiz et ve kod yaz"          → Kod da verir
```

### 3. Scope Tanımlayın
```
"Tüm projeyi analiz et"         → Genel bakış
"@Button.tsx'i analiz et"       → Detaylı inceleme
```

### 4. Adım Adım İlerleyin
```
1. "Projeyi analiz et"           (Önce anlayın)
2. "Communities sistemini açıkla" (Detaya inin)
3. "createdBy field'ı ekle"      (Değişiklik yapın)
```

### 5. Context Verin
```
❌ "Hata var"
✅ "Login yaparken 'undefined user' hatası alıyorum,
   @auth.ts dosyasında problem olabilir mi?"
```

---

## 🎯 Özel Senaryolar

### Yeni Projeye Başlarken
```
1. "Bu projeyi analiz et ve teknoloji stack'ini açıkla"
2. "Ana özellikleri neler?"
3. "Nereden başlamam gerekir?"
4. "Development için hangi komutları kullanmalıyım?"
```

### Özellik Eklerken
```
1. "Dark mode eklemek istiyorum, hangi dosyalara dokunmam gerekir?"
2. "Önce @theme.ts dosyasını incele"
3. "Dark mode toggle component'i oluştur"
4. "Theme context'ini güncelle"
```

### Bug Fix Yaparken
```
1. "Login'de 'token expired' hatası alıyorum"
2. "@auth.ts dosyasında token kontrolünü incele"
3. "Token refresh logic ekle"
4. "Error boundary ekle"
```

### Refactoring Yaparken
```
1. "Code smell var mı? Hangi dosyalar refactor edilmeli?"
2. "@UserService.ts'i functional hale getir"
3. "Duplicate code var mı?"
4. "Performance iyileştirmeleri öner"
```

---

## ⚡ Hızlı Referans

| Amaç | Soru Örneği | Cevap Tipi |
|------|-------------|------------|
| Analiz | "Projeyi analiz et" | Sade metin |
| Öneri | "Önerilerde bulun" | Bullet points |
| Kod | "Field ekle" | Tam kod |
| İnceleme | "Ne yapar?" | Açıklama |
| Debug | "Hata nerede?" | Problem + Çözüm |
| Karşılaştırma | "Fark nedir?" | Karşılaştırma |

---

## 🚀 Başarı İçin Formül

```
📝 Net Soru + 🎯 Açık Beklenti + 📁 Dosya Referansı = 🎉 Mükemmel Cevap
```

Mutlu kodlamalar! 🎊
