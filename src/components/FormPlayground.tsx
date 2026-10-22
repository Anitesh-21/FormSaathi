import React, { useState } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Download,
  ShieldAlert,
  FileCheck,
  Minimize2,
  Check,
  Plus,
  RefreshCw,
  X,
  UserCheck,
} from 'lucide-react';
import { FormTemplate, FormFieldDef, UserProfile, SupportedLanguage } from '../types';
import { SAMPLE_FORMS } from '../data/sampleForms';
import { CompanionWidget } from './CompanionWidget';
import { formatFileSize } from '../utils/compression';

interface FormPlaygroundProps {
  activeProfile: UserProfile;
  profiles: UserProfile[];
  onSelectProfile: (id: string) => void;
  currentLanguage: SupportedLanguage;
  onOpenVoiceModal: () => void;
  onNavigateToCompressorWithFile?: (file: File, targetKb: number) => void;
  onSaveOrUpdateFieldToProfile?: (
    fieldKey: string,
    fieldLabel: string,
    value: string,
    category?: any,
    profileId?: string
  ) => void;
}

export const FormPlayground: React.FC<FormPlaygroundProps> = ({
  activeProfile,
  profiles,
  onSelectProfile,
  currentLanguage,
  onOpenVoiceModal,
  onNavigateToCompressorWithFile,
  onSaveOrUpdateFieldToProfile,
}) => {
  const [selectedFormId, setSelectedFormId] = useState<string>(SAMPLE_FORMS[0].id);
  const activeForm: FormTemplate = SAMPLE_FORMS.find((f) => f.id === selectedFormId) || SAMPLE_FORMS[0];

  // Form values state
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [autofilledFields, setAutofilledFields] = useState<Record<string, string>>({}); // fieldId -> sourceProfileName
  const [focusedField, setFocusedField] = useState<FormFieldDef | null>(null);

  // Auto-add feature state
  const [autoAddToProfile, setAutoAddToProfile] = useState<boolean>(true);
  const [fieldSyncStatus, setFieldSyncStatus] = useState<Record<string, 'added' | 'updated'>>({});
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // File uploads tracking
  const [fileUploads, setFileUploads] = useState<Record<string, { file: File; sizeKb: number; isOverLimit: boolean }>>({});

  // Submission review modal
  const [showSubmissionReview, setShowSubmissionReview] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Profile selection prompt modal when switching forms
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [pendingFormId, setPendingFormId] = useState<string | null>(null);

  const showSyncFeedback = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => {
      setSyncToast(null);
    }, 3500);
  };

  // Helper to determine if a form field matches an existing entry in the active profile
  const findProfileField = (fieldId: string, fieldLabel: string) => {
    const cleanId = fieldId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLabel = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
    return activeProfile.fields.find((f) => {
      const k = f.key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const l = f.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      return k === cleanId || l === cleanLabel || (cleanId.length > 3 && k.includes(cleanId)) || (cleanLabel.length > 3 && l.includes(cleanLabel));
    });
  };

  const handleFormTabChange = (formId: string) => {
    setPendingFormId(formId);
    setShowProfilePrompt(true);
  };

  const confirmFormSwitch = (chosenProfileId: string) => {
    if (pendingFormId) {
      setSelectedFormId(pendingFormId);
    }
    onSelectProfile(chosenProfileId);
    setFormValues({});
    setAutofilledFields({});
    setFileUploads({});
    setFocusedField(null);
    setShowProfilePrompt(false);
    setPendingFormId(null);
    setFieldSyncStatus({});
  };

  const handleFieldValueChange = (fieldDef: FormFieldDef, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldDef.id]: value }));

    // Auto-add feature: if field is not present in profile and value is entered, add it to profile!
    if (autoAddToProfile && value.trim()) {
      const existing = findProfileField(fieldDef.id, fieldDef.label);
      if (!existing && onSaveOrUpdateFieldToProfile) {
        onSaveOrUpdateFieldToProfile(fieldDef.id, fieldDef.label, value, fieldDef.category as any);
        setFieldSyncStatus((prev) => ({ ...prev, [fieldDef.id]: 'added' }));
        showSyncFeedback(`✨ Auto-added "${fieldDef.label}" to profile "${activeProfile.name}"!`);
      }
    }
  };

  // Explicit single field save/update to profile
  const handleExplicitSaveToProfile = (fieldDef: FormFieldDef, value: string) => {
    if (!value || !value.trim()) return;
    if (onSaveOrUpdateFieldToProfile) {
      const existing = findProfileField(fieldDef.id, fieldDef.label);
      onSaveOrUpdateFieldToProfile(fieldDef.id, fieldDef.label, value, fieldDef.category as any);
      setFieldSyncStatus((prev) => ({ ...prev, [fieldDef.id]: existing ? 'updated' : 'added' }));
      showSyncFeedback(
        existing
          ? `Updated "${fieldDef.label}" in profile "${activeProfile.name}"!`
          : `Added new field "${fieldDef.label}" to profile "${activeProfile.name}"!`
      );
    }
  };

  // Sync all currently filled fields that aren't in profile yet
  const handleSyncAllNewFields = () => {
    let addedCount = 0;
    activeForm.fields.forEach((f) => {
      const val = formValues[f.id];
      if (val && val.trim()) {
        const existing = findProfileField(f.id, f.label);
        if (!existing && onSaveOrUpdateFieldToProfile) {
          onSaveOrUpdateFieldToProfile(f.id, f.label, val, f.category as any);
          setFieldSyncStatus((prev) => ({ ...prev, [f.id]: 'added' }));
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      showSyncFeedback(`✨ Saved ${addedCount} new form field(s) to profile "${activeProfile.name}"!`);
    } else {
      showSyncFeedback('All filled fields are already present in your profile.');
    }
  };

  const handleApplyAutofill = (approvedMatches: Record<string, string>) => {
    setFormValues((prev) => ({ ...prev, ...approvedMatches }));
    const sourceMap: Record<string, string> = { ...autofilledFields };
    Object.keys(approvedMatches).forEach((k) => {
      sourceMap[k] = activeProfile.name;
    });
    setAutofilledFields(sourceMap);
  };

  const handleFileChange = (field: FormFieldDef, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = file.size / 1024;
    const isOverLimit = !!field.maxFileSizeKb && sizeKb > field.maxFileSizeKb;

    setFileUploads((prev) => ({
      ...prev,
      [field.id]: {
        file,
        sizeKb,
        isOverLimit,
      },
    }));
    handleFieldValueChange(field, file.name);
  };

  const handleResetForm = () => {
    if (window.confirm('Are you sure you want to clear all entered form values?')) {
      setFormValues({});
      setAutofilledFields({});
      setFileUploads({});
      setFocusedField(null);
      setFieldSyncStatus({});
    }
  };

  // Group fields by category
  const categories = Array.from(new Set(activeForm.fields.map((f) => f.category)));

  // Progress calculation
  const totalRequired = activeForm.fields.filter((f) => f.required).length;
  const completedRequired = activeForm.fields.filter((f) => f.required && formValues[f.id]?.trim()).length;
  const completionPercent = Math.round((completedRequired / (totalRequired || 1)) * 100);

  // Count unmapped filled fields
  const unmappedFilledCount = activeForm.fields.filter((f) => {
    const val = formValues[f.id];
    return val && val.trim() && !findProfileField(f.id, f.label);
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Dynamic Sync Toast */}
      {syncToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{syncToast}</span>
          </div>
          <button onClick={() => setSyncToast(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Portal Header & Template Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Official Portal Simulation
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">{activeForm.portalName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {activeForm.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              {activeForm.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-500">Form Progress</div>
              <div className="text-sm font-bold text-indigo-700">
                {completedRequired} / {totalRequired} Fields ({completionPercent}%)
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 flex items-center justify-center font-bold text-xs text-slate-700">
              {completionPercent}%
            </div>
          </div>
        </div>

        {/* Portal Tabs */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap hidden sm:inline">
            Select Form:
          </span>
          {SAMPLE_FORMS.map((form) => (
            <button
              key={form.id}
              onClick={() => handleFormTabChange(form.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedFormId === form.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{form.portalType}: {form.title.split('—')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Left, Companion Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Canvas (8 cols on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Active Profile Info Banner & Auto-sync Controls */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Active Profile:</span>
              <span className="px-2.5 py-1 rounded-md bg-indigo-100/80 text-indigo-900 font-bold border border-indigo-200">
                {activeProfile.name}
              </span>
              <button
                onClick={() => {
                  setPendingFormId(selectedFormId);
                  setShowProfilePrompt(true);
                }}
                className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 ml-1"
              >
                Switch
              </button>
            </div>

            {/* Profile Auto-Sync Toggle & Batch Save */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <input
                  type="checkbox"
                  checked={autoAddToProfile}
                  onChange={(e) => setAutoAddToProfile(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-slate-700">
                  Auto-add new entries to Profile
                </span>
              </label>

              {unmappedFilledCount > 0 && (
                <button
                  type="button"
                  onClick={handleSyncAllNewFields}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                  title="Save new values to active profile"
                >
                  <Plus className="w-3 h-3" />
                  <span>Save {unmappedFilledCount} New to Profile</span>
                </button>
              )}
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-8">
            {categories.map((category) => {
              const categoryFields = activeForm.fields.filter((f) => f.category === category);
              return (
                <div key={category} className="space-y-4">
                  <div className="border-b border-slate-200 pb-2">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      {category}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categoryFields.map((field) => {
                      const isFilledByAI = !!autofilledFields[field.id];
                      const currentValue = formValues[field.id] || '';
                      const isFocused = focusedField?.id === field.id;
                      const fileInfo = fileUploads[field.id];

                      const profileMatch = findProfileField(field.id, field.label);
                      const isInProfile = !!profileMatch;
                      const isSyncAdded = fieldSyncStatus[field.id] === 'added';
                      const isSyncUpdated = fieldSyncStatus[field.id] === 'updated';
                      const isProfileValueDifferent = isInProfile && profileMatch.value !== currentValue && currentValue.trim() !== '';

                      return (
                        <div
                          key={field.id}
                          className={`space-y-1.5 transition-all ${
                            field.type === 'textarea' || field.id.includes('address') ? 'sm:col-span-2' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <label
                              htmlFor={field.id}
                              className={`text-xs font-semibold block transition-colors ${
                                isFocused ? 'text-indigo-600' : 'text-slate-700'
                              }`}
                            >
                              {field.label}{' '}
                              {field.required && <span className="text-rose-500">*</span>}
                            </label>

                            {/* Status & Sync to Profile badges */}
                            <div className="flex items-center gap-1.5">
                              {isFilledByAI && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-200 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Autofilled
                                </span>
                              )}

                              {isSyncAdded ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200 flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" />
                                  Added to Profile
                                </span>
                              ) : isSyncUpdated ? (
                                <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-semibold border border-blue-200 flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" />
                                  Updated in Profile
                                </span>
                              ) : !isInProfile ? (
                                currentValue.trim() ? (
                                  <button
                                    type="button"
                                    onClick={() => handleExplicitSaveToProfile(field, currentValue)}
                                    className="text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded font-bold border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Add this new field to your active profile"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                    <span>Add to Profile</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium border border-amber-200">
                                    New field
                                  </span>
                                )
                              ) : isProfileValueDifferent ? (
                                <button
                                  type="button"
                                  onClick={() => handleExplicitSaveToProfile(field, currentValue)}
                                  className="text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded font-bold border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                                  title={`Update saved value from "${profileMatch.value}" to "${currentValue}"`}
                                >
                                  <RefreshCw className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>Update Profile</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5" title="Present in profile">
                                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                                  <span>In Profile</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Field Input Render */}
                          {field.type === 'select' ? (
                            <select
                              id={field.id}
                              value={currentValue}
                              onFocus={() => setFocusedField(field)}
                              onChange={(e) => handleFieldValueChange(field, e.target.value)}
                              className={`w-full text-xs sm:text-sm rounded-lg border px-3 py-2 bg-white transition-all focus:outline-hidden ${
                                isFocused
                                  ? 'border-indigo-600 ring-2 ring-indigo-100'
                                  : isFilledByAI
                                  ? 'border-emerald-300 bg-emerald-50/20'
                                  : 'border-slate-300 hover:border-slate-400'
                              }`}
                            >
                              <option value="">-- Select option --</option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              id={field.id}
                              rows={3}
                              value={currentValue}
                              placeholder={field.placeholder}
                              onFocus={() => setFocusedField(field)}
                              onChange={(e) => handleFieldValueChange(field, e.target.value)}
                              className={`w-full text-xs sm:text-sm rounded-lg border px-3 py-2 bg-white transition-all focus:outline-hidden ${
                                isFocused
                                  ? 'border-indigo-600 ring-2 ring-indigo-100'
                                  : isFilledByAI
                                  ? 'border-emerald-300 bg-emerald-50/20'
                                  : 'border-slate-300 hover:border-slate-400'
                              }`}
                            />
                          ) : field.type === 'file' ? (
                            <div className="space-y-2">
                              <div
                                onFocus={() => setFocusedField(field)}
                                className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                                  fileInfo?.isOverLimit
                                    ? 'border-rose-300 bg-rose-50/40'
                                    : fileInfo
                                    ? 'border-emerald-300 bg-emerald-50/30'
                                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                                }`}
                              >
                                <input
                                  type="file"
                                  id={field.id}
                                  accept={field.acceptedFileTypes}
                                  onChange={(e) => handleFileChange(field, e)}
                                  className="hidden"
                                />
                                <label
                                  htmlFor={field.id}
                                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                                >
                                  {fileInfo ? (
                                    <FileCheck className="w-6 h-6 text-emerald-600" />
                                  ) : (
                                    <Upload className="w-6 h-6 text-slate-400" />
                                  )}
                                  <div className="text-xs font-semibold text-slate-800">
                                    {fileInfo ? fileInfo.file.name : 'Choose file or drag & drop'}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {field.acceptedFileTypes} • Max Limit:{' '}
                                    <span className="font-bold text-slate-700">
                                      {field.maxFileSizeKb} KB
                                    </span>
                                  </div>
                                </label>
                              </div>

                              {/* Over-limit Warning with Direct Compressor Action */}
                              {fileInfo?.isOverLimit && (
                                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <span className="font-bold">Portal Size Exceeded! </span>
                                    File is {formatFileSize(fileInfo.sizeKb)}, but maximum allowed is {field.maxFileSizeKb} KB.
                                    {onNavigateToCompressorWithFile && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onNavigateToCompressorWithFile(fileInfo.file, field.maxFileSizeKb || 100)
                                        }
                                        className="mt-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 rounded px-2.5 py-1 flex items-center gap-1 shadow-2xs"
                                      >
                                        <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Compress to {field.maxFileSizeKb} KB in FormSaathi Compressor</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <input
                              type={field.type}
                              id={field.id}
                              value={currentValue}
                              placeholder={field.placeholder}
                              onFocus={() => setFocusedField(field)}
                              onChange={(e) => handleFieldValueChange(field, e.target.value)}
                              className={`w-full text-xs sm:text-sm rounded-lg border px-3 py-2 bg-white transition-all focus:outline-hidden ${
                                isFocused
                                  ? 'border-indigo-600 ring-2 ring-indigo-100'
                                  : isFilledByAI
                                  ? 'border-emerald-300 bg-emerald-50/20'
                                  : 'border-slate-300 hover:border-slate-400'
                              }`}
                            />
                          )}

                          {/* Quick hint & format note */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{field.expectedFormat ? `Format: ${field.expectedFormat}` : ''}</span>
                            {field.helpText && (
                              <button
                                type="button"
                                onClick={() => setFocusedField(field)}
                                className="text-indigo-600 hover:underline cursor-pointer"
                              >
                                Need Help?
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Bottom Actions Bar */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Form</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSubmissionReview(true)}
                className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Verify & Review Before Final Submit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* FormSaathi AI Companion Sidebar (4 cols on desktop) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <CompanionWidget
            activeProfile={activeProfile}
            currentLanguage={currentLanguage}
            focusedField={focusedField}
            formTitle={activeForm.title}
            allFormFields={activeForm.fields}
            formValues={formValues}
            onApplyAutofill={handleApplyAutofill}
            onOpenVoiceModal={onOpenVoiceModal}
            onChangeProfileRequest={() => {
              setPendingFormId(selectedFormId);
              setShowProfilePrompt(true);
            }}
          />
        </div>
      </div>

      {/* Profile Selection Prompt Modal when starting/switching a form */}
      {showProfilePrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Select Profile for this Application
                </h3>
                <p className="text-xs text-slate-500">
                  Prevents accidental mixing of personal, academic, or family records.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {profiles.map((p) => {
                const isCurrent = p.id === activeProfile.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => confirmFormSwitch(p.id)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">{p.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                      <span className="inline-block mt-2 text-[11px] text-slate-600 font-medium">
                        Category: {p.category} • {p.fields.length} attributes stored
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowProfilePrompt(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Keep Current Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Review Modal */}
      {showSubmissionReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Pre-Submission Verification & Review
                </h3>
                <p className="text-xs text-slate-500">
                  FormSaathi Safety Check: Review all entered values before final submission.
                </p>
              </div>
              <button
                onClick={() => setShowSubmissionReview(false)}
                className="text-slate-400 hover:text-slate-600 text-lg px-2 font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {submissionSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-lg text-slate-900">Application Submitted Successfully!</h4>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Your application for <span className="font-semibold text-slate-800">{activeForm.title}</span> has been verified and registered with reference ID <span className="font-mono font-bold text-indigo-600">FS-2026-{Math.floor(100000 + Math.random() * 900000)}</span>.
                  </p>
                  <div className="pt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setShowSubmissionReview(false);
                        setSubmissionSuccess(false);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Human Verification Step:</span> FormSaathi AI never submits forms autonomously. Check below to ensure no personal details or document proofs were misentered.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Entered Data Summary ({Object.keys(formValues).length} fields filled):
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                      {activeForm.fields.map((f) => {
                        const val = formValues[f.id];
                        return (
                          <div key={f.id} className="p-2.5 flex items-center justify-between">
                            <span className="text-slate-600 font-medium">{f.label}:</span>
                            <span className="font-semibold text-slate-900 max-w-xs truncate text-right">
                              {val || <span className="text-rose-400 italic">Not provided</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Document upload checklist */}
                  <div className="space-y-1">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Attached Documents:
                    </div>
                    <div className="space-y-1">
                      {activeForm.fields
                        .filter((f) => f.type === 'file')
                        .map((f) => {
                          const upload = fileUploads[f.id];
                          return (
                            <div
                              key={f.id}
                              className="p-2 rounded border border-slate-200 flex items-center justify-between bg-slate-50"
                            >
                              <span className="text-slate-700">{f.label}</span>
                              {upload ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  {upload.file.name} ({formatFileSize(upload.sizeKb)})
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No file attached</span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {!submissionSuccess && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between">
                <button
                  onClick={() => setShowSubmissionReview(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100"
                >
                  Back to Editing
                </button>
                <button
                  onClick={() => setSubmissionSuccess(true)}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Complete Official Submission</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
