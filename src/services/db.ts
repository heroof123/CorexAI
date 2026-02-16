// services/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ProjectIndex, FileIndex } from '../types';

interface CursorDB extends DBSchema {
  projects: {
    key: string;
    value: ProjectIndex;
  };
  conversations: {
    key: string;
    value: {
      projectPath: string;
      messages: any[];
      lastUpdated: number;
    };
  };
}

let db: IDBPDatabase<CursorDB> | null = null;

export async function initDB() {
  if (db) return db;
  
  db = await openDB<CursorDB>('local-ai-ide-db', 1, {
    upgrade(db) {
      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'projectPath' });
      }
      
      // Conversations store
      if (!db.objectStoreNames.contains('conversations')) {
        db.createObjectStore('conversations', { keyPath: 'projectPath' });
      }
    },
  });
  
  console.log('💾 IndexedDB initialized');
  return db;
}

// ========== PROJECT INDEX OPERATIONS ==========

export async function saveProjectIndex(index: ProjectIndex): Promise<void> {
  const database = await initDB();
  await database.put('projects', index);
  console.log('✅ Index saved:', index.projectPath, '•', index.files.length, 'files');
}

export async function getProjectIndex(projectPath: string): Promise<ProjectIndex | null> {
  const database = await initDB();
  const result = await database.get('projects', projectPath);
  
  if (result) {
    console.log('📦 Index loaded from cache:', projectPath, '•', result.files.length, 'files');
  }
  
  return result || null;
}

export async function deleteProjectIndex(projectPath: string): Promise<void> {
  const database = await initDB();
  await database.delete('projects', projectPath);
  console.log('🗑️ Index deleted:', projectPath);
}

export async function getAllProjects(): Promise<ProjectIndex[]> {
  const database = await initDB();
  return await database.getAll('projects');
}

// ========== FILE INDEX OPERATIONS ==========

export async function updateFileInIndex(
  projectPath: string,
  filePath: string,
  fileData: FileIndex
): Promise<void> {
  const database = await initDB();
  const index = await database.get('projects', projectPath);
  
  if (!index) {
    console.warn('⚠️ Project index not found:', projectPath);
    return;
  }
  
  const fileIndex = index.files.findIndex(f => f.path === filePath);
  
  if (fileIndex !== -1) {
    index.files[fileIndex] = fileData;
  } else {
    index.files.push(fileData);
  }
  
  index.lastIndexed = Date.now();
  await database.put('projects', index);
  
  console.log('✅ File updated in index:', filePath);
}

export async function removeFileFromIndex(
  projectPath: string,
  filePath: string
): Promise<void> {
  const database = await initDB();
  const index = await database.get('projects', projectPath);
  
  if (!index) return;
  
  index.files = index.files.filter(f => f.path !== filePath);
  index.lastIndexed = Date.now();
  await database.put('projects', index);
  
  console.log('🗑️ File removed from index:', filePath);
}

// ========== CONVERSATION OPERATIONS ==========

export async function saveConversation(
  projectPath: string,
  messages: any[]
): Promise<void> {
  const database = await initDB();
  await database.put('conversations', {
    projectPath,
    messages,
    lastUpdated: Date.now(),
  });
}

export async function getConversation(projectPath: string): Promise<any[] | null> {
  const database = await initDB();
  const result = await database.get('conversations', projectPath);
  
  if (result) {
    console.log('💬 Conversation loaded:', result.messages.length, 'messages');
  }
  
  return result?.messages || null;
}

export async function deleteConversation(projectPath: string): Promise<void> {
  const database = await initDB();
  await database.delete('conversations', projectPath);
  console.log('🗑️ Conversation deleted:', projectPath);
}

// ========== UTILITY ==========

export async function clearAllData(): Promise<void> {
  const database = await initDB();
  await database.clear('projects');
  await database.clear('conversations');
  console.log('🗑️ All cache cleared');
}

export async function getStorageSize(): Promise<{ projects: number; conversations: number }> {
  const database = await initDB();
  const projects = await database.getAll('projects');
  const conversations = await database.getAll('conversations');
  
  // Rough size estimation
  const projectsSize = JSON.stringify(projects).length;
  const conversationsSize = JSON.stringify(conversations).length;
  
  return {
    projects: projectsSize,
    conversations: conversationsSize,
  };
}