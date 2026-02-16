import { useState, useEffect } from 'react';
import { FileIndex } from '../types/index';

interface AnalysisResult {
  file: string;
  issues: Issue[];
  metrics: CodeMetrics;
  suggestions: Suggestion[];
}

interface Issue {
  id: string;
  type: 'error' | 'warning' | 'info' | 'security';
  severity: 'high' | 'medium' | 'low';
  line: number;
  column: number;
  message: string;
  rule: string;
  fixable: boolean;
}

interface CodeMetrics {
  linesOfCode: number;
  complexity: number;
  maintainabilityIndex: number;
  duplicateLines: number;
  testCoverage?: number;
}

interface Suggestion {
  id: string;
  type: 'performance' | 'refactor' | 'best-practice' | 'security';
  title: string;
  description: string;
  before: string;
  after: string;
  impact: 'high' | 'medium' | 'low';
}

interface CodeAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  fileIndex: FileIndex[];
  currentFile?: string;
  onNavigateToIssue: (file: string, line: number) => void;
}

export default function CodeAnalysis({ isOpen, onClose, fileIndex, onNavigateToIssue }: CodeAnalysisProps) {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Auto-analyze when opened
  useEffect(() => {
    if (isOpen && fileIndex.length > 0) {
      analyzeProject();
    }
  }, [isOpen, fileIndex]);

  const analyzeProject = async () => {
    setIsAnalyzing(true);
    const results: AnalysisResult[] = [];

    for (const file of fileIndex) {
      if (shouldAnalyzeFile(file.path)) {
        const analysis = await analyzeFile(file);
        results.push(analysis);
      }
    }

    setAnalysisResults(results);
    setIsAnalyzing(false);
  };

  const shouldAnalyzeFile = (filePath: string): boolean => {
    const analyzableExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.rs', '.java', '.cpp', '.c'];
    return analyzableExtensions.some(ext => filePath.endsWith(ext));
  };

  const analyzeFile = async (file: FileIndex): Promise<AnalysisResult> => {
    const issues = await detectIssues(file);
    const metrics = calculateMetrics(file);
    const suggestions = generateSuggestions(file);

    return {
      file: file.path,
      issues,
      metrics,
      suggestions
    };
  };

  const detectIssues = async (file: FileIndex): Promise<Issue[]> => {
    const issues: Issue[] = [];
    const lines = file.content.split('\n');
    const extension = file.path.split('.').pop()?.toLowerCase();

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // JavaScript/TypeScript specific checks
      if (['js', 'jsx', 'ts', 'tsx'].includes(extension || '')) {
        // Console.log detection
        if (line.includes('console.log')) {
          issues.push({
            id: `console-${lineNumber}`,
            type: 'warning',
            severity: 'low',
            line: lineNumber,
            column: line.indexOf('console.log') + 1,
            message: 'Console.log statement found - consider removing for production',
            rule: 'no-console',
            fixable: true
          });
        }

        // Var usage detection
        if (line.match(/\bvar\s+/)) {
          issues.push({
            id: `var-${lineNumber}`,
            type: 'warning',
            severity: 'medium',
            line: lineNumber,
            column: line.indexOf('var') + 1,
            message: 'Use let or const instead of var',
            rule: 'no-var',
            fixable: true
          });
        }

        // == usage detection
        if (line.includes('==') && !line.includes('===')) {
          issues.push({
            id: `equality-${lineNumber}`,
            type: 'warning',
            severity: 'medium',
            line: lineNumber,
            column: line.indexOf('==') + 1,
            message: 'Use === instead of == for strict equality',
            rule: 'eqeqeq',
            fixable: true
          });
        }

        // TODO/FIXME detection
        if (line.match(/\/\/\s*(TODO|FIXME|HACK)/i)) {
          issues.push({
            id: `todo-${lineNumber}`,
            type: 'info',
            severity: 'low',
            line: lineNumber,
            column: 1,
            message: 'TODO/FIXME comment found',
            rule: 'no-todo',
            fixable: false
          });
        }

        // Security: eval usage
        if (line.includes('eval(')) {
          issues.push({
            id: `eval-${lineNumber}`,
            type: 'security',
            severity: 'high',
            line: lineNumber,
            column: line.indexOf('eval(') + 1,
            message: 'Use of eval() is dangerous and should be avoided',
            rule: 'no-eval',
            fixable: false
          });
        }

        // Long line detection
        if (line.length > 120) {
          issues.push({
            id: `line-length-${lineNumber}`,
            type: 'warning',
            severity: 'low',
            line: lineNumber,
            column: 121,
            message: 'Line too long (>120 characters)',
            rule: 'max-len',
            fixable: false
          });
        }
      }

      // Python specific checks
      if (extension === 'py') {
        // Print statement detection
        if (line.match(/\bprint\s*\(/)) {
          issues.push({
            id: `print-${lineNumber}`,
            type: 'info',
            severity: 'low',
            line: lineNumber,
            column: line.indexOf('print') + 1,
            message: 'Print statement found - consider using logging',
            rule: 'no-print',
            fixable: false
          });
        }

        // Import * detection
        if (line.match(/from\s+\w+\s+import\s+\*/)) {
          issues.push({
            id: `import-star-${lineNumber}`,
            type: 'warning',
            severity: 'medium',
            line: lineNumber,
            column: 1,
            message: 'Avoid using "from module import *"',
            rule: 'no-import-star',
            fixable: false
          });
        }
      }

      // General checks for all languages
      // Trailing whitespace
      if (line.match(/\s+$/)) {
        issues.push({
          id: `trailing-space-${lineNumber}`,
          type: 'warning',
          severity: 'low',
          line: lineNumber,
          column: line.length,
          message: 'Trailing whitespace',
          rule: 'no-trailing-spaces',
          fixable: true
        });
      }

      // Mixed tabs and spaces
      if (line.includes('\t') && line.includes('  ')) {
        issues.push({
          id: `mixed-indent-${lineNumber}`,
          type: 'error',
          severity: 'medium',
          line: lineNumber,
          column: 1,
          message: 'Mixed tabs and spaces for indentation',
          rule: 'no-mixed-spaces-and-tabs',
          fixable: true
        });
      }
    });

    return issues;
  };

  const calculateMetrics = (file: FileIndex): CodeMetrics => {
    const lines = file.content.split('\n');
    const codeLines = lines.filter(line => 
      line.trim() && 
      !line.trim().startsWith('//') && 
      !line.trim().startsWith('#') &&
      !line.trim().startsWith('/*') &&
      !line.trim().startsWith('*')
    );

    // Simple complexity calculation (cyclomatic complexity approximation)
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', 'try'];
    let complexity = 1; // Base complexity
    
    file.content.split(/\s+/).forEach(word => {
      if (complexityKeywords.includes(word)) {
        complexity++;
      }
    });

    // Maintainability Index (simplified calculation)
    const linesOfCode = codeLines.length;
    const maintainabilityIndex = Math.max(0, Math.min(100, 
      171 - 5.2 * Math.log(linesOfCode) - 0.23 * complexity - 16.2 * Math.log(linesOfCode / 1000 + 1)
    ));

    // Duplicate lines detection (simplified)
    const lineMap = new Map<string, number>();
    let duplicateLines = 0;
    
    codeLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 10) { // Only check substantial lines
        const count = lineMap.get(trimmed) || 0;
        lineMap.set(trimmed, count + 1);
        if (count === 1) duplicateLines++;
      }
    });

    return {
      linesOfCode,
      complexity,
      maintainabilityIndex: Math.round(maintainabilityIndex),
      duplicateLines
    };
  };

  const generateSuggestions = (file: FileIndex): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const extension = file.path.split('.').pop()?.toLowerCase();

    // JavaScript/TypeScript suggestions
    if (['js', 'jsx', 'ts', 'tsx'].includes(extension || '')) {
      if (file.content.includes('var ')) {
        suggestions.push({
          id: 'use-const-let',
          type: 'best-practice',
          title: 'Use const/let instead of var',
          description: 'Replace var declarations with const or let for better scoping',
          before: 'var name = "John";',
          after: 'const name = "John";',
          impact: 'medium'
        });
      }

      if (file.content.includes('function(')) {
        suggestions.push({
          id: 'arrow-functions',
          type: 'refactor',
          title: 'Consider using arrow functions',
          description: 'Arrow functions provide cleaner syntax and lexical this binding',
          before: 'array.map(function(item) { return item * 2; })',
          after: 'array.map(item => item * 2)',
          impact: 'low'
        });
      }

      if (file.content.includes('== ') || file.content.includes('!= ')) {
        suggestions.push({
          id: 'strict-equality',
          type: 'best-practice',
          title: 'Use strict equality operators',
          description: 'Use === and !== for type-safe comparisons',
          before: 'if (value == "5")',
          after: 'if (value === "5")',
          impact: 'high'
        });
      }
    }

    // Performance suggestions
    if (file.content.includes('document.getElementById')) {
      suggestions.push({
        id: 'cache-dom-queries',
        type: 'performance',
        title: 'Cache DOM queries',
        description: 'Store DOM element references to avoid repeated queries',
        before: 'document.getElementById("myId").style.color = "red";\ndocument.getElementById("myId").style.background = "blue";',
        after: 'const element = document.getElementById("myId");\nelement.style.color = "red";\nelement.style.background = "blue";',
        impact: 'medium'
      });
    }

    return suggestions;
  };

  const getOverviewStats = () => {
    const totalIssues = analysisResults.reduce((sum, result) => sum + result.issues.length, 0);
    const errorCount = analysisResults.reduce((sum, result) => 
      sum + result.issues.filter(issue => issue.type === 'error').length, 0);
    const warningCount = analysisResults.reduce((sum, result) => 
      sum + result.issues.filter(issue => issue.type === 'warning').length, 0);
    const securityCount = analysisResults.reduce((sum, result) => 
      sum + result.issues.filter(issue => issue.type === 'security').length, 0);
    
    const avgComplexity = analysisResults.length > 0 
      ? analysisResults.reduce((sum, result) => sum + result.metrics.complexity, 0) / analysisResults.length
      : 0;
    
    const avgMaintainability = analysisResults.length > 0
      ? analysisResults.reduce((sum, result) => sum + result.metrics.maintainabilityIndex, 0) / analysisResults.length
      : 0;

    return {
      totalIssues,
      errorCount,
      warningCount,
      securityCount,
      avgComplexity: Math.round(avgComplexity),
      avgMaintainability: Math.round(avgMaintainability),
      filesAnalyzed: analysisResults.length
    };
  };

  const filteredResults = analysisResults.filter(result => {
    if (selectedFile && result.file !== selectedFile) return false;
    return true;
  });

  const filteredIssues = filteredResults.flatMap(result => 
    result.issues.filter(issue => {
      if (filterType !== 'all' && issue.type !== filterType) return false;
      if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
      return true;
    }).map(issue => ({ ...issue, file: result.file }))
  );

  if (!isOpen) return null;

  const stats = getOverviewStats();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="h-12 bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Code Analysis</h3>
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-yellow-500">
                  <div className="animate-spin">⚙️</div>
                  <span className="text-xs">Analyzing...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={analyzeProject}
                disabled={isAnalyzing}
                className="px-3 py-1 bg-[var(--color-primary)] text-white rounded text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                🔄 Re-analyze
              </button>
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center text-[var(--color-textSecondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] rounded transition-colors"
                title="Close (ESC)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
            <div className="flex">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'issues', name: 'Issues', icon: '⚠️' },
                { id: 'metrics', name: 'Metrics', icon: '📈' },
                { id: 'suggestions', name: 'Suggestions', icon: '💡' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-transparent text-[var(--color-textSecondary)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-center">
                    <div className="text-2xl font-bold text-[var(--color-primary)]">{stats.filesAnalyzed}</div>
                    <div className="text-sm text-[var(--color-textSecondary)]">Files Analyzed</div>
                  </div>
                  <div className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-center">
                    <div className="text-2xl font-bold text-red-500">{stats.totalIssues}</div>
                    <div className="text-sm text-[var(--color-textSecondary)]">Total Issues</div>
                  </div>
                  <div className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-center">
                    <div className="text-2xl font-bold text-orange-500">{stats.avgComplexity}</div>
                    <div className="text-sm text-[var(--color-textSecondary)]">Avg Complexity</div>
                  </div>
                  <div className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-center">
                    <div className="text-2xl font-bold text-green-500">{stats.avgMaintainability}</div>
                    <div className="text-sm text-[var(--color-textSecondary)]">Maintainability</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                    <h4 className="font-semibold mb-3">Issue Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-red-500 rounded"></span>
                          Errors
                        </span>
                        <span>{stats.errorCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                          Warnings
                        </span>
                        <span>{stats.warningCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-purple-500 rounded"></span>
                          Security
                        </span>
                        <span>{stats.securityCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                    <h4 className="font-semibold mb-3">Top Issues</h4>
                    <div className="space-y-2 text-sm">
                      {filteredIssues.slice(0, 5).map((issue) => (
                        <div key={issue.id} className="flex justify-between items-center">
                          <span className="truncate">{issue.message}</span>
                          <button
                            onClick={() => onNavigateToIssue(issue.file, issue.line)}
                            className="text-[var(--color-primary)] hover:underline text-xs"
                          >
                            Go to
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === 'issues' && (
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <select
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  >
                    <option value="">All Files</option>
                    {analysisResults.map(result => (
                      <option key={result.file} value={result.file}>
                        {result.file.split('/').pop()} ({result.issues.length} issues)
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  >
                    <option value="all">All Types</option>
                    <option value="error">Errors</option>
                    <option value="warning">Warnings</option>
                    <option value="info">Info</option>
                    <option value="security">Security</option>
                  </select>
                  
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                  >
                    <option value="all">All Severities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="space-y-2">
                  {filteredIssues.map((issue) => (
                    <div key={`${issue.file}-${issue.id}`} className="p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${
                              issue.type === 'error' ? 'bg-red-500' :
                              issue.type === 'warning' ? 'bg-yellow-500' :
                              issue.type === 'security' ? 'bg-purple-500' : 'bg-blue-500'
                            }`}></span>
                            <span className="font-medium">{issue.message}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                              issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {issue.severity}
                            </span>
                          </div>
                          <div className="text-sm text-[var(--color-textSecondary)]">
                            {issue.file.split('/').pop()}:{issue.line}:{issue.column} - {issue.rule}
                          </div>
                        </div>
                        <button
                          onClick={() => onNavigateToIssue(issue.file, issue.line)}
                          className="px-3 py-1 bg-[var(--color-primary)] text-white rounded text-sm hover:opacity-80 transition-opacity"
                        >
                          Go to Line
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <div className="space-y-4">
                {analysisResults.map(result => (
                  <div key={result.file} className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                    <h4 className="font-semibold mb-3">{result.file.split('/').pop()}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold">{result.metrics.linesOfCode}</div>
                        <div className="text-sm text-[var(--color-textSecondary)]">Lines of Code</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{result.metrics.complexity}</div>
                        <div className="text-sm text-[var(--color-textSecondary)]">Complexity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{result.metrics.maintainabilityIndex}</div>
                        <div className="text-sm text-[var(--color-textSecondary)]">Maintainability</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{result.metrics.duplicateLines}</div>
                        <div className="text-sm text-[var(--color-textSecondary)]">Duplicate Lines</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-4">
                {analysisResults.flatMap(result => result.suggestions).map(suggestion => (
                  <div key={suggestion.id} className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        <p className="text-sm text-[var(--color-textSecondary)]">{suggestion.description}</p>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            suggestion.type === 'performance' ? 'bg-green-100 text-green-800' :
                            suggestion.type === 'security' ? 'bg-red-100 text-red-800' :
                            suggestion.type === 'refactor' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {suggestion.type}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            suggestion.impact === 'high' ? 'bg-red-100 text-red-800' :
                            suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {suggestion.impact} impact
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <h5 className="text-sm font-medium mb-1">Before:</h5>
                        <pre className="text-xs bg-red-50 p-2 rounded border border-red-200 overflow-x-auto">
                          <code>{suggestion.before}</code>
                        </pre>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium mb-1">After:</h5>
                        <pre className="text-xs bg-green-50 p-2 rounded border border-green-200 overflow-x-auto">
                          <code>{suggestion.after}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}