import React, { useState } from 'react';
import { 
  Crown, 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Zap, 
  Sliders 
} from 'lucide-react';
import { StorageService } from '../services/storageService';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
  onPremiumChange: (active: boolean) => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  isPremium,
  onPremiumChange,
}) => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  if (!isOpen) return null;

  // Hash checking function matching user's original ESDY code algorithm
  const esdyHash = (str: string) => {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return String(4294967296 * (2097151 & h2) + (h1 >>> 0));
  };

  const handleActivateCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    
    // Hash "519728207007993" or "ESDY-PRO" or test codes
    if (
      esdyHash(cleanCode) === '519728207007993' ||
      cleanCode === 'ESDY-PRO-2025' ||
      cleanCode === '519728207007993'
    ) {
      StorageService.setPremium(true);
      onPremiumChange(true);
      setMessage({ text: '✓ ESDY Pro License activated successfully!', error: false });
    } else {
      setMessage({ text: 'Invalid activation code. Please check and retry.', error: true });
    }
  };

  const handleToggleTestMode = (checked: boolean) => {
    StorageService.setPremium(checked);
    onPremiumChange(checked);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md">
            <Crown className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              ESDY Pro Studio License
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Unrestricted AAB &amp; APK packaging without watermarks
            </p>
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-2.5 my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
          {[
            '100% Watermark Removal from all generated AAB & APK files',
            'Commercial Google Play publishing compliance without builder tags',
            'Custom CI/CD Webhook hooks for Slack, Discord & Google Chat',
            'Multi-module dynamic feature bundle compression optimizations',
            'Priority local Gradle compilation speed & parallel tasks',
          ].map((benefit, i) => (
            <div key={i} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Code Activation Form */}
        <form onSubmit={handleActivateCode} className="space-y-3 mb-5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Enter Premium License Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 519728207007993"
              className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-cyan-500 dark:text-slate-950 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Activate
            </button>
          </div>

          {message && (
            <div className={`text-xs font-medium ${message.error ? 'text-red-500' : 'text-emerald-500'}`}>
              {message.text}
            </div>
          )}
        </form>

        {/* Testing Mode Switch */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Developer Test Mode Switch
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Instantly toggle watermark status for testing
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => handleToggleTestMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

      </div>
    </div>
  );
};
