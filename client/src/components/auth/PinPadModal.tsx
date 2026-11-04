import React, { useState, useEffect } from 'react';
import { Delete, X, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

interface PinPadModalProps {
  title?: string;
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => Promise<boolean | void>;
  error?: string | null;
}

export const PinPadModal: React.FC<PinPadModalProps> = ({
  title,
  subtitle,
  isOpen,
  onClose,
  onSuccess,
  error: externalError
}) => {
  const { t } = useLanguage();
  const displayTitle = title || t('profiles.enterPinSub');
  const displaySubtitle = subtitle || t('profiles.enterPinSub');
  const [pin, setPin] = useState<string>('');
  const [shake, setShake] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (externalError) {
      setErrorMessage(externalError);
      triggerShake();
    }
  }, [externalError]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin('');
    }, 500);
  };

  const handleDigit = async (digit: string) => {
    if (pin.length >= 6 || isVerifying) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMessage(null);

    // Auto submit on 6th digit
    if (newPin.length === 6) {
      setIsVerifying(true);
      try {
        const ok = await onSuccess(newPin);
        if (ok === false) {
          triggerShake();
          setErrorMessage(t('profiles.invalidPin'));
        }
      } catch (err: any) {
        triggerShake();
        setErrorMessage(err.message || t('profiles.invalidPin'));
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && !isVerifying) {
      setPin(pin.slice(0, -1));
      setErrorMessage(null);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, isVerifying]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div
        className={`w-full max-w-xs p-6 rounded-3xl glass-dark border border-slate-700/60 shadow-2xl transition-transform ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">{displayTitle}</h2>
          <p className="text-xs text-slate-400 mt-1">{displaySubtitle}</p>
        </div>

        {/* 6 PIN Indicator Dots */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-indigo-500 shadow-glow scale-110'
                    : 'border-2 border-slate-600 bg-slate-800/40'
                }`}
              />
            );
          })}
        </div>

        {errorMessage && (
          <p className="text-center text-xs font-semibold text-rose-400 mb-4 animate-pulse">
            {errorMessage}
          </p>
        )}

        {/* Numeric Keypad (3x4) */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isVerifying}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-700/70 active:scale-95 text-white text-xl font-semibold border border-slate-700/40 transition-all flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            className="h-14 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 text-slate-400 text-xs font-medium uppercase tracking-wider transition-all flex items-center justify-center"
          >
            {t('common.cancel')}
          </button>

          <button
            type="button"
            disabled={isVerifying}
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-700/70 active:scale-95 text-white text-xl font-semibold border border-slate-700/40 transition-all flex items-center justify-center shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isVerifying || pin.length === 0}
            className="h-14 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 text-slate-400 hover:text-white transition-all flex items-center justify-center disabled:opacity-30"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
