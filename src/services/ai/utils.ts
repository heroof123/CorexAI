export function estimateTokens(text: string): number {
    // Ortalama: 1 token ≈ 4 karakter (İngilizce/Türkçe karışık)
    // Daha doğru: kelime sayısı * 1.3
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 1.3);
}

export function getFileExtension(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
        'ts': 'typescript',
        'tsx': 'typescript',
        'js': 'javascript',
        'jsx': 'javascript',
        'rs': 'rust',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'go': 'go',
        'html': 'html',
        'css': 'css',
        'json': 'json'
    };
    return langMap[ext || ''] || ext || 'text';
}

export function generateDefaultPath(language: string): string {
    const timestamp = Date.now();
    const extensions: { [key: string]: string } = {
        typescript: 'ts',
        javascript: 'js',
        python: 'py',
        rust: 'rs',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        go: 'go',
        html: 'html',
        css: 'css',
        json: 'json'
    };

    const ext = extensions[language] || 'txt';
    return `generated_${timestamp}.${ext}`;
}
