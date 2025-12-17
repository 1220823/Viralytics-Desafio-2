"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = "", id, checked, ...props }, ref) => {
    const checkboxId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <label
        htmlFor={checkboxId}
        className={`
          flex items-start gap-3 cursor-pointer group
          ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={`
              w-5 h-5 rounded border-2 border-input bg-card
              transition-all duration-200 flex items-center justify-center
              peer-checked:bg-primary peer-checked:border-primary
              peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2
              group-hover:border-primary
            `}
          >
            <Check
              className={`
                w-3.5 h-3.5 text-primary-foreground
                opacity-0 peer-checked:opacity-100 transition-opacity
              `}
              strokeWidth={3}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
