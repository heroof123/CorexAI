# TASK 24: Adaptive Autonomy

**Tarih:** 8 Şubat 2026  
**Durum:** ✅ TAMAMLANDI  
**Süre:** ~45 dakika

## 📋 Özet

Model gücüne göre tool otomasyonu! Küçük modeller güvenli (onay ister), büyük modeller özgür (otomatik çalıştırır). Kullanıcı kontrolü her zaman elde.

## 🎯 Hedef

- Model gücüne göre autonomy level belirleme
- Tool approval mekanizması
- Tehlikeli komutları tespit etme
- Kullanıcı onay dialog'u
- Settings'de autonomy ayarları

## 🎚️ Autonomy Levels

### Level 1 - 🔒 Chat Only
- **Davranış:** Tool yok, sadece sohbet
- **Kullanım:** Test/demo modları
- **Güvenlik:** Maksimum

### Level 2 - 💬 Suggestions
- **Davranış:** Tüm tool'lar onay gerektirir
- **Kullanım:** Küçük modeller (< 3B params)
- **Güvenlik:** Çok yüksek

### Level 3 - ⚖️ Balanced (Default)
- **Davranış:** Güvenli tool'lar otomatik, tehlikeli olanlar onay gerektirir
- **Kullanım:** Orta modeller (3-7B params)
- **Güvenlik:** Dengeli
- **Otomatik:** `read_file`, `list_files`
- **Onay Gerekli:** `write_file`, `run_terminal` (tehlikeli komutlar)

### Level 4 - 🚀 Auto Tools
- **Davranış:** Çoğu tool otomatik çalışır
- **Kullanım:** Büyük modeller (7-13B params)
- **Güvenlik:** Orta
- **Onay Gerekli:** Sadece tehlikeli komutlar

### Level 5 - ⚠️ Autonomous (Dangerous!)
- **Davranış:** Tüm tool'lar otomatik çalışır
- **Kullanım:** Çok büyük modeller (13B+ params) + kullanıcı onayı
- **Güvenlik:** Düşük
- **Uyarı:** Sadece güvendiğiniz modeller için!

## 🔧 Yapılan Değişiklikler

### 1. Autonomy Service (`src/services/autonomy.ts`)

**Yeni Sistem:**
```typescript
export type AutonomyLevel = 1 | 2 | 3 | 4 | 5;

interface AutonomyConfig {
  level: AutonomyLevel;
  autoApproveTools: string[]; // Always auto
  requireApprovalTools: string[]; // Always require
  dangerousCommands: string[]; // Dangerous patterns
}
```

**Fonksiyonlar:**
- `determineAutonomyLevel()` - Model gücüne göre level belirle
- `requiresApproval()` - Tool onay gerektirir mi?
- `isDangerousCommand()` - Komut tehlikeli mi?
- `getAutonomyConfig()` - Config'i yükle
- `saveAutonomyConfig()` - Config'i kaydet

**Tehlikeli Komutlar:**
```typescript
dangerousCommands: [
  'rm ', 'del ', 'format', 'rmdir', 'rd ',
  'shutdown', 'reboot', 'kill',
  'DROP TABLE', 'DELETE FROM',
  'npm uninstall', 'yarn remove'
]
```

### 2. AI Service - Approval Check (`src/services/ai.ts`)

**Yeni Callback:**
```typescript
sendToAI(
  message,
  resetHistory,
  onToolExecution,
  onToolApprovalRequest?: (toolName, parameters) => Promise<boolean>
)
```

**Tool Loop Güncellendi:**
```typescript
while (toolCall && iterations < 5) {
  // 🎚️ Autonomy check
  const needsApproval = requiresApproval(toolName, parameters, config);
  
  if (needsApproval && onToolApprovalRequest) {
    const approved = await onToolApprovalRequest(toolName, parameters);
    
    if (!approved) {
      // Tool reddedildi, AI'ya bildir
      response = await callAI("Tool reddedildi, alternatif öner");
      continue;
    }
  }
  
  // Tool çalıştır
  await executeTool(toolName, parameters);
}
```

### 3. App.tsx - Approval Dialog

**State:**
```typescript
const [toolApprovalRequest, setToolApprovalRequest] = useState<{
  toolName: string;
  parameters: any;
  resolve: (approved: boolean) => void;
} | null>(null);
```

**Callback:**
```typescript
onToolApprovalRequest: (toolName, parameters) => {
  return new Promise<boolean>((resolve) => {
    setToolApprovalRequest({ toolName, parameters, resolve });
  });
}
```

**Dialog UI:**
```tsx
{toolApprovalRequest && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
    <div className="bg-[#1e1e1e] border rounded-lg p-6">
      <h3>Tool Onayı Gerekiyor</h3>
      <div className="bg-[#252525] rounded p-4">
        <span>🔧 {toolName}</span>
        <pre>{JSON.stringify(parameters, null, 2)}</pre>
      </div>
      <button onClick={() => resolve(false)}>❌ Reddet</button>
      <button onClick={() => resolve(true)}>✅ Onayla</button>
    </div>
  </div>
)}
```

### 4. AISettings - Autonomy Tab

**Yeni Tab:**
```tsx
{ id: 'autonomy', label: 'Otomasyon', icon: '🎚️' }
```

**Slider:**
```tsx
<input
  type="range"
  min="1"
  max="5"
  value={autonomyLevel}
  onChange={(e) => {
    const newLevel = parseInt(e.target.value) as AutonomyLevel;
    setAutonomyLevel(newLevel);
    saveAutonomyConfig({ level: newLevel });
  }}
/>
```

**Level Descriptions:**
- Her level için icon, title, description
- Aktif level vurgulanır
- Level 3 "Önerilen" badge'i
- Level 4-5 için uyarı mesajı

**Safe Tools Display:**
```tsx
<div>
  <h4>✅ Güvenli Tool'lar</h4>
  {['read_file', 'list_files'].map(tool => (
    <span className="bg-green-500/10 text-green-400">{tool}</span>
  ))}
</div>
```

**Dangerous Commands Display:**
```tsx
<div>
  <h4>⚠️ Tehlikeli Komutlar</h4>
  {['rm', 'del', 'format', 'DROP TABLE', 'shutdown'].map(cmd => (
    <span className="bg-red-500/10 text-red-400">{cmd}</span>
  ))}
</div>
```

## 🎨 UI Özellikleri

### Approval Dialog

**Görünüm:**
```
┌─────────────────────────────────┐
│ ⚠️  Tool Onayı Gerekiyor        │
│                                 │
│ AI bir tool çalıştırmak istiyor │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🔧 run_terminal             │ │
│ │                             │ │
│ │ Parametreler:               │ │
│ │ {                           │ │
│ │   "command": "npm install"  │ │
│ │ }                           │ │
│ │                             │ │
│ │ ⚠️ Terminal komutu!         │ │
│ └─────────────────────────────┘ │
│                                 │
│ [❌ Reddet]  [✅ Onayla]        │
│                                 │
│ Autonomy ayarlarını değiştir... │
└─────────────────────────────────┘
```

### Autonomy Settings

**Slider:**
```
Seviye 3                    ⚖️ Balanced

[1]───[2]───[3]───[4]───[5]
 🔒   💬   ⚖️   🚀   ⚠️

┌─────────────────────────────────┐
│ ⚖️ Balanced (Önerilen)          │
│ Güvenli tool'lar otomatik,      │
│ tehlikeli olanlar onay gerektirir│
└─────────────────────────────────┘
```

## 📊 Karar Ağacı

```
Tool çağrısı tespit edildi
    ↓
Level 1? → ❌ Block
    ↓
Level 2? → ✅ Onay iste
    ↓
Auto-approve list? → ✅ Otomatik çalıştır
    ↓
Require-approval list? → ✅ Onay iste
    ↓
Level 5? → ✅ Otomatik çalıştır
    ↓
Dangerous command? → ✅ Onay iste
    ↓
Level 3? → read/list → ✅ Otomatik, diğerleri → ✅ Onay iste
    ↓
Level 4? → ✅ Otomatik (dangerous hariç)
```

## 🔐 Güvenlik Özellikleri

1. **Dangerous Command Detection**
   - Pattern matching
   - Case-insensitive
   - Her zaman onay gerektirir

2. **Safe Tools Whitelist**
   - `read_file` - Sadece okuma
   - `list_files` - Sadece listeleme

3. **Require Approval Blacklist**
   - `write_file` - Dosya değiştirme
   - `run_terminal` - Komut çalıştırma (tehlikeli olanlar)

4. **Level-based Protection**
   - Küçük modeller → Daha fazla onay
   - Büyük modeller → Daha az onay
   - Kullanıcı her zaman override edebilir

## 📈 Kullanım Senaryoları

### Senaryo 1: Güvenli Tool (Level 3)
```
User: "package.json dosyasını oku"
AI: "TOOL:read_file|PARAMS:{"path":"package.json"}"
System: ✅ Otomatik çalıştırıldı (safe tool)
AI: "İşte package.json içeriği..."
```

### Senaryo 2: Tehlikeli Komut (Level 3)
```
User: "node_modules klasörünü sil"
AI: "TOOL:run_terminal|PARAMS:{"command":"rm -rf node_modules"}"
System: 🔐 Onay gerekiyor (dangerous command)
[Dialog açılır]
User: ✅ Onayla
System: ✅ Çalıştırıldı
AI: "node_modules silindi"
```

### Senaryo 3: Tool Reddedildi
```
User: "tüm dosyaları sil"
AI: "TOOL:run_terminal|PARAMS:{"command":"rm -rf *"}"
System: 🔐 Onay gerekiyor (dangerous!)
[Dialog açılır]
User: ❌ Reddet
System: 🚫 Tool reddedildi
AI: "Anladım, dosyaları silmeyeceğim. Başka nasıl yardımcı olabilirim?"
```

## 🐛 Edge Cases

1. **Level 1 (Chat Only)**
   - Tüm tool'lar bloklanır
   - AI sadece sohbet edebilir

2. **Level 5 (Autonomous)**
   - Tehlikeli komutlar bile otomatik
   - Kullanıcı sorumluluğu

3. **Approval Timeout**
   - Dialog açık kalırsa ne olur?
   - Şu anda: Sonsuz bekler (gelecekte timeout eklenebilir)

4. **Multiple Tool Calls**
   - Her tool için ayrı onay
   - Kullanıcı her birini ayrı onaylayabilir

## 📦 Build Bilgileri

**Frontend:**
- TypeScript: 0 hata
- Build: 19.17s
- Bundle: 5.89 MB (gzip: 1.43 MB)
- Yeni modül: autonomy.ts (3.5 KB)

**Backend:**
- Rust: 4 warning (dead code)
- Build: 34.95s
- Setup: 81.6 MB

**Final Build:**
- `Corex_0.1.0_x64-setup.exe` (81.6 MB)
- Tarih: 8 Şubat 2026, 02:30

## 🔗 İlgili Dosyalar

- `src/services/autonomy.ts` - Autonomy system (NEW)
- `src/services/ai.ts` - Approval check integration
- `src/App.tsx` - Approval dialog
- `src/components/AISettings.tsx` - Autonomy settings tab

## 🎓 Öğrenilen Dersler

1. **Promise-based Approval:** Dialog için Promise pattern çok etkili
2. **Level-based Security:** Farklı modeller için farklı güvenlik seviyeleri mantıklı
3. **User Control:** Kullanıcı her zaman override edebilmeli
4. **Visual Feedback:** Tehlikeli komutlar görsel olarak vurgulanmalı

## 🚀 Sonraki Adımlar

Tamamlanan:
- ✅ TASK 22: AI Tool System
- ✅ TASK 23: Streaming Tool Execution
- ✅ TASK 24: Adaptive Autonomy

Kalan (Blueprint'ten):
- 🔜 Basit Multi-Agent (Tool-Based) - 2-3 saat
- 🔜 Semantic Brain (AST + Dependency Graph) - 4-5 saat
- 🔜 Infinite Context Illusion - 6-8 saat

---

**Süre:** 45 dakika (tahmin: 1 saat) 😄

**Kullanıcı Yorumu:** "1 hafta diyorsun nedense 1 saat sürmeden bitiyor :d"
