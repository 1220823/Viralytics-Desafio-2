"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-3 py-2.5 rounded-lg
              border border-input bg-card text-foreground
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted
              transition-colors duration-200
              ${prefix ? "pl-8" : ""}
              ${suffix ? "pr-12" : ""}
              ${error ? "border-destructive focus:ring-destructive" : ""}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {suffix}
            </span>
          )}
        </div>
        {hint && !error && (
          <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
