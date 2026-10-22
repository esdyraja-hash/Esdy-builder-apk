import React, { useState } from 'react';
import { 
  ProjectSettings, 
  ModuleConfig, 
  VersioningStrategy 
} from '../types';
import { 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Layers, 
  Settings2, 
  Cpu, 
  CheckCircle2, 
  HelpCircle,
  FolderGit2
} from 'lucide-react';

interface ProjectConfigTabProps {
  settings: ProjectSettings;
  onUpdateSettings: (newSettings: ProjectSettings) => void;
}

export const ProjectConfigTab: React.FC<ProjectConfigTabProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleType, setNewModuleType] = useState<'library' | 'feature' | 'dynamic_feature'>('library');

  const updateField = <K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  const updatePermission = (perm: keyof ProjectSettings['permissions'], value: boolean) => {
    onUpdateSettings({
      ...settings,
      permissions: {
        ...settings.permissions,
        [perm]: value,
      },
    });
  };

  const togglePlugin = (pluginId: string) => {
    const updated = settings.plugins.map(p => 
      p.id === pluginId ? { ...p, enabled: !p.enabled } : p
    );
    updateField('plugins', updated);
  };

  const handleAddModule = () => {
    if (!newModuleName.trim()) return;
    const cleanName = newModuleName.trim().replace(/^:+/, '');
    const newMod: ModuleConfig = {
      id: cleanName.replace(/[:/]/g, '_'),
      name: cleanName,
      type: newModuleType,
      dependencies: [':core:model'],
      packageName: `${settings.packageId}.${cleanName.replace(/[:/]/g, '.')}`,
    };

    updateField('modules', [...settings.modules, newMod]);
    setNewModuleName('');
  };

  const handleRemoveModule = (id: string) => {
    if (id === 'app') return; // Cannot delete root app module
    updateField('modules', settings.modules.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
            <FolderGit2 className="w-4 h-4" />
            <span>Multi-Module Gradle Architecture &amp; Automated Versioning</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Project Architecture &amp; Target SDK 35
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Configure package namespaces, modern Kotlin DSL Gradle configurations, automated CI/CD version bumping, and 16 KB page-aligned native runtime for Google Play compliance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Project Identity & Versioning */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Identity Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Application Identity
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Application Name
                </label>
                <input
                  type="text"
                  value={settings.appName}
                  onChange={(e) => updateField('appName', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. My Android App"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Package ID (applicationId)
                </label>
                <input
                  type="text"
                  value={settings.packageId}
                  onChange={(e) => updateField('packageId', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="com.example.app"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Version Name
                </label>
                <input
                  type="text"
                  value={settings.versionName}
                  onChange={(e) => updateField('versionName', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="1.0.0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Base Version Code
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.versionCode}
                  onChange={(e) => updateField('versionCode', parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Versioning Strategy */}
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Automated CI/CD Versioning Strategy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'ci_run_number',
                    label: 'CI Run Number',
                    desc: 'Uses $GITHUB_RUN_NUMBER or GitLab IID',
                  },
                  {
                    id: 'git_commit_count',
                    label: 'Git Commit Count',
                    desc: 'Uses `git rev-list --count HEAD`',
                  },
                  {
                    id: 'semver',
                    label: 'Static SemVer',
                    desc: 'Manual version code progression',
                  },
                ].map((strat) => (
                  <button
                    key={strat.id}
                    type="button"
                    onClick={() => updateField('versioningStrategy', strat.id as VersioningStrategy)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      settings.versioningStrategy === strat.id
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-xs mb-1">
                      <span>{strat.label}</span>
                      {settings.versioningStrategy === strat.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {strat.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Multi-Module Project Structure */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Multi-Module Architecture
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {settings.modules.length} {settings.modules.length === 1 ? 'module' : 'modules'} configured
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Modularized Android architecture isolates core networking, models, and UI features for faster incremental Gradle compilation and Dynamic Feature Delivery.
            </p>

            <div className="space-y-2 mb-4">
              {settings.modules.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-100/70 dark:bg-cyan-950 px-2 py-0.5 rounded">
                      :{mod.name}
                    </span>
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {mod.packageName}
                      </span>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Type: <span className="capitalize">{mod.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {mod.type !== 'app' ? (
                    <button
                      onClick={() => handleRemoveModule(mod.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Remove module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Root Application
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Add Module Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                placeholder="e.g. feature:checkout or core:database"
                className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <select
                value={newModuleType}
                onChange={(e) => setNewModuleType(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="library">Library Module</option>
                <option value="feature">Feature Module</option>
                <option value="dynamic_feature">Dynamic Delivery</option>
              </select>
              <button
                type="button"
                onClick={handleAddModule}
                className="flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-cyan-500 dark:text-slate-950 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Module</span>
              </button>
            </div>

          </div>

          {/* Android Permissions Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Declared Android Permissions
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Auto-generates AndroidManifest.xml
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'internet', label: 'Internet Access', desc: 'android.permission.INTERNET' },
                { id: 'notifications', label: 'Post Notifications', desc: 'Required for Android 13+ (API 33)' },
                { id: 'camera', label: 'Device Camera', desc: 'android.permission.CAMERA' },
                { id: 'location', label: 'Location (Fine/Coarse)', desc: 'GPS & Network location' },
                { id: 'microphone', label: 'Audio & Microphone', desc: 'android.permission.RECORD_AUDIO' },
                { id: 'readMediaImages', label: 'Scoped Media Storage', desc: 'READ_MEDIA_IMAGES (Android 14+)' },
                { id: 'foregroundService', label: 'Foreground Service', desc: 'FOREGROUND_SERVICE dataSync' },
              ].map((p) => {
                const key = p.id as keyof ProjectSettings['permissions'];
                const isEnabled = settings.permissions[key];
                return (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      isEnabled
                        ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => updatePermission(key, e.target.checked)}
                      className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {p.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {p.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: SDK Targets, Compilation & Plugins */}
        <div className="space-y-6">
          
          {/* SDK Targets */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              Android SDK Targets
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Compile SDK</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{settings.compileSdk} (Android 15)</span>
                </div>
                <input
                  type="range"
                  min="33"
                  max="35"
                  value={settings.compileSdk}
                  onChange={(e) => updateField('compileSdk', parseInt(e.target.value))}
                  className="w-full accent-cyan-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Target SDK (Play Store)</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{settings.targetSdk}</span>
                </div>
                <input
                  type="range"
                  min="33"
                  max="35"
                  value={settings.targetSdk}
                  onChange={(e) => updateField('targetSdk', parseInt(e.target.value))}
                  className="w-full accent-cyan-600"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Google Play mandates Target SDK 35 (Android 15) for all new releases.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Minimum SDK</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400 font-bold">API {settings.minSdk} (Android 7.0+)</span>
                </div>
                <select
                  value={settings.minSdk}
                  onChange={(e) => updateField('minSdk', parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value={24}>API 24 - Android 7.0 (96.5% devices)</option>
                  <option value={26}>API 26 - Android 8.0 (94.2% devices)</option>
                  <option value={28}>API 28 - Android 9.0 (90.1% devices)</option>
                  <option value={30}>API 30 - Android 11.0 (82.4% devices)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Compilation Optimizations */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              Build &amp; Runtime Optimizations
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable16KbPageSupport}
                  onChange={(e) => updateField('enable16KbPageSupport', e.target.checked)}
                  className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    16 KB Page Alignment
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mandatory for Google Play 2025 to run on next-gen Android 15 hardware.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableR8Shrinking}
                  onChange={(e) => updateField('enableR8Shrinking', e.target.checked)}
                  className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    R8 / ProGuard Optimization
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Shrinks DEX code by ~40% and obfuscates sensitive business logic.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableCompose}
                  onChange={(e) => updateField('enableCompose', e.target.checked)}
                  className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Jetpack Compose Compiler
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Enables modern declarative Kotlin UI components.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Custom Gradle Plugins */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Custom Gradle Plugins
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Integrated plugins managed through `gradle/libs.versions.toml`.
            </p>

            <div className="space-y-2">
              {settings.plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  onClick={() => togglePlugin(plugin.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                    plugin.enabled
                      ? 'border-cyan-500/80 bg-cyan-50/40 dark:bg-cyan-950/20'
                      : 'border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {plugin.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {plugin.id}:{plugin.version}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    plugin.enabled
                      ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {plugin.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
