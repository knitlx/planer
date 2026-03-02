"use client";

import { ReactNode } from "react";
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
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => {
        if (!disableClose) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidthClassName} rounded-2xl border border-qf-border-glass bg-qf-bg-glass backdrop-blur-xl p-6 md:p-8`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">{title}</h3>
            {description && <p className="text-qf-text-secondary mt-2">{description}</p>}
          </div>
          <button
            onClick={onClose}
            disabled={disableClose}
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
