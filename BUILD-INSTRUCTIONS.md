# 🚀 CoreX Build Instructions

CoreX supports multiple GPU backends for optimal performance on different systems.

## 🎮 Build Options

### 1. CUDA Build (NVIDIA GPUs - Fastest)
**For:** NVIDIA GPU users (RTX, GTX series)
**Performance:** Best performance on NVIDIA cards

```bash
npm run tauri:build:cuda
```

**Requirements:**
- NVIDIA GPU with CUDA support
- CUDA Toolkit installed
- cuDNN installed

---

### 2. Vulkan Build (Universal GPU - Recommended for Distribution)
**For:** AMD, Intel, NVIDIA GPUs
**Performance:** Good performance on all modern GPUs

```bash
npm run tauri:build:vulkan
```

**Requirements:**
- Any modern GPU with Vulkan support
- Vulkan drivers installed

---

### 3. CPU Build (No GPU Required)
**For:** Systems without GPU or for testing
**Performance:** Slower, but works everywhere

```bash
npm run tauri:build:cpu
```

**Requirements:**
- None (works on all systems)

---

## 🔧 Development

For development, the default build uses CUDA (if you have NVIDIA GPU):

```bash
npm run tauri:dev
```

To change default for development, edit `src-tauri/Cargo.toml`:

```toml
[features]
default = ["cuda"]    # For NVIDIA GPU
# default = ["vulkan"]  # For AMD/Intel/Universal
# default = []          # For CPU-only
```

---

## 📦 Distribution Strategy

**Recommended:** Build 3 versions for users:

1. **CoreX-CUDA.exe** - For NVIDIA users (best performance)
2. **CoreX-Vulkan.exe** - For AMD/Intel users (universal)
3. **CoreX-CPU.exe** - For systems without GPU

Users can download the version that matches their hardware.

---

## 🎯 Current Configuration

**Default:** CUDA (optimized for NVIDIA GPUs)

This means:
- ✅ `npm run tauri:dev` uses CUDA
- ✅ `npm run tauri:build` uses CUDA
- ✅ Best performance on NVIDIA GPUs

To build for other platforms, use specific commands above.

---

## 🔍 How to Check Your GPU

**Windows:**
```bash
# Check NVIDIA GPU
nvidia-smi

# Check Vulkan support
vulkaninfo
```

**Linux:**
```bash
# Check GPU
lspci | grep -i vga

# Check CUDA
nvcc --version

# Check Vulkan
vulkaninfo
```

---

## ⚡ Performance Comparison

| Backend | NVIDIA RTX 3060 | AMD RX 6700 | Intel Arc A770 | CPU (i7-12700) |
|---------|----------------|-------------|----------------|----------------|
| CUDA    | 🟢 100%        | ❌ N/A      | ❌ N/A         | ❌ N/A         |
| Vulkan  | 🟡 85%         | 🟢 100%     | 🟢 100%        | ❌ N/A         |
| CPU     | 🔴 15%         | 🔴 15%      | 🔴 15%         | 🔴 100%        |

---

## 🐛 Troubleshooting

### Model loads on CPU instead of GPU

**Check:**
1. Is the correct build being used? (CUDA for NVIDIA, Vulkan for others)
2. Are GPU drivers installed?
3. Is CUDA Toolkit installed? (for CUDA builds)
4. Check terminal output for GPU detection messages

**Solution:**
```bash
# Rebuild with correct backend
npm run tauri:build:cuda   # For NVIDIA
npm run tauri:build:vulkan # For AMD/Intel
```

### CUDA not found error

**Install CUDA Toolkit:**
- Download: https://developer.nvidia.com/cuda-downloads
- Version: 11.8 or 12.x recommended

### Vulkan not found error

**Install Vulkan:**
- NVIDIA: Included in GPU drivers
- AMD: Included in Adrenalin drivers
- Intel: Included in Arc drivers

---

## 📝 Notes

- **Default build** is optimized for your system (CUDA)
- **Distribution builds** should include all 3 versions
- **GPU detection** happens at runtime (llama.cpp handles it)
- **Fallback to CPU** is automatic if GPU fails

---

**Built with ❤️ for CoreX IDE**
