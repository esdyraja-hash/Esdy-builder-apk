import React, { useState } from 'react';
import { ProjectSettings } from '../types';
import { PlayStoreAuditor } from '../services/playStoreAuditor';
import { 
  Store, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';

interface PlayStoreTabProps {
  settings: ProjectSettings;
}

export const PlayStoreTab: React.FC<PlayStoreTabProps> = ({ settings }) => {
  const [title, setTitle] = useState(settings.appName);
  const [shortDesc, setShortDesc] = useState('High performance native Android application with automated CI/CD pipeline.');
  const [fullDesc, setFullDesc] = useState(
    `${settings.appName} is a modern, responsive Android application designed for streamlined productivity and security. Built with modern Kotlin and Gradle multi-module architecture.`
  );
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('https://esdy.app/privacy-policy');
  const [accountDeletionUrl, setAccountDeletionUrl] = useState('https://esdy.app/delete-account');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Reviewer credentials
  const [demoUser, setDemoUser] = useState('google.reviewer@test.com');
  const [demoPassword, setDemoPassword] = useState('PlayReviewer@2025!');
  const [reviewerNotes, setReviewerNotes] = useState('Use the provided demo account to access all feature modules without SMS verification.');

  // Run automated policy audit
  const auditResult = PlayStoreAuditor.runAudit(settings, {
    title,
    shortDescription: shortDesc,
    fullDescription: fullDesc,
    privacyPolicyUrl,
    accountDeletionUrl,
    contactEmail: 'esdyraja@gmail.com',
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
          <Store className="w-4 h-4" />
          <span>Google Play Submission Compliance &amp; Policy Auditor</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          Google Play Store Readiness Suite
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Ensure 100% compliance with Google Play Store Developer Program Policies. Includes automated Target SDK 35 verification, 16 KB memory page size audit, Data Safety declarations, and reviewer test credentials.
        </p>
      </div>

      {/* Audit Scorecard Strip */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl ${
            auditResult.scorePercent >= 80
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}>
            {auditResult.scorePercent}%
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Submission Readiness Score
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {auditResult.scorePercent >= 80
                ? 'Your project satisfies core Google Play technical and policy guidelines.'
                : 'Action items required before publishing to Google Play Store production track.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            {auditResult.items.filter(i => i.status === 'passed').length} Passed · {auditResult.items.filter(i => i.status === 'warning').length} Warnings · {auditResult.items.filter(i => i.status === 'failed').length} Failed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Policy Audit Checklist & Data Safety */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Policy Checklist */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>Automated Policy &amp; Architecture Checks</span>
            </h3>

            <div className="space-y-3">
              {auditResult.items.map((item) => {
                let badgeClass = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
                let Icon = CheckCircle2;

                if (item.status === 'warning') {
                  badgeClass = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
                  Icon = AlertTriangle;
                } else if (item.status === 'failed') {
                  badgeClass = 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
                  Icon = XCircle;
                } else if (item.status === 'info') {
                  badgeClass = 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
                  Icon = Info;
                }

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${badgeClass}`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 ml-6 mb-1.5 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="ml-6 text-[11px] text-cyan-700 dark:text-cyan-400 font-medium">
                      👉 {item.recommendation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Store Listing Content */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>Store Listing Metadata &amp; Content Guidelines</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Google Play strictly enforces character limits and bans promotional jargon in app titles.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>App Title (Max 30 chars)</span>
                  <span className={`font-mono ${title.length > 30 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                    {title.length}/30
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={40}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Short Description (Max 80 chars)</span>
                  <span className={`font-mono ${shortDesc.length > 80 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                    {shortDesc.length}/80
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Full Description (Max 4000 chars)</span>
                  <span className="font-mono text-slate-500">
                    {fullDesc.length}/4000
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={fullDesc}
                  onChange={(e) => setFullDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Reviewer Credentials & Data Safety */}
        <div className="space-y-6">
          
          {/* Reviewer Test Credentials Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Reviewer Test Credentials
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Google Play reviewers require credentials to test apps with sign-in features. If missing, review rejection is common.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Demo Username / Email
                </label>
                <input
                  type="text"
                  value={demoUser}
                  onChange={(e) => setDemoUser(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Demo Password
                </label>
                <input
                  type="text"
                  value={demoPassword}
                  onChange={(e) => setDemoPassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reviewer Access Instructions
                </label>
                <textarea
                  rows={2}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(`Demo Account:\nUser: ${demoUser}\nPass: ${demoPassword}\nNotes: ${reviewerNotes}`, 'creds')}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              {copiedKey === 'creds' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'creds' ? 'Copied' : 'Copy Reviewer Instructions'}</span>
            </button>
          </div>

          {/* Privacy & Account Deletion URLs */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Mandatory Public Web URLs
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  HTTPS Privacy Policy URL
                </label>
                <input
                  type="url"
                  value={privacyPolicyUrl}
                  onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Deletion Web Portal URL
                </label>
                <input
                  type="url"
                  value={accountDeletionUrl}
                  onChange={(e) => setAccountDeletionUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
