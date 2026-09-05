import React, { ReactNode } from 'react';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, label, children, className = 'max-w-lg' }: DialogProps) {
  const dialogRef = useDialogFocus(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm transition-all animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`w-full max-h-[min(46rem,calc(100vh-2rem))] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12110f] text-stone-200 shadow-2xl shadow-black/90 flex flex-col transition-all scale-100 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

