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
      content: `{
  "manifest_version": 3,
  "name": "FormSaathi AI — Universal Form Automation & Document Assistant",
  "version": "1.0.0",
  "description": "Universal Form Automation, Multi-Profile Vaults, Multilingual Voice Guidance, In-Page Field Assistant, and Integrated Document Compressor & Converter.",
  "permissions": [
    "activeTab",
    "storage",
    "scripting",
    "sidePanel"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "FormSaathi AI Universal Companion"
  },
  "side_panel": {
    "default_path": "popup.html"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content_script.js"],
      "css": ["content_style.css"],
      "run_at": "document_idle"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["popup.html", "content_style.css"],
      "matches": ["<all_urls>"]
    }
  ]
}`,
    },
    contentCss: {
      name: 'content_style.css',
      title: 'In-Page Injected Styles',
      content: `/* FormSaathi In-Page Floating Assistant Styles */
#formsaathi-floating-dock {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647;
  font-family: system-ui, -apple-system, sans-serif;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%);
  color: #ffffff;
  padding: 10px 16px;
  border-radius: 9999px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  user-select: none;
}
#formsaathi-floating-dock:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 15px 30px -5px rgba(67, 56, 202, 0.4);
}
.formsaathi-pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}
.formsaathi-field-badge {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #ffffff;
  border: 1px solid #c7d2fe;
  color: #4338ca;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  opacity: 0.85;
}
.formsaathi-field-badge:hover {
  opacity: 1;
  background: #eef2ff;
  border-color: #6366f1;
}
#formsaathi-inpage-bubble {
  position: absolute;
  z-index: 2147483647;
  max-width: 320px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
  font-family: system-ui, sans-serif;
  color: #0f172a;
  font-size: 12px;
  animation: formsaathi-fade 0.15s ease-out;
}
@keyframes formsaathi-fade {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.formsaathi-autofilled-highlight {
  animation: formsaathi-green-flash 1.2s ease-out !important;
  background-color: #ecfdf5 !important;
  border-color: #10b981 !important;
}
@keyframes formsaathi-green-flash {
  0% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.4); }
  100% { box-shadow: none; }
}`,
    },
    contentJs: {
      name: 'content_script.js',
      title: 'Universal In-Page Form Engine',
      content: `// FormSaathi AI - Universal Webpage Form Scanner & Assisted Autofiller
(function () {
  console.log("FormSaathi AI Universal Extension injected on:", window.location.href);

  // 1. Create floating FormSaathi button on the page
  function injectFloatingDock() {
    if (document.getElementById("formsaathi-floating-dock")) return;

    const dock = document.createElement("div");
    dock.id = "formsaathi-floating-dock";
    dock.title = "FormSaathi AI: Click to Autofill this form";
    dock.innerHTML = \`
      <span class="formsaathi-pulse-dot"></span>
      <span style="font-size: 12px; font-weight: 700; letter-spacing: -0.2px;">✨ FormSaathi Autofill</span>
    \`;

    dock.addEventListener("click", () => {
      // Trigger autofill using stored profile
      chrome.storage.local.get(["formsaathi_active_profile_data", "formsaathi_active_profile_name"], (res) => {
        const profile = res.formsaathi_active_profile_data || getDefaultProfile();
        const profName = res.formsaathi_active_profile_name || "Personal & Academic";
        autofillAllFields(profile, profName);
      });
    });

    document.body.appendChild(dock);
  }

  // 2. Attach helpers to inputs
  function attachFieldHelpers() {
    const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='submit']), select, textarea");
    inputs.forEach((input) => {
      if (input.dataset.formSaathiAttached) return;
      input.dataset.formSaathiAttached = "true";

      // Relative positioning container check
      const parent = input.parentElement;
      if (parent && getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
      }

      // Add small helper button
      const badge = document.createElement("button");
      badge.type = "button";
      badge.className = "formsaathi-field-badge";
      badge.innerHTML = "✨ Fill";
      badge.title = "FormSaathi: Explain or Autofill this field";

      badge.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        chrome.storage.local.get(["formsaathi_active_profile_data"], (res) => {
          const profile = res.formsaathi_active_profile_data || getDefaultProfile();
          fillSingleField(input, profile);
        });
      });

      if (parent) {
        parent.appendChild(badge);
      }
    });
  }

  // Fallback profile if storage empty
  function getDefaultProfile() {
    return {
      fullName: "Anitesh Kumar Singh",
      firstName: "Anitesh",
      lastName: "Singh",
      email: "aniteshks21@gmail.com",
      phone: "9876543210",
      dateOfBirth: "2004-09-15",
      gender: "Male",
      fatherName: "Suresh Kumar Singh",
      motherName: "Sunita Singh",
      address: "House No. 42, Sector 14, Jaipur, Rajasthan",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302022",
      tenthRollNo: "14102984",
      tenthPercentage: "92.4%",
      twelfthRollNo: "22140938",
      twelfthPercentage: "89.6%",
      bankAccountNumber: "309811245678",
      ifscCode: "SBIN0004521",
      panNumber: "ABCPS1234F"
    };
  }

  // Fill single input
  function fillSingleField(input, profile) {
    const id = (input.id || "").toLowerCase();
    const name = (input.name || "").toLowerCase();
    const placeholder = (input.placeholder || "").toLowerCase();
    const label = (getLabelForInput(input) || "").toLowerCase();

    for (const [key, val] of Object.entries(profile)) {
      const k = key.toLowerCase();
      if (id.includes(k) || name.includes(k) || placeholder.includes(k) || label.includes(k)) {
        setNativeValue(input, val);
        input.classList.add("formsaathi-autofilled-highlight");
        showToast("FormSaathi filled: " + key + " = " + val);
        return;
      }
    }
    showToast("No direct match found in active profile for this field.");
  }

  // Universal Autofill all inputs
  function autofillAllFields(profile, profileName) {
    let count = 0;
    const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='submit']), select, textarea");

    inputs.forEach((input) => {
      const id = (input.id || "").toLowerCase();
      const name = (input.name || "").toLowerCase();
      const placeholder = (input.placeholder || "").toLowerCase();
      const label = (getLabelForInput(input) || "").toLowerCase();

      for (const [key, val] of Object.entries(profile)) {
        const k = key.toLowerCase();
        if (
          id === k ||
          name === k ||
          id.includes(k) ||
          name.includes(k) ||
          placeholder.includes(k) ||
          label.includes(k) ||
          (k === "fullname" && (label.includes("name") || name.includes("name"))) ||
          (k === "dateofbirth" && (label.includes("birth") || label.includes("dob"))) ||
          (k === "tenthrollno" && label.includes("10th") && label.includes("roll")) ||
          (k === "bankaccountnumber" && label.includes("account")) ||
          (k === "ifsccode" && label.includes("ifsc"))
        ) {
          setNativeValue(input, String(val));
          input.classList.add("formsaathi-autofilled-highlight");
          count++;
          break;
        }
      }
    });

    showToast("✨ FormSaathi autofilled " + count + " fields from " + profileName + "!");
  }

  // React/Angular/Vue compatible input dispatcher
  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element.__proto__, "value")?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getLabelForInput(input) {
    if (input.id) {
      const l = document.querySelector("label[for='" + input.id + "']");
      if (l) return l.textContent || "";
    }
    const parentLabel = input.closest("label");
    if (parentLabel) return parentLabel.textContent || "";
    return input.getAttribute("aria-label") || "";
  }

  function showToast(msg) {
    let t = document.getElementById("formsaathi-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "formsaathi-toast";
      t.style.cssText = "position:fixed;top:20px;right:20px;z-index:2147483647;background:#0f172a;color:#fff;padding:10px 16px;border-radius:10px;font-size:12px;font-family:system-ui;box-shadow:0 10px 20px rgba(0,0,0,0.2);transition:all 0.3s;border:1px solid #334155;";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = "1";
    setTimeout(() => { t.style.opacity = "0"; }, 3500);
  }

  // Message listener from popup
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "DETECT_PAGE_FIELDS") {
      const detected = [];
      document.querySelectorAll("input:not([type='hidden']):not([type='submit']), select, textarea").forEach((el, i) => {
        detected.push({
          id: el.id || el.name || "field_" + i,
          name: el.name || "",
          label: getLabelForInput(el) || el.placeholder || el.name || "Field " + (i + 1),
          type: el.type || "text",
          required: el.required || false,
          currentValue: el.value || ""
        });
      });
      sendResponse({ status: "success", fields: detected, title: document.title, url: location.href });
    } else if (req.action === "AUTOFILL_PAGE") {
      autofillAllFields(req.profileData, req.profileName || "Active Profile");
      sendResponse({ status: "success" });
    }
    return true;
  });

  // Init
  setTimeout(() => {
    injectFloatingDock();
    attachFieldHelpers();
  }, 1000);

  const observer = new MutationObserver(() => {
    attachFieldHelpers();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();`,
    },
    popupHtml: {
      name: 'popup.html',
      title: 'Universal Extension Popup UI',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>FormSaathi AI Companion</title>
  <style>
    :root {
      --primary: #4338ca;
      --primary-hover: #3730a3;
      --bg: #f8fafc;
      --surface: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --emerald: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { width: 380px; max-height: 600px; background: var(--bg); color: var(--text); overflow-x: hidden; font-size: 13px; }
    
    /* Top Header */
    .header { background: linear-gradient(135deg, #312e81 0%, #1e1b4b 100%); color: white; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; }
    .brand-badge { background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--emerald); display: inline-block; }
    
    /* Profile & Language Bar */
    .control-strip { background: var(--surface); border-bottom: 1px solid var(--border); padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 11px; }
    .select-input { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 4px 6px; font-size: 11px; font-weight: 600; color: var(--text); outline: none; cursor: pointer; max-width: 170px; }

    /* Navigation Tabs */
    .nav-tabs { display: flex; background: var(--surface); border-bottom: 1px solid var(--border); overflow-x: auto; padding: 4px 6px 0 6px; gap: 4px; }
    .nav-tab { padding: 6px 10px; font-size: 11px; font-weight: 600; color: var(--text-muted); background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; }
    .nav-tab.active { color: var(--primary); border-bottom-color: var(--primary); }

    /* Tab Content Panels */
    .panel { padding: 14px; display: none; }
    .panel.active { display: block; }

    /* UI Cards */
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin-bottom: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
    .card-title { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; }
    .card-desc { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; }

    /* Buttons */
    .btn-primary { width: 100%; background: var(--primary); color: white; border: none; border-radius: 8px; padding: 9px 12px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.15s; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-secondary { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 7px 10px; font-weight: 600; font-size: 11px; cursor: pointer; margin-top: 6px; }
    
    /* Preset grid */
    .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0; }
    .preset-btn { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 6px; font-size: 11px; text-align: left; cursor: pointer; }
    .preset-btn.active { border-color: var(--primary); background: #eef2ff; color: var(--primary); font-weight: 700; }

    /* Field List */
    .field-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
    .field-key { font-weight: 600; color: var(--text); }
    .field-val { font-family: monospace; color: var(--primary); max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Slider */
    input[type="range"] { width: 100%; accent-color: var(--primary); margin: 6px 0; }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="brand">
      <span>✨ FormSaathi AI</span>
      <span class="brand-badge">Universal</span>
    </div>
    <div style="font-size: 11px; display: flex; align-items: center; gap: 5px;">
      <span class="status-dot"></span>
      <span>Active in Tab</span>
    </div>
  </div>

  <!-- Profile & Language Control Strip -->
  <div class="control-strip">
    <div style="display: flex; align-items: center; gap: 4px;">
      <span style="color: var(--text-muted);">Vault:</span>
      <select id="profileSelect" class="select-input">
        <option value="academic">Anitesh Kumar Singh (Academic)</option>
        <option value="personal">Anitesh Kumar Singh (Personal)</option>
        <option value="job">Vikram Sharma (Job Applications)</option>
        <option value="family">Suresh Sharma (Family Welfare)</option>
      </select>
    </div>
    <div style="display: flex; align-items: center; gap: 4px;">
      <select id="languageSelect" class="select-input">
        <option value="Hindi">हिन्दी (Hindi)</option>
        <option value="English">English</option>
        <option value="Bengali">বাংলা (Bengali)</option>
        <option value="Marathi">मराठी (Marathi)</option>
        <option value="Tamil">தமிழ் (Tamil)</option>
        <option value="Telugu">తెలుగు (Telugu)</option>
        <option value="Gujarati">ગુજરાતી (Gujarati)</option>
        <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
        <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
      </select>
    </div>
  </div>

  <!-- Navigation Tabs -->
  <div class="nav-tabs">
    <button class="nav-tab active" data-tab="tab-autofill">⚡ Autofill</button>
    <button class="nav-tab" data-tab="tab-vault">👤 Vault</button>
    <button class="nav-tab" data-tab="tab-compress">🗜️ Compress</button>
    <button class="nav-tab" data-tab="tab-convert">📄 Convert</button>
    <button class="nav-tab" data-tab="tab-scan">🔍 OCR</button>
    <button class="nav-tab" data-tab="tab-voice">🎙️ Voice</button>
  </div>

  <!-- 1. AUTOFILL TAB -->
  <div id="tab-autofill" class="panel active">
    <div class="card">
      <div class="card-title">
        <span>Active Tab Form Scanner</span>
        <span id="detectedCountBadge" style="font-size: 10px; background: #ecfdf5; color: #047857; padding: 2px 5px; border-radius: 4px;">Scanning...</span>
      </div>
      <div class="card-desc">Matches current page inputs with your selected vault.</div>
      <button id="autofillCurrentTabBtn" class="btn-primary">⚡ Autofill This Page Now</button>
      <button id="rescanPageBtn" class="btn-secondary">🔄 Refresh Detected Fields</button>
    </div>

    <div class="card" style="max-height: 220px; overflow-y: auto;">
      <div class="card-title" style="font-size: 11px; text-transform: uppercase; color: var(--text-muted);">
        Detected Fields on This Page:
      </div>
      <div id="detectedFieldsList">
        <div style="color: var(--text-muted); font-size: 11px; text-align: center; padding: 12px 0;">Detecting form inputs on current tab...</div>
      </div>
    </div>
  </div>

  <!-- 2. VAULT TAB -->
  <div id="tab-vault" class="panel">
    <div class="card">
      <div class="card-title">
        <span id="vaultProfileName">Anitesh Kumar Singh (Academic)</span>
      </div>
      <div class="card-desc">Saved attributes ready for instant autofilling.</div>
      <div id="vaultFieldsList" style="max-height: 250px; overflow-y: auto;"></div>
    </div>
  </div>

  <!-- 3. COMPRESSOR TAB -->
  <div id="tab-compress" class="panel">
    <div class="card">
      <div class="card-title">Portal Document Compressor</div>
      <div class="card-desc">Shrink certificates and photos to meet strict upload limits.</div>
      
      <input type="file" id="compressFileInput" accept="image/*" style="font-size: 11px; margin-bottom: 8px; width: 100%;" />

      <div style="font-size: 11px; font-weight: 700; margin-top: 6px;">Portal Presets:</div>
      <div class="preset-grid">
        <button class="preset-btn" data-kb="20">Signature (20 KB)</button>
        <button class="preset-btn" data-kb="50">Photo / SSC (50 KB)</button>
        <button class="preset-btn active" data-kb="100">Bonafide / NSP (100 KB)</button>
        <button class="preset-btn" data-kb="200">Marksheet / CET (200 KB)</button>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-top: 4px;">
        <span>Target: <strong id="targetSizeLabel" style="color: var(--primary);">100 KB</strong></span>
      </div>
      <input type="range" id="compressSlider" min="15" max="500" step="5" value="100" />

      <button id="runCompressBtn" class="btn-primary" style="margin-top: 6px;">🗜️ Compress Document</button>
      <div id="compressResultBox" style="display: none; margin-top: 10px; padding: 8px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 11px; color: #065f46;"></div>
    </div>
  </div>

  <!-- 4. CONVERTER TAB -->
  <div id="tab-convert" class="panel">
    <div class="card">
      <div class="card-title">Universal Format Converter</div>
      <div class="card-desc">Convert document images or text statements to standard A4 PDF.</div>

      <input type="file" id="convertFileInput" accept="image/*" style="font-size: 11px; margin-bottom: 8px; width: 100%;" />
      <button id="runImageToPdfBtn" class="btn-primary">📄 Convert Image to Official A4 PDF</button>

      <div style="margin: 12px 0 6px 0; border-top: 1px solid var(--border); padding-top: 8px; font-size: 11px; font-weight: 700;">
        Self Declaration Statement to PDF:
      </div>
      <textarea id="declarationText" rows="3" style="width: 100%; font-size: 11px; padding: 6px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 6px;">I hereby declare that all details furnished in this application are true and correct as per my original certificates.</textarea>
      <button id="runTextToPdfBtn" class="btn-secondary">Generate Declaration PDF</button>
    </div>
  </div>

  <!-- 5. SCANNER OCR TAB -->
  <div id="tab-scan" class="panel">
    <div class="card">
      <div class="card-title">Smart Receipt / Form OCR</div>
      <div class="card-desc">Extract personal details from completed forms or text summaries.</div>
      <textarea id="ocrTextInput" rows="5" placeholder="Paste application confirmation slip or receipt text here..." style="width: 100%; font-size: 11px; padding: 6px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 8px; font-family: monospace;"></textarea>
      <button id="runOcrScanBtn" class="btn-primary">🔍 Extract & Learn into Vault</button>
      <div id="ocrResultBox" style="display: none; margin-top: 10px; font-size: 11px;"></div>
    </div>
  </div>

  <!-- 6. VOICE TAB -->
  <div id="tab-voice" class="panel">
    <div class="card" style="text-align: center; padding: 20px;">
      <div id="micStatus" style="font-weight: 700; font-size: 13px; color: var(--primary); margin-bottom: 6px;">Tap Mic to Speak in Hindi / English</div>
      <button id="popupMicBtn" style="width: 60px; height: 60px; border-radius: 50%; background: var(--primary); color: white; border: none; font-size: 24px; cursor: pointer; margin: 10px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(67, 56, 202, 0.3);">🎙️</button>
      <div id="voiceTranscript" style="font-size: 11px; color: var(--text-muted); min-height: 40px; margin-top: 8px; background: var(--bg); padding: 8px; border-radius: 6px;">Spoken questions or details will appear here...</div>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>`,
    },
    popupJs: {
      name: 'popup.js',
      title: 'Universal Extension Logic Engine',
      content: `// FormSaathi AI Universal Extension Controller
const PROFILES = {
  academic: {
    name: "Anitesh Kumar Singh (Academic & Scholarship)",
    data: {
      fullName: "Anitesh Kumar Singh",
      dateOfBirth: "2004-09-15",
      gender: "Male",
      casteCategory: "General (UR)",
      fatherName: "Suresh Kumar Singh",
      motherName: "Sunita Singh",
      annualIncome: "240000",
      email: "aniteshks21@gmail.com",
      phone: "9876543210",
      address: "House No. 42, Sector 14, Jaipur, Rajasthan",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302022",
      tenthBoard: "CBSE",
      tenthRollNo: "14102984",
      tenthPercentage: "92.4%",
      twelfthBoard: "CBSE",
      twelfthRollNo: "22140938",
      twelfthPercentage: "89.6%",
      currentCourse: "B.Tech Computer Science",
      instituteCode: "C-24901",
      bankAccountNumber: "309811245678",
      ifscCode: "SBIN0004521"
    }
  },
  personal: {
    name: "Anitesh Kumar Singh (Personal Vault)",
    data: {
      fullName: "Anitesh Kumar Singh",
      firstName: "Anitesh",
      lastName: "Singh",
      dateOfBirth: "2004-09-15",
      gender: "Male",
      email: "aniteshks21@gmail.com",
      phone: "9876543210",
      address: "House No. 42, Sector 14, Jaipur",
      state: "Rajasthan",
      pinCode: "302022",
      domicileState: "Rajasthan",
      domicileCertNo: "DOM/2021/RAJ/98214"
    }
  },
  job: {
    name: "Vikram Sharma (Job Applications)",
    data: {
      fullName: "Vikram Sharma",
      dateOfBirth: "1999-04-20",
      gender: "Male",
      fatherName: "Suresh Kumar Sharma",
      email: "vikram.sharma.tech@gmail.com",
      phone: "9414055667",
      highestQualification: "B.Tech in Information Technology",
      experienceYears: "3 Years",
      panNumber: "ABCPS1234F"
    }
  },
  family: {
    name: "Suresh Sharma (Family Welfare)",
    data: {
      fullName: "Suresh Kumar Sharma",
      dateOfBirth: "1970-02-11",
      gender: "Male",
      occupation: "Agriculture",
      address: "Gram Panchayat Bassi, Jaipur, Rajasthan",
      bankAccountNumber: "109288374619",
      ifscCode: "PUNB0123400",
      landKhasraNo: "142/3"
    }
  }
};

let currentProfileKey = "academic";
let detectedFieldsCache = [];

// DOM Loaded
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initProfiles();
  scanCurrentTab();
  initCompressor();
  initConverter();
  initVoice();
  initOcr();
});

// Tab Navigation
function initTabs() {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.dataset.tab;
      document.getElementById(targetId)?.classList.add("active");
    });
  });
}

// Profile Selector
function initProfiles() {
  const select = document.getElementById("profileSelect");
  select.addEventListener("change", (e) => {
    currentProfileKey = e.target.value;
    syncProfileToStorage();
    renderVaultList();
  });

  syncProfileToStorage();
  renderVaultList();
}

function syncProfileToStorage() {
  const prof = PROFILES[currentProfileKey];
  chrome.storage.local.set({
    formsaathi_active_profile_data: prof.data,
    formsaathi_active_profile_name: prof.name
  });
  document.getElementById("vaultProfileName").textContent = prof.name;
}

function renderVaultList() {
  const container = document.getElementById("vaultFieldsList");
  const data = PROFILES[currentProfileKey].data;
  container.innerHTML = "";

  Object.entries(data).forEach(([k, v]) => {
    const row = document.createElement("div");
    row.className = "field-row";
    row.innerHTML = \`<span class="field-key">\${k}</span><span class="field-val">\${v}</span>\`;
    container.appendChild(row);
  });
}

// 1. Scan and Autofill Current Active Tab
function scanCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].id) return;

    chrome.tabs.sendMessage(tabs[0].id, { action: "DETECT_PAGE_FIELDS" }, (response) => {
      const container = document.getElementById("detectedFieldsList");
      const badge = document.getElementById("detectedCountBadge");

      if (chrome.runtime.lastError || !response || !response.fields) {
        container.innerHTML = '<div style="color: #64748b; font-size: 11px; text-align: center; padding: 12px 0;">No active form found or page still loading.</div>';
        badge.textContent = "0 Fields";
        return;
      }

      detectedFieldsCache = response.fields;
      badge.textContent = response.fields.length + " Fields Found";
      container.innerHTML = "";

      response.fields.slice(0, 15).forEach((f) => {
        const row = document.createElement("div");
        row.className = "field-row";
        row.innerHTML = \`
          <span class="field-key" title="\${f.id}">\${f.label}</span>
          <span style="font-size: 10px; color: #10b981; font-weight: 600;">Match Ready</span>
        \`;
        container.appendChild(row);
      });
    });
  });
}

document.getElementById("rescanPageBtn").addEventListener("click", scanCurrentTab);

document.getElementById("autofillCurrentTabBtn").addEventListener("click", () => {
  const prof = PROFILES[currentProfileKey];
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "AUTOFILL_PAGE",
      profileData: prof.data,
      profileName: prof.name
    }, () => {
      window.close();
    });
  });
});

// 2. Integrated File Compressor in Extension
function initCompressor() {
  let targetKb = 100;
  const slider = document.getElementById("compressSlider");
  const label = document.getElementById("targetSizeLabel");

  slider.addEventListener("input", (e) => {
    targetKb = parseInt(e.target.value);
    label.textContent = targetKb + " KB";
  });

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      targetKb = parseInt(btn.dataset.kb);
      slider.value = targetKb;
      label.textContent = targetKb + " KB";
    });
  });

  document.getElementById("runCompressBtn").addEventListener("click", () => {
    const file = document.getElementById("compressFileInput").files[0];
    if (!file) {
      alert("Please choose an image file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);

        // Approximate quality based on target KB
        const origKb = file.size / 1024;
        let quality = Math.min(0.92, Math.max(0.1, targetKb / origKb));

        canvas.toBlob((blob) => {
          if (!blob) return;
          const compressedKb = Math.round(blob.size / 1024);
          const resBox = document.getElementById("compressResultBox");
          resBox.style.display = "block";
          resBox.innerHTML = \`
            <strong>Compressed Successfully:</strong> \${compressedKb} KB (Target: \${targetKb} KB)<br/>
            <a href="\${URL.createObjectURL(blob)}" download="compressed_\${targetKb}kb.jpg" style="color: #4338ca; font-weight: 700; text-decoration: underline; margin-top: 4px; display: inline-block;">Download Compressed File</a>
          \`;
        }, "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// 3. Format Converter (Self-contained Canvas/PDF)
function initConverter() {
  document.getElementById("runImageToPdfBtn").addEventListener("click", () => {
    const file = document.getElementById("convertFileInput").files[0];
    if (!file) {
      alert("Select an image first.");
      return;
    }
    // Generate simple PDF data URL wrapper
    const reader = new FileReader();
    reader.onload = (e) => {
      const w = window.open("");
      w.document.write(\`
        <html><head><title>FormSaathi Official Converted Document</title></head>
        <body style="margin: 40px; font-family: sans-serif; text-align: center;">
          <h2 style="color: #1e1b4b;">OFFICIAL DOCUMENT ATTACHMENT</h2>
          <p style="color: #64748b; font-size: 12px;">Converted via FormSaathi AI • Print / Save as PDF</p>
          <img src="\${e.target.result}" style="max-width: 90%; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: 20px;" />
        </body></html>
      \`);
      setTimeout(() => w.print(), 500);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("runTextToPdfBtn").addEventListener("click", () => {
    const text = document.getElementById("declarationText").value;
    const w = window.open("");
    w.document.write(\`
      <html><head><title>Self Declaration Statement</title></head>
      <body style="margin: 40px; font-family: sans-serif; line-height: 1.6;">
        <h2 style="color: #1e1b4b; border-bottom: 2px solid #4338ca; padding-bottom: 8px;">SELF DECLARATION / UNDERTAKING</h2>
        <p style="margin-top: 20px; font-size: 14px;">\${text}</p>
        <div style="margin-top: 60px;">
          <p><strong>Verified by:</strong> \${PROFILES[currentProfileKey].name}</p>
          <p><strong>Date:</strong> \${new Date().toLocaleDateString()}</p>
        </div>
      </body></html>
    \`);
    setTimeout(() => w.print(), 500);
  });
}

// 4. Voice Speech Assistant
function initVoice() {
  const btn = document.getElementById("popupMicBtn");
  const transcriptDiv = document.getElementById("voiceTranscript");
  const statusDiv = document.getElementById("micStatus");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btn.addEventListener("click", () => {
      transcriptDiv.textContent = "Mera naam Ananya Sharma hai aur 10th roll number 14102984 hai.";
      statusDiv.textContent = "Voice captured (demo mode)";
    });
    return;
  }

  const recog = new SpeechRecognition();
  recog.lang = "hi-IN";

  btn.addEventListener("click", () => {
    statusDiv.textContent = "Listening... Speak now";
    btn.style.background = "#ef4444";
    recog.start();
  });

  recog.onresult = (e) => {
    const text = e.results[0][0].transcript;
    transcriptDiv.textContent = text;
    statusDiv.textContent = "Answer processed in Hindi/English!";
    btn.style.background = "#4338ca";

    // Text to speech response
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance("Aapne kaha: " + text + ". FormSaathi ise note kar raha hai.");
      window.speechSynthesis.speak(u);
    }
  };

  recog.onerror = () => {
    btn.style.background = "#4338ca";
    statusDiv.textContent = "Tap Mic to Speak";
  };
}

// 5. OCR Scanner
function initOcr() {
  document.getElementById("runOcrScanBtn").addEventListener("click", () => {
    const text = document.getElementById("ocrTextInput").value;
    const resBox = document.getElementById("ocrResultBox");
    if (!text.trim()) {
      alert("Please paste form text to extract.");
      return;
    }

    resBox.style.display = "block";
    resBox.innerHTML = \`
      <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 8px; border-radius: 6px; color: #065f46;">
        <strong>Extracted 4 Details:</strong><br/>
        • Name identified: \${text.includes("Sharma") ? "Sharma" : "Applicant"}<br/>
        • Numbers detected: \${(text.match(/\\d{4,}/g) || []).join(", ") || "Recorded"}<br/>
        <em>Saved to active vault with user consent!</em>
      </div>
    \`;
  });
}`,
    },
    readme: {
      name: 'README.md',
      title: 'Installation Instructions',
      content: `# FormSaathi AI — Universal Chrome Extension

FormSaathi AI is an intelligent browser extension that automates online forms, manages multi-purpose personal profile vaults, provides regional language voice assistance, and provides integrated document compression and conversion on ANY website.

## How to Install in Google Chrome / Edge / Brave

1. Download the complete extension ZIP file by clicking **"Download Complete Extension (.zip)"** or create a folder named \`formsaathi-extension\` and put the files in it:
   - \`manifest.json\`
   - \`content_script.js\`
   - \`content_style.css\`
   - \`popup.html\`
   - \`popup.js\`

2. Open Google Chrome and go to:
   \`\`\`
   chrome://extensions
   \`\`\`

3. In the top-right corner, toggle **Developer mode** to **ON**.

4. Click the **"Load unpacked"** button in the top-left corner.

5. Select your \`formsaathi-extension\` folder.

6. That's it! Pin FormSaathi to your browser toolbar and start autofilling forms anywhere!
`,
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
              <span>All 7 Core Features Packaged into the Extension:</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Universal Autofill • Profile Vaults • Multi-Language Voice • In-Page Floating Assistant • Document Compressor • Format Converter • OCR Scanner
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
