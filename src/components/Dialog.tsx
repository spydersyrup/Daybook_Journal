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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
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
        className={`w-full max-h-[min(38rem,calc(100vh-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#161311] text-stone-200 shadow-2xl shadow-black/80 flex flex-col ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
