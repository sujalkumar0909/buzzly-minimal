// src/app/chat/page.tsx (ChatPageContainer)
'use client';
import React, { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUser } from '@/lib/types'
// import { SocketProvider } from '@/contexts/SocketContext'; // REMOVE
import ChatAppInterface from '@/components/chat/ChatAppInterface';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import styles from './ChatPageContainer.module.css';

export default function ChatPage() {
  const { currentUser, login: authContextLogin, isLoadingAuth } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [emailOrUsername, setEmailOrUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleActualLogin = async (e: FormEvent) => { /* ... as before ... */ e.preventDefault();setIsLoggingIn(true);setLoginError(null);try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({emailOrUsername,password}),});const data=await res.json();if(!res.ok||!data.success||!data.user){setLoginError(data.message||'Login failed.');}else{authContextLogin(data.user as AuthenticatedUser);}}catch(err){setLoginError('Login error.');}finally{setIsLoggingIn(false);}};
  useEffect(() => { console.log("ChatPage: Auth state. isLoadingAuth:", isLoadingAuth, "currentUser:", currentUser?.username);}, [currentUser,isLoadingAuth]);

  let pageStatusMessage="Initializing...";if(isLoadingAuth)pageStatusMessage="";else if(!currentUser)pageStatusMessage="Please login";
  if(isLoadingAuth){return(<div className={styles.pageLoaderContainer}><Spinner size="lg" className="text-[rgb(240,186,57)]" /><p className="ml-4 mt-3 text-sm">{pageStatusMessage}</p></div>);}
  if(!currentUser){return(<div className={styles.loginPageContainer}><div className={styles.loginFormWrapper}><div className={styles.logoContainer}><img src='/logo.png'></img><p className={styles.tagline}>Minimalist Chat</p></div><form onSubmit={handleActualLogin} className={styles.loginForm}>{loginError&&<p className={styles.errorMessage}>{loginError}</p>}<Input label="Email or Username" id="mainLoginEmailOrUsername" type="text" value={emailOrUsername} onChange={(e)=>setEmailOrUsername(e.target.value)} required placeholder="username or email" disabled={isLoggingIn} autoComplete="username" wrapperClassName="!mb-0"/><Input label="Password" id="mainLoginPassword" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required placeholder="••••••••" disabled={isLoggingIn} autoComplete="current-password" wrapperClassName="!mb-0"/><div style={{paddingTop:'0.5rem'}}><Button type="submit" fullWidth className={styles.authButton} isLoading={isLoggingIn} disabled={isLoggingIn} variant="primary">{isLoggingIn?'':'Log In'}</Button></div><p className={styles.signupPrompt}>No account?{' '}<Link href="/signup" className={styles.formLink}>Create one</Link></p></form></div><p className={styles.footerText}>© {new Date().getFullYear()} Buzzly Minimal</p></div>);}

  // User is authenticated, render ChatAppInterface directly
  // No SocketProvider needed for polling model
  return ( <ChatAppInterface /> );
}