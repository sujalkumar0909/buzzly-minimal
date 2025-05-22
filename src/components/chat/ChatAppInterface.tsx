// src/components/chat/ChatAppInterface.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import UserList from './UserList'; // Assuming UserList.tsx is in the same directory
import ChatWindow from './ChatWindow'; // Assuming ChatWindow.tsx is in the same directory
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';
import Input from '@/components/ui/Input';
import { FiSearch, FiRefreshCw } from 'react-icons/fi'; // FiRefreshCw needed for manual refresh button
import styles from './ChatAppInterface.module.css';
import { ClientUser, Message, UnreadCounts, LeanMessage } from '@/lib/types';
import { generateChatIdentifier } from '@/lib/utils';

const MESSAGE_FETCH_LIMIT = 30;
// POLLING_INTERVAL_MS is removed as we are not polling automatically

const ChatAppInterface: React.FC = () => {
  const { currentUser, logout: authContextLogout } = useAuth();

  // --- States for UI and Data ---
  const [displayedUsers, setDisplayedUsers] = useState<ClientUser[]>([]); // For UserList (search or recents)
  const [recentChatPartners, setRecentChatPartners] = useState<ClientUser[]>([]);
  const [isFetchingRecents, setIsFetchingRecents] = useState<boolean>(true);

  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [userListInitialMessage, setUserListInitialMessage] = useState<string | null>("Loading recent chats...");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCollectionId, setCurrentCollectionId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [messagesPage, setMessagesPage] = useState<number>(1);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  // initialMessagesLoaded state might not be as critical without polling, but can track first load completion
  
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // --- Mobile View State ---
  const [isChatViewActiveMobile, setIsChatViewActiveMobile] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  const handleMobileBackToUserList = () => setIsChatViewActiveMobile(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 640); // Example breakpoint
    if (typeof window !== "undefined") {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  useEffect(() => { if (!isMobileView) setIsChatViewActiveMobile(false); }, [isMobileView]);

  if (!currentUser) {
    return <div className={`${styles.chatAppContainer} ${styles.errorFallback}`}><Spinner size="lg" /> Critical Session Error! Please try reloading or logging in again.</div>;
  }

  // --- Fetch Recent Conversations ---
  const fetchRecentConversations = useCallback(async (isManualRefresh = false) => {
    if (!currentUser.userId) return;
    setIsFetchingRecents(true);
    if (!isManualRefresh && searchTerm === '') setUserListInitialMessage("Loading recent chats...");
    else if (isManualRefresh) setUserListInitialMessage("Refreshing user list...");
    try {
      const response = await fetch('/api/conversations', { headers: { 'X-Current-User-Id': currentUser.userId }});
      const data = await response.json();
      if (data.success && data.users) {
        setRecentChatPartners(data.users);
        // Update displayedUsers only if not currently showing search results or it's a manual refresh of recents
        if (searchTerm.trim() === '' || isManualRefresh) { setDisplayedUsers(data.users); }
        if (data.users.length === 0 && (searchTerm.trim() === '' || isManualRefresh)) { setUserListInitialMessage("No recent chats. Search for users to start a conversation."); }
        else if (searchTerm.trim() === '' || isManualRefresh) { setUserListInitialMessage(null); }
      } else { if (searchTerm.trim() === '' || isManualRefresh) setUserListInitialMessage("Could not load recent chats."); }
    } catch (error) { if (searchTerm.trim() === '' || isManualRefresh) setUserListInitialMessage("Error loading recents."); }
    finally { setIsFetchingRecents(false); }
  }, [currentUser.userId, searchTerm]); // Added searchTerm

  useEffect(() => { if (currentUser.userId) { fetchRecentConversations(false); }}, [currentUser.userId, fetchRecentConversations]);

  // --- Search Logic ---
  const performManualSearch = useCallback(async () => {
    if (!currentUser.userId) return;
    if (searchTerm.trim().length < 2) { setSearchError("Please enter at least 2 characters."); setUserListInitialMessage("Min. 2 chars."); setDisplayedUsers(recentChatPartners); return; } // Show recents if search too short
    setUserListInitialMessage(null); setIsLoadingSearch(true); setSearchError(null); setDisplayedUsers([]); // Clear previous for search
    try { const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm.trim())}`, { headers: { 'X-Current-User-Id': currentUser.userId }}); const data = await response.json(); if (!response.ok || !data.success) { setSearchError(data.message || 'Search failed.'); } else { setDisplayedUsers(data.users as ClientUser[]); if (data.users.length === 0) setUserListInitialMessage("No users found matching search."); } } catch (e) { console.error("Search API error:", e); setSearchError('Search connection error.'); } finally { setIsLoadingSearch(false); }
  }, [currentUser.userId, searchTerm, recentChatPartners]);
  const handleSearchSubmit = useCallback((event?: FormEvent) => { if (event) event.preventDefault(); if (searchTerm.trim() === '') { fetchRecentConversations(true); } else { performManualSearch();} }, [performManualSearch, searchTerm, fetchRecentConversations]);
  useEffect(() => { if (searchTerm.trim() === '' && !isLoadingSearch && !isFetchingRecents) { setDisplayedUsers(recentChatPartners); if (recentChatPartners.length === 0 && !isFetchingRecents) setUserListInitialMessage("No recent chats. Search for users to start a conversation."); else setUserListInitialMessage(null); } else if (searchTerm.trim().length > 0 && searchTerm.trim().length < 2) { setUserListInitialMessage("Keep typing (min 2 chars)...");} }, [searchTerm, recentChatPartners, isLoadingSearch, isFetchingRecents]);

  // --- Message Fetching (Initial load for chat, "Load More", Manual Refresh) ---
  const fetchChatMessages = useCallback(async (collectionId: string, pageToFetch: number, isLoadMoreOp = false, isManualRefresh = false) => {
    if (!currentUser.userId) { console.error("fetchChatMessages: User ID missing."); return; }
    if (!isLoadMoreOp && !isManualRefresh && isLoadingMessages && pageToFetch === 1) return; // Avoid re-fetching initial if already in progress
    if (isLoadMoreOp && (!hasMoreMessages || isLoadingMessages)) return;
    
    console.log(`ChatAppInterface: Fetching messages. Collection: ${collectionId}, Page: ${pageToFetch}, LoadMore: ${isLoadMoreOp}, ManualRefresh: ${isManualRefresh}`);
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/messages/${collectionId}?page=${pageToFetch}&limit=${MESSAGE_FETCH_LIMIT}`, { headers: { 'X-Current-User-Id': currentUser.userId }});
      const data: { success: boolean; messages: LeanMessage[]; currentPage: number; totalPages: number; message?: string; } = await response.json();
      if (data.success) {
        const newApiMessages = data.messages.map((m): Message => ({_id:m._id,content:m.content,timestamp:new Date(m.timestamp),fromUserId:m.fromUserId,fromUsername:m.fromUsername,status:'sent',chatId:collectionId,toUserId:selectedUser?._id || '',}));
        setMessages(prevMessages => {
          const combined = isLoadMoreOp ? [...newApiMessages.reverse(), ...prevMessages] : newApiMessages.reverse(); // if fresh load/refresh, replace. If load more, prepend.
          const uniqueMap = new Map(combined.map(msg => [(msg._id || msg.tempId!), msg]));
          return Array.from(uniqueMap.values()).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
        setHasMoreMessages(data.currentPage < data.totalPages);
        if (!isLoadMoreOp) setMessagesPage(1); // Reset to page 1 on initial load or manual refresh
      } else { setGeneralError(data.message || "Could not load messages."); }
    } catch (e) { setGeneralError("Error fetching messages."); }
    finally { setIsLoadingMessages(false); if (generalError) setTimeout(() => setGeneralError(null), 3000); }
  }, [currentUser.userId, selectedUser, /* removed isLoadingMessages, messagesPage, hasMoreMessages as they cause loops or are set inside */ generalError]);

  // Initial message load when a chat is selected
  useEffect(() => {
    if (currentCollectionId && currentUser.userId) {
      setMessages([]); setMessagesPage(1); setHasMoreMessages(true);
      fetchChatMessages(currentCollectionId, 1, false, false); // isLoadMoreOp=false, isManualRefresh=false
    }
  }, [currentCollectionId, currentUser.userId, fetchChatMessages]); // fetchChatMessages is memoized

  // Manual Refresh Handler
  const handleMasterRefresh = useCallback(() => {
    fetchRecentConversations(true); // Refresh user list (true for manual intent)
    if (currentCollectionId && currentUser.userId && !isLoadingMessages) {
        fetchChatMessages(currentCollectionId, 1, false); // Refresh page 1 of current chat
    }
  }, [fetchRecentConversations, currentCollectionId, currentUser.userId, isLoadingMessages, fetchChatMessages]);

useEffect(() => {
    const intervalId = setInterval(() => {
      handleMasterRefresh();
    }, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [handleMasterRefresh]);

  // Send Message Handler (includes refresh after send)
  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedUser || !currentCollectionId || !currentUser.userId || !currentUser.username) {setGeneralError("Cannot send."); return;}
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
    const optimisticMessage:Message={tempId,chatId:currentCollectionId,fromUserId:currentUser.userId,fromUsername:currentUser.username,toUserId:selectedUser._id,content,timestamp:new Date(),status:'sending'};
    setMessages(p=>[...p,optimisticMessage]);
    try{
      const r=await fetch('/api/messages/send',{method:'POST',headers:{'Content-Type':'application/json','X-User-Id':currentUser.userId,'X-Username':currentUser.username},body:JSON.stringify({toUserId:selectedUser._id,content,chatId:currentCollectionId,tempId, fromUserId:currentUser.userId, fromUsername:currentUser.username})});
      const d:{success:boolean, message?:Message} = await r.json();
      if(d.success && d.message){
        const confirmedMsg = {...d.message, timestamp: new Date(d.message.timestamp), status: 'sent' as const};
        setMessages(p=>p.map(m=>m.tempId===tempId ? confirmedMsg : m));
        // After own message sent, refresh the chat (page 1)
        if (currentCollectionId) fetchChatMessages(currentCollectionId, 1, false, true); // isManualRefresh = true signals a deliberate full page 1 refresh
      } else{ setMessages(p=>p.map(m=>m.tempId===tempId ? {...m,status:'failed'}:m)); setGeneralError("Failed to send.");}
    }catch(e){ setMessages(p=>p.map(m=>m.tempId===tempId ? {...m,status:'failed'}:m)); setGeneralError("Error sending msg.");}
    finally { if(generalError) setTimeout(()=>setGeneralError(null),3000); }
  }, [selectedUser, currentCollectionId, currentUser.userId, currentUser.username, fetchChatMessages, generalError]);
  
  const handleSelectUser = useCallback((userToChatWith: ClientUser) => {
    if (!currentUser.userId) { authContextLogout(); return; }
    if (selectedUser?._id === userToChatWith._id && currentCollectionId) {
        if(isMobileView) setIsChatViewActiveMobile(true); // Still activate view if re-selecting
        return;
    }
    setSelectedUser(userToChatWith);
    const newCollectionIdentifier = generateChatIdentifier(currentUser.userId, userToChatWith._id);
    setCurrentCollectionId(newCollectionIdentifier); // This triggers initial message fetch
    document.title = `${userToChatWith.name} - Buzzly Minimal`;
    if (newCollectionIdentifier) setUnreadCounts(p => ({ ...p, [newCollectionIdentifier]: 0 }));
    if (isMobileView) setIsChatViewActiveMobile(true);
  }, [currentUser.userId, selectedUser, currentCollectionId, authContextLogout, isMobileView]);

  // Document Title Effects
  useEffect(() => { const oF = () => { if(document.title.includes("New Message")&&currentCollectionId){setUnreadCounts(p=>({...p,[currentCollectionId!]:0}));document.title=selectedUser?`${selectedUser.name} - Buzzly Minimal`:"Buzzly Minimal";}}; window.addEventListener('focus',oF);return()=>window.removeEventListener('focus',oF);},[selectedUser,currentCollectionId]);
  useEffect(() => { if(selectedUser && currentUser.userId){const uCS=currentCollectionId?unreadCounts[currentCollectionId!]||0:0;if(uCS>0&&document.hidden)document.title=`(${uCS}) ${selectedUser.name} - Buzzly Minimal`;else document.title=`${selectedUser.name} - Buzzly Minimal`;}else if(document.title.includes("New Message")&&!document.hidden)document.title="Buzzly Minimal";else if(!selectedUser&&!document.title.includes("New Message"))document.title="Buzzly Minimal Chat";},[selectedUser,unreadCounts,currentCollectionId,currentUser.userId]);

  return (
    <div className={`${styles.chatAppContainer} ${isMobileView && isChatViewActiveMobile ? styles.mobileChatViewActive : ''}`}>
      <aside className={styles.sidebar}>
        <div className={styles.Navbar}><img src='/logo.png' width="100px"></img></div>
        {generalError && (<div className={styles.sidebarGeneralError}>{generalError}</div>)}
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <Input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} wrapperClassName={styles.searchInputWrapper} className={styles.searchInput} aria-label="Search users input" />
          <Button type="submit" variant="secondary" size="md" isLoading={isLoadingSearch} disabled={isLoadingSearch || searchTerm.trim().length < 2} aria-label="Search users button" className={styles.searchButton}>
            {isLoadingSearch ? <Spinner size="xs" /> : <FiSearch />}
          </Button>
        </form>
        {searchError && <p className={styles.searchError}>{searchError}</p>}
        <UserList users={displayedUsers} onSelectUser={handleSelectUser} selectedUserId={selectedUser?._id} isLoading={(isLoadingSearch || isFetchingRecents) && displayedUsers.length === 0} initialMessage={userListInitialMessage} unreadCounts={unreadCounts} currentUserId={currentUser.userId} />
        <div className={styles.logoutSection}> <Button onClick={authContextLogout} variant="danger" fullWidth className={styles.logoutButton}>Log Out</Button> </div>
      </aside>
      <section className={styles.chatArea}>
        <ChatWindow
          selectedUser={selectedUser} messages={messages} onSendMessage={handleSendMessage}
          currentUserId={currentUser.userId} isLoadingMessages={isLoadingMessages}
          hasMoreMessages={hasMoreMessages}
          onLoadMoreMessages={() => { if (hasMoreMessages && !isLoadingMessages && currentCollectionId) fetchChatMessages(currentCollectionId, messagesPage + 1, true);}}
          onManualRefresh={handleMasterRefresh} // Pass the manual refresh handler
          showBackButton={isMobileView && !!selectedUser} // Show back button logic
          onMobileBack={handleMobileBackToUserList}   // Back button action
        />
      </section>
    </div>
  );
};
export default ChatAppInterface;