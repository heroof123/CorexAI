# Continue.dev Mimarisi Adaptasyonu - Requirements

## 📋 Proje Özeti

Continue.dev'in core mimarisini (Business logic, AI, context, planning) ve event-based message passing sistemini CoreX IDE'ye Tauri uyumlu şekilde adapte etmek.

**Hedef:** Chat UI'ı almadan, sadece core business logic ve message passing mimarisini implement etmek.

## 🎯 Kullanıcı Hikayeleri

### 1. Core Business Logic Ayrımı
**Kullanıcı olarak**, AI logic'inin UI'dan bağımsız çalışmasını istiyorum, böylece farklı UI'lar kullanabilirim.

**Kabul Kriterleri:**
- [ ] 1.1 Core klasörü oluşturulmalı (src/core/)
- [ ] 1.2 AI logic, context management, planning core'a taşınmalı
- [ ] 1.3 Core, UI'dan tamamen bağımsız çalışmalı
- [ ] 1.4 Core, message passing ile iletişim kurmalı

### 2. Message Passing Sistemi
**Kullanıcı olarak**, componentler arası güvenli ve tip-safe iletişim istiyorum.

**Kabul Kriterleri:**
- [ ] 2.1 Protocol interface tanımlanmalı (core/protocol/)
- [ ] 2.2 Message tipleri TypeScript ile tanımlanmalı
- [ ] 2.3 Core <-> Extension <-> GUI message flow çalışmalı
- [ ] 2.4 Tauri event system ile entegre olmalı

### 3. Extension Layer (Tauri Adapter)
**Kullanıcı olarak**, Tauri'nin özelliklerini kullanarak IDE işlemlerini yönetmek istiyorum.

**Kabul Kriterleri:**
- [ ] 3.1 Extension layer oluşturulmalı (src/extension/)
- [ ] 3.2 IDE interface implement edilmeli
- [ ] 3.3 Core ve GUI arasında message routing yapmalı
- [ ] 3.4 Tauri commands ile entegre olmalı

### 4. Context Management
**Kullanıcı olarak**, AI'nın proje context'ini akıllıca yönetmesini istiyorum.

**Kabul Kriterleri:**
- [ ] 4.1 Context providers sistemi kurulmalı
- [ ] 4.2 File context, project context, conversation context ayrılmalı
- [ ] 4.3 Context caching mekanizması olmalı
- [ ] 4.4 Smart context selection (relevance-based)

### 5. Planning Agent
**Kullanıcı olarak**, AI'nın karmaşık görevleri planlayabilmesini istiyorum.

**Kabul Kriterleri:**
- [ ] 5.1 Planning agent core'da implement edilmeli
- [ ] 5.2 Task breakdown yapabilmeli
- [ ] 5.3 Step-by-step execution planı oluşturmalı
- [ ] 5.4 Progress tracking olmalı

### 6. Streaming Support
**Kullanıcı olarak**, AI yanıtlarının gerçek zamanlı akmasını istiyorum.

**Kabul Kriterleri:**
- [ ] 6.1 Token-by-token streaming desteği
- [ ] 6.2 Message passing ile streaming events
- [ ] 6.3 Stop generation özelliği
- [ ] 6.4 Regenerate özelliği

## 🏗️ Mimari Tasarım

### Klasör Yapısı
```
src/
├── core/                    # Business logic (Continue.dev'den adapte)
│   ├── protocol/           # Message protocol definitions
│   │   ├── types.ts       # Message types
│   │   ├── core.ts        # Core messages
│   │   └── gui.ts         # GUI messages
│   ├── context/           # Context management
│   │   ├── providers/     # Context providers
│   │   ├── manager.ts     # Context manager
│   │   └── cache.ts       # Context cache
│   ├── planning/          # Planning agent
│   │   ├── agent.ts       # Planning logic
│   │   ├── tasks.ts       # Task breakdown
│   │   └── executor.ts    # Execution engine
│   ├── ai/                # AI logic
│   │   ├── chat.ts        # Chat logic
│   │   ├── streaming.ts   # Streaming handler
│   │   └── models.ts      # Model management
│   └── index.ts           # Core entry point
│
├── extension/              # Tauri adapter (Continue.dev'in extension'ı)
│   ├── ide.ts             # IDE interface implementation
│   ├── messenger.ts       # Message routing
│   ├── tauri-bridge.ts    # Tauri integration
│   └── index.ts           # Extension entry point
│
├── gui/                    # React UI (mevcut)
│   └── ... (mevcut UI korunur)
│
└── services/               # Mevcut servisler (gerekirse core'a taşınır)
```

### Message Flow
```
┌─────────┐         ┌───────────┐         ┌──────┐
│  Core   │ <-----> │ Extension │ <-----> │ GUI  │
│(Business│         │  (Tauri)  │         │(React)│
│ Logic)  │         │           │         │      │
└─────────┘         └───────────┘         └──────┘
     ↓                    ↓                    ↓
  AI Logic          Message Router        UI State
  Context           IDE Interface         User Input
  Planning          Tauri Bridge          Display
```

## 🔧 Teknik Gereksinimler

### 1. TypeScript Types
- Tüm message'lar tip-safe olmalı
- Protocol interface'leri strict mode'da çalışmalı
- Generic types kullanılmalı (reusability için)

### 2. Tauri Integration
- Tauri event system kullanılmalı
- Rust backend ile iletişim korunmalı
- Performance optimize edilmeli

### 3. Backward Compatibility
- Mevcut AI sistemi çalışmaya devam etmeli
- Kademeli migration yapılmalı
- Eski servisler gerekirse korunmalı

### 4. Performance
- Message passing overhead minimal olmalı
- Context caching etkili kullanılmalı
- Streaming performanslı olmalı

## 📦 Bağımlılıklar

### Yeni Bağımlılıklar
- Yok (mevcut bağımlılıklar yeterli)

### Mevcut Bağımlılıklar
- React (GUI için)
- Tauri (Extension için)
- TypeScript (Tüm kod için)

## 🚀 Implementation Planı

### Phase 1: Protocol & Core Setup (1-2 gün)
1. Protocol types tanımla
2. Core klasör yapısını oluştur
3. Basic message passing implement et

### Phase 2: Context Management (1-2 gün)
4. Context providers sistemi
5. Context manager
6. Context caching

### Phase 3: Planning Agent (2-3 gün)
7. Planning agent core logic
8. Task breakdown
9. Execution engine

### Phase 4: Extension Layer (1-2 gün)
10. Tauri adapter
11. IDE interface
12. Message routing

### Phase 5: Streaming & Polish (1-2 gün)
13. Real streaming implementation
14. Stop/Regenerate features
15. Testing & optimization

**Toplam Süre:** 6-11 gün

## ✅ Başarı Kriterleri

1. **Mimari Ayrım:** Core, Extension, GUI tamamen ayrı çalışmalı
2. **Message Passing:** Tip-safe ve performanslı olmalı
3. **Context Management:** Akıllı ve cache'li olmalı
4. **Planning:** Karmaşık görevleri parçalayabilmeli
5. **Streaming:** Gerçek zamanlı token streaming çalışmalı
6. **Backward Compat:** Mevcut özellikler bozulmamalı

## 🎨 UI/UX Gereksinimleri

- Mevcut chat UI korunur
- Streaming animasyonu smooth olmalı
- Planning progress gösterilmeli
- Stop/Regenerate butonları eklenmeli

## 🔒 Güvenlik Gereksinimleri

- Message validation yapılmalı
- Type safety korunmalı
- Error handling robust olmalı

## 📝 Dokümantasyon

- Her component için README
- Message protocol dokümantasyonu
- Migration guide (eski sistemden yeniye)
- API reference

## 🧪 Test Gereksinimleri

- Unit tests (core logic için)
- Integration tests (message passing için)
- E2E tests (full flow için)
- Performance tests

---

**Not:** Bu spec, Continue.dev'in core mimarisini CoreX'e adapte etmek için hazırlanmıştır. Chat UI alınmayacak, sadece business logic ve message passing sistemi implement edilecektir.
