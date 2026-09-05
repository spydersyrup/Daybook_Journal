import React, { useState } from 'react';
import { ArrowUpRight, RotateCcw, PlusCircle, Check, Sparkles, MessageSquare, Quote, Lightbulb } from 'lucide-react';
import type { AIAnalysis } from '../types';

interface AnalysisPanelProps {
  analysis: AIAnalysis | null;
  loading: boolean;
  onAnalyze: () => void;
  onSelectQuestion: (question: string) => void;
  onInsertInsight?: (text: string) => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  loading,
  onAnalyze,
  onSelectQuestion,
  onInsertInsight,
}) => {
  const [insertedKey, setInsertedKey] = useState<string | null>(null);

  const handleInsert = (key: string, text: string) => {
    if (onInsertInsight) {
      onInsertInsight(text);
      setInsertedKey(key);
      setTimeout(() => setInsertedKey(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 rounded-xl border border-white/[.04] bg-white/[.01] p-6">
        <div className="relative">
          <div className="h-7 w-7 rounded-full border border-stone-400/40 border-t-amber-300 animate-spin" />
          <Sparkles className="h-3 w-3 text-amber-300 absolute top-2 left-2 animate-pulse" />
        </div>
        <div className="space-y-1">
          <p className="font-serif-editor text-sm font-medium text-stone-200">
            Synthesizing reflection...
          </p>
          <p className="text-[11px] text-stone-500 font-mono">
            Grounding observations in your words
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4 space-y-4 rounded-xl border border-white/[.04] bg-white/[.01]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[.04] border border-white/[.06] text-stone-400">
          <Sparkles className="h-4.5 w-4.5 text-amber-300/80" />
        </div>
        <div className="space-y-1.5 max-w-xs">
          <p className="font-serif-editor text-base font-medium text-stone-200">
            No reflection yet
          </p>
          <p className="text-xs leading-relaxed text-stone-400">
            Generate observations, emotional tone, and guided perspective questions whenever you're ready.
          </p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-4 py-2 text-xs font-medium text-stone-900 transition hover:bg-white shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-stone-700" />
          <span>Generate reflection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-stone-300">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/[.06] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
            Reflection Note
          </span>
          {analysis.modelUsed && (
            <span className="text-[9px] font-mono rounded bg-white/[.04] border border-white/[.04] px-1.5 py-0.5 text-stone-500">
              {analysis.modelUsed.replace('gemini-', '')}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-100 transition rounded px-2 py-1 hover:bg-white/[.04]"
          title="Re-run reflection"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Re-evaluate</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-white/[.05] bg-white/[.02] p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1">
            <Quote className="h-2.5 w-2.5 text-stone-500" />
            Summary
          </span>
          {onInsertInsight && (
            <button
              type="button"
              onClick={() => handleInsert('synthesis', `\n\n> *Reflection:* ${analysis.summary}\n\n`)}
              className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-200 transition"
              title="Add summary to entry"
            >
              {insertedKey === 'synthesis' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Added</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-3 w-3" />
                  <span>Add to entry</span>
                </>
              )}
            </button>
          )}
        </div>
        <p className="font-serif-editor text-sm text-[#ded6cb] leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* Perspective Card */}
      {analysis.mindfulInsight && (
        <div className="rounded-xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-transparent p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80 flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-amber-300/80" />
              Perspective
            </span>
            {onInsertInsight && (
              <button
                type="button"
                onClick={() => handleInsert('perspective', `\n\n> *Perspective:* "${analysis.mindfulInsight}"\n\n`)}
                className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-200 transition"
                title="Add perspective to entry"
              >
                {insertedKey === 'perspective' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Added</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3 w-3" />
                    <span>Add to entry</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="font-serif-editor text-xs italic text-stone-300 leading-relaxed">
            &ldquo;{analysis.mindfulInsight}&rdquo;
          </p>
        </div>
      )}

      {/* Tone & Themes */}
      {(analysis.emotionalTone || (analysis.keyThemes && analysis.keyThemes.length > 0)) && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block">
            Tone & Themes
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {analysis.emotionalTone && (
              <span className="inline-flex items-center rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-200 capitalize shadow-2xs">
                {analysis.emotionalTone}
              </span>
            )}
            {analysis.keyThemes && analysis.keyThemes.map((t, idx) => (
              <span key={idx} className="inline-flex items-center rounded-lg border border-white/[.06] bg-white/[.03] px-2.5 py-1 text-[11px] text-stone-300">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Considerations */}
      {analysis.actionItems && analysis.actionItems.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/[.04]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block">
            Considerations
          </span>
          <ul className="space-y-1.5 text-xs text-stone-300">
            {analysis.actionItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 rounded-lg border border-white/[.03] bg-white/[.015] p-2.5 leading-relaxed">
                <span className="text-stone-500 font-mono text-[10px] mt-0.5">{idx + 1}.</span>
                <span className="font-serif-editor text-[13px]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Inquiries */}
      {analysis.followUpQuestions && analysis.followUpQuestions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/[.04]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block">
            Explore with Chat
          </span>
          <div className="space-y-1.5">
            {analysis.followUpQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectQuestion(q)}
                className="group flex w-full items-center justify-between gap-2.5 rounded-lg border border-white/[.04] bg-white/[.02] p-2.5 text-left text-xs transition hover:bg-white/[.05] hover:border-white/10"
              >
                <span className="font-serif-editor text-stone-300 group-hover:text-stone-100 leading-relaxed text-xs">
                  {q}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-stone-500 group-hover:text-stone-200 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

