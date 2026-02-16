// core/planning/tasks.ts
// Task type definitions

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

export type TaskType = 
  | 'file-create'
  | 'file-modify'
  | 'file-delete'
  | 'command-run'
  | 'ai-query'
  | 'validation'
  | 'custom';

export interface TaskMetadata {
  estimatedDuration?: number; // in milliseconds
  priority?: 'low' | 'medium' | 'high';
  dependencies?: string[]; // Task IDs this task depends on
  tags?: string[];
  retryable?: boolean;
  maxRetries?: number;
}

export interface TaskResult {
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
  timestamp: number;
}

export interface Task {
  id: string;
  type: TaskType;
  description: string;
  status: TaskStatus;
  metadata: TaskMetadata;
  result?: TaskResult;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

// Specific task types

export interface FileCreateTask extends Task {
  type: 'file-create';
  filePath: string;
  content: string;
}

export interface FileModifyTask extends Task {
  type: 'file-modify';
  filePath: string;
  changes: Array<{
    type: 'insert' | 'delete' | 'replace';
    line?: number;
    content: string;
  }>;
}

export interface FileDeleteTask extends Task {
  type: 'file-delete';
  filePath: string;
}

export interface CommandRunTask extends Task {
  type: 'command-run';
  command: string;
  args?: string[];
  cwd?: string;
}

export interface AIQueryTask extends Task {
  type: 'ai-query';
  query: string;
  context?: string[];
}

export interface ValidationTask extends Task {
  type: 'validation';
  validationType: 'syntax' | 'lint' | 'test' | 'build';
  target: string;
}

export type AnyTask = 
  | FileCreateTask
  | FileModifyTask
  | FileDeleteTask
  | CommandRunTask
  | AIQueryTask
  | ValidationTask
  | Task;

// Task factory functions

export function createFileCreateTask(
  filePath: string,
  content: string,
  metadata?: Partial<TaskMetadata>
): FileCreateTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: 'file-create',
    description: `Create file: ${filePath}`,
    status: 'pending',
    filePath,
    content,
    metadata: {
      priority: 'medium',
      retryable: true,
      maxRetries: 3,
      ...metadata,
    },
    createdAt: Date.now(),
  };
}

export function createFileModifyTask(
  filePath: string,
  changes: FileModifyTask['changes'],
  metadata?: Partial<TaskMetadata>
): FileModifyTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: 'file-modify',
    description: `Modify file: ${filePath}`,
    status: 'pending',
    filePath,
    changes,
    metadata: {
      priority: 'medium',
      retryable: true,
      maxRetries: 3,
      ...metadata,
    },
    createdAt: Date.now(),
  };
}

export function createCommandRunTask(
  command: string,
  args?: string[],
  metadata?: Partial<TaskMetadata>
): CommandRunTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: 'command-run',
    description: `Run command: ${command}`,
    status: 'pending',
    command,
    args,
    metadata: {
      priority: 'medium',
      retryable: false,
      ...metadata,
    },
    createdAt: Date.now(),
  };
}

export function createAIQueryTask(
  query: string,
  context?: string[],
  metadata?: Partial<TaskMetadata>
): AIQueryTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: 'ai-query',
    description: `AI Query: ${query.substring(0, 50)}...`,
    status: 'pending',
    query,
    context,
    metadata: {
      priority: 'high',
      retryable: true,
      maxRetries: 2,
      ...metadata,
    },
    createdAt: Date.now(),
  };
}
