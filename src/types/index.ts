export type SupportedLanguage =
  | 'English'
  | 'Hindi'
  | 'Bengali'
  | 'Marathi'
  | 'Tamil'
  | 'Telugu'
  | 'Gujarati'
  | 'Kannada'
  | 'Malayalam'
  | 'Punjabi'
  | 'Odia'
  | 'Urdu';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export interface ProfileField {
  id: string;
  key: string;
  label: string;
  value: string;
  category: 'Personal' | 'Academic' | 'Contact & Address' | 'Identity & Documents' | 'Financial & Bank' | 'Employment';
  isSensitive?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  category: 'Personal' | 'Academic' | 'Job Application' | 'Family Member' | 'Government Scheme';
  description?: string;
  lastUpdated: string;
  fields: ProfileField[];
}

export type FieldInputType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'select'
  | 'textarea'
  | 'file';

export interface FormFieldDef {
  id: string;
  label: string;
  type: FieldInputType;
  placeholder?: string;
  options?: string[];
  required: boolean;
  helpText?: string;
  category: string;
  acceptedFileTypes?: string;
  maxFileSizeKb?: number;
  expectedFormat?: string; // e.g. "DD/MM/YYYY", "11 digits IFSC"
}

export interface FormTemplate {
  id: string;
  title: string;
  portalName: string;
  portalType: 'Scholarship' | 'Admission' | 'Government' | 'Job Application';
  description: string;
  estimatedTime: string;
  deadline?: string;
  fields: FormFieldDef[];
}

export interface FieldAutofillProposal {
  fieldId: string;
  suggestedValue: string;
  confidence: number;
  note: string;
  requiresUserReview: boolean;
  sourceProfileKey?: string;
  approved?: boolean;
}

export interface FieldExplanation {
  explanation: string;
  tip: string;
  example: string;
  isCritical: boolean;
}

export interface ScannedFieldResult {
  key: string;
  label: string;
  value: string;
  category: string;
  confidence: number;
  selected?: boolean;
}

export interface ScanResult {
  suggestedProfileName: string;
  category: string;
  summary: string;
  extractedFields: ScannedFieldResult[];
  flags?: string[];
}
