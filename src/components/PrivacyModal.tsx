import React from 'react';
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
} from 'lucide-react';
import { UserProfile } from '../types';

interface PrivacyModalProps {
  profiles: UserProfile[];
  onClose: () => void;
  onClearAllData: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  profiles,
  onClose,
  onClearAllData,
}) => {
  const handleExportAll = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            app: 'FormSaathi AI Vault',
            profiles,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `formsaathi_complete_vault_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                FormSaathi Privacy & User Control Architecture
              </h3>
              <p className="text-[11px] text-slate-500">
                Local-first privacy and zero-tracking design
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg px-2 font-bold">
            ×
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Zero-Cloud Storage Guarantee</span>
            </div>
            <p className="text-[11px] text-emerald-900 leading-relaxed">
              All your reusable profile vaults (personal, academic, job, family) are stored <strong>strictly on your local device (browser storage)</strong>. We do not store your certificates or identity proofs on external databases.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Core Privacy Safeguards
            </h4>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">User Consent on Every Extraction:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    FormSaathi never silently records form data. After scanning a form or slip, you are always presented with an explicit consent checklist to approve or discard details.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">No Autonomous Form Submissions:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    FormSaathi AI assists with matching and explanations, but will <strong>never</strong> submit a government or university form on your behalf. You always review values and click submit yourself.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white">
                <Server className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Backend Secured AI Processing:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    AI processing requests are securely mediated via backend endpoints. Client-side code never exposes credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User Data Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Your Data Management Controls
            </h4>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleExportAll}
                className="flex-1 py-2 px-3 border border-slate-300 rounded-lg text-slate-800 font-semibold hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export All Vaults (JSON)</span>
              </button>

              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to permanently erase all locally stored profile vaults? This cannot be undone.'
                    )
                  ) {
                    onClearAllData();
                    onClose();
                  }
                }}
                className="py-2 px-3 border border-rose-200 bg-rose-50 rounded-lg text-rose-700 font-semibold hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Wipe All Local Data</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
