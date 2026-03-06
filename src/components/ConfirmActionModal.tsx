"use client";

import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";

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
          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant="secondary"
            className="w-full"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            variant="destructive"
            className="w-full"
          >
            {isLoading ? "Выполняю..." : confirmText}
          </Button>
        </div>
      }
    >
      {null}
    </AppModal>
  );
}
