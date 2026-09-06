import React from 'react';
import { X, ArrowRight, LockKeyhole, Cloud, Database } from 'lucide-react';
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
        <div className="border-t border-white/6 pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#d6b889]">How a reflection is processed</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            {[
              [LockKeyhole, 'Your browser', 'Firebase signs your request'],
              [Cloud, 'Cloud Run', 'Keeps the Gemini key server-side'],
              [Database, 'Gemini + Firestore', 'Generates insight, stores only your entry'],
            ].map(([Icon, title, description], index) => (
              <React.Fragment key={title as string}>
                <div className="flex-1 rounded-lg border border-white/[.06] bg-[#1b1714] p-3">
                  <Icon className="mb-2 h-3.5 w-3.5 text-[#d6b889]" />
                  <p className="text-[11px] font-medium text-stone-200">{title as string}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-stone-500">{description as string}</p>
                </div>
                {index < 2 && <ArrowRight className="hidden h-4 w-4 self-center text-stone-600 sm:block" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        <p className="rounded-lg border border-amber-500/15 bg-amber-500/[.04] p-3 text-[11px] leading-relaxed text-stone-400">
          If writing suggests immediate danger or self-harm, please contact local emergency services or a trusted person. Daybook is not a crisis service.
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
