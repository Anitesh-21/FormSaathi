import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Download,
  Upload,
  Check,
  Search,
  Lock,
  Eye,
  EyeOff,
  FolderPlus,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { UserProfile, ProfileField } from '../types';

interface ProfileManagerProps {
  profiles: UserProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onUpdateProfiles: (updated: UserProfile[]) => void;
  onOpenScanner: () => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onUpdateProfiles,
  onOpenScanner,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(activeProfileId);
  const currentProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});

  // Edit / Add Field Modal
  const [editingField, setEditingField] = useState<ProfileField | null>(null);
  const [isNewField, setIsNewField] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);

  // New Profile Modal
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileCategory, setNewProfileCategory] = useState<UserProfile['category']>('Personal');
  const [newProfileDescription, setNewProfileDescription] = useState('');

  // Handle sensitive toggle
  const toggleSensitive = (fieldId: string) => {
    setShowSensitive((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  // Delete a field
  const handleDeleteField = (fieldId: string) => {
    if (window.confirm('Delete this saved detail from this profile?')) {
      const updatedProfiles = profiles.map((p) => {
        if (p.id === currentProfile.id) {
          return {
            ...p,
            lastUpdated: new Date().toISOString().split('T')[0],
            fields: p.fields.filter((f) => f.id !== fieldId),
          };
        }
        return p;
      });
      onUpdateProfiles(updatedProfiles);
    }
  };

  // Save edited or new field
  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField || !editingField.label.trim()) return;

    const normalizedKey =
      editingField.key.trim() ||
      editingField.label
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '')
        .trim();

    const fieldToSave: ProfileField = {
      ...editingField,
      id: editingField.id || `field-${Date.now()}`,
      key: normalizedKey,
    };

    const updatedProfiles = profiles.map((p) => {
      if (p.id === currentProfile.id) {
        let newFields = [...p.fields];
        if (isNewField) {
          newFields.push(fieldToSave);
        } else {
          newFields = newFields.map((f) => (f.id === fieldToSave.id ? fieldToSave : f));
        }
        return {
          ...p,
          lastUpdated: new Date().toISOString().split('T')[0],
          fields: newFields,
        };
      }
      return p;
    });

    onUpdateProfiles(updatedProfiles);
    setShowFieldModal(false);
    setEditingField(null);
  };

  // Create new profile
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const newProfile: UserProfile = {
      id: `profile-${Date.now()}`,
      name: newProfileName.trim(),
      category: newProfileCategory,
      description: newProfileDescription.trim() || `Profile created for ${newProfileCategory} applications.`,
      lastUpdated: new Date().toISOString().split('T')[0],
      fields: [],
    };

    const updated = [...profiles, newProfile];
    onUpdateProfiles(updated);
    setSelectedProfileId(newProfile.id);
    onSelectProfile(newProfile.id);
    setShowNewProfileModal(false);
    setNewProfileName('');
    setNewProfileDescription('');
  };

  // Delete Profile
  const handleDeleteProfile = (profileId: string) => {
    if (profiles.length <= 1) {
      alert('You must have at least one profile vault.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this profile? All its saved details will be permanently removed.')) {
      const updated = profiles.filter((p) => p.id !== profileId);
      onUpdateProfiles(updated);
      const nextId = updated[0].id;
      setSelectedProfileId(nextId);
      onSelectProfile(nextId);
    }
  };

  // Export JSON
  const handleExportProfile = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentProfile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentProfile.name.toLowerCase().replace(/\s+/g, '_')}_vault.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.name && Array.isArray(imported.fields)) {
          const newProfile: UserProfile = {
            ...imported,
            id: `profile-${Date.now()}`,
            name: `${imported.name} (Imported)`,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
          const updated = [...profiles, newProfile];
          onUpdateProfiles(updated);
          setSelectedProfileId(newProfile.id);
          onSelectProfile(newProfile.id);
          alert(`Successfully imported "${newProfile.name}"!`);
        } else {
          alert('Invalid profile JSON format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Filtered fields
  const categoriesList = ['All', 'Personal', 'Academic', 'Contact & Address', 'Identity & Documents', 'Financial & Bank', 'Employment'];
  const filteredFields = currentProfile.fields.filter((f) => {
    const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Zero-Cloud Privacy Vault
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Learns only with your permission</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Personal Profile Vaults
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Organize personal details into separate vaults for Academic, Job Applications, Government Schemes, and Family Members.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenScanner}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Scan Form to Add Profile</span>
          </button>

          <button
            onClick={() => setShowNewProfileModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Profile Vault</span>
          </button>
        </div>
      </div>

      {/* Profiles Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {profiles.map((p) => {
          const isSelected = p.id === currentProfile.id;
          const isActiveInApp = p.id === activeProfileId;

          return (
            <div
              key={p.id}
              onClick={() => {
                setSelectedProfileId(p.id);
                onSelectProfile(p.id);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-white ring-2 ring-indigo-100 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {p.category}
                  </span>
                  {isActiveInApp && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active in Form
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2 truncate">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{p.fields.length} details saved</span>
                <span className="text-[11px]">{p.lastUpdated}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile Details & Field Manager */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Selected Profile Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{currentProfile.name}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {currentProfile.category}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentProfile.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportProfile}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1"
              title="Export as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <label className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportProfile} className="hidden" />
            </label>

            <button
              onClick={() => {
                setIsNewField(true);
                setEditingField({
                  id: '',
                  key: '',
                  label: '',
                  value: '',
                  category: 'Personal',
                });
                setShowFieldModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Detail</span>
            </button>

            {profiles.length > 1 && (
              <button
                onClick={() => handleDeleteProfile(currentProfile.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete this profile vault"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search saved attributes (e.g., roll number, bank, address)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Fields Table / Grid */}
        <div className="p-5">
          {filteredFields.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <UserCheck className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-600">No saved fields found in this category</p>
              <p className="text-[11px] text-slate-400">Click "Add Custom Detail" or use "Scan Form" to extract details.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFields.map((field) => {
                const isRevealed = showSensitive[field.id] || !field.isSensitive;
                const displayValue = isRevealed
                  ? field.value
                  : '•••• •••• ' + field.value.slice(-4);

                return (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white transition-all space-y-2 group shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                          {field.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                          {field.label}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setIsNewField(false);
                            setEditingField(field);
                            setShowFieldModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-mono text-slate-800">
                      <span className="truncate">{displayValue}</span>
                      {field.isSensitive && (
                        <button
                          onClick={() => toggleSensitive(field.id)}
                          className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                          title={isRevealed ? 'Hide sensitive data' : 'Reveal sensitive data'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="font-mono">key: {field.key}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(field.value);
                          alert(`Copied "${field.label}" to clipboard!`);
                        }}
                        className="hover:text-indigo-600 flex items-center gap-0.5"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit / Add Field Modal */}
      {showFieldModal && editingField && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
              {isNewField ? 'Add Custom Detail to Profile' : 'Edit Saved Detail'}
            </h3>

            <form onSubmit={handleSaveField} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Detail Label / Question
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10th Board Certificate Number"
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Normalized Value
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBSE/2020/098124"
                  value={editingField.value}
                  onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Category
                </label>
                <select
                  value={editingField.category}
                  onChange={(e) => setEditingField({ ...editingField, category: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-indigo-600 bg-white"
                >
                  <option value="Personal">Personal</option>
                  <option value="Academic">Academic</option>
                  <option value="Contact & Address">Contact & Address</option>
                  <option value="Identity & Documents">Identity & Documents</option>
                  <option value="Financial & Bank">Financial & Bank</option>
                  <option value="Employment">Employment</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSensitive"
                  checked={editingField.isSensitive || false}
                  onChange={(e) => setEditingField({ ...editingField, isSensitive: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isSensitive" className="text-slate-700 font-medium cursor-pointer">
                  Mask as sensitive (e.g. Bank Account, Aadhaar)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFieldModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
                >
                  Save Detail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Profile Modal */}
      {showNewProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-indigo-600" />
              <span>Create New Profile Vault</span>
            </h3>

            <form onSubmit={handleCreateProfile} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Profile Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar (Govt Schemes / Farmer)"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Purpose / Category
                </label>
                <select
                  value={newProfileCategory}
                  onChange={(e) => setNewProfileCategory(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-indigo-600 bg-white"
                >
                  <option value="Personal">Personal Vault</option>
                  <option value="Academic">Academic & Scholarships</option>
                  <option value="Job Application">Job Application</option>
                  <option value="Family Member">Family Member</option>
                  <option value="Government Scheme">Government Scheme</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dedicated profile for agricultural subsidies and PM Kisan applications"
                  value={newProfileDescription}
                  onChange={(e) => setNewProfileDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProfileModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
