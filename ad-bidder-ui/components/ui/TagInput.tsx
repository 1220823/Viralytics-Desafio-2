"use client";

import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  maxTags?: number;
}

export function TagInput({
  label,
  tags,
  onChange,
  placeholder = "Type and press Enter",
  error,
  hint,
  maxTags = 20,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onChange([...tags, trimmed]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}
      <div
        className={`
          min-h-[42px] px-3 py-2 rounded-lg border bg-card
          focus-within:ring-2 focus-within:ring-primary focus-within:border-primary
          transition-colors duration-200
          ${error ? "border-destructive" : "border-input"}
        `}
      >
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                bg-primary/10 text-primary text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1 flex-1 min-w-[120px]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? placeholder : "Add more..."}
              className="flex-1 bg-transparent border-none outline-none text-sm
                placeholder:text-muted-foreground min-w-[80px]"
              disabled={tags.length >= maxTags}
            />
            {inputValue && (
              <button
                type="button"
                onClick={addTag}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <Plus className="w-4 h-4 text-primary" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <div>
          {hint && !error && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <span className="text-xs text-muted-foreground">
          {tags.length}/{maxTags}
        </span>
      </div>
    </div>
  );
}
