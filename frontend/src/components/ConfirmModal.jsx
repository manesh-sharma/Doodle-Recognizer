import React, { useEffect } from 'react';
import { AlertCircle, HelpCircle, CheckCircle2, ArrowRight, X } from 'lucide-react';

export function ConfirmModal({
  isOpen = false,
  title = 'Are you sure?',
  message = 'Please confirm your action to proceed.',
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  variant = 'warning', // 'warning' | 'info' | 'danger' | 'success'
  onConfirm,
  onCancel,
  zIndex = 'z-50',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && onCancel) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white dark:shadow-none',
          icon: <AlertCircle className="w-6 h-6" />,
        };
      case 'info':
        return {
          iconBg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white dark:shadow-none',
          icon: <HelpCircle className="w-6 h-6" />,
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white dark:shadow-none',
          icon: <CheckCircle2 className="w-6 h-6" />,
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white dark:shadow-none',
          icon: <AlertCircle className="w-6 h-6" />,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200`}>
      <div className="bg-orange-50 dark:bg-slate-900 border-[3px] border-[#3b2f2f] dark:border dark:border-slate-800 rounded-none dark:rounded-3xl shadow-[8px_8px_0_0_#3b2f2f] dark:shadow-2xl max-w-md w-full overflow-hidden p-6 scale-in-center">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-none dark:rounded-2xl border-2 border-[#3b2f2f] dark:border-0 shadow-[3px_3px_0_0_#3b2f2f] dark:shadow-none flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div>
              <h3 className="text-lg font-black pixel-font dark:font-sans text-stone-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-xs pixel-font dark:font-sans text-stone-600 dark:text-slate-400 mt-0.5">
                Confirmation required
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-none dark:rounded-xl border-2 border-[#3b2f2f] dark:border-0 bg-white dark:bg-transparent flex items-center justify-center text-stone-700 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 hover:bg-orange-300 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message body */}
        <div className="mt-4 text-sm leading-relaxed text-stone-700 dark:text-slate-300">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-none dark:rounded-xl border-2 border-[#3b2f2f] dark:border dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700/60 text-stone-800 dark:text-slate-200 text-xs font-bold pixel-font dark:font-sans transition shadow-[3px_3px_0_0_#3b2f2f] dark:shadow-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-none dark:rounded-xl border-2 border-[#3b2f2f] dark:border-0 text-xs font-bold pixel-font dark:font-sans shadow-[3px_3px_0_0_#3b2f2f] transition ${styles.btnBg}`}
          >
            <span>{confirmText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
 