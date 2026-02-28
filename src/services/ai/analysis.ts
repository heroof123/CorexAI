import { getModelIdForRole } from './models';
export async function generateSummary(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
        console.log('📝 Konuşma özeti oluşturuluyor...');

        // Son 10 mesajı al (system prompt hariç)
        const recentMessages = messages.slice(-10).filter(m => m.role !== 'system');

        if (recentMessages.length === 0) {
            return '';
        }

        // Özet prompt'u oluştur
        const summaryPrompt = `Aşağıdaki konuşmayı kısa ve öz bir şekilde özetle. Sadece önemli noktaları ve yapılan işlemleri belirt. Maksimum 5 cümle kullan.

Konuşma:
${recentMessages.map(m => `${m.role === 'user' ? 'Kullanıcı' : 'AI'}: ${m.content.substring(0, 500)}`).join('\n\n')}

Özet (Türkçe, maksimum 5 cümle):`;

        // AI'dan özet iste
        const { callAI } = await import('./aiProvider');
        const modelId = getModelIdForRole();

        const summary = await callAI(summaryPrompt, modelId, [
            { role: 'user', content: summaryPrompt }
        ]);

        console.log('✅ Özet oluşturuldu:', summary.substring(0, 100) + '...');
        return summary.trim();

    } catch (error) {
        console.error('❌ Özet oluşturma hatası:', error);
        return ''; // Hata durumunda boş özet döndür
    }
}

export function analyzeUserIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('oluştur') || lowerMessage.includes('yarat') || lowerMessage.includes('yap') ||
        lowerMessage.includes('create') || lowerMessage.includes('generate')) {
        return 'create';
    } else if (lowerMessage.includes('düzenle') || lowerMessage.includes('değiştir') || lowerMessage.includes('güncelle') ||
        lowerMessage.includes('edit') || lowerMessage.includes('modify') || lowerMessage.includes('update')) {
        return 'edit';
    } else if (lowerMessage.includes('açıkla') || lowerMessage.includes('anlat') || lowerMessage.includes('nedir') ||
        lowerMessage.includes('explain') || lowerMessage.includes('what is') || lowerMessage.includes('how') ||
        lowerMessage.includes('yardım') || lowerMessage.includes('nasıl') || lowerMessage.includes('göster') ||
        lowerMessage.includes('fikir') || lowerMessage.includes('öneri')) {
        return 'explain';
    } else if (lowerMessage.includes('bul') || lowerMessage.includes('ara') || lowerMessage.includes('search') ||
        lowerMessage.includes('find')) {
        return 'search';
    } else if (lowerMessage.includes('hata') || lowerMessage.includes('bug') || lowerMessage.includes('düzelt') ||
        lowerMessage.includes('fix') || lowerMessage.includes('problem')) {
        return 'debug';
    } else if (lowerMessage.includes('optimize') || lowerMessage.includes('iyileştir') || lowerMessage.includes('geliştir') ||
        lowerMessage.includes('improve') || lowerMessage.includes('enhance')) {
        return 'optimize';
    } else if (lowerMessage.includes('test') || lowerMessage.includes('kontrol') || lowerMessage.includes('check')) {
        return 'test';
    }

    return 'chat';
}
