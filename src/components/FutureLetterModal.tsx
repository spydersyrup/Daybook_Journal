import React, { useState } from 'react';
import { LockKeyhole, Mail, X } from 'lucide-react';
import { Dialog } from './Dialog';

interface FutureLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, content: string, unlockAt: number) => void;
}

export const FutureLetterModal: React.FC<FutureLetterModalProps> = ({ isOpen, onClose, onCreate }) => {
  const defaultDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [title, setTitle] = useState('A letter to my future self');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState(defaultDate);

  const handleCreate = () => {
    if (!content.trim() || !unlockDate) return;
    onCreate(title.trim() || 'A letter to my future self', content.trim(), new Date(`${unlockDate}T09:00:00`).getTime());
    setContent('');
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} label="Letter to your future self" className="max-w-xl">
      <div className="flex items-center justify-between border-b border-white/[.06] bg-[#141311] px-5 py-4">
        <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d6b889]/10 text-[#d6b889]"><Mail className="h-4 w-4" /></div><div><h2 className="font-serif-editor text-lg text-stone-100">Letter to future self</h2><p className="text-[11px] text-stone-400">Seal a thought for a version of you who hasn’t arrived yet.</p></div></div>
        <button type="button" onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-stone-200"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-4 bg-[#161311] p-5">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border-b border-white/[.08] bg-transparent pb-2 font-serif-editor text-lg text-stone-100 outline-none placeholder:text-stone-600" placeholder="Letter title" />
        <textarea autoFocus value={content} onChange={(e) => setContent(e.target.value)} placeholder="What do you hope future you remembers, understands, or has the courage to try?" className="min-h-48 w-full resize-y rounded-lg border border-white/[.08] bg-black/20 p-3 font-serif-editor text-base leading-relaxed text-stone-200 outline-none placeholder:text-stone-600 focus:border-[#d6b889]/50" />
        <label className="flex items-center justify-between gap-3 text-xs text-stone-400"><span>Unlock on</span><input type="date" min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} className="rounded border border-white/[.08] bg-white/[.04] px-2 py-1.5 text-stone-200" /></label>
        <p className="flex items-center gap-1.5 text-[10px] leading-relaxed text-stone-500"><LockKeyhole className="h-3 w-3" /> The letter stays sealed in Daybook until the chosen date. You can delete it anytime.</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-white/[.06] bg-[#11100f] px-5 py-3"><button type="button" onClick={onClose} className="rounded px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200">Cancel</button><button type="button" disabled={!content.trim()} onClick={handleCreate} className="rounded bg-[#d6b889] px-3.5 py-1.5 text-xs font-medium text-black disabled:opacity-40">Seal letter</button></div>
    </Dialog>
  );
};
