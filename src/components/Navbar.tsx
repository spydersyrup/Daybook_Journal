import React from 'react';
import { LogOut, Menu, X, Sparkles } from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  return (
    <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/[.06] bg-[#100e0c]/95 backdrop-blur-md px-4 sm:px-6 text-stone-200">
      <div className="flex items-center gap-3">
        {user && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[.06] bg-white/[.02] text-stone-400 transition-colors hover:bg-white/[.08] hover:text-stone-100 lg:hidden"
            aria-label={isSidebarOpen ? 'Close entries sidebar' : 'Open entries sidebar'}
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[.06] border border-white/10 shadow-xs">
            <img src="/favicon.svg" alt="" className="h-4.5 w-4.5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif-editor text-xl font-medium tracking-tight text-[#f5f0eb]">
              Daybook
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-widest text-stone-500">
              Journal
            </span>
          </div>
        </div>
      </div>

      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-full border border-white/[.06] bg-white/[.02] px-2.5 py-1">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Avatar'}
                referrerPolicy="no-referrer"
                className="h-5.5 w-5.5 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#241f1b] text-[11px] font-medium text-stone-300 ring-1 ring-white/10">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span className="max-w-[140px] truncate text-xs font-normal text-stone-300">
              {user.displayName || user.email || 'Author'}
            </span>
          </div>

          <button
            id="sign-out-btn"
            type="button"
            onClick={onSignOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[.06] bg-white/[.02] text-stone-400 transition-colors hover:bg-white/[.08] hover:text-stone-200"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md border border-white/[.08] bg-white/[.02] px-2.5 py-1 text-[11px] font-medium text-stone-400">
            <Sparkles className="h-3 w-3 text-amber-400/70" />
            <span>Private journal</span>
          </span>
        </div>
      )}
    </header>
  );
};
