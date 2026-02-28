import { GGUFModel } from './types';

interface DownloadManagerProps {
    downloadQueue: GGUFModel[];
    setDownloadQueue: React.Dispatch<React.SetStateAction<GGUFModel[]>>;
    processDownloadQueue: () => void;
}

export default function DownloadManager({
    downloadQueue,
    setDownloadQueue,
    processDownloadQueue
}: DownloadManagerProps) {
    if (downloadQueue.length === 0) return null;

    return (
        <div className="flex-shrink-0 w-48 p-1.5 bg-orange-900/20 border border-orange-500/30 rounded">
            <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-orange-400">📥 Kuyruk ({downloadQueue.length})</span>
                <button
                    onClick={processDownloadQueue}
                    className="px-1 py-0.5 bg-orange-600 hover:bg-orange-700 rounded text-xs"
                >
                    ▶️
                </button>
            </div>
            <div className="space-y-0.5 max-h-16 overflow-y-auto">
                {downloadQueue.slice(0, 2).map((model, index) => (
                    <div key={model.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 truncate">#{index + 1} {model.displayName}</span>
                        <button
                            onClick={() => setDownloadQueue(prev => prev.filter(m => m.id !== model.id))}
                            className="text-red-400 hover:text-red-300 ml-1"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
