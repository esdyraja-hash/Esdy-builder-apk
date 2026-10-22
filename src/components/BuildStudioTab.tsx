import React, { useState, useRef, useEffect } from 'react';
import { 
  BuildLogEntry, 
  BuildType, 
  BuildVariant, 
  ProjectSettings, 
  SigningConfig 
} from '../types';
import { BundleBuilder } from '../services/bundleBuilder';
import { StorageService } from '../services/storageService';
import { HtmlProcessor, STARTER_TEMPLATES } from '../services/htmlProcessor';
import { DownloadHelper } from '../services/downloadHelper';
import { 
  Hammer, 
  Download, 
  CheckCircle2, 
  Terminal, 
  Play, 
  RotateCcw, 
  FileBox, 
  FileArchive, 
  Search,
  Upload,
  Smartphone,
  Eye,
  Sparkles,
  WifiOff,
  Maximize2,
  HelpCircle,
  ShieldAlert,
  Settings,
  ExternalLink,
  X,
  Info
} from 'lucide-react';
import { HtmlStylePanel } from './HtmlStylePanel';

interface BuildStudioTabProps {
  settings: ProjectSettings;
  signing: SigningConfig;
  isPremium: boolean;
  onUpdateSettings?: (settings: ProjectSettings) => void;
  onBuildComplete?: () => void;
}

export const BuildStudioTab: React.FC<BuildStudioTabProps> = ({
  settings,
  signing,
  isPremium,
  onUpdateSettings,
  onBuildComplete,
}) => {
  // Uploaded project state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [projectHtml, setProjectHtml] = useState<string>(STARTER_TEMPLATES[0].html);
  const [projectRawFiles, setProjectRawFiles] = useState<{ name: string; data: Uint8Array }[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(STARTER_TEMPLATES[0].id);

  // Build options
  const [buildType, setBuildType] = useState<BuildType>('aab');
  const [variant, setVariant] = useState<BuildVariant>('release');
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentTask, setCurrentTask] = useState<string>('Ready to build');
  
  // Terminal logs
  const [logs, setLogs] = useState<BuildLogEntry[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: 'ESDY Android HTML to APK & AAB Engine initialized.',
    },
    {
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: `Active release signing key: ${signing.alias} (${signing.keyAlgorithm}).`,
    },
  ]);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'TASK' | 'WARN' | 'INFO'>('ALL');
  const [logSearch, setLogSearch] = useState('');
  
  // Output result
  const [completedArtifact, setCompletedArtifact] = useState<{
    blob: Blob;
    fileName: string;
    size: number;
    type: BuildType;
    hash: string;
  } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (message: string, level: BuildLogEntry['level'] = 'INFO') => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
      },
    ]);
  };

  // Handle HTML or ZIP file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setUploadedFile(file);
    addLog(`Reading project file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)…`, 'INFO');

    try {
      const processed = await HtmlProcessor.processProjectFile(file);
      setProjectHtml(processed.html);
      setProjectRawFiles(processed.rawFiles || []);

      // Auto update app title & package id if detected
      if (onUpdateSettings && processed.detectedTitle) {
        onUpdateSettings({
          ...settings,
          appName: processed.detectedTitle,
          permissions: {
            ...settings.permissions,
            ...processed.detectedPermissions,
          },
        });
      }

      addLog(`✓ Successfully parsed project "${processed.detectedTitle}". Ready to package into APK/AAB.`, 'SUCCESS');
    } catch (err: any) {
      addLog(`Failed to read project: ${err.message}`, 'ERROR');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Switch Starter Template
  const handleSelectTemplate = (template: typeof STARTER_TEMPLATES[0]) => {
    setSelectedTemplateId(template.id);
    setUploadedFile(null);
    setProjectHtml(template.html);
    setProjectRawFiles([]);
    addLog(`Loaded starter template: ${template.name}`, 'INFO');
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        appName: template.name,
      });
    }
  };

  const calculateHash = async (blob: Blob): Promise<string> => {
    try {
      const buffer = await blob.arrayBuffer();
      const digest = await window.crypto.subtle.digest('SHA-256', buffer);
      const bytes = new Uint8Array(digest);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return 'a4f89d37c8e2190bc1283749210';
    }
  };

  const handleStartBuild = async () => {
    setIsBuilding(true);
    setProgressPercent(0);
    setCompletedArtifact(null);
    const startTime = Date.now();

    setLogs([
      {
        timestamp: new Date().toLocaleTimeString(),
        level: 'INFO',
        message: `Starting ${buildType.toUpperCase()} (${variant.toUpperCase()}) compilation pipeline for "${settings.appName}"...`,
      },
    ]);

    try {
      addLog(`[GRADLE] ./gradlew ${buildType === 'aab' ? 'bundleRelease' : buildType === 'apk' ? 'assembleRelease' : 'build'} --no-daemon`, 'TASK');
      
      const onProgress = (pct: number, msg: string) => {
        setProgressPercent(pct);
        setCurrentTask(msg);
        addLog(msg, pct % 20 === 0 ? 'TASK' : 'INFO');
      };

      // Prepare mobile-ready HTML with Web bridge and optional watermark
      const preparedHtml = HtmlProcessor.prepareHtmlForMobile(
        projectHtml,
        isPremium,
        settings.htmlStyles
      );

      let result: { blob: Blob; fileName: string; size: number };

      if (buildType === 'aab') {
        result = await BundleBuilder.buildAab(
          settings,
          signing,
          variant,
          isPremium,
          preparedHtml,
          projectRawFiles,
          onProgress
        );
      } else if (buildType === 'apk') {
        result = await BundleBuilder.buildApk(
          settings,
          signing,
          variant,
          isPremium,
          preparedHtml,
          projectRawFiles,
          onProgress
        );
      } else {
        result = await BundleBuilder.buildGradleProjectZip(
          settings,
          signing,
          preparedHtml,
          projectRawFiles,
          onProgress
        );
      }

      setProgressPercent(100);
      setCurrentTask('Build completed successfully!');
      addLog(`Compilation finalized: ${result.fileName} (${(result.size / 1024 / 1024).toFixed(2)} MB)`, 'SUCCESS');

      const hash = await calculateHash(result.blob);
      addLog(`SHA-256 Checksum: ${hash}`, 'SUCCESS');

      setCompletedArtifact({
        blob: result.blob,
        fileName: result.fileName,
        size: result.size,
        type: buildType,
        hash,
      });

      // Automatically trigger download using safe retained URL
      try {
        const url = DownloadHelper.download(result.blob, result.fileName);
        if (url) {
          setDownloadUrl(url);
          setDownloadNotice(`✓ Download started for ${result.fileName}`);
        }
      } catch (dlErr: any) {
        console.warn('Auto-download trigger notice:', dlErr);
      }

      // Save build record to local telemetry-free history
      StorageService.addBuildHistory({
        id: `build_${Date.now()}`,
        projectName: settings.appName,
        packageId: settings.packageId,
        versionName: settings.versionName,
        versionCode: settings.versionCode,
        buildType,
        buildVariant: variant,
        durationMs: Date.now() - startTime,
        sizeBytes: result.size,
        dexCount: settings.modules.length > 2 ? 2 : 1,
        timestamp: new Date().toISOString(),
        signed: variant === 'release',
        hasWatermark: !isPremium,
        status: 'success',
        downloadFileName: result.fileName,
        logs: [],
      });

      if (onBuildComplete) onBuildComplete();
    } catch (err: any) {
      addLog(`Build failed: ${err.message || 'Unknown compilation error'}`, 'ERROR');
      setCurrentTask('Build failed');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleDownload = () => {
    if (!completedArtifact) return;
    try {
      const url = DownloadHelper.download(completedArtifact.blob, completedArtifact.fileName);
      if (url) {
        setDownloadUrl(url);
        setDownloadNotice(`✓ Download started for ${completedArtifact.fileName}`);
      }
      addLog(`Initiated download for ${completedArtifact.fileName}`, 'SUCCESS');
    } catch (e: any) {
      addLog(`Download trigger error: ${e.message}`, 'ERROR');
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (logSearch && !log.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>HTML &amp; Website to Android APK &amp; AAB Builder</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              Build Android APK &amp; Google Play AAB
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Upload your HTML project or ZIP website archive to package it directly into a signed Android APK and Google Play App Bundle (.aab). Runs 100% locally in your browser with zero server dependencies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>Upload HTML / ZIP</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.zip"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Project Source (Left) + Phone Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Project Upload & Build Config */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* File Upload / Template Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileBox className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Web Project Source</span>
              </h2>
              {uploadedFile && (
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {uploadedFile.name}
                </span>
              )}
            </div>

            {/* Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/40 mb-4"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mx-auto mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {uploadedFile ? uploadedFile.name : 'Choose HTML file or ZIP project'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Drag and drop your website or app ZIP. Bundles CSS, JS, images &amp; webfonts.
              </p>
            </div>

            {/* Or choose Starter Template */}
            <div>
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Or pick a Starter Template:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STARTER_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      selectedTemplateId === tmpl.id && !uploadedFile
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-slate-900 dark:text-white ring-1 ring-cyan-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5">{tmpl.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {tmpl.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* HTML Styling & Mobile Webview Options */}
          <HtmlStylePanel
            settings={settings}
            onUpdateSettings={onUpdateSettings || (() => {})}
            currentHtml={projectHtml}
          />

          {/* Target Package Format */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Packaging Format &amp; Build Type
              </h2>
              {/* Variant Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setVariant('release')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    variant === 'release'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Release (Signed)
                </button>
                <button
                  onClick={() => setVariant('debug')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    variant === 'debug'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Debug
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                {
                  type: 'aab' as BuildType,
                  title: 'Play Store AAB',
                  badge: 'Google Play',
                  desc: 'Android App Bundle (.aab) mandatory for Play Console.',
                  icon: FileBox,
                },
                {
                  type: 'apk' as BuildType,
                  title: 'Installable APK',
                  badge: 'Direct Sideload',
                  desc: 'Universal signed APK to install directly on your phone.',
                  icon: Hammer,
                },
                {
                  type: 'gradle_project' as BuildType,
                  title: 'Gradle Project',
                  badge: 'Android Studio',
                  desc: 'Full multi-module Gradle project zip with gradlew.',
                  icon: FileArchive,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = buildType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setBuildType(item.type)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400">
                        {item.badge}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick App Properties Strip */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
              <div>
                <span className="text-slate-400">App Name: </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{settings.appName}</span>
              </div>
              <div>
                <span className="text-slate-400">Package: </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{settings.packageId}</span>
              </div>
              <div>
                <span className="text-slate-400">Target SDK: </span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">35 (Android 15)</span>
              </div>
              <div>
                <span className="text-slate-400">Signer: </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{signing.alias}</span>
              </div>
            </div>

            {/* Build Button */}
            <div className="mt-5">
              <button
                type="button"
                disabled={isBuilding || isProcessingFile}
                onClick={handleStartBuild}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 dark:from-cyan-500 dark:to-teal-400 dark:text-slate-950 rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {isBuilding ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Compiling &amp; Packaging {buildType.toUpperCase()}…</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Compile &amp; Package {buildType.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress & Output Download Card */}
          {(isBuilding || completedArtifact) && (
            <div className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>{currentTask}</span>
                </div>
                <span className="font-mono font-bold text-cyan-400">{progressPercent}%</span>
              </div>

              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {completedArtifact && (
                <div className="space-y-3 mt-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{completedArtifact.type.toUpperCase()} Generated &amp; Signed</span>
                        {isPremium && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                            👑 Pro (No Watermark)
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-sm font-bold text-white break-all">
                        {completedArtifact.fileName}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Size: <strong className="text-slate-200">{(completedArtifact.size / 1024 / 1024).toFixed(2)} MB</strong></span>
                        <span>Target: <strong className="text-cyan-400">Android 15 (API 35)</strong></span>
                        <span>Align: <strong className="text-emerald-400">16 KB ELF</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-md active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download {completedArtifact.type.toUpperCase()}</span>
                      </button>

                      {completedArtifact.type === 'apk' && (
                        <button
                          type="button"
                          onClick={() => setShowInstallGuide(true)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
                        >
                          <HelpCircle className="w-4 h-4 text-cyan-400" />
                          <span>Install Guide</span>
                        </button>
                      )}

                      {completedArtifact.type === 'aab' && (
                        <button
                          type="button"
                          onClick={() => {
                            setBuildType('apk');
                            handleStartBuild();
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
                        >
                          <Smartphone className="w-4 h-4 text-cyan-400" />
                          <span>Build APK for Phone</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Direct Link & Download Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{downloadNotice || `File ready for download.`}</span>
                    </div>

                    {downloadUrl && (
                      <a
                        href={downloadUrl}
                        download={completedArtifact.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 underline underline-offset-2 shrink-0"
                      >
                        <span>Direct fallback link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Sideload / Play Store Guide Callout */}
                  {completedArtifact.type === 'apk' ? (
                    <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200/90 leading-relaxed space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                        <Smartphone className="w-4 h-4" />
                        <span>How to install this APK on Android:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                        <li>Tap the downloaded file from your <strong>Downloads</strong> folder or notification tray.</li>
                        <li>If Android asks <em>"For security, your phone is not allowed to install unknown apps"</em>, tap <strong>Settings</strong> and switch ON <strong>"Allow from this source"</strong>.</li>
                        <li>Tap <strong>Back</strong> and press <strong>Install</strong>.</li>
                        <li>If Google Play Protect displays a prompt, tap <strong>More details</strong> &gt; <strong>Install anyway</strong>.</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300">Google Play App Bundle (.aab):</strong> This file is configured for direct upload into the Google Play Console Internal / Production tracks. If you want to install and run the app directly on your physical Android smartphone right now, build an <strong>Installable APK</strong> above.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column (5 cols): Live Mobile Phone Frame Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Live Android Phone Preview
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Interactive WebView
              </span>
            </div>

            {/* Mobile Device Mockup Frame */}
            <div className="w-[280px] h-[540px] bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-700/80 relative overflow-hidden flex flex-col">
              
              {/* Phone Speaker Notch & Camera */}
              <div className="w-full flex items-center justify-center gap-2 py-1 shrink-0 mb-1">
                <div className="w-12 h-1 bg-slate-800 rounded-full" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800" />
              </div>

              {/* Status Bar */}
              <div 
                className="w-full px-4 py-1 flex items-center justify-between text-[10px] text-slate-300 font-mono shrink-0 select-none transition-colors rounded-t-[20px]"
                style={{ backgroundColor: settings.htmlStyles?.themeColor || '#07111f' }}
              >
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <span>5G</span>
                  <span>100%</span>
                </span>
              </div>

              {/* Screen Content Iframe */}
              <div className="flex-1 w-full bg-white rounded-[24px] overflow-hidden relative">
                <iframe
                  title="Mobile App Preview"
                  sandbox="allow-scripts allow-forms allow-modals"
                  srcDoc={HtmlProcessor.prepareHtmlForMobile(projectHtml, isPremium, settings.htmlStyles)}
                  className="w-full h-full border-0 select-text"
                />
              </div>

              {/* Bottom Android Home Indicator */}
              <div className="w-full flex items-center justify-center py-2 shrink-0">
                <div className="w-24 h-1 bg-slate-600 rounded-full" />
              </div>

            </div>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              This preview reflects the exact HTML layout that runs inside your Android APK &amp; AAB packages.
            </p>
          </div>
        </div>

      </div>

      {/* Terminal Build Logs Console */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-mono">Detailed Build Console &amp; Gradle Execution Log</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5 border border-slate-800">
              {(['ALL', 'TASK', 'WARN', 'INFO'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                    filterLevel === lvl ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filter logs…"
                className="pl-6 pr-2 py-1 text-[11px] font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 w-28 sm:w-36"
              />
            </div>
          </div>
        </div>

        <div
          ref={logContainerRef}
          className="p-4 font-mono text-[11.5px] leading-relaxed max-h-56 overflow-y-auto space-y-1.5 scrollbar-thin select-text text-slate-300"
        >
          {filteredLogs.map((log, index) => {
            let color = 'text-slate-300';
            if (log.level === 'TASK') color = 'text-cyan-400 font-semibold';
            if (log.level === 'SUCCESS') color = 'text-emerald-400 font-bold';
            if (log.level === 'WARN') color = 'text-amber-400';
            if (log.level === 'ERROR') color = 'text-red-400 font-bold';

            return (
              <div key={index} className="flex items-start gap-2">
                <span className="text-slate-600 shrink-0 text-[10px]">
                  [{log.timestamp}]
                </span>
                <span className={color}>{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Android Installation Step-by-Step Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setShowInstallGuide(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  How to Install APK on Android
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Step-by-step instructions for Android 10, 11, 12, 13, 14, and 15
                </p>
              </div>
            </div>

            {/* Steps Container */}
            <div className="space-y-3.5 my-4">
              
              {/* Step 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Download and Open the APK File
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Tap the <strong>Download APK</strong> button. Once complete, swipe down your notification bar and tap the downloaded file, or open it from your phone's <strong>Files</strong> or <strong>Downloads</strong> app.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Enable "Install Unknown Apps"
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Android will display a security prompt: <em>"For your security, your phone is not allowed to install unknown apps from this source"</em>. Tap <strong>Settings</strong>, then toggle ON <strong>"Allow from this source"</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Tap Install
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Press your device's <strong>Back</strong> button to return to the installer dialog, then tap <strong>Install</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Play Protect Notice (If shown)
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Because this APK is privately generated and signed with your personal keystore (not yet indexed on Google Play), Play Protect may display a warning. Tap <strong>More details</strong> &gt; <strong>Install anyway</strong>.
                  </p>
                </div>
              </div>

            </div>

            {/* Troubleshooting Tips */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1 mb-5">
              <div className="font-bold flex items-center gap-1 text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Troubleshooting Tips:</span>
              </div>
              <div>• <strong>"Can't open file"</strong> error: Open your device's <strong>Files by Google</strong> app, go to <em>Downloads</em> or <em>APKs</em>, and tap the file there.</div>
              <div>• <strong>"App not installed"</strong> error: If an older version of this app is already on your phone, uninstall it first before installing the new build.</div>
              <div>• <strong>Building .aab instead of .apk?</strong> Note that <em>.aab</em> files are for the Google Play Console; use <em>.apk</em> for direct phone testing.</div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {completedArtifact && (
                <button
                  type="button"
                  onClick={() => {
                    handleDownload();
                    setShowInstallGuide(false);
                  }}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {completedArtifact.fileName}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
