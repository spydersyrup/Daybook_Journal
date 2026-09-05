import { useEffect, useRef } from 'react';

export function useDialogFocus(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []).filter((el) => !el.hasAttribute('disabled'));
    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return onClose();
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const next = event.shiftKey ? items[0] : items[items.length - 1];
      if (document.activeElement === next) {
        event.preventDefault();
        (event.shiftKey ? items[items.length - 1] : items[0]).focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previous?.focus();
    };
  }, [isOpen, onClose]);

  return dialogRef;
}
