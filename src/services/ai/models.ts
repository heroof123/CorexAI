export function getModelIdForRole(): string {
    // Aktif provider'lardan uygun modeli bul
    const savedProviders = localStorage.getItem('corex-ai-providers');
    if (!savedProviders) {
        console.warn('⚠️ Provider bulunamadı');
        return "default"; // Fallback instead of crash
    }

    try {
        const providers = JSON.parse(savedProviders);
        console.log('🔍 Provider sayısı:', providers.length);

        // 🔥 ÖNCE GGUF provider'ı kontrol et - isActive durumuna bakmadan
        const ggufProvider = providers.find((p: any) => p.id === 'gguf-direct');
        if (ggufProvider && ggufProvider.models && ggufProvider.models.length > 0) {
            console.log('🎮 GGUF provider bulundu, model kontrolü yapılıyor...');

            // GGUF provider'da aktif model ara
            for (const model of ggufProvider.models) {
                console.log(`  🔍 GGUF Model: ${model.displayName}, isActive: ${model.isActive}`);
                if (model.isActive) {
                    console.log(`🎯 GGUF aktif model bulundu: ${model.displayName} (${model.id})`);

                    // 🔥 GGUF provider'ı aktif yap ve kaydet
                    if (!ggufProvider.isActive) {
                        console.log('⚠️ GGUF provider pasifti, aktif ediliyor...');
                        ggufProvider.isActive = true;
                        localStorage.setItem('corex-ai-providers', JSON.stringify(providers));
                    }

                    return model.id;
                }
            }
        }

        // GGUF'ta aktif model yoksa, diğer provider'ları kontrol et
        console.log('🔍 Diger providerlar kontrol ediliyor...');
        for (const provider of providers) {
            console.log(`🔍 Provider kontrol: ${provider.id}, isActive: ${provider.isActive}, models: ${provider.models?.length || 0}`);

            if (!provider.isActive) {
                console.log(`⏭️ Provider pasif, atlanıyor: ${provider.id}`);
                continue;
            }

            if (!provider.models || provider.models.length === 0) {
                console.log(`⏭️ Provider'da model yok: ${provider.id}`);
                continue;
            }

            for (const model of provider.models) {
                console.log(`  🔍 Model kontrol: ${model.displayName}, isActive: ${model.isActive}`);
                if (model.isActive) {
                    console.log(`🎯 Aktif model bulundu: ${model.displayName} (${model.id})`);
                    return model.id;
                }
            }
        }

        // Hiç aktif model bulunamadıysa, detaylı bilgi ver
        console.error('❌ Hiç aktif model bulunamadı!');
        console.error('📊 Provider durumları:', providers.map((p: any) => ({
            id: p.id,
            isActive: p.isActive,
            modelCount: p.models?.length || 0,
            activeModels: p.models?.filter((m: any) => m.isActive).length || 0
        })));

    } catch (error) {
        console.error('❌ Model ID çevirme hatası:', error);
    }

    console.warn('⚠️ Hiç aktif model bulunamadı');
    throw new Error('Aktif AI modeli bulunamadı. Lütfen AI ayarlarından bir model aktif edin.');
}
