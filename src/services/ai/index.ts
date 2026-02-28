import { sendToAI, compareModels } from './core';
import {
  buildContext,
  getConversationContext,
  setUserPreferences,
  updateProjectContext,
  resetConversation
} from './context';
import {
  generateSmartCode,
  generateTests,
  fixBugs,
  generateDocumentation,
  suggestRefactoring
} from './codeActions';
import {
  explainCode,
  suggestImprovements,
  performCodeReview
} from './codeAnalysis';
import {
  scanSecurity,
  analyzePackages,
  analyzeEnvironment
} from './scanners';
import {
  generateDocumentationForPanel,
  generateTestsForPanel,
  suggestRefactoringForPanel
} from './adapters';
import {
  getModelIdForRole
} from './models';
import {
  CodeAction,
  AIResponse
} from './types';
import {
  callAI,
  loadAIProviders,
  saveAIProviders,
  testProviderConnection,
  fetchAvailableModels,
  type AIProvider,
  type AIModel
} from './aiProvider';
import { ragService } from './ragService';

import {
  parseToolCalls,
  executeTool,
  getToolsPrompt,
  type Tool
} from './aiTools';
import {
  requiresApproval,
  getAutonomyConfig,
  saveAutonomyConfig,
  getAutonomyLevelDescription,
  type AutonomyConfig,
  type AutonomyLevel
} from './autonomy';

import {
  loadGgufModel,
  unloadGgufModel,
  chatWithGgufModel,
  getGgufModelStatus,
  getGpuMemoryInfo,
  type GgufModelConfig,
  type GgufModelStatus
} from './ggufProvider';

export {
  sendToAI,
  compareModels,

  // Tools
  parseToolCalls,
  executeTool,
  getToolsPrompt,
  type Tool,

  // GGUF
  loadGgufModel,
  unloadGgufModel,
  chatWithGgufModel,
  getGgufModelStatus,
  getGpuMemoryInfo,
  type GgufModelConfig,
  type GgufModelStatus,

  // Autonomy
  requiresApproval,
  getAutonomyConfig,
  saveAutonomyConfig,
  getAutonomyLevelDescription,
  type AutonomyConfig,
  type AutonomyLevel,

  // RAG
  ragService,

  // Provider functions
  callAI,
  loadAIProviders,
  saveAIProviders,
  testProviderConnection,
  fetchAvailableModels,
  type AIProvider,
  type AIModel,

  // Context & Types
  type CodeAction,
  type AIResponse,
  buildContext,
  getConversationContext,
  setUserPreferences,
  updateProjectContext,
  resetConversation,
  getModelIdForRole,

  // Code Generation
  generateSmartCode,
  generateTests,
  fixBugs,
  generateDocumentation,
  suggestRefactoring,

  // Code Analysis
  explainCode,
  suggestImprovements,
  performCodeReview,

  // Scanners
  scanSecurity,
  analyzePackages,
  analyzeEnvironment,

  // Panel Adapters
  generateDocumentationForPanel,
  generateTestsForPanel,
  suggestRefactoringForPanel
};
