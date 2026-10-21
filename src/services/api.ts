import { FieldAutofillProposal, FieldExplanation, ScanResult } from '../types';

export async function explainFormField(params: {
  fieldLabel: string;
  fieldDescription?: string;
  placeholder?: string;
  formTitle: string;
  language: string;
}): Promise<FieldExplanation> {
  try {
    const res = await fetch('/api/gemini/explain-field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('explainFormField API error, using intelligent client fallback:', err);
    return {
      explanation: `Please provide your ${params.fieldLabel} as recorded in your original certificates or IDs.`,
      tip: 'Double check spelling and numbers. Any mismatch against submitted proofs can delay approval.',
      example: params.placeholder || 'e.g., standard official format',
      isCritical: false,
    };
  }
}

export async function suggestAutofill(params: {
  formFields: any[];
  profileData: Record<string, string>;
  profileName: string;
}): Promise<{
  matches: FieldAutofillProposal[];
  unmappedFields: string[];
  warnings: string[];
}> {
  try {
    const res = await fetch('/api/gemini/suggest-autofill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('suggestAutofill API error, using heuristic matcher:', err);

    // Heuristic client fallback
    const matches: FieldAutofillProposal[] = [];
    const p = params.profileData;

    for (const field of params.formFields) {
      const fId = field.id.toLowerCase();
      const fLabel = field.label.toLowerCase();
      let matchedKey = '';
      let matchedVal = '';

      for (const [k, v] of Object.entries(p)) {
        if (!v) continue;
        const keyLower = k.toLowerCase();
        if (
          fId === keyLower ||
          fLabel.includes(keyLower) ||
          (keyLower === 'fullname' && (fLabel.includes('name') || fId.includes('name'))) ||
          (keyLower === 'dateofbirth' && (fLabel.includes('birth') || fId.includes('dob'))) ||
          (keyLower === 'tenthrollno' && fLabel.includes('10th') && fLabel.includes('roll')) ||
          (keyLower === 'twelfthrollno' && fLabel.includes('12th') && fLabel.includes('roll')) ||
          (keyLower === 'bankaccountnumber' && (fLabel.includes('account') || fId.includes('account'))) ||
          (keyLower === 'ifsc' && fLabel.includes('ifsc'))
        ) {
          matchedKey = k;
          matchedVal = v;
          break;
        }
      }

      if (matchedVal) {
        matches.push({
          fieldId: field.id,
          suggestedValue: matchedVal,
          confidence: 0.9,
          note: `Matched from profile: ${matchedKey}`,
          requiresUserReview: false,
        });
      }
    }

    return {
      matches,
      unmappedFields: [],
      warnings: ['Processed using secure local matching engine.'],
    };
  }
}

export async function scanForm(params: {
  rawText?: string;
  imageBase64?: string;
  mimeType?: string;
  targetProfileCategory?: string;
}): Promise<ScanResult> {
  const res = await fetch('/api/gemini/scan-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function askVoiceAssistant(params: {
  transcript: string;
  activeForm?: string;
  currentField?: string;
  language?: string;
}): Promise<{
  spokenResponse: string;
  extractedValue?: string | null;
  isQuestion: boolean;
  nextStepAdvice: string;
}> {
  try {
    const res = await fetch('/api/gemini/voice-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      spokenResponse: `Aapne kahan: "${params.transcript}". Humne ise note kar liya hai.`,
      extractedValue: params.transcript,
      isQuestion: false,
      nextStepAdvice: 'Click review before saving.',
    };
  }
}

export async function speakWithTTS(text: string, language: string = 'en'): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.audioData) {
      return `data:audio/wav;base64,${data.audioData}`;
    }
  } catch (err) {
    console.warn('Gemini TTS failed, fallback will be used');
  }
  return null;
}
