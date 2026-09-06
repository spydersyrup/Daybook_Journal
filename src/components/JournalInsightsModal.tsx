import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Flame,
  BookOpen,
  Tag,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Compass,
  Award,
  BarChart3,
} from 'lucide-react';
import type { JournalEntry } from '../types';
import { Dialog } from './Dialog';

interface JournalInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onOpenDigest?: () => void;
}

const MOOD_THEME: Record<
  string,
  { label: string; color: string; bg: string; border: string; glow: string; dot: string; bar: string }
> = {
  gratitude: {
    label: 'Gratitude',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'rgba(245, 158, 11, 0.25)',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400',
  },
  calm: {
    label: 'Calm',
    color: 'text-sky-300',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    glow: 'rgba(14, 165, 233, 0.25)',
    dot: 'bg-sky-400',
    bar: 'bg-sky-400',
  },
  reflective: {
    label: 'Reflective',
    color: 'text-purple-300',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    glow: 'rgba(168, 85, 247, 0.25)',
    dot: 'bg-purple-400',
    bar: 'bg-purple-400',
  },
  energized: {
    label: 'Energized',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'rgba(16, 185, 129, 0.25)',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-400',
  },
  motivated: {
    label: 'Motivated',
    color: 'text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: 'rgba(249, 115, 22, 0.25)',
    dot: 'bg-orange-400',
    bar: 'bg-orange-400',
  },
  anxious: {
    label: 'Anxious',
    color: 'text-indigo-300',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    glow: 'rgba(99, 102, 241, 0.25)',
    dot: 'bg-indigo-400',
    bar: 'bg-indigo-400',
  },
  frustrated: {
    label: 'Frustrated',
    color: 'text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    glow: 'rgba(244, 63, 94, 0.25)',
    dot: 'bg-rose-400',
    bar: 'bg-rose-400',
  },
};

export const JournalInsightsModal: React.FC<JournalInsightsModalProps> = ({
  isOpen,
  onClose,
  entries,
  onOpenDigest,
}) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'emotional' | 'habits' | 'replay'>('activity');
  const [heatmapRange, setHeatmapRange] = useState<'3m' | '6m' | '1y'>('6m');
  const [inspectedDay, setInspectedDay] = useState<{
    dateStr: string;
    count: number;
    words: number;
    entries: JournalEntry[];
  } | null>(null);

  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const totalWords = entries.reduce((acc, e) => acc + (e.wordCount || 0), 0);
    const avgWords = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

    // Daily entries map: "YYYY-MM-DD" -> data
    const entriesByDay = new Map<string, { count: number; words: number; entries: JournalEntry[] }>();
    entries.forEach((e) => {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const prev = entriesByDay.get(key) || { count: 0, words: 0, entries: [] };
      entriesByDay.set(key, {
        count: prev.count + 1,
        words: prev.words + (e.wordCount || 0),
        entries: [...prev.entries, e],
      });
    });

    const uniqueDates = entriesByDay.size;

    // Streaks
    let currentStreak = 0;
    let longestStreak = 0;

    if (entries.length > 0) {
      const sortedDates = Array.from(entriesByDay.keys()).sort().reverse();
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      if (sortedDates[0] === todayKey || sortedDates[0] === yesterdayKey) {
        currentStreak = 1;
        let cursor = new Date(sortedDates[0]);
        for (let i = 1; i < sortedDates.length; i++) {
          cursor.setDate(cursor.getDate() - 1);
          const expectedKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
          if (sortedDates.includes(expectedKey)) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      const allAscDates = Array.from(entriesByDay.keys()).sort();
      let tempStreak = 0;
      let prevDate: Date | null = null;
      for (const dStr of allAscDates) {
        const curr = new Date(dStr);
        if (!prevDate) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((curr.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        prevDate = curr;
      }
    }

    // Moods breakdown
    const moodCounts: Record<string, number> = {};
    let upliftingCount = 0;
    let totalMoodsCount = 0;

    entries.forEach((e) => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
        totalMoodsCount++;
        if (['gratitude', 'calm', 'reflective', 'energized', 'motivated'].includes(e.mood)) {
          upliftingCount++;
        }
      }
    });

    const upliftingPercentage = totalMoodsCount > 0 ? Math.round((upliftingCount / totalMoodsCount) * 100) : 100;

    const moodList = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0,
        theme: MOOD_THEME[mood] || {
          label: mood,
          color: 'text-stone-300',
          bg: 'bg-stone-500/10',
          border: 'border-stone-500/20',
          glow: 'rgba(255, 255, 255, 0.1)',
          dot: 'bg-stone-400',
          bar: 'bg-stone-400',
        },
      }))
      .sort((a, b) => b.count - a.count);

    // Chronological emotional sequence
    const sortedChronological = [...entries].sort((a, b) => a.createdAt - b.createdAt);
    const emotionalTrajectory = sortedChronological
      .filter((e) => e.mood)
      .slice(-10)
      .map((e) => ({
        id: e.id,
        title: e.title || 'Untitled Reflection',
        date: new Date(e.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        mood: e.mood!,
        theme: MOOD_THEME[e.mood!] || MOOD_THEME.reflective,
      }));

    // Time of day
    const timeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    entries.forEach((e) => {
      const hour = new Date(e.createdAt).getHours();
      if (hour >= 5 && hour < 12) timeOfDay.morning++;
      else if (hour >= 12 && hour < 17) timeOfDay.afternoon++;
      else if (hour >= 17 && hour < 22) timeOfDay.evening++;
      else timeOfDay.night++;
    });

    const timeBreakdown = [
      {
        id: 'morning',
        label: 'Dawn & Morning',
        time: '5 AM – 12 PM',
        count: timeOfDay.morning,
        icon: Coffee,
        color: 'text-amber-300',
        percentage: totalEntries > 0 ? Math.round((timeOfDay.morning / totalEntries) * 100) : 0,
      },
      {
        id: 'afternoon',
        label: 'Midday Afternoon',
        time: '12 PM – 5 PM',
        count: timeOfDay.afternoon,
        icon: Sun,
        color: 'text-orange-300',
        percentage: totalEntries > 0 ? Math.round((timeOfDay.afternoon / totalEntries) * 100) : 0,
      },
      {
        id: 'evening',
        label: 'Sunset & Dusk',
        time: '5 PM – 10 PM',
        count: timeOfDay.evening,
        icon: Sunset,
        color: 'text-rose-300',
        percentage: totalEntries > 0 ? Math.round((timeOfDay.evening / totalEntries) * 100) : 0,
      },
      {
        id: 'night',
        label: 'Late Night',
        time: '10 PM – 5 AM',
        count: timeOfDay.night,
        icon: Moon,
        color: 'text-indigo-300',
        percentage: totalEntries > 0 ? Math.round((timeOfDay.night / totalEntries) * 100) : 0,
      },
    ];

    let writingPersona = 'Mindful Chronicler';
    const topTime = [...timeBreakdown].sort((a, b) => b.count - a.count)[0];
    if (topTime && topTime.count > 0) {
      if (topTime.id === 'morning') writingPersona = 'Dawn Thinker';
      else if (topTime.id === 'afternoon') writingPersona = 'Midday Observer';
      else if (topTime.id === 'evening') writingPersona = 'Evening Philosopher';
      else if (topTime.id === 'night') writingPersona = 'Midnight Scribe';
    }

    // Themes
    const themeFrequency: Record<string, number> = {};
    entries.forEach((e) => {
      (e.tags || []).forEach((t) => {
        const clean = t.toLowerCase().trim();
        if (clean) themeFrequency[clean] = (themeFrequency[clean] || 0) + 1;
      });
      (e.analysis?.keyThemes || []).forEach((kt) => {
        const clean = kt.toLowerCase().trim();
        if (clean) themeFrequency[clean] = (themeFrequency[clean] || 0) + 1;
      });
    });

    const topThemes = Object.entries(themeFrequency)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Heatmap calculation based on selected range
    const totalWeeks = heatmapRange === '3m' ? 14 : heatmapRange === '6m' ? 24 : 48;
    const today = new Date();
    const endDate = new Date(today);
    const dayOfWeek = endDate.getDay();
    const daysUntilSaturday = 6 - dayOfWeek;
    endDate.setDate(endDate.getDate() + daysUntilSaturday);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (totalWeeks * 7 - 1));

    const weeks: Array<{
      monthLabel?: string;
      days: Array<{ dateStr: string; words: number; count: number; dayOfWeek: number; entries: JournalEntry[] }>;
    }> = [];

    let currentDayCursor = new Date(startDate);
    let lastMonth = -1;

    for (let w = 0; w < totalWeeks; w++) {
      const currentDays: Array<{ dateStr: string; words: number; count: number; dayOfWeek: number; entries: JournalEntry[] }> = [];
      let monthLabel: string | undefined = undefined;

      for (let d = 0; d < 7; d++) {
        const dKey = `${currentDayCursor.getFullYear()}-${String(currentDayCursor.getMonth() + 1).padStart(2, '0')}-${String(currentDayCursor.getDate()).padStart(2, '0')}`;
        const dayData = entriesByDay.get(dKey);
        const currMonth = currentDayCursor.getMonth();

        if (currMonth !== lastMonth && !monthLabel) {
          monthLabel = currentDayCursor.toLocaleDateString([], { month: 'short' });
          lastMonth = currMonth;
        }

        currentDays.push({
          dateStr: dKey,
          words: dayData?.words || 0,
          count: dayData?.count || 0,
          dayOfWeek: currentDayCursor.getDay(),
          entries: dayData?.entries || [],
        });

        currentDayCursor.setDate(currentDayCursor.getDate() + 1);
      }

      weeks.push({ monthLabel, days: currentDays });
    }

    const totalDaysInPeriod = totalWeeks * 7;
    let daysWithWriting = 0;
    weeks.forEach((w) => {
      w.days.forEach((d) => {
        if (d.count > 0) daysWithWriting++;
      });
    });
    const consistencyRate = totalDaysInPeriod > 0 ? Math.round((daysWithWriting / totalDaysInPeriod) * 100) : 0;

    return {
      totalEntries,
      totalWords,
      avgWords,
      writingDays: uniqueDates,
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      moodList,
      upliftingPercentage,
      emotionalTrajectory,
      timeBreakdown,
      writingPersona,
      topThemes,
      weeks,
      totalDaysInPeriod,
      daysWithWriting,
      consistencyRate,
    };
  }, [entries, heatmapRange]);

  const moodReplay = useMemo(() => {
    const positive = new Set(['calm', 'gratitude', 'energized', 'motivated']);
    const contexts = new Map<string, { total: number; positive: number; words: number }>();
    entries.forEach((entry) => {
      const labels = [entry.location?.name, ...entry.tags].filter(Boolean) as string[];
      labels.forEach((label) => {
        const key = label.trim();
        if (!key) return;
        const item = contexts.get(key) || { total: 0, positive: 0, words: 0 };
        item.total += 1;
        item.positive += positive.has(entry.mood || '') ? 1 : 0;
        item.words += entry.wordCount || 0;
        contexts.set(key, item);
      });
    });
    return [...contexts.entries()]
      .map(([label, value]) => ({ label, ...value, score: Math.round((value.positive / value.total) * 100) }))
      .sort((a, b) => b.score - a.score || b.total - a.total)
      .slice(0, 6);
  }, [entries]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} label="Journal Insights" className="max-w-3xl">
      {/* Sleek Top Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4 bg-[#141210]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] shadow-xs">
            <BarChart3 className="h-4.5 w-4.5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-editor text-lg font-medium tracking-tight text-[#f5efe6]">
                Journal Insights & Trajectory
              </h2>
              <span className="rounded-full bg-stone-800/90 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-stone-300">
                {stats.totalEntries} {stats.totalEntries === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Longitudinal habit matrix, emotional shifts, and cognitive patterns
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.04] bg-white/[0.02] text-stone-400 hover:bg-white/[0.08] hover:text-stone-100 transition"
          aria-label="Close insights modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Control Slider */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.04] bg-[#100f0e] px-6 py-2.5">
        <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] p-1 border border-white/[0.04]">
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'activity'
                ? 'bg-white/[0.1] text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            <span>Activity Heatmap</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emotional')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'emotional'
                ? 'bg-white/[0.1] text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
            <span>Emotional Trajectory</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('habits')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'habits'
                ? 'bg-white/[0.1] text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-sky-400" />
            <span>Rhythm & Themes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('replay')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${activeTab === 'replay' ? 'bg-white/[0.1] text-white shadow-xs' : 'text-stone-400 hover:text-stone-200'}`}
          >
            <Compass className="h-3.5 w-3.5 text-amber-300" />
            <span>Mood Replay</span>
          </button>
        </div>

        {onOpenDigest && entries.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDigest();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20 transition shadow-xs"
          >
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>Synthesize Digest</span>
          </button>
        )}
      </div>

      {/* Main Scrollable Content */}
      <div className="overflow-y-auto p-6 space-y-5 scroll-area bg-[#12110f]">
        {/* Top 4 Modern Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="relative overflow-hidden rounded-xl border border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent p-3.5 space-y-1">
            <div className="flex items-center justify-between text-stone-400 text-[11px]">
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen className="h-3 w-3 text-emerald-400" />
                Total Entries
              </span>
            </div>
            <p className="font-serif-editor text-2xl font-medium text-[#f5efe6]">
              {stats.totalEntries}
            </p>
            <p className="text-[10px] text-stone-500 font-mono">
              ~{stats.avgWords} words/entry
            </p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent p-3.5 space-y-1">
            <div className="flex items-center justify-between text-stone-400 text-[11px]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="text-xs font-serif-editor text-sky-400 font-bold">W</span>
                Words Written
              </span>
            </div>
            <p className="font-serif-editor text-2xl font-medium text-[#f5efe6]">
              {stats.totalWords.toLocaleString()}
            </p>
            <p className="text-[10px] text-stone-500 font-mono">
              across {stats.writingDays} active days
            </p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-amber-500/15 bg-gradient-to-b from-amber-500/[0.05] to-transparent p-3.5 space-y-1">
            <div className="flex items-center justify-between text-stone-400 text-[11px]">
              <span className="flex items-center gap-1.5 font-medium text-amber-200/90">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                Current Streak
              </span>
            </div>
            <p className="font-serif-editor text-2xl font-medium text-[#f5efe6]">
              {stats.currentStreak} <span className="text-xs font-sans text-stone-400">{stats.currentStreak === 1 ? 'day' : 'days'}</span>
            </p>
            <p className="text-[10px] text-stone-500 font-mono">
              Best: {stats.longestStreak} days
            </p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-purple-500/15 bg-gradient-to-b from-purple-500/[0.05] to-transparent p-3.5 space-y-1">
            <div className="flex items-center justify-between text-stone-400 text-[11px]">
              <span className="flex items-center gap-1.5 font-medium text-purple-200/90">
                <Award className="h-3.5 w-3.5 text-purple-400" />
                Archetype
              </span>
            </div>
            <p className="font-serif-editor text-[15px] font-medium text-[#f5efe6] truncate pt-0.5">
              {stats.writingPersona}
            </p>
            <p className="text-[10px] text-stone-500 font-mono">
              {stats.moodList[0]?.mood ? `Dominant: ${stats.moodList[0].mood}` : 'Reflective tone'}
            </p>
          </div>
        </div>

        {/* TAB 1: Activity Heatmap & Streaks */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 space-y-5 shadow-xs">
              {/* Card Header with Time Range Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-4">
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-stone-200 flex items-center gap-2">
                    <span>Chronological Activity Grid</span>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                      {stats.consistencyRate}% active
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Daily volume breakdown. Select any day square to inspect entries.
                  </p>
                </div>

                <div className="flex items-center gap-1 self-start sm:self-auto rounded-lg bg-white/[0.03] p-0.5 border border-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => setHeatmapRange('3m')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                      heatmapRange === '3m'
                        ? 'bg-white/[0.1] text-white shadow-xs'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    3 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeatmapRange('6m')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                      heatmapRange === '6m'
                        ? 'bg-white/[0.1] text-white shadow-xs'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    6 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeatmapRange('1y')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                      heatmapRange === '1y'
                        ? 'bg-white/[0.1] text-white shadow-xs'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    1 Year
                  </button>
                </div>
              </div>

              {/* Centered Heatmap Container */}
              {(() => {
                const cellSizeClass =
                  heatmapRange === '1y'
                    ? 'h-3 w-3 sm:h-3.5 sm:w-3.5'
                    : heatmapRange === '6m'
                    ? 'h-4 w-4 sm:h-[18px] sm:w-[18px]'
                    : 'h-5 w-5 sm:h-6 sm:w-6';

                const cellHeightClass =
                  heatmapRange === '1y'
                    ? 'h-3 sm:h-3.5'
                    : heatmapRange === '6m'
                    ? 'h-4 sm:h-[18px]'
                    : 'h-5 sm:h-6';

                const colWidthClass =
                  heatmapRange === '1y'
                    ? 'w-3 sm:w-3.5'
                    : heatmapRange === '6m'
                    ? 'w-4 sm:w-[18px]'
                    : 'w-5 sm:w-6';

                const gapClass = heatmapRange === '1y' ? 'gap-1' : 'gap-1 sm:gap-1.5';

                return (
                  <div className="w-full flex flex-col items-center justify-center overflow-x-auto py-2">
                    <div className="inline-flex flex-col gap-1.5 mx-auto">
                      {/* Month header row */}
                      <div className={`inline-flex ${gapClass} pl-8 sm:pl-9 h-4 mb-0.5`}>
                        {stats.weeks.map((week, idx) => (
                          <div key={idx} className={`${colWidthClass} relative shrink-0`}>
                            {week.monthLabel && (
                              <span className="absolute left-0 top-0 whitespace-nowrap text-[10px] sm:text-[11px] font-mono text-stone-400 font-medium select-none">
                                {week.monthLabel}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Day labels + Grid Columns */}
                      <div className={`inline-flex ${gapClass} items-center`}>
                        {/* Synchronized 7-slot Day Labels */}
                        <div className={`flex flex-col ${gapClass} text-[10px] text-stone-500 font-mono pr-2 select-none shrink-0`}>
                          {['Sun', '', 'Tue', '', 'Thu', '', 'Sat'].map((label, idx) => (
                            <div key={idx} className={`${cellHeightClass} flex items-center justify-end leading-none`}>
                              <span>{label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Week columns */}
                        {stats.weeks.map((week, wIdx) => (
                          <div key={wIdx} className={`flex flex-col ${gapClass} shrink-0`}>
                            {week.days.map((day, dIdx) => {
                              let cellStyle = 'bg-white/[0.03] border-white/[0.04] hover:border-white/40 hover:bg-white/[0.08]';
                              if (day.words > 0 && day.words < 100) {
                                cellStyle = 'bg-emerald-950/80 border-emerald-700/50 hover:border-emerald-300';
                              } else if (day.words >= 100 && day.words < 300) {
                                cellStyle = 'bg-emerald-600/80 border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.25)] hover:border-emerald-200';
                              } else if (day.words >= 300) {
                                cellStyle = 'bg-emerald-400 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.4)]';
                              }

                              const isSelected = inspectedDay?.dateStr === day.dateStr;

                              return (
                                <button
                                  key={dIdx}
                                  type="button"
                                  onClick={() => setInspectedDay(day)}
                                  className={`${cellSizeClass} rounded-[3px] border transition-all duration-150 cursor-pointer ${cellStyle} ${
                                    isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#141210] scale-125 z-10' : ''
                                  }`}
                                  title={`${day.dateStr}: ${day.words} words (${day.count} entries)`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Bottom Legend & Quick Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.04] text-xs text-stone-400">
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <span>
                    <strong className="text-stone-200 font-semibold">{stats.daysWithWriting}</strong> active days
                  </span>
                  <span>&bull;</span>
                  <span>
                    <strong className="text-stone-200 font-semibold">{stats.currentStreak}</strong> day streak
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-stone-400 self-end sm:self-auto">
                  <span>Less</span>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-[2.5px] bg-white/[0.03] border border-white/[0.04]" />
                    <div className="h-3 w-3 rounded-[2.5px] bg-emerald-950/80 border border-emerald-700/50" />
                    <div className="h-3 w-3 rounded-[2.5px] bg-emerald-600/80 border border-emerald-400/60" />
                    <div className="h-3 w-3 rounded-[2.5px] bg-emerald-400 border border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.35)]" />
                  </div>
                  <span>More</span>
                </div>
              </div>

              {/* Day Inspector Card (Expands when tapped) */}
              {inspectedDay && (
                <div className="rounded-xl border border-white/[0.08] bg-[#161412] p-4 text-xs space-y-2.5 animate-in fade-in duration-150 shadow-inner">
                  <div className="flex items-center justify-between text-stone-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-amber-300" />
                      <span className="font-serif-editor text-sm font-medium">
                        {new Date(inspectedDay.dateStr).toLocaleDateString([], {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-emerald-400 font-semibold">
                        {inspectedDay.words} words &bull; {inspectedDay.count} {inspectedDay.count === 1 ? 'entry' : 'entries'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInspectedDay(null)}
                        className="text-stone-400 hover:text-stone-200 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {inspectedDay.entries.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                      {inspectedDay.entries.map((e) => (
                        <div key={e.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.03] px-3 py-2 text-xs text-stone-300">
                          <span className="font-serif-editor truncate max-w-md text-stone-200">
                            &ldquo;{e.title || 'Untitled Reflection'}&rdquo;
                          </span>
                          {e.mood && (
                            <span className="capitalize text-[10px] font-mono rounded-md bg-white/[0.05] border border-white/[0.06] px-2 py-0.5 text-stone-300">
                              {e.mood}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 font-serif-editor italic pt-1">
                      No journal reflections recorded on this date.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Emotional Trajectory */}
        {activeTab === 'emotional' && (
          <div className="space-y-4">
            {/* Resonance Balance Bar */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-stone-200">
                  Emotional Tone Equilibrium
                </span>
                <span className="font-mono text-xs font-semibold text-amber-300">
                  {stats.upliftingPercentage}% Grounded & Uplifting
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400 transition-all duration-700"
                  style={{ width: `${stats.upliftingPercentage}%` }}
                />
                <div
                  className="h-full bg-rose-500/80 transition-all duration-700"
                  style={{ width: `${100 - stats.upliftingPercentage}%` }}
                />
              </div>
              <p className="text-xs text-stone-400 leading-relaxed font-serif-editor italic">
                {stats.upliftingPercentage >= 70
                  ? 'Your reflections emphasize grounded presence, calm recovery, and gratitude.'
                  : 'You are navigating meaningful challenges and using your journal to work through tensions.'}
              </p>
            </div>

            {/* Spectrum Breakdown */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
                Emotional Spectrum Distribution
              </h3>

              {stats.moodList.length === 0 ? (
                <p className="text-xs text-stone-500 font-serif-editor italic">
                  No feelings tagged yet. Record your mood when writing reflections.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.moodList.map(({ mood, count, percentage, theme }) => (
                    <div
                      key={mood}
                      className={`rounded-xl border p-3.5 transition ${theme.bg} ${theme.border} flex items-center justify-between`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                          <span className={`text-xs font-medium capitalize ${theme.color}`}>
                            {theme.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 font-mono">
                          {count} {count === 1 ? 'reflection' : 'reflections'}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-semibold text-stone-200">
                        {percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chronological Trajectory Sequence */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
                  Recent Emotional Chronology
                </h3>
                <span className="text-[11px] text-stone-500 font-mono">
                  Last {stats.emotionalTrajectory.length} entries
                </span>
              </div>

              {stats.emotionalTrajectory.length === 0 ? (
                <p className="text-xs text-stone-500 font-serif-editor italic">
                  Write more entries to map your emotional evolution over time.
                </p>
              ) : (
                <div className="relative pt-3 pb-2">
                  <div className="absolute top-7 left-4 right-4 h-0.5 bg-white/[0.08] -z-0" />

                  <div className="flex items-center justify-between relative z-10 overflow-x-auto gap-4 py-1">
                    {stats.emotionalTrajectory.map((item, idx) => (
                      <div key={item.id + idx} className="flex flex-col items-center gap-2 shrink-0 min-w-[58px] text-center">
                        <div
                          className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-[11px] font-bold shadow-xs transition-transform hover:scale-125 ${item.theme.bg} ${item.theme.border} ${item.theme.color}`}
                          title={`${item.title} (${item.mood}) - ${item.date}`}
                        >
                          {item.mood.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-mono text-stone-400">{item.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'replay' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[.06] to-transparent p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-300"><Compass className="h-4 w-4" /><h3 className="text-sm font-medium">Mood-to-Moment Replay</h3></div>
              <p className="max-w-xl text-xs leading-relaxed text-stone-400">Which places and themes tend to appear when you feel most grounded? These are patterns in your journal—not diagnoses or predictions.</p>
            </div>
            {moodReplay.length === 0 ? (
              <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-5 text-center text-xs text-stone-500">Add moods, tags, or locations to your entries to reveal personal conditions that support you.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {moodReplay.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
                    <div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-medium text-stone-200">{item.label}</span><span className="font-mono text-xs text-amber-300">{item.score}%</span></div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-amber-300" style={{ width: `${item.score}%` }} /></div>
                    <p className="mt-2 text-[11px] text-stone-500">Appeared in {item.total} {item.total === 1 ? 'entry' : 'entries'} · {item.words} words</p>
                    <p className="mt-2 font-serif-editor text-xs italic text-stone-400">“This context often accompanies your more positive moods.”</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Rhythm & Themes */}
        {activeTab === 'habits' && (
          <div className="space-y-4">
            {/* Time of Day */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
                Journaling Clock
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.timeBreakdown.map((time) => {
                  const Icon = time.icon;
                  return (
                    <div
                      key={time.id}
                      className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`h-4 w-4 ${time.color}`} />
                        <span className="font-mono text-xs font-semibold text-stone-300">{time.percentage}%</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-stone-200">{time.label}</p>
                        <p className="text-[10px] text-stone-500">{time.time}</p>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full bg-stone-300 transition-all duration-500"
                          style={{ width: `${Math.max(time.percentage, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cognitive Themes */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
                Cognitive Focus & Recurring Themes
              </h3>

              {stats.topThemes.length === 0 ? (
                <p className="text-xs text-stone-500 font-serif-editor italic">
                  No themes or tags analyzed yet. Write reflections to discover patterns.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {stats.topThemes.map(({ theme, count }) => (
                    <div
                      key={theme}
                      className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 text-xs text-stone-200 transition hover:bg-white/[0.08] hover:border-white/10"
                    >
                      <Tag className="h-3 w-3 text-stone-400" />
                      <span className="font-serif-editor text-stone-200">{theme}</span>
                      <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-stone-400">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modern Footer */}
      <div className="flex shrink-0 justify-between items-center border-t border-white/[0.06] px-6 py-4 bg-[#141210]">
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span className="font-serif-editor italic">Daybook Intelligence</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-white/[0.08] px-4 py-2 text-xs font-medium text-stone-100 hover:bg-white/[0.15] hover:text-white transition shadow-xs"
        >
          Done
        </button>
      </div>
    </Dialog>
  );
};

