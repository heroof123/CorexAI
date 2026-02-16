import { useState, useEffect } from 'react';
// import { invoke } from '@tauri-apps/api/core';

interface Snippet {
  id: string;
  name: string;
  description: string;
  language: string;
  code: string;
  category: string;
  tags: string[];
  createdAt: number;
  isCustom: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'react' | 'vue' | 'python' | 'node' | 'rust' | 'html' | 'other';
  files: Array<{
    path: string;
    content: string;
  }>;
  dependencies?: string[];
}

interface CodeSnippetsProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSnippet: (code: string) => void;
  onCreateProject: (template: Template) => void;
}

export default function CodeSnippets({ isOpen, onClose, onInsertSnippet, onCreateProject }: CodeSnippetsProps) {
  const [activeTab, setActiveTab] = useState('snippets');
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  
  // Create snippet form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSnippet, setNewSnippet] = useState({
    name: '',
    description: '',
    language: 'javascript',
    code: '',
    category: 'custom',
    tags: ''
  });

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showCreateForm) {
          setShowCreateForm(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, showCreateForm]);

  // Load snippets and templates
  useEffect(() => {
    if (isOpen) {
      loadSnippets();
      loadTemplates();
    }
  }, [isOpen]);

  const loadSnippets = () => {
    // Predefined snippets
    const predefinedSnippets: Snippet[] = [
      {
        id: '1',
        name: 'React Functional Component',
        description: 'Basic React functional component with TypeScript',
        language: 'typescript',
        code: `import React from 'react';

interface Props {
  // Define your props here
}

const ComponentName: React.FC<Props> = () => {
  return (
    <div>
      {/* Your component content */}
    </div>
  );
};

export default ComponentName;`,
        category: 'react',
        tags: ['react', 'typescript', 'component'],
        createdAt: Date.now(),
        isCustom: false
      },
      {
        id: '2',
        name: 'useState Hook',
        description: 'React useState hook with TypeScript',
        language: 'typescript',
        code: `const [state, setState] = useState<Type>(initialValue);`,
        category: 'react',
        tags: ['react', 'hooks', 'state'],
        createdAt: Date.now(),
        isCustom: false
      },
      {
        id: '3',
        name: 'useEffect Hook',
        description: 'React useEffect hook with cleanup',
        language: 'typescript',
        code: `useEffect(() => {
  // Effect logic here
  
  return () => {
    // Cleanup logic here
  };
}, [dependencies]);`,
        category: 'react',
        tags: ['react', 'hooks', 'effect'],
        createdAt: Date.now(),
        isCustom: false
      },
      {
        id: '4',
        name: 'Express Route Handler',
        description: 'Express.js route handler with error handling',
        language: 'javascript',
        code: `app.get('/api/endpoint', async (req, res) => {
  try {
    // Route logic here
    const result = await someAsyncOperation();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});`,
        category: 'node',
        tags: ['express', 'api', 'error-handling'],
        createdAt: Date.now(),
        isCustom: false
      },
      {
        id: '5',
        name: 'Python Class',
        description: 'Basic Python class with constructor',
        language: 'python',
        code: `class ClassName:
    def __init__(self, param1, param2):
        self.param1 = param1
        self.param2 = param2
    
    def method_name(self):
        """Method description"""
        pass
    
    def __str__(self):
        return f"ClassName(param1={self.param1}, param2={self.param2})"`,
        category: 'python',
        tags: ['python', 'class', 'oop'],
        createdAt: Date.now(),
        isCustom: false
      },
      {
        id: '6',
        name: 'Async/Await Function',
        description: 'Async function with error handling',
        language: 'javascript',
        code: `async function functionName() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    console.error('Error in functionName:', error);
    throw error;
  }
}`,
        category: 'javascript',
        tags: ['async', 'await', 'error-handling'],
        createdAt: Date.now(),
        isCustom: false
      }
    ];

    // Load custom snippets from localStorage
    const customSnippets = JSON.parse(localStorage.getItem('corex-snippets') || '[]');
    setSnippets([...predefinedSnippets, ...customSnippets]);
  };

  const loadTemplates = () => {
    const predefinedTemplates: Template[] = [
      {
        id: '1',
        name: 'React + TypeScript + Vite',
        description: 'Modern React project with TypeScript and Vite',
        type: 'react',
        files: [
          {
            path: 'package.json',
            content: `{
  "name": "react-typescript-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}`
          },
          {
            path: 'src/App.tsx',
            content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>React + TypeScript + Vite</h1>
      <p>Edit src/App.tsx and save to test HMR</p>
    </div>
  );
}

export default App;`
          },
          {
            path: 'src/main.tsx',
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`
          },
          {
            path: 'index.html',
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + TypeScript + Vite</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
          }
        ],
        dependencies: ['react', 'typescript', 'vite']
      },
      {
        id: '2',
        name: 'Express.js API',
        description: 'RESTful API with Express.js and TypeScript',
        type: 'node',
        files: [
          {
            path: 'package.json',
            content: `{
  "name": "express-api",
  "version": "1.0.0",
  "description": "Express.js API with TypeScript",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "typescript": "^5.0.2",
    "ts-node-dev": "^2.0.0"
  }
}`
          },
          {
            path: 'src/index.ts',
            content: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Express.js API is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});`
          }
        ],
        dependencies: ['express', 'typescript', 'cors', 'helmet']
      },
      {
        id: '3',
        name: 'Python Flask API',
        description: 'RESTful API with Python Flask',
        type: 'python',
        files: [
          {
            path: 'app.py',
            content: `from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({'message': 'Flask API is running!'})

@app.route('/api/health')
def health():
    return jsonify({'status': 'OK', 'version': '1.0.0'})

@app.route('/api/users', methods=['GET'])
def get_users():
    # Sample users data
    users = [
        {'id': 1, 'name': 'John Doe', 'email': 'john@example.com'},
        {'id': 2, 'name': 'Jane Smith', 'email': 'jane@example.com'}
    ]
    return jsonify(users)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)`
          },
          {
            path: 'requirements.txt',
            content: `Flask==2.3.2
Flask-CORS==4.0.0
python-dotenv==1.0.0`
          }
        ],
        dependencies: ['flask', 'flask-cors']
      }
    ];

    setTemplates(predefinedTemplates);
  };

  const saveSnippet = () => {
    const snippet: Snippet = {
      id: Date.now().toString(),
      name: newSnippet.name,
      description: newSnippet.description,
      language: newSnippet.language,
      code: newSnippet.code,
      category: newSnippet.category,
      tags: newSnippet.tags.split(',').map(tag => tag.trim()),
      createdAt: Date.now(),
      isCustom: true
    };

    const customSnippets = JSON.parse(localStorage.getItem('corex-snippets') || '[]');
    customSnippets.push(snippet);
    localStorage.setItem('corex-snippets', JSON.stringify(customSnippets));
    
    setSnippets(prev => [...prev, snippet]);
    setShowCreateForm(false);
    setNewSnippet({
      name: '',
      description: '',
      language: 'javascript',
      code: '',
      category: 'custom',
      tags: ''
    });
  };

  const deleteSnippet = (id: string) => {
    const customSnippets = JSON.parse(localStorage.getItem('corex-snippets') || '[]');
    const updatedSnippets = customSnippets.filter((s: Snippet) => s.id !== id);
    localStorage.setItem('corex-snippets', JSON.stringify(updatedSnippets));
    
    setSnippets(prev => prev.filter(s => s.id !== id));
  };

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || snippet.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'all' || snippet.language === selectedLanguage;
    
    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const categories = ['all', ...Array.from(new Set(snippets.map(s => s.category)))];
  const languages = ['all', ...Array.from(new Set(snippets.map(s => s.language)))];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="h-12 bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Code Snippets & Templates</h3>
            </div>
            
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-[var(--color-textSecondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] rounded transition-colors"
              title="Close (ESC)"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
            <div className="flex">
              <button
                onClick={() => setActiveTab('snippets')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'snippets'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-textSecondary)] hover:text-[var(--color-text)]'
                }`}
              >
                <span className="mr-2">📄</span>
                Code Snippets
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'templates'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-textSecondary)] hover:text-[var(--color-text)]'
                }`}
              >
                <span className="mr-2">📁</span>
                Project Templates
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {/* Snippets Tab */}
            {activeTab === 'snippets' && (
              <div className="space-y-4">
                {/* Controls */}
                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    placeholder="Search snippets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  />
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang === 'all' ? 'All Languages' : lang}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-80 transition-opacity"
                  >
                    + New Snippet
                  </button>
                </div>

                {/* Create Form */}
                {showCreateForm && (
                  <div className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                    <h4 className="text-lg font-semibold mb-4">Create New Snippet</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Snippet name"
                        value={newSnippet.name}
                        onChange={(e) => setNewSnippet(prev => ({ ...prev, name: e.target.value }))}
                        className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={newSnippet.description}
                        onChange={(e) => setNewSnippet(prev => ({ ...prev, description: e.target.value }))}
                        className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
                      />
                      <select
                        value={newSnippet.language}
                        onChange={(e) => setNewSnippet(prev => ({ ...prev, language: e.target.value }))}
                        className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="rust">Rust</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Tags (comma separated)"
                        value={newSnippet.tags}
                        onChange={(e) => setNewSnippet(prev => ({ ...prev, tags: e.target.value }))}
                        className="p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
                      />
                    </div>
                    <textarea
                      placeholder="Snippet code..."
                      value={newSnippet.code}
                      onChange={(e) => setNewSnippet(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full h-32 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded font-mono text-sm mb-4"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveSnippet}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:opacity-80 transition-opacity"
                      >
                        Save Snippet
                      </button>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:opacity-80 transition-opacity"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Snippets List */}
                <div className="grid grid-cols-1 gap-4">
                  {filteredSnippets.map(snippet => (
                    <div key={snippet.id} className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{snippet.name}</h4>
                          <p className="text-sm text-[var(--color-textSecondary)]">{snippet.description}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-2 py-1 bg-[var(--color-primary)] text-white rounded">{snippet.language}</span>
                            <span className="text-xs px-2 py-1 bg-gray-600 text-white rounded">{snippet.category}</span>
                            {snippet.tags.map(tag => (
                              <span key={tag} className="text-xs px-2 py-1 bg-gray-500 text-white rounded">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onInsertSnippet(snippet.code)}
                            className="px-3 py-1 bg-[var(--color-primary)] text-white rounded text-sm hover:opacity-80 transition-opacity"
                          >
                            Insert
                          </button>
                          {snippet.isCustom && (
                            <button
                              onClick={() => deleteSnippet(snippet.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:opacity-80 transition-opacity"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      <pre className="text-xs bg-[var(--color-surface)] p-2 rounded overflow-x-auto">
                        <code>{snippet.code}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <div key={template.id} className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-[var(--color-textSecondary)]">{template.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-[var(--color-primary)] text-white rounded">{template.type}</span>
                            <span className="text-xs px-2 py-1 bg-gray-600 text-white rounded">{template.files.length} files</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onCreateProject(template)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:opacity-80 transition-opacity"
                        >
                          Create Project
                        </button>
                      </div>
                      
                      <div className="mt-3">
                        <h5 className="text-sm font-medium mb-1">Files:</h5>
                        <div className="text-xs space-y-1">
                          {template.files.map((file, index) => (
                            <div key={index} className="text-[var(--color-textSecondary)]">📄 {file.path}</div>
                          ))}
                        </div>
                      </div>
                      
                      {template.dependencies && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium mb-1">Dependencies:</h5>
                          <div className="flex flex-wrap gap-1">
                            {template.dependencies.map(dep => (
                              <span key={dep} className="text-xs px-2 py-1 bg-blue-600 text-white rounded">{dep}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}