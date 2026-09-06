import React from 'react';

/**
 * Global SVG Filter Definitions for Light Liquid Acrylic Glass
 * Uses feTurbulence, feDisplacementMap, and feSpecularLighting
 * to bend geometric background lines and create authentic optical liquid refraction.
 */
export const LiquidFilterDefs: React.FC = () => {
  return (
    <svg
      id="liquid-glass-defs"
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <defs>
        {/* Main Light Liquid Glass Refraction Filter */}
        <filter
          id="liquid-glass"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.016"
            numOctaves="3"
            seed="9"
            result="liquidNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="liquidNoise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="0.35" result="smooth" />
          <feSpecularLighting
            in="liquidNoise"
            surfaceScale="2"
            specularConstant="1.2"
            specularExponent="20"
            lightingColor="#ffffff"
            result="specular"
          >
            <fePointLight x="-100" y="-120" z="240" />
          </feSpecularLighting>
          <feComposite
            in="smooth"
            in2="specular"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="0.6"
            k4="0"
          />
        </filter>

        {/* Dynamic Wave Ripple for active states */}
        <filter
          id="liquid-ripple"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="turbulence"
            baseFrequency="0.018 0.024"
            numOctaves="2"
            seed="4"
            result="rippleNoise"
          >
            <animate
              attributeName="baseFrequency"
              dur="18s"
              values="0.018 0.024; 0.024 0.014; 0.018 0.024"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="rippleNoise"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
      </defs>
    </svg>
  );
};
