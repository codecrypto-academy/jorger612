'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: 'ds-btn',
  secondary: 'ds-btn ds-btn--secondary',
  danger: 'ds-btn ds-btn--danger',
  ghost: 'ds-btn ds-btn--ghost',
  gold: 'ds-btn ds-btn--secondary-pink',
};

const sizeClass: Record<Size, string> = {
  sm: 'ds-btn--sm',
  md: '',
  lg: 'ds-btn--lg',
};

export function Button({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }: ButtonProps) {
  const v = variantClass[variant];
  const s = sizeClass[size];
  return (
    <button
      disabled={disabled || loading}
      className={`${v}${s ? ` ${s}` : ''}${className ? ` ${className}` : ''}`.trim()}
      {...props}
    >
      {loading && <span className="ds-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} aria-hidden />}
      {children}
    </button>
  );
}
