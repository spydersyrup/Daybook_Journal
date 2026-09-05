import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Copy, Check, ArrowUpRight, PlusCircle, Trash2, Sparkles, User } from 'lucide-react';
import type { ReflectionMessage } from '../types';

interface ChatPanelProps {
  messages: ReflectionMessage[];
  sending: boolean;
  onSendMessage: (text: string) => Promise<void>;
  suggestedQuestions?: string[];
  onInsertMessage?: (text: string) => void;
  onClearMessages?: () => void;
}

const DEFAULT_EXPLORATION_PROMPTS = [
  'What stands out as the most meaningful moment from this reflection?',
  'What pattern or tension might I be overlooking here?',
  'What gentle intention could help carry this clarity into tomorrow?',
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  sending,
  onSendMessage,
  suggestedQuestions = [],
  onInsertMessage,
  onClearMessages,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const explorationPrompts =
    suggestedQuestions && suggestedQuestions.length > 0
      ? suggestedQuestions
      : DEFAULT_EXPLORATION_PROMPTS;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (text: string, id: string) => {
    if (onInsertMessage) {
      onInsertMessage(`\n\n${text}\n\n`);
      setInsertedId(id);
      setTimeout(() => setInsertedId(null), 2000);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#0e0d0c]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[.04] px-5 py-3 bg-[#11100f]/60 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400/80 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-200">
            Reflection Dialogue
          </span>
          <span className="text-[11px] text-stone-500 font-serif-editor italic hidden sm:inline">
            with this entry
          </span>
        </div>
        {messages.length > 0 && onClearMessages && (
          <button
            type="button"
            onClick={onClearMessages}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 transition-colors px-2 py-1 rounded hover:bg-white/[.04]"
            title="Clear conversation"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 ? (
            <div className="py-10 text-center space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[.03] border border-white/[.08] mx-auto text-amber-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <p className="font-serif-editor text-xl font-medium text-stone-100">
                  Reflect with Gemini
                </p>
                <p className="text-xs leading-relaxed text-stone-400">
                  Ask thoughtful follow-up questions, explore emotional context, or brainstorm next steps grounded in what you wrote.
                </p>
              </div>

              <div className="pt-2 max-w-md mx-auto text-left space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block px-1">
                  Suggested Prompts to Explore
                </span>
                <div className="space-y-1.5">
                  {explorationPrompts.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSendMessage(q)}
                      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/[.05] bg-white/[.02] p-3 text-left transition hover:bg-white/[.06] hover:border-white/10"
                    >
                      <span className="font-serif-editor text-xs text-stone-300 group-hover:text-stone-100 leading-relaxed">
                        {q}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-stone-500 group-hover:text-stone-200 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`group rounded-2xl p-4 transition-colors ${
                    isUser
                      ? 'bg-white/[.04] border border-white/[.04] text-stone-200 ml-6 sm:ml-12'
                      : 'border-l-2 border-amber-400/40 bg-white/[.015] pl-4 sm:pl-5 text-[#ded6cb] mr-6 sm:mr-12'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 text-[10px] text-stone-400">
                    <div className="flex items-center gap-1.5">
                      {isUser ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-stone-700 text-stone-300">
                          <User className="h-2.5 w-2.5" />
                        </div>
                      ) : (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                          <Sparkles className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <span className="font-medium text-stone-300">
                        {isUser ? 'You' : 'Gemini'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-stone-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()}
                      </span>
                      {!isUser && (
                        <div className="flex items-center gap-1">
                          {onInsertMessage && (
                            <button
                              type="button"
                              onClick={() => handleInsert(msg.content, msg.id)}
                              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-stone-400 opacity-0 transition hover:bg-white/[.08] hover:text-stone-200 group-hover:opacity-100 focus:opacity-100"
                              title="Add to journal entry"
                            >
                              {insertedId === msg.id ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <PlusCircle className="h-3 w-3" />
                              )}
                              <span>{insertedId === msg.id ? 'Added' : 'Add to entry'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="flex h-5 w-5 items-center justify-center rounded text-stone-400 opacity-0 transition hover:bg-white/[.08] hover:text-stone-200 group-hover:opacity-100 focus:opacity-100"
                            title="Copy reply"
                            aria-label="Copy reply"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`leading-relaxed text-xs sm:text-sm ${isUser ? 'text-stone-200 font-sans' : 'font-serif-editor text-[15px] sm:text-[16px] text-[#ded6cb]'}`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-body">
                        <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div className="rounded-2xl border-l-2 border-amber-400/40 bg-white/[.015] p-4 text-stone-400 text-xs flex items-center gap-2.5 font-serif-editor italic mr-6 sm:mr-12">
              <div className="h-3.5 w-3.5 rounded-full border border-stone-400 border-t-amber-300 animate-spin" />
              <span>Gemini is reflecting...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="shrink-0 border-t border-white/[.04] p-3 bg-[#11100f]/80 backdrop-blur-xs">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl flex items-end gap-2">
          <textarea
            ref={textareaRef}
            id="chat-input-textarea"
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            aria-label="Message"
            placeholder="Ask a question or share a thought about this entry..."
            className="flex-1 min-h-[40px] max-h-28 resize-none rounded-xl border border-white/[.06] bg-[#161413] px-3.5 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:border-stone-500 focus:bg-[#1a1816] focus:outline-none transition-colors"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!input.trim() || sending}
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-900 transition hover:bg-white disabled:opacity-25 shadow-xs"
            title="Send message"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </section>
  );
};

