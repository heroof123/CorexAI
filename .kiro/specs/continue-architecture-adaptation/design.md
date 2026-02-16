# Continue.dev Mimarisi Adaptasyonu - Design Document

## 🎯 Tasarım Özeti

Continue.dev'in core mimarisini CoreX IDE'ye adapte ediyoruz. Hedef: Business logic'i UI'dan ayırmak, message passing sistemi kurmak, ve Tauri ile entegre etmek.

## 🏗️ Mimari Tasarım

### 1. Üç Katmanlı Mimari

```
┌─────────────────────────────────────────────────────────┐
│                         GUI Layer                        │
│  (React Components - Mevcut UI korunur)                 │
│  - ChatPanel, Editor, FileTree, vb.                     │
└────────────────┬────────────────────────────────────────┘
                 │ Messages (Protocol)
                 ↓
┌─────────────────────────────────────────────────────────┐
│                    Extension Layer                       │
│  (Tauri Adapter - Message Router)                       │
│  - IDE Interface Implementation                          │
│  - Message Routing (Core ↔ GUI)                         │
│  - Tauri Event Bridge                                    │
└────────────────┬────────────────────────────────────────┘
                 │ Messages (Protocol)
                 ↓
┌─────────────────────────────────────────────────────────┐
│                      Core Layer                          │
│  (Business Logic - Continue.dev'den adapte)             │
│  - AI Logic & Streaming                                  │
│  - Context Management                                    │
│  - Planning Agent                                        │
│  - Model Management                                      │
└─────────────────────────────────────────────────────────┘
```

### 2. Message Protocol

#### 2.1 Protocol Types

```typescript
// core/protocol/types.ts

// Base message type
export interface Message {
  messageId: string;
  messageType: string;
  timestamp: number;
}

// Message with data
export interface MessageWithData<T> extends Message {
  data: T;
}

// Response message
export interface ResponseMessage<T> extends Message {
  success: boolean;
  data?: T;
  error?: string;
}
```

#### 2.2 Core Messages (Core → Extension)

```typescript
// core/protocol/core.ts

export type CoreMessage =
  | StreamingStartMessage
  | StreamingTokenMessage
  | StreamingCompleteMessage
  | ContextUpdateMessage
  | PlanningProgressMessage
  | ErrorMessage;

export interface StreamingStartMessage extends Message {
  messageType: 'streaming/start';
  data: {
    requestId: string;
    model: string;
  };
}

export interface StreamingTokenMessage extends Message {
  messageType: 'streaming/token';
  data: {
    requestId: string;
    token: string;
    accumulated: string;
  };
}

export interface StreamingCompleteMessage extends Message {
  messageType: 'streaming/complete';
  data: {
    requestId: string;
    fullResponse: string;
    tokensUsed: number;
  };
}

export interface ContextUpdateMessage extends Message {
  messageType: 'context/update';
  data: {
    contextId: string;
    files: string[];
    summary: string;
  };
}

export interface PlanningProgressMessage extends Message {
  messageType: 'planning/progress';
  data: {
    taskId: string;
    currentStep: number;
    totalSteps: number;
    stepDescription: string;
  };
}
```

#### 2.3 GUI Messages (GUI → Extension)

```typescript
// core/protocol/gui.ts

export type GUIMessage =
  | ChatRequestMessage
  | StopGenerationMessage
  | RegenerateMessage
  | ContextRequestMessage
  | PlanTaskMessage;

export interface ChatRequestMessage extends Message {
  messageType: 'chat/request';
  data: {
    requestId: string;
    message: string;
    context?: string[];
    model?: string;
  };
}

export interface StopGenerationMessage extends Message {
  messageType: 'chat/stop';
  data: {
    requestId: string;
  };
}

export interface RegenerateMessage extends Message {
  messageType: 'chat/regenerate';
  data: {
    messageId: string;
  };
}

export interface ContextRequestMessage extends Message {
  messageType: 'context/request';
  data: {
    query: string;
    maxFiles?: number;
  };
}

export interface PlanTaskMessage extends Message {
  messageType: 'planning/request';
  data: {
    taskId: string;
    description: string;
    context: string[];
  };
}
```

### 3. Core Layer Design

#### 3.1 Core Entry Point

```typescript
// core/index.ts

import { EventEmitter } from 'events';
import { CoreMessage, GUIMessage } from './protocol';
import { AIManager } from './ai/manager';
import { ContextManager } from './context/manager';
import { PlanningAgent } from './planning/agent';

export class CoreEngine extends EventEmitter {
  private aiManager: AIManager;
  private contextManager: ContextManager;
  private planningAgent: PlanningAgent;
  
  constructor() {
    super();
    this.aiManager = new AIManager(this);
    this.contextManager = new ContextManager(this);
    this.planningAgent = new PlanningAgent(this);
  }
  
  // Handle messages from Extension
  async handleMessage(message: GUIMessage): Promise<void> {
    switch (message.messageType) {
      case 'chat/request':
        await this.aiManager.handleChatRequest(message.data);
        break;
      case 'chat/stop':
        await this.aiManager.stopGeneration(message.data.requestId);
        break;
      case 'context/request':
        await this.contextManager.handleContextRequest(message.data);
        break;
      case 'planning/request':
        await this.planningAgent.handlePlanRequest(message.data);
        break;
    }
  }
  
  // Send messages to Extension
  sendMessage(message: CoreMessage): void {
    this.emit('message', message);
  }
}
```

#### 3.2 AI Manager

```typescript
// core/ai/manager.ts

import { CoreEngine } from '../index';
import { StreamingHandler } from './streaming';

export class AIManager {
  private core: CoreEngine;
  private streamingHandler: StreamingHandler;
  private activeRequests: Map<string, AbortController>;
  
  constructor(core: CoreEngine) {
    this.core = core;
    this.streamingHandler = new StreamingHandler(core);
    this.activeRequests = new Map();
  }
  
  async handleChatRequest(data: {
    requestId: string;
    message: string;
    context?: string[];
    model?: string;
  }): Promise<void> {
    const abortController = new AbortController();
    this.activeRequests.set(data.requestId, abortController);
    
    // Notify streaming start
    this.core.sendMessage({
      messageId: crypto.randomUUID(),
      messageType: 'streaming/start',
      timestamp: Date.now(),
      data: {
        requestId: data.requestId,
        model: data.model || 'default'
      }
    });
    
    try {
      // Get AI response with streaming
      await this.streamingHandler.streamResponse({
        requestId: data.requestId,
        message: data.message,
        context: data.context,
        model: data.model,
        signal: abortController.signal
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user');
      } else {
        this.core.sendMessage({
          messageId: crypto.randomUUID(),
          messageType: 'error',
          timestamp: Date.now(),
          data: {
            requestId: data.requestId,
            error: error.message
          }
        });
      }
    } finally {
      this.activeRequests.delete(data.requestId);
    }
  }
  
  async stopGeneration(requestId: string): Promise<void> {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
    }
  }
}
```

#### 3.3 Streaming Handler

```typescript
// core/ai/streaming.ts

import { CoreEngine } from '../index';
import { callAI } from '../../services/aiProvider'; // Mevcut

export class StreamingHandler {
  private core: CoreEngine;
  
  constructor(core: CoreEngine) {
    this.core = core;
  }
  
  async streamResponse(options: {
    requestId: string;
    message: string;
    context?: string[];
    model?: string;
    signal: AbortSignal;
  }): Promise<void> {
    const { requestId, message, context, model, signal } = options;
    
    // TODO: Gerçek token-by-token streaming
    // Şimdilik: Kelime kelime streaming (mevcut sistem)
    
    const response = await callAI(message, model || 'default', [
      { role: 'user', content: message }
    ]);
    
    // Check if aborted
    if (signal.aborted) {
      throw new Error('AbortError');
    }
    
    // Stream word by word
    const words = response.split(' ');
    let accumulated = '';
    
    for (let i = 0; i < words.length; i++) {
      if (signal.aborted) {
        throw new Error('AbortError');
      }
      
      accumulated += (i > 0 ? ' ' : '') + words[i];
      
      // Send token message
      this.core.sendMessage({
        messageId: crypto.randomUUID(),
        messageType: 'streaming/token',
        timestamp: Date.now(),
        data: {
          requestId,
          token: words[i],
          accumulated
        }
      });
      
      // Delay for smooth animation
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    // Send complete message
    this.core.sendMessage({
      messageId: crypto.randomUUID(),
      messageType: 'streaming/complete',
      timestamp: Date.now(),
      data: {
        requestId,
        fullResponse: accumulated,
        tokensUsed: words.length
      }
    });
  }
}
```

#### 3.4 Context Manager

```typescript
// core/context/manager.ts

import { CoreEngine } from '../index';
import { smartContextBuilder } from '../../services/smartContextBuilder'; // Mevcut

export class ContextManager {
  private core: CoreEngine;
  private cache: Map<string, any>;
  
  constructor(core: CoreEngine) {
    this.core = core;
    this.cache = new Map();
  }
  
  async handleContextRequest(data: {
    query: string;
    maxFiles?: number;
  }): Promise<void> {
    // Use existing smart context builder
    const relevantFiles = await smartContextBuilder.getRelevantFiles(
      data.query,
      data.maxFiles || 5
    );
    
    // Send context update
    this.core.sendMessage({
      messageId: crypto.randomUUID(),
      messageType: 'context/update',
      timestamp: Date.now(),
      data: {
        contextId: crypto.randomUUID(),
        files: relevantFiles,
        summary: `Found ${relevantFiles.length} relevant files`
      }
    });
  }
}
```

#### 3.5 Planning Agent

```typescript
// core/planning/agent.ts

import { CoreEngine } from '../index';

export class PlanningAgent {
  private core: CoreEngine;
  
  constructor(core: CoreEngine) {
    this.core = core;
  }
  
  async handlePlanRequest(data: {
    taskId: string;
    description: string;
    context: string[];
  }): Promise<void> {
    // Break down task into steps
    const steps = await this.breakdownTask(data.description);
    
    // Execute steps
    for (let i = 0; i < steps.length; i++) {
      // Send progress
      this.core.sendMessage({
        messageId: crypto.randomUUID(),
        messageType: 'planning/progress',
        timestamp: Date.now(),
        data: {
          taskId: data.taskId,
          currentStep: i + 1,
          totalSteps: steps.length,
          stepDescription: steps[i]
        }
      });
      
      // Execute step (placeholder)
      await this.executeStep(steps[i]);
    }
  }
  
  private async breakdownTask(description: string): Promise<string[]> {
    // TODO: Use AI to break down task
    return [
      'Analyze requirements',
      'Design solution',
      'Implement code',
      'Test implementation'
    ];
  }
  
  private async executeStep(step: string): Promise<void> {
    // TODO: Execute step
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

### 4. Extension Layer Design

#### 4.1 Extension Entry Point

```typescript
// extension/index.ts

import { CoreEngine } from '../core';
import { Messenger } from './messenger';
import { TauriBridge } from './tauri-bridge';
import { IDEInterface } from './ide';

export class Extension {
  private core: CoreEngine;
  private messenger: Messenger;
  private tauriBridge: TauriBridge;
  private ide: IDEInterface;
  
  constructor() {
    this.core = new CoreEngine();
    this.messenger = new Messenger(this.core);
    this.tauriBridge = new TauriBridge(this.messenger);
    this.ide = new IDEInterface();
    
    this.setupMessageHandlers();
  }
  
  private setupMessageHandlers(): void {
    // Core → GUI messages
    this.core.on('message', (message) => {
      this.messenger.sendToGUI(message);
    });
    
    // GUI → Core messages
    this.messenger.on('gui-message', (message) => {
      this.core.handleMessage(message);
    });
  }
  
  async initialize(): Promise<void> {
    await this.tauriBridge.initialize();
    console.log('✅ Extension initialized');
  }
}
```

#### 4.2 Messenger (Message Router)

```typescript
// extension/messenger.ts

import { EventEmitter } from 'events';
import { CoreEngine } from '../core';
import { CoreMessage, GUIMessage } from '../core/protocol';

export class Messenger extends EventEmitter {
  private core: CoreEngine;
  
  constructor(core: CoreEngine) {
    super();
    this.core = core;
  }
  
  // Send message to GUI
  sendToGUI(message: CoreMessage): void {
    // Emit event that TauriBridge will listen to
    this.emit('core-message', message);
  }
  
  // Receive message from GUI
  receiveFromGUI(message: GUIMessage): void {
    // Emit event that Extension will listen to
    this.emit('gui-message', message);
  }
}
```

#### 4.3 Tauri Bridge

```typescript
// extension/tauri-bridge.ts

import { emit, listen } from '@tauri-apps/api/event';
import { Messenger } from './messenger';
import { CoreMessage, GUIMessage } from '../core/protocol';

export class TauriBridge {
  private messenger: Messenger;
  
  constructor(messenger: Messenger) {
    this.messenger = messenger;
  }
  
  async initialize(): Promise<void> {
    // Listen to GUI messages
    await listen<GUIMessage>('gui-message', (event) => {
      this.messenger.receiveFromGUI(event.payload);
    });
    
    // Listen to Core messages and forward to GUI
    this.messenger.on('core-message', (message: CoreMessage) => {
      emit('core-message', message);
    });
    
    console.log('✅ Tauri Bridge initialized');
  }
}
```

#### 4.4 IDE Interface

```typescript
// extension/ide.ts

import { invoke } from '@tauri-apps/api/core';

export class IDEInterface {
  // File operations
  async readFile(path: string): Promise<string> {
    return await invoke('read_file', { path });
  }
  
  async writeFile(path: string, content: string): Promise<void> {
    await invoke('write_file', { path, content });
  }
  
  async listFiles(path: string): Promise<string[]> {
    return await invoke('list_files', { path });
  }
  
  // Editor operations
  async openFile(path: string): Promise<void> {
    // Emit event to GUI
    await invoke('open_file', { path });
  }
  
  async getActiveFile(): Promise<string | null> {
    return await invoke('get_active_file');
  }
}
```

### 5. GUI Integration

#### 5.1 GUI Message Sender

```typescript
// gui/hooks/useCore.ts

import { emit, listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { CoreMessage, GUIMessage } from '../core/protocol';

export function useCore() {
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  
  useEffect(() => {
    // Listen to Core messages
    const unlisten = listen<CoreMessage>('core-message', (event) => {
      setMessages(prev => [...prev, event.payload]);
    });
    
    return () => {
      unlisten.then(fn => fn());
    };
  }, []);
  
  // Send message to Core
  const sendMessage = async (message: GUIMessage) => {
    await emit('gui-message', message);
  };
  
  return { messages, sendMessage };
}
```

#### 5.2 Chat Panel Integration

```typescript
// gui/components/ChatPanel.tsx (updated)

import { useCore } from '../hooks/useCore';

export function ChatPanel() {
  const { messages, sendMessage } = useCore();
  const [streamingMessage, setStreamingMessage] = useState('');
  
  useEffect(() => {
    // Handle Core messages
    messages.forEach(message => {
      switch (message.messageType) {
        case 'streaming/token':
          setStreamingMessage(message.data.accumulated);
          break;
        case 'streaming/complete':
          // Add to chat history
          addMessage({
            role: 'assistant',
            content: message.data.fullResponse
          });
          setStreamingMessage('');
          break;
      }
    });
  }, [messages]);
  
  const handleSend = async (text: string) => {
    await sendMessage({
      messageId: crypto.randomUUID(),
      messageType: 'chat/request',
      timestamp: Date.now(),
      data: {
        requestId: crypto.randomUUID(),
        message: text
      }
    });
  };
  
  const handleStop = async (requestId: string) => {
    await sendMessage({
      messageId: crypto.randomUUID(),
      messageType: 'chat/stop',
      timestamp: Date.now(),
      data: { requestId }
    });
  };
  
  return (
    <div>
      {/* Chat UI */}
      {streamingMessage && <div>{streamingMessage}</div>}
      <button onClick={() => handleStop(currentRequestId)}>Stop</button>
    </div>
  );
}
```

## 🔄 Migration Strategy

### Phase 1: Setup (Gün 1)
1. Klasör yapısını oluştur
2. Protocol types tanımla
3. Core, Extension, GUI skeleton'ları oluştur

### Phase 2: Core Implementation (Gün 2-4)
4. AIManager implement et
5. StreamingHandler implement et
6. ContextManager implement et
7. PlanningAgent implement et

### Phase 3: Extension Layer (Gün 5-6)
8. Messenger implement et
9. TauriBridge implement et
10. IDEInterface implement et

### Phase 4: GUI Integration (Gün 7-8)
11. useCore hook oluştur
12. ChatPanel'i güncelle
13. Stop/Regenerate butonları ekle

### Phase 5: Testing & Polish (Gün 9-11)
14. Unit tests yaz
15. Integration tests yaz
16. Performance optimization
17. Documentation

## ✅ Başarı Metrikleri

1. **Message Latency:** < 10ms (Core ↔ Extension ↔ GUI)
2. **Streaming Performance:** 30-50 tokens/second
3. **Context Retrieval:** < 100ms
4. **Planning Speed:** < 2 seconds for task breakdown
5. **Memory Usage:** < 200MB additional overhead

## 🎨 UI Değişiklikleri

### Yeni Butonlar
- Stop Generation (streaming sırasında)
- Regenerate (mesaj üzerinde)
- Plan Task (karmaşık görevler için)

### Progress Indicators
- Streaming progress bar
- Planning steps indicator
- Context loading spinner

## 📝 Notlar

- Mevcut AI sistemi korunur (backward compatibility)
- Kademeli migration yapılır
- Her phase test edilir
- Performance monitoring sürekli yapılır

---

**Sonraki Adım:** Tasks.md oluştur ve implementation'a başla!
