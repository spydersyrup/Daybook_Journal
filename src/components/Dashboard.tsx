import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  Trash2,
  Check,
  AlertCircle,
  Tag,
  BookOpen,
  Clock,
  Maximize2,
  Minimize2,
  BarChart2,
  MapPin,
  Mic,
  Eye,
  Edit3,
  Layers,
  PenLine,
  Compass,
  Mail,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EntrySidebar } from './EntrySidebar';
import { AnalysisPanel } from './AnalysisPanel';
import { ChatPanel } from './ChatPanel';
import { PromptModal } from './PromptModal';
import { JournalInsightsModal } from './JournalInsightsModal';
import { LocationModal } from './LocationModal';
import { DigestModal } from './DigestModal';
import { VoiceJournalModal } from './VoiceJournalModal';
import { Dialog } from './Dialog';
import { SelectMenu } from './SelectMenu';
import { EchoesPanel } from './EchoesPanel';
import { FutureLetterModal } from './FutureLetterModal';
import {
  analyzeJournalEntry,
  chatWithGemini,
  fetchPromptInspirations,
  suggestEntryMetadata,
} from '../lib/api';
import { saveJournalEntry, deleteJournalEntry, subscribeToUserEntries } from '../lib/firebase';
import type {
  JournalEntry,
  UserProfile,
  ReflectionMessage,
  PromptInspiration,
  EntryLocation,
  VoiceStructuredEntry,
  ReflectionMode,
} from '../types';

interface DashboardProps {
  user: UserProfile;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

const MOODS: Array<{ id: JournalEntry['mood']; label: string }> = [
  { id: 'gratitude', label: 'Gratitude' },
  { id: 'calm', label: 'Calm' },
  { id: 'reflective', label: 'Reflective' },
  { id: 'energized', label: 'Energized' },
  { id: 'motivated', label: 'Motivated' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'frustrated', label: 'Frustrated' },
];

const SAFETY_LANGUAGE = /\b(kill myself|suicid(?:e|al)|self[- ]?harm|hurt myself|end my life|don't want to live|do not want to live)\b/i;

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  sidebarOpen,
  onToggleSidebar,
  isFocusMode = false,
  onToggleFocusMode,
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'chat'>('editor');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [analyzing, setAnalyzing] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'error' | 'success'>('info');
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [prompts, setPrompts] = useState<PromptInspiration[]>([]);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isFutureLetterOpen, setIsFutureLetterOpen] = useState(false);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [suggestingMeta, setSuggestingMeta] = useState(false);
  const [reflectionMode, setReflectionMode] = useState<ReflectionMode>('gentle');

  const [tagInput, setTagInput] = useState('');

  const showToast = useCallback((msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const createBlankEntry = useCallback((): JournalEntry => {
    return {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.uid,
      title: '',
      content: '',
      mood: 'reflective',
      tags: [],
      location: null,
      analysis: null,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      wordCount: 0,
    };
  }, [user.uid]);

  useEffect(() => {
    if (!user.uid) return;

    if (user.uid === 'demo-user') {
      const demoEntries: JournalEntry[] = [
        {
          id: 'demo-1',
          userId: 'demo-user',
          title: 'Evening walk by Marine Drive',
          content: 'The monsoon clouds were hanging heavy over the Arabian Sea, cool sea spray misting against the promenade. After an entire afternoon wrestling with system architecture and state synchronization, stepping out felt like a reset button. Watching the waves break against the tetrapods puts everything into perspective. We spend so much energy rushing to solve immediate bugs that we lose sight of the broader horizon. Note to self: protect tomorrow morning\'s uninterrupted focus time before opening Slack or checking notifications.',
          mood: 'reflective',
          tags: ['mumbai', 'mindfulness', 'clarity'],
          location: {
            name: 'Marine Drive, Mumbai',
            latitude: 18.9432,
            longitude: 72.823,
          },
          analysis: {
            summary: 'A mindful decompression along Marine Drive after intense technical problem-solving, realizing that stepping back creates broader cognitive perspective.',
            keyThemes: ['Mindful recovery', 'Perspective', 'Deep work boundaries'],
            emotionalTone: 'Grounded, peaceful, contemplative',
            mindfulInsight: 'Slowing down to observe natural rhythms dissolves the artificial urgency of daily work.',
            actionItems: [
              'Protect the first 45 minutes of tomorrow morning for deep focus before opening communications.',
              'Take brief evening walks to mark the deliberate boundary between work and rest.',
            ],
            followUpQuestions: [
              'What mental patterns surfaced once you stepped away from the screen?',
              'How can you structure tomorrow to preserve this morning stillness?',
            ],
            analyzedAt: Date.now() - 3600000,
          },
          messages: [],
          createdAt: Date.now() - 3600000 * 2,
          updatedAt: Date.now() - 3600000,
          wordCount: 79,
        },
        {
          id: 'demo-2',
          userId: 'demo-user',
          title: 'Morning chai & architectural simplicity',
          content: 'Early start today with hot ginger chai. Filtered morning light coming through the rain trees outside in Koramangala. I was wrestling with the system design all day yesterday, trying to fit in three different caching layers. Sitting here with fresh eyes, I realize how much unnecessary complexity I was introducing. The simplest solution is almost always the right one. Stripping out the excess feels like taking a deep, clean breath.',
          mood: 'calm',
          tags: ['bengaluru', 'focus', 'simplicity'],
          location: {
            name: 'Koramangala, Bengaluru',
            latitude: 12.9352,
            longitude: 77.6245,
          },
          analysis: null,
          messages: [],
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 86400000,
          wordCount: 71,
        },
      ];
      setEntries(demoEntries);
      setActiveEntry(demoEntries[0]);
      setEntriesLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setEntriesLoading(false);

        setActiveEntry((curr) => {
          if (!curr) {
            return fetchedEntries[0] || createBlankEntry();
          }
          const found = fetchedEntries.find((e) => e.id === curr.id);
          return found || curr;
        });
      },
      (err) => {
        console.error('Firestore sync error:', err);
        setEntriesLoading(false);
        showToast('Could not sync journal entries. Please refresh.', 'error');
      }
    );

    return () => unsubscribe();
  }, [user.uid, createBlankEntry, showToast]);

  useEffect(() => {
    fetchPromptInspirations().then(setPrompts);
  }, []);

  const handleNewEntry = useCallback(() => {
    const newEntry = createBlankEntry();
    setActiveEntry(newEntry);
    setSaveStatus('unsaved');
    if (viewMode === 'chat') {
      setViewMode('editor');
    }
  }, [createBlankEntry, viewMode]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const persistEntry = useCallback(async (entryToSave: JournalEntry) => {
    if (!entryToSave || !entryToSave.id) return;
    setSaveStatus('saving');

    if (user.uid === 'demo-user') {
      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === entryToSave.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = entryToSave;
          return next;
        }
        return [entryToSave, ...prev];
      });
      setSaveStatus('saved');
      return;
    }

    try {
      await saveJournalEntry(user.uid, entryToSave);
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Failed to save journal entry to Firestore:', err);
      setSaveStatus('unsaved');
      showToast('Could not save this entry. Please try again.', 'error');
    }
  }, [user.uid, showToast]);

  const updateActiveEntry = useCallback((updater: (prev: JournalEntry) => JournalEntry) => {
    setActiveEntry((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      setSaveStatus('unsaved');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        persistEntry(updated);
      }, 1500);

      return updated;
    });
  }, [persistEntry]);

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;

      if (isModifier && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeEntry) {
          persistEntry(activeEntry);
          showToast('Saved', 'success');
        }
      } else if (isModifier && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewEntry();
        showToast('New entry created', 'info');
      } else if (isModifier && e.key === '.') {
        e.preventDefault();
        if (onToggleFocusMode) {
          onToggleFocusMode();
        }
      } else if (e.key === 'Escape' && isFocusMode) {
        const anyModalOpen = isPromptModalOpen || isInsightsOpen || Boolean(deleteTarget);
        if (!anyModalOpen && onToggleFocusMode) {
          onToggleFocusMode();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [activeEntry, persistEntry, handleNewEntry, isFocusMode, isPromptModalOpen, isInsightsOpen, deleteTarget, onToggleFocusMode, showToast]);

  const computeWordCount = (text: string): number => {
    const trimmed = (text || '').trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  };

  const mayNeedImmediateSupport = Boolean(activeEntry?.content && SAFETY_LANGUAGE.test(activeEntry.content));

  const handleTitleChange = (title: string) => {
    updateActiveEntry((prev) => ({ ...prev, title }));
  };

  const handleContentChange = (content: string) => {
    const words = computeWordCount(content);
    updateActiveEntry((prev) => ({ ...prev, content, wordCount: words }));
  };

  const handleMoodChange = (mood: JournalEntry['mood']) => {
    updateActiveEntry((prev) => ({ ...prev, mood }));
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || !activeEntry) return;
    const cleanTag = tagInput.trim().replace(/^#/, '').toLowerCase();
    const currentTagsLower = activeEntry.tags.map((t) => t.toLowerCase());
    if (!currentTagsLower.includes(cleanTag)) {
      updateActiveEntry((prev) => ({
        ...prev,
        tags: [...prev.tags, cleanTag],
      }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateActiveEntry((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()),
    }));
  };

  const handleSelectPrompt = (prompt: PromptInspiration) => {
    if (!activeEntry) return;
    const promptText = `\n\n> *${prompt.text}*\n\n`;
    const newContent = (activeEntry.content || '') + promptText;
    const words = computeWordCount(newContent);
    const tagClean = prompt.category.toLowerCase().replace(/\s+/g, '-');
    const existingTagsLower = new Set(activeEntry.tags.map((t) => t.toLowerCase()));
    const combinedTags = existingTagsLower.has(tagClean) ? activeEntry.tags : [...activeEntry.tags, tagClean];

    updateActiveEntry((prev) => ({
      ...prev,
      title: prev.title || prompt.category,
      content: newContent,
      tags: combinedTags,
      wordCount: words,
    }));
    showToast(`Added prompt to entry`, 'info');
  };

  const handleInsertInsight = (text: string) => {
    if (!activeEntry) return;
    const newContent = (activeEntry.content || '') + text;
    const words = computeWordCount(newContent);
    updateActiveEntry((prev) => ({
      ...prev,
      content: newContent,
      wordCount: words,
    }));
    showToast('Added to entry', 'success');
  };

  const handleClearDialogue = async () => {
    if (!activeEntry) return;
    const updated = {
      ...activeEntry,
      messages: [],
    };
    setActiveEntry(updated);
    await persistEntry(updated);
    showToast('Conversation cleared', 'info');
  };

  const handleLocationChange = (location: EntryLocation | null) => {
    updateActiveEntry((prev) => ({ ...prev, location }));
    if (location) {
      showToast(`Location set to ${location.name}`, 'info');
    } else {
      showToast('Location removed', 'info');
    }
  };

  const handleSuggestMetadata = async () => {
    if (!activeEntry || !activeEntry.content.trim()) {
      showToast('Write a few sentences first so Gemini can suggest a title and tags.', 'info');
      return;
    }

    setSuggestingMeta(true);
    try {
      const suggested = await suggestEntryMetadata(activeEntry.content);
      const existingTagsLower = new Set(activeEntry.tags.map((t) => t.toLowerCase()));
      const newTags = (suggested.suggestedTags || []).filter((t) => !existingTagsLower.has(t.toLowerCase()));
      const combinedTags = [...activeEntry.tags, ...newTags];
      const shouldReplaceTitle = !activeEntry.title.trim() || activeEntry.title === 'Untitled Reflection';

      updateActiveEntry((prev) => ({
        ...prev,
        title: shouldReplaceTitle ? suggested.suggestedTitle : prev.title,
        mood: suggested.suggestedMood || prev.mood,
        tags: combinedTags,
      }));
      showToast(`Applied suggested title and #${(suggested.suggestedTags || []).join(', #')}`, 'success');
    } catch (err: any) {
      console.error('Suggest metadata error:', err);
      showToast(err?.message || 'Could not generate suggestions. Please try again.', 'error');
    } finally {
      setSuggestingMeta(false);
    }
  };

  const handleApplyVoiceEntry = (structured: VoiceStructuredEntry) => {
    if (!activeEntry) return;

    const isCurrentBlank = !activeEntry.content.trim() && !activeEntry.title.trim();
    const newTitle = isCurrentBlank ? structured.title : activeEntry.title || structured.title;
    const newContent = isCurrentBlank
      ? structured.content
      : activeEntry.content + '\n\n' + structured.content;
    const existingTagsLower = new Set(activeEntry.tags.map((t) => t.toLowerCase()));
    const newTags = (structured.tags || []).filter((t) => !existingTagsLower.has(t.toLowerCase()));
    const combinedTags = [...activeEntry.tags, ...newTags];
    const words = computeWordCount(newContent);

    updateActiveEntry((prev) => ({
      ...prev,
      title: newTitle,
      content: newContent,
      mood: structured.mood || prev.mood,
      tags: combinedTags,
      wordCount: words,
    }));
    showToast('Voice reflection added to journal!', 'success');
  };

  const handleSaveDigestAsEntry = async (entryData: Partial<JournalEntry>) => {
    const newEntry: JournalEntry = {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.uid,
      title: entryData.title || 'Longitudinal AI Review',
      content: entryData.content || '',
      mood: entryData.mood || 'reflective',
      tags: entryData.tags || ['digest'],
      location: null,
      analysis: null,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      wordCount: computeWordCount(entryData.content || ''),
    };

    setActiveEntry(newEntry);
    setEntries((prev) => [newEntry, ...prev]);
    await persistEntry(newEntry);
    showToast('Weekly review saved to your journal!', 'success');
  };

  const handleCreateFutureLetter = async (title: string, content: string, unlockAt: number) => {
    const letter: JournalEntry = {
      id: 'letter_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.uid,
      title,
      content,
      mood: 'reflective',
      tags: ['future-self', 'time-capsule'],
      location: null,
      analysis: null,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      wordCount: computeWordCount(content),
      lockedUntil: unlockAt,
    };
    setEntries((prev) => [letter, ...prev]);
    await persistEntry(letter);
    showToast(`Letter sealed until ${new Date(unlockAt).toLocaleDateString()}`, 'success');
  };

  const handleAnalyze = async () => {
    if (!activeEntry || !activeEntry.content.trim()) {
      showToast('Write a few sentences before reflecting.', 'info');
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = await analyzeJournalEntry({
        title: activeEntry.title || 'Untitled Reflection',
        content: activeEntry.content,
        mood: activeEntry.mood,
        location: activeEntry.location,
        mode: reflectionMode,
      });

      const updated = {
        ...activeEntry,
        analysis,
        updatedAt: Date.now(),
      };
      setActiveEntry(updated);
      await persistEntry(updated);
      showToast('Reflection notes ready', 'success');
    } catch (err: any) {
      console.error('Analysis error:', err);
      showToast(err?.message || 'Could not generate reflection notes. Please try again.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendMessage = async (userText: string) => {
    if (!activeEntry) return;

    const userMessage: ReflectionMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: userText,
      createdAt: Date.now(),
    };

    const newMessages = [...activeEntry.messages, userMessage];
    const updatedEntryWithUserMsg = {
      ...activeEntry,
      messages: newMessages,
    };
    setActiveEntry(updatedEntryWithUserMsg);
    setChatSending(true);

    try {
      const response = await chatWithGemini({
        entryTitle: activeEntry.title,
        entryContent: activeEntry.content,
        messages: newMessages,
        userMessage: userText,
        location: activeEntry.location,
      });

      const modelMessage: ReflectionMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'model',
        content: response.reply,
        createdAt: Date.now(),
      };

      const finalEntry = {
        ...updatedEntryWithUserMsg,
        messages: [...newMessages, modelMessage],
      };

      setActiveEntry(finalEntry);
      await persistEntry(finalEntry);
    } catch (err: any) {
      console.error('Chat error:', err);
      showToast(err?.message || 'Could not send message. Please try again.', 'error');
    } finally {
      setChatSending(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!activeEntry) return;
    const md = `# ${activeEntry.title || 'Untitled Reflection'}
*Date:* ${new Date(activeEntry.createdAt).toLocaleString()}
*Feeling:* ${activeEntry.mood || 'Unspecified'}
*Tags:* ${activeEntry.tags.map((t) => `#${t}`).join(' ') || 'None'}

---

## Content
${activeEntry.content}

${
  activeEntry.analysis
    ? `---

## Reflections
**Summary:** ${activeEntry.analysis.summary}
**Tone:** ${activeEntry.analysis.emotionalTone}
**Perspective:** ${activeEntry.analysis.mindfulInsight}

### Considerations:
${activeEntry.analysis.actionItems.map((a) => `- ${a}`).join('\n')}

### Questions:
${activeEntry.analysis.followUpQuestions.map((q) => `- ${q}`).join('\n')}
`
    : ''
}
`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(activeEntry.title || 'reflection').toLowerCase().replace(/\s+/g, '_')}.md`;
    link.click();
    showToast('Exported markdown file', 'success');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    if (user.uid === 'demo-user') {
      const remaining = entries.filter((entry) => entry.id !== deleteTarget.id);
      setEntries(remaining);
      if (activeEntry?.id === deleteTarget.id) setActiveEntry(remaining[0] || createBlankEntry());
      setDeleteTarget(null);
      setDeleting(false);
      showToast('Entry deleted', 'info');
      return;
    }

    try {
      await deleteJournalEntry(user.uid, deleteTarget.id);
      const remaining = entries.filter((entry) => entry.id !== deleteTarget.id);
      if (activeEntry?.id === deleteTarget.id) setActiveEntry(remaining[0] || createBlankEntry());
      setDeleteTarget(null);
      showToast('Entry deleted', 'info');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Could not delete this entry.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleFormatText = (prefix: string, suffix: string = '') => {
    if (!activeEntry) return;
    const textarea = document.getElementById('entry-content-textarea') as HTMLTextAreaElement | null;
    if (!textarea) {
      handleContentChange((activeEntry.content || '') + prefix + suffix);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = activeEntry.content || '';
    const selectedText = current.substring(start, end);
    const replacement = prefix + (selectedText || 'text') + suffix;
    const newContent = current.substring(0, start) + replacement + current.substring(end);
    handleContentChange(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText ? selectedText.length : 4));
    }, 50);
  };

  const readingMinutes = Math.max(1, Math.ceil((activeEntry?.wordCount || 0) / 180));

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-[#0e0d0c] text-stone-200">
      {!isFocusMode && (
        <EntrySidebar
          entries={entries}
          selectedEntryId={activeEntry?.id || null}
          onSelectEntry={(entry) => {
            if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
              showToast(`This letter is sealed until ${new Date(entry.lockedUntil).toLocaleDateString()}.`, 'info');
              return;
            }
            setActiveEntry(entry);
            setSaveStatus('saved');
          }}
          onNewEntry={handleNewEntry}
          onRequestDelete={setDeleteTarget}
          isOpen={sidebarOpen}
          onToggleOpen={onToggleSidebar}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#0e0d0c]">
        {!isFocusMode ? (
          <div className="flex shrink-0 items-center justify-between border-b border-white/[.04] bg-[#11100f] px-4 py-2 sm:px-6">
            <div className="flex items-center gap-0.5 rounded-lg bg-white/[.03] p-0.5 border border-white/[.04]" role="tablist" aria-label="View mode">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                role="tab"
                aria-selected={viewMode === 'editor'}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  viewMode === 'editor'
                    ? 'bg-white/[.08] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Write"
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                role="tab"
                aria-selected={viewMode === 'split'}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  viewMode === 'split'
                    ? 'bg-white/[.08] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Split view"
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setViewMode('chat')}
                role="tab"
                aria-selected={viewMode === 'chat'}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  viewMode === 'chat'
                    ? 'bg-white/[.08] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Chat"
              >
                Chat
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setIsFutureLetterOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#d6b889]/15 bg-[#d6b889]/[.04] px-2.5 py-1 text-xs text-[#d6b889] hover:bg-[#d6b889]/[.10] transition"
                title="Write a letter to your future self"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Future self</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDigestModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-white/[.06] bg-white/[.02] px-2.5 py-1 text-xs text-stone-300 hover:bg-white/[.06] hover:text-white transition"
                title="Weekly & Longitudinal Digest"
              >
                <Layers className="h-3.5 w-3.5 text-stone-400" />
                <span className="hidden sm:inline">Digest</span>
              </button>

              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-white/[.06] bg-white/[.02] px-2.5 py-1 text-xs text-stone-300 hover:bg-white/[.06] hover:text-white transition"
                title="Speak reflection with voice"
              >
                <Mic className="h-3.5 w-3.5 text-stone-400" />
                <span className="hidden sm:inline">Voice</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInsightsOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-white/[.06] bg-white/[.02] px-2.5 py-1 text-xs text-stone-300 hover:bg-white/[.06] hover:text-white transition"
                title="View journal insights & trajectory"
              >
                <BarChart2 className="h-3.5 w-3.5 text-stone-400" />
                <span className="hidden sm:inline">Insights</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPromptModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-white/[.06] bg-white/[.02] px-2.5 py-1 text-xs text-stone-300 hover:bg-white/[.06] hover:text-white transition"
                title="Prompt inspirations"
              >
                <BookOpen className="h-3.5 w-3.5 text-stone-400" />
                <span className="hidden md:inline">Prompts</span>
              </button>

              {onToggleFocusMode && (
                <button
                  type="button"
                  onClick={onToggleFocusMode}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-stone-400 hover:bg-white/[.05] hover:text-stone-200 transition"
                  title="Focus mode (⌘.)"
                >
                  <Maximize2 className="h-3.5 w-3.5 text-stone-400" />
                  <span className="hidden sm:inline">Focus</span>
                </button>
              )}

              <div className="hidden items-center gap-1 px-1 text-xs text-stone-400 sm:flex" aria-live="polite">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1.5 text-stone-400">
                    <div className="h-2.5 w-2.5 rounded-full border border-stone-400 border-t-transparent animate-spin" />
                    <span>Saving...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-stone-400">
                    <Check className="h-3.5 w-3.5 text-emerald-400/80" />
                    <span>Saved</span>
                  </span>
                )}
                {saveStatus === 'unsaved' && (
                  <button
                    type="button"
                    onClick={() => activeEntry && persistEntry(activeEntry)}
                    className="text-xs text-amber-300/80 hover:text-amber-200 underline underline-offset-2"
                    title="Save changes (⌘S)"
                  >
                    Save
                  </button>
                )}
              </div>

              <div className="h-3.5 w-px bg-white/[.06] mx-0.5" />

              <button
                type="button"
                onClick={handleExportMarkdown}
                className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:bg-white/[.05] hover:text-stone-200 transition"
                title="Export markdown"
                aria-label="Export entry as Markdown"
              >
                <Download className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => activeEntry && setDeleteTarget(activeEntry)}
                className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
                title="Delete entry"
                aria-label="Delete active journal entry"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Subtle Exit Header when in Focus Mode */
          <div className="flex shrink-0 items-center justify-between border-b border-white/[.04] bg-[#0e0d0c] px-6 py-2.5 text-xs text-stone-400">
            <span className="text-[11px] font-serif-editor italic text-stone-400">
              Zen Focus
            </span>
            <button
              type="button"
              onClick={onToggleFocusMode}
              className="flex items-center gap-1.5 rounded border border-white/6 px-2.5 py-1 text-xs text-stone-400 hover:bg-white/[.05] hover:text-stone-200 transition"
              title="Exit Focus Mode (Esc or ⌘.)"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Exit focus (Esc)</span>
            </button>
          </div>
        )}

        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs shadow-xl transition ${
              toastType === 'error'
                ? 'border-rose-500/30 bg-[#1a1212] text-rose-200'
                : toastType === 'success'
                ? 'border-emerald-500/30 bg-[#121814] text-emerald-200'
                : 'border-white/10 bg-[#181615] text-stone-200'
            }`}
          >
            {toastType === 'error' ? (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
            ) : toastType === 'success' ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            ) : null}
            <span>{toastMessage}</span>
          </div>
        )}

        {entriesLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center text-xs text-stone-400 space-y-2">
            <div className="h-4 w-4 rounded-full border border-stone-400 border-t-transparent animate-spin" />
            <span className="font-serif-editor italic">Loading...</span>
          </div>
        ) : activeEntry ? (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div
              className={`scroll-area min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-10 sm:py-5 ${
                viewMode === 'chat'
                  ? 'hidden'
                  : viewMode === 'split' && !isFocusMode
                  ? 'lg:w-[60%] lg:flex-none border-r border-white/[.04]'
                  : 'w-full'
              }`}
            >
              <div className={`mx-auto flex min-h-full w-full flex-col justify-between ${isFocusMode ? 'max-w-2xl' : 'max-w-xl'}`}>
                <div className="space-y-2 sm:space-y-2.5 shrink-0">
                  <p className="text-xs text-stone-400 font-normal">
                    {new Date(activeEntry.createdAt).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      id="entry-title-input"
                      type="text"
                      placeholder="Title..."
                      value={activeEntry.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full bg-transparent font-serif-editor text-2xl sm:text-3xl lg:text-4xl font-normal text-[#f5efe6] placeholder:text-stone-600 focus:outline-none"
                    />
                    {activeEntry.content.trim().length >= 10 && (
                      <button
                        type="button"
                        onClick={handleSuggestMetadata}
                        disabled={suggestingMeta}
                        className="flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[.04] px-2.5 py-1 text-[11px] font-medium text-stone-300 transition hover:bg-white/[.08] hover:text-white disabled:opacity-40 shadow-xs"
                        title="Suggest title & tags"
                      >
                        {suggestingMeta ? (
                          <div className="h-3 w-3 rounded-full border border-stone-300 border-t-transparent animate-spin" />
                        ) : (
                          <PenLine className="h-3 w-3 text-amber-400/80" />
                        )}
                        <span className="hidden sm:inline">Suggest title</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-stone-400">
                    <SelectMenu
                      label="Feeling"
                      value={activeEntry.mood || 'reflective'}
                      onChange={(value) => handleMoodChange(value as JournalEntry['mood'])}
                      className="w-28"
                      options={MOODS}
                    />

                    <div className="flex items-center gap-2">
                    <label htmlFor="reflection-mode" className="text-[10px] uppercase tracking-wider text-stone-500 hidden sm:inline">
                      Reflection style
                    </label>
                    <select
                      id="reflection-mode"
                      value={reflectionMode}
                      onChange={(e) => setReflectionMode(e.target.value as ReflectionMode)}
                      className="rounded-md border border-white/[.08] bg-white/[.03] px-2 py-1 text-[11px] text-stone-300 outline-none hover:bg-white/[.06]"
                      title="Choose how Gemini approaches this reflection"
                    >
                      <option value="gentle">Gentle reflection</option>
                      <option value="practical">Practical next steps</option>
                      <option value="patterns">Patterns & tensions</option>
                      <option value="socratic">Socratic questions</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] border transition ${
                        activeEntry.location?.name
                          ? 'bg-white/[.06] text-stone-200 border-white/15 hover:bg-white/[.1]'
                          : 'border-white/[.08] bg-white/[.02] text-stone-400 hover:text-stone-200 hover:border-white/15'
                      }`}
                      title={activeEntry.location?.name ? `Location: ${activeEntry.location.name} (Click to edit)` : 'Attach location'}
                    >
                      <MapPin className="h-3 w-3 shrink-0 text-stone-400" />
                      <span className="max-w-[150px] truncate">{activeEntry.location?.name ? activeEntry.location.name : 'Add location'}</span>
                    </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {activeEntry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded bg-white/[.04] px-2 py-0.5 text-[11px] text-stone-300"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="flex h-3 w-3 items-center justify-center text-stone-400 hover:text-rose-300"
                            aria-label={`Remove tag ${tag}`}
                          >
                            &times;
                          </button>
                        </span>
                      ))}

                      <input
                        type="text"
                        placeholder="+ tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="h-6 w-14 rounded bg-transparent px-1.5 text-xs text-stone-200 placeholder:text-stone-600 focus:w-20 focus:border-b focus:border-stone-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 flex shrink-0 items-center justify-between border-b border-white/[.04] pb-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsPreviewMode(false)}
                      className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition ${
                        !isPreviewMode
                          ? 'bg-white/[.08] font-medium text-white shadow-xs'
                          : 'text-stone-500 hover:text-stone-300'
                      }`}
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Write</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPreviewMode(true)}
                      className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition ${
                        isPreviewMode
                          ? 'bg-white/[.08] font-medium text-white shadow-xs'
                          : 'text-stone-500 hover:text-stone-300'
                      }`}
                    >
                      <Eye className="h-3 w-3" />
                      <span>Preview</span>
                    </button>

                    {!isPreviewMode && (
                      <div className="hidden sm:flex items-center gap-0.5 ml-2 pl-2 border-l border-white/[.08]">
                        <button
                          type="button"
                          onClick={() => handleFormatText('**', '**')}
                          className="h-6 w-6 rounded text-stone-400 hover:bg-white/[.06] hover:text-stone-100 font-bold text-xs"
                          title="Bold (**text**)"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormatText('*', '*')}
                          className="h-6 w-6 rounded text-stone-400 hover:bg-white/[.06] hover:text-stone-100 italic text-xs font-serif-editor"
                          title="Italic (*text*)"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormatText('### ')}
                          className="h-6 w-6 rounded text-stone-400 hover:bg-white/[.06] hover:text-stone-100 text-[11px] font-mono"
                          title="Heading (###)"
                        >
                          H
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormatText('> ')}
                          className="h-6 w-6 rounded text-stone-400 hover:bg-white/[.06] hover:text-stone-100 text-xs font-serif-editor"
                          title="Quote block (>)"
                        >
                          &ldquo;
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormatText('- ')}
                          className="h-6 w-6 rounded text-stone-400 hover:bg-white/[.06] hover:text-stone-100 text-xs"
                          title="Bullet list (-)"
                        >
                          &bull;
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormatText('- [ ] ')}
                          className="h-6 w-6 rounded text-stone-400 hover:bg-white/[.06] hover:text-stone-100 text-[11px]"
                          title="Checklist item (- [ ])"
                        >
                          &check;
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-200 transition rounded px-2 py-0.5 hover:bg-white/[.04]"
                    title="Dictate with voice"
                  >
                    <Mic className="h-3 w-3 text-stone-400" />
                    <span className="hidden xs:inline">Voice note</span>
                  </button>
                </div>

                <div className="my-2 sm:my-3 flex-1 flex flex-col min-h-[140px]">
                  {isPreviewMode ? (
                    <div className="w-full flex-1 min-h-[140px] font-serif-editor text-[17px] sm:text-[18px] font-normal leading-[1.8] text-[#ded6cb]">
                      {activeEntry.content.trim() ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ node, ...props }) => <h1 className="text-2xl sm:text-3xl font-medium text-[#f5efe6] mt-6 mb-3 border-b border-white/[.06] pb-1 font-serif-editor" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-xl sm:text-2xl font-medium text-[#ded6cb] mt-5 mb-2 font-serif-editor" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-lg font-medium text-stone-200 mt-4 mb-2 font-serif-editor" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-[#d6b889] bg-white/[.02] pl-4 py-1.5 my-3 text-stone-300 italic font-serif-editor rounded-r" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1.5 my-2.5 text-stone-300 font-serif-editor" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1.5 my-2.5 text-stone-300 font-serif-editor" {...props} />,
                            code: ({ node, ...props }) => <code className="rounded bg-white/[.06] px-1.5 py-0.5 text-xs font-mono text-[#d6b889]" {...props} />,
                            pre: ({ node, ...props }) => <pre className="my-4 overflow-x-auto rounded-lg bg-black/50 border border-white/[.06] p-3 text-xs font-mono text-stone-300" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-4 font-serif-editor leading-[1.8]" {...props} />,
                            a: ({ node, ...props }) => <a className="text-[#d6b889] underline hover:text-[#e4c99e] transition" target="_blank" rel="noopener noreferrer" {...props} />,
                            hr: ({ node, ...props }) => <hr className="my-6 border-t border-white/[.08]" {...props} />,
                            table: ({ node, ...props }) => <div className="my-4 overflow-x-auto"><table className="w-full border-collapse border border-white/[.08] text-sm" {...props} /></div>,
                            thead: ({ node, ...props }) => <thead className="bg-white/[.04] text-stone-200" {...props} />,
                            th: ({ node, ...props }) => <th className="border border-white/[.08] px-3 py-1.5 text-left font-medium text-xs text-[#d6b889]" {...props} />,
                            td: ({ node, ...props }) => <td className="border border-white/[.06] px-3 py-1.5 text-xs text-stone-300" {...props} />,
                            input: ({ node, ...props }) => props.type === 'checkbox' ? <input {...props} disabled className="mr-2 accent-[#d6b889] rounded align-middle pointer-events-none" readOnly /> : <input {...props} />,
                          }}
                        >
                          {activeEntry.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="italic text-stone-600">Nothing to preview yet. Switch to Write to add your thoughts.</p>
                      )}
                    </div>
                  ) : (
                    <textarea
                      id="entry-content-textarea"
                      value={activeEntry.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Write freely..."
                      className="w-full flex-1 min-h-[140px] resize-none bg-transparent font-serif-editor text-[17px] sm:text-[18px] font-normal leading-[1.8] text-[#ded6cb] placeholder:text-stone-600 caret-stone-300 outline-none"
                    />
                  )}
                </div>

                {mayNeedImmediateSupport && (
                  <div className="mb-3 rounded-lg border border-rose-500/20 bg-rose-500/[.06] px-3 py-2.5 text-[11px] leading-relaxed text-rose-200" role="note">
                    <span className="font-medium">You deserve immediate human support.</span>{' '}
                    If you may act on these thoughts, contact local emergency services or a trusted person now. Daybook is not a crisis service.
                  </div>
                )}

                <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-white/[.04] pt-2.5 sm:pt-3 text-xs text-stone-400">
                  <div className="flex items-center gap-2 text-stone-400">
                    <span className="font-mono">{activeEntry.wordCount || 0} {activeEntry.wordCount === 1 ? 'word' : 'words'}</span>
                    <span className="text-stone-600">&bull;</span>
                    <span className="font-mono">{readingMinutes} min read</span>
                  </div>

                  {!isFocusMode && (
                    <button
                      id="trigger-gemini-insights-btn"
                      type="button"
                      onClick={() => {
                        if (viewMode === 'editor') setViewMode('split');
                        handleAnalyze();
                      }}
                      disabled={analyzing || !activeEntry.content.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-4 py-1.5 text-xs font-medium text-stone-900 transition hover:bg-white disabled:opacity-30 disabled:hover:bg-stone-100 shadow-sm"
                    >
                      {analyzing ? (
                        <>
                          <div className="h-3 w-3 rounded-full border border-stone-900 border-t-transparent animate-spin" />
                          <span>Reflecting...</span>
                        </>
                      ) : (
                        <>
                          <Compass className="h-3.5 w-3.5 text-stone-700" />
                          <span>Reflect with Gemini</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {!isFocusMode && viewMode === 'split' && (
              <div className="scroll-area hidden lg:block lg:w-[40%] min-h-0 overflow-y-auto bg-[#0e0d0c] p-6">
                <div className="space-y-5">
                  <AnalysisPanel
                    analysis={activeEntry.analysis || null}
                    loading={analyzing}
                    onAnalyze={handleAnalyze}
                    onInsertInsight={handleInsertInsight}
                    onSelectQuestion={(q) => {
                      setViewMode('chat');
                      handleSendMessage(q);
                    }}
                  />

                  <EchoesPanel
                    currentEntry={activeEntry}
                    entries={entries}
                    onInsert={handleInsertInsight}
                  />

                  {activeEntry.analysis && (
                    <div className="border-t border-white/[.04] pt-3">
                      <button
                        type="button"
                        onClick={() => setViewMode('chat')}
                        className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200 transition"
                      >
                        <span>Open chat</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isFocusMode && viewMode === 'chat' && (
              <div className="flex-1 min-h-0">
                <ChatPanel
                  messages={activeEntry.messages || []}
                  sending={chatSending}
                  onSendMessage={handleSendMessage}
                  onInsertMessage={handleInsertInsight}
                  onClearMessages={handleClearDialogue}
                  suggestedQuestions={activeEntry.analysis?.followUpQuestions || []}
                />
              </div>
            )}
          </div>
        ) : null}
      </main>

      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        prompts={prompts}
        onSelectPrompt={handleSelectPrompt}
      />

      <JournalInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        entries={entries}
        onOpenDigest={() => setIsDigestModalOpen(true)}
      />

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={activeEntry?.location || null}
        onSaveLocation={handleLocationChange}
      />

      <DigestModal
        isOpen={isDigestModalOpen}
        onClose={() => setIsDigestModalOpen(false)}
        entries={entries}
        onSaveAsEntry={handleSaveDigestAsEntry}
      />

      <VoiceJournalModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyEntry={handleApplyVoiceEntry}
      />

      <FutureLetterModal
        isOpen={isFutureLetterOpen}
        onClose={() => setIsFutureLetterOpen(false)}
        onCreate={handleCreateFutureLetter}
      />

      <Dialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        label="Delete entry"
        className="max-w-sm"
      >
        <div className="p-5 border-b border-white/[.06] bg-[#141311] space-y-1.5">
          <h2 className="font-serif-editor text-lg font-medium text-stone-100">
            Delete entry?
          </h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            {deleteTarget?.title
              ? `“${deleteTarget.title}” will be permanently removed.`
              : 'This reflection will be permanently removed.'}
          </p>
        </div>
        <div className="flex justify-end gap-2 p-3.5 bg-[#11100f]">
          <button
            type="button"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
            className="rounded px-3 py-1.5 text-xs text-stone-300 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="rounded bg-rose-500/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500 transition disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Dialog>
    </div>
  );
};
