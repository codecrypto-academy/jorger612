'use client';

/** Escudo 3D estilizado con SVG + CSS (sin asset externo). */
export function LandingShield() {
  return (
    <div className="ds-landing-shield" aria-hidden>
      <div className="ds-landing-shield__glow" />
      <div className="ds-landing-shield__platform">
        <div className="ds-landing-shield__ring ds-landing-shield__ring--1" />
        <div className="ds-landing-shield__ring ds-landing-shield__ring--2" />
        <div className="ds-landing-shield__ring ds-landing-shield__ring--3" />
        <div className="ds-landing-shield__beams">
          <span />
          <span />
          <span />
          <span />
        </div>
        <svg className="ds-landing-shield__svg" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="shieldGrad" x1="40" y1="20" x2="160" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#6366f1" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="shieldInner" x1="100" y1="50" x2="100" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.15" />
            </linearGradient>
            <filter id="shieldGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M100 18 L168 52 V118 C168 158 138 188 100 202 C62 188 32 158 32 118 V52 Z"
            fill="url(#shieldGrad)"
            fillOpacity="0.35"
            stroke="url(#shieldGrad)"
            strokeWidth="2.5"
            filter="url(#shieldGlow)"
          />
          <path
            d="M100 38 L148 64 V114 C148 144 126 168 100 178 C74 168 52 144 52 114 V64 Z"
            fill="url(#shieldInner)"
            stroke="rgba(167, 139, 250, 0.5)"
            strokeWidth="1.5"
          />
          <path
            d="M72 108 L92 128 L128 86"
            stroke="#e0e7ff"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.95"
          />
        </svg>
      </div>
    </div>
  );
}
