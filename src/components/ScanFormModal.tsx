import React, { useState } from 'react';
import {
  ScanLine,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FolderPlus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { UserProfile, ScanResult, ScannedFieldResult } from '../types';
import { scanForm } from '../services/api';

interface ScanFormModalProps {
  profiles: UserProfile[];
  onSaveToProfile: (profileId: string | 'NEW', profileName: string, fields: ScannedFieldResult[]) => void;
  onClose?: () => void;
}

const SAMPLE_SLIPS = [
  {
    title: 'Admission Registration Slip 2026',
    category: 'Academic',
    text: `STUDENT ADMISSION CONFIRMATION SLIP - 2026
Student Full Name: Anitesh Kumar Singh
Date of Birth: 15/09/2004
Gender: Male
Father's Name: Suresh Kumar Singh
Mother's Name: Sunita Singh
Category: General (UR)
Email: aniteshks21@gmail.com
Mobile: 9876543210
Address: House No. 42, Sector 14, Jaipur, Rajasthan, 302022
10th Board: CBSE | Roll No: 14102984 | Year: 2020 | Aggregate: 92.4%
12th Board: CBSE | Roll No: 22140938 | Year: 2022 | Aggregate: 89.6% | Stream: Science (PCM)
Allotted Institute: Rajasthan Technical Institute of Engineering (AISHE: C-24901)
Course: B.Tech Computer Science and Engineering
Bank Name: State Bank of India | Account No: 309811245678 | IFSC: SBIN0004521`,
  },
  {
    title: 'Recruitment Registration Slip (Job Application)',
    category: 'Job Application',
    text: `STAFF SELECTION RECRUITMENT CONFIRMATION
Applicant Name: Vikram Sharma
Father's Name: Suresh Kumar Sharma
DOB: 20/04/1999
Gender: Male
Category: General (UR)
Correspondence Address: Flat 304, Green Heights, Malviya Nagar, Jaipur, Rajasthan - 302017
Highest Qualification: B.Tech in Information Technology (Year 2021)
University: Rajasthan Technical University (CGPA: 8.4/10.0)
Total Experience: 3 Years
Current Role: Senior Software Associate
PAN Number: ABCPS1234F
Email: vikram.sharma.tech@gmail.com
Phone: 9414055667`,
  },
  {
    title: 'Citizen Welfare Subsidy Receipt',
    category: 'Government Scheme',
    text: `PM-KISAN BENEFICIARY ENROLLMENT ACKNOWLEDGMENT
Beneficiary Name: Suresh Kumar Sharma
Father / Husband: Late Ramdas Sharma
Spouse: Sunita Sharma
Village: Gram Panchayat Bassi, Tehsil Bassi, District: Jaipur, State: Rajasthan, PIN: 303301
Occupation: Agriculture / Small Farm Cultivator
Land Revenue Khasra No: 142/3 (Area: 1.8 Hectares)
Bank Name: Punjab National Bank
Savings Account: 109288374619
IFSC: PUNB0123400
Aadhaar Masked: XXXX-XXXX-4591`,
  },
];

export const ScanFormModal: React.FC<ScanFormModalProps> = ({
  profiles,
  onSaveToProfile,
}) => {
  const [activeMode, setActiveMode] = useState<'sample' | 'text' | 'image'>('sample');
  const [rawText, setRawText] = useState(SAMPLE_SLIPS[0].text);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [targetCategory, setTargetCategory] = useState<string>('Academic');

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Review & Consent state
  const [targetProfileId, setTargetProfileId] = useState<string>('NEW');
  const [newProfileTitle, setNewProfileTitle] = useState<string>('');
  const [reviewedFields, setReviewedFields] = useState<ScannedFieldResult[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSelectSample = (idx: number) => {
    setSelectedSampleIndex(idx);
    setRawText(SAMPLE_SLIPS[idx].text);
    setTargetCategory(SAMPLE_SLIPS[idx].category);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExecuteScan = async () => {
    setIsScanning(true);
    setScanResult(null);

    try {
      const payload: any = {
        targetProfileCategory: targetCategory,
      };

      if (activeMode === 'image' && imagePreview) {
        payload.imageBase64 = imagePreview;
        payload.mimeType = imageFile?.type || 'image/jpeg';
      } else {
        payload.rawText = rawText;
      }

      const result = await scanForm(payload);
      setScanResult(result);
      setNewProfileTitle(result.suggestedProfileName || 'Extracted Profile Vault');
      setReviewedFields(
        result.extractedFields.map((f) => ({
          ...f,
          selected: true,
        }))
      );
    } catch (err) {
      console.error('Scan error:', err);
      alert('Failed to scan document. Please verify text or image.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFieldChange = (index: number, newKey: 'label' | 'value', newVal: string) => {
    setReviewedFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [newKey]: newVal };
      return next;
    });
  };

  const toggleFieldSelection = (index: number) => {
    setReviewedFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], selected: !next[index].selected };
      return next;
    });
  };

  const handleSaveToVault = () => {
    const approved = reviewedFields.filter((f) => f.selected);
    if (approved.length === 0) {
      alert('Please select at least one field to save.');
      return;
    }

    onSaveToProfile(targetProfileId, newProfileTitle, approved);
    setSaveSuccess(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            Intelligent Document & Form OCR
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs font-medium text-slate-500">Learns only with your consent</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
          Form Scanner & Automatic Profile Creation
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
          Scan previously completed forms, confirmation receipts, or ID documents to extract details. FormSaathi organizes them into a reusable profile vault after you review and approve every field.
        </p>
      </div>

      {!scanResult ? (
        /* Input & Scanning Section */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
            <button
              onClick={() => setActiveMode('sample')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeMode === 'sample'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use Authentic Sample Slips</span>
            </button>

            <button
              onClick={() => setActiveMode('text')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeMode === 'text'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Custom Form Text</span>
            </button>

            <button
              onClick={() => setActiveMode('image')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeMode === 'image'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document / Screenshot</span>
            </button>
          </div>

          {/* Sample Mode */}
          {activeMode === 'sample' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_SLIPS.map((slip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSample(i)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedSampleIndex === i
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                      {slip.category}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 mt-1">{slip.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{slip.text}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Preview of Selected Form / Receipt Content:
                </label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 bg-slate-50 focus:outline-hidden focus:border-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Custom Text Mode */}
          {activeMode === 'text' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Paste completed application summary, confirmation email, or resume text:
              </label>
              <textarea
                rows={10}
                placeholder="Paste any form data here... e.g. Name: Ananya Sharma, DOB: 15/09/2004, 10th Roll: 14102984, Bank Account: 309811245678, IFSC: SBIN0004521..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-indigo-600"
              />
            </div>
          )}

          {/* Image Mode */}
          {activeMode === 'image' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors">
                <input
                  type="file"
                  id="scanner-image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="scanner-image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="w-8 h-8 text-indigo-600" />
                  <div className="text-sm font-bold text-slate-900">
                    {imageFile ? imageFile.name : 'Upload Screenshot / Photo of Completed Form'}
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Supports JPG, PNG, WebP of application receipts, mark sheets, admit cards, or government certificates.
                  </p>
                </label>
              </div>

              {imagePreview && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Image Preview:</div>
                  <img src={imagePreview} alt="Form preview" className="max-h-60 rounded mx-auto object-contain" />
                </div>
              )}
            </div>
          )}

          {/* Category Preference */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Target Category:</span>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-800"
              >
                <option value="Academic">Academic & Scholarships</option>
                <option value="Personal">Personal Vault</option>
                <option value="Job Application">Job Application</option>
                <option value="Government Scheme">Government Scheme</option>
                <option value="Family Member">Family Member</option>
              </select>
            </div>

            <button
              onClick={handleExecuteScan}
              disabled={isScanning || (activeMode === 'image' && !imagePreview) || (!rawText && activeMode !== 'image')}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning & Extracting Form Details...</span>
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" />
                  <span>Scan & Extract Details</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Review & Consent Section */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          {saveSuccess ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">
                Profile Vault Updated Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                FormSaathi has saved {reviewedFields.filter((f) => f.selected).length} approved attributes to your vault. These are now instantly reusable across all future applications.
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setScanResult(null);
                    setSaveSuccess(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg"
                >
                  Scan Another Document
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Scan Overview */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-emerald-950">
                    User Consent & Review Step
                  </h4>
                  <p className="leading-relaxed">
                    FormSaathi identified the following details from your document. You have full control: review the extracted values, edit any typos, and uncheck any details you do not want to save.
                  </p>
                </div>
              </div>

              {/* Destination profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Save Destination:
                  </label>
                  <select
                    value={targetProfileId}
                    onChange={(e) => setTargetProfileId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
                  >
                    <option value="NEW">+ Create Brand New Profile Vault</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        Add to Existing: {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                {targetProfileId === 'NEW' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      New Profile Name:
                    </label>
                    <input
                      type="text"
                      value={newProfileTitle}
                      onChange={(e) => setNewProfileTitle(e.target.value)}
                      placeholder="e.g. Ananya Sharma (Academic 2026)"
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Extracted Fields Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                  <span>
                    Extracted Attributes ({reviewedFields.filter((f) => f.selected).length} of {reviewedFields.length} selected):
                  </span>
                  <button
                    onClick={() => {
                      const allSelected = reviewedFields.every((f) => f.selected);
                      setReviewedFields((prev) => prev.map((f) => ({ ...f, selected: !allSelected })));
                    }}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {reviewedFields.every((f) => f.selected) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {reviewedFields.map((field, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                        field.selected ? 'bg-white' : 'bg-slate-50/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={field.selected || false}
                          onChange={() => toggleFieldSelection(idx)}
                          className="mt-1 sm:mt-0 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                            className="font-semibold text-slate-900 border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-1.5 py-0.5"
                          />
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => handleFieldChange(idx, 'value', e.target.value)}
                            className="font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] text-slate-400 pl-7 sm:pl-0">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {field.category}
                        </span>
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                          {Math.round(field.confidence * 100)}% Confidence
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setScanResult(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100"
                >
                  Discard & Scan Again
                </button>

                <button
                  onClick={handleSaveToVault}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Save Selected to Profile Vault</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
