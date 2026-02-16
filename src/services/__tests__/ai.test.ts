import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildContext, parseAIResponse, sendToAI, resetConversation } from '../ai';

describe('AI Service', () => {
  beforeEach(() => {
    resetConversation();
    vi.clearAllMocks();
  });

  describe('buildContext', () => {
    it('should build context with relevant files', async () => {
      const query = 'How do I add a new feature?';
      const relevantFiles = [
        { path: 'src/App.tsx', content: 'import React from "react";', score: 0.9 }
      ];
      
      const context = await buildContext(query, relevantFiles);
      
      expect(context).toContain('App.tsx');
      expect(context).toContain('import React');
    });

    it('should include current file context', async () => {
      const query = 'Fix this bug';
      const relevantFiles: any[] = [];
      const currentFile = { path: 'src/test.ts', content: 'const x = 1;' };
      
      const context = await buildContext(query, relevantFiles, currentFile);
      
      expect(context).toContain('test.ts');
      expect(context).toContain('const x = 1');
    });

    it('should handle empty relevant files', async () => {
      const query = 'General question';
      const relevantFiles: any[] = [];
      
      const context = await buildContext(query, relevantFiles);
      
      expect(context).toContain(query);
      expect(context).toBeTruthy();
    });
  });

  describe('parseAIResponse', () => {
    it('should parse response with code actions', () => {
      const response = `
Here's the solution:

\`\`\`typescript:src/test.ts
const newCode = "hello";
const anotherLine = "world";
\`\`\`

This will fix the issue.
      `;
      
      const parsed = parseAIResponse(response);
      
      expect(parsed.explanation).toContain('solution');
      expect(parsed.actions).toHaveLength(1);
      expect(parsed.actions[0].filePath).toBe('src/test.ts');
      expect(parsed.actions[0].content).toContain('newCode');
    });

    it('should parse response without code actions', () => {
      const response = 'This is just an explanation without code.';
      
      const parsed = parseAIResponse(response);
      
      expect(parsed.explanation).toBe(response);
      expect(parsed.actions).toHaveLength(0);
    });

    it('should handle multiple code blocks', () => {
      const response = `
\`\`\`typescript:src/file1.ts
const a = 1;
const b = 2;
\`\`\`

\`\`\`typescript:src/file2.ts
const c = 3;
const d = 4;
\`\`\`
      `;
      
      const parsed = parseAIResponse(response);
      
      expect(parsed.actions).toHaveLength(2);
      expect(parsed.actions[0].filePath).toBe('src/file1.ts');
      expect(parsed.actions[1].filePath).toBe('src/file2.ts');
    });

    it('should handle malformed code blocks', () => {
      const response = '```typescript\nconst x = 1;\n```';
      
      const parsed = parseAIResponse(response);
      
      expect(parsed.explanation).toBeTruthy();
      expect(parsed.actions).toHaveLength(0);
    });
  });

  describe('sendToAI', () => {
    it('should throw error when no active model', async () => {
      await expect(sendToAI('test message')).rejects.toThrow('Aktif AI modeli bulunamadı');
    });

    it('should handle network errors gracefully', async () => {
      // This would require mocking the fetch API
      // For now, we test that it throws appropriate errors
      await expect(sendToAI('test')).rejects.toThrow();
    });
  });

  describe('resetConversation', () => {
    it('should clear conversation history', () => {
      resetConversation();
      // Conversation should be reset
      expect(() => resetConversation()).not.toThrow();
    });
  });
});
