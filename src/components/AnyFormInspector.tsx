import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Code,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Eye,
  ShieldCheck,
  FileText,
  Briefcase,
  Plane,
  Receipt,
  RotateCcw,
  Check,
  Plus,
  X,
} from 'lucide-react';
import { UserProfile, FormFieldDef, SupportedLanguage } from '../types';
import { suggestAutofill, explainFormField } from '../services/api';

interface AnyFormInspectorProps {
  activeProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  onOpenVoiceModal: () => void;
  onOpenCompressor: () => void;
  onSaveOrUpdateFieldToProfile?: (
    fieldKey: string,
    fieldLabel: string,
    value: string,
    category?: any,
    profileId?: string
  ) => void;
}

// Pre-configured custom web form templates that simulate external web forms
const PRESET_ANY_FORMS = [
  {
    id: 'workday-job',
    name: 'Tech Corp Careers (Workday / Greenhouse Style)',
    domain: 'careers.innovatetech.com/apply/senior-dev',
    category: 'Job Application',
    description: 'Generic tech company recruitment portal with resume, experience, notice period, and contact fields.',
    fields: [
      { id: 'full_name', label: 'Full Legal Name', type: 'text' as const, placeholder: 'First and last name', required: true, category: 'Personal' },
      { id: 'email_address', label: 'Primary Email Address', type: 'email' as const, placeholder: 'name@example.com', required: true, category: 'Contact' },
      { id: 'phone_number', label: 'Mobile / Telephone', type: 'tel' as const, placeholder: '+91 98765 43210', required: true, category: 'Contact' },
      { id: 'current_city', label: 'Current City & State', type: 'text' as const, placeholder: 'e.g. Jaipur, Rajasthan', required: true, category: 'Location' },
      { id: 'current_role', label: 'Current Title / Designation', type: 'text' as const, placeholder: 'e.g. Software Associate', required: false, category: 'Experience' },
      { id: 'experience_years', label: 'Total Years of Experience', type: 'text' as const, placeholder: 'e.g. 3 Years', required: true, category: 'Experience' },
      { id: 'highest_degree', label: 'Highest Degree Completed', type: 'text' as const, placeholder: 'e.g. B.Tech in IT / Computer Science', required: true, category: 'Education' },
      { id: 'university_name', label: 'University / College Name', type: 'text' as const, placeholder: 'e.g. Rajasthan Technical University', required: true, category: 'Education' },
      { id: 'graduation_year', label: 'Year of Graduation', type: 'text' as const, placeholder: 'e.g. 2021', required: true, category: 'Education' },
      { id: 'linkedin_url', label: 'LinkedIn Profile URL', type: 'text' as const, placeholder: 'https://linkedin.com/in/...', required: false, category: 'Links' },
    ],
  },
  {
    id: 'visa-application',
    name: 'International Travel & Visa Portal',
    domain: 'visa-online.gov.travel/apply/visitor',
    category: 'Travel / Identity',
    description: 'Strict immigration portal requiring passport, travel details, permanent residence, and emergency contact.',
    fields: [
      { id: 'given_names', label: 'Given / First Names (As in Passport)', type: 'text' as const, placeholder: 'Given names', required: true, category: 'Applicant' },
      { id: 'surname', label: 'Surname / Family Name', type: 'text' as const, placeholder: 'Surname', required: true, category: 'Applicant' },
      { id: 'dob_date', label: 'Date of Birth (YYYY-MM-DD)', type: 'date' as const, required: true, category: 'Applicant' },
      { id: 'gender_val', label: 'Gender', type: 'select' as const, options: ['Female', 'Male', 'Other'], required: true, category: 'Applicant' },
      { id: 'nationality_country', label: 'Country of Citizenship / Nationality', type: 'text' as const, placeholder: 'e.g. Indian', required: true, category: 'Applicant' },
      { id: 'passport_number', label: 'Passport / National ID Number', type: 'text' as const, placeholder: 'Passport or ID number', required: true, category: 'Identity' },
      { id: 'permanent_address', label: 'Full Home Residential Address', type: 'textarea' as const, placeholder: 'House number, street, city, pin code', required: true, category: 'Address' },
      { id: 'postal_pincode', label: 'Postal / ZIP Code', type: 'text' as const, placeholder: 'Postal code', required: true, category: 'Address' },
      { id: 'contact_mobile', label: 'Emergency Contact Mobile Number', type: 'tel' as const, placeholder: 'Contact phone', required: true, category: 'Contact' },
      { id: 'applicant_email', label: 'Notification Email Address', type: 'email' as const, placeholder: 'Email', required: true, category: 'Contact' },
    ],
  },
  {
    id: 'income-tax-filing',
    name: 'Income Tax & Citizen Financial Portal',
    domain: 'eportal.incometax.gov.in/iec/foservices',
    category: 'Finance / Tax',
    description: 'Direct citizen tax refund and financial profile registration portal.',
    fields: [
      { id: 'taxpayer_name', label: 'Name of Assessee / Taxpayer', type: 'text' as const, placeholder: 'Full legal name', required: true, category: 'General' },
      { id: 'pan_card_no', label: 'Permanent Account Number (PAN)', type: 'text' as const, placeholder: '10-digit PAN', required: true, category: 'General' },
      { id: 'date_of_birth', label: 'Date of Birth', type: 'date' as const, required: true, category: 'General' },
      { id: 'father_name', label: "Father's Full Name", type: 'text' as const, placeholder: "Father's name", required: true, category: 'General' },
      { id: 'bank_account', label: 'Bank Account for Direct Tax Refund', type: 'text' as const, placeholder: 'Savings account number', required: true, category: 'Bank' },
      { id: 'bank_ifsc', label: 'Branch IFSC Code', type: 'text' as const, placeholder: '11-character IFSC', required: true, category: 'Bank' },
      { id: 'bank_name', label: 'Bank Name', type: 'text' as const, placeholder: 'e.g. State Bank of India', required: true, category: 'Bank' },
      { id: 'annual_income', label: 'Gross Total Annual Income (INR)', type: 'number' as const, placeholder: 'e.g. 240000', required: true, category: 'Income' },
      { id: 'registered_mobile', label: 'Aadhaar-Linked Mobile for E-Verification', type: 'tel' as const, placeholder: 'Mobile number', required: true, category: 'Verification' },
      { id: 'registered_email', label: 'Registered Email for Intimation', type: 'email' as const, placeholder: 'Email address', required: true, category: 'Verification' },
    ],
  },
];

export const AnyFormInspector: React.FC<AnyFormInspectorProps> = ({
  activeProfile,
  currentLanguage,
  onOpenVoiceModal,
  onSaveOrUpdateFieldToProfile,
}) => {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customHtmlInput, setCustomHtmlInput] = useState(
    `<form id="vendor-registration">
  <label for="vendor_name">Company / Vendor Contact Name</label>
  <input type="text" id="vendor_name" name="vendor_name" placeholder="Contact person name" required />

  <label for="vendor_email">Official Email</label>
  <input type="email" id="vendor_email" name="vendor_email" placeholder="email@vendor.com" required />

  <label for="vendor_phone">Phone Number</label>
  <input type="tel" id="vendor_phone" name="vendor_phone" placeholder="Contact mobile" />

  <label for="tax_id">Tax / PAN / Registration ID</label>
  <input type="text" id="tax_id" name="tax_id" placeholder="Registration number" />

  <label for="bank_ac">Bank Account Number</label>
  <input type="text" id="bank_ac" name="bank_ac" placeholder="Bank account" />

  <label for="ifsc_code">Bank IFSC Code</label>
  <input type="text" id="ifsc_code" name="ifsc_code" placeholder="Branch IFSC" />

  <label for="billing_address">Registered Business Address</label>
  <textarea id="billing_address" name="billing_address" rows="3"></textarea>
</form>`
  );

  // Active form fields (derived either from selected preset or parsed from custom HTML)
  const [currentFields, setCurrentFields] = useState<FormFieldDef[]>(PRESET_ANY_FORMS[0].fields);
  const [currentDomain, setCurrentDomain] = useState<string>(PRESET_ANY_FORMS[0].domain);
  const [currentTitle, setCurrentTitle] = useState<string>(PRESET_ANY_FORMS[0].name);

  // Form values
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [autofilledFields, setAutofilledFields] = useState<Record<string, boolean>>({});

  // Auto-add & profile sync state
  const [autoAddToProfile, setAutoAddToProfile] = useState(true);
  const [fieldSyncStatus, setFieldSyncStatus] = useState<Record<string, 'added' | 'updated'>>({});

  // Active tooltip or helper modal for a single field
  const [activeTooltipFieldId, setActiveTooltipFieldId] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{ explanation: string; tip: string; example: string } | null>(null);
  const [isLoadingTooltip, setIsLoadingTooltip] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillToast, setAutofillToast] = useState<string | null>(null);

  // Helper to check if a form field is in active profile
  const findProfileField = (fieldId: string, fieldLabel: string) => {
    const cleanId = fieldId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLabel = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
    return activeProfile.fields.find((f) => {
      const k = f.key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const l = f.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      return k === cleanId || l === cleanLabel || (cleanId.length > 3 && k.includes(cleanId)) || (cleanLabel.length > 3 && l.includes(cleanLabel));
    });
  };

  const handleFieldChange = (fieldDef: FormFieldDef, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldDef.id]: value }));

    if (autoAddToProfile && value.trim()) {
      const existing = findProfileField(fieldDef.id, fieldDef.label);
      if (!existing && onSaveOrUpdateFieldToProfile) {
        onSaveOrUpdateFieldToProfile(fieldDef.id, fieldDef.label, value, fieldDef.category as any);
        setFieldSyncStatus((prev) => ({ ...prev, [fieldDef.id]: 'added' }));
        setAutofillToast(`✨ Auto-added "${fieldDef.label}" to profile "${activeProfile.name}"!`);
        setTimeout(() => setAutofillToast(null), 3500);
      }
    }
  };

  const handleExplicitSaveToProfile = (fieldDef: FormFieldDef, value: string) => {
    if (!value || !value.trim()) return;
    if (onSaveOrUpdateFieldToProfile) {
      const existing = findProfileField(fieldDef.id, fieldDef.label);
      onSaveOrUpdateFieldToProfile(fieldDef.id, fieldDef.label, value, fieldDef.category as any);
      setFieldSyncStatus((prev) => ({ ...prev, [fieldDef.id]: existing ? 'updated' : 'added' }));
      setAutofillToast(
        existing
          ? `Updated "${fieldDef.label}" in profile "${activeProfile.name}"!`
          : `Added "${fieldDef.label}" to profile "${activeProfile.name}"!`
      );
      setTimeout(() => setAutofillToast(null), 3500);
    }
  };

  const handleSyncAllNewFields = () => {
    let count = 0;
    currentFields.forEach((f) => {
      const val = fieldValues[f.id];
      if (val && val.trim()) {
        const existing = findProfileField(f.id, f.label);
        if (!existing && onSaveOrUpdateFieldToProfile) {
          onSaveOrUpdateFieldToProfile(f.id, f.label, val, f.category as any);
          setFieldSyncStatus((prev) => ({ ...prev, [f.id]: 'added' }));
          count++;
        }
      }
    });
    if (count > 0) {
      setAutofillToast(`✨ Saved ${count} new field(s) to profile "${activeProfile.name}"!`);
      setTimeout(() => setAutofillToast(null), 3500);
    } else {
      setAutofillToast('All entered fields are already in your profile.');
      setTimeout(() => setAutofillToast(null), 3000);
    }
  };

  // Helper to infer intelligent, descriptive labels from elements without ever falling back to generic "Input Field"
  const inferDescriptiveLabel = (raw: string, el?: Element, idx: number = 0) => {
    // 1. Check placeholder for strong semantic indicators first
    const ph = el?.getAttribute('placeholder') || '';
    if (ph) {
      const phLower = ph.toLowerCase();
      if (phLower.includes('@') || phLower.includes('.com') || phLower.includes('.in')) return 'Primary Email Address';
      if (phLower.startsWith('+') || /^\+?\d[\d\s-]{6,}$/.test(phLower) || phLower.includes('phone') || phLower.includes('mobile')) return 'Mobile / Telephone';
      if (phLower.includes('first and last') || phLower.includes('legal name') || phLower.includes('full name') || phLower.includes('applicant name')) return 'Full Legal Name';
      if (phLower.includes('jaipur') || phLower.includes('city') || phLower.includes('state')) return 'Current City & State';
      if (phLower.includes('street') || phLower.includes('house') || phLower.includes('address') || phLower.includes('flat')) return 'Residential Address';
      if (phLower.includes('pincode') || phLower.includes('postal') || phLower.includes('zip')) return 'Postal / PIN Code';
      if (phLower.includes('university') || phLower.includes('college') || phLower.includes('institute')) return 'University / College Name';
      if (phLower.includes('b.tech') || phLower.includes('degree') || phLower.includes('course') || phLower.includes('bca') || phLower.includes('m.tech')) return 'Highest Degree Completed';
      if (phLower.includes('associate') || phLower.includes('role') || phLower.includes('designation') || phLower.includes('developer')) return 'Current Title / Designation';
      if (phLower.includes('years') || phLower.includes('experience')) return 'Total Years of Experience';
      if (phLower.includes('202') || phLower.includes('passing') || phLower.includes('graduation')) return 'Year of Graduation';
      if (phLower.includes('linkedin') || phLower.startsWith('http')) return 'LinkedIn Profile URL';
      if (phLower.includes('pan') || phLower.includes('tax')) return 'PAN / Tax ID Number';
      if (phLower.includes('ifsc')) return 'Branch IFSC Code';
      if (phLower.includes('bank') || phLower.includes('savings') || phLower.includes('account')) return 'Bank Account Number';
      if (phLower.includes('dd/mm') || phLower.includes('yyyy') || phLower.includes('birth')) return 'Date of Birth';
    }

    // 2. Strip generic words like input, field, txt, control, item
    let cleaned = (raw || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b(id|txt|input|field|val|elem|control|item|data|form)\b/gi, '')
      .trim();

    if (cleaned && !/^\d+$/.test(cleaned) && cleaned.length > 1) {
      return cleaned
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }

    // 3. Check element type & attributes
    const inputType = (el?.getAttribute('type') || (el?.tagName === 'TEXTAREA' ? 'textarea' : 'text')).toLowerCase();
    if (inputType === 'email') return 'Primary Email Address';
    if (inputType === 'tel') return 'Mobile / Telephone';
    if (inputType === 'date') return 'Date of Birth';
    if (inputType === 'textarea') return 'Full Residential Address';
    if (inputType === 'file') return 'Document / Certificate Upload';
    if (inputType === 'number') return 'Numeric Detail / Amount';
    if (el?.tagName === 'SELECT') return 'Select Option';

    // 4. Professional fallback without generic "Input Field"
    return `Form Detail ${idx + 1}`;
  };

  // Detect whether a placeholder is just sample input data rather than a true descriptive label
  const isSamplePlaceholder = (str: string) => {
    if (!str) return true;
    const s = str.trim().toLowerCase();
    if (s.startsWith('+') || /^\+?\d[\d\s-]{6,}$/.test(s)) return true; // phone format e.g. +91 98765 43210
    if (s.includes('@') || s.includes('.com') || s.includes('.org') || s.includes('.in') || s.includes('.net')) return true; // email
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('www.')) return true; // url
    if (/^(e\.?g\.?|ex\.?|for example|sample|such as)\b/i.test(s)) return true; // e.g. Jaipur, e.g. 2021
    if (/^(yyyy|dd\/mm|mm\/dd|dd-mm|mm-dd)/i.test(s)) return true; // date formats
    if (/^(enter|type|input|select|choose|search|write|fill|provide|first and last)\b/i.test(s)) return true; // action instructions
    if (/^\d+(\.\d+)?(\s*(years?|yrs?|lakh|inr|rs\.?|%|kg|mb|kb))?$/i.test(s)) return true; // numbers/measurements
    return false;
  };

  // Parse custom HTML into fields with actual, readable labels
  const parseCustomHtml = (htmlStr: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlStr, 'text/html');
      const inputs = doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), select, textarea');

      const parsed: FormFieldDef[] = [];
      inputs.forEach((el, idx) => {
        const id = el.id || el.getAttribute('name') || `field_${idx + 1}`;
        let labelText = '';

        // 1. Explicit <label for="id">
        if (el.id) {
          const lbl = doc.querySelector(`label[for="${el.id}"]`);
          if (lbl) labelText = lbl.textContent?.trim() || '';
        }

        // 2. Enclosing <label>
        if (!labelText) {
          const parentLabel = el.closest('label');
          if (parentLabel) {
            const clone = parentLabel.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('input, select, textarea, button').forEach((n) => n.remove());
            labelText = clone.textContent?.trim() || '';
          }
        }

        // 3. Preceding sibling label/text
        if (!labelText) {
          const prev = el.previousElementSibling;
          if (prev && ['LABEL', 'SPAN', 'DIV', 'STRONG', 'B', 'P', 'DT', 'TH'].includes(prev.tagName)) {
            labelText = prev.textContent?.trim() || '';
          }
        }

        // 4. Aria label or title
        if (!labelText) {
          labelText = el.getAttribute('aria-label') || el.getAttribute('title') || '';
        }

        // If labelText looks like a sample value, discard it
        if (labelText && isSamplePlaceholder(labelText)) {
          labelText = '';
        }

        // 5. Placeholder ONLY if it is truly descriptive and not a sample value
        if (!labelText) {
          const ph = el.getAttribute('placeholder') || '';
          if (ph && !isSamplePlaceholder(ph)) {
            labelText = ph;
          }
        }

        // 6. Semantic recognition from input type and id/name attributes
        const rawAttr = `${el.getAttribute('name') || ''} ${el.id || ''}`.toLowerCase().replace(/[^a-z0-9]/g, ' ');
        const inputType = (el.getAttribute('type') || (el.tagName === 'TEXTAREA' ? 'textarea' : 'text')).toLowerCase();

        if (!labelText || /^(field|input|item)[s_-]*\d*$/i.test(labelText) || /input\s*field/i.test(labelText)) {
          if (inputType === 'tel' || /\b(phone|mobile|tel|contact)\b/i.test(rawAttr)) {
            labelText = 'Mobile / Telephone';
          } else if (inputType === 'email' || /\b(email|mail)\b/i.test(rawAttr)) {
            labelText = 'Primary Email Address';
          } else if (/\b(full\s*name|candidate\s*name|applicant\s*name|legal\s*name)\b/i.test(rawAttr)) {
            labelText = 'Full Legal Name';
          } else if (/\b(city\s*&?\s*state|current_city|city_state)\b/i.test(rawAttr)) {
            labelText = 'Current City & State';
          } else if (/\b(dob|birth|bday)\b/i.test(rawAttr) || inputType === 'date') {
            labelText = 'Date of Birth';
          } else if (/\b(address|residence|addr)\b/i.test(rawAttr) || inputType === 'textarea') {
            labelText = 'Residential Address';
          } else if (/\b(pan|pancard)\b/i.test(rawAttr)) {
            labelText = 'PAN Card Number';
          } else if (/\b(bank|account)\b/i.test(rawAttr)) {
            labelText = 'Bank Account Number';
          } else if (/\b(ifsc)\b/i.test(rawAttr)) {
            labelText = 'Bank IFSC Code';
          } else if (/\b(tax|tax_id)\b/i.test(rawAttr)) {
            labelText = 'Tax / Registration ID';
          } else if (/\b(vendor|company)\b/i.test(rawAttr)) {
            labelText = 'Company / Vendor Contact Name';
          } else {
            labelText = inferDescriptiveLabel(el.getAttribute('name') || el.id || '', el, idx);
          }
        }

        // Clean trailing colons and required stars
        labelText = labelText.replace(/[:*]+$/, '').trim();

        // Ensure no "Input Field" string ever leaks through
        if (!labelText || /input\s*field/i.test(labelText) || /^(input|field)\s*\d*$/i.test(labelText)) {
          labelText = inferDescriptiveLabel(el.getAttribute('name') || el.id || '', el, idx);
        }

        const type = (el.getAttribute('type') || (el.tagName === 'TEXTAREA' ? 'textarea' : 'text')) as any;
        parsed.push({
          id,
          label: labelText,
          type: type === 'password' ? 'text' : type,
          placeholder: el.getAttribute('placeholder') || undefined,
          required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
          category: 'Detected Form Fields',
        });
      });

      if (parsed.length > 0) {
        setCurrentFields(parsed);
        setCurrentTitle('Custom Parsed Web Form');
        setCurrentDomain('custom-web-page.local/form');
        setFieldValues({});
        setAutofilledFields({});
        setAutofillToast(`Parsed ${parsed.length} form fields with actual labels!`);
        setTimeout(() => setAutofillToast(null), 3500);
      } else {
        alert('Could not find any <input>, <select>, or <textarea> in the pasted HTML.');
      }
    } catch (e) {
      alert('Error parsing HTML form structure.');
    }
  };

  // Switch presets
  const handleSelectPreset = (idx: number) => {
    setActivePresetIndex(idx);
    setIsCustomMode(false);
    const preset = PRESET_ANY_FORMS[idx];
    setCurrentFields(preset.fields);
    setCurrentDomain(preset.domain);
    setCurrentTitle(preset.name);
    setFieldValues({});
    setAutofilledFields({});
    setActiveTooltipFieldId(null);
  };

  // Run Extension Autofill across ANY form
  const handleRunExtensionAutofill = async () => {
    setIsAutofilling(true);
    try {
      const profileData: Record<string, string> = {};
      activeProfile.fields.forEach((f) => {
        profileData[f.key] = f.value;
        profileData[f.label] = f.value;
      });

      const result = await suggestAutofill({
        formFields: currentFields,
        profileData,
        profileName: activeProfile.name,
      });

      const nextValues: Record<string, string> = { ...fieldValues };
      const nextFilled: Record<string, boolean> = { ...autofilledFields };

      const matchesList = Array.isArray(result?.matches)
        ? result.matches
        : Object.entries(result?.matches || {}).map(([k, v]: [string, any]) => ({
            fieldId: v?.fieldId || k,
            suggestedValue: v?.suggestedValue || v?.value || String(v),
          }));

      let count = 0;
      matchesList.forEach((m) => {
        if (m.fieldId && m.suggestedValue !== undefined && m.suggestedValue !== '') {
          nextValues[m.fieldId] = String(m.suggestedValue);
          nextFilled[m.fieldId] = true;
          count++;
        }
      });

      setFieldValues(nextValues);
      setAutofilledFields(nextFilled);
      setAutofillToast(`✨ FormSaathi autofilled ${count} fields from "${activeProfile.name}"!`);
      setTimeout(() => setAutofillToast(null), 4000);
    } catch (err) {
      console.error('Autofill error:', err);
      setAutofillToast('Failed to autofill. Please try again.');
      setTimeout(() => setAutofillToast(null), 3000);
    } finally {
      setIsAutofilling(false);
    }
  };

  // Autofill single field from profile
  const handleAutofillSingleField = (field: FormFieldDef) => {
    const pData: Record<string, string> = {};
    activeProfile.fields.forEach((f) => {
      pData[f.key] = f.value;
      pData[f.label] = f.value;
    });

    // Check direct key or match
    const raw = `${field.id} ${field.label} ${field.placeholder || ''}`.toLowerCase();
    for (const [k, v] of Object.entries(pData)) {
      if (!v) continue;
      const kLow = k.toLowerCase();
      if (raw.includes(kLow) || kLow.includes(field.id.toLowerCase())) {
        setFieldValues((prev) => ({ ...prev, [field.id]: v }));
        setAutofilledFields((prev) => ({ ...prev, [field.id]: true }));
        setAutofillToast(`Filled ${field.label} = ${v}`);
        setTimeout(() => setAutofillToast(null), 3000);
        return;
      }
    }
    // Fallback to first matching value or profile name
    if (raw.includes('name')) {
      const val = pData.fullName || activeProfile.name;
      setFieldValues((prev) => ({ ...prev, [field.id]: val }));
      setAutofilledFields((prev) => ({ ...prev, [field.id]: true }));
      setAutofillToast(`Filled ${field.label} = ${val}`);
      setTimeout(() => setAutofillToast(null), 3000);
    }
  };

  // Request field explanation tooltip on click of the extension badge
  const handleInspectField = async (field: FormFieldDef) => {
    setActiveTooltipFieldId(field.id);
    setIsLoadingTooltip(true);
    setTooltipData(null);

    const explanation = await explainFormField({
      fieldLabel: field.label,
      placeholder: field.placeholder,
      formTitle: currentTitle,
      language: currentLanguage,
    });

    setTooltipData(explanation);
    setIsLoadingTooltip(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                Universal Form Automation
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                Works on Any Website, Any Form, Any Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Extension Live Form Inspector & Autofiller
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Simulates the FormSaathi extension running inside any external browser tab. Inspects every form element on any page, injects assistant badges, explains criteria in {currentLanguage}, and autofills with one click.
            </p>
          </div>

          {/* Quick Extension Floating Button Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunExtensionAutofill}
              disabled={isAutofilling}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer hover:scale-102 disabled:opacity-60"
            >
              {isAutofilling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Matching Vault & Autofilling...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Autofill Entire Form from "{activeProfile.name}"</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Autofill Feedback Toast */}
        {autofillToast && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{autofillToast}</span>
          </div>
        )}

        {/* Tab switcher: Presets or Custom HTML Form */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
              Test on Website:
            </span>
            {PRESET_ANY_FORMS.map((preset, idx) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(idx)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  !isCustomMode && activePresetIndex === idx
                    ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx === 0 ? <Briefcase className="w-3.5 h-3.5" /> : idx === 1 ? <Plane className="w-3.5 h-3.5" /> : <Receipt className="w-3.5 h-3.5" />}
                <span>{preset.name.split('(')[0]}</span>
              </button>
            ))}

            <button
              onClick={() => {
                setIsCustomMode(true);
                parseCustomHtml(customHtmlInput);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isCustomMode
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Paste Custom Form HTML</span>
            </button>
          </div>

          <button
            onClick={() => {
              setFieldValues({});
              setAutofilledFields({});
            }}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Inputs</span>
          </button>
        </div>
      </div>

      {/* Custom HTML Input Drawer */}
      {isCustomMode && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Paste Any Web Form HTML (From Any Website)
              </h3>
            </div>
            <button
              onClick={() => parseCustomHtml(customHtmlInput)}
              className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
            >
              Parse & Detect Inputs
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Copy the HTML of any form from any website (e.g. Google Forms, LinkedIn, visa portal, municipal services) and paste it below. FormSaathi will automatically extract all fields and map them to your profile.
          </p>
          <textarea
            rows={5}
            value={customHtmlInput}
            onChange={(e) => setCustomHtmlInput(e.target.value)}
            className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 bg-slate-50 focus:outline-hidden focus:border-indigo-600"
          />
        </div>
      )}

      {/* Simulated Browser Window Frame */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden">
        {/* Browser Top Bar & Omnibox */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>

          {/* Browser Address Bar */}
          <div className="flex-1 max-w-xl mx-auto bg-white border border-slate-200 rounded-lg px-3 py-1 flex items-center gap-2 text-xs text-slate-600 shadow-2xs font-mono">
            <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-emerald-600 font-bold">https://</span>
            <span className="truncate">{currentDomain}</span>
          </div>

          {/* Extension Icon in Browser Bar */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 text-xs font-bold shadow-2xs"
              title="FormSaathi Extension Active in this Tab"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">FormSaathi Active</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>

        {/* Webpage Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{currentTitle}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentFields.length} interactive fields detected by FormSaathi extension.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                Target Profile: <strong className="text-indigo-700">{activeProfile.name}</strong>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
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
              {currentFields.some((f) => fieldValues[f.id]?.trim() && !findProfileField(f.id, f.label)) && (
                <button
                  type="button"
                  onClick={handleSyncAllNewFields}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Save New Fields to Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Form Fields with FormSaathi Extension Badge on every field */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {currentFields.map((field) => {
                const isAutofilled = autofilledFields[field.id];
                const value = fieldValues[field.id] || '';
                const isInspectingThis = activeTooltipFieldId === field.id;

                const profileMatch = findProfileField(field.id, field.label);
                const isInProfile = !!profileMatch;
                const isSyncAdded = fieldSyncStatus[field.id] === 'added';
                const isSyncUpdated = fieldSyncStatus[field.id] === 'updated';
                const isProfileValueDifferent = isInProfile && profileMatch.value !== value && value.trim() !== '';

                return (
                  <div
                    key={field.id}
                    className={`space-y-1 relative ${
                      field.type === 'textarea' || field.id.includes('address') ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <label htmlFor={field.id} className="text-xs font-semibold text-slate-800 block">
                        {field.label} {field.required && <span className="text-rose-500 font-bold">*</span>}
                      </label>

                      {/* Profile Presence & Sync Badges */}
                      <div className="flex items-center gap-1.5">
                        {isAutofilled && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 font-semibold px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
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
                          value.trim() ? (
                            <button
                              type="button"
                              onClick={() => handleExplicitSaveToProfile(field, value)}
                              className="text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded font-bold border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Add this new field to active profile"
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
                            onClick={() => handleExplicitSaveToProfile(field, value)}
                            className="text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded font-bold border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                            title={`Update saved value to "${value}"`}
                          >
                            <RefreshCw className="w-2.5 h-2.5 text-indigo-600" />
                            <span>Update Profile</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                            <span>In Profile</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Input with embedded FormSaathi extension button on the right */}
                    <div className="relative">
                      {field.type === 'select' ? (
                        <select
                          id={field.id}
                          name={field.id}
                          aria-label={`${field.label}${field.required ? ' *' : ''}`}
                          data-field-label={`${field.label}${field.required ? ' *' : ''}`}
                          value={value}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                          className={`w-full text-xs sm:text-sm rounded-lg border px-3 py-2 pr-9 bg-white transition-all focus:outline-hidden ${
                            isAutofilled
                              ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-200'
                              : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <option value="">-- Choose option --</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          id={field.id}
                          name={field.id}
                          aria-label={`${field.label}${field.required ? ' *' : ''}`}
                          data-field-label={`${field.label}${field.required ? ' *' : ''}`}
                          rows={3}
                          value={value}
                          placeholder={field.placeholder}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                          className={`w-full text-xs sm:text-sm rounded-lg border px-3 py-2 pr-9 bg-white transition-all focus:outline-hidden ${
                            isAutofilled
                              ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-200'
                              : 'border-slate-300 hover:border-slate-400'
                          }`}
                        />
                      ) : (
                        <input
                          id={field.id}
                          name={field.id}
                          type={field.type}
                          aria-label={`${field.label}${field.required ? ' *' : ''}`}
                          data-field-label={`${field.label}${field.required ? ' *' : ''}`}
                          value={value}
                          placeholder={field.placeholder}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                          className={`w-full text-xs sm:text-sm rounded-lg border px-3 py-2 pr-9 bg-white transition-all focus:outline-hidden ${
                            isAutofilled
                              ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-200'
                              : 'border-slate-300 hover:border-slate-400'
                          }`}
                        />
                      )}

                      {/* Injected FormSaathi Extension Sparkle Icon inside the input */}
                      <button
                        type="button"
                        onClick={() => handleInspectField(field)}
                        className={`absolute right-2 top-2 p-1 rounded-md transition-all ${
                          isInspectingThis
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-indigo-600 hover:bg-indigo-50 bg-white border border-indigo-100 shadow-2xs'
                        }`}
                        title="FormSaathi AI: Explain or Fill this field"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Inline Field Guidance Tooltip when user clicks the extension badge */}
                    {isInspectingThis && (
                      <div className="mt-2 p-3 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-2 text-xs animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            FormSaathi Assistant ({currentLanguage})
                          </span>
                          <button
                            onClick={() => setActiveTooltipFieldId(null)}
                            className="text-slate-400 hover:text-slate-600 font-bold px-1"
                          >
                            ×
                          </button>
                        </div>

                        {isLoadingTooltip ? (
                          <div className="space-y-1 animate-pulse">
                            <div className="h-2.5 bg-indigo-200 rounded w-full" />
                            <div className="h-2.5 bg-indigo-200 rounded w-3/4" />
                          </div>
                        ) : tooltipData ? (
                          <div className="space-y-1.5 text-indigo-950">
                            <p className="font-medium text-slate-800">{tooltipData.explanation}</p>
                            <p className="text-[11px] text-indigo-700 bg-white p-2 rounded border border-indigo-100">
                              💡 {tooltipData.tip}
                            </p>
                            {tooltipData.example && (
                              <div className="text-[11px] text-slate-500">
                                Example format: <code className="font-mono text-indigo-700 font-semibold">{tooltipData.example}</code>
                              </div>
                            )}

                            <div className="pt-1 flex items-center justify-between border-t border-indigo-100/70">
                              <span className="text-[10px] text-slate-500">
                                Match available in: <strong>{activeProfile.name}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAutofillSingleField(field)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>Fill This Field</span>
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Simulated Submit Button on the target page */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>FormSaathi guarantees you retain control before final submission.</span>
              </div>

              <button
                type="button"
                onClick={() => alert(`Simulated submission completed for ${currentTitle}!`)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Submit Form on {currentDomain.split('/')[0]}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
