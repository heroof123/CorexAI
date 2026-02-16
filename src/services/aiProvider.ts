// AI Provider Management Service
import { invoke } from "@tauri-apps/api/core";

export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'local' | 'custom';
  baseUrl: string;
  host?: string;
  port?: number;
  apiKey?: string;
  models: AIModel[];
  isActive: boolean;
  icon: string;
  description: string;
}

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  specialty: string;
  roles?: ('coder' | 'tester' | 'planner' | 'chat' | 'reviewer' | 'analyzer')[]; // 🆕 Çoklu roller
  maxTokens?: number;
  temperature?: number;
  isActive: boolean;
}

// AI Provider'ları yükle
export function loadAIProviders(): AIProvider[] {
  const saved = localStorage.getItem('corex-ai-providers');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('AI providers yüklenemedi:', error);
    }
  }
  
  // Default providers
  return [
    {
      id: "lm-studio",
      name: "LM Studio",
      type: "local",
      baseUrl: "http://127.0.0.1:1234/v1",
      host: "127.0.0.1",
      port: 1234,
      models: [
        {
          id: "main",
          name: "qwen2.5-coder-7b-instruct",
          displayName: "Qwen2.5 Coder 7B",
          description: "Ana model - Planlama ve kodlama",
          specialty: "Coder", // Rollere göre güncellendi
          roles: ["coder"], // 🆕 Çoklu roller
          maxTokens: 4096,
          temperature: 0.5,
          isActive: true
        },
        {
          id: "chat",
          name: "qwen2.5-3b-instruct",
          displayName: "Qwen2.5 3B",
          description: "Hızlı sohbet ve basit görevler",
          specialty: "Chat", // Rollere göre güncellendi
          roles: ["chat"], // 🆕 Çoklu roller
          maxTokens: 8192, // 🔥 2048'den 8192'ye çıkarıldı - kod yazarken yeterli olsun
          temperature: 0.7,
          isActive: true
        }
      ],
      isActive: true,
      icon: "🖥️",
      description: "Yerel LM Studio sunucusu"
    }
  ];
}

// AI Provider'ları kaydet
export function saveAIProviders(providers: AIProvider[]): void {
  localStorage.setItem('corex-ai-providers', JSON.stringify(providers));
}

// Aktif modeli bul
export function findActiveModel(modelId: string): { provider: AIProvider; model: AIModel } | null {
  const providers = loadAIProviders();
  
  for (const provider of providers) {
    if (!provider.isActive) continue;
    
    const model = provider.models.find(m => m.id === modelId && m.isActive);
    if (model) {
      return { provider, model };
    }
  }
  
  return null;
}

// Dinamik AI çağrısı - provider ayarlarını kullanarak
// 🆕 Mesajdan resimleri parse et
function parseImagesFromMessage(message: string): { cleanMessage: string; images: string[] } {
  const imageRegex = /\[IMAGES:(\d+)\]\n((?:\[IMAGE_\d+\]:data:image\/[^;]+;base64,[^\n]+\n)+)/;
  const match = message.match(imageRegex);
  
  if (!match) {
    return { cleanMessage: message, images: [] };
  }
  
  const imageCount = parseInt(match[1]);
  const imagesBlock = match[2];
  const images: string[] = [];
  
  // Her bir resmi parse et
  const imageLines = imagesBlock.split('\n').filter(line => line.startsWith('[IMAGE_'));
  for (const line of imageLines) {
    const imageMatch = line.match(/\[IMAGE_\d+\]:(data:image\/[^;]+;base64,.+)/);
    if (imageMatch) {
      images.push(imageMatch[1]);
    }
  }
  
  // Mesajdan resim bloğunu çıkar
  const cleanMessage = message.replace(imageRegex, '').trim();
  
  console.log('📷 Parse edildi:', { imageCount, foundImages: images.length, cleanMessageLength: cleanMessage.length });
  
  return { cleanMessage, images };
}

// 🆕 Conversation history desteği eklendi
export async function callAI(
  message: string, 
  modelId: string, 
  conversationHistory?: Array<{ role: string; content: string }>,
  onStreamToken?: (text: string) => void // 🆕 Streaming callback
): Promise<string> {
  // 🆕 Mesajdan resimleri parse et
  const { cleanMessage, images } = parseImagesFromMessage(message);
  
  if (images.length > 0) {
    console.log('📷 Vision mode aktif:', images.length, 'resim bulundu');
  }
  
  // 🔧 Model ID yoksa veya "default" ise, aktif bir model seç
  let actualModelId = modelId;
  if (!modelId || modelId === 'default') {
    console.log('⚠️ Model ID belirtilmemiş, aktif model aranıyor...');
    const providers = loadAIProviders();
    
    // İlk aktif provider'ın ilk aktif modelini bul
    for (const provider of providers) {
      if (!provider.isActive) continue;
      
      const activeModel = provider.models.find(m => m.isActive);
      if (activeModel) {
        actualModelId = activeModel.id;
        console.log(`✅ Aktif model bulundu: ${activeModel.displayName} (${actualModelId})`);
        break;
      }
    }
    
    // Hala model bulunamadıysa hata ver
    if (!actualModelId || actualModelId === 'default') {
      throw new Error('Aktif AI modeli bulunamadı. Lütfen AI ayarlarından bir model aktif edin.');
    }
  }
  
  const result = findActiveModel(actualModelId);
  
  if (!result) {
    throw new Error(`Model bulunamadı: ${actualModelId}`);
  }
  
  const { provider, model } = result;
  
  console.log('🤖 AI çağrısı yapılıyor:', {
    modelId,
    provider: provider.name,
    model: model.displayName,
    baseUrl: provider.baseUrl,
    historyLength: conversationHistory?.length || 0
  });
  
  // 🆕 GGUF provider kontrolü - baseUrl kontrolü yerine provider ID kontrolü
  console.log('🔍 Provider kontrolü:', { id: provider.id, baseUrl: provider.baseUrl, name: provider.name });
  
  if (provider.id === "gguf-direct" || provider.baseUrl === "internal://gguf") {
    console.log('📦 GGUF provider tespit edildi, direkt GGUF çağrısı yapılıyor...');
    
    // GGUF modeli için özel işlem
    const { chatWithGgufModel, getGgufModelStatus } = await import('./ggufProvider');
    
    // GGUF model config'i localStorage'dan al
    const ggufConfig = localStorage.getItem('gguf-active-model');
    if (!ggufConfig) {
      throw new Error('❌ GGUF model yapılandırması bulunamadı. Lütfen GGUF Model Tarayıcı\'dan bir model seçin ve "Ayarları Uygula ve Kullan" butonuna basın.');
    }
    
    const config = JSON.parse(ggufConfig);
    console.log('📋 GGUF Config:', config);
    
    // Model durumunu kontrol et
    const status = await getGgufModelStatus();
    console.log('📊 GGUF Model Status:', status);
    
    // Model yüklü değilse hata ver (model yükleme işlemi applyModelConfig'de yapılmalı)
    if (!status.loaded || status.model_path !== config.modelPath) {
      throw new Error('❌ GGUF model GPU\'ya yüklenmemiş. Lütfen GGUF Model Tarayıcı\'dan "Ayarları Uygula ve Kullan" butonuna basarak modeli yükleyin.');
    }
    
    console.log('✅ Model yüklü, chat yapılıyor...');
    
    // Model adından chat template'i belirle
    const modelName = config.modelName?.toLowerCase() || '';
    console.log('🔍 Model adı:', modelName);
    
    // 🔥 Context length'i GGUF config'den al (Model Browser'dan ayarlanan değer)
    let contextLength = config.contextLength || model.maxTokens || 2048;
    
    // 🔥 CRITICAL FIX: Context length çok küçükse otomatik artır
    // Kod yazarken minimum 4096 context gerekli
    if (contextLength < 4096) {
      console.warn(`⚠️ Context length çok küçük (${contextLength}), 4096'ya yükseltiliyor...`);
      contextLength = 4096;
    }
    
    console.log('📏 Context length (GGUF config):', contextLength);
    console.log('🔍 Config details:', {
      configContextLength: config.contextLength,
      modelMaxTokens: model.maxTokens,
      finalContextLength: contextLength
    });
    
    let fullPrompt = '';
    
    // Conversation history'yi hazırla (son 4 mesaj)
    const filteredHistory = conversationHistory
      ? conversationHistory.filter(msg => msg.role !== 'system').slice(-4)
      : [];
    
    // Model tipine göre chat template seç
    if (modelName.includes('qwen')) {
      // Qwen2.5 ChatML format: <|im_start|>role\ncontent<|im_end|>
      console.log('📝 Qwen chat template kullanılıyor');
      
      // System prompt
      fullPrompt += '<|im_start|>system\nYou are a helpful AI assistant. Respond in Turkish.<|im_end|>\n';
      
      // History
      for (const msg of filteredHistory) {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        fullPrompt += `<|im_start|>${role}\n${msg.content}<|im_end|>\n`;
      }
      
      // Current message
      fullPrompt += `<|im_start|>user\n${cleanMessage}<|im_end|>\n<|im_start|>assistant\n`;
      
    } else if (modelName.includes('llama') && modelName.includes('3')) {
      // Llama 3 format
      console.log('📝 Llama 3 chat template kullanılıyor');
      
      fullPrompt += '<|begin_of_text|>';
      
      // System prompt
      fullPrompt += '<|start_header_id|>system<|end_header_id|>\n\nYou are a helpful AI assistant. Respond in Turkish.<|eot_id|>';
      
      // History
      for (const msg of filteredHistory) {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        fullPrompt += `<|start_header_id|>${role}<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
      }
      
      // Current message
      fullPrompt += `<|start_header_id|>user<|end_header_id|>\n\n${cleanMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
      
    } else if (modelName.includes('mistral') || modelName.includes('mixtral')) {
      // Mistral format: [INST] ... [/INST]
      console.log('📝 Mistral chat template kullanılıyor');
      
      // Mistral doesn't use system prompt in the same way
      let conversationText = '';
      
      // History
      for (const msg of filteredHistory) {
        if (msg.role === 'user') {
          conversationText += `[INST] ${msg.content} [/INST] `;
        } else {
          conversationText += `${msg.content} `;
        }
      }
      
      // Current message
      conversationText += `[INST] ${message} [/INST]`;
      
      fullPrompt = conversationText;
      
    } else if (modelName.includes('gemma')) {
      // Gemma format
      console.log('📝 Gemma chat template kullanılıyor');
      
      fullPrompt += '<start_of_turn>user\n';
      
      // History
      for (const msg of filteredHistory) {
        const role = msg.role === 'user' ? 'user' : 'model';
        fullPrompt += `<start_of_turn>${role}\n${msg.content}<end_of_turn>\n`;
      }
      
      // Current message
      fullPrompt += `<start_of_turn>user\n${cleanMessage}<end_of_turn>\n<start_of_turn>model\n`;
      
    } else if (modelName.includes('phi')) {
      // Phi format
      console.log('📝 Phi chat template kullanılıyor');
      
      // System prompt
      fullPrompt += '<|system|>\nYou are a helpful AI assistant. Respond in Turkish.<|end|>\n';
      
      // History
      for (const msg of filteredHistory) {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        fullPrompt += `<|${role}|>\n${msg.content}<|end|>\n`;
      }
      
      // Current message
      fullPrompt += `<|user|>\n${cleanMessage}<|end|>\n<|assistant|>\n`;
      
    } else {
      // Generic/Unknown model - simple format
      console.log('📝 Generic chat template kullanılıyor (bilinmeyen model)');
      
      // System prompt
      fullPrompt += 'You are a helpful AI assistant. Respond in Turkish.\n\n';
      
      // History
      for (const msg of filteredHistory) {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        fullPrompt += `${role}: ${msg.content}\n\n`;
      }
      
      // Current message
      fullPrompt += `User: ${cleanMessage}\n\nAssistant:`;
    }
    
    console.log('🔵 GGUF chat başlatılıyor, prompt uzunluğu:', fullPrompt.length);
    console.log('📝 Prompt preview:', fullPrompt.substring(0, 300));
    
    // Chat yap - maxTokens generation için (üretilecek token sayısı)
    // Context length zaten model yüklenirken ayarlandı
    // 🔥 FIXED: Minimum 2048 token garanti et, kod yazarken yeterli olsun
    const generationMaxTokens = Math.max(Math.min(contextLength / 2, 8192), 2048); // Min 2048, max 8192
    console.log('🎯 Generation max tokens:', generationMaxTokens, '(context:', contextLength, ')');
    console.log('🔍 Calculation:', {
      contextLength,
      contextHalf: contextLength / 2,
      minWithMax: Math.min(contextLength / 2, 8192),
      finalWithMin: Math.max(Math.min(contextLength / 2, 8192), 2048)
    });
    
    // 🆕 Streaming desteği
    if (onStreamToken) {
      const { chatWithChunkedStreaming } = await import('./streamingProvider');
      const response = await chatWithChunkedStreaming(
        fullPrompt,
        generationMaxTokens,
        model.temperature || 0.7,
        {
          onToken: onStreamToken,
          onComplete: (text) => console.log('✅ Streaming tamamlandı:', text.length, 'karakter')
        }
      );
      return response;
    }
    
    // Normal (non-streaming) mode
    const response = await chatWithGgufModel(
      fullPrompt,
      generationMaxTokens, // Üretilecek token sayısı
      model.temperature || 0.7
    );
    
    console.log('✅ GGUF response alındı, uzunluk:', response.length);
    return response;
  }
  
  // Normal provider (LM Studio, Ollama, vb.)
  // Timeout ile AI çağrısı (60 saniye - daha uzun cevaplar için)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('AI isteği zaman aşımına uğradı (60 saniye)')), 60000);
  });

  // Temperature'ı biraz artır (daha yaratıcı ve eksiksiz cevaplar için)
  const adjustedTemperature = model.temperature ? Math.min(model.temperature + 0.1, 0.9) : 0.7;
  
  // Max tokens'ı artır (daha uzun cevaplar için)
  const adjustedMaxTokens = model.maxTokens ? Math.max(model.maxTokens, 8192) : 8192;

  const aiPromise = invoke<string>("chat_with_dynamic_ai", {
    message,
    conversationHistory: conversationHistory || [],
    providerConfig: {
      base_url: provider.baseUrl,
      host: provider.host || null,
      port: provider.port || null,
      api_key: provider.apiKey || null,
      model_name: model.name,
      temperature: adjustedTemperature,
      max_tokens: adjustedMaxTokens
    }
  });

  return await Promise.race([aiPromise, timeoutPromise]);
}

// Provider bağlantısını test et
export async function testProviderConnection(provider: AIProvider): Promise<boolean> {
  try {
    // 🆕 GGUF provider için özel test
    if (provider.id === "gguf-direct" || provider.baseUrl === "internal://gguf") {
      console.log('🧪 GGUF provider test ediliyor...');
      
      // GGUF model status kontrolü
      const { getGgufModelStatus } = await import('./ggufProvider');
      const status = await getGgufModelStatus();
      
      console.log('📊 GGUF Status:', status);
      
      // Model yüklüyse başarılı
      if (status.loaded) {
        console.log('✅ GGUF Test Sonucu: Model yüklü - BAŞARILI');
        return true;
      }
      
      // Model yüklü değilse ama config varsa uyarı ver
      const hasConfig = localStorage.getItem('gguf-active-model') !== null;
      if (hasConfig) {
        console.log('⚠️ GGUF Test Sonucu: Config var ama model yüklü değil');
        return false;
      }
      
      console.log('❌ GGUF Test Sonucu: Model yapılandırılmamış');
      return false;
    }
    
    // Normal provider test (HTTP)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }
    
    // Timeout ile fetch (5 saniye)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${provider.baseUrl}/models`, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return response.ok;
  } catch (error) {
    console.error('Provider bağlantı testi hatası:', error);
    return false;
  }
}

// Mevcut modelleri listele (API'den)
export async function fetchAvailableModels(provider: AIProvider): Promise<string[]> {
  try {
    // 🆕 GGUF provider için özel liste
    if (provider.baseUrl === "internal://gguf") {
      console.log('📦 GGUF provider için model listesi alınıyor...');
      
      // localStorage'dan aktif GGUF modelini al
      const ggufConfig = localStorage.getItem('gguf-active-model');
      if (ggufConfig) {
        const config = JSON.parse(ggufConfig);
        console.log('✅ GGUF Model bulundu:', config.modelName);
        return [config.modelName || 'GGUF Model'];
      }
      
      console.log('⚠️ GGUF model yapılandırılmamış');
      return [];
    }
    
    // Normal provider (HTTP)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }
    
    console.log('🔍 Model listesi alınıyor:', provider.baseUrl);
    
    // Timeout ile fetch (10 saniye)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${provider.baseUrl}/models`, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API hatası:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('📥 API Response:', data);
    
    // OpenAI format
    if (data.data && Array.isArray(data.data)) {
      const models = data.data.map((model: any) => model.id || model.name).filter(Boolean);
      console.log('✅ Bulunan modeller:', models);
      return models;
    }
    
    // LM Studio format (bazen direkt array döner)
    if (Array.isArray(data)) {
      const models = data.map((model: any) => model.id || model.name || model).filter(Boolean);
      console.log('✅ Bulunan modeller (array):', models);
      return models;
    }
    
    // Ollama format
    if (data.models && Array.isArray(data.models)) {
      const models = data.models.map((model: any) => model.name || model.id).filter(Boolean);
      console.log('✅ Bulunan modeller (ollama):', models);
      return models;
    }
    
    console.warn('⚠️ Beklenmeyen API response formatı:', data);
    return [];
  } catch (error) {
    console.error('❌ Model listesi alınamadı:', error);
    throw error; // Hatayı yukarı fırlat ki kullanıcı görebilsin
  }
}