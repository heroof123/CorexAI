import { useState } from 'react';
import { semanticLinter, LinterIssue } from '../services/semanticLinter';

export const SemanticLinterView: React.FC = () => {
    const [issues, setIssues] = useState<LinterIssue[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    const handleScan = async () => {
        setIsScanning(true);
        try {
            const results = await semanticLinter.scanProject();
            setIssues(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] p-4 gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-purple-400">Semantic Linter</h3>
                <button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="px-4 py-2 bg-purple-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-500 disabled:opacity-50"
                >
                    {isScanning ? '🔍 Taranıyor...' : 'Projeyi Tara'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {issues.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-12">
                        <div className="text-4xl mb-4 opacity-20">🛡️</div>
                        <p className="text-xs">Projenizdeki anlamsal ve mimari hataları bulmak için taramayı başlatın.</p>
                    </div>
                ) : (
                    issues.map((issue, i) => (
                        <div
                            key={i}
                            className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${issue.severity === 'error' ? 'bg-red-500' :
                                    issue.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                                    } shadow-[0_0_10px_rgba(239,68,68,0.5)]`} />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-white/50 group-hover:text-white transition-colors">
                                    {issue.file}
                                </span>
                            </div>
                            <h4 className="text-xs font-bold text-white mb-1">{issue.message}</h4>
                            {/* description removed since it's redundant with message */}
                            {issue.suggestion && (
                                <div className="mt-3 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                    <p className="text-[9px] text-purple-300 font-medium">💡 Öneri: {issue.suggestion}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
