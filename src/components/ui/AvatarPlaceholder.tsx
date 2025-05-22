// src/components/ui/AvatarPlaceholder.tsx
'use client';
import React from 'react';
import styles from './AvatarPlaceholder.module.css'; // Import CSS Module

interface AvatarPlaceholderProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string; // For additional, specific override classes
  // textSize prop removed, handled by size now
}

const nameToColorStyle = (name: string): React.CSSProperties => {
  let hash = 0;
  if (!name || name.length === 0) return { backgroundColor: 'rgb(30, 30, 30)' };
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  // A simpler list of hex colors if CSS variables for all these aren't defined.
  // Or, define more bg color vars in globals.css and use them.
  const bgColors = [
    "#412009"
  ];
  const index = Math.abs(hash % bgColors.length);
  return { backgroundColor: bgColors[index] };
};

const getInitials = (name: string): string => {
  if (!name || name.trim() === '') return '?';
  const words = name.trim().split(' ').filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
  return (words[0][0] + (words[words.length - 1][0] || '')).toUpperCase();
};

const AvatarPlaceholder: React.FC<AvatarPlaceholderProps> = ({ name, size = 'md', className = '' }) => {
  const initials = getInitials(name);
  const colorStyle = nameToColorStyle(name || 'User');

  const sizeClass = styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`] || styles.sizeMd;

  return (
    <div
      className={`${styles.avatarBase} ${sizeClass} ${className}`}
      style={colorStyle} // Apply dynamic background color via style prop
      title={name}
    >
      {initials}
    </div>
  );
};

export default AvatarPlaceholder;