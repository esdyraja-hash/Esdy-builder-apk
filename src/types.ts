export type BuildType = 'apk' | 'aab' | 'gradle_project';
export type BuildVariant = 'debug' | 'release';
export type VersioningStrategy = 'semver' | 'git_commit_count' | 'timestamp' | 'ci_run_number';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface ModuleConfig {
  id: string;
  name: string;
  type: 'app' | 'library' | 'feature' | 'dynamic_feature';
  dependencies: string[];
  packageName: string;
}

export interface SigningConfig {
  alias: string;
  password: string;
  storePassword: string;
  validityYears: number;
  commonName: string;
  organization: string;
  countryCode: string;
  keyAlgorithm: 'RSA-2048' | 'RSA-4096' | 'EC-256';
  sha1Fingerprint: string;
  sha256Fingerprint: string;
  v1Signing: boolean;
  v2Signing: boolean;
  v3Signing: boolean;
  v4Signing: boolean;
  keystoreBase64?: string;
  keystoreFileName: string;
  generatedDate?: string;
}

export interface GradlePlugin {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  description: string;
  category: 'core' | 'quality' | 'cloud' | 'di' | 'analytics';
}

export interface HtmlStyleOptions {
  themeColor: string;
  backgroundColor: string;
  navigationBarColor?: string;
  statusBarIcons?: 'auto' | 'light' | 'dark';
  darkModeSupport?: 'auto' | 'force_dark' | 'force_light';
  disableTextSelection: boolean;
  disablePinchZoom: boolean;
  enablePullToRefresh: boolean;
  enableSafeAreaInsets: boolean;
  enableNativeDialogs: boolean;
  enableNativeBridge: boolean;
  enableConsentFlow: boolean;
  privacyPolicyUrl: string;
  customHeadInject: string;
  customBodyInject: string;
  fontFamily: 'system' | 'jakarta' | 'inter' | 'poppins' | 'roboto';
  orientation: 'sensorPortrait' | 'sensorLandscape' | 'auto' | 'unspecified';
  fullscreen: boolean;
  keepScreenOn: boolean;
  hardwareAcceleration: boolean;
  allowCleartextHttp: boolean;
  cacheStrategy: 'default' | 'cache_first' | 'network_only';
  backButtonAction: 'history' | 'exit_dialog' | 'minimize';
  customUserAgent: string;
  appIconDataUrl?: string;
  splashDataUrl?: string;
  splashDurationSec: number;
  bundleRemoteAssets: boolean;
  enableFilePicker?: boolean;
  enableGeolocation?: boolean;
  enableWebAudio?: boolean;
  enableCopyPaste?: boolean;
  vibrateOnTap?: boolean;
  loadingIndicator?: 'spinner' | 'progress_bar' | 'minimal' | 'none';
  zoomLevel?: string;
}

export interface ProjectSettings {
  appName: string;
  packageId: string;
  versionName: string;
  versionCode: number;
  minSdk: number;
  targetSdk: number;
  compileSdk: number;
  kotlinVersion: string;
  agpVersion: string;
  gradleVersion: string;
  versioningStrategy: VersioningStrategy;
  versionPrefix: string;
  autoBumpVersion: boolean;
  enableViewBinding: boolean;
  enableCompose: boolean;
  enableR8Shrinking: boolean;
  enable16KbPageSupport: boolean;
  modules: ModuleConfig[];
  plugins: GradlePlugin[];
  permissions: {
    internet: boolean;
    camera: boolean;
    location: boolean;
    microphone: boolean;
    notifications: boolean;
    readMediaImages: boolean;
    foregroundService: boolean;
    postNotifications: boolean;
  };
  orientation: 'sensorPortrait' | 'sensorLandscape' | 'unspecified';
  fullscreen: boolean;
  offlineSupport: boolean;
  htmlStyles: HtmlStyleOptions;
}

export interface CicdPipelineConfig {
  provider: 'github' | 'gitlab';
  triggerBranch: string;
  triggerOnPr: boolean;
  triggerOnTag: boolean;
  javaVersion: string;
  runLint: boolean;
  runUnitTests: boolean;
  runInstrumentedTests: boolean;
  runDetekt: boolean;
  enableCache: boolean;
  deployTarget: 'internal_sharing' | 'google_play_track' | 'github_releases' | 'artifact_only';
  googlePlayTrack: 'internal' | 'alpha' | 'beta' | 'production';
  notificationWebhook: string;
}

export interface PlayStoreAuditItem {
  id: string;
  category: 'policy' | 'technical' | 'privacy' | 'listing';
  title: string;
  description: string;
  status: 'passed' | 'warning' | 'failed' | 'info';
  recommendation: string;
  linkDoc?: string;
}

export interface BuildLogEntry {
  timestamp: string;
  level: 'INFO' | 'TASK' | 'WARN' | 'SUCCESS' | 'ERROR';
  message: string;
}

export interface BuildHistoryRecord {
  id: string;
  projectName: string;
  packageId: string;
  versionName: string;
  versionCode: number;
  buildType: BuildType;
  buildVariant: BuildVariant;
  durationMs: number;
  sizeBytes: number;
  dexCount: number;
  timestamp: string;
  signed: boolean;
  hasWatermark: boolean;
  status: 'success' | 'failed';
  downloadFileName: string;
  logs: BuildLogEntry[];
}

export interface BuildMetrics {
  totalBuilds: number;
  avgDurationSec: number;
  totalSizeMb: number;
  successRate: number;
  cacheHitRatio: number;
  r8ReductionPercent: number;
  history: {
    date: string;
    durationSec: number;
    sizeKb: number;
    type: BuildType;
  }[];
}
