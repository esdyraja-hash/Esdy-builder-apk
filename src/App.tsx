import React, { useState, useEffect } from 'react';
import { 
  ProjectSettings, 
  SigningConfig, 
  CicdPipelineConfig, 
  ThemeMode 
} from './types';
import { StorageService } from './services/storageService';
import { Header } from './components/Header';
import { BuildStudioTab } from './components/BuildStudioTab';
import { ProjectConfigTab } from './components/ProjectConfigTab';
import { SigningTab } from './components/SigningTab';
import { CicdTab } from './components/CicdTab';
import { PlayStoreTab } from './components/PlayStoreTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { UnpackerTab } from './components/UnpackerTab';
import { DocumentationTab } from './components/DocumentationTab';
import { PremiumModal } from './components/PremiumModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('build');
  const [settings, setSettings] = useState<ProjectSettings>(() => StorageService.loadSettings());
  const [signing, setSigning] = useState<SigningConfig>(() => StorageService.loadSigning());
  const [cicd, setCicd] = useState<CicdPipelineConfig>(() => StorageService.loadCicd());
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    StorageService.setPremium(true);
    return true;
  });
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('esdy_theme_mode') as ThemeMode) || 'dark';
  });

  // Theme synchronization (Dark / Light / System-Adaptive)
  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = '#020617'; // slate-950
        document.body.style.color = '#f8fafc';
      } else {
        document.documentElement.classList.remove('dark');
        document.body.style.backgroundColor = '#f8fafc'; // slate-50
        document.body.style.color = '#0f172a';
      }
    };

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(themeMode === 'dark');
    }

    localStorage.setItem('esdy_theme_mode', themeMode);
  }, [themeMode]);

  // Persist settings changes
  const handleUpdateSettings = (newSettings: ProjectSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleUpdateSigning = (newSigning: SigningConfig) => {
    setSigning(newSigning);
    StorageService.saveSigning(newSigning);
  };

  const handleUpdateCicd = (newCicd: CicdPipelineConfig) => {
    setCicd(newCicd);
    StorageService.saveCicd(newCicd);
  };

  const handlePremiumChange = (active: boolean) => {
    setIsPremium(active);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200">
      
      {/* Top Bar Contract (Wordmark - Links - Primary Action) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        isPremium={isPremium}
        onOpenPremium={() => setIsPremiumModalOpen(true)}
        onQuickBuild={() => setActiveTab('build')}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'build' && (
          <BuildStudioTab
            settings={settings}
            signing={signing}
            isPremium={isPremium}
            onUpdateSettings={handleUpdateSettings}
            onBuildComplete={() => {}}
          />
        )}

        {activeTab === 'project' && (
          <ProjectConfigTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'signing' && (
          <SigningTab
            signing={signing}
            onUpdateSigning={handleUpdateSigning}
          />
        )}

        {activeTab === 'cicd' && (
          <CicdTab
            settings={settings}
            cicd={cicd}
            onUpdateCicd={handleUpdateCicd}
          />
        )}

        {activeTab === 'playstore' && (
          <PlayStoreTab
            settings={settings}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab />
        )}

        {activeTab === 'unpacker' && (
          <UnpackerTab />
        )}

        {activeTab === 'docs' && (
          <DocumentationTab />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">ESDY Android Studio</span>
            <span>·</span>
            <span>Target SDK 35 &amp; 16 KB Page Alignment Ready</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('docs')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Offline Documentation
            </button>
            <button
              onClick={() => setActiveTab('playstore')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Google Play Policies
            </button>
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              License &amp; Watermark
            </button>
          </div>
        </div>
      </footer>

      {/* Premium & Watermark Removal Modal */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        isPremium={isPremium}
        onPremiumChange={handlePremiumChange}
      />

    </div>
  );
}
