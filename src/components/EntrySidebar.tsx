import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Trash2, X, MapPin } from 'lucide-react';
import type { JournalEntry } from '../types';
import { SelectMenu } from './SelectMenu';

interface EntrySidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onRequestDelete: (entry: JournalEntry) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const MOOD_OPTIONS = [
  { id: 'gratitude', label: 'Gratitude' },
  { id: 'calm', label: 'Calm' },
  { id: 'reflective', label: 'Reflective' },
  { id: 'energized', label: 'Energized' },
  { id: 'motivated', label: 'Motivated' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'frustrated', label: 'Frustrated' },
];

const cleanMarkdownExcerpt = (content: string): string => {
  if (!content || !content.trim()) return 'Blank entry';
  return content
    .replace(/^#+\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/^>\s+/gm, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
};

export const EntrySidebar: React.FC<EntrySidebarProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onRequestDelete,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Close on Escape on mobile
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggleOpen();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onToggleOpen]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.tags.some((t) => t.toLowerCase().includes(q));

      const matchesMood = !selectedMood || entry.mood === selectedMood;
      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, selectedMood]);

  // Group filtered entries chronologically
  const groupedEntries = useMemo(() => {
    const groups: Array<{ title: string; items: JournalEntry[] }> = [];
    const map = new Map<string, JournalEntry[]>();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    filteredEntries.forEach((entry) => {
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);

      let groupTitle = 'Earlier';
      if (entryDate.getTime() === today.getTime()) {
        groupTitle = 'Today';
      } else if (entryDate.getTime() === yesterday.getTime()) {
        groupTitle = 'Yesterday';
      } else if (entryDate >= thisWeek) {
        groupTitle = 'This week';
      } else if (entryDate >= thisMonth) {
        groupTitle = 'This month';
      } else {
        groupTitle = entryDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      }

      if (!map.has(groupTitle)) {
        map.set(groupTitle, []);
      }
      map.get(groupTitle)!.push(entry);
    });

    const priorityOrder = ['Today', 'Yesterday', 'This week', 'This month'];
    priorityOrder.forEach((title) => {
      if (map.has(title)) {
        groups.push({ title, items: map.get(title)! });
        map.delete(title);
      }
    });

    map.forEach((items, title) => {
      groups.push({ title, items });
    });

    return groups;
  }, [filteredEntries]);

  const handleDelete = (e: React.MouseEvent, entry: JournalEntry) => {
    e.stopPropagation();
    onRequestDelete(entry);
  };

  const formatEntryTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    }

    const isSameYear = d.getFullYear() === today.getFullYear();
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: isSameYear ? undefined : 'numeric',
    });
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onToggleOpen}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex h-full flex-col border-r border-white/[.05] bg-[#11100f] text-stone-300 transition-all duration-200 ease-out ${
          isOpen
            ? 'w-72 sm:w-80 translate-x-0'
            : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0 overflow-hidden border-none'
        }`}
      >
        <div className="flex shrink-0 flex-col gap-2.5 p-3.5 border-b border-white/[.04]">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-medium text-stone-400">
              Journal
            </span>
            <button
              type="button"
              onClick={onToggleOpen}
              className="flex h-6 w-6 items-center justify-center rounded text-stone-400 hover:text-stone-200 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            id="sidebar-new-entry-btn"
            type="button"
            onClick={() => {
              onNewEntry();
              if (window.innerWidth < 1024) {
                onToggleOpen();
              }
            }}
            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-medium text-stone-200 transition hover:bg-white/[.08] hover:text-white"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5 text-stone-400" />
              <span>New entry</span>
            </div>
            <span className="text-[10px] text-stone-400 font-mono">⌘N</span>
          </button>
        </div>

        <div className="flex shrink-0 flex-col gap-2 p-3 border-b border-white/[.04]">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              aria-label="Search entries"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/[.06] bg-[#161413] py-1.5 pl-8 pr-7 text-xs text-stone-200 placeholder:text-stone-500 focus:border-stone-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full text-stone-400 hover:text-stone-100"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-stone-400 pl-0.5">
              Feeling
            </span>
            <SelectMenu
              label="Feeling filter"
              value={selectedMood || ''}
              onChange={(value) => setSelectedMood(value || null)}
              className="w-32 shrink-0"
              options={[{ id: '', label: 'All feelings' }, ...MOOD_OPTIONS]}
            />
          </div>
        </div>

        <div className="scroll-area flex-1 overflow-y-auto px-2 pb-3 pt-2 space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="mx-2 mt-6 rounded-lg p-4 text-center">
              <p className="text-xs text-stone-400 font-serif-editor italic">
                {entries.length === 0 ? 'No entries yet' : 'No matching entries'}
              </p>
            </div>
          ) : (
            groupedEntries.map((group) => (
              <div key={group.title} className="space-y-0.5">
                <div className="px-2.5 py-1">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                    {group.title}
                  </span>
                </div>

                {group.items.map((entry) => {
                  const isSelected = entry.id === selectedEntryId;
                  return (
                    <div
                      key={entry.id}
                      className={`group relative rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-white/[.06] text-[#f5efe6]'
                          : 'text-stone-400 hover:bg-white/[.025] hover:text-stone-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectEntry(entry);
                          if (window.innerWidth < 1024) {
                            onToggleOpen();
                          }
                        }}
                        aria-current={isSelected ? 'page' : undefined}
                        className="w-full cursor-pointer px-2.5 py-2 pr-7 text-left focus:outline-none"
                      >
                        <div className="flex items-baseline justify-between gap-1.5">
                          <h4 className={`text-xs truncate flex-1 font-medium ${isSelected ? 'text-[#f5efe6]' : 'text-stone-300 group-hover:text-stone-100'}`}>
                            {entry.title || 'Untitled'}
                          </h4>
                          <span className="text-[10px] text-stone-400 shrink-0">
                            {formatEntryTime(entry.createdAt)}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs text-stone-400 line-clamp-1 font-serif-editor">
                          {cleanMarkdownExcerpt(entry.content)}
                        </p>

                        {(entry.mood || entry.location?.name || (entry.tags && entry.tags.length > 0)) && (
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-500">
                            {entry.mood && (
                              <span className="capitalize text-stone-400">{entry.mood}</span>
                            )}
                            {entry.location?.name && (
                              <span className="flex items-center gap-0.5 truncate max-w-[95px] text-stone-400">
                                <MapPin className="h-2.5 w-2.5 shrink-0 text-stone-500" />
                                <span className="truncate">{entry.location.name}</span>
                              </span>
                            )}
                            {entry.tags && entry.tags.length > 0 && (
                              <span className="truncate max-w-[70px] text-stone-500">#{entry.tags[0]}</span>
                            )}
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, entry)}
                        className="absolute right-1.5 top-2 flex h-5 w-5 items-center justify-center rounded text-stone-400 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
                        title="Delete entry"
                        aria-label={`Delete ${entry.title || 'untitled'}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-white/[.04] px-3 py-2.5 text-[11px] text-stone-400">
          <span>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
        </div>
      </aside>
    </>
  );
};
