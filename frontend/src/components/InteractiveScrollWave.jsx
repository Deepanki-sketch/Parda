import React, { useState, useEffect } from 'react';

/**
 * InteractiveScrollWave
 * 
 * Sits behind all cards/boxes (z-0, pointer-events-none).
 * Initially rests in the bottom 1/4 of the page background.
 * As user scrolls down, the wave rises TOTALLY UP past the top of the screen,
 * making the entire visible background of the page 100% fully golden brown.
 * When scrolling up, it smoothly descends back down to the bottom 1/4 (normal).
 */
export default function InteractiveScrollWave() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY || window.pageYOffset || 0);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Compute scroll progress:
  // Starts at 0 (top of page).
  // Reaches 1 as the user scrolls down ~380px.
  const progress = Math.min(1, Math.max(0, scrollY / 380));

  // Starts in bottom 1/4 (~76vh).
  // As user scrolls down, wave travels TOTALLY UP past the top of the screen (-34vh),
  // leaving the entire page background behind the boxes fully golden brown.
  const waveTopVh = 76 - (progress * 110);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <div
        className="absolute inset-x-0 w-full will-change-transform flex flex-col"
        style={{
          top: `calc(${waveTopVh}vh - 80px)`,
          bottom: '-50vh',
          transition: 'top 150ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* The 1 Wave Wavy SVG Crest with 4px overlap to eliminate any seam */}
        <div
          className="w-full shrink-0 relative overflow-visible"
          style={{ marginBottom: '-4px' }}
        >
          <svg
            viewBox="0 0 1440 260"
            className="w-full h-28 sm:h-36 md:h-44 lg:h-52 block"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Golden Brown Multi-Stop Gradient */}
              <linearGradient id="pardaWaveGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C5A36A" stopOpacity="1" />
                <stop offset="25%" stopColor="#9E7C4B" stopOpacity="1" />
                <stop offset="65%" stopColor="#805924" stopOpacity="1" />
                <stop offset="100%" stopColor="#6E4A1B" stopOpacity="1" />
              </linearGradient>

              {/* Luminous Highlight Filter for Crest */}
              <filter id="pardaWaveGlow" x="-10%" y="-10%" width="120%" height="140%">
                <feDropShadow dx="0" dy="-2" stdDeviation="4" floodColor="#FFE2A0" floodOpacity="0.45" />
              </filter>
            </defs>

            {/* Filled Wave Body */}
            <path
              fill="url(#pardaWaveGoldGrad)"
              d="M0,120 C340,30 680,210 1020,90 C1200,30 1340,110 1440,120 L1440,260 L0,260 Z"
            />

            {/* Subtle Golden Highlight Along the Crest Edge */}
            <path
              d="M0,120 C340,30 680,210 1020,90 C1200,30 1340,110 1440,120"
              fill="none"
              stroke="rgba(255, 230, 168, 0.75)"
              strokeWidth="2.5"
              filter="url(#pardaWaveGlow)"
            />
          </svg>
        </div>

        {/* Seamless Rich Golden Brown Background Under the Wave */}
        <div
          className="w-full flex-1"
          style={{
            background: 'linear-gradient(180deg, #6E4A1B 0%, #5E3D13 40%, #4D310C 100%)'
          }}
        />
      </div>
    </div>
  );
}
