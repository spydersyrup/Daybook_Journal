import React, { useMemo } from 'react';
import { X, Calendar, Flame, BookOpen, Tag, Layers } from 'lucide-react';
import type { JournalEntry } from '../types';
import { Dialog } from './Dialog';

interface JournalInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onOpenDigest?: () => void;
}

export const JournalInsightsModal: React.FC<JournalInsightsModalProps> = ({
  isOpen,
  onClose,
  entries,
  onOpenDigest,
}) => {
  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const totalWords = entries.reduce((acc, e) => acc + (e.wordCount || 0), 0);

    const uniqueDates = new Set(
      entries.map((e) => new Date(e.createdAt).toDateString())
    );
    const writingDays = uniqueDates.size;

    let streak = 0;
    if (entries.length > 0) {
      const sortedTimestamps = Array.from(
        new Set(
          entries.map((e) => {
            const d = new Date(e.createdAt);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          })
        )
      ).sort((a, b) => b - a);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayTime = yesterday.getTime();

      if (sortedTimestamps[0] === todayTime || sortedTimestamps[0] === yesterdayTime) {
        streak = 1;
        let expectedPrevious = sortedTimestamps[0] - 86400000;
        for (let i = 1; i < sortedTimestamps.length; i++) {
          if (sortedTimestamps[i] === expectedPrevious) {
            streak++;
            expectedPrevious -= 86400000;
          } else {
            break;
          }
        }
      }
    }

    const moodCounts: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
    });

    const moodList = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const tagCounts: Record<string, number> = {};
    entries.forEach((e) => {
      (e.tags || []).forEach((t) => {
        const clean = t.toLowerCase().trim();
        if (clean) {
          tagCounts[clean] = (tagCounts[clean] || 0) + 1;
        }
      });
    });

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      totalEntries,
      totalWords,
      writingDays,
      streak,
      moodList,
      topTags,
    };
  }, [entries]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} label="Journal Insights" className="max-w-lg">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[.06] px-5 py-3.5 bg-[#141311]">
        <div>
          <h2 className="font-serif-editor text-base font-medium text-stone-100">Journal Insights</h2>
          <p className="text-xs text-stone-400 mt-0.5">Overview across your reflections</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:text-stone-200"
          aria-label="Close journal insights"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-y-auto p-5 space-y-5 scroll-area bg-[#141311]">
        {onOpenDigest && entries.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[.08] bg-white/[.02] p-3.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-stone-300">
                <Layers className="h-3.5 w-3.5 text-stone-400" />
                <span>Longitudinal Digest</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Synthesize recurring themes, emotional trajectories & growth patterns across entries
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDigest();
              }}
              className="shrink-0 rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-900 transition hover:bg-white"
            >
              Synthesize
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-lg border border-white/[.04] bg-white/[.02] p-3 space-y-0.5">
            <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
              <BookOpen className="h-3 w-3 text-stone-400" />
              <span>Entries</span>
            </div>
            <p className="font-serif-editor text-xl font-medium text-stone-100">
              {stats.totalEntries}
            </p>
          </div>

          <div className="rounded-lg border border-white/[.04] bg-white/[.02] p-3 space-y-0.5">
            <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
              <span className="text-xs font-serif-editor text-stone-400">W</span>
              <span>Words</span>
            </div>
            <p className="font-serif-editor text-xl font-medium text-stone-100">
              {stats.totalWords.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border border-white/[.04] bg-white/[.02] p-3 space-y-0.5">
            <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
              <Calendar className="h-3 w-3 text-stone-400" />
              <span>Days</span>
            </div>
            <p className="font-serif-editor text-xl font-medium text-stone-100">
              {stats.writingDays}
            </p>
          </div>

          <div className="rounded-lg border border-white/[.04] bg-white/[.02] p-3 space-y-0.5">
            <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
              <Flame className="h-3 w-3 text-stone-400" />
              <span>Streak</span>
            </div>
            <p className="font-serif-editor text-xl font-medium text-stone-100">
              {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-white/[.04] bg-white/[.02] p-3.5">
          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
            Recorded Feelings
          </span>

          {stats.moodList.length === 0 ? (
            <p className="text-xs text-stone-500 font-serif-editor italic pt-1">
              No feelings recorded yet.
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              {stats.moodList.map(({ mood, count, percentage }) => (
                <div key={mood} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-stone-300 font-medium">{mood}</span>
                    <span className="text-stone-500 text-[11px]">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/[.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-stone-400 transition-all duration-300"
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-white/[.04] bg-white/[.02] p-3.5">
          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
            Most-Used Tags
          </span>

          {stats.topTags.length === 0 ? (
            <p className="text-xs text-stone-500 font-serif-editor italic pt-1">
              No tags recorded yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {stats.topTags.map(({ tag, count }) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 rounded bg-white/[.04] px-2 py-0.5 text-xs text-stone-300"
                >
                  <Tag className="h-2.5 w-2.5 text-stone-400" />
                  <span>#{tag}</span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 justify-end border-t border-white/[.06] px-5 py-3 bg-[#141311]">
        <button
          type="button"
          onClick={onClose}
          className="rounded px-3 py-1 text-xs text-stone-300 hover:text-white transition"
        >
          Close
        </button>
      </div>
    </Dialog>
  );
};
