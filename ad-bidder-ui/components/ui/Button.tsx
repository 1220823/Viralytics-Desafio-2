"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "success" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-primary text-primary-foreground
    hover:bg-primary-dark active:bg-primary-dark
    focus:ring-2 focus:ring-primary focus:ring-offset-2
  `,
  secondary: `
    bg-muted text-foreground
    hover:bg-gray-200 active:bg-gray-300
    focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
  `,
  outline: `
    border-2 border-primary text-primary bg-transparent
    hover:bg-primary hover:text-primary-foreground
    focus:ring-2 focus:ring-primary focus:ring-offset-2
  `,
  ghost: `
    text-foreground bg-transparent
    hover:bg-muted active:bg-gray-200
    focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
  `,
  success: `
    bg-success text-success-foreground
    hover:bg-success-dark active:bg-success-dark
    focus:ring-2 focus:ring-success focus:ring-offset-2
  `,
  destructive: `
    bg-destructive text-destructive-foreground
    hover:bg-red-700 active:bg-red-800
    focus:ring-2 focus:ring-destructive focus:ring-offset-2
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="w-4 h-4">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
