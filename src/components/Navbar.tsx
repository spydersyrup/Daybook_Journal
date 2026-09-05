import React from 'react';
import { LogOut, Menu, X } from 'lucide-react';
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
    <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/[.06] bg-[#100e0c]/90 backdrop-blur-md px-4 sm:px-6 text-stone-200">
      <div className="flex items-center gap-3">
        {user && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white/[.08] hover:text-stone-100 lg:hidden"
            aria-label={isSidebarOpen ? 'Close entries sidebar' : 'Open entries sidebar'}
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" className="h-6 w-6" />
          <span className="font-serif-editor text-xl font-medium tracking-tight text-[#f5f0eb]">
            Daybook
          </span>
        </div>
      </div>

      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Avatar'}
                referrerPolicy="no-referrer"
                className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#241f1b] text-xs font-medium text-stone-300 ring-1 ring-white/10">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span className="hidden max-w-[130px] truncate text-xs font-normal text-stone-300 sm:inline-block">
              {user.displayName || user.email || 'Author'}
            </span>
          </div>

          <button
            id="sign-out-btn"
            type="button"
            onClick={onSignOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white/[.08] hover:text-stone-200"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md border border-white/[.08] bg-white/[.02] px-2.5 py-1 text-[11px] font-medium text-stone-400">
            <span>Private journal</span>
          </span>
        </div>
      )}
    </header>
  );
};
