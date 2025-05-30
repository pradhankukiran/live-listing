"use client";

import { useRef, useEffect } from 'react';

interface TextPromptInputProps {
  placeholder?: string;
  value: string;
  onChange: (newValue: string) => void;
  disabled?: boolean;
}

export function TextPromptInput({ 
  placeholder = "Describe the image you want to generate...",
  value,
  onChange,
  disabled = false
}: TextPromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter key from submitting form by default, allow Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Optionally trigger generation here if needed, or handle in parent
    }
  };
  
  // Auto-resize textarea based on content
  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Temporarily shrink height to get accurate scrollHeight
    textarea.style.height = 'auto'; 
    // Set height, respecting max-h-[200px] defined in className
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; 
  };

  // Ensure initial height calculation is correct
  useEffect(() => {
    handleInput();
  }, [value]); // Recalculate on value change
  
  return (
    <div className="relative flex flex-col w-full">
      <textarea
        ref={textareaRef}
        value={value} // Use prop value
        onChange={(e) => onChange(e.target.value)} // Call prop onChange
        onInput={handleInput} // Keep auto-resize
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled} // Use prop disabled
        className="min-h-[80px] max-h-[200px] px-4 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        rows={3} // Initial rows, height adjusts dynamically
      />
    </div>
  );
}