import { useState, useMemo } from 'react';
import { FileIndex } from '../types/index';
import { callAI } from '../services/ai/aiProvider';
import { invoke } from '@tauri-apps/api/core';

interface TechDebtTrackerProps {
    fileIndex: FileIndex[];
    onFileClick: (path: string, line?: number) => void;
}

interface DebtItem {
    id: string;
    type: 'TODO' | 'FIXME' | 'HACK';
    content: string;
    filePath: string;
    line: number;
}

export default function TechDebtTracker({ fileIndex, onFileClick }: TechDebtTrackerProps) {
    const [filter, setFilter] = useState<'ALL' | 'TODO' | 'FIXME' | 'HACK'>('ALL');
    const [fixingId, setFixingId] = useState<string | null>(null);

    const handleAIFix = async (e: React.MouseEvent, item: DebtItem) => {
        e.stopPropagation();
        setFixingId(item.id);

        try {
            const file = fileIndex.find(f => f.path === item.filePath);
            if (!file) throw new Error("Dosya bulunamadı");

            const contextStart = Math.max(0, item.line - 15);
            const contextEnd = Math.min(file.content.split('\n').length, item.line + 15);
            const fileLines = file.content.split('\n');
            const contextStr = fileLines.slice(contextStart, contextEnd).map((l, i) => `${contextStart + i + 1}| ${l}`).join('\n');

            const prompt = `Sen kıdemli bir yazılımcısın. Aşağıdaki koddaki "// ${item.type}: ${item.content}" işaretli teknik borcu (tech debt/todo/fixme/hack) DÜZELTMEN gerekiyor.
Dosya Yolu: ${item.filePath}
Sorunlu Satır: ${item.line}

BAĞLAM (Satır Numaralı):
${contextStr}

YALNIZCA değişen satırları aşağıdaki formatta döndür:
<<<SEARCH
(eski satırlar)
===
(yeni kodlar)
>>>REPLACE

Eğer tüm dosyayı değiştirmen gerekiyorsa, direk kod bloğu olarak ver. Başka hiçbir açıklama yapma.`;

            let response = await callAI(prompt, "main");

            // Eğer <<<SEARCH === >>>REPLACE varsa, bu formatı parse et (basitçe)
            if (response.includes("<<<SEARCH") && response.includes(">>>REPLACE")) {
                const searchPart = response.split('<<<SEARCH')[1].split('===')[0].trim();
                const replacePart = response.split('===')[1].split('>>>REPLACE')[0].trim();

                const newContent = file.content.replace(searchPart, replacePart);
                await invoke("write_file", { path: item.filePath, content: newContent });
            } else {
                // Eğer doğrudan kod verdiyse
                if (response.startsWith("\`\`\`")) {
                    response = response.replace(/^\`\`\`(?:\w+)?\n([\s\S]*?)\`\`\`$/, '$1').trim();
                }
                await invoke("write_file", { path: item.filePath, content: response });
            }
            alert(`✅ ${item.type} başarıyla çözüldü! Lütfen dosyadaki değişikliği kontrol et.`);
        } catch (err) {
            console.error(err);
            alert(`❌ Hata: Kod düzeltilemedi.`);
        } finally {
            setFixingId(null);
        }
    };

    const debtItems = useMemo(() => {
        const items: DebtItem[] = [];

        fileIndex.forEach((file) => {
            if (!file.content) return;

            const lines = file.content.split('\n');
            lines.forEach((lineText, index) => {
                // Regex to find // TODO, // FIXME, // HACK with optional colon
                const match = lineText.match(/\/\/\s*(TODO|FIXME|HACK)[\s:]*(.*)/i);
                if (match) {
                    items.push({
                        id: `${file.path}-${index}`,
                        type: match[1].toUpperCase() as 'TODO' | 'FIXME' | 'HACK',
                        content: match[2].trim() || 'No description',
                        filePath: file.path,
                        line: index + 1,
                    });
                }
            });
        });

        return items;
    }, [fileIndex]);

    const filteredItems = filter === 'ALL'
        ? debtItems
        : debtItems.filter(item => item.type === filter);

    // Group by type for the Kanban view
    const todos = debtItems.filter(i => i.type === 'TODO');
    const fixmes = debtItems.filter(i => i.type === 'FIXME');
    const hacks = debtItems.filter(i => i.type === 'HACK');

    const KanbanColumn = ({ title, items, colorClass }: { title: string, items: DebtItem[], colorClass: string }) => (
        <div className="flex flex-col flex-1 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)] p-3 overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                    {title}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${colorClass} bg-opacity-20 bg-current`}>
                        {items.length}
                    </span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {items.length === 0 ? (
                    <div className="text-center text-xs text-[var(--color-textSecondary)] py-4 italic">
                        Tertemiz!
                    </div>
                ) : (
                    items.map(item => (
                        <div
                            key={item.id}
                            onClick={() => onFileClick(item.filePath, item.line)}
                            className="bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-2.5 rounded cursor-pointer transition-colors group"
                        >
                            <div className="text-xs font-medium text-[var(--color-text)] mb-1 break-words">
                                {item.content}
                            </div>
                            <div className="text-[10px] text-[var(--color-textSecondary)] flex justify-between items-center">
                                <span className="truncate max-w-[120px]" title={item.filePath.split(/[\\/]/).pop()}>
                                    📂 {item.filePath.split(/[\\/]/).pop()}
                                </span>
                                <span className="shrink-0 bg-[var(--color-background)] px-1.5 py-0.5 rounded text-[8px] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                                    Line {item.line}
                                </span>
                            </div>
                            <button
                                onClick={(e) => handleAIFix(e, item)}
                                disabled={fixingId === item.id}
                                className="mt-2 w-full text-[9px] py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded border border-blue-500/30 transition-all font-bold tracking-widest uppercase disabled:opacity-50"
                            >
                                {fixingId === item.id ? 'Fixing...' : '🌟 AI Autofix'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-[var(--color-surface)]">
            <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
                <h2 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
                    📊 Tech Debt & Todo Tracker
                </h2>

                <div className="flex gap-1 bg-[var(--color-background)] p-1 rounded-md border border-[var(--color-border)]">
                    {['ALL', 'TODO', 'FIXME', 'HACK'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-2.5 py-1 text-[10px] rounded font-medium transition-colors ${filter === f
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'text-[var(--color-textSecondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0 p-4">
                {filter === 'ALL' ? (
                    <div className="flex flex-row h-full gap-4 w-full overflow-x-auto min-w-full">
                        <KanbanColumn title="📝 TODOs" items={todos} colorClass="text-blue-500" />
                        <KanbanColumn title="🔥 FIXMEs" items={fixmes} colorClass="text-red-500" />
                        <KanbanColumn title="💀 HACKs" items={hacks} colorClass="text-orange-500" />
                    </div>
                ) : (
                    <div className="h-full flex flex-col bg-[var(--color-background)] rounded-lg border border-[var(--color-border)] p-3">
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                            {filteredItems.map(item => {
                                let badgeColor = "text-blue-500 border-blue-500/30 bg-blue-500/10";
                                if (item.type === 'FIXME') badgeColor = "text-red-500 border-red-500/30 bg-red-500/10";
                                if (item.type === 'HACK') badgeColor = "text-orange-500 border-orange-500/30 bg-orange-500/10";

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => onFileClick(item.filePath, item.line)}
                                        className="bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-3 rounded cursor-pointer transition-colors group flex items-start gap-3"
                                    >
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor} shrink-0 mt-0.5`}>
                                            {item.type}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-[var(--color-text)] mb-1.5">
                                                {item.content}
                                            </div>
                                            <div className="text-[10px] text-[var(--color-textSecondary)] font-mono flex gap-2">
                                                <span>{item.filePath.split(/[\\/]/).pop()}</span>
                                                <span className="text-[var(--color-border)]">|</span>
                                                <span>Satır {item.line}</span>
                                            </div>
                                            <div className="flex gap-2 w-full mt-2">
                                                <button
                                                    onClick={(e) => handleAIFix(e, item)}
                                                    disabled={fixingId === item.id}
                                                    className="w-full text-[9px] py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded border border-blue-500/30 transition-all font-bold tracking-widest uppercase disabled:opacity-50"
                                                >
                                                    {fixingId === item.id ? 'Kod Düzeltiliyor...' : '🌟 AI Autofix İle Çöz'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
