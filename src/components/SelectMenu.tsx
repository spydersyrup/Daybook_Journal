import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectMenuProps {
  label: string;
  value: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  onChange: (value: string) => void;
  className?: string;
}

export function SelectMenu({ label, value, options, onChange, className = '' }: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.id === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeAndReturnFocus = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleSelect = (nextId: string) => {
    onChange(nextId);
    closeAndReturnFocus();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        const index = options.findIndex((opt) => opt.id === value);
        const nextIndex = (index + 1) % options.length;
        onChange(options[nextIndex].id);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        const index = options.findIndex((opt) => opt.id === value);
        const prevIndex = (index - 1 + options.length) % options.length;
        onChange(options[prevIndex].id);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeAndReturnFocus();
    }
  };

  return (
    <div ref={rootRef} className={`relative inline-block text-left ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="flex h-7 w-full items-center justify-between gap-1.5 rounded-md border border-white/[.06] bg-white/[.03] px-2.5 text-left text-xs font-normal text-stone-300 transition hover:bg-white/[.06] hover:text-white"
      >
        <span className="truncate">{selected?.label || label}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-stone-400 transition-transform duration-150 ${
            open ? 'rotate-180 text-stone-200' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute right-0 z-50 mt-1 min-w-[8.5rem] w-full max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-[#191716] p-1 shadow-xl shadow-black/60 scroll-area"
        >
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.id)}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition ${
                  isSelected
                    ? 'bg-white/[.08] text-white font-medium'
                    : 'text-stone-300 hover:bg-white/[.04] hover:text-white'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="h-3 w-3 shrink-0 text-stone-300" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
