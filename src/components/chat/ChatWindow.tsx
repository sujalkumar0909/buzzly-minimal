// src/components/chat/ChatWindow.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiMessageCircle, FiSend, FiAlertCircle, FiClock, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import Spinner from '@/components/ui/Spinner';
import AvatarPlaceholder from '@/components/ui/AvatarPlaceholder';
import Button from '@/components/ui/Button';
import { format, isSameDay, isYesterday } from 'date-fns';
import { ClientUser, Message, MessageStatus } from '@/lib/types';
import { formatDateSeparator, formatMessageTimestamp } from '@/lib/utils';
import styles from './ChatWindow.module.css';
import Input from '../ui/Input';

interface ChatWindowProps {
  selectedUser: ClientUser | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentUserId: string;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  onLoadMoreMessages: () => void;
  onManualRefresh?: () => void;
  showBackButton?: boolean;
  onMobileBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedUser, messages, onSendMessage, currentUserId,
  isLoadingMessages, hasMoreMessages, onLoadMoreMessages, onManualRefresh,
  showBackButton, onMobileBack
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const shouldAutoScrollNewMessageRef = useRef<boolean>(true);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  useEffect(() => { const c=messagesContainerRef.current; if(!c)return; const nSH=c.scrollHeight; if(isProgrammaticScrollRef.current&&prevScrollHeightRef.current>0 && (nSH > prevScrollHeightRef.current)){c.scrollTop=nSH-prevScrollHeightRef.current;isProgrammaticScrollRef.current=false;}else if(shouldAutoScrollNewMessageRef.current){c.scrollTop=nSH;} shouldAutoScrollNewMessageRef.current=true; prevScrollHeightRef.current = nSH;}, [messages]);
  const handleSubmitMessage = (e: React.FormEvent) => { e.preventDefault();if(newMessage.trim()===''||!currentUserId)return;shouldAutoScrollNewMessageRef.current=true;onSendMessage(newMessage.trim());setNewMessage('');const iE=(e.target as HTMLFormElement).elements.namedItem('messageInput')as HTMLInputElement;iE?.focus();};
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useCallback((node: HTMLDivElement | null) => { if (isLoadingMessages || !hasMoreMessages) return; if (observerRef.current) observerRef.current.disconnect(); observerRef.current = new IntersectionObserver(entries => { if (entries[0].isIntersecting && hasMoreMessages && !isLoadingMessages) { shouldAutoScrollNewMessageRef.current = false; isProgrammaticScrollRef.current = true; prevScrollHeightRef.current = messagesContainerRef.current?.scrollHeight || 0; onLoadMoreMessages(); } }, { root: messagesContainerRef.current, threshold: 0.1 }); if (node) observerRef.current.observe(node); }, [isLoadingMessages, hasMoreMessages, onLoadMoreMessages]);
  const renderMessageStatus=(s?:MessageStatus)=>{if(s==='sending')return<FiClock className={styles.statusSending} title="Sending..."/>;if(s==='failed')return<FiAlertCircle className={styles.statusFailed} title="Failed"/>;return null;};

  if (!selectedUser) { return ( <div className={styles.noUserSelectedContainer}> <FiMessageCircle className={styles.noUserSelectedIcon} /> <h2 className={styles.noUserSelectedTitle}>Select a conversation</h2> <p className={styles.noUserSelectedSubtitle}>Choose someone from the list to start chatting.</p> </div> ); }

  return (
    <div className={styles.chatWindowContainer}>
      <header className={styles.chatHeader}>
        <div className={styles.headerLeftControls}>
            {showBackButton && onMobileBack && (
                <button
                    onClick={onMobileBack}
                    aria-label="Back to user list"
                    title="Back to user list"
                    className={styles.mobileBackButton} // Simple button for now
                >
                    <FiArrowLeft className="h-5 w-5" />
                </button>
            )}
            <div className={styles.headerUserInfo}>
                <AvatarPlaceholder name={selectedUser.name || selectedUser.username} size="md" />
                <div>
                    <h2 className={styles.headerUserName}>{selectedUser.name || selectedUser.username}</h2>
                    <p className={styles.headerUserUsername}>@{selectedUser.username}</p>
                </div>
            </div>
        </div>
        <div className={styles.headerActions}>
            {onManualRefresh && (
                <Button onClick={onManualRefresh} variant="ghost" size="icon" aria-label="Refresh chat" title="Refresh chat" disabled={isLoadingMessages} className={styles.refreshButton}>
                    {isLoadingMessages && messages.length > 0 ? <Spinner size="xs" /> : <FiRefreshCw className="h-4 w-4"/>}
                </Button>
            )}
        </div>
      </header>

      <div ref={messagesContainerRef} className={styles.messagesArea}>
        {hasMoreMessages && ( <div ref={loadMoreTriggerRef} className={styles.loadMoreTrigger}> {isLoadingMessages && <Spinner size="sm" className="text-[rgb(240,186,57)]" />} </div> )}
        {(isLoadingMessages && messages.length === 0 ) && ( <div className={styles.initialLoadSpinnerContainer}> <Spinner size="md" className="text-[rgb(240,186,57)]" /> </div> )}
        {!isLoadingMessages && messages.length === 0 && !hasMoreMessages && ( <p className={styles.noMessagesText}>No messages with {selectedUser.name || selectedUser.username} yet. Say hi!</p> )}
        {messages.map((msg, index) => { const cMD = new Date(msg.timestamp); const pMD = index > 0 ? new Date(messages[index-1].timestamp) : null; const sDS = !pMD || !isSameDay(cMD, pMD); return ( <React.Fragment key={msg.tempId || msg._id || `msg-frag-${index}-${cMD.getTime()}`}> {sDS && (<div className={styles.dateSeparatorContainer}><span className={styles.dateSeparatorText}>{formatDateSeparator(cMD)}</span></div>)} <div className={`${styles.messageRow} ${msg.fromUserId === currentUserId ? styles.messageRowSent : styles.messageRowReceived} ${sDS ? styles.messageRowSeparator : ''}`}> <div className={`${styles.messageBubble} ${msg.fromUserId === currentUserId ? styles.messageBubbleSent : styles.messageBubbleReceived}`}> <p>{msg.content}</p> <div className={styles.messageInfo}> {msg.fromUserId === currentUserId && renderMessageStatus(msg.status)} <p className={`${styles.messageTimestamp} ${msg.fromUserId === currentUserId ? styles.messageTimestampSent : styles.messageTimestampReceived}`}>{formatMessageTimestamp(cMD)}</p></div></div></div></React.Fragment> ); })}
      </div>

      <footer className={styles.messageInputFooter}>
        <form onSubmit={handleSubmitMessage} className={styles.messageInputForm}>
          <Input id="messageInput" name="messageInput" type="text" value={newMessage} onChange={handleInputChange} placeholder={`Message @${selectedUser.username}...`} wrapperClassName="!mb-0 flex-grow" className={styles.messageInputField} autoComplete="off" disabled={!selectedUser || !currentUserId} />
          <Button type="submit" variant="primary" size="icon" disabled={!newMessage.trim() || !selectedUser || !currentUserId} className={styles.sendButton} aria-label="Send message"> <FiSend className="h-4 w-4 sm:h-5 sm:w-5" /> </Button>
        </form>
      </footer>
    </div>
  );
};
export default ChatWindow;