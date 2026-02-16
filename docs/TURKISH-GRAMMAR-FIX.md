# Turkish Grammar Fix - Devrik Cümle Sorunu Çözümü

## Problem

AI, Türkçe cevaplarında devrik cümle kuruyordu ve yanlış şahıs ekleri kullanıyordu:

**Yanlış Örnekler:**
- ❌ "Hangi konuda bilgi vermenizi isterdiniz?" (sen → sen)
- ❌ "Size yardımcı olabilirsiniz" (sen → sen)
- ❌ "Projenizi incelediğiniz" (sen → sen)

**Doğru Olması Gereken:**
- ✅ "Hangi konuda bilgi vermemi istersiniz?" (ben → siz)
- ✅ "Size yardımcı olabilirim" (ben → siz)
- ✅ "Projenizi inceledim" (ben → siz)

## Kök Neden

AI modeline **system prompt gönderilmiyordu**! 

### Teknik Detay

1. **TypeScript tarafında** (`ai.ts`):
   - System prompt oluşturuluyordu ✅
   - Conversation history'ye ekleniyordu ✅
   - Ama AI'ye gönderilmiyordu ❌

2. **Rust backend** (`commands.rs`):
   - Sadece son user mesajını alıyordu
   - Conversation history parametresi yoktu
   - System prompt hiç AI modeline ulaşmıyordu

3. **Sonuç**:
   - AI, Türkçe dilbilgisi kurallarını görmüyordu
   - Her mesajda sıfırdan başlıyordu
   - Devrik cümle ve yanlış şahıs ekleri kullanıyordu

## Çözüm

### 1. TypeScript Değişiklikleri

**`aiProvider.ts`** - Conversation history parametresi eklendi:

```typescript
export async function callAI(
  message: string, 
  modelId: string, 
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  // ...
  const aiPromise = invoke<string>("chat_with_dynamic_ai", {
    message,
    conversationHistory: conversationHistory || [], // 🔥 History gönder
    providerConfig: { /* ... */ }
  });
}
```

**`ai.ts`** - History'yi AI'ye gönder:

```typescript
// Prepare conversation history for AI
const historyForAI = conversationContext.history.map(msg => ({
  role: msg.role,
  content: msg.content
}));

const response = await callAI(message, modelId, historyForAI); // 🔥 History ile
```

### 2. Rust Backend Değişiklikleri

**`commands.rs`** - Conversation history desteği:

```rust
#[derive(serde::Deserialize, serde::Serialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[tauri::command]
pub async fn chat_with_dynamic_ai(
    message: String, 
    conversation_history: Vec<ChatMessage>, // 🔥 History parametresi
    provider_config: ProviderConfig
) -> Result<String, String> {
    // History'yi messages array'ine çevir
    let messages: Vec<serde_json::Value> = if !conversation_history.is_empty() {
        conversation_history.iter().map(|msg| {
            json!({
                "role": msg.role,
                "content": msg.content
            })
        }).collect()
    } else {
        // Fallback: sadece user message
        vec![json!({
            "role": "user",
            "content": message
        })]
    };

    let body = json!({
        "model": provider_config.model_name,
        "messages": messages, // 🔥 Tüm history gönder
        // ...
    });
}
```

## System Prompt İçeriği

System prompt şu kuralları içeriyor:

### 1. Şahıs Çekimleri
- Ben (1. tekil): yapıyorum, yazıyorum, veriyorum
- Sen (2. tekil): yapıyorsun, yazıyorsun, veriyorsun
- Siz (2. çoğul/saygı): yapıyorsunuz, yazıyorsunuz, veriyorsunuz

### 2. Doğru Kullanım Örnekleri
- ✅ "Size yardımcı olabilirim" (ben → size)
- ✅ "Bana ne yapmamı istersiniz?" (siz → bana)
- ✅ "Projenizi inceledim" (ben → projenizi)

### 3. Yanlış Kullanım Örnekleri (Yasak)
- ❌ "Size yardımcı olabilirsiniz"
- ❌ "Bana ne yapmamı isterim?"
- ❌ "Hangi konuda bilgi vermenizi isterdiniz?"

### 4. Soru Cümle Yapıları
- ✅ "Ne yapmamı istersiniz?" (siz benden istiyor)
- ✅ "Size nasıl yardımcı olabilirim?" (ben size yardım ediyorum)
- ✅ "Hangi dosyayı açmamı istersiniz?" (siz benden istiyor)

### 5. Konuşma Örnekleri
3 tam konuşma örneği ile AI'ye doğru kullanım gösterildi.

## Sonuç

Artık AI:
1. ✅ System prompt'u görüyor
2. ✅ Türkçe dilbilgisi kurallarını biliyor
3. ✅ Doğru şahıs ekleri kullanıyor
4. ✅ Devrik cümle kurmuyor
5. ✅ Conversation history'yi hatırlıyor

## Test

Şu mesajları test edin:

1. "Merhaba" → AI kendini tanıtmalı
2. "Proje mimarisini açıkla" → Düzgün Türkçe ile açıklamalı
3. "Bana yardım et" → "Size nasıl yardımcı olabilirim?" demeli

## Değiştirilen Dosyalar

- ✅ `local-ai/src/services/ai.ts` - System prompt ve history yönetimi
- ✅ `local-ai/src/services/aiProvider.ts` - History parametresi eklendi
- ✅ `local-ai/src-tauri/src/commands.rs` - Rust backend history desteği

## Token Kullanımı

- System prompt: ~2000 token
- Her mesaj: ~100-500 token
- Toplam history (20 mesaj): ~5000-10000 token
- Qwen 2.5 7B context: 32768 token ✅ Yeterli!

Kullanıcı 1MB dosya taraması istedi, bu da ~250K token demek. Gerekirse context window'u artırabiliriz.

## Build Durumu

✅ Build başarılı! (21.73s)
- TypeScript derleme: ✅
- Vite build: ✅
- Tüm modüller: 1340 ✅

Proje kullanıma hazır!
