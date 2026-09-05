import React, { useState } from 'react';
import { Layers, Calendar, TrendingUp, Compass, Target, X, Check, BookPlus, RefreshCw } from 'lucide-react';
import { Dialog } from './Dialog';
import { generateAIDigest } from '../lib/api';
import type { JournalEntry, AIDigest } from '../types';

interface DigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onSaveAsEntry: (entry: Partial<JournalEntry>) => void;
}

export const DigestModal: React.FC<DigestModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSaveAsEntry,
}) => {
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('7days');
  const [digest, setDigest] = useState<AIDigest | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const targetEntries = React.useMemo(() => {
    const now = Date.now();
    if (timeRange === '7days') {
      const cut = now - 7 * 86400000;
      return entries.filter((e) => e.createdAt >= cut);
    }
    if (timeRange === '30days') {
      const cut = now - 30 * 86400000;
      return entries.filter((e) => e.createdAt >= cut);
    }
    return entries;
  }, [entries, timeRange]);

  const handleGenerate = async () => {
    if (targetEntries.length === 0) {
      setErrorMsg('No journal entries found in this timeframe.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    const labelMap = {
      '7days': 'Past 7 Days',
      '30days': 'Past 30 Days',
      all: 'All Time Reflection',
    };

    try {
      const result = await generateAIDigest({
        entries: targetEntries.slice(0, 30).map((e) => ({
          title: e.title,
          content: e.content,
          mood: e.mood,
          createdAt: e.createdAt,
          location: e.location,
        })),
        timeRangeLabel: labelMap[timeRange],
      });
      setDigest(result);
    } catch (err: any) {
      console.error('Digest error:', err);
      setErrorMsg(err.message || 'Could not generate digest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToJournal = () => {
    if (!digest) return;

    const themes = (digest.recurringThemes || []).map((t) => `- **${t}**`).join('\n');
    const milestones = (digest.growthMilestones || []).map((m) => `- ${m}`).join('\n');
    const tensions = (digest.unresolvedTensions || []).map((u) => `- ${u}`).join('\n');

    const formattedMarkdown = `## Executive Synthesis
> ${digest.executiveSummary || 'A thoughtful period of personal reflection.'}

### Emotional Trajectory
${digest.emotionalTrajectory || 'Grounded emotional continuity across reflections.'}

${themes ? `### Recurring Themes\n${themes}\n\n` : ''}${milestones ? `### Growth Milestones\n${milestones}\n\n` : ''}${tensions ? `### Unresolved Inquiries & Tensions\n${tensions}\n\n` : ''}---

### Guiding Mindful Intention
> *“${digest.guidingIntention || 'Stay open and mindful with each unfolding day.'}”*
`;

    onSaveAsEntry({
      title: `Longitudinal Digest • ${digest.timeRange}`,
      content: formattedMarkdown,
      mood: 'reflective',
      tags: ['digest', 'synthesis', 'review'],
    });

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
      setSavedSuccess(false);
    }, 1200);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} label="Longitudinal Digest" className="max-w-2xl">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[.06] bg-[#141311] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[.06] text-stone-300">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif-editor text-base font-medium text-stone-100">
              Longitudinal Digest
            </h2>
            <p className="text-[11px] text-stone-400">
              Synthesize themes, emotional shifts & growth patterns over time
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:text-stone-200"
          aria-label="Close digest modal"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="scroll-area max-h-[72vh] overflow-y-auto bg-[#141311] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-lg border border-white/[.04] bg-white/[.02] p-3">
          <div className="flex items-center gap-1 rounded-md bg-black/40 p-0.5 border border-white/[.04]">
            <button
              type="button"
              onClick={() => setTimeRange('7days')}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                timeRange === '7days' ? 'bg-[#d6b889] text-black' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Past 7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30days')}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                timeRange === '30days' ? 'bg-[#d6b889] text-black' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Past 30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('all')}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                timeRange === 'all' ? 'bg-[#d6b889] text-black' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All Entries
            </button>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || targetEntries.length === 0}
            className="flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[.06] px-3.5 py-1.5 text-xs font-medium text-stone-200 transition hover:bg-white/[.12] hover:text-white disabled:opacity-40"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border border-stone-300 border-t-transparent animate-spin" />
                <span>Synthesizing {targetEntries.length} entries...</span>
              </>
            ) : (
              <>
                <Compass className="h-3.5 w-3.5" />
                <span>Synthesize ({targetEntries.length} entries)</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded bg-rose-500/20 px-2 py-1 text-[11px] font-medium text-rose-200 hover:bg-rose-500/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
            <div className="h-6 w-6 rounded-full border-2 border-stone-400 border-t-transparent animate-spin" />
            <p className="font-serif-editor text-sm text-stone-300 italic">
              Tracing emotional trajectories and longitudinal growth patterns...
            </p>
            <p className="text-[11px] text-stone-500">
              Examining entries with multi-model fallback resilience
            </p>
          </div>
        )}

        {!loading && !digest && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-stone-400 space-y-2">
            <Compass className="h-8 w-8 text-stone-600 mb-1" />
            <p className="font-serif-editor text-sm text-stone-300">
              {targetEntries.length === 0 ? 'No entries found in this timeframe' : 'No synthesis generated yet'}
            </p>
            <p className="text-xs text-stone-500 max-w-sm">
              {targetEntries.length === 0
                ? 'Try selecting "All Entries" or write a few journal entries to enable longitudinal pattern detection.'
                : 'Select a time window and click Synthesize to distill your personal evolution, emotional trends, and recurring themes.'}
            </p>
          </div>
        )}

        {!loading && digest && (
          <div className="space-y-4 pt-1">
            <div className="rounded-lg border border-white/[.06] bg-white/[.02] p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-stone-400">
                <Layers className="h-3 w-3" />
                <span>Executive Journey Synthesis</span>
              </div>
              <p className="font-serif-editor text-sm sm:text-base leading-relaxed text-stone-200 italic">
                “{digest.executiveSummary}”
              </p>
            </div>

            <div className="rounded-lg border border-white/[.04] bg-white/[.02] p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-stone-400">
                <TrendingUp className="h-3 w-3 text-amber-400" />
                <span>Emotional Trajectory</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-300">
                {digest.emotionalTrajectory}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/[.04] bg-white/[.02] p-3.5 space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                  Recurring Themes
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {digest.recurringThemes.map((t, i) => (
                    <span
                      key={i}
                      className="rounded bg-white/[.05] px-2.5 py-1 text-xs text-stone-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/[.04] bg-white/[.02] p-3.5 space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                  Growth & Breakthroughs
                </span>
                <ul className="space-y-1 pt-0.5 text-xs text-stone-300">
                  {digest.growthMilestones.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {digest.unresolvedTensions?.length > 0 && (
              <div className="rounded-lg border border-white/[.04] bg-white/[.02] p-3.5 space-y-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                  Active Inquiries & Decisions
                </span>
                <ul className="space-y-1 text-xs text-stone-300">
                  {digest.unresolvedTensions.map((u, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-stone-500">•</span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg border border-[#d6b889]/20 bg-[#d6b889]/5 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#d6b889]">
                <Target className="h-3 w-3" />
                <span>Mindful Weekly Intention</span>
              </div>
              <p className="font-serif-editor text-sm text-stone-100 italic">
                “{digest.guidingIntention}”
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-white/[.06] bg-[#11100f] px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition"
        >
          Close
        </button>

        {digest && (
          <button
            type="button"
            onClick={handleSaveToJournal}
            disabled={savedSuccess}
            className="flex items-center gap-1.5 rounded bg-[#d6b889] px-3.5 py-1.5 text-xs font-medium text-black transition hover:bg-[#e4c99e]"
          >
            {savedSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Saved to Journal!</span>
              </>
            ) : (
              <>
                <BookPlus className="h-3.5 w-3.5" />
                <span>Save as Weekly Review Entry</span>
              </>
            )}
          </button>
        )}
      </div>
    </Dialog>
  );
};
