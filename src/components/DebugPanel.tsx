import { useState, useEffect, useRef } from 'react';

interface Breakpoint {
  id: string;
  filePath: string;
  lineNumber: number;
  condition?: string;
  enabled: boolean;
}

interface DebugVariable {
  name: string;
  value: any;
  type: string;
  expandable: boolean;
  expanded?: boolean;
}

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration?: number;
  error?: string;
  file: string;
}

interface DebugPanelProps {
  projectPath: string;
  currentFile: string;
  onBreakpointToggle: (filePath: string, lineNumber: number) => void;
}

export default function DebugPanel({ projectPath, currentFile, onBreakpointToggle }: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<'breakpoints' | 'variables' | 'console' | 'tests'>('breakpoints');
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [variables, setVariables] = useState<DebugVariable[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [debugCommand, setDebugCommand] = useState('');
  const consoleRef = useRef<HTMLDivElement>(null);

  // Load breakpoints from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`corex-breakpoints-${projectPath}`);
    if (saved) {
      try {
        setBreakpoints(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load breakpoints:', error);
      }
    }
  }, [projectPath]);

  // Save breakpoints to localStorage
  useEffect(() => {
    localStorage.setItem(`corex-breakpoints-${projectPath}`, JSON.stringify(breakpoints));
  }, [breakpoints, projectPath]);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const addBreakpoint = (filePath: string, lineNumber: number, condition?: string) => {
    const id = `${filePath}:${lineNumber}`;
    const existing = breakpoints.find(bp => bp.id === id);
    
    if (existing) {
      setBreakpoints(prev => prev.map(bp => 
        bp.id === id ? { ...bp, enabled: !bp.enabled } : bp
      ));
    } else {
      const newBreakpoint: Breakpoint = {
        id,
        filePath,
        lineNumber,
        condition,
        enabled: true
      };
      setBreakpoints(prev => [...prev, newBreakpoint]);
    }
    
    onBreakpointToggle(filePath, lineNumber);
  };

  const removeBreakpoint = (id: string) => {
    const breakpoint = breakpoints.find(bp => bp.id === id);
    if (breakpoint) {
      setBreakpoints(prev => prev.filter(bp => bp.id !== id));
      onBreakpointToggle(breakpoint.filePath, breakpoint.lineNumber);
    }
  };

  const toggleBreakpoint = (id: string) => {
    setBreakpoints(prev => prev.map(bp => 
      bp.id === id ? { ...bp, enabled: !bp.enabled } : bp
    ));
  };

  const startDebugging = async () => {
    setIsDebugging(true);
    setConsoleOutput(prev => [...prev, '🚀 Debug oturumu başlatılıyor...']);
    
    try {
      // Mock debug start - in real implementation, this would start a debug session
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock variables
      setVariables([
        { name: 'projectPath', value: projectPath, type: 'string', expandable: false },
        { name: 'currentFile', value: currentFile, type: 'string', expandable: false },
        { name: 'breakpoints', value: breakpoints.length, type: 'number', expandable: false },
        { name: 'process', value: { pid: 1234, memory: '45MB' }, type: 'object', expandable: true }
      ]);
      
      setConsoleOutput(prev => [...prev, '✅ Debug oturumu başlatıldı']);
    } catch (error) {
      setConsoleOutput(prev => [...prev, `❌ Debug hatası: ${error}`]);
      setIsDebugging(false);
    }
  };

  const stopDebugging = () => {
    setIsDebugging(false);
    setVariables([]);
    setConsoleOutput(prev => [...prev, '🛑 Debug oturumu sonlandırıldı']);
  };

  const runTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    setConsoleOutput(prev => [...prev, '🧪 Testler çalıştırılıyor...']);

    try {
      // Mock test execution
      const mockTests: TestResult[] = [
        { id: '1', name: 'should render correctly', status: 'running', file: 'App.test.tsx' },
        { id: '2', name: 'should handle user input', status: 'running', file: 'Input.test.tsx' },
        { id: '3', name: 'should validate form', status: 'running', file: 'Form.test.tsx' }
      ];

      setTestResults(mockTests);

      // Simulate test completion
      for (let i = 0; i < mockTests.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setTestResults(prev => prev.map((test, index) => {
          if (index === i) {
            const passed = Math.random() > 0.3;
            return {
              ...test,
              status: passed ? 'passed' : 'failed',
              duration: Math.floor(Math.random() * 500) + 50,
              error: passed ? undefined : 'Expected true but got false'
            };
          }
          return test;
        }));
      }

      const passedCount = testResults.filter(t => t.status === 'passed').length;
      setConsoleOutput(prev => [...prev, `✅ Testler tamamlandı: ${passedCount}/${mockTests.length} başarılı`]);
    } catch (error) {
      setConsoleOutput(prev => [...prev, `❌ Test hatası: ${error}`]);
    } finally {
      setIsRunningTests(false);
    }
  };

  const executeDebugCommand = async () => {
    if (!debugCommand.trim()) return;

    setConsoleOutput(prev => [...prev, `> ${debugCommand}`]);
    
    try {
      // Mock command execution
      if (debugCommand === 'help') {
        setConsoleOutput(prev => [...prev, 
          'Kullanılabilir komutlar:',
          '  help - Bu yardım mesajını göster',
          '  vars - Değişkenleri listele',
          '  step - Bir adım ilerle',
          '  continue - Devam et',
          '  break <file:line> - Breakpoint ekle'
        ]);
      } else if (debugCommand === 'vars') {
        variables.forEach(v => {
          setConsoleOutput(prev => [...prev, `  ${v.name}: ${JSON.stringify(v.value)} (${v.type})`]);
        });
      } else if (debugCommand.startsWith('break ')) {
        const [, location] = debugCommand.split(' ');
        const [file, line] = location.split(':');
        addBreakpoint(file, parseInt(line));
        setConsoleOutput(prev => [...prev, `Breakpoint eklendi: ${location}`]);
      } else {
        setConsoleOutput(prev => [...prev, `Bilinmeyen komut: ${debugCommand}`]);
      }
    } catch (error) {
      setConsoleOutput(prev => [...prev, `Hata: ${error}`]);
    }

    setDebugCommand('');
  };

  const expandVariable = (name: string) => {
    setVariables(prev => prev.map(v => 
      v.name === name ? { ...v, expanded: !v.expanded } : v
    ));
  };

  const renderVariable = (variable: DebugVariable, depth = 0) => {
    return (
      <div key={variable.name} style={{ paddingLeft: `${depth * 16}px` }}>
        <div className="flex items-center gap-2 py-1 hover:bg-[var(--color-hover)] px-2 rounded">
          {variable.expandable && (
            <button
              onClick={() => expandVariable(variable.name)}
              className="w-4 h-4 flex items-center justify-center text-xs"
            >
              {variable.expanded ? '▼' : '▶'}
            </button>
          )}
          <span className="text-sm font-mono text-[var(--color-text)]">{variable.name}:</span>
          <span className="text-sm font-mono text-[var(--color-textSecondary)]">
            {typeof variable.value === 'object' 
              ? `{${Object.keys(variable.value).length} properties}`
              : JSON.stringify(variable.value)
            }
          </span>
          <span className="text-xs text-[var(--color-textSecondary)]">({variable.type})</span>
        </div>
        
        {variable.expanded && typeof variable.value === 'object' && (
          <div>
            {Object.entries(variable.value).map(([key, value]) => 
              renderVariable({
                name: key,
                value,
                type: typeof value,
                expandable: typeof value === 'object' && value !== null
              }, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface)]">
      {/* Tabs */}
      <div className="h-8 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex">
        {[
          { id: 'breakpoints', label: '🔴 Breakpoints', count: breakpoints.length },
          { id: 'variables', label: '📊 Variables', count: variables.length },
          { id: 'console', label: '💻 Console', count: consoleOutput.length },
          { id: 'tests', label: '🧪 Tests', count: testResults.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1 text-xs border-r border-[var(--color-border)] transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'hover:bg-[var(--color-hover)]'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
        
        {/* Debug Controls */}
        <div className="flex items-center gap-2 ml-auto mr-2">
          {!isDebugging ? (
            <button
              onClick={startDebugging}
              className="px-2 py-1 text-xs bg-[var(--color-success)] text-white rounded hover:opacity-80 transition-opacity"
            >
              ▶️ Start
            </button>
          ) : (
            <button
              onClick={stopDebugging}
              className="px-2 py-1 text-xs bg-[var(--color-error)] text-white rounded hover:opacity-80 transition-opacity"
            >
              ⏹️ Stop
            </button>
          )}
          
          <button
            onClick={runTests}
            disabled={isRunningTests}
            className="px-2 py-1 text-xs bg-[var(--color-primary)] text-white rounded hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            {isRunningTests ? '🔄' : '🧪'} Test
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'breakpoints' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">Breakpoints</h4>
              <button
                onClick={() => setBreakpoints([])}
                className="text-xs text-[var(--color-error)] hover:underline"
              >
                Tümünü Temizle
              </button>
            </div>
            
            {breakpoints.length === 0 ? (
              <div className="text-center text-[var(--color-textSecondary)] py-8">
                <div className="text-2xl mb-2">🔴</div>
                <div>Henüz breakpoint yok</div>
                <div className="text-xs mt-1">Editörde satır numarasına tıklayarak ekleyin</div>
              </div>
            ) : (
              <div className="space-y-2">
                {breakpoints.map(bp => (
                  <div
                    key={bp.id}
                    className="flex items-center gap-3 p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  >
                    <button
                      onClick={() => toggleBreakpoint(bp.id)}
                      className={`w-4 h-4 rounded-full border-2 ${
                        bp.enabled 
                          ? 'bg-red-500 border-red-500' 
                          : 'border-gray-400'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-mono">
                        {bp.filePath.split('/').pop()}:{bp.lineNumber}
                      </div>
                      {bp.condition && (
                        <div className="text-xs text-[var(--color-textSecondary)]">
                          Koşul: {bp.condition}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeBreakpoint(bp.id)}
                      className="w-6 h-6 flex items-center justify-center text-[var(--color-error)] hover:bg-[var(--color-hover)] rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="p-4">
            <h4 className="text-sm font-medium mb-4">Variables</h4>
            
            {!isDebugging ? (
              <div className="text-center text-[var(--color-textSecondary)] py-8">
                <div className="text-2xl mb-2">📊</div>
                <div>Debug oturumu başlatın</div>
              </div>
            ) : variables.length === 0 ? (
              <div className="text-center text-[var(--color-textSecondary)] py-8">
                <div className="text-2xl mb-2">📊</div>
                <div>Değişken bulunamadı</div>
              </div>
            ) : (
              <div className="space-y-1">
                {variables.map(variable => renderVariable(variable))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'console' && (
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">Debug Console</h4>
              <button
                onClick={() => setConsoleOutput([])}
                className="text-xs text-[var(--color-error)] hover:underline"
              >
                Temizle
              </button>
            </div>
            
            <div
              ref={consoleRef}
              className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded p-3 font-mono text-sm overflow-y-auto mb-4"
            >
              {consoleOutput.map((line, index) => (
                <div key={index} className="mb-1">
                  {line}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Debug komutu girin (help yazın)"
                value={debugCommand}
                onChange={(e) => setDebugCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeDebugCommand()}
                className="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none text-sm font-mono"
                disabled={!isDebugging}
              />
              <button
                onClick={executeDebugCommand}
                disabled={!isDebugging || !debugCommand.trim()}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-80 disabled:opacity-50 transition-opacity text-sm"
              >
                Çalıştır
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">Test Results</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={runTests}
                  disabled={isRunningTests}
                  className="text-xs bg-[var(--color-primary)] text-white px-3 py-1 rounded hover:opacity-80 disabled:opacity-50"
                >
                  {isRunningTests ? '🔄 Çalışıyor...' : '🧪 Testleri Çalıştır'}
                </button>
              </div>
            </div>
            
            {testResults.length === 0 ? (
              <div className="text-center text-[var(--color-textSecondary)] py-8">
                <div className="text-2xl mb-2">🧪</div>
                <div>Test sonucu yok</div>
                <div className="text-xs mt-1">Testleri çalıştırmak için yukarıdaki butona tıklayın</div>
              </div>
            ) : (
              <div className="space-y-2">
                {testResults.map(test => (
                  <div
                    key={test.id}
                    className={`p-3 border rounded ${
                      test.status === 'passed' ? 'border-green-500 bg-green-500/10' :
                      test.status === 'failed' ? 'border-red-500 bg-red-500/10' :
                      test.status === 'running' ? 'border-blue-500 bg-blue-500/10' :
                      'border-gray-500 bg-gray-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {test.status === 'passed' ? '✅' :
                           test.status === 'failed' ? '❌' :
                           test.status === 'running' ? '🔄' : '⏭️'}
                        </span>
                        <span className="font-medium text-sm">{test.name}</span>
                      </div>
                      {test.duration && (
                        <span className="text-xs text-[var(--color-textSecondary)]">
                          {test.duration}ms
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-[var(--color-textSecondary)] mb-1">
                      📄 {test.file}
                    </div>
                    
                    {test.error && (
                      <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded font-mono">
                        {test.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}