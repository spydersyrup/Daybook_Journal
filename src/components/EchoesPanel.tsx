import React, { useMemo } from 'react';
import { ArrowUpRight, Clock3, GitCompareArrows, Sparkles } from 'lucide-react';
import type { JournalEntry } from '../types';

interface EchoesPanelProps {
  currentEntry: JournalEntry;
  entries: JournalEntry[];
  onInsert: (text: string) => void;
}

const STOP_WORDS = new Set('the and that this with from have your you for was are but not into about just like what when then they'.split(' '));

function keywords(text: string) {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter((word) => word.length > 4 && !STOP_WORDS.has(word))
  );
}

export const EchoesPanel: React.FC<EchoesPanelProps> = ({ currentEntry, entries, onInsert }) => {
  const echoes = useMemo(() => {
    const currentWords = keywords(currentEntry.content);
    return entries
      .filter((entry) => entry.id !== currentEntry.id && entry.content.trim())
      .map((entry) => {
        const sharedTags = entry.tags.filter((tag) => currentEntry.tags.some((currentTag) => currentTag.toLowerCase() === tag.toLowerCase()));
        const sharedWords = [...keywords(entry.content)].filter((word) => currentWords.has(word));
        return { entry, sharedTags, sharedWords, score: sharedTags.length * 3 + sharedWords.length };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || b.entry.createdAt - a.entry.createdAt)
      .slice(0, 2);
  }, [currentEntry, entries]);

  const experiment = currentEntry.analysis?.actionItems?.[0] || 'Protect one small pause tomorrow and notice what changes when you make room for it.';
  const checkIn = `\n\n## Reflection loop\n**Experiment:** ${experiment}\n\n**Check-in:** What happened when I tried this, and what did I learn?\n`;

  return (
    <section className="space-y-3 rounded-xl border border-[#d6b889]/15 bg-gradient-to-b from-[#d6b889]/[.05] to-transparent p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d6b889]/10 text-[#d6b889]"><GitCompareArrows className="h-4 w-4" /></div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-200">Echoes</h3>
            <p className="text-[10px] text-stone-500">Connections across your own writing</p>
          </div>
        </div>
        <Sparkles className="h-3.5 w-3.5 text-[#d6b889]/70" />
      </div>

      {echoes.length > 0 ? echoes.map(({ entry, sharedTags, sharedWords }) => (
        <article key={entry.id} className="rounded-lg border border-white/[.06] bg-black/10 p-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-stone-200">{entry.title || 'Untitled reflection'}</p>
            <span className="flex shrink-0 items-center gap-1 text-[10px] text-stone-500"><Clock3 className="h-3 w-3" />{new Date(entry.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="font-serif-editor text-xs leading-relaxed text-stone-400">“{entry.content.trim().slice(0, 180)}{entry.content.length > 180 ? '…' : ''}”</p>
          <p className="mt-2 text-[10px] text-[#d6b889]/80">
            Connected by {[...sharedTags, ...sharedWords.slice(0, 3)].slice(0, 4).map((item) => `#${item}`).join(' · ')}
          </p>
        </article>
      )) : (
        <p className="rounded-lg border border-white/[.06] bg-black/10 p-3 text-[11px] leading-relaxed text-stone-500">Your next entry may create the first echo. Keep writing—patterns become visible with time.</p>
      )}

      <div className="border-t border-white/[.06] pt-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300/80"><Sparkles className="h-3 w-3" />Reflection loop</div>
        <p className="font-serif-editor text-xs leading-relaxed text-stone-300">Turn this reflection into a small experiment, then check back on what you learned.</p>
        <button type="button" onClick={() => onInsert(checkIn)} className="mt-2 flex items-center gap-1 text-[11px] text-stone-400 transition hover:text-stone-100">
          Add experiment to entry <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </section>
  );
};
