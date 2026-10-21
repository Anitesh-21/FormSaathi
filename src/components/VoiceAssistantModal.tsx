import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Globe,
  Radio,
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { askVoiceAssistant, speakWithTTS } from '../services/api';

interface VoiceAssistantModalProps {
  currentLanguage: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  onClose: () => void;
  onApplyVoiceValue?: (fieldKey: string, value: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  currentLanguage,
  onChangeLanguage,
  onClose,
  onApplyVoiceValue,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [extractedValue, setExtractedValue] = useState<string | null>(null);
  const [nextAdvice, setNextAdvice] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Web Speech API recognition instance
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;

      // Map language code
      const langCodeMap: Record<string, string> = {
        Hindi: 'hi-IN',
        English: 'en-IN',
        Bengali: 'bn-IN',
        Marathi: 'mr-IN',
        Tamil: 'ta-IN',
        Telugu: 'te-IN',
        Gujarati: 'gu-IN',
        Kannada: 'kn-IN',
        Punjabi: 'pa-IN',
        Malayalam: 'ml-IN',
        Odia: 'or-IN',
        Urdu: 'ur-IN',
      };
      recog.lang = langCodeMap[currentLanguage] || 'hi-IN';

      recog.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(text);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recog.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, [currentLanguage]);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setAssistantResponse(null);
      setExtractedValue(null);
      if (recognition) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (e) {
          console.warn('Error starting speech recognition:', e);
        }
      } else {
        // Simulated voice prompt if speech recognition is unsupported in iframe/browser
        const demoTranscripts: Record<string, string> = {
          Hindi: 'Mera naam Ananya Sharma hai aur 10th ka roll number 14102984 hai',
          English: 'What is the difference between creamy layer and non-creamy layer OBC?',
          Bengali: 'আমার নাম অনন্যা শর্মা, ডোমিশাইল সার্টিফিকেট কি?',
          Marathi: 'माझा दहावीचा रोल नंबर कसा भरायचा?',
        };
        const sample = demoTranscripts[currentLanguage] || demoTranscripts.Hindi;
        setTranscript(sample);
      }
    }
  };

  const handleSendTranscript = async (queryText?: string) => {
    const textToSend = queryText || transcript;
    if (!textToSend.trim()) return;

    setIsProcessing(true);
    setAssistantResponse(null);

    try {
      const data = await askVoiceAssistant({
        transcript: textToSend,
        language: currentLanguage,
      });

      setAssistantResponse(data.spokenResponse);
      setExtractedValue(data.extractedValue || null);
      setNextAdvice(data.nextStepAdvice);

      // Play audio response automatically
      playSpokenAudio(data.spokenResponse);
    } catch (err) {
      console.error('Voice assist error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const playSpokenAudio = async (text: string) => {
    setIsPlayingAudio(true);
    const audioUrl = await speakWithTTS(text, currentLanguage);

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => fallbackSpeak(text);
      audio.play().catch(() => fallbackSpeak(text));
    } else {
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  const SAMPLE_VOICE_QUERIES = [
    {
      label: 'Mera naam Ananya Sharma hai (Dictate details)',
      text: 'Mera naam Ananya Sharma hai aur mera date of birth 15 September 2004 hai',
    },
    {
      label: 'Domicile certificate kya hota hai? (Ask for guidance)',
      text: 'Yeh domicile certificate kya hota hai aur ise kon banata hai?',
    },
    {
      label: 'Non-Creamy Layer criteria? (Reservation query)',
      text: 'OBC non creamy layer me aane ke liye family income limit kya hoti hai?',
    },
    {
      label: 'Class 10th Roll number kaha milega?',
      text: 'Form me 10th board roll number pucha hai, yeh marksheet me kaha likha hota hai?',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center text-amber-300 border border-indigo-400/30">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Multilingual Voice Companion</h3>
              <p className="text-[11px] text-indigo-200">
                Language: <span className="font-semibold text-white">{currentLanguage}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white text-xl px-2 font-bold">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Mic Button & Waveform */}
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <button
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white ring-8 ring-rose-100 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'
              }`}
            >
              {isListening ? <Radio className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8" />}
            </button>

            <div>
              <div className="font-bold text-sm text-slate-800">
                {isListening ? 'Listening in ' + currentLanguage + '...' : 'Tap to Speak'}
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                Speak your question or dictate your name, date of birth, roll number, or address.
              </p>
            </div>
          </div>

          {/* Transcript Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Your Speech Transcript:</span>
              {transcript && (
                <button onClick={() => setTranscript('')} className="text-slate-400 hover:text-slate-600">
                  Clear
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your spoken words will appear here, or you can edit/type directly..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:outline-hidden focus:border-indigo-600"
            />
          </div>

          {/* Quick Query Pills */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Quick Voice Examples:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_VOICE_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(q.text);
                    handleSendTranscript(q.text);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium text-left transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Send Button */}
          {transcript && (
            <button
              onClick={() => handleSendTranscript()}
              disabled={isProcessing}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Processing Voice...' : 'Ask FormSaathi AI'}</span>
            </button>
          )}

          {/* Assistant Vocal Response */}
          {assistantResponse && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  FormSaathi Spoken Answer:
                </span>
                <button
                  onClick={() => playSpokenAudio(assistantResponse)}
                  className="p-1 rounded bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                  title="Re-play Audio"
                >
                  {isPlayingAudio ? (
                    <VolumeX className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                </button>
              </div>

              <p className="text-slate-800 text-xs leading-relaxed font-medium">
                {assistantResponse}
              </p>

              {extractedValue && (
                <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">
                    Extracted Field Value:{' '}
                    <strong className="text-indigo-800 font-mono">{extractedValue}</strong>
                  </span>
                  {onApplyVoiceValue && (
                    <button
                      onClick={() => {
                        onApplyVoiceValue('custom', extractedValue);
                        onClose();
                      }}
                      className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-bold hover:bg-indigo-700"
                    >
                      Insert in Form
                    </button>
                  )}
                </div>
              )}

              {nextAdvice && (
                <p className="text-[11px] text-indigo-700 italic">
                  💡 {nextAdvice}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            FormSaathi Multilingual Speech & Natural Audio
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
