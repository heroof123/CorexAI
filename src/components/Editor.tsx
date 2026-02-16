import { lazy, Suspense } from "react";
import CorexLogo from "./CorexLogo";
import LoadingSpinner from "./LoadingSpinner";
import { useTheme } from "../contexts/ThemeContext";

// 🚀 LAZY LOAD: Monaco Editor (-7 MB from initial bundle!)
const MonacoEditor = lazy(() => import("@monaco-editor/react"));

interface EditorProps {
  filePath: string;
  content: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

export default function Editor({ filePath, content, onChange, onSave }: EditorProps) {
  const language = getLanguageFromPath(filePath);
  const { theme } = useTheme();

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="border-b border-neutral-800 px-4 py-2 flex items-center justify-between bg-[#181818]">
        <div className="flex items-center gap-3">
          {/* Corex Logo - Small and Animated */}
          <div className="flex items-center gap-2">
            <CorexLogo size={20} className="opacity-80" />
          </div>
          <span className="text-xs font-mono text-neutral-400">{filePath}</span>
          <span className="text-xs px-2 py-0.5 bg-neutral-700 text-neutral-400 rounded">
            {language}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 rounded flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Kaydet
            <span className="text-neutral-300 ml-1">(Ctrl+S)</span>
          </button>
        </div>
      </div>

      {/* Monaco Editor with Infinite Feel */}
      <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden">
        {/* Virtual Page Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#1e1e1e] to-[#222222]">
          {/* Grid Pattern for Infinite Feel */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
          
          {/* Subtle Vignette */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
        </div>
        
        {/* Monaco Editor Container */}
        <div className="relative z-10 h-full">
          <Suspense fallback={
            <div className="h-full flex items-center justify-center">
              <LoadingSpinner 
                size="lg" 
                text="Monaco Editor yükleniyor..." 
              />
            </div>
          }>
            <MonacoEditor
              height="100%"
              language={language}
              theme={theme === 'dark' ? 'vs-dark' : theme === 'light' ? 'vs' : 'vs-dark'}
              value={content}
              onChange={(value) => onChange(value || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: true,
                scrollBeyondLastColumn: 10,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnCommitCharacter: true,
                quickSuggestions: true,
                parameterHints: { enabled: true },
                folding: true,
                lineNumbers: "on",
                renderWhitespace: "selection",
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                // Infinite feel options
                padding: { top: 20, bottom: 100 },
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  verticalScrollbarSize: 12,
                  horizontalScrollbarSize: 12,
                  alwaysConsumeMouseWheel: false
                },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                renderLineHighlight: 'gutter',
                renderValidationDecorations: 'on'
              }}
              onMount={(editor, monaco) => {
                // Ctrl+S shortcut
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                  onSave();
                });
                
                // Infinite scroll feel
                editor.onDidScrollChange(() => {
                  const scrollTop = editor.getScrollTop();
                  
                  // Add subtle parallax effect
                  const container = editor.getDomNode()?.parentElement;
                  if (container) {
                    const parallaxOffset = scrollTop * 0.1;
                    container.style.backgroundPosition = `0 ${parallaxOffset}px`;
                  }
                });
              }}
            />
          </Suspense>
        </div>
        
        {/* Floating Code Hints */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-neutral-400 border border-neutral-800/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Sonsuz kod alanı</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    rs: "rust",
    py: "python",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    toml: "toml",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    sql: "sql",
    sh: "shell",
    bat: "bat",
  };
  return languageMap[ext || ""] || "plaintext";
}
