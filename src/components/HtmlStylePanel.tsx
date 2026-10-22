import React, { useState } from 'react';
import { HtmlStyleOptions, ProjectSettings } from '../types';
import { HtmlProcessor } from '../services/htmlProcessor';
import { 
  Palette, 
  Sliders, 
  Code2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone,
  Sparkles,
  Maximize2,
  Image,
  Layers,
  Globe,
  Radio,
  Timer
} from 'lucide-react';

interface HtmlStylePanelProps {
  settings: ProjectSettings;
  onUpdateSettings: (newSettings: ProjectSettings) => void;
  currentHtml: string;
}

export const HtmlStylePanel: React.FC<HtmlStylePanelProps> = ({
  settings,
  onUpdateSettings,
  currentHtml,
}) => {
  const [activeSection, setActiveSection] = useState<'theme' | 'branding' | 'display' | 'webview' | 'inject' | 'audit'>('theme');
  const [auditResults, setAuditResults] = useState<{ status: 'passed' | 'warning' | 'error'; message: string }[] | null>(null);

  const styles = settings.htmlStyles || {
    themeColor: '#07111f',
    backgroundColor: '#07111f',
    disableTextSelection: true,
    disablePinchZoom: true,
    enablePullToRefresh: true,
    enableSafeAreaInsets: true,
    enableNativeDialogs: true,
    enableNativeBridge: true,
    enableConsentFlow: false,
    privacyPolicyUrl: 'https://esdy.app/privacy',
    customHeadInject: '',
    customBodyInject: '',
    fontFamily: 'jakarta',
    orientation: 'sensorPortrait',
    fullscreen: false,
    keepScreenOn: false,
    hardwareAcceleration: true,
    allowCleartextHttp: false,
    cacheStrategy: 'default',
    backButtonAction: 'history',
    customUserAgent: '',
    splashDurationSec: 2,
    bundleRemoteAssets: true,
  };

  const updateStyle = <K extends keyof HtmlStyleOptions>(key: K, value: HtmlStyleOptions[K]) => {
    onUpdateSettings({
      ...settings,
      htmlStyles: {
        ...styles,
        [key]: value,
      },
    });
  };

  const runAudit = () => {
    const results = HtmlProcessor.auditHtml(currentHtml);
    setAuditResults(results);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateStyle('appIconDataUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSplashUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateStyle('splashDataUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const colorPresets = [
    { label: 'ESDY Dark', hex: '#07111f' },
    { label: 'Deep Slate', hex: '#0f172a' },
    { label: 'Pitch Black', hex: '#000000' },
    { label: 'Studio White', hex: '#ffffff' },
    { label: 'Cyan Teal', hex: '#088395' },
    { label: 'Ocean Blue', hex: '#0284c7' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Subheader tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 gap-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            HTML Styling &amp; Mobile Options
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'theme', label: 'Theme & Colors' },
            { id: 'branding', label: 'Icon & Splash' },
            { id: 'display', label: 'Display & Window' },
            { id: 'webview', label: 'Webview & Bridge' },
            { id: 'inject', label: 'Custom CSS/JS' },
            { id: 'audit', label: 'Check HTML' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeSection === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        
        {/* Section 1: Theme & Colors */}
        {activeSection === 'theme' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                Status Bar &amp; Android Theme Color
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="color"
                  value={styles.themeColor}
                  onChange={(e) => updateStyle('themeColor', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={styles.themeColor}
                  onChange={(e) => updateStyle('themeColor', e.target.value)}
                  className="w-28 px-3 py-1.5 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />

                <div className="flex items-center gap-1.5 flex-wrap">
                  {colorPresets.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        updateStyle('themeColor', c.hex);
                        updateStyle('backgroundColor', c.hex);
                        updateStyle('navigationBarColor', c.hex);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Android Navigation Bar & Status Bar Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                  Bottom Android Navigation Bar Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={styles.navigationBarColor || '#07111f'}
                    onChange={(e) => updateStyle('navigationBarColor', e.target.value)}
                    className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={styles.navigationBarColor || '#07111f'}
                    onChange={(e) => updateStyle('navigationBarColor', e.target.value)}
                    className="flex-1 px-3 py-1.5 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                  Status Bar Text &amp; Icon Tone
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'light', label: 'Light Icons' },
                    { id: 'dark', label: 'Dark Icons' },
                    { id: 'auto', label: 'Adaptive' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => updateStyle('statusBarIcons', s.id as any)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                        (styles.statusBarIcons || 'light') === s.id
                          ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-slate-900 dark:text-white font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dark Mode Scheme Policy */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                Dark Mode &amp; Color Scheme Policy
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'auto', label: 'System Adaptive', desc: 'Syncs with user phone' },
                  { id: 'force_dark', label: 'Force Dark Mode', desc: 'Always dark theme' },
                  { id: 'force_light', label: 'Force Light Mode', desc: 'Always light theme' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => updateStyle('darkModeSupport', m.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      (styles.darkModeSupport || 'auto') === m.id
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs">{m.label}</div>
                    <div className="text-[10px] text-slate-400">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                App Typography &amp; Font Family
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'jakarta', label: 'Plus Jakarta Sans', desc: 'Modern & Clean' },
                  { id: 'inter', label: 'Inter', desc: 'SaaS UI Sans' },
                  { id: 'poppins', label: 'Poppins', desc: 'Rounded Friendly' },
                  { id: 'roboto', label: 'Roboto', desc: 'Android Material' },
                  { id: 'system', label: 'System Default', desc: 'Native Device' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateStyle('fontFamily', f.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      styles.fontFamily === f.id
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs">{f.label}</div>
                    <div className="text-[10px] text-slate-400">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Branding & Splash */}
        {activeSection === 'branding' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* App Icon */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                Custom App Launcher Icon (512x512)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {styles.appIconDataUrl ? (
                    <img src={styles.appIconDataUrl} alt="App Icon" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                    <span>Upload Square Icon</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleIconUpload} className="hidden" />
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Auto-resizes to mdpi, hdpi, xhdpi, xxhdpi, and xxxhdpi.
                  </p>
                </div>
              </div>
            </div>

            {/* Splash Screen */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                Launch Splash Screen Image
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {styles.splashDataUrl ? (
                    <img src={styles.splashDataUrl} alt="Splash Screen" className="w-full h-full object-contain" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                    <span>Upload Splash Graphic</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleSplashUpload} className="hidden" />
                  </label>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-slate-500">Duration:</span>
                    {[1, 2, 3].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => updateStyle('splashDurationSec', sec)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          styles.splashDurationSec === sec
                            ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Display & Window */}
        {activeSection === 'display' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                Screen Orientation Lock
              </label>
              <select
                value={styles.orientation}
                onChange={(e) => updateStyle('orientation', e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="sensorPortrait">Portrait Lock (Recommended for standard mobile apps)</option>
                <option value="sensorLandscape">Landscape Lock (For 2D games &amp; media players)</option>
                <option value="auto">Auto-Rotate (Sensor Adaptive)</option>
                <option value="unspecified">Unspecified (System default)</option>
              </select>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.fullscreen}
                onChange={(e) => updateStyle('fullscreen', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Immersive Fullscreen Mode
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Hides the top Android notification bar &amp; bottom navigation controls.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.keepScreenOn}
                onChange={(e) => updateStyle('keepScreenOn', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Keep Screen Awake (WakeLock)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Prevents phone display from sleeping while app is active.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.disableTextSelection}
                onChange={(e) => updateStyle('disableTextSelection', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Disable Text Selection Handles
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Stops browser blue selection handles so the app feels 100% native.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.disablePinchZoom}
                onChange={(e) => updateStyle('disablePinchZoom', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Lock Viewport Scale (Disable Pinch Zoom)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Prevents accidental page zooming and layout distortion.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.enableSafeAreaInsets}
                onChange={(e) => updateStyle('enableSafeAreaInsets', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Notch &amp; Gesture Inset Padding
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Handles camera cutouts and bottom gesture bars (`env(safe-area-inset)`).
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.vibrateOnTap || false}
                onChange={(e) => updateStyle('vibrateOnTap', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Haptic Vibration on Tap
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Triggers native micro-vibration feedback when tapping buttons and links.
                </div>
              </div>
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                Initial Page Loading Indicator
              </label>
              <select
                value={styles.loadingIndicator || 'spinner'}
                onChange={(e) => updateStyle('loadingIndicator', e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="spinner">Circular Cyan Spinner</option>
                <option value="progress_bar">Top Slim Progress Bar</option>
                <option value="none">None (Instant Display)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                Viewport Zoom Level
              </label>
              <select
                value={styles.zoomLevel || 'responsive'}
                onChange={(e) => updateStyle('zoomLevel', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="responsive">Responsive (100% Fit)</option>
                <option value="90%">Slightly Zoomed Out (90%)</option>
                <option value="110%">Slightly Enlarged (110%)</option>
                <option value="125%">Large Accessibility (125%)</option>
              </select>
            </div>
          </div>
        )}

        {/* Section 4: Webview & Hardware */}
        {activeSection === 'webview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                Android Back Button Action
              </label>
              <select
                value={styles.backButtonAction}
                onChange={(e) => updateStyle('backButtonAction', e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="history">Go Back in Web History (Recommended)</option>
                <option value="exit_dialog">Ask "Do you want to exit?" Dialog</option>
                <option value="minimize">Minimize App to Background</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                Webview Cache Strategy
              </label>
              <select
                value={styles.cacheStrategy}
                onChange={(e) => updateStyle('cacheStrategy', e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="default">Default (Online with local cache)</option>
                <option value="cache_first">Cache First (Maximum offline speed)</option>
                <option value="network_only">Network Only (Always fetch fresh API)</option>
              </select>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.enableFilePicker ?? true}
                onChange={(e) => updateStyle('enableFilePicker', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  HTML5 File Picker &amp; Camera Uploads
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Allows `&lt;input type="file"&gt;` to open Android system file chooser and camera.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.enableGeolocation ?? true}
                onChange={(e) => updateStyle('enableGeolocation', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  GPS Geolocation Bridge
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Allows HTML5 `navigator.geolocation` calls with automatic Android permission prompt.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.enableWebAudio ?? true}
                onChange={(e) => updateStyle('enableWebAudio', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  HTML5 Audio &amp; Video Autoplay
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Permits inline media playback and background sound without gesture requirements.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.enableCopyPaste ?? true}
                onChange={(e) => updateStyle('enableCopyPaste', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Clipboard Access (Copy / Paste)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Enables `navigator.clipboard.writeText` and `readText` for in-app copy actions.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.enableNativeBridge}
                onChange={(e) => updateStyle('enableNativeBridge', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Hardware Bridge (`window.Esdy`)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Allows HTML JS to call `Esdy.vibrate()`, `Esdy.toast()`, `Esdy.notify()`, and `Esdy.share()`.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.enableNativeDialogs}
                onChange={(e) => updateStyle('enableNativeDialogs', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Modern Native Popups &amp; Dialogs
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Replaces default browser alerts with modern card overlays for `alert()`, `confirm()`, `prompt()`.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.hardwareAcceleration}
                onChange={(e) => updateStyle('hardwareAcceleration', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Hardware GPU Acceleration
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Leverages Android GPU for 60/120 FPS CSS animations and canvas rendering.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={styles.allowCleartextHttp}
                onChange={(e) => updateStyle('allowCleartextHttp', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Allow Cleartext `http://` Traffic
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Permits connecting to unencrypted HTTP development servers and local networks.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer transition-colors sm:col-span-2">
              <input
                type="checkbox"
                checked={styles.enableConsentFlow}
                onChange={(e) => updateStyle('enableConsentFlow', e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Privacy &amp; Cookie Consent Banner
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Displays bottom transparency banner for GDPR compliance and Google Play user data safety.
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Section 5: Custom Code & Script Injection */}
        {activeSection === 'inject' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                Custom Head Injection (CSS Stylesheets, Webfonts, Meta)
              </label>
              <textarea
                rows={3}
                value={styles.customHeadInject}
                onChange={(e) => updateStyle('customHeadInject', e.target.value)}
                placeholder="<style>body { background: #000; }</style> or <link rel='stylesheet' ...>"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                Custom Body Injection (JavaScript, Analytics, Listeners)
              </label>
              <textarea
                rows={3}
                value={styles.customBodyInject}
                onChange={(e) => updateStyle('customBodyInject', e.target.value)}
                placeholder="<script>console.log('App started');</script>"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Section 6: Audit HTML */}
        {activeSection === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  HTML Structure &amp; Cleartext Auditor
                </h4>
                <p className="text-[11px] text-slate-500">
                  Validates your web project for Android WebView compatibility.
                </p>
              </div>

              <button
                type="button"
                onClick={runAudit}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-cyan-500 dark:text-slate-950 rounded-xl hover:opacity-90"
              >
                Scan My HTML
              </button>
            </div>

            {auditResults && (
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {auditResults.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2.5 text-xs"
                  >
                    {r.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="text-slate-800 dark:text-slate-200">{r.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
