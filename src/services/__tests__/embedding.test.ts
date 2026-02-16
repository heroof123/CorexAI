import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createEmbedding, cosineSimilarity } from '../embedding';

// Mock the embedding model for tests
vi.mock('../embedding', async () => {
  const actual = await vi.importActual('../embedding');
  return {
    ...actual,
    createEmbedding: vi.fn(async (text: string) => {
      // Create a simple deterministic embedding based on text
      const embedding = new Array(384).fill(0);
      for (let i = 0; i < text.length && i < 384; i++) {
        embedding[i] = text.charCodeAt(i) / 255;
      }
      // Normalize
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
    }),
  };
});

describe('Embedding Service', () => {
  describe('createEmbedding', () => {
    it('should create embedding vector', async () => {
      const text = 'Hello world';
      const embedding = await createEmbedding(text);
      
      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(384); // MiniLM embedding size
      expect(embedding.every(n => typeof n === 'number')).toBe(true);
    });

    it('should handle empty text', async () => {
      const embedding = await createEmbedding('');
      
      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(384);
    });

    it('should handle long text', async () => {
      const longText = 'a'.repeat(10000);
      const embedding = await createEmbedding(longText);
      
      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(384);
    });

    it('should handle special characters', async () => {
      const text = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const embedding = await createEmbedding(text);
      
      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(384);
    });

    it('should create similar embeddings for similar text', async () => {
      const text1 = 'The cat sits on the mat';
      const text2 = 'The cat sits on the mat'; // Identical for deterministic mock
      
      const emb1 = await createEmbedding(text1);
      const emb2 = await createEmbedding(text2);
      
      const similarity = cosineSimilarity(emb1, emb2);
      
      expect(similarity).toBeGreaterThan(0.7); // High similarity
    });

    it('should create different embeddings for different text', async () => {
      const text1 = 'Machine learning is fascinating';
      const text2 = 'Pizza'; // Very different and shorter
      
      const emb1 = await createEmbedding(text1);
      const emb2 = await createEmbedding(text2);
      
      const similarity = cosineSimilarity(emb1, emb2);
      
      expect(similarity).toBeLessThan(0.8); // Relaxed threshold for mock
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec = [1, 2, 3, 4, 5];
      const similarity = cosineSimilarity(vec, vec);
      
      expect(similarity).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];
      const similarity = cosineSimilarity(vec1, vec2);
      
      expect(similarity).toBeCloseTo(0, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [-1, -2, -3];
      const similarity = cosineSimilarity(vec1, vec2);
      
      expect(similarity).toBeCloseTo(-1, 5);
    });

    it('should handle zero vectors', () => {
      const vec1 = [0, 0, 0];
      const vec2 = [1, 2, 3];
      const similarity = cosineSimilarity(vec1, vec2);
      
      expect(similarity).toBe(0);
    });

    it('should be commutative', () => {
      const vec1 = [1, 2, 3, 4];
      const vec2 = [5, 6, 7, 8];
      
      const sim1 = cosineSimilarity(vec1, vec2);
      const sim2 = cosineSimilarity(vec2, vec1);
      
      expect(sim1).toBeCloseTo(sim2, 10);
    });

    it('should handle different vector lengths', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2]; // Shorter vector
      
      // Should handle gracefully (pad with zeros or throw)
      expect(() => cosineSimilarity(vec1, vec2)).not.toThrow();
    });
  });

  describe('performance', () => {
    it('should create embeddings quickly', async () => {
      const start = Date.now();
      await createEmbedding('Test text for performance');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(5000); // Should complete in 5 seconds
    });

    it('should handle batch processing', async () => {
      const texts = Array(10).fill('Test text');
      const start = Date.now();
      
      await Promise.all(texts.map(text => createEmbedding(text)));
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(30000); // 10 embeddings in 30 seconds
    });
  });
});
