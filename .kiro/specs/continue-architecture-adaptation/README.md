# 🚀 Continue.dev Mimarisi Adaptasyonu

## 📋 Proje Özeti

Continue.dev'in core mimarisini (Business logic, AI, context, planning) ve event-based message passing sistemini CoreX IDE'ye Tauri uyumlu şekilde adapte ediyoruz.

**Hedef:** Chat UI'ı almadan, sadece core business logic ve message passing mimarisini implement etmek.

## 🎯 Neden Bu Mimari?

### Mevcut Sorunlar
- ❌ AI logic UI'ya sıkı sıkıya bağlı
- ❌ State management karmaşık
- ❌ Test edilmesi zor
- ❌ Yeniden kullanılabilir değil

### Yeni Mimari ile
- ✅ AI logic UI'dan tamamen bağımsız
- ✅ Message passing ile temiz iletişim
- ✅ Test edilebilir componentler
- ✅ Farklı UI'lar kullanılabilir
- ✅ Continue.dev benzeri özellikler

## 🏗️ Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────┐
│                      GUI Layer                           │
│  (React - Mevcut UI korunur)                            │
└────────────────┬────────────────────────────────────────┘
                 │ Messages (Protocol)
                 ↓
┌─────────────────────────────────────────────────────────┐
│                 Extension Layer                          │
│  (Tauri Adapter - Message Router)                       │
└────────────────┬────────────────────────────────────────┘
                 │ Messages (Protocol)
                 ↓
┌─────────────────────────────────────────────────────────┐
│                    Core Layer                            │
│  (Business Logic - Continue.dev'den adapte)             │
│  - AI Logic & Streaming                                  │
│  - Context Management                                    │
│  - Planning Agent                                        │
└─────────────────────────────────────────────────────────┘
```

## 📁 Klasör Yapısı

```
src/
├── core/                    # Business logic
│   ├── protocol/           # Message protocol
│   │   ├── types.ts       # Base types
│   │   ├── core.ts        # Core messages
│   │   └── gui.ts         # GUI messages
│   ├── ai/                # AI logic
│   │   ├── manager.ts     # AI manager
│   │   ├── streaming.ts   # Streaming handler
│   │   └── models.ts      # Model management
│   ├── context/           # Context management
│   │   ├── manager.ts     # Context manager
│   │   ├── cache.ts       # Context cache
│   │   └── providers/     # Context providers
│   ├── planning/          # Planning agent
│   │   ├── agent.ts       # Planning logic
│   │   ├── tasks.ts       # Task types
│   │   └── executor.ts    # Execution engine
│   └── index.ts           # Core entry point
│
├── extension/              # Tauri adapter
│   ├── index.ts           # Extension entry
│   ├── messenger.ts       # Message router
│   ├── tauri-bridge.ts    # Tauri integration
│   └── ide.ts             # IDE interface
│
└── gui/                    # React UI (mevcut)
    └── hooks/
        └── useCore.ts     # Core hook
```

## 🔄 Message Flow

```
User Input (GUI)
    ↓
GUI sends ChatRequestMessage
    ↓
Extension routes to Core
    ↓
Core processes (AI, Context, Planning)
    ↓
Core sends StreamingTokenMessage(s)
    ↓
Extension routes to GUI
    ↓
GUI updates UI (streaming animation)
```

## 🚀 Özellikler

### ✅ Mevcut Özellikler (Korunur)
- AI chat
- File indexing
- Context management
- Code actions

### 🆕 Yeni Özellikler
- **Real Streaming:** Token-by-token streaming
- **Stop Generation:** Yanıtı durdurma
- **Regenerate:** Yanıtı yeniden oluşturma
- **Planning Agent:** Karmaşık görevleri planlama
- **Smart Context:** Akıllı context seçimi
- **Message Protocol:** Tip-safe iletişim

## 📊 Implementation Planı

### Phase 1: Setup (1 gün)
- Klasör yapısı
- Protocol types
- Core skeleton

### Phase 2: Core AI (2 gün)
- AI Manager
- Streaming Handler
- Model Management

### Phase 3: Context (2 gün)
- Context Manager
- Context Cache
- Context Providers

### Phase 4: Planning (2 gün)
- Planning Agent
- Task Executor
- Task Types

### Phase 5: Extension (2 gün)
- Extension Entry
- Messenger
- Tauri Bridge
- IDE Interface

### Phase 6: GUI (1 gün)
- Core Hook
- ChatPanel update
- UI Components

### Phase 7-10: Polish (3 gün)
- Advanced features
- Testing
- Documentation
- Optimization

**Toplam:** 10-11 gün

## 🎯 Başarı Kriterleri

1. ✅ Core, Extension, GUI tamamen ayrı çalışmalı
2. ✅ Message passing tip-safe ve performanslı olmalı
3. ✅ Context management akıllı ve cache'li olmalı
4. ✅ Planning karmaşık görevleri parçalayabilmeli
5. ✅ Streaming gerçek zamanlı çalışmalı
6. ✅ Mevcut özellikler bozulmamalı

## 📚 Dokümantasyon

- **[requirements.md](./requirements.md)** - Detaylı gereksinimler
- **[design.md](./design.md)** - Mimari tasarım ve kod örnekleri
- **[tasks.md](./tasks.md)** - Implementation task listesi

## 🛠️ Nasıl Başlanır?

### 1. Spec'i İncele
```bash
# Requirements'ı oku
cat .kiro/specs/continue-architecture-adaptation/requirements.md

# Design'ı oku
cat .kiro/specs/continue-architecture-adaptation/design.md

# Tasks'ı oku
cat .kiro/specs/continue-architecture-adaptation/tasks.md
```

### 2. Phase 1'i Başlat
```bash
# Klasörleri oluştur
mkdir -p src/core/{protocol,ai,context,planning}
mkdir -p src/extension

# Protocol types'ı yaz
touch src/core/protocol/{types,core,gui,index}.ts

# Core skeleton'u oluştur
touch src/core/index.ts
```

### 3. Test Et
```bash
npm run build
npm run test
```

## 🤝 Katkıda Bulunma

1. Task'ı seç (tasks.md'den)
2. Branch oluştur (`git checkout -b feature/task-1.1`)
3. Kodu yaz
4. Test et
5. Commit yap (`git commit -m "feat: implement task 1.1"`)
6. PR oluştur

## 📝 Notlar

- Mevcut AI sistemi korunur (backward compatibility)
- Kademeli migration yapılır
- Her phase test edilir
- Performance monitoring sürekli yapılır

## 🎉 Sonuç

Bu mimari ile CoreX IDE, Continue.dev benzeri güçlü özelliklere sahip olacak:
- Temiz mimari
- Test edilebilir kod
- Yeniden kullanılabilir componentler
- Güçlü AI özellikleri

**Hazır mısın?** [tasks.md](./tasks.md) dosyasından başla! 🚀

---

**Oluşturulma Tarihi:** 2025-02-11
**Durum:** Spec hazır, implementation bekliyor
**Tahmini Süre:** 10-11 gün
