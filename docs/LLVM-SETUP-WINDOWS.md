# LLVM Setup for Windows - GGUF Direct Support

## Problem

llama-cpp-2 binding'i compile etmek için LLVM/Clang gerekiyor:

```
Unable to find libclang: "couldn't find any valid shared libraries matching: 
['clang.dll', 'libclang.dll']"
```

## Çözüm 1: LLVM İndir ve Kur (Önerilen)

### Adım 1: LLVM İndir

https://github.com/llvm/llvm-project/releases

**Windows için:**
- LLVM-18.1.8-win64.exe (veya en son sürüm)
- Boyut: ~400 MB

### Adım 2: Kur

1. İndirilen .exe'yi çalıştır
2. "Add LLVM to system PATH" seçeneğini işaretle ✅
3. Install

### Adım 3: Environment Variable Ayarla

PowerShell'de:

```powershell
# LLVM path'i kontrol et
$env:LIBCLANG_PATH = "C:\Program Files\LLVM\bin"

# Kalıcı olarak ekle (System Properties)
[System.Environment]::SetEnvironmentVariable(
    "LIBCLANG_PATH", 
    "C:\Program Files\LLVM\bin", 
    [System.EnvironmentVariableTarget]::User
)
```

### Adım 4: Tekrar Build

```bash
cd src-tauri
cargo clean
cargo build
```

## Çözüm 2: Chocolatey ile Kur (Daha Kolay)

```powershell
# Chocolatey yoksa kur
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# LLVM kur
choco install llvm -y

# Environment variable otomatik eklenir
```

## Çözüm 3: Pre-built Binary Kullan (En Kolay!)

llama-cpp-2 yerine **llama-cpp-rs** kullan (pre-built binary var):

### Cargo.toml:

```toml
[dependencies]
# llama-cpp-2 yerine:
llama-cpp-rs = "0.3"
```

Bu LLVM gerektirmez!

## Çözüm 4: Ollama Kullan (Şu Anki Durum)

GGUF direkt desteği karmaşık. Ollama kullan:

### Avantajlar:
- ✅ Kolay kurulum
- ✅ GGUF desteği var
- ✅ Model yönetimi
- ✅ LLVM gerekmez

### Kullanım:

```bash
# Ollama kur
winget install Ollama.Ollama

# Model yükle
ollama pull qwen2.5-coder:7b

# Çalıştır (otomatik başlar)
ollama run qwen2.5-coder:7b
```

Uygulama Ollama'ya bağlanır (localhost:11434).

## Önerim

**Şimdilik Ollama kullan, GGUF direkt desteği gelecekte ekleriz.**

Neden:
1. LLVM kurulumu karmaşık
2. Ollama zaten GGUF destekliyor
3. Daha stabil
4. Daha kolay

## GGUF Direkt vs Ollama

| Özellik | GGUF Direct | Ollama |
|---------|-------------|--------|
| Kurulum | Karmaşık (LLVM) | Kolay |
| GGUF Desteği | ✅ | ✅ |
| Model Yönetimi | Manuel | Otomatik |
| Harici Program | ❌ | ✅ |
| Build Süresi | Uzun (10+ dk) | Yok |
| Executable Boyutu | +100 MB | Normal |

## Karar

İstersen:
1. **LLVM kur** → GGUF direkt çalışır
2. **Ollama kullan** → Daha kolay

Hangisini istersin?
