import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  conflicted: string[];
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

interface GitPanelProps {
  projectPath: string;
  onFileSelect: (filePath: string) => void;
  onClose?: () => void;
}

export default function GitPanel({ projectPath, onFileSelect, onClose }: GitPanelProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'history' | 'branches'>('status');
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const runGitCommand = async (args: string[]) => {
    try {
      const result: any = await invoke('execute_command', {
        command: 'git',
        args: args,
        cwd: projectPath
      });
      if (result.code !== 0) {
        console.warn(`Git warning (${args.join(' ')}):`, result.stderr);
      }
      return result.stdout as string;
    } catch (e) {
      console.error('Git command error:', e);
      throw e;
    }
  };

  // Load git status
  const loadGitStatus = async () => {
    setIsLoading(true);
    try {
      const output = await runGitCommand(['status', '--porcelain', '-b']);
      const lines = output.trim().split('\n');

      const newStatus: GitStatus = {
        branch: '',
        ahead: 0,
        behind: 0,
        staged: [],
        modified: [],
        untracked: [],
        conflicted: []
      };

      for (const line of lines) {
        if (!line) continue;
        if (line.startsWith('##')) {
          const branchMatch = line.match(/^##\s+([^.\s]+)/);
          if (branchMatch) newStatus.branch = branchMatch[1];

          const aheadMatch = line.match(/ahead\s+(\d+)/);
          if (aheadMatch) newStatus.ahead = parseInt(aheadMatch[1], 10);

          const behindMatch = line.match(/behind\s+(\d+)/);
          if (behindMatch) newStatus.behind = parseInt(behindMatch[1], 10);
        } else {
          const code = line.substring(0, 2);
          const file = line.substring(3).trim().replace(/^"|"$/g, "");
          if (code === '??') {
            newStatus.untracked.push(file);
          } else if (code.includes('U') || code === 'DD' || code === 'AA') {
            newStatus.conflicted.push(file);
          } else {
            if (code[0] !== ' ' && code[0] !== '?') {
              newStatus.staged.push(file);
            }
            if (code[1] !== ' ' && code[1] !== '?') {
              newStatus.modified.push(file);
            }
          }
        }
      }

      setGitStatus(newStatus);
      setCurrentBranch(newStatus.branch);
    } catch (error) {
      console.error('Git status error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load git history
  const loadGitHistory = async () => {
    try {
      const output = await runGitCommand(['log', '-n', '50', '--pretty=format:%h|%s|%an|%ad', '--date=short']);
      const logs = output.trim().split('\n').filter(Boolean);
      const commitsData: GitCommit[] = logs.map(line => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date, files: [] };
      });
      setCommits(commitsData);
    } catch (error) {
      console.error('Git history error:', error);
    }
  };

  // Load branches
  const loadBranches = async () => {
    try {
      const output = await runGitCommand(['branch', '--format=%(refname:short)']);
      const branchList = output.trim().split('\n').filter(Boolean);
      setBranches(branchList);
    } catch (error) {
      console.error('Git branches error:', error);
    }
  };

  useEffect(() => {
    if (projectPath) {
      loadGitStatus();
      loadGitHistory();
      loadBranches();
    }
  }, [projectPath]);

  const handleStageFile = async (filePath: string) => {
    try {
      await runGitCommand(['add', filePath]);
      loadGitStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnstageFile = async (filePath: string) => {
    try {
      await runGitCommand(['restore', '--staged', filePath]);
      loadGitStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || !gitStatus?.staged.length) return;
    setIsLoading(true);
    try {
      await runGitCommand(['commit', '-m', commitMessage]);
      setCommitMessage('');
      loadGitStatus();
      loadGitHistory();
    } catch (error) {
      alert('Commit error: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    setIsLoading(true);
    try {
      await runGitCommand(['push']);
      loadGitStatus();
    } catch (error) {
      alert('Push error: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    setIsLoading(true);
    try {
      await runGitCommand(['pull']);
      loadGitStatus();
      loadGitHistory();
    } catch (error) {
      alert('Pull error: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBranchSwitch = async (branchName: string) => {
    setIsLoading(true);
    try {
      await runGitCommand(['checkout', branchName]);
      setCurrentBranch(branchName);
      loadGitStatus();
      loadGitHistory();
    } catch (error) {
      alert('Branch switch error: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'ts': '🟦', 'tsx': '🟦', 'js': '🟨', 'jsx': '🟨',
      'rs': '🦀', 'py': '🐍', 'json': '📋', 'md': '📝',
      'css': '🎨', 'html': '🌐', 'txt': '📄'
    };
    return iconMap[ext || ''] || '📄';
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <div className="h-10 bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Git</h3>
          {gitStatus && (
            <span className="text-xs text-[var(--color-textSecondary)]">
              📍 {gitStatus.branch}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {gitStatus && gitStatus.ahead > 0 && (
            <button
              onClick={handlePush}
              disabled={isLoading}
              className="px-2 py-1 text-xs bg-[var(--color-success)] text-white rounded hover:opacity-80 disabled:opacity-50"
            >
              ⬆️ Push ({gitStatus.ahead})
            </button>
          )}

          {gitStatus && gitStatus.behind > 0 && (
            <button
              onClick={handlePull}
              disabled={isLoading}
              className="px-2 py-1 text-xs bg-[var(--color-info)] text-white rounded hover:opacity-80 disabled:opacity-50"
            >
              ⬇️ Pull ({gitStatus.behind})
            </button>
          )}

          <button
            onClick={loadGitStatus}
            disabled={isLoading}
            className="w-6 h-6 flex items-center justify-center hover:bg-[var(--color-hover)] rounded text-xs"
            title="Yenile"
          >
            {isLoading ? '🔄' : '↻'}
          </button>

          {/* Kapatma tuşu */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-[var(--color-textSecondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] rounded transition-colors"
              title="Kapat (ESC)"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="h-8 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex">
        {[
          { id: 'status', label: '📋 Status' },
          { id: 'history', label: '📚 History' },
          { id: 'branches', label: '🌿 Branches' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1 text-xs border-r border-[var(--color-border)] transition-colors ${activeTab === tab.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'hover:bg-[var(--color-hover)]'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'status' && (
          <div className="p-4">
            {!gitStatus ? (
              <div className="text-center text-[var(--color-textSecondary)] py-8">
                <div className="text-2xl mb-2">📊</div>
                <div>Git repository bulunamadı</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Staged Files */}
                {gitStatus.staged.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-green-500">
                      ✅ Staged Changes ({gitStatus.staged.length})
                    </h4>
                    <div className="space-y-1">
                      {gitStatus.staged.map(file => (
                        <div
                          key={file}
                          className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded hover:bg-green-500/20 cursor-pointer"
                          onClick={() => onFileSelect(file)}
                        >
                          <span>{getFileIcon(file)}</span>
                          <span className="flex-1 text-sm font-mono">{file}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnstageFile(file);
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Unstage
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modified Files */}
                {gitStatus.modified.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-yellow-500">
                      📝 Modified ({gitStatus.modified.length})
                    </h4>
                    <div className="space-y-1">
                      {gitStatus.modified.map(file => (
                        <div
                          key={file}
                          className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded hover:bg-yellow-500/20 cursor-pointer"
                          onClick={() => onFileSelect(file)}
                        >
                          <span>{getFileIcon(file)}</span>
                          <span className="flex-1 text-sm font-mono">{file}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageFile(file);
                            }}
                            className="text-xs text-green-400 hover:text-green-300"
                          >
                            Stage
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Untracked Files */}
                {gitStatus.untracked.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-blue-500">
                      ❓ Untracked ({gitStatus.untracked.length})
                    </h4>
                    <div className="space-y-1">
                      {gitStatus.untracked.map(file => (
                        <div
                          key={file}
                          className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded hover:bg-blue-500/20 cursor-pointer"
                          onClick={() => onFileSelect(file)}
                        >
                          <span>{getFileIcon(file)}</span>
                          <span className="flex-1 text-sm font-mono">{file}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageFile(file);
                            }}
                            className="text-xs text-green-400 hover:text-green-300"
                          >
                            Stage
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commit Section */}
                {gitStatus.staged.length > 0 && (
                  <div className="border-t border-[var(--color-border)] pt-4">
                    <h4 className="text-sm font-medium mb-2">💬 Commit Message</h4>
                    <textarea
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Commit mesajınızı yazın..."
                      className="w-full h-20 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none text-sm resize-none"
                    />
                    <button
                      onClick={handleCommit}
                      disabled={!commitMessage.trim() || isLoading}
                      className="mt-2 w-full py-2 bg-[var(--color-success)] text-white rounded hover:opacity-80 disabled:opacity-50 transition-opacity text-sm"
                    >
                      {isLoading ? '🔄 Committing...' : `💾 Commit (${gitStatus.staged.length} files)`}
                    </button>
                  </div>
                )}

                {/* Clean State */}
                {gitStatus.staged.length === 0 && gitStatus.modified.length === 0 && gitStatus.untracked.length === 0 && (
                  <div className="text-center text-[var(--color-textSecondary)] py-8">
                    <div className="text-2xl mb-2">✨</div>
                    <div>Working directory clean</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4">
            <h4 className="text-sm font-medium mb-4">📚 Commit History</h4>

            {commits.length === 0 ? (
              <div className="text-center text-[var(--color-textSecondary)] py-8">
                <div className="text-2xl mb-2">📚</div>
                <div>Commit geçmişi yok</div>
              </div>
            ) : (
              <div className="space-y-3">
                {commits.map(commit => (
                  <div
                    key={commit.hash}
                    className="p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded hover:border-[var(--color-primary)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-[var(--color-textSecondary)]">
                        {commit.hash}
                      </span>
                      <span className="text-xs text-[var(--color-textSecondary)]">
                        {commit.date}
                      </span>
                    </div>

                    <div className="text-sm font-medium mb-1">{commit.message}</div>
                    <div className="text-xs text-[var(--color-textSecondary)] mb-2">
                      👤 {commit.author}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {commit.files.map(file => (
                        <span
                          key={file}
                          className="text-xs bg-[var(--color-surface)] px-2 py-1 rounded cursor-pointer hover:bg-[var(--color-hover)]"
                          onClick={() => onFileSelect(file)}
                        >
                          {getFileIcon(file)} {file.split('/').pop()}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="p-4">
            <h4 className="text-sm font-medium mb-4">🌿 Branches</h4>

            <div className="space-y-2">
              {branches.map(branch => (
                <div
                  key={branch}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${branch === currentBranch
                      ? 'bg-[var(--color-primary)]/20 border border-[var(--color-primary)]'
                      : 'bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'
                    }`}
                  onClick={() => branch !== currentBranch && handleBranchSwitch(branch)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {branch === currentBranch ? '🌟' : '🌿'}
                    </span>
                    <span className="text-sm font-mono">{branch}</span>
                    {branch === currentBranch && (
                      <span className="text-xs text-[var(--color-primary)]">(current)</span>
                    )}
                  </div>

                  {branch !== currentBranch && (
                    <button className="text-xs text-[var(--color-primary)] hover:underline">
                      Switch
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button className="mt-4 w-full py-2 bg-[var(--color-secondary)] text-white rounded hover:opacity-80 transition-opacity text-sm">
              ➕ New Branch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
