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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0B0F19] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <AlertTriangle className={`w-4 h-4 ${confirmVariant === 'rose' ? 'text-rose-400' : 'text-amber-400'}`} />
            <span>{title}</span>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{message}</p>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors ${
              confirmVariant === 'rose'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20'
                : 'bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
