import React, { useState } from 'react';
import { CicdPipelineConfig, ProjectSettings } from '../types';
import { CicdGenerator } from '../services/cicdGenerator';
import { 
  GitBranch, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  CheckCircle2, 
  ShieldAlert, 
  ExternalLink,
  Workflow
} from 'lucide-react';

interface CicdTabProps {
  settings: ProjectSettings;
  cicd: CicdPipelineConfig;
  onUpdateCicd: (newCicd: CicdPipelineConfig) => void;
}

export const CicdTab: React.FC<CicdTabProps> = ({
  settings,
  cicd,
  onUpdateCicd,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const updateField = <K extends keyof CicdPipelineConfig>(key: K, value: CicdPipelineConfig[K]) => {
    onUpdateCicd({
      ...cicd,
      [key]: value,
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeYaml =
    cicd.provider === 'github'
      ? CicdGenerator.generateGitHubActions(settings, cicd)
      : CicdGenerator.generateGitLabCI(settings, cicd);

  const fileName =
    cicd.provider === 'github'
      ? 'android-release.yml'
      : '.gitlab-ci.yml';

  const handleDownloadYaml = () => {
    const blob = new Blob([activeYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
          <Workflow className="w-4 h-4" />
          <span>Automated Commit Triggers &amp; Pre-Deployment Testing</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          CI/CD Deployment Pipelines
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Configure continuous integration pipelines targeting GitHub Actions and GitLab CI. Triggers automatically upon each commit, executes pre-deployment testing stages (Lint, Unit Tests, Detekt), injects signing secrets, and distributes AAB bundles to Google Play.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Pipeline Settings & Secrets Checklist */}
        <div className="space-y-6">
          
          {/* Provider Selection */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">
              CI/CD Provider Environment
            </h3>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <button
                type="button"
                onClick={() => updateField('provider', 'github')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  cicd.provider === 'github'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-slate-900 dark:text-white font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-xs mb-1">GitHub Actions</div>
                <div className="text-[10px] text-slate-500 font-mono">.github/workflows/</div>
              </button>

              <button
                type="button"
                onClick={() => updateField('provider', 'gitlab')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  cicd.provider === 'gitlab'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-slate-900 dark:text-white font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-xs mb-1">GitLab CI/CD</div>
                <div className="text-[10px] text-slate-500 font-mono">.gitlab-ci.yml</div>
              </button>
            </div>

            {/* Triggers */}
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
              Automated Triggers
            </h4>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trigger Branch (Auto-build on push)
                </label>
                <input
                  type="text"
                  value={cicd.triggerBranch}
                  onChange={(e) => updateField('triggerBranch', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  placeholder="main"
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cicd.triggerOnPr}
                  onChange={(e) => updateField('triggerOnPr', e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Trigger tests on Pull Requests</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cicd.triggerOnTag}
                  onChange={(e) => updateField('triggerOnTag', e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Trigger release when git tag pushed (v*)</span>
              </label>
            </div>

            {/* Automated Testing Stages */}
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
              Pre-Deployment Quality Stages
            </h4>
            <div className="space-y-2.5 mb-5">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cicd.runLint}
                  onChange={(e) => updateField('runLint', e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Execute Android Lint Check (`./gradlew lintRelease`)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cicd.runUnitTests}
                  onChange={(e) => updateField('runUnitTests', e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Execute JUnit Unit Tests (`./gradlew testReleaseUnitTest`)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cicd.runDetekt}
                  onChange={(e) => updateField('runDetekt', e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Execute Detekt Kotlin Static Code Analysis</span>
              </label>
            </div>

            {/* Google Play Track */}
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
              Google Play Deployment Target
            </h4>
            <select
              value={cicd.googlePlayTrack}
              onChange={(e) => updateField('googlePlayTrack', e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="internal">Internal Testing Track (Instant QA distribution)</option>
              <option value="alpha">Closed Testing (Alpha Track)</option>
              <option value="beta">Open Testing (Beta Track)</option>
              <option value="production">Production Track (Full Release)</option>
            </select>
          </div>

          {/* Repository Secrets Checklist */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Required Repository Secrets</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Add these in your GitHub Repo &gt; Settings &gt; Secrets and Variables &gt; Actions:
            </p>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
              <div className="p-1.5 bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                RELEASE_KEYSTORE_BASE64
              </div>
              <div className="p-1.5 bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                RELEASE_STORE_PASSWORD
              </div>
              <div className="p-1.5 bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                RELEASE_KEY_ALIAS
              </div>
              <div className="p-1.5 bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                RELEASE_KEY_PASSWORD
              </div>
              <div className="p-1.5 bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                PLAY_STORE_SERVICE_ACCOUNT_JSON
              </div>
            </div>
          </div>

        </div>

        {/* Right 2 Columns: YAML Code Preview & Export */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-white">
                  {cicd.provider === 'github' ? '.github/workflows/android-release.yml' : '.gitlab-ci.yml'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeYaml, 'yaml')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {copiedKey === 'yaml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'yaml' ? 'Copied' : 'Copy YAML'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadYaml}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <pre className="p-5 font-mono text-xs leading-relaxed text-slate-300 overflow-x-auto max-h-[640px] scrollbar-thin select-all">
              {activeYaml}
            </pre>
          </div>
        </div>

      </div>

    </div>
  );
};
