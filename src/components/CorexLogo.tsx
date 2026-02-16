interface CorexLogoProps {
  size?: number;
  className?: string;
}

function CorexLogo({ size = 40, className = "" }: CorexLogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Outer Ring - Slow elegant rotation */}
        <circle
          cx="100"
          cy="100"
          r="84"
          stroke="url(#ringGradient1)"
          strokeWidth="3"
          fill="none"
          opacity="0.4"
          className="animate-spin"
          style={{ 
            animationDuration: "30s",
            animationTimingFunction: "linear"
          }}
        />
        
        {/* Middle Ring - Medium rotation, opposite direction */}
        <circle
          cx="100"
          cy="100"
          r="68"
          stroke="url(#ringGradient2)"
          strokeWidth="4"
          fill="none"
          opacity="0.5"
          className="animate-spin"
          style={{ 
            animationDuration: "25s",
            animationDirection: "reverse",
            animationTimingFunction: "linear"
          }}
        />
        
        {/* Inner Ring - Faster rotation */}
        <circle
          cx="100"
          cy="100"
          r="52"
          stroke="url(#ringGradient3)"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
          className="animate-spin"
          style={{ 
            animationDuration: "20s",
            animationTimingFunction: "linear"
          }}
        />
        
        {/* 5 Floating dots - Orbiting around the logo */}
        <circle cx="100" cy="16" r="2.5" fill="#00f5ff" opacity="0.8" className="animate-pulse">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 100 100;360 100 100"
            dur="28s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="172" cy="50" r="2" fill="#6644ff" opacity="0.7" className="animate-pulse" style={{ animationDelay: "1s" }}>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 100 100;-360 100 100"
            dur="22s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="172" cy="150" r="2.2" fill="#aa44ff" opacity="0.8" className="animate-pulse" style={{ animationDelay: "2s" }}>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 100 100;360 100 100"
            dur="26s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="28" cy="150" r="1.8" fill="#00aaff" opacity="0.6" className="animate-pulse" style={{ animationDelay: "3s" }}>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 100 100;-360 100 100"
            dur="32s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="28" cy="50" r="2.3" fill="#ff6644" opacity="0.7" className="animate-pulse" style={{ animationDelay: "4s" }}>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 100 100;360 100 100"
            dur="24s"
            repeatCount="indefinite"
          />
        </circle>
        
        {/* Main C Letter - Big C with Shorter Edges */}
        <path
          d="M 130 55
             L 110 55
             C 70 55, 50 75, 50 100
             C 50 125, 70 145, 110 145
             L 130 145"
          stroke="url(#cGradientMain)"
          strokeWidth="24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Inner C - Creates subtle depth */}
        <path
          d="M 125 68
             L 115 68
             C 85 68, 70 83, 70 100
             C 70 117, 85 132, 115 132
             L 125 132"
          stroke="url(#cGradientInner)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        
        {/* Soft outer glow */}
        <path
          d="M 130 55
             L 110 55
             C 70 55, 50 75, 50 100
             C 50 125, 70 145, 110 145
             L 130 145"
          stroke="#00f5ff"
          strokeWidth="36"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.2"
          filter="blur(4px)"
        />
        
        {/* Inner soft glow */}
        <path
          d="M 130 55
             L 110 55
             C 70 55, 50 75, 50 100
             C 50 125, 70 145, 110 145
             L 130 145"
          stroke="#aa44ff"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
          filter="blur(2px)"
        />
        
        {/* Gradients */}
        <defs>
          {/* Ring Gradients - Subtle and elegant */}
          <linearGradient id="ringGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#6644ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#aa44ff" stopOpacity="0.6" />
          </linearGradient>
          
          <linearGradient id="ringGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#aa44ff" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#0099ff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#00f5ff" stopOpacity="0.5" />
          </linearGradient>
          
          <linearGradient id="ringGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0099ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6644ff" stopOpacity="0.8" />
          </linearGradient>
          
          {/* C Letter Gradients - Premium blue/purple tones */}
          <linearGradient id="cGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5ff" />
            <stop offset="30%" stopColor="#0099ff" />
            <stop offset="70%" stopColor="#6644ff" />
            <stop offset="100%" stopColor="#aa44ff" />
          </linearGradient>
          
          <linearGradient id="cGradientInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#00f5ff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default CorexLogo;