// src/components/ui/Spinner.tsx
'use client';
import React from 'react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // 12, 16, 20, 32, 48px
  color?: string; // e.g., "rgb(240,186,57)" OR a Tailwind text color if still using minimal TW
  className?: string; // For additional Tailwind classes if needed, or custom CSS
  ariaLabel?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color, // Example: pass 'rgb(240,186,57)' or specific hex
  className = '',
  ariaLabel = 'Loading content',
}) => {
  let dimension = '20px'; // md
  switch (size) {
    case 'xs': dimension = '12px'; break;
    case 'sm': dimension = '16px'; break;
    case 'lg': dimension = '32px'; break;
    case 'xl': dimension = '48px'; break;
  }

  const style: React.CSSProperties = {
    height: dimension,
    width: dimension,
    color: color || 'rgb(240,186,57)', // Default to brand color CSS variable
  };

  return (
    <svg
      className={`animate-spin ${className}`} // Keep animate-spin if Tailwind base is still imported
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label={ariaLabel}
      role="status"
    >
      <circle
        className="opacity-25" // This class can be defined in globals.css or here with style
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        style={{ opacity: 0.25 }} // If Tailwind 'opacity-25' is not available
      ></circle>
      <path
        className="opacity-75" // This class can be defined in globals.css or here with style
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        style={{ opacity: 0.75 }} // If Tailwind 'opacity-75' is not available
      ></path>
    </svg>
  );
};
export default Spinner;