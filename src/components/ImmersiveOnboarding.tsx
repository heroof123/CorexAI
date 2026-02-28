import { useEffect, useState } from 'react';

export const ImmersiveOnboarding = ({
    isVisible,
    onClose
}: {
    isVisible: boolean;
    onClose: () => void;
}) => {
    const [step, setStep] = useState(0);
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsRendered(true);
            setStep(0);
        } else {
            setTimeout(() => setIsRendered(false), 300); // Wait for fade out
        }
    }, [isVisible]);

    if (!isRendered) return null;

    const steps = [
        {
            title: "Corex AI'a Hoş Geldiniz! 🚀",
            description: "Yeni nesil Akıllı IDE deneyimine başlamak üzeresiniz. Sizi sıradan bir editörden farklılaştıran özellikleri keşfedelim.",
            highlightElement: null,
            position: "center"
        },
        {
            title: "Akıllı Explorer & Dosya Yönetimi 📂",
            description: "Sol taraftaki Activity Bar aracılığıyla projenizi yönetin, dosyalarda arama yapın ve Semantic Linter ile kodunuzu analiz edin.",
            highlightElement: ".side-panel-container", // Pseudo-selector for demonstration
            position: "left"
        },
        {
            title: "Gelişmiş AI Asistanınız 🤖",
            description: "Sağ paneldeki AI Sohbeti sadece sorularınızı yanıtlamakla kalmaz; projenizi okur, Context (bağlam) anlar ve doğrudan kod düzenleyebilir.",
            highlightElement: ".chat-panel-container",
            position: "right"
        },
        {
            title: "Predictive Intent Engine 🔮",
            description: "Siz kod yazarken (örneğin auth yazmaya başladığınızda) niyetinizi okur ve bütün bir bloğu sadece 'Tab' tuşuyla tamamlamanızı sağlar.",
            highlightElement: ".monaco-editor",
            position: "center"
        },
        {
            title: "Tech Debt & Karmaşıklık Bütçesi 🎯",
            description: "Kodu kırmak kolay. Biz uzun vadeli sağlığı düşünüyoruz. Sol menüden 'Tech Debt' veya 'Security' araçlarını kullanarak projenizi sürekli temiz tutabilirsiniz.",
            highlightElement: ".activity-bar-tech-debt",
            position: "left"
        },
        {
            title: "Hazırsanız Başlayalım! ✨",
            description: "Şimdi bir proje açın (Ctrl+O) veya mevcut projenizde devrim yaratmaya başlayın. Sınırsız olasılıklar sizi bekliyor.",
            highlightElement: null,
            position: "center"
        }
    ];

    const currentStepInfo = steps[step];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    const getPositionClasses = () => {
        switch (currentStepInfo.position) {
            case "left": return "left-10 top-1/2 -translate-y-1/2";
            case "right": return "right-10 top-1/2 -translate-y-1/2";
            case "center":
            default: return "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
        }
    };

    return (
        <div className={`fixed inset-0 z-[99999] pointer-events-none transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 pointer-events-auto backdrop-blur-sm" onClick={onClose} />

            {/* Intro Modal */}
            <div className={`absolute ${getPositionClasses()} w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-primary)]/50 rounded-2xl shadow-2xl p-6 pointer-events-auto transition-all duration-500 ease-out transform ${isVisible ? 'scale-100' : 'scale-95'}`}>

                {/* Step Indicator */}
                <div className="flex gap-1.5 mb-6 justify-center">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? 'w-6 bg-[var(--color-primary)]' : 'w-2 bg-neutral-700'}`}
                        />
                    ))}
                </div>

                {/* Content */}
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-3 text-center">
                    {currentStepInfo.title}
                </h2>
                <p className="text-[var(--color-textSecondary)] text-sm mb-8 text-center leading-relaxed">
                    {currentStepInfo.description}
                </p>

                {/* Buttons */}
                <div className="flex items-center justify-between mt-auto">
                    <button
                        onClick={onClose}
                        className="text-xs text-neutral-500 hover:text-white transition-colors px-3 py-1.5"
                    >
                        Atla
                    </button>

                    <div className="flex gap-2">
                        {step > 0 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm transition-all"
                            >
                                Geri
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-500/20"
                        >
                            {step === steps.length - 1 ? 'Başla' : 'İleri'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ImmersiveOnboarding;
