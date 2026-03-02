"use client";

import { AppModal } from "@/components/AppModal";

interface ConfirmActionModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmActionModal({
  open,
  title,
  description,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  return (
    <AppModal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      maxWidthClassName="max-w-md"
      disableClose={isLoading}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-qf-border-primary text-qf-text-secondary hover:text-white transition-colors disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-red-500/90 text-white hover:bg-red-500 transition-colors disabled:opacity-60"
          >
            {isLoading ? "Выполняю..." : confirmText}
          </button>
        </div>
      }
    >
      {null}
    </AppModal>
  );
}
