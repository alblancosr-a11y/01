"use client";
import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react';

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'inline-flex items-center justify-center gap-2 font-bold transition-all duration-300 cursor-pointer rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap px-6 shrink-0 active:scale-[0.96] active:brightness-90 glass-interactive';
  const variants: Record<string, string> = {
    primary: `bg-[var(--accent)] text-white shadow-[0_4px_14px_rgba(0,122,255,0.3)] !border-[var(--accent)]/20`,
    secondary: `!bg-white/50 dark:!bg-black/50 text-[var(--accent-text)] !border-[var(--border-2)] shadow-sm`,
    ghost: `!bg-transparent text-[var(--text-2)] hover:text-[var(--text-0)] hover:!bg-white/30 dark:hover:!bg-black/30 !border-transparent`,
    danger: `bg-[var(--error)] text-white shadow-[0_4px_14px_rgba(255,59,48,0.3)] !border-[var(--error)]/20`,
  };
  const sizes: Record<string, string> = {
    sm: 'h-10 text-xs px-4',
    md: 'h-12 text-sm px-6',
    lg: 'h-14 text-base px-10',
  };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
}

export function Card({ children, className = '', hover = false, onClick }: { children: ReactNode; className?: string; hover?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`glass-card rounded-[2rem] ${hover ? 'hover:scale-[1.015] hover:shadow-2xl active:scale-[0.99]' : ''} transition-all duration-400 ease-[cubic-bezier(0.2,0,0,1)] cursor-pointer ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'accent' | 'success' | 'warning' | 'error' }) {
  const variants: Record<string, string> = {
    default: 'bg-white/30 dark:bg-black/40 text-[var(--text-2)] border-white/50 dark:border-white/10',
    accent: 'bg-[var(--accent-light)] text-[var(--accent-text)] border-[var(--accent)]/20',
    success: 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/20',
    warning: 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/20',
    error: 'bg-[var(--error-light)] text-[var(--error)] border-[var(--error)]/20',
  };
  return <span className={`inline-flex items-center !px-4 py-1 rounded-full text-[10px] font-bold glass-interactive border whitespace-nowrap leading-none ${variants[variant]}`}>{children}</span>;
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 rounded-full bg-[var(--bg-3)] overflow-hidden ${className}`}>
      <div className="h-full rounded-full gradient-accent transition-all duration-500 ease-out" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-4 py-3 rounded-2xl border border-[var(--border-1)] bg-white/30 dark:bg-black/30 backdrop-blur-md text-[var(--text-0)] text-sm font-bold placeholder:text-[var(--text-3)] placeholder:font-normal focus:border-[var(--accent)] focus:bg-white/50 dark:focus:bg-black/50 transition-all duration-300 outline-none ${className || ''}`}
      {...props}
    />
  );
}
export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-4 py-3 rounded-2xl border border-[var(--border-1)] bg-white/30 dark:bg-black/30 backdrop-blur-md text-[var(--text-0)] text-sm font-bold placeholder:text-[var(--text-3)] placeholder:font-normal focus:border-[var(--accent)] focus:bg-white/50 dark:focus:bg-black/50 transition-all duration-300 outline-none resize-none ${className || ''}`}
      {...props}
    />
  );
}