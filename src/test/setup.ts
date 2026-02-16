import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Tauri API
global.window = Object.create(window);
const mockTauri = {
  invoke: vi.fn(),
  event: {
    listen: vi.fn(),
    emit: vi.fn()
  }
};

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockTauri.invoke
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as any;

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};
global.indexedDB = indexedDBMock as any;
