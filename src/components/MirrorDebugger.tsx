import { useState } from 'react';
import { callAI, getModelIdForRole } from '../services/ai';
import { Search, BrainCircuit, Maximize2 } from 'lucide-react';

interface MirrorDebuggerProps {
    codeSnippet: string;
    errorMessage?: string;
    onClose: () => void;
}

export const MirrorDebugger = ({ codeSnippet, errorMessage, onClose }: MirrorDebuggerProps) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<{ persona: string, character: string, negativeSpace: string[] } | null>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const prompt = `You are the "Mirror Debugger" engine. Instead of saying what the code does, you describe what it DOES NOT do (its negative space).
Also, if this code/error were a human personality, what kind of bug would it be? (e.g., 'The Introvert', 'The Over-Achiever').

Analyze the following snippet and (optionally) error:
ERROR: ${errorMessage || 'None'}
CODE: 
${codeSnippet}

Return ONLY valid JSON in this exact format:
{
  "persona": "Name of the bug's persona (e.g. The Introvert)",
  "character": "A 2-sentence psychological description of why this code behaves this way.",
  "negativeSpace": [
      "Here is one input case this code completely ignores.",
      "Another thing the developer assumed but didn't write."
  ]
}
Do not use markdown blocks around the JSON.`;

            const modelId = getModelIdForRole();
            const response = await callAI(prompt, modelId);

            let cleaned = response.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```(?:\w+)?\n([\s\S]*?)```$/, '$1').trim();
            }

            const data = JSON.parse(cleaned);
            setResult(data);
        } catch (e) {
            console.error(e);
            setResult({
                persona: "The Enigma",
                character: "This bug is so confusing even the Mirror Debugger failed to parse its true form.",
                negativeSpace: ["We don't know what it does.", "We don't know what it doesn't do either."]
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-surface)] border-l border-[var(--color-border)] p-4 text-[var(--color-text)] relative">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-indigo-400">
                    <Maximize2 size={18} />
                    <h2 className="font-bold tracking-wider text-sm">MIRROR DEBUGGING</h2>
                </div>
                <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">✕</button>
            </div>

            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                Tersine Mühendislik: Hatanın veya kodun psikolojik profilini çıkaracağız. Kodun "ne yaptığına" değil, <span className="text-red-400">"ne yapmadığına"</span> ve hangi edge-case'leri unuttuğuna odaklanıyoruz.
            </p>

            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all mb-8 disabled:opacity-50"
            >
                {isAnalyzing ? (
                    <><div className="animate-spin w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent" /> Aynaya Bakılıyor...</>
                ) : (
                    <><BrainCircuit size={16} /> Hatayı Yüzleştir</>
                )}
            </button>

            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 overflow-y-auto pr-2">

                    {/* Persona Card */}
                    <div className="bg-black/40 border border-neutral-800 rounded-xl p-4 mb-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all" />

                        <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Bug Personası</div>
                        <h3 className="text-xl font-bold text-white mb-2">{result.persona}</h3>
                        <p className="text-xs text-neutral-300 italic">"{result.character}"</p>
                    </div>

                    {/* Negative Space */}
                    <div className="space-y-3">
                        <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Search size={12} /> Kodun Karanlık Noktaları (Ne Yapmıyor?)
                        </div>

                        {result.negativeSpace.map((point, i) => (
                            <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 text-xs text-neutral-300 flex items-start gap-3">
                                <span className="text-red-500/50 mt-0.5">•</span>
                                <span className="leading-relaxed">{point}</span>
                            </div>
                        ))}
                    </div>

                </div>
            )}
        </div>
    );
};
