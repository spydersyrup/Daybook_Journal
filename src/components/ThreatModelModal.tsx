import React from 'react';
import { X } from 'lucide-react';
import { Dialog } from './Dialog';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const privacyItems = [
  ['Your account', 'Your journal is connected solely to your personal Google account.'],
  ['Private writing', 'Entries remain strictly private to you and are never shared with other users.'],
  ['Focused reflections', 'When requesting a reflection, digest, or dialogue, your entry is processed solely to generate your response.'],
  ['Location privacy', 'Location tags are attached strictly upon explicit user request and saved solely inside your isolated user path without continuous GPS tracking.'],
  ['Voice confidentiality', 'Spoken notes are transcribed live and structured in-memory. Raw audio streams are never stored or retained on disk.'],
  ['Complete control', 'You can export or permanently delete your entries at any time.'],
] as const;

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} label="Privacy in Daybook" className="max-w-xl">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4 bg-[#14110f]">
        <div>
          <h2 className="font-serif-editor text-lg font-medium text-stone-100">Privacy in Daybook</h2>
          <p className="text-xs text-stone-400 mt-0.5">How your reflections and data are handled</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white/[.08] hover:text-stone-200"
          aria-label="Close privacy details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto p-6 space-y-4 scroll-area bg-[#161311]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {privacyItems.map(([title, description]) => (
            <section key={title} className="rounded-xl border border-white/6 bg-[#1b1714] p-4 space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#d6b889]">{title}</h3>
              <p className="text-xs text-stone-300 leading-relaxed">{description}</p>
            </section>
          ))}
        </div>
        <p className="text-xs text-stone-500 pt-2 border-t border-white/6">
          Daybook is built as an intentional, quiet space for personal writing and self-reflection.
        </p>
      </div>

      <div className="flex shrink-0 justify-end border-t border-white/10 px-6 py-3.5 bg-[#14110f]">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-white/[.08] px-4 py-2 text-xs font-medium text-stone-200 transition-colors hover:bg-white/[.12] hover:text-stone-100"
        >
          Close
        </button>
      </div>
    </Dialog>
  );
};
