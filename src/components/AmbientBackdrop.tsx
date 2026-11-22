export function AmbientBackdrop() {
  return (
    <>
      {/* Subtle optical edge-refraction SVG filter for focal floating glass layers */}
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed h-0 w-0 overflow-hidden"
      >
        <defs>
          <filter
            id="liquid-glass-refract"
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.018"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1.2" result="softNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="softNoise"
              scale="4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Depth-rich ambient mesh & slow-drifting GPU-composited light orbs */}
      <div
        aria-hidden="true"
        className="ambient-mesh pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="ambient-orb ambient-orb-cobalt" />
        <div className="ambient-orb ambient-orb-ice" />
        <div className="ambient-orb ambient-orb-sky" />
        <div className="ambient-orb ambient-orb-indigo" />
      </div>
    </>
  );
}
