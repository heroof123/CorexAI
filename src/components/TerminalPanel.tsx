import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface TerminalPanelProps {
  projectPath: string;
  isVisible: boolean;
  onClose: () => void;
}

interface TerminalOutput {
  type: "command" | "output" | "error";
  content: string;
  timestamp: number;
}

export default function TerminalPanel({ projectPath, isVisible, onClose }: TerminalPanelProps) {
  const [command, setCommand] = useState("");
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentDir, setCurrentDir] = useState(projectPath || "");
  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (projectPath) {
      setCurrentDir(projectPath);
      setOutputs([{
        type: "output",
        content: `Terminal başlatıldı. Dizin: ${projectPath}\nKomutları çalıştırmak için yazın ve Enter'a basın.\n`,
        timestamp: Date.now()
      }]);
    }
  }, [projectPath]);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [outputs]);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || isExecuting) return;

    // Komutu history'e ekle
    setOutputs(prev => [...prev, {
      type: "command",
      content: `$ ${cmd}`,
      timestamp: Date.now()
    }]);

    setCommand("");
    setIsExecuting(true);

    try {
      const result = await invoke<{ stdout: string; stderr: string; success: boolean }>(
        "execute_terminal_command",
        { command: cmd, path: currentDir || projectPath }
      );

      if (result.stderr && result.stderr.trim()) {
        setOutputs(prev => [...prev, {
          type: "error",
          content: result.stderr,
          timestamp: Date.now()
        }]);
      }

      if (result.stdout && result.stdout.trim()) {
        setOutputs(prev => [...prev, {
          type: "output",
          content: result.stdout,
          timestamp: Date.now()
        }]);
      }

      // cd komutu özel işleme
      if (cmd.trim().startsWith("cd ")) {
        const newPath = cmd.trim().substring(3).trim().replace(/['"]/g, "");
        if (newPath) {
          setCurrentDir(prev => {
            const updated = newPath.startsWith("/") || newPath.startsWith("C:") 
              ? newPath 
              : `${prev}/${newPath}`;
            return updated.replace(/\\/g, "/");
          });
        }
      }

    } catch (err) {
      setOutputs(prev => [...prev, {
        type: "error",
        content: `Hata: ${err}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsExecuting(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(command);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeCommand(command);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-[#1e1e1e] z-50 flex flex-col">
      {/* Terminal Header */}
      <div className="h-8 border-b border-neutral-800 px-4 flex items-center justify-between bg-[#181818] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">🖥️ Terminal</span>
          {currentDir && (
            <span className="text-xs text-neutral-500">• {currentDir.split(/[\\/]/).pop()}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-xs text-neutral-400 hover:text-white px-2 py-1 hover:bg-neutral-800 rounded transition-colors"
        >
          ✕ Kapat
        </button>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-black text-green-400 min-h-0">
        {outputs.map((output, index) => (
          <div
            key={index}
            className={`mb-1 whitespace-pre-wrap break-words ${
              output.type === "command"
                ? "text-blue-400"
                : output.type === "error"
                ? "text-red-400"
                : "text-green-400"
            }`}
          >
            {output.content}
          </div>
        ))}
        {isExecuting && (
          <div className="text-yellow-400 animate-pulse">Çalışıyor...</div>
        )}
        <div ref={outputEndRef} />
      </div>

      {/* Terminal Input */}
      <div className="border-t border-neutral-800 bg-[#181818] p-2 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="text-xs text-green-400 font-mono">
            {currentDir ? currentDir.split(/[\\/]/).pop() : "~"} $&gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isExecuting}
            className="flex-1 bg-transparent text-green-400 text-xs font-mono outline-none focus:outline-none disabled:opacity-50"
            placeholder={isExecuting ? "Komut çalışıyor..." : "Komut girin..."}
          />
        </form>
        <div className="text-[10px] text-neutral-500 mt-1 px-1">
          💡 İpucu: npm, git, ls, cd gibi komutları kullanabilirsiniz
        </div>
      </div>
    </div>
  );
}
