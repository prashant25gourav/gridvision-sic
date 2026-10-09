import React from 'react';

interface CapstoneVisualProps {
  className?: string;
}

export const CapstoneVisual: React.FC<CapstoneVisualProps> = ({ className = '' }) => {
  return (
    <div className={`overview-visual-wrapper ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 560 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overview-svg-graphic"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Waveform Area Fill Gradients */}
          <linearGradient id="capstoneFillDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-lime, #e1fcad)" stopOpacity="0.18" />
            <stop offset="70%" stopColor="var(--accent-lime, #e1fcad)" stopOpacity="0.03" />
            <stop offset="100%" stopColor="var(--accent-lime, #e1fcad)" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="capstoneStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--foreground-muted, #94a3b8)" stopOpacity="0.5" />
            <stop offset="35%" stopColor="var(--accent-lime, #e1fcad)" stopOpacity="0.85" />
            <stop offset="75%" stopColor="var(--accent-lime, #e1fcad)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--foreground-muted, #94a3b8)" stopOpacity="0.7" />
          </linearGradient>

          {/* Forecast Envelope Glow */}
          <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Subtle Background Grid & Guides */}
        <g className="capstone-guides" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1">
          <line x1="40" y1="50" x2="520" y2="50" strokeDasharray="3 4" />
          <line x1="40" y1="105" x2="520" y2="105" strokeDasharray="3 4" />
          <line x1="40" y1="160" x2="520" y2="160" strokeDasharray="3 4" />
          <line x1="40" y1="215" x2="520" y2="215" />

          {/* Vertical Time Division Ticks */}
          <line x1="60" y1="215" x2="60" y2="222" />
          <line x1="175" y1="215" x2="175" y2="222" />
          <line x1="290" y1="215" x2="290" y2="222" />
          <line x1="405" y1="215" x2="405" y2="222" />
          <line x1="510" y1="215" x2="510" y2="222" />
        </g>

        {/* 2. Diurnal Time Labels */}
        <g className="capstone-labels" fill="currentColor" fillOpacity="0.45" fontSize="9" fontFamily="var(--font-mono)">
          <text x="60" y="236" textAnchor="middle">00:00</text>
          <text x="175" y="236" textAnchor="middle">06:00</text>
          <text x="290" y="236" textAnchor="middle">12:00</text>
          <text x="405" y="236" textAnchor="middle">18:00</text>
          <text x="510" y="236" textAnchor="middle">24:00</text>
        </g>

        {/* 3. Forecast Confidence Envelope (Upper & Lower Bounds) */}
        <path
          d="M 50 185
             C 100 182, 140 148, 175 130
             C 210 112, 245 135, 290 142
             C 335 150, 365 92, 410 70
             C 455 48, 485 105, 515 155
             L 515 178
             C 485 132, 455 78, 410 98
             C 365 118, 335 172, 290 165
             C 245 158, 210 138, 175 152
             C 140 166, 100 196, 50 198
             Z"
          fill="currentColor"
          fillOpacity="0.04"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* 4. Actual Demand Waveform Under-fill */}
        <path
          d="M 50 190
             C 100 188, 140 156, 175 140
             C 210 124, 245 145, 290 152
             C 335 158, 365 102, 410 82
             C 455 62, 485 118, 515 165
             L 515 215
             L 50 215
             Z"
          fill="url(#capstoneFillDark)"
        />

        {/* 5. Actual Demand Load Curve (Smooth, Dynamic Waveform) */}
        <path
          d="M 50 190
             C 100 188, 140 156, 175 140
             C 210 124, 245 145, 290 152
             C 335 158, 365 102, 410 82
             C 455 62, 485 118, 515 165"
          stroke="url(#capstoneStroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#subtleGlow)"
        />

        {/* 6. Peak Load & Horizon Markers */}
        {/* Evening Peak Node */}
        <circle cx="410" cy="82" r="5" fill="var(--surface, #0e131b)" stroke="var(--accent-lime, #e1fcad)" strokeWidth="2" />
        <circle cx="410" cy="82" r="2" fill="var(--accent-lime, #e1fcad)" />

        {/* Morning Rise Node */}
        <circle cx="175" cy="140" r="4" fill="var(--surface, #0e131b)" stroke="var(--foreground-muted, #94a3b8)" strokeWidth="1.5" />

        {/* Floating Conceptual Badge */}
        <g transform="translate(366, 42)">
          <rect x="0" y="0" width="88" height="20" rx="10" fill="var(--surface-raised, #141b26)" stroke="var(--accent-lime, #e1fcad)" strokeOpacity="0.4" strokeWidth="1" />
          <text x="44" y="13" textAnchor="middle" fill="var(--foreground, #f3f5f8)" fontSize="8" fontFamily="var(--font-mono)" fontWeight="600" letterSpacing="0.06em">
            LOAD PROFILE
          </text>
        </g>

        {/* Floating Legend in Top Left */}
        <g transform="translate(45, 24)">
          {/* Actual line indicator */}
          <line x1="0" y1="6" x2="16" y2="6" stroke="var(--accent-lime, #e1fcad)" strokeWidth="2" />
          <text x="22" y="9" fill="currentColor" fillOpacity="0.65" fontSize="8.5" fontFamily="var(--font-mono)">Actual Load</text>

          {/* Forecast envelope indicator */}
          <line x1="95" y1="6" x2="111" y2="6" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="117" y="9" fill="currentColor" fillOpacity="0.65" fontSize="8.5" fontFamily="var(--font-mono)">Forecast Horizon</text>
        </g>
      </svg>
    </div>
  );
};
