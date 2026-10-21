import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  UserProfile,
  FormFieldDef,
  FieldAutofillProposal,
  FieldExplanation,
  SupportedLanguage,
} from '../types';
import { explainFormField, suggestAutofill, speakWithTTS } from '../services/api';

interface CompanionWidgetProps {
  activeProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  focusedField: FormFieldDef | null;
  formTitle: string;
  allFormFields: FormFieldDef[];
  formValues: Record<string, string>;
  onApplyAutofill: (approvedMatches: Record<string, string>) => void;
  onOpenVoiceModal: () => void;
  onChangeProfileRequest: () => void;
}

export const CompanionWidget: React.FC<CompanionWidgetProps> = ({
  activeProfile,
  currentLanguage,
  focusedField,
  formTitle,
  allFormFields,
  formValues,
  onApplyAutofill,
  onOpenVoiceModal,
  onChangeProfileRequest,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [explanation, setExplanation] = useState<FieldExplanation | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Autofill proposal state
  const [proposals, setProposals] = useState<FieldAutofillProposal[]>([]);
  const [isScanningAutofill, setIsScanningAutofill] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<Record<string, boolean>>({});
  const [autofillWarnings, setAutofillWarnings] = useState<string[]>([]);
  const [showProposalDrawer, setShowProposalDrawer] = useState(false);

  // Load field explanation when focused field changes or language changes
  useEffect(() => {
    if (!focusedField) {
      setExplanation(null);
      return;
    }

    let isMounted = true;
    setIsLoadingExplanation(true);

    explainFormField({
      fieldLabel: focusedField.label,
      fieldDescription: focusedField.helpText,
      placeholder: focusedField.placeholder,
      formTitle,
      language: currentLanguage,
    })
      .then((data) => {
        if (isMounted) {
          setExplanation(data);
          setIsLoadingExplanation(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingExplanation(false);
      });

    return () => {
      isMounted = false;
    };
  }, [focusedField?.id, currentLanguage, formTitle]);

  // Audio speech player
  const handlePlayExplanation = async () => {
    if (!explanation) return;

    if (isPlayingAudio && currentAudio) {
      currentAudio.pause();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = `${explanation.explanation}. ${explanation.tip}`;
    setIsPlayingAudio(true);

    // Try Gemini TTS first
    const audioUrl = await speakWithTTS(textToSpeak, currentLanguage);

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        // Fallback to browser SpeechSynthesis
        fallbackBrowserSpeak(textToSpeak);
      };
      audio.play().catch(() => fallbackBrowserSpeak(textToSpeak));
    } else {
      fallbackBrowserSpeak(textToSpeak);
    }
  };

  const fallbackBrowserSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      // Attempt to pick a matching language voice
      const voices = window.speechSynthesis.getVoices();
      if (currentLanguage === 'Hindi') {
        const hiVoice = voices.find((v) => v.lang.startsWith('hi'));
        if (hiVoice) utterance.voice = hiVoice;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  // Run Smart Autofill Matching against active profile
  const handleRunAutofillScan = async () => {
    setIsScanningAutofill(true);
    setShowProposalDrawer(true);

    const profileData: Record<string, string> = {};
    activeProfile.fields.forEach((f) => {
      profileData[f.key] = f.value;
      profileData[f.label] = f.value;
    });

    const result = await suggestAutofill({
      formFields: allFormFields,
      profileData,
      profileName: activeProfile.name,
    });

    setProposals(result.matches);
    setAutofillWarnings(result.warnings || []);

    // By default check all high-confidence matches
    const initialSelection: Record<string, boolean> = {};
    result.matches.forEach((m) => {
      initialSelection[m.fieldId] = true;
    });
    setSelectedMatches(initialSelection);
    setIsScanningAutofill(false);
  };

  const handleApplyApproved = () => {
    const toApply: Record<string, string> = {};
    proposals.forEach((p) => {
      if (selectedMatches[p.fieldId]) {
        toApply[p.fieldId] = p.suggestedValue;
      }
    });

    onApplyAutofill(toApply);
    setShowProposalDrawer(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Companion Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center border border-indigo-400/40 text-amber-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                FormSaathi AI Companion
              </h3>
              <p className="text-xs text-indigo-200/90 font-medium">
                Active: <span className="text-white font-semibold">{activeProfile.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenVoiceModal}
              className="p-1.5 rounded-lg bg-indigo-700/60 hover:bg-indigo-600 text-white transition-colors"
              title="Voice Assistant"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-indigo-700/60 hover:bg-indigo-600 text-indigo-200 transition-colors"
              title="Toggle Assistant"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Switch prompt reminder */}
        <div className="mt-3 pt-2.5 border-t border-indigo-700/50 flex items-center justify-between text-xs">
          <span className="text-indigo-200 truncate">Category: {activeProfile.category}</span>
          <button
            onClick={onChangeProfileRequest}
            className="text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-2 flex-shrink-0"
          >
            Switch Profile
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 flex-1 flex flex-col overflow-y-auto">
          {/* Quick Action: Smart Autofill */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Smart Assisted Autofill
                </h4>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Matches {activeProfile.name} details with current form fields.
                </p>
              </div>
              <button
                onClick={handleRunAutofillScan}
                disabled={isScanningAutofill}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
              >
                {isScanningAutofill ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Autofill</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-[11px] text-indigo-600 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>You will review and approve all values before insertion.</span>
            </div>
          </div>

          {/* Focused Field AI Guidance */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Field Guidance ({currentLanguage})
                </span>
              </div>
              {explanation && (
                <button
                  onClick={handlePlayExplanation}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    isPlayingAudio
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                  title="Listen in chosen language"
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3 h-3 text-amber-600 animate-pulse" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 text-indigo-600" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {focusedField ? (
              <div className="space-y-2.5">
                <div className="text-xs font-medium text-slate-700 pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{focusedField.label}</span>
                  {focusedField.required && (
                    <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                      Required
                    </span>
                  )}
                </div>

                {isLoadingExplanation ? (
                  <div className="space-y-1.5 animate-pulse py-2">
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                  </div>
                ) : explanation ? (
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {explanation.explanation}
                    </p>

                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 text-amber-900 space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>FormSaathi Tip</span>
                      </div>
                      <p className="text-xs leading-normal">{explanation.tip}</p>
                    </div>

                    {explanation.example && (
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                        <span className="font-semibold text-slate-700">Example format: </span>
                        <code className="text-indigo-600 font-mono text-[11px]">{explanation.example}</code>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Loading contextual advice for this field...
                  </p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 space-y-2">
                <Eye className="w-6 h-6 mx-auto text-slate-400 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-600">
                  Click or focus on any form field
                </p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  FormSaathi will instantly explain criteria, formatting rules, and common mistakes in {currentLanguage}.
                </p>
              </div>
            )}
          </div>

          {/* Safety & No Auto-submit Guarantee */}
          <div className="mt-auto pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Strict Privacy & Submission Guard</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              FormSaathi never submits forms automatically. You maintain full oversight, can edit every field, and click the final submit button yourself.
            </p>
          </div>
        </div>
      )}

      {/* Smart Autofill Review Drawer Modal */}
      {showProposalDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Review FormSaathi Autofill Suggestions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Source Profile: <span className="font-semibold text-indigo-700">{activeProfile.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProposalDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-lg px-2 font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Human-in-the-loop guarantee:</span> Uncheck any field you want to fill manually. Values are only copied to the form upon clicking "Apply Approved Values".
                </div>
              </div>

              {autofillWarnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Notices</span>
                  </div>
                  {autofillWarnings.map((w, i) => (
                    <p key={i} className="text-[11px] text-amber-800">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {proposals.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No matching fields found between this profile and the form. Try switching to a different profile vault (e.g. Academic vs Job vs Family).
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>{proposals.length} fields mapped</span>
                    <button
                      onClick={() => {
                        const allSelected = Object.values(selectedMatches).every(Boolean);
                        const next: Record<string, boolean> = {};
                        proposals.forEach((p) => {
                          next[p.fieldId] = !allSelected;
                        });
                        setSelectedMatches(next);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      {Object.values(selectedMatches).every(Boolean) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {proposals.map((item) => {
                      const fieldDef = allFormFields.find((f) => f.id === item.fieldId);
                      const isChecked = selectedMatches[item.fieldId] || false;

                      return (
                        <div
                          key={item.fieldId}
                          className={`p-3 flex items-start gap-3 transition-colors ${
                            isChecked ? 'bg-indigo-50/30' : 'bg-slate-50/50 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setSelectedMatches({
                                ...selectedMatches,
                                [item.fieldId]: e.target.checked,
                              })
                            }
                            className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-slate-900 truncate">
                                {fieldDef?.label || item.fieldId}
                              </span>
                              <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
                                {Math.round(item.confidence * 100)}% Match
                              </span>
                            </div>
                            <div className="mt-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 truncate">
                              {item.suggestedValue}
                            </div>
                            {item.note && (
                              <p className="text-[11px] text-slate-500 mt-1 italic">
                                {item.note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => setShowProposalDrawer(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleApplyApproved}
                disabled={proposals.length === 0}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span>Apply Approved Values</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
