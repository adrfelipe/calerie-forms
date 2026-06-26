"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none leading-none";

  const variants: Record<string, string> = {
    primary:
      "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover active:bg-primary",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-muted active:bg-muted shadow-sm",
    outline:
      "border border-input bg-card text-foreground hover:bg-muted active:bg-muted shadow-sm",
    ghost:
      "text-foreground hover:bg-muted active:bg-muted",
    danger:
      "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive",
  };

  const sizes: Record<string, string> = {
    sm: "min-h-[36px] px-3 py-1.5 text-sm gap-1.5",
    md: "min-h-[40px] px-4 py-2 text-sm gap-2",
    lg: "min-h-[48px] px-6 py-3 text-base gap-2",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
