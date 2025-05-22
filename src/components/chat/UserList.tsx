// src/components/chat/UserList.tsx
'use client';

import React from 'react';
import Spinner from '@/components/ui/Spinner';
import AvatarPlaceholder from '@/components/ui/AvatarPlaceholder';
import { ClientUser, UnreadCounts } from '@/lib/types';
import { generateChatIdentifier } from '@/lib/utils'; // For getting consistent chatId
import { FiSearch, FiMessageSquare } from 'react-icons/fi';
import styles from './UserList.module.css'; // Import the CSS Module

interface UserListProps {
  users: ClientUser[];
  onSelectUser: (user: ClientUser) => void;
  selectedUserId?: string | null;
  isLoading: boolean; // This is true when a search is actively loading results
  initialMessage?: string | null; // Message like "Type to search" or "No users found"
  unreadCounts: UnreadCounts;
  currentUserId: string; // Logged-in user's ID (guaranteed non-null by parent)
}

const UserListItem: React.FC<{
    user: ClientUser;
    isSelected: boolean;
    onSelectUser: (user: ClientUser) => void;
    unreadCount: number;
}> = ({ user, isSelected, onSelectUser, unreadCount }) => {
    return (
        <li
            onClick={() => onSelectUser(user)}
            className={`${styles.userListItem} ${isSelected ? styles.userListItemSelected : styles.userListItemUnselected}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectUser(user);}} // Accessibility
            aria-selected={isSelected}
            title={`Chat with ${user.name || user.username}`}
        >
            <div className={styles.avatarContainer}>
                <AvatarPlaceholder name={user.name || user.username} size="md" />
                {/* Online indicator was removed for polling model */}
            </div>
            <div className={styles.userInfo}>
                <p className={styles.userName}>{user.name || user.username}</p>
                <p className={styles.userUsername}>@{user.username}</p>
            </div>
            {unreadCount > 0 && (
                <span className={`${styles.unreadBadge} ${isSelected ? styles.unreadBadgeSelected : styles.unreadBadgeUnselected}`}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </li>
    );
}

const UserList: React.FC<UserListProps> = ({
    users,
    onSelectUser,
    selectedUserId,
    isLoading,
    initialMessage,
    unreadCounts,
    currentUserId,
}) => {
  // This specific loading state is when `isLoading` (search) is true AND no users are yet in `foundUsers`
  // It means we are waiting for the *first* set of search results.
  // If isLoading is true but foundUsers has items, it means a subsequent search is loading.
  if (isLoading && users.length === 0) {
    return (
      <div className={styles.spinnerContainer}>
        <Spinner size="md" className="text-[rgb(240,186,57)]" />
        <span>Searching...</span>
      </div>
    );
  }

  // Show an initial message if provided (e.g., "Type to search", "No users found matching criteria")
  // and there are no users to display and not currently loading.
  if (initialMessage && users.length === 0 && !isLoading) {
    return (
      <div className={styles.listStatusContainer}>
        <FiSearch className={styles.listStatusIcon} />
        <p className={styles.listStatusTextLarge}>{initialMessage}</p>
      </div>
    );
  }

  // If no specific initial message, but still no users and not loading (e.g., after a failed search that didn't set initialMessage)
  if (users.length === 0 && !initialMessage && !isLoading) {
    return (
      <div className={styles.listStatusContainer}>
        <FiMessageSquare className={styles.listStatusIcon} />
        <p className={styles.listStatusTextLarge}>No users available</p>
        <p className={styles.listStatusTextSmall}>Try searching for someone specific.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.userListContainer} hide-scrollbar`}> {/* Added hide-scrollbar from globals.css */}
      <ul className={styles.userList}>
        {users.map((user) => {
          // currentUserId is guaranteed non-null by parent (ChatAppInterface)
          const chatId = generateChatIdentifier(currentUserId, user._id);
          const count = unreadCounts[chatId] || 0;
          return (
              <UserListItem
                  key={user._id}
                  user={user}
                  isSelected={user._id === selectedUserId}
                  onSelectUser={onSelectUser}
                  unreadCount={count}
              />
          );
        })}
      </ul>
    </div>
  );
};
export default UserList;