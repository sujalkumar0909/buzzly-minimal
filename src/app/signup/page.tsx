// src/app/signup/page.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner'; // If needed for Button loading state
import Link from 'next/link';
import styles from '../chat/ChatPageContainer.module.css';
// We can use the same CSS classes as the login form from AuthLayout.module.css, or make specific ones
import authFormStyles from '../(auth)/AuthLayout.module.css'; // Use styles from AuthLayout

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setFieldErrors({}); setSuccessMessage(null); setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setFieldErrors(prev => ({...prev, confirmPassword: 'Passwords do not match.'}));
      setIsLoading(false);
      return;
    }
    // Add other client-side validations if desired (e.g., password complexity)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, username, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Signup failed. Please try again.');
        if (data.errors) setFieldErrors(data.errors);
      } else {
        setSuccessMessage(data.message + " Redirecting to login...");
        // Clear form or redirect
        setTimeout(() => {
          // If login is on /chat page, redirect there.
          // If there's a dedicated /login page, redirect to '/login'
          router.push('/chat'); // Assuming /chat page will now show login
        }, 2000);
      }
    } catch (err) {
      console.error('Signup fetch error:', err);
      setError('An unexpected error occurred. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // This page will be wrapped by AuthLayout which provides the card structure
    <div className={styles.loginPageContainer}>
      <div className={styles.loginFormWrapper}>
      <h2 className={authFormStyles.authFormTitle || "text-2xl font-bold text-center mb-6"}> {/* Fallback class */}
        Create your Buzzly Account
      </h2>
      <form onSubmit={handleSubmit} className={authFormStyles.authForm}>
        {error && <p className={authFormStyles.errorMessage}>{error}</p>}
        {successMessage && (
          <p className="text-center text-success bg-success/10 p-3 rounded-md text-sm border border-success/30">
            {successMessage}
          </p>
        )}

        <Input
          label="Full Name" id="signupName" type="text" value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name} required placeholder="Your Name" disabled={isLoading}
          wrapperClassName="!mb-0"
        />
        <Input
          label="Email" id="signupEmail" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email} required placeholder="you@example.com" disabled={isLoading}
          wrapperClassName="!mb-0"
        />
        <Input
          label="Username" id="signupUsername" type="text" value={username}
          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase())}
          error={fieldErrors.username} required placeholder="Your unique username"
          minLength={3} maxLength={20} disabled={isLoading}
          wrapperClassName="!mb-0"
        />
        <Input
          label="Password" id="signupPassword" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password} required placeholder="Min. 8 characters"
          minLength={8} disabled={isLoading}
          wrapperClassName="!mb-0"
        />
        <Input
          label="Confirm Password" id="signupConfirmPassword" type="password" value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={(password !== confirmPassword && confirmPassword) ? 'Passwords do not match' : fieldErrors.confirmPassword}
          required placeholder="Re-type password" disabled={isLoading}
          wrapperClassName="!mb-0"
        />
        <div style={{paddingTop: '0.5rem'}}>
            <Button type="submit" fullWidth className={authFormStyles.authButton} isLoading={isLoading} disabled={isLoading || !!successMessage} variant="primary">
            {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
        </div>
        <p className={authFormStyles.signupPrompt}>
          Already have an account?{' '}
          <Link href="/chat" className={authFormStyles.formLink}> {/* Link to /chat which shows login */}
            Log In
          </Link>
        </p>
      </form>
      </div>
    </div>
  );
}