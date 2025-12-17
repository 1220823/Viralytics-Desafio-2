"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  prefix?: string;
  suffix?: string;
  variant?: "default" | "primary" | "success";
}

export function StatCard({
  title,
  value,
  change,
  icon,
  prefix,
  suffix,
  variant = "default",
}: StatCardProps) {
  const bgStyles = {
    default: "bg-card",
    primary: "bg-gradient-to-br from-primary to-primary-light",
    success: "bg-gradient-to-br from-success to-success-light",
  };

  const textStyles = {
    default: "text-card-foreground",
    primary: "text-primary-foreground",
    success: "text-success-foreground",
  };

  const mutedStyles = {
    default: "text-muted-foreground",
    primary: "text-primary-foreground/70",
    success: "text-success-foreground/70",
  };

  return (
    <div
      className={`
        rounded-xl p-5 card-shadow
        ${bgStyles[variant]}
        ${variant !== "default" ? "border-0" : "border border-card-border"}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${mutedStyles[variant]}`}>
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            {prefix && (
              <span className={`text-xl font-semibold ${textStyles[variant]}`}>
                {prefix}
              </span>
            )}
            <span className={`text-2xl font-bold ${textStyles[variant]}`}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </span>
            {suffix && (
              <span className={`text-lg font-medium ${mutedStyles[variant]}`}>
                {suffix}
              </span>
            )}
          </div>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span
                className={`text-sm font-medium ${
                  change >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {change >= 0 ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`
              p-2.5 rounded-lg
              ${variant === "default" ? "bg-primary/10 text-primary" : "bg-white/20"}
            `}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Mini stat for inline displays
interface MiniStatProps {
  label: string;
  value: string | number;
  suffix?: string;
}

export function MiniStat({ label, value, suffix }: MiniStatProps) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-lg font-semibold text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && <span className="text-sm font-normal ml-0.5">{suffix}</span>}
      </p>
    </div>
  );
}
