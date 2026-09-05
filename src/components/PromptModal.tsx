import React, { useState } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import type { PromptInspiration } from '../types';
import { Dialog } from './Dialog';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: PromptInspiration[];
  onSelectPrompt: (prompt: PromptInspiration) => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  prompts,
  onSelectPrompt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(prompts.map((p) => p.category)));
  const filteredPrompts = selectedCategory
    ? prompts.filter((p) => p.category === selectedCategory)
    : prompts;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} label="Writing prompts" className="max-w-lg">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[.06] px-5 py-3.5 bg-[#141311]">
        <div>
          <h3 className="font-serif-editor text-base font-medium text-stone-100">Prompts</h3>
          <p className="text-xs text-stone-400 mt-0.5">Select an idea to anchor your writing</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:text-stone-200"
          aria-label="Close prompts"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {categories.length > 0 && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-white/[.04] px-5 py-2 bg-[#11100f] scroll-area">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded px-2.5 py-1 text-xs transition shrink-0 ${
              selectedCategory === null
                ? 'bg-white/[.1] text-white font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded px-2.5 py-1 text-xs transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-white/[.1] text-white font-medium'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-y-auto p-4 space-y-2 scroll-area flex-1 bg-[#141311]">
        {filteredPrompts.length === 0 ? (
          <div className="py-10 text-center text-xs text-stone-500 font-serif-editor italic">
            No prompts available.
          </div>
        ) : (
          filteredPrompts.map((prompt) => (
            <button
              type="button"
              key={prompt.id}
              onClick={() => {
                onSelectPrompt(prompt);
                onClose();
              }}
              className="group flex w-full flex-col gap-1.5 rounded-lg border border-white/[.04] bg-white/[.02] p-3 text-left transition hover:bg-white/[.05]"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                  {prompt.category}
                </span>
                <span className="text-xs text-stone-400 transition group-hover:text-stone-200 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="font-serif-editor text-sm text-stone-200 leading-relaxed group-hover:text-white">
                &ldquo;{prompt.text}&rdquo;
              </p>
              <p className="text-xs text-stone-400 leading-relaxed">
                {prompt.guidance}
              </p>
            </button>
          ))
        )}
      </div>
    </Dialog>
  );
};
