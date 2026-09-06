import React from 'react';
import { Mic, MapPin, BarChart3, ShieldCheck, PenLine, Sparkles, History } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  loading: boolean;
  error?: string | null;
  onOpenThreatModel: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  loading,
  error,
  onOpenThreatModel,
}) => {
  return (
    <div className="scroll-area relative flex flex-1 min-h-0 overflow-y-auto flex-col justify-between px-4 sm:px-6 bg-[#0c0b0a] text-stone-200">
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-8 sm:py-12 text-center max-w-xl mx-auto space-y-5 sm:space-y-6 my-auto">
        <div className="space-y-2.5 sm:space-y-3">
          <h1 className="font-serif-editor text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#f5efe6] leading-[1.12]">
            A quiet place to write and think.
          </h1>

          <p className="text-xs sm:text-sm text-stone-400 font-normal leading-relaxed max-w-md mx-auto">
            Write without distractions. Explore ideas when you want another perspective, and keep everything in your own private space.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[.08] bg-white/[.02] px-3 py-1 text-[11px] text-stone-300">
            <Mic className="h-3 w-3 text-stone-400" />
            <span>Voice notes</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[.08] bg-white/[.02] px-3 py-1 text-[11px] text-stone-300">
            <MapPin className="h-3 w-3 text-stone-400" />
            <span>Location aware</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[.08] bg-white/[.02] px-3 py-1 text-[11px] text-stone-300">
            <BarChart3 className="h-3 w-3 text-stone-400" />
            <span>Longitudinal digest</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[.08] bg-white/[.02] px-3 py-1 text-[11px] text-stone-300">
            <ShieldCheck className="h-3 w-3 text-stone-400" />
            <span>Isolated privacy</span>
          </span>
        </div>

        <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#131211] p-4 sm:p-5 text-left space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/[.06] pb-2">
            <span className="text-[11px] font-medium text-stone-300">
              Morning notes
            </span>
            <div className="flex items-center gap-2 text-[11px] text-stone-400">
              <span className="flex items-center gap-1 text-stone-400">
                <MapPin className="h-2.5 w-2.5 text-stone-500" />
                <span>Mumbai</span>
              </span>
              <span className="text-stone-600">/</span>
              <span className="rounded bg-white/[.06] px-1.5 py-0.5 text-[10px] text-stone-300">
                Calm
              </span>
            </div>
          </div>

          <h3 className="font-serif-editor text-base sm:text-lg font-normal text-[#f5efe6]">
            Clarity in quiet moments
          </h3>

          <p className="font-serif-editor text-xs sm:text-sm leading-relaxed text-stone-300">
            &ldquo;When the morning noise settles, priorities surface on their own. Writing allows me to slow down and observe rather than simply react.&rdquo;
          </p>

          <div className="rounded-md border-l-2 border-stone-600/60 bg-white/[.02] pl-3 py-1 text-stone-300">
            <div className="text-[10px] font-medium uppercase tracking-wider text-stone-400 pb-0.5">
              Reflection note
            </div>
            <p className="font-serif-editor text-[11px] sm:text-xs italic text-stone-300">
              What condition made this morning feel so distinct, and how might you protect it tomorrow?
            </p>
          </div>
        </div>

        <div className="grid w-full max-w-md grid-cols-3 gap-2 text-left">
          {[
            [PenLine, 'Write', 'Capture the moment'],
            [Sparkles, 'Reflect', 'Choose your lens'],
            [History, 'Notice', 'See patterns over time'],
          ].map(([Icon, title, description]) => (
            <div key={title as string} className="rounded-lg border border-white/[.06] bg-white/[.02] p-2.5">
              <Icon className="mb-2 h-3.5 w-3.5 text-[#d6b889]" />
              <p className="text-[11px] font-medium text-stone-200">{title as string}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-stone-500">{description as string}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 w-full max-w-xs pt-1">
          <button
            id="hero-signin-btn"
            type="button"
            onClick={onSignIn}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-stone-950 transition-all hover:bg-stone-100 active:scale-[0.99] disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <div className="h-4 w-4 rounded-full border-2 border-stone-950 border-t-transparent animate-spin" />
            ) : (
              <svg className="h-4 w-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>

          <p className="text-[11px] text-stone-400">
            Private and strictly isolated to your account.
          </p>
          <p className="max-w-xs text-[10px] leading-relaxed text-stone-500">
            Daybook offers reflection prompts, not therapy or medical advice. You stay in control of what you share and save.
          </p>

          {error && (
            <div className="w-full rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-left text-xs text-rose-200">
              {error}
            </div>
          )}
        </div>
      </div>

      <footer className="relative z-10 shrink-0 border-t border-white/[.05] py-3 text-xs text-stone-400">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif-editor text-xs text-stone-300">Daybook</span>
            <span className="text-[10px] text-stone-500">• Cloud Run Build & Deploy Challenge</span>
          </div>
          <button
            type="button"
            onClick={onOpenThreatModel}
            className="text-xs text-stone-400 hover:text-[#d6b889] transition"
          >
            Privacy details
          </button>
        </div>
      </footer>
    </div>
  );
};
