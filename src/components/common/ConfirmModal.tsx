import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'rose' | 'violet';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'rose',
  onConfirm,
  onCancel,
}) => {
  const { registerOverlay, unregisterOverlay } = useApp();

  useEffect(() => {
    if (isOpen) {
      registerOverlay('confirm-modal', onCancel);
      return () => unregisterOverlay('confirm-modal');
    }
  }, [isOpen, onCancel, registerOverlay, unregisterOverlay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface-container-high border border-[#27272A] rounded-xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
          <div className="flex items-center gap-2 text-on-surface font-semibold text-sm font-headline-sm">
            <AlertTriangle className={`w-4 h-4 ${confirmVariant === 'rose' ? 'text-error' : 'text-amber-400'}`} />
            <span>{title}</span>
          </div>
          <button
            onClick={onCancel}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">{message}</p>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#27272A]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-[6px] bg-surface-container hover:bg-surface-container-high border border-[#27272A] text-xs font-label-md font-medium text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-[6px] text-xs font-label-md font-semibold transition-colors ${
              confirmVariant === 'rose'
                ? 'bg-error-container text-on-error-container hover:bg-error-container/80'
                : 'bg-primary text-on-primary hover:bg-primary-fixed'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
