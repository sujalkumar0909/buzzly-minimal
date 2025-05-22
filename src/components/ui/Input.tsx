// src/components/ui/Input.tsx
'use client';
import React from 'react';
import styles from './Input.module.css'; // Import CSS Module

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string; // To override default wrapper styles (like mb-4)
  // The 'className' prop from React.InputHTMLAttributes will apply to the <input> itself
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  error,
  wrapperClassName, // For the div
  className,        // For the actual <input> tag
  ...props
}) => {
  const inputId = id || props.name || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`${styles.inputWrapper} ${wrapperClassName || ''}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          ${styles.inputElement}
          ${error ? styles.inputElementError : ''}
          ${className || ''}
        `}
        {...props}
      />
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
};

export default Input;