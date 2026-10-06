import React from 'react';

interface ResearchVisualProps {
  className?: string;
}

export const ResearchVisual: React.FC<ResearchVisualProps> = ({ className = '' }) => {
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
          {/* Subtle glow filter for unstable transition node */}
          <filter id="failureNodeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="unstableTrajectoryGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--foreground-muted, #94a3b8)" stopOpacity="0.4" />
            <stop offset="45%" stopColor="var(--foreground, #f3f5f8)" stopOpacity="0.7" />
            <stop offset="75%" stopColor="var(--accent-amber, #f59e0b)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--accent-rose, #f43f5e)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* 1. Cluster State Tier Bands (C0, C1, C2, C3) */}
        <g className="research-tiers">
          {/* Tier C0 (Peak Evening) */}
          <rect x="40" y="45" width="480" height="34" rx="4" fill="currentColor" fillOpacity="0.02" />
          <line x1="40" y1="62" x2="520" y2="62" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 4" />
          <text x="32" y="65" textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="8.5" fontFamily="var(--font-mono)">C0</text>

          {/* Tier C1 (Steady Baseload) */}
          <rect x="40" y="95" width="480" height="34" rx="4" fill="currentColor" fillOpacity="0.02" />
          <line x1="40" y1="112" x2="520" y2="112" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 4" />
          <text x="32" y="115" textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="8.5" fontFamily="var(--font-mono)">C1</text>

          {/* Tier C2 (Daytime Active) */}
          <rect x="40" y="145" width="480" height="34" rx="4" fill="currentColor" fillOpacity="0.02" />
          <line x1="40" y1="162" x2="520" y2="162" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 4" />
          <text x="32" y="165" textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="8.5" fontFamily="var(--font-mono)">C2</text>

          {/* Tier C3 (Dual Peak) */}
          <rect x="40" y="195" width="480" height="34" rx="4" fill="currentColor" fillOpacity="0.02" />
          <line x1="40" y1="212" x2="520" y2="212" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 4" />
          <text x="32" y="215" textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="8.5" fontFamily="var(--font-mono)">C3</text>
        </g>

        {/* 2. Longitudinal Window Division Ticks */}
        <g className="research-window-cols" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1">
          <line x1="85" y1="40" x2="85" y2="230" />
          <line x1="180" y1="40" x2="180" y2="230" />
          <line x1="280" y1="40" x2="280" y2="230" />
          <line x1="380" y1="40" x2="380" y2="230" />
          <line x1="480" y1="40" x2="480" y2="230" />
        </g>

        {/* Window Labels at bottom */}
        <g fill="currentColor" fillOpacity="0.45" fontSize="9" fontFamily="var(--font-mono)">
          <text x="85" y="246" textAnchor="middle">W_t</text>
          <text x="180" y="246" textAnchor="middle">W_t+1</text>
          <text x="280" y="246" textAnchor="middle">W_t+2</text>
          <text x="380" y="246" textAnchor="middle">W_t+3</text>
          <text x="480" y="246" textAnchor="middle">W_t+4</text>
        </g>

        {/* 3. Stable Household Trajectory (Calm Baseline: Stays in C1 across windows) */}
        <path
          d="M 85 112 L 480 112"
          stroke="var(--foreground-muted, #94a3b8)"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        {/* Nodes for Stable Trajectory */}
        <circle cx="85" cy="112" r="3" fill="var(--surface, #0e131b)" stroke="var(--foreground-muted, #94a3b8)" strokeWidth="1.5" />
        <circle cx="180" cy="112" r="3" fill="var(--surface, #0e131b)" stroke="var(--foreground-muted, #94a3b8)" strokeWidth="1.5" />
        <circle cx="280" cy="112" r="3" fill="var(--surface, #0e131b)" stroke="var(--foreground-muted, #94a3b8)" strokeWidth="1.5" />
        <circle cx="380" cy="112" r="3" fill="var(--surface, #0e131b)" stroke="var(--foreground-muted, #94a3b8)" strokeWidth="1.5" />
        <circle cx="480" cy="112" r="3" fill="var(--surface, #0e131b)" stroke="var(--foreground-muted, #94a3b8)" strokeWidth="1.5" />

        {/* 4. Unstable Household Trajectory (Transitions across C1 -> C2 -> C0 -> C3) */}
        <path
          d="M 85 112
             C 130 112, 135 162, 180 162
             C 225 162, 235 62, 280 62
             C 330 62, 335 212, 380 212
             C 425 212, 440 212, 480 212"
          stroke="url(#unstableTrajectoryGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Transition Nodes */}
        <circle cx="85" cy="112" r="3.5" fill="var(--surface, #0e131b)" stroke="var(--foreground-muted, #94a3b8)" strokeWidth="1.5" />
        <circle cx="180" cy="162" r="4" fill="var(--surface, #0e131b)" stroke="var(--foreground, #f3f5f8)" strokeWidth="1.5" />
        <circle cx="280" cy="62" r="4.5" fill="var(--surface, #0e131b)" stroke="var(--accent-amber, #f59e0b)" strokeWidth="2" />

        {/* 5. Forecast Failure Event Indicator (Elevated Instability → Tail Event) */}
        <g transform="translate(380, 212)" filter="url(#failureNodeGlow)">
          <circle cx="0" cy="0" r="7" fill="none" stroke="var(--accent-rose, #f43f5e)" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="0" cy="0" r="4" fill="var(--surface, #0e131b)" stroke="var(--accent-rose, #f43f5e)" strokeWidth="2" />
          <circle cx="0" cy="0" r="1.8" fill="var(--accent-rose, #f43f5e)" />
        </g>

        {/* Conceptual Transition Callout Badge */}
        <g transform="translate(348, 172)">
          <rect x="0" y="0" width="102" height="22" rx="11" fill="var(--surface-raised, #141b26)" stroke="var(--accent-rose, #f43f5e)" strokeOpacity="0.45" strokeWidth="1" />
          <text x="51" y="14" textAnchor="middle" fill="var(--foreground, #f3f5f8)" fontSize="8" fontFamily="var(--font-mono)" fontWeight="600" letterSpacing="0.06em">
            CLUSTER SHIFT
          </text>
        </g>

        {/* 6. Top Legend */}
        <g transform="translate(45, 20)">
          {/* Stable trajectory line */}
          <line x1="0" y1="6" x2="16" y2="6" stroke="var(--foreground-muted, #94a3b8)" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="22" y="9" fill="currentColor" fillOpacity="0.65" fontSize="8.5" fontFamily="var(--font-mono)">Stable Path (Low Instability)</text>

          {/* Shifting trajectory line */}
          <line x1="180" y1="6" x2="196" y2="6" stroke="var(--accent-rose, #f43f5e)" strokeWidth="2" />
          <text x="202" y="9" fill="currentColor" fillOpacity="0.65" fontSize="8.5" fontFamily="var(--font-mono)">Cluster Transition Trajectory</text>
        </g>
      </svg>
    </div>
  );
};
