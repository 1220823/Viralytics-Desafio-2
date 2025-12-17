"use client";

import { ReactNode } from "react";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "destructive" | "outline";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  outline: "border border-border bg-transparent text-foreground",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Percentage badge with up/down indicator
interface PercentBadgeProps {
  value: number;
  className?: string;
}

export function PercentBadge({ value, className = "" }: PercentBadgeProps) {
  const isPositive = value >= 0;

  return (
    <Badge
      variant={isPositive ? "success" : "destructive"}
      size="sm"
      className={className}
    >
      <span className="flex items-center gap-0.5">
        {isPositive ? "↑" : "↓"} {Math.abs(value).toFixed(1)}%
      </span>
    </Badge>
  );
}
