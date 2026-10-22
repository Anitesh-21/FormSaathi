# FormSaathi AI — Universal Browser Extension

FormSaathi AI is an intelligent browser extension that automates online forms, manages multi-purpose personal profile vaults, provides regional language voice assistance with certificate doubts guidance, and offers integrated document compression and conversion on ANY website — packaged in an aesthetically beautiful dark theme.

## Key Capabilities & Features

1. **Aesthetic Smooth Dark Theme**:
   - Modern obsidian/dark-slate palette with luminous indigo (`#6366f1`) and emerald (`#10b981`) accents.
   - Polished glassmorphism, responsive micro-animations, custom dark scrollbar, and crystal-clear typography.

2. **Form Doubts & Certificate Guidance (Voice & Q&A Tab)**:
   - Instant answers to common exam and college application doubts:
     - **Domicile Certificate**: What it is, why it's needed for 85% state quota and scholarships, and how to get it issued.
     - **EWS vs Income Certificate**: Clarification on General category 10% quota rules vs annual earnings proof.
     - **Bonafide / Enrolment Certificate**: School/college principal endorsement for NSP scholarships and student concessions.
     - **OBC Non-Creamy Layer (NCL)**: Guidelines on 27% reservation and validity across financial years.
     - **Gap Year Affidavit**: How to get notarized stamp paper for study gap years.
     - **Self-Declaration Undertaking**: Guidelines on undertakings and instant generation via the Convert tab.
     - **Name Mismatch**: Handling Aadhaar vs Class 10 marksheet name discrepancies.
     - **DigiLocker Verification**: Using legally valid digital documents under IT Act 2000.

3. **Master Extension ON / OFF Toggle Switch**:
   - Convenient power switch in the popup header with glowing status indicator.
   - Pause or re-activate FormSaathi anytime with 1 click.
   - When turned OFF, in-page floating docks, auto-learn listeners, and field badges are safely hidden and dormant.

4. **Structured Auto-Learn & Real-Time Vault Updates**:
   - **Structure Accordingly**: Every newly entered or saved field is automatically classified into the appropriate domain category (*Personal*, *Contact & Address*, *Academic*, *Identity & Documents*, *Financial & Bank*, or *Employment*).
   - Generates normalized camelCase identifiers (e.g. `tenthBoard`, `alternateMobile`, `bloodGroup`, `emergencyContact`) and stores clean labels.
   - **Update After Every Learn**: Immediately synchronizes to `chrome.storage.local`, logs audit records, updates in-page helper badges to `✓ Learned` / `↺ Update`, and triggers real-time tab re-scans so newly learned fields show as 🟢 Matched without needing page reload.
   - **Vault Category Filtering**: Filter attributes in your Profile tab by category chips (*Personal*, *Contact*, *Academic*, *Identity*, *Financial*, *Work*).

5. **Smart Voice & Text Assistant with Accurate Profile Access**:
   - **Type or Speak**: Ask in Hindi, English, or Hinglish via voice or text input.
   - **Categorized Question Chips**: Tap any chip to instantly get verified answers.
   - **Live Audio Playback & Copy**: Hear answers spoken aloud in regional voices or copy text to clipboard.

6. **Add New Profiles & Multi-Profile Vault**:
   - Create custom profiles with templates (*Standard*, *Job & Career*, *Government Welfare & DBT*, or *Blank*).
   - Switch active profiles instantly from the top control strip or delete custom profiles.

7. **In-Page Interactive Helpers & Floating Dock**:
   - Floating quick-fill dock button on any web page.
   - In-page badges beside form fields: `✨ Fill`, `💾 + Profile`, `✓ Learned`, and `↺ Update`.

8. **Universal Form Scanner & Multilingual Explanations**:
   - Detects all form inputs on active browser tab with semantic fuzzy matching.
   - Voice explanations in 9 Indian languages.

9. **Integrated Utilities**:
   - **Document Compressor**: Shrink certificates and photos (20 KB, 50 KB, 100 KB, 200 KB).
   - **Format Converter**: Convert photos to print-ready A4 PDF and generate signed self-declaration PDFs.
   - **OCR Learner**: Extract information from receipts and confirmation slips into your profile.

---

## How to Install in Google Chrome / Edge / Brave

1. Download the complete extension ZIP file by clicking **"Download Extension (.zip)"** in the FormSaathi web app header or unpack the files in `formsaathi-extension`:
   - `manifest.json`
   - `content_script.js`
   - `content_style.css`
   - `popup.html`
   - `popup.js`

2. Open Google Chrome (or Edge / Brave) and visit:
   ```text
   chrome://extensions
   ```

3. In the top-right corner, toggle **Developer mode** to **ON**.

4. Click the **"Load unpacked"** button in the top-left corner.

5. Select the `formsaathi-extension` folder.

6. Done! Pin FormSaathi to your browser toolbar to automate and learn from forms anywhere on the web.
