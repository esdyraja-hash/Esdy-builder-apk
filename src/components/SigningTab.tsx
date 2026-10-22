import React, { useState } from 'react';
import { SigningConfig } from '../types';
import { KeystoreService } from '../services/keystoreService';
import { 
  KeyRound, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  FileCode, 
  AlertCircle 
} from 'lucide-react';

interface SigningTabProps {
  signing: SigningConfig;
  onUpdateSigning: (newSigning: SigningConfig) => void;
}

export const SigningTab: React.FC<SigningTabProps> = ({
  signing,
  onUpdateSigning,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyAlgorithm, setKeyAlgorithm] = useState<'RSA-2048' | 'RSA-4096' | 'EC-256'>(signing.keyAlgorithm);
  const [commonName, setCommonName] = useState(signing.commonName);
  const [organization, setOrganization] = useState(signing.organization);
  const [alias, setAlias] = useState(signing.alias);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateNewKey = async () => {
    setIsGenerating(true);
    try {
      const newConfig = await KeystoreService.generateSigningKey({
        alias,
        commonName,
        organization,
        countryCode: 'US',
        keyAlgorithm,
        validityYears: 30,
      });
      onUpdateSigning(newConfig);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadKeystore = () => {
    if (!signing.keystoreBase64) return;
    const binary = atob(signing.keystoreBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = signing.keystoreFileName || 'release.keystore';
    a.click();
    URL.revokeObjectURL(url);
  };

  const gradlePropsSnippet = KeystoreService.generateGradleProperties(signing);

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
          <KeyRound className="w-4 h-4" />
          <span>Cryptographic Keystore &amp; Play App Signing</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          Release Signing Configurations
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Generate production-grade cryptographic keystores, view verified SHA-1 and SHA-256 fingerprints, and configure multi-scheme APK (v1/v2/v3/v4) signatures for automated CI/CD distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Keystore Generator & Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Key Details */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Active Keystore Identity
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Validity: {signing.validityYears} Years
              </span>
            </div>

            {/* Fingerprints */}
            <div className="space-y-3 mb-6">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <span>Certificate SHA-256 Fingerprint (Google Play Store &amp; App Links)</span>
                  <button
                    onClick={() => copyToClipboard(signing.sha256Fingerprint, 'sha256')}
                    className="flex items-center gap-1 text-[11px] text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                  >
                    {copiedKey === 'sha256' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'sha256' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                  {signing.sha256Fingerprint}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <span>Certificate SHA-1 Fingerprint (Firebase &amp; Google Maps API)</span>
                  <button
                    onClick={() => copyToClipboard(signing.sha1Fingerprint, 'sha1')}
                    className="flex items-center gap-1 text-[11px] text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                  >
                    {copiedKey === 'sha1' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'sha1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                  {signing.sha1Fingerprint}
                </div>
              </div>
            </div>

            {/* Credentials Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Key Alias
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {signing.alias}
                </span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Algorithm &amp; Key Length
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {signing.keyAlgorithm}
                </span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Common Name (CN) / Org
                </span>
                <span className="text-xs text-slate-800 dark:text-slate-200">
                  {signing.commonName} · {signing.organization}
                </span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Keystore File
                </span>
                <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
                  {signing.keystoreFileName}
                </span>
              </div>
            </div>

            {/* Actions: Download Keystore */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadKeystore}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-cyan-500 dark:text-slate-950 rounded-xl hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                <span>Download {signing.keystoreFileName}</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(gradlePropsSnippet, 'props')}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {copiedKey === 'props' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'props' ? 'Copied' : 'Copy CI gradle.properties'}</span>
              </button>
            </div>

          </div>

          {/* Generate New Key Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Generate New Signing Keystore
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Create an authentic, self-contained keypair with modern 2048/4096-bit RSA or P-256 Elliptic Curve cryptography right in your browser.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Key Alias
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Algorithm
                </label>
                <select
                  value={keyAlgorithm}
                  onChange={(e) => setKeyAlgorithm(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="RSA-2048">RSA 2048-bit (Standard Android compatibility)</option>
                  <option value="RSA-4096">RSA 4096-bit (High security enterprise)</option>
                  <option value="EC-256">ECDSA P-256 (Modern compact curve)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organization (O)
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Common Name (CN)
                </label>
                <input
                  type="text"
                  value={commonName}
                  onChange={(e) => setCommonName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateNewKey}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating Cryptographic Key…' : 'Generate & Sign New Key'}</span>
            </button>
          </div>

        </div>

        {/* Right Column: Signing Schemes & Play Store Notes */}
        <div className="space-y-6">
          
          {/* APK Signature Schemes */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Signature Schemes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Android supports multiple signature schemes simultaneously for maximum device compatibility.
            </p>

            <div className="space-y-3">
              {[
                {
                  id: 'v1Signing',
                  label: 'v1 Signing (JAR Signature)',
                  desc: 'Compatibility with Android 6.0 and earlier.',
                },
                {
                  id: 'v2Signing',
                  label: 'v2 Signing (APK Signature Scheme v2)',
                  desc: 'Whole-file hash verification introduced in Android 7.0.',
                },
                {
                  id: 'v3Signing',
                  label: 'v3 Signing (Key Rotation Scheme)',
                  desc: 'Supports key rotation on Android 9.0+.',
                },
                {
                  id: 'v4Signing',
                  label: 'v4 Signing (Streaming APK Install)',
                  desc: 'Generates .apk.idsig for ADB fast install in Android 11+.',
                },
              ].map((sch) => {
                const key = sch.id as keyof SigningConfig;
                const isChecked = !!signing[key];
                return (
                  <label
                    key={sch.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onUpdateSigning({ ...signing, [key]: e.target.checked })}
                      className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {sch.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {sch.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Google Play App Signing Guide */}
          <div className="bg-cyan-50/70 dark:bg-cyan-950/30 p-5 rounded-2xl border border-cyan-200 dark:border-cyan-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-900 dark:text-cyan-300 mb-2">
              <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Google Play App Signing (Recommended)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              When using Google Play App Signing, Google securely manages your master app signing key. You use this generated keystore as your <strong>Upload Key</strong>. If your upload key is ever lost, you can reset it via the Play Console.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
