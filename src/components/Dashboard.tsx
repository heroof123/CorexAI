import CorexLogo from "./CorexLogo";

// Dashboard component - Shows when no file is selected
export default function Dashboard() {
  const shortcuts = [
    { label: "New Agent", keys: ["Ctrl", "Shift", "L"] },
    { label: "Show Terminal", keys: ["Ctrl", "J"] },
    { label: "Hide Files", keys: ["Ctrl", "B"] },
    { label: "Search Files", keys: ["Ctrl", "P"] },
    { label: "Open Browser", keys: ["Ctrl", "Shift", "B"] },
    { label: "Maximize Chat", keys: ["Ctrl", "Alt", "E"] },
  ];

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e] relative overflow-hidden">
      {/* Infinite Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#1e1e1e] to-[#222222]">
        {/* Animated Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10 animate-pulse"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
            animation: 'gridMove 20s linear infinite'
          }}
        />
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
        
        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/30" />
      </div>
      
      <div className="flex flex-col items-center relative z-10">
        {/* Corex Logo */}
        <div className="mb-8">
          <CorexLogo size={96} className="drop-shadow-2xl" />
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2 w-full max-w-md">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-2 rounded-lg bg-[#252525]/50 hover:bg-[#2a2a2a] transition-colors group backdrop-blur-sm border border-neutral-800/50"
            >
              <span className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                {shortcut.label}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd className="px-2 py-1 text-xs font-semibold text-neutral-400 bg-[#181818] border border-neutral-700 rounded shadow-sm">
                      {key}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="mx-1 text-neutral-600">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(100px, 100px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
}
