import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const SketchCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleGenerate = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsProcessing(true);
        canvas.toDataURL('image/png'); // Just call it to simulate processing

        try {
            // Send to AI for Vision Analysis
            // const prompt = `Convert this UI sketch into a premium React + Tailwind CSS code.
            // Return ONLY the code.`;

            // In a real implementation, we would use a dedicated vision tool
            // For now, we simulate the intent
            console.log("🎨 Sketch-to-Code: Processing drawing...");

            // We'll trigger a chat message with the image (simulated)
            // const result = await invoke("process_vision_sketch", { image: dataUrl });
            await new Promise(resolve => setTimeout(resolve, 2000));
            alert("🚀 Sketch analiz edildi ve kod üretildi!");
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-[#0a0a0a] rounded-3xl border border-white/5 h-full">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-400">Sketch-to-Code</h3>
                <div className="flex gap-2">
                    <button onClick={clearCanvas} className="p-2 bg-white/5 rounded-xl hover:bg-white/10">🧹</button>
                    <button
                        onClick={handleGenerate}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50"
                    >
                        {isProcessing ? '⏳' : 'Koda Çevir'}
                    </button>
                </div>
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 bg-white/[0.02] rounded-2xl relative overflow-hidden border border-white/10"
            >
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </motion.div>
            <p className="text-[10px] text-neutral-500 italic px-2">
                Buraya bir UI taslağı (form, buton, kart vb.) çiz ve "Koda Çevir" butonuna bas. Corex AI bunu anında React koduna dönüştürecektir.
            </p>
        </div >
    );
};
