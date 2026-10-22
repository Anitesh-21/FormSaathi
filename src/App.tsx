import React, { useState, useEffect } from 'react';
import { UserProfile, SupportedLanguage, ScannedFieldResult, ProfileField } from './types';
import { DEFAULT_PROFILES } from './data/defaultProfiles';
import { Header, NavTab } from './components/Header';
import { AnyFormInspector } from './components/AnyFormInspector';
import { FormPlayground } from './components/FormPlayground';
import { ProfileManager } from './components/ProfileManager';
import { ScanFormModal } from './components/ScanFormModal';
import { DocumentCompressor } from './components/DocumentCompressor';
import { DocumentConverter } from './components/DocumentConverter';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { PrivacyModal } from './components/PrivacyModal';
import { ExtensionPackageModal } from './components/ExtensionPackageModal';
import { Mic, Sparkles } from 'lucide-react';

export default function App() {
  // Profiles persistence
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('formsaathi_profiles_vault');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically upgrade if older cache was found
        if (parsed.some((p: any) => p.name?.includes('Ananya') || p.fields?.some((f: any) => f.value === 'Ananya Sharma'))) {
          localStorage.removeItem('formsaathi_profiles_vault');
          return DEFAULT_PROFILES;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load profiles from local storage');
    }
    return DEFAULT_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('formsaathi_active_profile');
      if (saved && profiles.some((p) => p.id === saved)) return saved;
    } catch (e) {}
    return DEFAULT_PROFILES[0].id;
  });

  // Language state
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('formsaathi_lang');
      if (saved) return saved as SupportedLanguage;
    } catch (e) {}
    return 'Hindi'; // Friendly default for FormSaathi
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('anyform');

  // Modals
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  // Cross-component workflow: File handover to compressor
  const [compressorInitialFile, setCompressorInitialFile] = useState<File | null>(null);
  const [compressorInitialTargetKb, setCompressorInitialTargetKb] = useState<number>(100);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('formsaathi_profiles_vault', JSON.stringify(profiles));
    } catch (e) {}
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem('formsaathi_active_profile', activeProfileId);
    } catch (e) {}
  }, [activeProfileId]);

  useEffect(() => {
    try {
      localStorage.setItem('formsaathi_lang', currentLanguage);
    } catch (e) {}
  }, [currentLanguage]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const handleUpdateProfiles = (updated: UserProfile[]) => {
    setProfiles(updated);
  };

  const handleClearAllData = () => {
    localStorage.removeItem('formsaathi_profiles_vault');
    localStorage.removeItem('formsaathi_active_profile');
    setProfiles(DEFAULT_PROFILES);
    setActiveProfileId(DEFAULT_PROFILES[0].id);
  };

  // When form scanner approves and saves fields
  const handleSaveScannedToProfile = (
    profileId: string | 'NEW',
    profileName: string,
    extractedFields: ScannedFieldResult[]
  ) => {
    if (profileId === 'NEW') {
      const newProf: UserProfile = {
        id: `profile-${Date.now()}`,
        name: profileName || 'Scanned Profile',
        category: (extractedFields[0]?.category as any) || 'Academic',
        description: `Profile auto-created via FormSaathi Scanner on ${new Date().toLocaleDateString()}.`,
        lastUpdated: new Date().toISOString().split('T')[0],
        fields: extractedFields.map((f, i) => ({
          id: `scan-${Date.now()}-${i}`,
          key: f.key,
          label: f.label,
          value: f.value,
          category: (f.category as any) || 'Personal',
        })),
      };

      setProfiles((prev) => [...prev, newProf]);
      setActiveProfileId(newProf.id);
    } else {
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id === profileId) {
            const existingKeys = new Set(p.fields.map((f) => f.key.toLowerCase()));
            const addedFields = extractedFields.map((f, i) => ({
              id: `scan-${Date.now()}-${i}`,
              key: f.key,
              label: f.label,
              value: f.value,
              category: (f.category as any) || 'Personal',
            }));

            // Replace duplicates or add new
            const filteredOld = p.fields.filter(
              (f) => !extractedFields.some((ef) => ef.key.toLowerCase() === f.key.toLowerCase())
            );

            return {
              ...p,
              lastUpdated: new Date().toISOString().split('T')[0],
              fields: [...filteredOld, ...addedFields],
            };
          }
          return p;
        })
      );
    }
  };

  const handleNavigateToCompressor = (file: File, targetKb: number) => {
    setCompressorInitialFile(file);
    setCompressorInitialTargetKb(targetKb);
    setActiveTab('compressor');
  };

  // Add or update a field in the active profile (e.g. when user enters a new field in a form)
  const handleSaveOrUpdateFieldToProfile = (
    fieldKey: string,
    fieldLabel: string,
    value: string,
    category?: ProfileField['category'],
    profileId?: string
  ) => {
    if (!value || !value.trim()) return;
    const targetId = profileId || activeProfileId;
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== targetId) return p;
        const cleanKey = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanLabel = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '');

        const existingIndex = p.fields.findIndex((f) => {
          const k = f.key.toLowerCase().replace(/[^a-z0-9]/g, '');
          const l = f.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          return k === cleanKey || l === cleanLabel || (cleanKey.length > 3 && k === cleanKey);
        });

        let updatedFields = [...p.fields];
        if (existingIndex >= 0) {
          // Update existing field
          updatedFields[existingIndex] = {
            ...updatedFields[existingIndex],
            value: value.trim(),
          };
        } else {
          // Add new field to profile
          updatedFields.push({
            id: `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            key: fieldKey || fieldLabel.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
            label: fieldLabel,
            value: value.trim(),
            category: category || 'Personal',
          });
        }

        return {
          ...p,
          lastUpdated: new Date().toISOString().split('T')[0],
          fields: updatedFields,
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={setActiveProfileId}
        currentLanguage={currentLanguage}
        onChangeLanguage={setCurrentLanguage}
        onOpenPrivacy={() => setShowPrivacyModal(true)}
        onOpenVoice={() => setShowVoiceModal(true)}
        onOpenExtensionPackage={() => setShowExtensionModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'anyform' && (
          <AnyFormInspector
            activeProfile={activeProfile}
            currentLanguage={currentLanguage}
            onOpenVoiceModal={() => setShowVoiceModal(true)}
            onOpenCompressor={() => setActiveTab('compressor')}
            onSaveOrUpdateFieldToProfile={handleSaveOrUpdateFieldToProfile}
          />
        )}

        {activeTab === 'forms' && (
          <FormPlayground
            activeProfile={activeProfile}
            profiles={profiles}
            onSelectProfile={setActiveProfileId}
            currentLanguage={currentLanguage}
            onOpenVoiceModal={() => setShowVoiceModal(true)}
            onNavigateToCompressorWithFile={handleNavigateToCompressor}
            onSaveOrUpdateFieldToProfile={handleSaveOrUpdateFieldToProfile}
          />
        )}

        {activeTab === 'profiles' && (
          <ProfileManager
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={setActiveProfileId}
            onUpdateProfiles={handleUpdateProfiles}
            onOpenScanner={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'scanner' && (
          <ScanFormModal
            profiles={profiles}
            onSaveToProfile={handleSaveScannedToProfile}
          />
        )}

        {activeTab === 'compressor' && (
          <DocumentCompressor
            initialFile={compressorInitialFile}
            initialTargetKb={compressorInitialTargetKb}
            onAttachToForm={(blob, fileName) => {
              setActiveTab('forms');
            }}
          />
        )}

        {activeTab === 'converter' && <DocumentConverter />}
      </main>

      {/* Persistent Floating Voice Assistant Trigger button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setShowVoiceModal(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer border border-indigo-400/30"
          title="Open FormSaathi Voice Assistant"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-amber-300">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs tracking-tight">Voice Saathi ({currentLanguage})</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      </div>

      {/* Voice Assistant Modal */}
      {showVoiceModal && (
        <VoiceAssistantModal
          currentLanguage={currentLanguage}
          onChangeLanguage={setCurrentLanguage}
          onClose={() => setShowVoiceModal(false)}
        />
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <PrivacyModal
          profiles={profiles}
          onClose={() => setShowPrivacyModal(false)}
          onClearAllData={handleClearAllData}
        />
      )}

      {/* Extension Package & Install Modal */}
      {showExtensionModal && (
        <ExtensionPackageModal onClose={() => setShowExtensionModal(false)} />
      )}
    </div>
  );
}
