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
} from 'lucide-react';

interface ExtensionPackageModalProps {
  onClose: () => void;
}

export const ExtensionPackageModal: React.FC<ExtensionPackageModalProps> = ({ onClose }) => {
  const [activeFile, setActiveFile] = useState<'manifest' | 'content' | 'popupHtml' | 'popupJs'>('manifest');
  const [copied, setCopied] = useState(false);

  const EXTENSION_FILES = {
    manifest: {
      name: 'manifest.json',
      content: `{
  "manifest_version": 3,
  "name": "FormSaathi AI — Universal Form Automation Companion",
  "version": "1.0.0",
  "description": "Intelligent form companion with profile vaults, multilingual explanations, voice assistance, and assisted autofill.",
  "permissions": ["activeTab", "storage", "scripting"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "FormSaathi AI"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content_script.js"],
      "run_at": "document_idle"
    }
  ]
}`,
    },
    content: {
      name: 'content_script.js',
      content: `// FormSaathi AI Content Script - Universal Form Field Detector & Injector
(function() {
  console.log("FormSaathi AI Universal Companion active on page");

  // Detect all inputs on current page
  function detectFormFields() {
    const inputs = document.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      if (input.dataset.formSaathiAttached) return;
      input.dataset.formSaathiAttached = "true";

      // Inject floating helper icon inside or beside input
      input.addEventListener("focus", () => {
        console.log("FormSaathi focused on field:", input.name || input.id);
      });
    });
  }

  detectFormFields();
  const observer = new MutationObserver(detectFormFields);
  observer.observe(document.body, { childList: true, subtree: true });

  // Listen for autofill messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "AUTOFILL_FORM") {
      const data = request.profileData;
      let filledCount = 0;

      document.querySelectorAll("input, select, textarea").forEach((field) => {
        const id = (field.id || "").toLowerCase();
        const name = (field.name || "").toLowerCase();
        const placeholder = (field.placeholder || "").toLowerCase();

        for (const [key, val] of Object.entries(data)) {
          const k = key.toLowerCase();
          if (id.includes(k) || name.includes(k) || placeholder.includes(k)) {
            field.value = val;
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("change", { bubbles: true }));
            field.style.backgroundColor = "#ECFDF5";
            field.style.borderColor = "#10B981";
            filledCount++;
            break;
          }
        }
      });

      sendResponse({ status: "success", filledCount });
    }
  });
})();`,
    },
    popupHtml: {
      name: 'popup.html',
      content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 340px; font-family: system-ui, sans-serif; margin: 0; padding: 16px; background: #F8FAFC; color: #0F172A; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .logo { font-weight: bold; font-size: 15px; color: #4338CA; }
    .btn { background: #4338CA; color: white; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; margin-top: 8px; }
    .btn:hover { background: #3730A3; }
    .profile-card { background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px; margin-bottom: 12px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">✨ FormSaathi AI</div>
    <span style="font-size: 11px; color: #10B981; font-weight: bold;">● Extension Active</span>
  </div>
  <div class="profile-card">
    <strong>Active Vault:</strong> <span id="profileName">Personal & Academic</span>
    <div style="color: #64748B; font-size: 11px; margin-top: 4px;">Universal form detector ready for this tab.</div>
  </div>
  <button id="autofillBtn" class="btn">⚡ Autofill Current Web Page</button>
  <script src="popup.js"></script>
</body>
</html>`,
    },
    popupJs: {
      name: 'popup.js',
      content: `document.getElementById("autofillBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;

  // Retrieve saved profile data
  chrome.storage.local.get(["formsaathi_profile"], (result) => {
    const profile = result.formsaathi_profile || {
      fullName: "Ananya Sharma",
      email: "ananya.sharma2026@gmail.com",
      phone: "9876543210",
      dateOfBirth: "2004-09-15"
    };

    chrome.tabs.sendMessage(tab.id, { action: "AUTOFILL_FORM", profileData: profile }, (response) => {
      if (response && response.status === "success") {
        alert("FormSaathi successfully filled " + response.filledCount + " fields on this web page!");
      }
    });
  });
});`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(EXTENSION_FILES[activeFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZipOrFiles = () => {
    // Generate text download of all extension files
    const blob = new Blob([EXTENSION_FILES[activeFile].content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = EXTENSION_FILES[activeFile].name;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Install FormSaathi as a Browser Extension
              </h3>
              <p className="text-[11px] text-slate-500">
                Works on Chrome, Edge, Brave, Arc, and Opera on any website
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg px-2 font-bold">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700">
          {/* 3 Step Install Guide */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
              <Chrome className="w-4 h-4 text-indigo-600" />
              <span>3-Step Quick Installation:</span>
            </h4>
            <ol className="list-decimal pl-5 space-y-1 text-[11px] text-indigo-900 leading-relaxed font-medium">
              <li>Save the extension files into a folder named <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono">formsaathi-extension</code>.</li>
              <li>Open Chrome / Edge and navigate to <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono">chrome://extensions</code>.</li>
              <li>Turn on <strong>"Developer mode"</strong> in the top right, then click <strong>"Load unpacked"</strong> and select your folder!</li>
            </ol>
          </div>

          {/* File Viewer Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Extension Files:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy File Content'}</span>
                </button>
                <button
                  onClick={handleDownloadZipOrFiles}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {EXTENSION_FILES[activeFile].name}</span>
                </button>
              </div>
            </div>

            <div className="flex gap-1.5 border-b border-slate-200 pb-1">
              {(Object.keys(EXTENSION_FILES) as Array<keyof typeof EXTENSION_FILES>).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveFile(key)}
                  className={`px-3 py-1 rounded-t text-xs font-mono font-medium transition-colors ${
                    activeFile === key
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {EXTENSION_FILES[key].name}
                </button>
              ))}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-200 p-3.5 font-mono text-[11px] max-h-56 overflow-y-auto leading-relaxed">
              <pre className="whitespace-pre-wrap">{EXTENSION_FILES[activeFile].content}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Universal Manifest V3 Extension Ready
          </span>
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
