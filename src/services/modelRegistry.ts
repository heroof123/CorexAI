// Model Registry Service - Auto Backend Selection & VRAM Detection
import { invoke } from '@tauri-apps/api/core';

export interface ModelMetadata {
  // Basic Info
  name: string;
  architecture: string;
  parameters: number; // Billion parameters (e.g., 7.0 for 7B)
  quantization: string;
  
  // Size Info
  fileSizeBytes: number;
  fileSizeGB: number;
  
  // Context Info
  contextLength: number;
  embeddingLength: number;
  
  // Tokenizer
  tokenizerModel: string;
  vocabSize: number;
  
  // Training
  trainingDataCutoff?: string;
  license?: string;
  
  // Performance Estimates
  estimatedVRAM: {
    min: number; // GB
    recommended: number; // GB
    withContext: number; // GB (with full context)
  };
  
  // Backend Recommendations
  recommendedBackend: 'cuda' | 'vulkan' | 'cpu';
  recommendedGPULayers: number;
  
  // Raw metadata
  raw?: Record<string, any>;
}

export interface GPUInfo {
  available: boolean;
  vendor: 'nvidia' | 'amd' | 'intel' | 'apple' | 'unknown';
  name: string;
  totalVRAM_GB: number;
  freeVRAM_GB: number;
  usedVRAM_GB: number;
  cudaAvailable: boolean;
  vulkanAvailable: boolean;
  recommendedBackend: 'cuda' | 'vulkan' | 'cpu';
}

export interface BackendRecommendation {
  backend: 'cuda' | 'vulkan' | 'cpu';
  reason: string;
  gpuLayers: number;
  expectedPerformance: 'excellent' | 'good' | 'moderate' | 'slow';
  warnings: string[];
}

/**
 * Read GGUF model metadata
 */
export async function readModelMetadata(modelPath: string): Promise<ModelMetadata> {
  try {
    console.log('📖 Reading model metadata:', modelPath);
    
    // Rust backend'den metadata oku
    const rawMetadata = await invoke<Record<string, any>>('read_gguf_metadata', { path: modelPath });
    
    console.log('📊 Raw metadata keys:', Object.keys(rawMetadata).length);
    
    // Parse metadata
    const metadata = parseGGUFMetadata(rawMetadata, modelPath);
    
    console.log('✅ Metadata parsed:', {
      name: metadata.name,
      params: metadata.parameters + 'B',
      quant: metadata.quantization,
      vram: metadata.estimatedVRAM.recommended + 'GB'
    });
    
    return metadata;
  } catch (error) {
    console.error('❌ Metadata read error:', error);
    throw error;
  }
}

/**
 * Parse GGUF metadata from raw data
 */
function parseGGUFMetadata(raw: Record<string, any>, modelPath: string): ModelMetadata {
  // Extract basic info
  const name = raw['general.name'] || extractNameFromPath(modelPath);
  const architecture = raw['general.architecture'] || 'unknown';
  
  // Extract parameter count
  const paramCount = extractParameterCount(raw, modelPath);
  
  // Extract quantization
  const quantization = extractQuantization(raw, modelPath);
  
  // Extract context length
  const contextLength = raw['llama.context_length'] || 
                       raw['context_length'] || 
                       raw['n_ctx'] || 
                       4096;
  
  // Extract embedding length
  const embeddingLength = raw['llama.embedding_length'] || 
                         raw['embedding_length'] || 
                         4096;
  
  // Extract tokenizer info
  const tokenizerModel = raw['tokenizer.ggml.model'] || 'unknown';
  const vocabSize = raw['llama.vocab_size'] || 
                   raw['vocab_size'] || 
                   32000;
  
  // Get file size
  const fileSizeBytes = raw['file_size'] || 0;
  const fileSizeGB = fileSizeBytes / (1024 ** 3);
  
  // Calculate VRAM estimates
  const vramEstimates = calculateVRAMEstimates(
    fileSizeGB,
    quantization,
    contextLength,
    paramCount
  );
  
  // Get GPU info for backend recommendation
  const gpuInfo = getGPUInfoSync();
  const backendRec = recommendBackend(vramEstimates, gpuInfo);
  
  return {
    name,
    architecture,
    parameters: paramCount,
    quantization,
    fileSizeBytes,
    fileSizeGB,
    contextLength,
    embeddingLength,
    tokenizerModel,
    vocabSize,
    trainingDataCutoff: raw['general.training_data_cutoff'],
    license: raw['general.license'],
    estimatedVRAM: vramEstimates,
    recommendedBackend: backendRec.backend,
    recommendedGPULayers: backendRec.gpuLayers,
    raw
  };
}

/**
 * Extract parameter count from metadata or filename
 */
function extractParameterCount(raw: Record<string, any>, modelPath: string): number {
  // Try metadata first
  if (raw['general.parameter_count']) {
    return raw['general.parameter_count'] / 1_000_000_000; // Convert to billions
  }
  
  // Try filename
  const fileName = modelPath.split(/[/\\]/).pop() || '';
  const match = fileName.match(/(\d+\.?\d*)[Bb]/);
  
  if (match) {
    return parseFloat(match[1]);
  }
  
  // Default estimate based on architecture
  const arch = raw['general.architecture'] || '';
  if (arch.includes('7b')) return 7.0;
  if (arch.includes('13b')) return 13.0;
  if (arch.includes('3b')) return 3.0;
  
  return 7.0; // Default
}

/**
 * Extract quantization from metadata or filename
 */
function extractQuantization(raw: Record<string, any>, modelPath: string): string {
  // Try metadata
  if (raw['general.quantization_version']) {
    return `Q${raw['general.quantization_version']}`;
  }
  
  // Try filename
  const fileName = modelPath.split(/[/\\]/).pop() || '';
  const match = fileName.match(/[Qq](\d+)_[KkMm]_?[MmLl]?/);
  
  if (match) {
    return match[0].toUpperCase();
  }
  
  return 'Q4_K_M'; // Default
}

/**
 * Extract model name from file path
 */
function extractNameFromPath(modelPath: string): string {
  const fileName = modelPath.split(/[/\\]/).pop() || '';
  return fileName.replace('.gguf', '').replace(/-/g, ' ');
}

/**
 * Calculate VRAM estimates
 */
function calculateVRAMEstimates(
  fileSizeGB: number,
  quantization: string,
  contextLength: number,
  parameters: number
): { min: number; recommended: number; withContext: number } {
  // Base VRAM = file size
  const baseVRAM = fileSizeGB;
  
  // Quantization multiplier
  const quantMultiplier = getQuantizationMultiplier(quantization);
  
  // Context overhead (KV cache)
  // Formula: (context_length * embedding_dim * 2 * bytes_per_element) / 1GB
  // Simplified: context_length * parameters * 0.0001
  const contextOverhead = (contextLength / 1000) * parameters * 0.0001;
  
  // Minimum VRAM (just model)
  const min = Math.ceil(baseVRAM * quantMultiplier);
  
  // Recommended VRAM (model + small context)
  const recommended = Math.ceil(baseVRAM * quantMultiplier * 1.2 + contextOverhead * 0.5);
  
  // With full context
  const withContext = Math.ceil(baseVRAM * quantMultiplier * 1.2 + contextOverhead);
  
  return { min, recommended, withContext };
}

/**
 * Get quantization multiplier for VRAM calculation
 */
function getQuantizationMultiplier(quant: string): number {
  const quantMap: Record<string, number> = {
    'Q2_K': 0.35,
    'Q3_K_S': 0.4,
    'Q3_K_M': 0.45,
    'Q3_K_L': 0.5,
    'Q4_0': 0.5,
    'Q4_1': 0.55,
    'Q4_K_S': 0.5,
    'Q4_K_M': 0.55,
    'Q5_0': 0.65,
    'Q5_1': 0.7,
    'Q5_K_S': 0.65,
    'Q5_K_M': 0.7,
    'Q6_K': 0.8,
    'Q8_0': 0.95,
    'F16': 1.0,
    'F32': 2.0
  };
  
  return quantMap[quant] || 0.55; // Default to Q4_K_M
}

/**
 * Get GPU info (sync version for initial load)
 */
function getGPUInfoSync(): GPUInfo {
  // This will be populated by async call
  // For now, return cached value or default
  const cached = localStorage.getItem('gpu-info-cache');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Ignore
    }
  }
  
  return {
    available: false,
    vendor: 'unknown',
    name: 'Unknown GPU',
    totalVRAM_GB: 0,
    freeVRAM_GB: 0,
    usedVRAM_GB: 0,
    cudaAvailable: false,
    vulkanAvailable: false,
    recommendedBackend: 'cpu'
  };
}

/**
 * Get GPU info (async)
 */
export async function getGPUInfo(): Promise<GPUInfo> {
  try {
    console.log('🎮 Detecting GPU...');
    
    // Get GPU memory info
    const memInfo = await invoke<{
      available: boolean;
      total_vram_gb: number;
      used_vram_gb: number;
      free_vram_gb: number;
    }>('get_gpu_memory_info');
    
    // Get backend support
    const backendInfo = await invoke<{
      cuda_available: boolean;
      vulkan_available: boolean;
      backend: string;
      message: string;
    }>('check_cuda_support');
    
    // Detect GPU vendor from backend info
    const vendor = detectGPUVendor(backendInfo.message);
    
    // Determine recommended backend
    const recommendedBackend = determineRecommendedBackend(
      backendInfo.cuda_available,
      backendInfo.vulkan_available,
      vendor
    );
    
    const gpuInfo: GPUInfo = {
      available: memInfo.available,
      vendor,
      name: extractGPUName(backendInfo.message),
      totalVRAM_GB: memInfo.total_vram_gb,
      freeVRAM_GB: memInfo.free_vram_gb,
      usedVRAM_GB: memInfo.used_vram_gb,
      cudaAvailable: backendInfo.cuda_available,
      vulkanAvailable: backendInfo.vulkan_available,
      recommendedBackend
    };
    
    // Cache for sync access
    localStorage.setItem('gpu-info-cache', JSON.stringify(gpuInfo));
    
    console.log('✅ GPU detected:', {
      vendor: gpuInfo.vendor,
      vram: gpuInfo.totalVRAM_GB + 'GB',
      backend: gpuInfo.recommendedBackend
    });
    
    return gpuInfo;
  } catch (error) {
    console.error('❌ GPU detection failed:', error);
    
    // Return default (CPU fallback)
    return {
      available: false,
      vendor: 'unknown',
      name: 'No GPU detected',
      totalVRAM_GB: 0,
      freeVRAM_GB: 0,
      usedVRAM_GB: 0,
      cudaAvailable: false,
      vulkanAvailable: false,
      recommendedBackend: 'cpu'
    };
  }
}

/**
 * Detect GPU vendor from backend message
 */
function detectGPUVendor(message: string): 'nvidia' | 'amd' | 'intel' | 'apple' | 'unknown' {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('nvidia') || lowerMsg.includes('cuda')) return 'nvidia';
  if (lowerMsg.includes('amd') || lowerMsg.includes('radeon')) return 'amd';
  if (lowerMsg.includes('intel')) return 'intel';
  if (lowerMsg.includes('apple') || lowerMsg.includes('metal')) return 'apple';
  
  return 'unknown';
}

/**
 * Extract GPU name from backend message
 */
function extractGPUName(message: string): string {
  // Try to extract GPU name from message
  const match = message.match(/GPU:\s*([^\n]+)/i);
  if (match) {
    return match[1].trim();
  }
  
  return 'Unknown GPU';
}

/**
 * Determine recommended backend
 */
function determineRecommendedBackend(
  cudaAvailable: boolean,
  vulkanAvailable: boolean,
  vendor: string
): 'cuda' | 'vulkan' | 'cpu' {
  // NVIDIA: Prefer CUDA
  if (vendor === 'nvidia' && cudaAvailable) {
    return 'cuda';
  }
  
  // AMD/Intel: Prefer Vulkan
  if ((vendor === 'amd' || vendor === 'intel') && vulkanAvailable) {
    return 'vulkan';
  }
  
  // Fallback: Vulkan if available, else CPU
  if (vulkanAvailable) {
    return 'vulkan';
  }
  
  if (cudaAvailable) {
    return 'cuda';
  }
  
  return 'cpu';
}

/**
 * Recommend backend for a specific model
 */
function recommendBackend(
  vramEstimates: { min: number; recommended: number; withContext: number },
  gpuInfo: GPUInfo
): { backend: 'cuda' | 'vulkan' | 'cpu'; gpuLayers: number } {
  // No GPU available
  if (!gpuInfo.available || gpuInfo.totalVRAM_GB === 0) {
    return {
      backend: 'cpu',
      gpuLayers: 0
    };
  }
  
  // Check if model fits in VRAM
  const fitsInVRAM = gpuInfo.freeVRAM_GB >= vramEstimates.recommended;
  
  if (!fitsInVRAM) {
    // Partial offload
    const availableVRAM = gpuInfo.freeVRAM_GB * 0.9; // Leave 10% buffer
    const layerRatio = availableVRAM / vramEstimates.recommended;
    const gpuLayers = Math.floor(layerRatio * 32); // Assume 32 layers max
    
    return {
      backend: gpuInfo.recommendedBackend,
      gpuLayers: Math.max(0, Math.min(gpuLayers, 32))
    };
  }
  
  // Full offload
  return {
    backend: gpuInfo.recommendedBackend,
    gpuLayers: 33 // All layers (33 for most 7B models)
  };
}

/**
 * Get backend recommendation with detailed info
 */
export async function getBackendRecommendation(
  modelPath: string
): Promise<BackendRecommendation> {
  try {
    // Read model metadata
    const metadata = await readModelMetadata(modelPath);
    
    // Get GPU info
    const gpuInfo = await getGPUInfo();
    
    // Determine backend
    const backend = metadata.recommendedBackend;
    const gpuLayers = metadata.recommendedGPULayers;
    
    // Determine performance
    let expectedPerformance: 'excellent' | 'good' | 'moderate' | 'slow' = 'moderate';
    if (backend === 'cuda' && gpuLayers >= 28) {
      expectedPerformance = 'excellent';
    } else if (backend === 'vulkan' && gpuLayers >= 28) {
      expectedPerformance = 'good';
    } else if (gpuLayers > 0) {
      expectedPerformance = 'moderate';
    } else {
      expectedPerformance = 'slow';
    }
    
    // Generate warnings
    const warnings: string[] = [];
    
    if (!gpuInfo.available) {
      warnings.push('⚠️ GPU bulunamadı - CPU kullanılacak (yavaş)');
    }
    
    if (gpuInfo.freeVRAM_GB < metadata.estimatedVRAM.recommended) {
      warnings.push(`⚠️ Yetersiz VRAM - ${metadata.estimatedVRAM.recommended}GB gerekli, ${gpuInfo.freeVRAM_GB.toFixed(1)}GB mevcut`);
    }
    
    if (backend === 'cuda' && !gpuInfo.cudaAvailable) {
      warnings.push('⚠️ CUDA kullanılamıyor - Vulkan\'a geçiliyor');
    }
    
    if (gpuLayers < 28) {
      warnings.push(`⚠️ Kısmi GPU offload - ${gpuLayers}/33 layer GPU\'da`);
    }
    
    // Generate reason
    let reason = '';
    if (backend === 'cuda') {
      reason = `NVIDIA GPU tespit edildi - CUDA en iyi performansı verir (${gpuLayers}/33 layer)`;
    } else if (backend === 'vulkan') {
      reason = `${gpuInfo.vendor.toUpperCase()} GPU tespit edildi - Vulkan öneriliyor (${gpuLayers}/33 layer)`;
    } else {
      reason = 'GPU bulunamadı veya yetersiz VRAM - CPU kullanılacak';
    }
    
    return {
      backend,
      reason,
      gpuLayers,
      expectedPerformance,
      warnings
    };
  } catch (error) {
    console.error('❌ Backend recommendation failed:', error);
    
    return {
      backend: 'cpu',
      reason: 'Hata oluştu - CPU fallback',
      gpuLayers: 0,
      expectedPerformance: 'slow',
      warnings: ['❌ Backend analizi başarısız']
    };
  }
}

/**
 * Calculate optimal GPU layers for a model
 */
export function calculateOptimalGPULayers(
  modelSizeGB: number,
  availableVRAM_GB: number,
  contextLength: number = 4096
): number {
  // Leave 10% buffer
  const usableVRAM = availableVRAM_GB * 0.9;
  
  // Context overhead
  const contextOverhead = (contextLength / 4096) * 0.5; // ~0.5GB per 4K context
  
  // Available for model
  const availableForModel = usableVRAM - contextOverhead;
  
  // Layer ratio
  const layerRatio = availableForModel / modelSizeGB;
  
  // Calculate layers (assume 33 layers for 7B models)
  const totalLayers = 33;
  const gpuLayers = Math.floor(layerRatio * totalLayers);
  
  // Clamp between 0 and totalLayers
  return Math.max(0, Math.min(gpuLayers, totalLayers));
}
