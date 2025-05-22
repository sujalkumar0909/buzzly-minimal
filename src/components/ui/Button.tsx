// src/components/ui/Button.tsx
'use client';
import React from 'react';
import Spinner from './Spinner';
import styles from './Button.module.css'; // Import CSS Module

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'link' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className, // For additional custom classes from parent
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}) => {

  const variantClass = styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`];
  const sizeClass = styles[`size${size.toUpperCase()}`] || styles.sizeMd;
  const fullWidthClass = fullWidth ? styles.fullWidth : '';

  // Determine spinner color based on variant for contrast
  let spinnerColorClass = 'text-[rgb(240,186,57)]'; // Default for non-primary/danger
  if (variant === 'primary' || variant === 'danger') {
    spinnerColorClass = 'text-white';
  }


  return (
    <button
      className={`${styles.buttonBase} ${variantClass} ${sizeClass} ${fullWidthClass} ${className || ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size="sm" className={`${styles.spinnerLoading} ${spinnerColorClass}`} />}
      {!isLoading && leftIcon && <span className={`${styles.iconLeft} ${size === 'sm' ? styles.iconSm : styles.iconMd}`}>{leftIcon}</span>}
      
      {/* Keep children rendered but invisible when loading so button size doesn't jump */}
      <span className={isLoading && children ? styles.textHiddenWhileLoading : ''}>
        {children}
      </span>
      
      {!isLoading && rightIcon && <span className={`${styles.iconRight} ${size === 'sm' ? styles.iconSm : styles.iconMd}`}>{rightIcon}</span>}

      {/* If loading and there are children, overlay children to maintain size correctly */}
      {isLoading && children && (
        <span className={styles.textAbsoluteForLoading}>
          {children}
        </span>
      )}
    </button>
  );
};

export default Button;