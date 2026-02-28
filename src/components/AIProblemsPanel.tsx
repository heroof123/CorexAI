// components/AIProblemsPanel.tsx
// VS Code'daki "Problems" paneli gibi — AI otomatik analiz sonuçlarını gösterir.
// Kullanıcı hiçbir şey yapmadan açık dosyadaki sorunları burada görür.

import { useState } from 'react';
import type { FileAnalysisResult, AIIssue } from '../hooks/useAIBackgroundAnalysis';
import { MirrorDebugger } from './MirrorDebugger';
import { collectiveIntelligenceService, ErrorInsight } from '../services/collectiveIntelligence';

interface AIProblemsPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    currentFileResult: FileAnalysisResult | null;
    allResults: FileAnalysisResult[];
    isAnalyzing: boolean;
    currentlyAnalyzing: string | null;
    selectedFile: string;
    onFileClick?: (filePath: string) => void;
}

type PanelTab = 'current' | 'all';

export default function AIProblemsPanel({
    isOpen,
    onToggle,
    currentFileResult,
    allResults,
    isAnalyzing,
    currentlyAnalyzing,
    selectedFile,
    onFileClick,
}: AIProblemsPanelProps) {
    const [tab, setTab] = useState<PanelTab>('current');

    // Feature States
    const [mirrorSubject, setMirrorSubject] = useState<{ code: string, error: string } | null>(null);
    const [ciLoadingId, setCiLoadingId] = useState<string | null>(null);
    const [ciResults, setCiResults] = useState<Record<string, ErrorInsight[]>>({});

    const allIssues = allResults.flatMap(r => r.issues);
    const criticalCount = allIssues.filter(i => i.severity === 'high').length;
    const warningCount = allIssues.filter(i => i.severity === 'medium').length;

    const scoreColor = (score: number) =>
        score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';

    const severityStyle = (sev: AIIssue['severity']) => ({
        high: { bg: '#ef444420', color: '#ef4444', label: '🔴' },
        medium: { bg: '#eab30820', color: '#eab308', label: '🟡' },
        low: { bg: '#3b82f620', color: '#3b82f6', label: '🔵' },
    }[sev]);

    return (
        <>
            {/* ── Status bar benzeri tab tetikleyici ───────────────────── */}
            <div
                onClick={onToggle}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0 10px', height: '100%', cursor: 'pointer',
                    background: isOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                    borderRadius: 4, userSelect: 'none',
                    transition: 'background 0.15s',
                }}
                title="AI Sorun Analizi (otomatik)"
            >
                {isAnalyzing ? (
                    <span style={{ fontSize: 11, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span>
                ) : (
                    <span style={{ fontSize: 11 }}>🤖</span>
                )}
                {criticalCount > 0 && (
                    <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 600 }}>
                        ⊘ {criticalCount}
                    </span>
                )}
                {warningCount > 0 && (
                    <span style={{ color: '#eab308', fontSize: 11, fontWeight: 600 }}>
                        ⚠ {warningCount}
                    </span>
                )}
                {criticalCount === 0 && warningCount === 0 && !isAnalyzing && allResults.length > 0 && (
                    <span style={{ color: '#22c55e', fontSize: 11 }}>✓</span>
                )}
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>AI</span>
            </div>

            {/* ── Panel ───────────────────────────────────────────────── */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: 28,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'min(840px, 90vw)',
                    maxHeight: 380,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px 12px 0 0',
                    boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 8000,
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                        flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 14, marginRight: 8 }}>🤖</span>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: 13, flex: 1 }}>
                            AI Sorun Analizi
                            {isAnalyzing && (
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginLeft: 8 }}>
                                    — {currentlyAnalyzing?.split(/[/\\]/).pop()} analiz ediliyor...
                                </span>
                            )}
                        </span>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 4, marginRight: 12 }}>
                            {(['current', 'all'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    style={{
                                        padding: '3px 10px', borderRadius: 6, border: 'none',
                                        fontSize: 11, cursor: 'pointer', fontWeight: 500,
                                        background: tab === t ? 'rgba(255,255,255,0.2)' : 'transparent',
                                        color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {t === 'current' ? 'Aktif Dosya' : `Tüm Proje (${allResults.length})`}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={onToggle}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 16 }}
                        >✕</button>
                    </div>

                    {/* Content */}
                    <div style={{ overflow: 'auto', flex: 1, padding: '8px 0' }}>
                        {tab === 'current' ? (
                            /* Aktif dosya sonuçları */
                            !selectedFile ? (
                                <div style={{ padding: '24px 16px', color: 'var(--color-textSecondary)', fontSize: 13, textAlign: 'center' }}>
                                    Dosya açın — AI otomatik analiz edecek 🤖
                                </div>
                            ) : isAnalyzing && currentlyAnalyzing === selectedFile ? (
                                <div style={{ padding: '24px 16px', color: 'var(--color-textSecondary)', fontSize: 13, textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
                                    AI analiz ediyor... lütfen bekleyin
                                </div>
                            ) : !currentFileResult ? (
                                <div style={{ padding: '24px 16px', color: 'var(--color-textSecondary)', fontSize: 13, textAlign: 'center' }}>
                                    {isAnalyzing ? '⏳ Sıra bekleniyor...' : '🔍 Henüz analiz edilmedi'}
                                </div>
                            ) : (
                                <div>
                                    {/* Özet bar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '6px 16px 10px', borderBottom: '1px solid var(--color-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: `${scoreColor(currentFileResult.score)}22`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <span style={{ fontWeight: 700, fontSize: 14, color: scoreColor(currentFileResult.score) }}>
                                                    {currentFileResult.score}
                                                </span>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 600 }}>{currentFileResult.fileName}</div>
                                                <div style={{ fontSize: 10, color: 'var(--color-textSecondary)' }}>
                                                    {currentFileResult.issues.length} sorun · {currentFileResult.suggestions.length} öneri
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, fontSize: 12, color: 'var(--color-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {currentFileResult.summary}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--color-textSecondary)', flexShrink: 0 }}>
                                            {new Date(currentFileResult.analyzedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    {/* Sorunlar */}
                                    {currentFileResult.issues.length === 0 ? (
                                        <div style={{ padding: '16px', color: '#22c55e', fontSize: 13, textAlign: 'center' }}>
                                            ✅ Sorun bulunamadı!
                                        </div>
                                    ) : (
                                        currentFileResult.issues.map((issue, idx) => {
                                            const style = severityStyle(issue.severity);
                                            return (
                                                <div key={idx} style={{
                                                    display: 'flex', flexDirection: 'column',
                                                    padding: '7px 16px',
                                                    borderBottom: '1px solid var(--color-border)10',
                                                    cursor: 'default',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                        <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{style.label}</span>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <span style={{ fontSize: 12 }}>{issue.message}</span>
                                                        </div>
                                                        {issue.line > 0 && (
                                                            <code style={{
                                                                fontSize: 10, flexShrink: 0,
                                                                background: 'var(--color-background)',
                                                                padding: '1px 5px', borderRadius: 3,
                                                                color: 'var(--color-textSecondary)',
                                                            }}>:{issue.line}</code>
                                                        )}
                                                        <span style={{
                                                            fontSize: 10, flexShrink: 0,
                                                            padding: '1px 6px', borderRadius: 3,
                                                            background: style.bg, color: style.color,
                                                        }}>{issue.type}</span>
                                                    </div>

                                                    {/* Futuristic Tools row */}
                                                    <div style={{ marginLeft: 36, marginTop: 4, display: 'flex', gap: 8 }}>
                                                        <button
                                                            onClick={() => setMirrorSubject({ code: `// File: ${currentFileResult.fileName}\n// Line: ${issue.line}`, error: issue.message })}
                                                            style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#4f46e530', color: '#818cf8', border: '1px solid #4f46e550', cursor: 'pointer' }}
                                                        >
                                                            🪞 Mirror Debug
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const id = `${currentFileResult.filePath}-${idx}`;
                                                                setCiLoadingId(id);
                                                                const results = await collectiveIntelligenceService.analyzeError(issue.message, "");
                                                                setCiResults(prev => ({ ...prev, [id]: results }));
                                                                setCiLoadingId(null);
                                                            }}
                                                            style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#0ea5e930', color: '#38bdf8', border: '1px solid #0ea5e950', cursor: 'pointer' }}
                                                        >
                                                            {ciLoadingId === `${currentFileResult.filePath}-${idx}` ? '🌐 İnternette Aranıyor...' : '🌐 İnternette Çözüm Ara'}
                                                        </button>
                                                    </div>

                                                    {/* Collective Intelligence Results */}
                                                    {ciResults[`${currentFileResult.filePath}-${idx}`] && (
                                                        <div style={{ marginLeft: 36, marginTop: 8, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, borderLeft: '2px solid #38bdf8' }}>
                                                            <div style={{ fontSize: 10, color: '#38bdf8', marginBottom: 6, fontWeight: 600 }}>Kolektif Zeka (İnternet Tarama Sonuçları)</div>
                                                            {ciResults[`${currentFileResult.filePath}-${idx}`].length === 0 ? (
                                                                <div style={{ fontSize: 11, color: '#aaa' }}>İnternette bu hatayla ilgili çözüm bulunamadı.</div>
                                                            ) : (
                                                                ciResults[`${currentFileResult.filePath}-${idx}`].map((res, i) => (
                                                                    <div key={i} style={{
                                                                        marginBottom: 6,
                                                                        background: res.isSafe ? 'transparent' : 'rgba(239, 68, 68, 0.1)',
                                                                        borderLeft: res.isSafe ? 'none' : '2px solid #ef4444',
                                                                        padding: res.isSafe ? 0 : 6,
                                                                        borderRadius: res.isSafe ? 0 : 4
                                                                    }}>
                                                                        <a href={res.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: res.isSafe ? '#60a5fa' : '#ef4444', textDecoration: res.isSafe ? 'none' : 'line-through', display: 'block', marginBottom: 2 }}>
                                                                            {res.isSafe ? res.title : `☠️ [ENGELLENDİ] ${res.title}`}
                                                                        </a>
                                                                        <div style={{ fontSize: 10, color: res.isSafe ? '#ccc' : '#fca5a5' }}>{res.summary}</div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}

                                    {/* Öneriler */}
                                    {currentFileResult.suggestions.length > 0 && (
                                        <div style={{ padding: '8px 16px' }}>
                                            <div style={{ fontSize: 11, color: 'var(--color-textSecondary)', marginBottom: 4 }}>💡 Öneriler</div>
                                            {currentFileResult.suggestions.slice(0, 3).map((s, idx) => (
                                                <div key={idx} style={{ fontSize: 12, color: 'var(--color-textSecondary)', padding: '2px 0' }}>• {s}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            /* Tüm proje */
                            allResults.length === 0 ? (
                                <div style={{ padding: '24px 16px', color: 'var(--color-textSecondary)', fontSize: 13, textAlign: 'center' }}>
                                    Henüz dosya analiz edilmedi. Bir dosya açtığınızda AI otomatik tarar.
                                </div>
                            ) : (
                                [...allResults].sort((a, b) => a.score - b.score).map(result => (
                                    <div
                                        key={result.filePath}
                                        onClick={() => onFileClick?.(result.filePath)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '8px 16px',
                                            borderBottom: '1px solid var(--color-border)20',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: `${scoreColor(result.score)}22`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <span style={{ fontWeight: 700, fontSize: 12, color: scoreColor(result.score) }}>
                                                {result.score}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {result.fileName}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--color-textSecondary)' }}>
                                                {result.issues.length} sorun · {result.suggestions.length} öneri
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                            {result.issues.filter(i => i.severity === 'high').length > 0 && (
                                                <span style={{ padding: '1px 6px', background: '#ef444420', color: '#ef4444', borderRadius: 4, fontSize: 10 }}>
                                                    🔴 {result.issues.filter(i => i.severity === 'high').length}
                                                </span>
                                            )}
                                            {result.issues.filter(i => i.severity === 'medium').length > 0 && (
                                                <span style={{ padding: '1px 6px', background: '#eab30820', color: '#eab308', borderRadius: 4, fontSize: 10 }}>
                                                    🟡 {result.issues.filter(i => i.severity === 'medium').length}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>

                    {/* Mirror Debugger Overlay */}
                    {mirrorSubject && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 9000
                        }}>
                            <MirrorDebugger
                                codeSnippet={mirrorSubject.code}
                                errorMessage={mirrorSubject.error}
                                onClose={() => setMirrorSubject(null)}
                            />
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
