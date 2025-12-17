"use client";

import { Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
  hint?: string;
  columns?: 1 | 2 | 3;
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  error,
  hint,
  columns = 2,
}: MultiSelectProps) {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <div className={`grid ${gridCols[columns]} gap-2`}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              className={`
                flex items-center justify-between px-3 py-2.5 rounded-lg
                border transition-all duration-200 text-left text-sm
                ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-input bg-card text-foreground hover:border-primary/50"
                }
                ${error ? "border-destructive" : ""}
              `}
            >
              <span className="font-medium">{option.label}</span>
              {isSelected && (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </button>
          );
        })}
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
