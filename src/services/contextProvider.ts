// services/contextProvider.ts
// Context sağlayıcı - Hangi dosyaların AI'ya gönderileceğini belirler

import { FileIndex } from "../types/index";
import { cosineSimilarity } from "./embedding";
// import { smartContextBuilder } from './smartContextBuilder'; // Gelecekte kullanılacak
// import { dependencyAnalyzer } from './dependencyAnalyzer'; // Gelecekte kullanılacak

// Proje için önemli dosyaları belirle
export function getImportantFiles(fileIndex: Array<{ path: string; content: string; [key: string]: any }>): Array<{ path: string; content: string; [key: string]: any }> {
  const importantPatterns = [
    /package\.json$/,
    /package-lock\.json$/,
    /tsconfig\.json$/,
    /README\.md$/i,
    /vite\.config\.(ts|js)$/,
    /tailwind\.config\.(ts|js)$/,
    /postcss\.config\.(ts|js)$/,
    /Cargo\.toml$/,
    /Cargo\.lock$/,
    /\.gitignore$/,
    /tauri\.conf\.json$/
  ];
  
  return fileIndex.filter(file => 
    importantPatterns.some(pattern => pattern.test(file.path))
  );
}

// Proje yapısını gösteren ana dosyaları belirle
export function getProjectStructureFiles(fileIndex: Array<{ path: string; content: string; [key: string]: any }>): Array<{ path: string; content: string; [key: string]: any }> {
  const structurePatterns = [
    /src\/index\.(ts|tsx|js|jsx)$/,
    /src\/App\.(ts|tsx|js|jsx)$/,
    /src\/main\.(ts|tsx|js|jsx)$/,
    /src\/types\/index\.ts$/,
    /src\/services\/.*\.ts$/,
    /src-tauri\/src\/main\.rs$/,
    /src-tauri\/src\/lib\.rs$/
  ];
  
  return fileIndex.filter(file =>
    structurePatterns.some(pattern => pattern.test(file.path))
  );
}

// Hybrid search - Embedding + Keyword + File name
export function hybridSearch(
  query: string,
  fileIndex: FileIndex[],
  queryEmbedding: number[],
  topK: number = 5
): Array<{ path: string; content: string; score: number }> {
  
  const results = fileIndex.map(file => {
    // 1. Embedding similarity (0-1)
    const embeddingScore = cosineSimilarity(queryEmbedding, file.embedding);
    
    // 2. Keyword match (0-1)
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const fileText = (file.path + ' ' + file.content).toLowerCase();
    const matchedWords = queryWords.filter(word => fileText.includes(word));
    const keywordScore = queryWords.length > 0 ? matchedWords.length / queryWords.length : 0;
    
    // 3. File name match (0-1)
    const fileName = file.path.split(/[\\/]/).pop()?.toLowerCase() || '';
    const fileNameScore = queryWords.some(word => fileName.includes(word)) ? 0.5 : 0;
    
    // Weighted combination
    const finalScore = 
      embeddingScore * 0.6 +  // Embedding en önemli
      keywordScore * 0.3 +     // Keyword ikinci
      fileNameScore * 0.1;     // Dosya adı bonus
    
    return {
      path: file.path,
      content: file.content,
      score: finalScore
    };
  });
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(f => f.score > 0.15); // Threshold biraz düşürüldü
}

// Dosya uzantısından dil belirle
export function getFileExtension(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'rs': 'rust',
    'py': 'python',
    'json': 'json',
    'md': 'markdown',
    'css': 'css',
    'html': 'html',
    'toml': 'toml'
  };
  return langMap[ext || ''] || ext || 'text';
}
