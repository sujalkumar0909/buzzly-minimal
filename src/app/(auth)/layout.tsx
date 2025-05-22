// src/app/(auth)/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './AuthLayout.module.css'; // Use the CSS Module created above

// This layout will wrap /signup and /login (if /login was a separate page)
// For the "login each time" model where /chat shows the login form,
// this layout primarily serves the /signup page.

export const metadata: Metadata = {
  title: 'Authentication', // Generic title for auth pages
  description: 'Join Buzzly Minimal or sign in to your account.',
};

export default function AuthenticationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.authLayoutContainer}>
      <div className={styles.authFormWrapper}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logoLink}>
            Buzzly
          </Link>
          <p className={styles.tagline}>Minimalist Chat</p>
        </div>
        {children} {/* This will be the content of signup/page.tsx */}
      </div>
      <p className={styles.footerText}>
        © {new Date().getFullYear()} Buzzly Minimal
      </p>
    </div>
  );
}