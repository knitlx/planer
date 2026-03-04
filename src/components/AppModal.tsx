"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface AppModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  disableClose?: boolean;
}

export function AppModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  maxWidthClassName = "max-w-lg",
  disableClose = false,
}: AppModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const disableCloseRef = useRef(disableClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    disableCloseRef.current = disableClose;
  }, [disableClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const preferredFocusable = panelRef.current?.querySelector<HTMLElement>(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"]',
    );
    const fallbackFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    const focusable = preferredFocusable || fallbackFocusable;

    if (focusable) focusable.focus();
    else panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !disableCloseRef.current) {
        event.preventDefault();
        onCloseRef.current();
      }

      if (event.key === "Tab" && panelRef.current) {
        const elements = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => {
        if (!disableClose) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`w-full ${maxWidthClassName} rounded-2xl border border-qf-border-glass bg-qf-bg-glass backdrop-blur-xl p-6 md:p-8`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id={titleId} className="text-2xl font-bold">{title}</h3>
            {description && <p id={descriptionId} className="text-qf-text-secondary mt-2">{description}</p>}
          </div>
          <button
            onClick={onClose}
            disabled={disableClose}
            aria-label="Закрыть"
            className="w-8 h-8 rounded-lg border border-qf-border-secondary text-qf-text-muted hover:text-white hover:border-qf-border-primary transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
}
