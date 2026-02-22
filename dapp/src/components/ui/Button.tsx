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

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-[#C9A227] to-[#B8860B] hover:from-[#D4AF37] hover:to-[#C9A227] !text-white border border-[#C9A227]/40 shadow-lg shadow-[#C9A227]/20 transition-all duration-300',
  secondary:
    'bg-[#191D24] hover:bg-[#232A34] !text-white border border-[#2F3844] hover:border-[#3D4852] transition-all duration-300',
  danger:
    'bg-[#4C1D1D]/80 hover:bg-[#5C2424] !text-white border border-[#7F1D1D]/60 hover:border-[#991B1B] transition-all duration-300',
  ghost:
    'bg-[#191D24]/60 hover:bg-[#232A34] !text-white border border-[#2F3844] hover:border-[#3D4852] transition-all duration-300',
  gold:
    'bg-[#C9A227]/20 hover:bg-[#C9A227]/30 !text-[#D4AF37] border border-[#C9A227]/50 hover:border-[#C9A227] transition-all duration-300',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-xl
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
