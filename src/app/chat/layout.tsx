// src/app/chat/layout.tsx
'use client'; // Make it a client component if it needs to manage any interactive state for header, else keep as Server

import Link from 'next/link';
import styles from './ChatLayout.module.css';
// No FiRefreshCw needed here anymore

export default function ChatPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.chatLayoutContainer}>

      <main className={styles.chatLayoutMain}>
        {children}
      </main>
    </div>
  );
}