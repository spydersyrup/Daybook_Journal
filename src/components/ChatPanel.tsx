import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Copy, Check, ArrowUpRight, PlusCircle, Trash2 } from 'lucide-react';
import type { ReflectionMessage } from '../types';

interface ChatPanelProps {
  messages: ReflectionMessage[];
  sending: boolean;
  onSendMessage: (text: string) => Promise<void>;
  suggestedQuestions?: string[];
  onInsertMessage?: (text: string) => void;
  onClearMessages?: () => void;
}

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
      <div className="flex shrink-0 items-center justify-between border-b border-white/[.04] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-200">
            Conversation
          </span>
          <span className="text-xs text-stone-500 font-serif-editor italic">
            with this entry
          </span>
        </div>
        {messages.length > 0 && onClearMessages && (
          <button
            type="button"
            onClick={onClearMessages}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 transition-colors p-1"
            title="Clear conversation"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 ? (
            <div className="py-10 text-center space-y-5">
              <div className="space-y-1.5 max-w-sm mx-auto">
                <p className="font-serif-editor text-xl text-stone-200">
                  Reflect together
                </p>
                <p className="text-xs leading-relaxed text-stone-400">
                  Ask questions about what you wrote, explore fresh perspectives, or talk through ideas.
                </p>
              </div>

              {suggestedQuestions.length > 0 && (
                <div className="pt-2 max-w-md mx-auto text-left space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium block">
                    Ideas to explore
                  </span>
                  <div className="space-y-1">
                    {suggestedQuestions.slice(0, 3).map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSendMessage(q)}
                        className="group flex w-full items-center justify-between gap-2 rounded-lg border border-white/[.04] bg-white/[.02] p-2.5 text-left transition hover:bg-white/[.05]"
                      >
                        <span className="font-serif-editor text-xs text-stone-300 group-hover:text-stone-100">
                          {q}
                        </span>
                        <ArrowUpRight className="h-3 w-3 shrink-0 text-stone-400 group-hover:text-stone-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`group rounded-xl p-3.5 sm:p-4 transition-colors ${
                    isUser
                      ? 'bg-white/[.03] text-stone-200'
                      : 'border-l border-white/10 bg-transparent pl-4 text-[#ded6cb]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-[10px] text-stone-400">
                    <span className="font-medium text-stone-400">
                      {isUser ? 'You' : 'Gemini'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span>
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

                  <div className={`leading-relaxed text-xs sm:text-sm ${isUser ? 'text-stone-200' : 'font-serif-editor text-[15px] text-[#dfd7cc]'}`}>
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
            <div className="rounded-xl border-l border-white/10 p-3.5 sm:p-4 text-stone-400 text-xs flex items-center gap-2 font-serif-editor italic">
              <div className="h-3 w-3 rounded-full border border-stone-400 border-t-transparent animate-spin" />
              <span>Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[.04] p-3">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl flex items-center gap-2">
          <textarea
            ref={textareaRef}
            id="chat-input-textarea"
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            aria-label="Message"
            placeholder="Ask a question or share a thought..."
            className="flex-1 min-h-[38px] max-h-28 resize-none rounded-lg border border-white/[.06] bg-[#141311] px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:border-stone-500 focus:outline-none transition-colors"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!input.trim() || sending}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-white/[.08] text-stone-200 transition hover:bg-white/[.14] hover:text-white disabled:opacity-25"
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
