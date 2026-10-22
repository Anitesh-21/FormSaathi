import React from 'react';
import {
  FileText,
  UserCheck,
  Minimize2,
  FileCode,
  ScanLine,
  ShieldCheck,
  Globe,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { UserProfile, SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/defaultProfiles';

export type NavTab = 'anyform' | 'forms' | 'profiles' | 'scanner' | 'compressor' | 'converter';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  profiles: UserProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  currentLanguage: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  onOpenPrivacy: () => void;
  onOpenVoice: () => void;
  onOpenExtensionPackage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  profiles,
  activeProfileId,
  onSelectProfile,
  currentLanguage,
  onChangeLanguage,
  onOpenPrivacy,
  onOpenExtensionPackage,
}) => {
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-100 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">FormSaathi</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  AI
                </span>
                <span className="hidden sm:inline text-xs text-slate-400">|</span>
                <span className="hidden sm:inline text-xs font-medium text-slate-500">फॉर्मसाथी</span>
              </div>
              <p className="text-xs text-slate-500 truncate hidden md:block">
                Multilingual Form Automation & Document Companion
              </p>
            </div>
          </div>

          {/* Profile Switcher & Language Selector */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Active Profile Dropdown */}
            <div className="relative group">
              <label htmlFor="profile-select" className="sr-only">Active Profile</label>
              <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs sm:text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-500 hidden lg:inline">Profile:</span>
                <select
                  id="profile-select"
                  aria-label="Select active profile"
                  value={activeProfileId}
                  onChange={(e) => onSelectProfile(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer max-w-[140px] sm:max-w-[190px] truncate"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs sm:text-sm">
              <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <label htmlFor="language-select" className="sr-only">Language</label>
              <select
                id="language-select"
                aria-label="Select language"
                value={currentLanguage}
                onChange={(e) => onChangeLanguage(e.target.value as SupportedLanguage)}
                className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer text-xs sm:text-sm"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Install Extension Badge */}
            <button
              onClick={onOpenExtensionPackage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              title="Install as Browser Extension"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Chrome Extension</span>
            </button>

            {/* Privacy Vault Badge */}
            <button
              onClick={onOpenPrivacy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
              title="Privacy & Local Storage Vault"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Local Vault</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-100 pt-1 pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('anyform')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'anyform'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="font-bold">Any Form Autofill (Universal)</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1 rounded border border-emerald-200">
              Live Inspector
            </span>
          </button>

          <button
            onClick={() => setActiveTab('forms')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'forms'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Govt & Academic Portal Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'profiles'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="font-semibold">Profile</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              {profiles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>Smart Form Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('compressor')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'compressor'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Minimize2 className="w-4 h-4" />
            <span>PDF &amp; File Compressor</span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1 rounded border border-emerald-200">
              PDF &amp; Images
            </span>
          </button>

          <button
            onClick={() => setActiveTab('converter')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'converter'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Image &amp; Doc Converter</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
