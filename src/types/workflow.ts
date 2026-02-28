// types/workflow.ts
import { CodeAction } from "./index";

export type Plan = {
  goal: string;              // Değişmez hedef
  successCriteria: string[]; // Test kriterleri
  affectedFiles: string[];   // Değişecek dosyalar
  approach: string;          // Nasıl yapılacak
  status: 'pending' | 'approved' | 'rejected';
  version: number;           // Plan revizyonu
  goalHash?: string;         // Hedef değişikliğini tespit için
};

export type Implementation = {
  changes: CodeAction[];     // Yapılan değişiklikler
  status: 'working' | 'completed';
  timestamp: number;
};

export type TestResult = {
  passed: boolean;
  errors: string[];          // Sadece faktler, öneri yok
  logs: string[];
  timestamp: number;
};

export type WorkflowPhase = 
  | 'idle'
  | 'planning' 
  | 'awaiting_approval' 
  | 'coding' 
  | 'testing' 
  | 'completed' 
  | 'failed';

export type WorkflowState = {
  // Kullanıcı isteği
  userRequest: string;
  
  // PLANNER çıktısı
  plan: Plan | null;
  
  // CODER çıktısı
  implementation: Implementation | null;
  
  // TESTER çıktısı
  testResult: TestResult | null;
  
  // Workflow durumu
  currentPhase: WorkflowPhase;
  iterationCount: number;      // Sonsuz döngü kontrolü
  maxIterations: number;       // Max 3 deneme
  
  // Metadata
  startTime: number;
  endTime?: number;
};

export type WorkflowNotification = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: number;
};
