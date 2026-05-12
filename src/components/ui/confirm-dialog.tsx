"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = "Confirmar exclusão",
  description = "Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.",
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/60 dark:border-zinc-800/60 w-full max-w-md mx-4 p-0 animate-in zoom-in-95 fade-in duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-5">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={28} />
          </div>

          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex gap-3 px-8 pb-8">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl text-base font-medium"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl text-base font-medium bg-red-600 hover:bg-red-700 text-white active:scale-95 transition-all duration-200"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Custom hook for using the confirm dialog
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    resolve: ((value: boolean) => void) | null;
  }>({ open: false, resolve: null });

  const confirm = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState({ open: false, resolve: null });
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState({ open: false, resolve: null });
  }, [state.resolve]);

  return {
    isOpen: state.open,
    confirm,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };
}
