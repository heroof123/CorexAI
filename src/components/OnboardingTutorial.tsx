import { useState, useEffect } from 'react';

/**
 * Onboarding Tutorial Component
 * Interactive guide for new users
 */

interface TutorialStep {
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  action?: string;
  image?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: '🎉 Corex IDE\'ye Hoş Geldiniz!',
    description: 'AI destekli kod editörünüze hoş geldiniz. Hızlı bir tur yapalım!',
    action: 'Başla'
  },
  {
    title: '📁 Proje Açın',
    description: 'Sol üstteki "File" menüsünden veya Ctrl+O ile bir proje klasörü açın.',
    target: '.menu-bar',
    action: 'Devam'
  },
  {
    title: '🗂️ Dosya Gezgini',
    description: 'Sol taraftaki Activity Bar\'dan dosyalarınıza erişin. Dosyalara tıklayarak açabilirsiniz.',
    target: '.activity-bar',
    action: 'Devam'
  },
  {
    title: '✏️ Kod Editörü',
    description: 'Monaco Editor ile güçlü kod düzenleme. IntelliSense, syntax highlighting ve daha fazlası!',
    target: '.editor-container',
    action: 'Devam'
  },
  {
    title: '🤖 AI Asistanı',
    description: 'Sağ taraftaki AI panelinden yapay zeka asistanınızla konuşun. Kod yazma, hata düzeltme, açıklama ve daha fazlası!',
    target: '.chat-panel',
    action: 'Devam'
  },
  {
    title: '💻 Terminal',
    description: 'Ctrl+` ile entegre terminali açın. Komutlarınızı doğrudan IDE içinden çalıştırın.',
    action: 'Devam'
  },
  {
    title: '⌨️ Klavye Kısayolları',
    description: 'Ctrl+Shift+P ile Command Palette\'i açın. Tüm komutlara hızlıca erişin!',
    action: 'Devam'
  },
  {
    title: '🎨 Özelleştirme',
    description: 'Ctrl+, ile ayarları açın. Tema, düzen ve daha fazlasını özelleştirin.',
    action: 'Devam'
  },
  {
    title: '✅ Hazırsınız!',
    description: 'Artık Corex IDE\'yi kullanmaya hazırsınız. İyi kodlamalar! 🚀',
    action: 'Bitir'
  }
];

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTutorial({ onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  useEffect(() => {
    // Highlight target element
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        element.classList.add('tutorial-highlight');
        return () => {
          element.classList.remove('tutorial-highlight');
        };
      }
    }
  }, [step.target]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998] animate-fade-in" />

      {/* Tutorial Card */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] w-[500px] max-w-[90vw] animate-scale-in">
        <div className="bg-[#1e1e1e] border border-neutral-700 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{step.title}</h2>
              <button
                onClick={handleSkip}
                className="text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-neutral-300 text-base leading-relaxed mb-6">
              {step.description}
            </p>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-neutral-500 mb-2">
                <span>Adım {currentStep + 1} / {tutorialSteps.length}</span>
                <span>{Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Atla
              </button>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors"
                  >
                    Geri
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded font-medium transition-all"
                >
                  {step.action || 'Devam'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Highlight Styles */}
      <style>{`
        .tutorial-highlight {
          position: relative;
          z-index: 9997;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          border-radius: 4px;
          animation: pulse-highlight 2s infinite;
        }

        @keyframes pulse-highlight {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </>
  );
}

/**
 * Quick Tips Component - Contextual tips
 */
interface QuickTip {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const quickTips: QuickTip[] = [
  {
    id: 'search',
    title: 'Hızlı Arama',
    description: 'Ctrl+P ile dosyalarda hızlıca arama yapın',
    icon: '🔍'
  },
  {
    id: 'ai-chat',
    title: 'AI Asistanı',
    description: 'Ctrl+Shift+A ile AI sohbetini açın',
    icon: '🤖'
  },
  {
    id: 'terminal',
    title: 'Terminal',
    description: 'Ctrl+` ile terminali açın/kapatın',
    icon: '💻'
  },
  {
    id: 'save',
    title: 'Kaydet',
    description: 'Ctrl+S ile dosyayı kaydedin',
    icon: '💾'
  }
];

interface QuickTipsProps {
  onDismiss: () => void;
}

export function QuickTips({ onDismiss }: QuickTipsProps) {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % quickTips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const tip = quickTips[currentTip];

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[300px] animate-slide-in-right">
      <div className="bg-[#252525] border border-neutral-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{tip.icon}</span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-neutral-200 mb-1">
              💡 İpucu: {tip.title}
            </h3>
            <p className="text-xs text-neutral-400">
              {tip.description}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 mt-3 justify-center">
          {quickTips.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === currentTip ? 'bg-blue-500' : 'bg-neutral-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
