export interface GGUFModel {
    id: string;
    name: string;
    displayName: string;
    size: string;
    sizeBytes: number;
    quantization: string;
    description: string;
    huggingFaceUrl: string;
    downloadUrl: string;
    localPath?: string;
    isDownloaded: boolean;
    isDownloading: boolean;
    downloadProgress?: number;
    downloadedBytes?: number;
    downloadStartTime?: number;
    parameters?: string;
    contextLength?: number;
    downloads?: number;
    likes?: number;
    isFavorite?: boolean;
    lastUsed?: number;
    usageCount?: number;
}

export interface HuggingFaceModel {
    id: string;
    modelId: string;
    author: string;
    downloads: number;
    likes: number;
    tags: string[];
    siblings?: Array<{ rfilename: string; size?: number }>;
}

export interface SystemRequirements {
    minRAM: number;
    minVRAM: number;
    recommendedRAM: number;
    recommendedVRAM: number;
}

export interface GGUFModelBrowserProps {
    onModelSelect: (model: GGUFModel) => void;
}
