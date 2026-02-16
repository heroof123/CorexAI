# 🚀 Local AI IDE

A powerful, local-first AI-powered IDE built with Tauri + React + TypeScript. Features semantic code search, intelligent AI assistance, and a modern development experience.

## ✨ Features

### 🧠 AI-Powered Code Assistance
- **Semantic Search**: Uses embeddings to find relevant code based on meaning, not just keywords
- **Context-Aware AI**: Automatically includes relevant files in AI conversations
- **Code Suggestions**: AI can suggest code changes with diff preview
- **File Mentions**: Use `@filename.ts` to explicitly reference files

### 📝 Modern Code Editor
- **Monaco Editor**: Full-featured editor with syntax highlighting
- **Multi-Language Support**: TypeScript, JavaScript, Rust, Python, JSON, CSS, HTML, and more
- **Auto-Save**: Keyboard shortcuts (Ctrl+S) for quick saving
- **IntelliSense**: Code completion and parameter hints

### 📂 Smart Project Management
- **Intelligent Indexing**: Automatically filters out irrelevant files (node_modules, build artifacts, etc.)
- **Cached Embeddings**: Uses IndexedDB to cache embeddings for faster loading
- **File Tree**: Visual file explorer with folder structure
- **Conversation History**: Saved per-project

### 🔄 Code Review System
- **Diff Viewer**: Side-by-side and unified diff views
- **Accept/Reject Changes**: Review AI suggestions before applying
- **Real-time Updates**: See changes in the editor immediately

## 🏗️ Architecture

```
local-ai/
├── src/
│   ├── components/          # React components
│   │   ├── FileTree.tsx    # File explorer
│   │   ├── Editor.tsx      # Monaco code editor
│   │   ├── ChatPanel.tsx   # AI chat interface
│   │   └── DiffViewer.tsx  # Code diff viewer
│   ├── services/           # Business logic
│   │   ├── ai.ts           # AI interaction & parsing
│   │   ├── embedding.ts    # Semantic search with transformers
│   │   └── db.ts           # IndexedDB caching
│   ├── types/              # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx             # Main application
│   └── main.tsx            # Entry point
├── src-tauri/              # Rust backend
│   └── src/
│       ├── main.rs         # File system operations
│       └── lib.rs          # Tauri commands
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Rust (for Tauri)
- Your preferred AI backend (Ollama, LM Studio, etc.)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo>
cd local-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup AI Backend**

Make sure you have a local AI running. This project expects a backend at the Tauri level. Configure your AI endpoint in `src-tauri/src/main.rs`.

4. **Run in development**
```bash
npm run tauri dev
```

5. **Build for production**
```bash
npm run tauri build
```

## 📖 Usage Guide

### Opening a Project

1. Click "📂 Open Project" button
2. Select your project folder
3. Wait for indexing to complete (first time only)
4. Start chatting with AI about your code!

### Using AI Chat

**Basic Questions:**
```
"Explain what this project does"
"How does authentication work?"
"Find all API endpoints"
```

**Code Changes:**
```
"Add error handling to @api.ts"
"Refactor the UserService class"
"Create a dark mode toggle component"
```

**File References:**
```
"@App.tsx what does this component do?"
"Compare @api.ts with @service.ts"
```

### Keyboard Shortcuts

- `Ctrl+S` - Save current file
- `Enter` - Send message in chat
- `Shift+Enter` - New line in chat

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editing
- **Xenova Transformers** - Embeddings (all-MiniLM-L6-v2)
- **IndexedDB (idb)** - Local caching

### Backend
- **Tauri 2.0** - Desktop framework
- **Rust** - File system operations

### AI
- Configurable backend (supports Ollama, LM Studio, OpenAI-compatible APIs)

## 🎯 Roadmap

- [x] Basic file tree
- [x] Monaco editor integration
- [x] AI chat with context
- [x] Semantic code search
- [x] Diff viewer
- [x] IndexedDB caching
- [ ] Multi-file editing
- [ ] Git integration
- [ ] Terminal integration
- [ ] Plugin system
- [ ] Custom themes
- [ ] Project templates

## 🔧 Configuration

### Adjusting Embedding Model

Edit `src/services/embedding.ts`:

```typescript
// Change model
embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// Adjust similarity threshold
.filter(f => f.score > 0.25); // Lower = more results
```

### Changing AI Backend

Edit `src-tauri/src/main.rs` to point to your AI service.

## 📊 Performance

- **Indexing Speed**: ~50-100 files/second (depends on file size)
- **Memory Usage**: ~200-300MB (including embeddings)
- **Cache Size**: ~10-50MB per project (depends on codebase size)
- **Search Latency**: <100ms for most queries

## 🐛 Troubleshooting

### Indexing fails
- Check if files are too large (>100KB skipped by default)
- Ensure embedding model downloaded successfully
- Clear cache: `localStorage.clear()` in console

### AI not responding
- Verify backend is running
- Check network/CORS settings
- Look at console for errors

### Monaco editor not loading
- Check internet connection (CDN-based)
- Clear browser cache
- Restart dev server

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a PR

## 📄 License

MIT License - feel free to use in your own projects!

## 🙏 Acknowledgments

- **Tauri** - Amazing Rust-based desktop framework
- **Monaco Editor** - Microsoft's powerful code editor
- **Xenova Transformers** - Browser-based ML models
- **Cursor IDE** - Inspiration for the UX

---

Built with ❤️ using Tauri, React, and TypeScript
