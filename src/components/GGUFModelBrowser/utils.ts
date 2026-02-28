import { GGUFModel, SystemRequirements } from './types';

export const QUANT_INFO: Record<string, { quality: string; vramMultiplier: number }> = {
    'Q4_K_M': { quality: 'Önerilen - İyi kalite', vramMultiplier: 0.55 },
    'Q5_K_M': { quality: 'Çok yüksek kalite', vramMultiplier: 0.7 },
    'Q6_K': { quality: 'En yüksek kalite', vramMultiplier: 0.8 },
};

export const calculateRequirements = (model: GGUFModel, contextLength: number = 4096): SystemRequirements => {
    const sizeGB = model.sizeBytes / (1024 ** 3);
    const quantInfo = QUANT_INFO[model.quantization] || { vramMultiplier: 0.5 };
    const contextRAM = (contextLength / 1000) * sizeGB * 0.002;

    return {
        minRAM: Math.ceil(sizeGB * 1.2),
        minVRAM: Math.ceil(sizeGB * quantInfo.vramMultiplier),
        recommendedRAM: Math.ceil(sizeGB * 1.5 + contextRAM),
        recommendedVRAM: Math.ceil(sizeGB * quantInfo.vramMultiplier * 1.2)
    };
};
