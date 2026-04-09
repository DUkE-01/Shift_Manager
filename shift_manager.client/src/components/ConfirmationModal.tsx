import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationModal({
  isOpen,
  title = "Confirmar",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-lg w-[520px] max-w-full p-6 z-10">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Procesando..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}