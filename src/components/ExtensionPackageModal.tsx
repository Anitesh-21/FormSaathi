import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Code,
  FolderArchive,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Chrome,
  FileCode,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import JSZip from 'jszip';

import manifestRaw from '../../formsaathi-extension/manifest.json?raw';
import contentCssRaw from '../../formsaathi-extension/content_style.css?raw';
import contentJsRaw from '../../formsaathi-extension/content_script.js?raw';
import popupHtmlRaw from '../../formsaathi-extension/popup.html?raw';
import popupJsRaw from '../../formsaathi-extension/popup.js?raw';
import readmeRaw from '../../formsaathi-extension/README.md?raw';

interface ExtensionPackageModalProps {
  onClose: () => void;
}

export const ExtensionPackageModal: React.FC<ExtensionPackageModalProps> = ({ onClose }) => {
  const [activeFile, setActiveFile] = useState<
    'manifest' | 'contentJs' | 'contentCss' | 'popupHtml' | 'popupJs' | 'readme'
  >('manifest');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const EXTENSION_FILES = {
    manifest: {
      name: 'manifest.json',
      title: 'Manifest V3 Configuration',
      content: manifestRaw,
    },
    contentCss: {
      name: 'content_style.css',
      title: 'In-Page Injected Styles',
      content: contentCssRaw,
    },
    contentJs: {
      name: 'content_script.js',
      title: 'Universal In-Page Form Engine',
      content: contentJsRaw,
    },
    popupHtml: {
      name: 'popup.html',
      title: 'Universal Extension Popup UI',
      content: popupHtmlRaw,
    },
    popupJs: {
      name: 'popup.js',
      title: 'Universal Extension Logic Engine',
      content: popupJsRaw,
    },
    readme: {
      name: 'README.md',
      title: 'Installation Instructions',
      content: readmeRaw,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(EXTENSION_FILES[activeFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1-Click Download Entire Chrome Extension as .ZIP
  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('formsaathi-extension') || zip;

      folder.file('manifest.json', EXTENSION_FILES.manifest.content);
      folder.file('content_script.js', EXTENSION_FILES.contentJs.content);
      folder.file('content_style.css', EXTENSION_FILES.contentCss.content);
      folder.file('popup.html', EXTENSION_FILES.popupHtml.content);
      folder.file('popup.js', EXTENSION_FILES.popupJs.content);
      folder.file('README.md', EXTENSION_FILES.readme.content);

      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'formsaathi-chrome-extension.zip';
      a.click();
    } catch (err) {
      console.error('Failed to create extension zip:', err);
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Full-Featured FormSaathi AI Browser Extension Package
              </h3>
              <p className="text-[11px] text-indigo-200">
                Complete Manifest V3 code containing ALL page features for Chrome, Edge, and Brave
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl px-2 font-bold">
            ×
          </button>
        </div>

        {/* Action Callout Bar */}
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50 border-b border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full Browser Extension with Master Power Toggle & Structured Auto-Learn:</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Master ON/OFF Switch • Structured Field Auto-Learn (Personal, Contact, Academic, ID, Financial, Work) • Live Vault Update • Universal Autofill • Voice Guidance • Compressor & Converter
            </p>
          </div>

          <button
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Creating ZIP...' : 'Download Complete Extension (.zip)'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700">
          {/* Quick Installation Steps */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Chrome className="w-4 h-4 text-indigo-600" />
              <span>How to Load Unpacked in Chrome in 30 Seconds:</span>
            </h4>
            <ol className="list-decimal pl-5 space-y-1 text-[11px] text-slate-700 font-medium">
              <li>Click <strong>"Download Complete Extension (.zip)"</strong> above and unzip it to a folder.</li>
              <li>Open Chrome and enter <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-indigo-600">chrome://extensions</code> in the address bar.</li>
              <li>Toggle <strong>Developer mode</strong> ON in the top-right corner.</li>
              <li>Click <strong>"Load unpacked"</strong> and select the unzipped <code className="font-mono">formsaathi-extension</code> folder!</li>
            </ol>
          </div>

          {/* File Inspector Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Inspect Source Code ({EXTENSION_FILES[activeFile].name}):
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            <div className="flex gap-1.5 border-b border-slate-200 pb-1 overflow-x-auto scrollbar-none">
              {(Object.keys(EXTENSION_FILES) as Array<keyof typeof EXTENSION_FILES>).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveFile(key)}
                  className={`px-3 py-1.5 rounded-t-lg text-xs font-mono font-medium transition-colors whitespace-nowrap ${
                    activeFile === key
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {EXTENSION_FILES[key].name}
                </button>
              ))}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-200 p-4 font-mono text-[11px] max-h-72 overflow-y-auto leading-relaxed shadow-inner">
              <pre className="whitespace-pre-wrap">{EXTENSION_FILES[activeFile].content}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Manifest V3 • Self-contained & ready for Chrome Web Store / Unpacked loading
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
