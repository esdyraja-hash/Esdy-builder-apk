import React from 'react';
import { 
  Hammer, 
  Layers, 
  KeyRound, 
  GitBranch, 
  Store, 
  BarChart3, 
  Archive, 
  BookOpen, 
  Moon, 
  Sun, 
  Laptop, 
  Crown,
  Sparkles
} from 'lucide-react';
import { ThemeMode } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isPremium: boolean;
  onOpenPremium: () => void;
  onQuickBuild: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  themeMode,
  setThemeMode,
  isPremium,
  onOpenPremium,
  onQuickBuild,
}) => {
  const tabs = [
    { id: 'build', label: 'Build Studio', icon: Hammer },
    { id: 'project', label: 'Gradle & Modules', icon: Layers },
    { id: 'signing', label: 'Signing Keys', icon: KeyRound },
    { id: 'cicd', label: 'CI/CD Pipelines', icon: GitBranch },
    { id: 'playstore', label: 'Play Store Suite', icon: Store },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'unpacker', label: 'APK Unpacker', icon: Archive },
    { id: 'docs', label: 'Offline Docs', icon: BookOpen },
  ];

  const cycleTheme = () => {
    if (themeMode === 'dark') setThemeMode('light');
    else if (themeMode === 'light') setThemeMode('system');
    else setThemeMode('dark');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark with User's ESDY Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 shrink-0">
              <img 
                src="/assets/aistudio/icon-192_a0956b51.png" 
                alt="ESDY Studio" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to text if file path fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  ESDY Android Studio
                </span>
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/80">
                  Gradle 8.10
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                APK &amp; AAB Builder · Local CI/CD
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Single-line whitespace-nowrap) */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Theme Toggle, Premium Status, Primary Action) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              title={`Current theme: ${themeMode}. Click to switch.`}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-200 dark:border-slate-800"
              aria-label="Toggle theme"
            >
              {themeMode === 'dark' ? (
                <Moon className="w-4 h-4 text-cyan-400" />
              ) : themeMode === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Laptop className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Premium Button */}
            <button
              onClick={onOpenPremium}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                isPremium
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
              }`}
            >
              {isPremium ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Premium Active</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Activate Pro</span>
                </>
              )}
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onQuickBuild}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 dark:from-cyan-500 dark:to-teal-400 dark:text-slate-950 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              Build AAB / APK
            </button>
          </div>

        </div>

        {/* Secondary Mobile/Tablet Tab Bar */}
        <div className="xl:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-900 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
