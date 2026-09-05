import React, { useState } from 'react';
import { ArrowUpRight, RotateCcw, PlusCircle, Check } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-2.5">
        <div className="h-4 w-4 rounded-full border border-stone-400 border-t-transparent animate-spin" />
        <p className="font-serif-editor text-sm text-stone-300">
          Reflecting on your entry...
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4 space-y-3">
        <div className="space-y-1 max-w-xs">
          <p className="font-serif-editor text-base text-stone-200">
            No reflection yet
          </p>
          <p className="text-xs leading-relaxed text-stone-400">
            Generate thoughts, themes, and perspective notes when you want another look.
          </p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          className="rounded-md bg-stone-100 px-3.5 py-1.5 text-xs font-medium text-stone-900 transition hover:bg-white shadow-sm"
        >
          Generate reflection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-stone-300">
      <div className="flex items-center justify-between border-b border-white/[.06] pb-2.5">
        <span className="text-xs font-medium text-stone-300">
          Reflection
        </span>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-200 transition"
          title="Re-run reflection"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Re-evaluate</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
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
                  <span className="text-emerald-400">Added</span>
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

      {analysis.mindfulInsight && (
        <div className="border-l-2 border-stone-600/50 pl-3.5 py-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
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
                    <span className="text-emerald-400">Added</span>
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

      {(analysis.emotionalTone || (analysis.keyThemes && analysis.keyThemes.length > 0)) && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Tone & Themes
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {analysis.emotionalTone && (
              <span className="inline-flex items-center rounded-md border border-white/[.08] bg-white/[.03] px-2 py-0.5 text-[11px] font-medium text-stone-200 capitalize">
                {analysis.emotionalTone}
              </span>
            )}
            {analysis.keyThemes && analysis.keyThemes.map((t, idx) => (
              <span key={idx} className="inline-flex items-center rounded-md border border-white/[.06] bg-white/[.02] px-2 py-0.5 text-[11px] text-stone-300">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.actionItems && analysis.actionItems.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Considerations
          </span>
          <ul className="space-y-1 text-xs text-stone-300">
            {analysis.actionItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-stone-500 font-mono text-[11px]">{idx + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.followUpQuestions && analysis.followUpQuestions.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Inquiries
          </span>
          <div className="space-y-0.5 divide-y divide-white/[.04]">
            {analysis.followUpQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectQuestion(q)}
                className="group flex w-full items-start justify-between gap-2.5 py-2 text-left text-xs transition"
              >
                <span className="font-serif-editor text-stone-300 group-hover:text-stone-100 leading-relaxed">
                  {q}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-stone-500 group-hover:text-stone-200 mt-0.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
