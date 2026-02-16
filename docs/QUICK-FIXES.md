# ⚡ Hızlı Düzeltmeler - Corex IDE

Bu dosya, **hemen** uygulanabilecek kritik düzeltmeleri içerir.

---

## 🔴 KRİTİK - HEMEN YAPILMALI

### 1. CUDA Dependency Düzeltmesi (5 dakika)

**Dosya:** `src-tauri/Cargo.toml`

**Değiştir:**
```toml
# ÖNCE
llama-cpp-2 = { version = "0.1.77", features = ["cuda"] }

# SONRA
llama-cpp-2 = { version = "0.1.77", features = [] }
```

**Neden:** CUDA olmayan sistemlerde derlenmez!

---

### 2. Client Secret Güvenliği (30 dakika)

**Dosya:** `src/services/auth.ts`

**Sil:**
```typescript
client_secret: import.meta.env[`VITE_${provider.id.toUpperCase()}_CLIENT_SECRET`]
```

**Ekle:** `src-tauri/src/oauth.rs`
```rust
#[tauri::command]
async fn exchange_oauth_token(
    code: String,
    provider: String
) -> Result<TokenResponse, String> {
    let client_secret = match provider.as_str() {
        "github" => env::var("GITHUB_CLIENT_SECRET")?,
        "microsoft" => env::var("MICROSOFT_CLIENT_SECRET")?,
        _ => return Err("Unknown provider".into())
    };
    
    // Token exchange burada yap
}
```

**Neden:** Client secret frontend'de görünür - GÜVENLİK AÇIĞI!

---

### 3. Cache Size Limiti (10 dakika)

**Dosya:** `src/services/cache.ts`

**Ekle:**
```typescript
class CacheManager {
  private readonly MAX_EMBEDDINGS = 1000;
  private readonly MAX_AI_RESPONSES = 100;
  
  set(key: string, value: CachedEmbedding) {
    // Limit kontrolü
    if (this.embeddingCache.size >= this.MAX_EMBEDDINGS) {
      const oldestKey = this.getOldestKey();
      this.embeddingCache.delete(oldestKey);
    }
    
    this.embeddingCache.set(key, value);
  }
  
  private getOldestKey(): string {
    let oldest = { key: '', timestamp: Infinity };
    
    for (const [key, value] of this.embeddingCache) {
      if (value.timestamp < oldest.timestamp) {
        oldest = { key, timestamp: value.timestamp };
      }
    }
    
    return oldest.key;
  }
}
```

**Neden:** Memory leak - uzun kullanımda bellek tükenir!

---

### 4. Error Boundary (15 dakika)

**Yeni Dosya:** `src/components/ErrorBoundary.tsx`

```typescript
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Bir şeyler ters gitti 😔</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Yeniden Yükle
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Kullan:** `src/main.tsx`
```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Neden:** Uygulama crash olduğunda kullanıcı beyaz ekran görüyor!

---

### 5. Environment Validation (5 dakika)

**Yeni Dosya:** `src/config/env.ts`

```typescript
const requiredEnvVars = [
  'VITE_GITHUB_CLIENT_ID',
  'VITE_MICROSOFT_CLIENT_ID'
];

export function validateEnv() {
  const missing: string[] = [];
  
  for (const key of requiredEnvVars) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      `Please check your .env file.`
    );
  }
}
```

**Kullan:** `src/main.tsx`
```typescript
import { validateEnv } from './config/env';

validateEnv(); // Uygulama başlamadan önce

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
```

**Neden:** .env eksikse uygulama çalışmıyor ama neden belli değil!

---

## 🟡 ÖNEMLİ - BU HAFTA YAPILMALI

### 6. Type Safety (1 saat)

**Dosya:** `src/services/auth.ts`

**Ekle:**
```typescript
interface GitHubUser {
  id: number;
  login: string;
  email: string;
  avatar_url: string;
}

interface MicrosoftUser {
  id: string;
  displayName: string;
  mail: string;
  photo?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

async function getUserProfile(
  provider: AuthProvider, 
  accessToken: string
): Promise<GitHubUser | MicrosoftUser> {
  // Type-safe implementation
}
```

**Neden:** any type kullanımı runtime hatalara yol açıyor!

---

### 7. Async Error Handling (30 dakika)

**Tüm async fonksiyonlarda:**

```typescript
// ÖNCE
setTimeout(async () => {
  await saveProjectIndex(...);
}, 1000);

// SONRA
setTimeout(() => {
  saveProjectIndex(...)
    .catch(error => {
      console.error('Save failed:', error);
      showNotification('error', 'Kaydetme başarısız');
    });
}, 1000);
```

**Neden:** Unhandled promise rejection - sessiz hatalar!

---

### 8. Performance: React.memo (1 saat)

**Büyük component'lerde:**

```typescript
// ÖNCE
export default function ChatPanel({ messages, onSend }) {
  // ...
}

// SONRA
export default React.memo(function ChatPanel({ messages, onSend }) {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.messages.length === nextProps.messages.length;
});
```

**Neden:** Her state değişiminde tüm component'ler render oluyor!

---

### 9. Batch File Processing (2 saat)

**Dosya:** `src/services/incrementalIndexer.ts`

```typescript
async indexProject(path: string) {
  const files = await this.scanFiles(path);
  
  // ÖNCE: Tek tek
  for (const file of files) {
    await this.indexFile(file);
  }
  
  // SONRA: Batch
  const BATCH_SIZE = 10;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(f => this.indexFile(f)));
  }
}
```

**Neden:** 1000 dosya tek tek indexleniyor - çok yavaş!

---

### 10. Logger Service (1 saat)

**Yeni Dosya:** `src/services/logger.ts`

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private static isDev = import.meta.env.DEV;
  
  static log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, data };
    
    // Console (development only)
    if (this.isDev) {
      console[level](message, data);
    }
    
    // File (always)
    this.writeToFile(logEntry);
    
    // Error tracking (production only)
    if (!this.isDev && level === 'error') {
      this.sendToErrorTracking(logEntry);
    }
  }
  
  static info(message: string, data?: any) {
    this.log('info', message, data);
  }
  
  static error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

export default Logger;
```

**Kullan:**
```typescript
// ÖNCE
console.log("🚀 Indexing...");
console.error("❌ Error:", error);

// SONRA
Logger.info("Indexing started");
Logger.error("Indexing failed", { error, path });
```

**Neden:** Production'da log yönetimi yok!

---

## 🟢 İYİLEŞTİRME - ZAMAN BULUNCA

### 11. Code Splitting (2 saat)

```typescript
// Lazy load büyük component'ler
const GGUFModelBrowser = lazy(() => import('./components/GGUFModelBrowser'));
const CodeAnalysis = lazy(() => import('./components/CodeAnalysis'));

<Suspense fallback={<Loading />}>
  <GGUFModelBrowser />
</Suspense>
```

---

### 12. Virtual Scrolling (3 saat)

```typescript
// Büyük listeler için
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={files.length}
  itemSize={35}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>{files[index]}</div>
  )}
</FixedSizeList>
```

---

### 13. Service Worker (4 saat)

```typescript
// Offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

---

## 📋 Checklist

### Bugün Yapılacaklar
- [ ] CUDA dependency düzelt
- [ ] Client secret backend'e taşı
- [ ] Cache size limiti ekle
- [ ] Error boundary ekle
- [ ] Environment validation

### Bu Hafta
- [ ] Type safety düzelt
- [ ] Async error handling
- [ ] React.memo ekle
- [ ] Batch processing
- [ ] Logger service

### Bu Ay
- [ ] Code splitting
- [ ] Virtual scrolling
- [ ] Service worker
- [ ] Unit tests
- [ ] Documentation

---

## 🚀 Hızlı Başlangıç

```bash
# 1. CUDA düzelt
code src-tauri/Cargo.toml
# features = ["cuda"] → features = []

# 2. Cache limiti ekle
code src/services/cache.ts
# MAX_EMBEDDINGS = 1000 ekle

# 3. Error boundary ekle
code src/components/ErrorBoundary.tsx
# Component oluştur

# 4. Environment validation
code src/config/env.ts
# Validation fonksiyonu ekle

# 5. Test et
npm run tauri:dev
```

---

**Toplam Süre:** ~4 saat  
**Etki:** 🔴 Kritik sorunlar çözülür  
**Sonuç:** Uygulama stabil ve güvenli hale gelir

