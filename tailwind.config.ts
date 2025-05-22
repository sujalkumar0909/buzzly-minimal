// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // Set to 'media' if you prefer OS-based dark mode and don't want a manual toggle
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    // './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // If you ever use the old pages directory
  ],
  theme: {
    extend: {
      // We define our theme primarily using CSS variables in globals.css
      // but Tailwind can still pick these up if needed, or this section can be minimal.
      colors: {
        // These are consistent with CSS variables in globals.css
        background: {
          DEFAULT: 'var(--color-background-default)',
          secondary: 'var(--color-background-secondary)',
          muted: 'rgb(50, 50, 50)',
          hover: 'var(--color-background-hover)',
        },
        foreground: {
          DEFAULT: 'var(--color-foreground-default)',
          secondary: 'var(--color-foreground-secondary)',
          muted: 'rgb(30, 30, 30)',
        },
        border: {
          DEFAULT: 'rgb(50, 50, 50)',
          strong: 'rgb(30, 30, 30)',
        },
        brand: {
          DEFAULT: 'rgb(240,186,57)',
          hover: 'rgb(170, 140, 45)',
          text: 'rgb(240,186,57)',
        },
        success: {
          DEFAULT: 'var(--color-success-default)',
          background: 'var(--color-success-background)',
          text: 'var(--color-success-default)', // Often same as DEFAULT for text
        },
        error: {
          DEFAULT: 'var(--color-error-default)',
          background: 'var(--color-error-background)',
          text: 'var(--color-error-default)', // Often same as DEFAULT for text
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--border-radius-sm)',
        md: 'var(--border-radius-md)',
        lg: 'var(--border-radius-lg)',
      }
    },
  },
  plugins: [
    // require('@tailwindcss/forms'), // Example plugin, not used for now
  ],
};
export default config;