import React, { useState, useEffect } from 'react';
import {
  Minimize2,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
  FileCheck,
  RefreshCw,
  Eye,
  FileCode,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { compressDocument, CompressionResult, formatFileSize } from '../utils/compression';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfPreviewTab, setPdfPreviewTab] = useState<'thumbnail' | 'embed'>('thumbnail');

  // Common official portal presets
  const TARGET_PRESETS = [
    { label: 'Signature / Thumb (20 KB)', value: 20 },
    { label: 'Passport Photo / SSC (50 KB)', value: 50 },
    { label: 'NSP Scholarship Bonafide PDF (100 KB)', value: 100 },
    { label: 'UPSC / State CET Marksheet PDF (200 KB)', value: 200 },
    { label: 'Standard Official PDF (500 KB)', value: 500 },
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
    runCompression(file, targetSizeKb);
  };

  const runCompression = async (file: File, targetKb: number) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await compressDocument(file, {
        targetSizeKb: targetKb,
      });
      setResult(res);
    } catch (err: any) {
      console.error('Compression failed:', err);
      setErrorMessage(
        err.message || 'Failed to compress document. Please ensure it is a valid PDF or image file.'
      );
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

  // Helper to load sample documents (including real PDF certificates) for testing
  const handleLoadSample = (sampleType: 'bonafide-pdf' | 'marksheet-pdf' | 'income-img') => {
    // Generate sample certificate canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 2200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Realistic certificate background
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, 1600, 2200);

    // Border
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 14;
    ctx.strokeRect(40, 40, 1520, 2120);

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, 1490, 2090);

    // Header
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 46px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      sampleType === 'bonafide-pdf'
        ? 'RAJASTHAN TECHNICAL UNIVERSITY, KOTA'
        : sampleType === 'marksheet-pdf'
        ? 'CENTRAL BOARD OF SECONDARY EDUCATION'
        : 'GOVERNMENT REVENUE AUTHORITY',
      800,
      180
    );

    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = '#4338CA';
    ctx.fillText(
      sampleType === 'bonafide-pdf'
        ? 'OFFICIAL BONAFIDE & INSTITUTIONAL ENROLLMENT CERTIFICATE'
        : sampleType === 'marksheet-pdf'
        ? 'SENIOR SCHOOL CERTIFICATE EXAMINATION MARKSHEET'
        : 'INCOME CERTIFICATE (FY 2025-2026)',
      800,
      270
    );

    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`Certificate No: CERT/IN/2026/094821 • Verification UID: 8291-0392-1940`, 800, 340);

    // Body
    ctx.textAlign = 'left';
    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#1E293B';
    const lines =
      sampleType === 'bonafide-pdf'
        ? [
            'This is to certify that Mr. Anitesh Kumar Singh, Son of Shri Suresh Kumar Singh,',
            'is a bonafide student of this institution admitted in B.Tech Computer Science & Engg,',
            'for the academic session 2025-2029 under Enrollment Number 24ETBCS042.',
            'Institute AISHE Code: C-24901. Recognized by AICTE & UGC.',
            '',
            'This certificate is issued on student request for upload to the',
            'National Scholarship Portal (NSP) Central Sector Scheme application.',
          ]
        : sampleType === 'marksheet-pdf'
        ? [
            'Candidate Name: Anitesh Kumar Singh | Roll No: 22140938',
            "Mother's Name: Sunita Singh | Father's Name: Suresh Kumar Singh",
            'School: St. Xavier Senior Secondary School (Affiliation No: 1730192)',
            '',
            'Subject 1: English Core (301) - Theory: 91 | Practical: 20 | Total: 91/100 (A1)',
            'Subject 2: Mathematics (041) - Theory: 94 | Practical: 20 | Total: 94/100 (A1)',
            'Subject 3: Physics (042) - Theory: 65 | Practical: 29 | Total: 94/100 (A1)',
            'Subject 4: Chemistry (043) - Theory: 62 | Practical: 28 | Total: 90/100 (A1)',
            'Subject 5: Computer Science (083) - Theory: 68 | Practical: 30 | Total: 98/100 (A1)',
            '',
            'Result: PASS • Aggregate: 93.4% • Issued by Authority on 22/05/2022',
          ]
        : [
            'Certified that after verification of records, the total annual income of the family of',
            'Shri Suresh Kumar Singh, residing at Sector 14, Jaipur, Rajasthan,',
            'from all agricultural and business sources is Rs. 2,40,000/- per annum.',
          ];

    let y = 470;
    lines.forEach((l) => {
      ctx.fillText(l, 120, y);
      y += 54;
    });

    // Official Stamp
    ctx.fillStyle = '#1E40AF';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('GOVERNMENT EMBLEM & SIGNATURE', 1050, 1800);
    ctx.font = '22px sans-serif';
    ctx.fillText('Authorized Registrar & Controller of Exams', 1050, 1845);

    if (sampleType === 'bonafide-pdf' || sampleType === 'marksheet-pdf') {
      // Build a multi-kilobyte PDF
      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.96);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      doc.addImage(imgDataUrl, 'JPEG', 0, 0, pw, ph, undefined, 'FAST');
      const pdfBlob = doc.output('blob');

      const fileName =
        sampleType === 'bonafide-pdf'
          ? 'Bonafide_Enrollment_Certificate.pdf'
          : 'Class_XII_CBSE_Marksheet.pdf';

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      handleFileSelected(pdfFile);
    } else {
      // Image sample
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'Income_Certificate_Scan.jpg', { type: 'image/jpeg' });
          handleFileSelected(file);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleDownload = () => {
    if (!result || !selectedFile) return;
    const a = document.createElement('a');
    a.href = result.dataUrl;
    const isPdf = result.isPdf || result.format === 'application/pdf';
    const ext = isPdf ? 'pdf' : result.format === 'image/png' ? 'png' : 'jpg';
    const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '');
    a.download = `${cleanName}_compressed.${ext}`;
    a.click();
  };

  const isCurrentFilePdf = selectedFile && (
    selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            Intelligent Document &amp; PDF Utility
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs font-medium text-slate-500">
            Meets strict portal limits (100KB, 50KB, 200KB)
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
          Universal File &amp; PDF Compressor
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
          Shrink official PDF documents (marksheets, scholarship bonafides, caste/income certificates) and images (photos, signatures) down to exact portal upload limits while preserving visual clarity, government stamps, and legibility.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Column (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-6">
          {/* File Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              1. Select PDF Document or Image
            </label>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors bg-slate-50/50">
              <input
                type="file"
                id="compressor-file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
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
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  {isCurrentFilePdf ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Upload PDF or Image to Compress'}
                </div>
                <p className="text-[11px] text-slate-500">
                  PDF, JPG, PNG, WebP • Current Size:{' '}
                  {selectedFile ? formatFileSize(selectedFile.size / 1024) : 'Up to 25 MB'}
                </p>
                {isCurrentFilePdf && (
                  <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
                    PDF Document Selected
                  </span>
                )}
              </label>
            </div>

            {/* Quick Demo Preloads */}
            <div className="pt-2 flex flex-col gap-1.5 text-xs text-slate-500">
              <span className="text-[11px] font-semibold text-slate-600">Or test with authentic portal files:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLoadSample('bonafide-pdf')}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileText className="w-3 h-3 text-rose-600" />
                  <span>Bonafide (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('marksheet-pdf')}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileText className="w-3 h-3 text-rose-600" />
                  <span>Marksheet (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('income-img')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileCheck className="w-3 h-3 text-indigo-600" />
                  <span>Income Scan (JPG)</span>
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
                &le; {targetSizeKb} KB
              </span>
            </div>

            {/* Presets buttons */}
            <div className="grid grid-cols-1 gap-1.5">
              {TARGET_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetClick(preset.value)}
                  className={`px-3 py-2 text-xs text-left rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
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
                    <span>Compressing {isCurrentFilePdf ? 'PDF' : 'File'}...</span>
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
              <span>
                {result?.isPdf ? 'PDF Document Preview & Verification' : 'Compression Comparison'}
              </span>
            </h2>
            {result && (
              <div className="flex items-center gap-2">
                {result.isPdf && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    PDF Document ({result.pageCount || 1} {result.pageCount === 1 ? 'Page' : 'Pages'})
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  -{result.reductionPercentage}% Reduced
                </span>
              </div>
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
                Upload a PDF certificate or click "Bonafide (PDF)" on the left to see instant document compression.
              </p>
            </div>
          ) : isProcessing ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
              <div className="text-xs font-bold text-slate-800">
                Compressing {isCurrentFilePdf ? 'PDF pages' : 'image'} to reach &le; {targetSizeKb} KB...
              </div>
              <p className="text-[11px] text-slate-400">
                Applying optimal quantization and page compression...
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
                  <div className="text-[10px] text-indigo-600 font-semibold uppercase">
                    Compressed ({result.isPdf ? 'PDF' : result.format.replace('image/', '').toUpperCase()})
                  </div>
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
                    Visual clarity preserved ({result.qualityUsed}% quality
                    {result.pageCount ? `, ${result.pageCount} page(s)` : `, ${result.width}x${result.height}px`}).
                  </span>
                </div>
              )}

              {/* PDF Preview Switcher (if PDF) */}
              {result.isPdf && (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Preview Mode:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPdfPreviewTab('thumbnail')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        pdfPreviewTab === 'thumbnail'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Page View
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfPreviewTab('embed')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        pdfPreviewTab === 'embed'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Interactive PDF Reader
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Box */}
              {result.isPdf && pdfPreviewTab === 'embed' ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 h-80">
                  <iframe
                    src={result.dataUrl}
                    title="Compressed PDF Preview"
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center p-2 max-h-80 relative">
                  <img
                    src={result.thumbnailUrl || result.dataUrl}
                    alt="Compressed document preview"
                    className="max-h-76 w-auto object-contain rounded shadow-xs"
                  />
                  {result.isPdf && (
                    <div className="absolute top-3 right-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                      <FileText className="w-3 h-3 text-amber-300" />
                      <span>PDF Document</span>
                    </div>
                  )}
                </div>
              )}

              {/* Download & Attach Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    Download {result.isPdf ? 'PDF' : result.format.replace('image/', '').toUpperCase()} ({formatFileSize(result.compressedSizeKb)})
                  </span>
                </button>

                {onAttachToForm && (
                  <button
                    type="button"
                    onClick={() => {
                      const ext = result.isPdf ? 'pdf' : result.format === 'image/png' ? 'png' : 'jpg';
                      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '');
                      onAttachToForm(result.blob, `${cleanName}_compressed.${ext}`);
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
