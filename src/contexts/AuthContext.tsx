// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedUser } from '@/lib/types'; // <--- IMPORT IT HERE

// Remove local definition if it exists:
// interface AuthenticatedUser { ... } // DELETE THIS LOCAL DEFINITION

interface AuthContextType {
  currentUser: AuthenticatedUser | null;
  isLoadingAuth: boolean;
  login: (userData: AuthenticatedUser) => void; // Uses imported AuthenticatedUser
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const router = useRouter();

  const login = useCallback((userData: AuthenticatedUser) => { // Uses imported AuthenticatedUser
    console.log("[AuthContext] Login: Setting currentUser -", userData.username);
    const userWithDate = {
      ...userData,
      createdAt: typeof userData.createdAt === 'string' ? new Date(userData.createdAt) : userData.createdAt,
    };
    setCurrentUser(userWithDate);
  }, []);

  const logout = useCallback(async () => {
    console.log("[AuthContext] Logout: Clearing currentUser");
    setCurrentUser(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("[AuthContext] Logout API call failed:", error);
    }
    router.push('/chat'); // Or your desired redirect path after logout
    // router.refresh(); // Consider if needed
  }, [router]);

  return (
    <AuthContext.Provider value={{ currentUser, isLoadingAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};