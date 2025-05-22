// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css'; // Import the global styles
import { AuthProvider } from '@/contexts/AuthContext'; // Context for authentication state
import { Inter } from 'next/font/google'; // Using Inter for a clean sans-serif font

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Ensures text remains visible during font loading
  variable: '--font-inter', // Optional: Define as CSS variable
});

export const metadata: Metadata = {
  title: {
    default: 'Buzzly Minimal', // Default title for all pages
    template: '%s | Buzzly Minimal', // Template for page-specific titles
  },
  description: 'Connect and Chat with Buzzly Minimal. A minimalist chat application.',
  // themeColor: '#121212', // Matches background-default
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The `dark` class can be used with `darkMode: 'class'` in tailwind.config.ts
    // If your globals.css directly applies the dark theme, it's not strictly necessary for colors,
    // but useful if you want to use Tailwind's dark: variants for other things.
    <html lang="en" className="dark">
      <head>
        {/* Favicon links can go here */}
        {/* <link rel="icon" href="/favicon.ico" sizes="any" /> */}
        {/* <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> */}
      </head>
      {/* Apply font variable and base classes for layout */}
      <body
        className={`
          ${inter.variable} font-sans 
          min-h-screen flex flex-col 
          bg-background text-foreground 
          antialiased selection:bg-brand-default/30
        `}
      >
        <AuthProvider>
          {/* This is where your page content will be injected */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}