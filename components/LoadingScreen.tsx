"use client";
import React, { useEffect, useRef, useState } from 'react';

// Creme color from login page block bg
const CREME = '#d8c0a7';
const DARK_GREY = '#191818';

export default function LoadingScreen({ onDone }: { onDone?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;
    function animate() {
      setProgress((p) => {
        if (p < 100) return p + 2;
        setDone(true);
        if (onDone) setTimeout(onDone, 400);
        return 100;
      });
      if (!done) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [done, onDone]);

  // Slide down animation when done
  useEffect(() => {
    if (done && ref.current) {
      ref.current.style.transform = 'translateY(100vh)';
      ref.current.style.transition = 'transform 0.7s cubic-bezier(.77,0,.18,1)';
    }
  }, [done]);

  return (
    <div ref={ref} style={{
      position: 'fixed',
      zIndex: 9999,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: DARK_GREY,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.3s',
    }}>
      <svg
        viewBox="0 0 5327 6164"
        style={{
          width: 'min(95vw, 1200px)',
          height: 'min(90vh, 1000px)',
          maxWidth: '100vw',
          maxHeight: '100vh',
          display: 'block',
        }}
      >
        <rect width="5327" height="6164" fill={DARK_GREY} />
        <defs>
          <clipPath id="loader-fill">
            <rect x="0" y="0" width={Math.max(1, 5327 * (progress / 100))} height="6164" />
          </clipPath>
        </defs>
        {/* Creme fill animation */}
        <g clipPath="url(#loader-fill)">
          <path d="M2347.41 2924.79H2430.22C2452.61 2924.79 2469.8 2926.55 2481.78 2930.06C2493.89 2933.58 2502.94 2938.66 2508.93 2945.3C2515.05 2951.94 2519.15 2960.01 2521.23 2969.52C2523.45 2978.89 2524.55 2993.47 2524.55 3013.27V3040.8C2524.55 3060.99 2522.47 3075.7 2518.3 3084.95C2514.14 3094.19 2506.46 3101.29 2495.26 3106.23C2484.19 3111.18 2469.67 3113.66 2451.7 3113.66H2429.63V3241H2347.41V2924.79ZM2429.63 2978.89V3059.36C2431.98 3059.49 2433.99 3059.55 2435.69 3059.55C2443.24 3059.55 2448.45 3057.73 2451.31 3054.09C2454.31 3050.31 2455.8 3042.56 2455.8 3030.84V3004.87C2455.8 2994.06 2454.11 2987.03 2450.73 2983.77C2447.34 2980.52 2440.31 2978.89 2429.63 2978.89ZM2654.18 2924.79L2701.25 3241H2617.07L2612.97 3184.16H2583.48L2578.59 3241H2493.44L2535.23 2924.79H2654.18ZM2610.62 3128.11C2606.46 3092.3 2602.29 3048.1 2598.12 2995.49C2589.79 3055.91 2584.58 3100.11 2582.5 3128.11H2610.62ZM2933.02 2924.79V3241H2861.15V3027.52L2832.44 3241H2781.46L2751.19 3032.41V3241H2679.31V2924.79H2785.76C2788.88 2943.8 2792.2 2966.2 2795.72 2991.98L2807.05 3072.45L2825.8 2924.79H2933.02Z" fill={CREME} />
        </g>
        {/* White text outline */}
        <path d="M2347.41 2924.79H2430.22C2452.61 2924.79 2469.8 2926.55 2481.78 2930.06C2493.89 2933.58 2502.94 2938.66 2508.93 2945.3C2515.05 2951.94 2519.15 2960.01 2521.23 2969.52C2523.45 2978.89 2524.55 2993.47 2524.55 3013.27V3040.8C2524.55 3060.99 2522.47 3075.7 2518.3 3084.95C2514.14 3094.19 2506.46 3101.29 2495.26 3106.23C2484.19 3111.18 2469.67 3113.66 2451.7 3113.66H2429.63V3241H2347.41V2924.79ZM2429.63 2978.89V3059.36C2431.98 3059.49 2433.99 3059.55 2435.69 3059.55C2443.24 3059.55 2448.45 3057.73 2451.31 3054.09C2454.31 3050.31 2455.8 3042.56 2455.8 3030.84V3004.87C2455.8 2994.06 2454.11 2987.03 2450.73 2983.77C2447.34 2980.52 2440.31 2978.89 2429.63 2978.89ZM2654.18 2924.79L2701.25 3241H2617.07L2612.97 3184.16H2583.48L2578.59 3241H2493.44L2535.23 2924.79H2654.18ZM2610.62 3128.11C2606.46 3092.3 2602.29 3048.1 2598.12 2995.49C2589.79 3055.91 2584.58 3100.11 2582.5 3128.11H2610.62ZM2933.02 2924.79V3241H2861.15V3027.52L2832.44 3241H2781.46L2751.19 3032.41V3241H2679.31V2924.79H2785.76C2788.88 2943.8 2792.2 2966.2 2795.72 2991.98L2807.05 3072.45L2825.8 2924.79H2933.02Z" fill="white" />
      </svg>
    </div>
  );
}

