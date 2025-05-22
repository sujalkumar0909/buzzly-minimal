// src/app/page.tsx
// This can be a Server Component or Client Component based on needs.
// For simple links/redirect, Server Component is fine.
// If you need client-side logic (e.g. checking auth state from context to redirect), make it 'use client'.
'use client'; // Let's make it client for potential redirect via AuthContext

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import Spinner from '@/components/ui/Spinner'; // For loading state during redirect check
import Button from '@/components/ui/Button'; // For styled links

// Define some simple styles directly or use a CSS module if it grows complex
const pageStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as 'column', // TS needs explicit cast for 'column'
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 50px)', // Assume a small header if RootLayout adds one
    padding: '2rem',
    backgroundColor: 'var(--color-background-default)',
    color: 'var(--color-foreground-default)',
    textAlign: 'center' as 'center',
  },
  title: {
  },
  subtitle: {
    fontSize: '1.125rem', // text-lg
    color: 'var(--color-foreground-secondary)',
    marginBottom: '2.5rem',
    maxWidth: '600px',
  },
  buttonGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  }
};

export default function HomePage() {
  const { currentUser, isLoadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      // If user is already "logged in" in this browser tab session, redirect to chat
      console.log("Homepage: User found in AuthContext, redirecting to /chat");
      router.replace('/chat'); // Use replace to avoid this page in history
    }
  }, [currentUser, isLoadingAuth, router]);

  if (isLoadingAuth || currentUser) { // If loading auth or user exists (and redirect is pending)
    return (
      <div style={pageStyles.container}>
        <Spinner size="lg" color="rgb(240,186,57)" />
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-foreground-secondary)'}}>
          Loading Buzzly...
        </p>
      </div>
    );
  }

  // If not loading auth and no current user, show welcome and links
  return (
    <main style={pageStyles.container}>
      <div>
        <img style={pageStyles.title} src="/logo.png" width="600px"></img>
        <p style={pageStyles.subtitle}>
          A simple, clean, and focused chat experience.
          Connect with others seamlessly.
        </p>
        <div style={pageStyles.buttonGroup}>
          {/* Using Button component for consistent styling and passing href to Link */}
          <Link href="/chat" passHref legacyBehavior>
            <Button className="a" variant="primary" size="lg">Login to Chat</Button>
          </Link>
          <Link href="/signup" passHref legacyBehavior>
            <Button className="a" variant="secondary" size="lg">Create Account</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}