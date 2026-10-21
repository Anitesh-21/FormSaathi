import React, { useState, useEffect } from 'react';
import {
  Minimize2,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  FileText,
  FileCheck,
  RefreshCw,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { compressImage, CompressionResult, formatFileSize } from '../utils/compression';

interface DocumentCompressorProps {
  initialFile?: File | null;
  initialTargetKb?: number;
  onAttachToForm?: (fileBlob: Blob, fileName: string) => void;
}

export const DocumentCompressor: React.FC<DocumentCompressorProps> = ({
  initialFile,
  initialTargetKb,
  onAttachToForm,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile || null);
  const [targetSizeKb, setTargetSizeKb] = useState<number>(initialTargetKb || 100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Common official portal presets
  const TARGET_PRESETS = [
    { label: 'Signature / Thumb (20 KB)', value: 20 },
    { label: 'Passport Photo / SSC (50 KB)', value: 50 },
    { label: 'NSP Scholarship Bonafide (100 KB)', value: 100 },
    { label: 'UPSC / State CET Marksheet (200 KB)', value: 200 },
    { label: 'Standard Document (500 KB)', value: 500 },
  ];

  // Set initial file if provided
  useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    }
  }, [initialFile]);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalPreviewUrl(e.target?.result as string);
      runCompression(file, targetSizeKb);
    };
    reader.readAsDataURL(file);
  };

  const runCompression = async (file: File, targetKb: number) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await compressImage(file, {
        targetSizeKb: targetKb,
        outputFormat: 'image/jpeg',
      });
      setResult(res);
    } catch (err: any) {
      console.error('Compression failed:', err);
      setErrorMessage(err.message || 'Failed to compress document. Please ensure it is a valid image/scan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePresetClick = (presetKb: number) => {
    setTargetSizeKb(presetKb);
    if (selectedFile) {
      runCompression(selectedFile, presetKb);
    }
  };

  // Helper to load sample certificate for testing
  const handleLoadSample = (sampleType: 'bonafide' | 'income') => {
    // Generate sample document on canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 2200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw realistic official certificate
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, 1600, 2200);

    // Border
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 12;
    ctx.strokeRect(40, 40, 1520, 2120);

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, 1490, 2090);

    // Header
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      sampleType === 'bonafide'
        ? 'GOVERNMENT ENGINEERING COLLEGE, JAIPUR'
        : 'OFFICE OF THE TEHSILDAR / REVENUE AUTHORITY',
      800,
      180
    );

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#4338CA';
    ctx.fillText(
      sampleType === 'bonafide' ? 'BONAFIDE & ENROLLMENT CERTIFICATE' : 'INCOME CERTIFICATE (FY 2026-27)',
      800,
      270
    );

    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`Certificate Ref No: CERT/RAJ/2026/094821 • Date: 12/04/2026`, 800, 340);

    // Body
    ctx.textAlign = 'left';
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#1E293B';
    const lines =
      sampleType === 'bonafide'
        ? [
            'This is to certify that Ms. Ananya Sharma, Daughter of Shri Suresh Kumar Sharma,',
            'is a bonafide student of this institution admitted in B.Tech Computer Science & Engg,',
            'for the academic session 2025-2029 under Student Enrollment Number 24ETBCS042.',
            'Her Institute AISHE Code is C-24901 and college is recognized by AICTE / UGC.',
            '',
            'This certificate is issued on her request for the purpose of applying to the',
            'National Scholarship Portal (NSP) Post-Matric Merit Scheme.',
          ]
        : [
            'This is to certify that after due inquiry by the Revenue Patwari and verification of records,',
            'the total annual income of the family of Shri Suresh Kumar Sharma,',
            'residing at House No. 42, Sector 14, Jaipur, District Jaipur, Rajasthan,',
            'from all verified agricultural, business and other sources is Rs. 2,40,000/-',
            '(Rupees Two Lakh Forty Thousand Only) per annum for the Financial Year 2025-26.',
            '',
            'This certificate is valid for scholarship, higher education and welfare schemes.',
          ];

    let y = 480;
    lines.forEach((l) => {
      ctx.fillText(l, 120, y);
      y += 55;
    });

    // Stamps & Signatures
    ctx.fillStyle = '#1E40AF';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('OFFICIAL SEAL & SIGNATURE', 1100, 1800);
    ctx.font = '22px sans-serif';
    ctx.fillText('Authorized Signatory', 1100, 1845);

    // Convert canvas to File
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File(
          [blob],
          sampleType === 'bonafide' ? 'Sample_Bonafide_Certificate.jpg' : 'Sample_Income_Certificate.jpg',
          { type: 'image/jpeg' }
        );
        handleFileSelected(file);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = `compressed_${targetSizeKb}kb_${selectedFile?.name || 'document.jpg'}`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Intelligent Document Utility
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs font-medium text-slate-500">
            Meets strict portal limits (100KB, 50KB, 20KB)
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
          Integrated File Compressor
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
          Shrink educational certificates, identity proofs, photos, and signatures to exact government portal upload limits while preserving visual clarity and document readability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Column (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-6">
          {/* File Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              1. Select Document or Image
            </label>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors bg-slate-50/50">
              <input
                type="file"
                id="compressor-file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelected(f);
                }}
                className="hidden"
              />
              <label
                htmlFor="compressor-file"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-7 h-7 text-indigo-600" />
                <div className="text-xs font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Upload File to Compress'}
                </div>
                <p className="text-[11px] text-slate-500">
                  JPG, PNG, WebP • Current Size:{' '}
                  {selectedFile ? formatFileSize(selectedFile.size / 1024) : 'Up to 25 MB'}
                </p>
              </label>
            </div>

            {/* Quick Demo Preloads */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">Or test with authentic sample:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLoadSample('bonafide')}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                >
                  Bonafide (1.8MB)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('income')}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                >
                  Income Cert (1.6MB)
                </button>
              </div>
            </div>
          </div>

          {/* Target File Size Controls */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                2. Target Portal Size Limit
              </label>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {targetSizeKb} KB
              </span>
            </div>

            {/* Presets buttons */}
            <div className="grid grid-cols-1 gap-1.5">
              {TARGET_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetClick(preset.value)}
                  className={`px-3 py-2 text-xs text-left rounded-lg border transition-all flex items-center justify-between ${
                    targetSizeKb === preset.value
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-1 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className="text-slate-400 font-mono text-[11px]">Max {preset.value} KB</span>
                </button>
              ))}
            </div>

            {/* Custom slider */}
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Custom Target: 10 KB</span>
                <span className="font-semibold text-slate-800">{targetSizeKb} KB</span>
                <span>1000 KB</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="5"
                value={targetSizeKb}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setTargetSizeKb(val);
                  if (selectedFile) runCompression(selectedFile, val);
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Action Button */}
          {selectedFile && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => runCompression(selectedFile, targetSizeKb)}
                disabled={isProcessing}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Compressing File...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Re-Calculate at {targetSizeKb} KB</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Preview & Verification Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Side-by-Side Compression Comparison</span>
            </h2>
            {result && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                -{result.reductionPercentage}% Reduced
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {!selectedFile ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Minimize2 className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
              <div className="text-xs font-bold text-slate-700">No document selected</div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Upload a certificate or click "Bonafide (1.8MB)" on the left to see instant visual compression.
              </p>
            </div>
          ) : isProcessing ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
              <div className="text-xs font-bold text-slate-800">
                Iterating compression engine to reach &le; {targetSizeKb} KB...
              </div>
              <p className="text-[11px] text-slate-400">
                Optimizing pixel matrix and quantization table...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Original</div>
                  <div className="text-sm font-bold text-slate-700 mt-0.5">
                    {formatFileSize(result.originalSizeKb)}
                  </div>
                </div>

                <div className="border-x border-slate-200">
                  <div className="text-[10px] text-indigo-600 font-semibold uppercase">Compressed</div>
                  <div className="text-sm font-bold text-indigo-700 mt-0.5">
                    {formatFileSize(result.compressedSizeKb)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-emerald-600 font-semibold uppercase">Reduction</div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    {result.reductionPercentage}% Saved
                  </div>
                </div>
              </div>

              {/* Readability Assessment Alert */}
              {result.isReadabilityWarning ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Readability Warning: </span>
                    High compression factor ({result.qualityUsed}% quality). Please inspect the preview below to ensure certificate numbers, seals, and dates are still legible before uploading to official portals.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong className="font-bold">Safe for Submission: </strong>
                    Visual clarity preserved ({result.qualityUsed}% quality, {result.width}x{result.height}px).
                  </span>
                </div>
              )}

              {/* Image Preview Box */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center p-2 max-h-80">
                <img
                  src={result.dataUrl}
                  alt="Compressed preview"
                  className="max-h-76 w-auto object-contain rounded shadow-xs"
                />
              </div>

              {/* Download & Attach Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download ({formatFileSize(result.compressedSizeKb)})</span>
                </button>

                {onAttachToForm && (
                  <button
                    type="button"
                    onClick={() => {
                      onAttachToForm(result.blob, `compressed_${selectedFile.name}`);
                      alert('Compressed document attached to active form!');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Attach to Active Form</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
