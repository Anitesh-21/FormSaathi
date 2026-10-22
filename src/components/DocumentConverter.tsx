import React, { useState } from 'react';
import {
  FileCode,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
  Layers,
  FileDown,
  FileCheck,
} from 'lucide-react';
import { convertImageFormat, convertTextToDocument, ConversionResult } from '../utils/conversion';
import { formatFileSize } from '../utils/compression';

export const DocumentConverter: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'image-converter' | 'text-to-doc'>('image-converter');

  // Image conversion state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [backgroundColor, setBackgroundColor] = useState<'white' | 'transparent'>('white');
  const [dimensionPreset, setDimensionPreset] = useState<'original' | 'passport' | 'signature' | 'hd'>('original');
  const [qualityLevel, setQualityLevel] = useState<number>(0.92);

  // Text / Statement to Word/RTF document state
  const [statementTitle, setStatementTitle] = useState('SELF DECLARATION & UNDERTAKING');
  const [documentOutputFormat, setDocumentOutputFormat] = useState<'rtf' | 'txt' | 'html'>('rtf');
  const [applicantName, setApplicantName] = useState('Anitesh Kumar Singh');
  const [statementBody, setStatementBody] = useState(
    `I hereby declare that all information, documents, and credentials furnished in my application form are authentic, true, and complete to the best of my knowledge and belief.\n\nI understand that in the event of any detail being found incorrect, fraudulent, or missing at any stage of verification, my candidature / admission / scholarship allotment shall stand cancelled automatically without prior notice.\n\nPlace of Declaration: Jaipur, Rajasthan\nBeneficiary Name: Anitesh Kumar Singh`
  );

  // Processing & result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageSelected = (file: File) => {
    setImageFile(file);
    setConversionResult(null);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConvertImage = async () => {
    if (!imageFile) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      let width: number | undefined;
      let height: number | undefined;

      if (dimensionPreset === 'passport') {
        width = 350;
        height = 450;
      } else if (dimensionPreset === 'signature') {
        width = 280;
        height = 100;
      } else if (dimensionPreset === 'hd') {
        width = 1920;
        height = 1080;
      }

      const res = await convertImageFormat(imageFile, {
        targetFormat,
        backgroundColor,
        width,
        height,
        quality: qualityLevel,
      });
      setConversionResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Image format conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertStatement = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await convertTextToDocument(
        statementTitle,
        statementBody,
        documentOutputFormat,
        applicantName
      );
      setConversionResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Document generation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!conversionResult) return;
    const a = document.createElement('a');
    a.href = conversionResult.dataUrl;
    a.download = conversionResult.outputFileName;
    a.click();
  };

  const handleLoadSampleStatement = (type: 'undertaking' | 'gap' | 'income') => {
    if (type === 'undertaking') {
      setStatementTitle('SELF DECLARATION & UNDERTAKING');
      setStatementBody(
        `I hereby declare that all information, documents, and credentials furnished in my application form are authentic, true, and complete to the best of my knowledge and belief.\n\nI understand that in the event of any detail being found incorrect, fraudulent, or missing at any stage of verification, my candidature / admission / scholarship allotment shall stand cancelled automatically without prior notice.\n\nPlace of Declaration: Jaipur, Rajasthan\nBeneficiary Name: ${applicantName}`
      );
    } else if (type === 'gap') {
      setStatementTitle('STUDY GAP AFFIDAVIT & DECLARATION');
      setStatementBody(
        `I, ${applicantName}, do hereby solemnly affirm and state that after completing my Senior Secondary (12th Board) examination in the year 2022, I had a gap period of one academic year (2022-2023) for competitive entrance examination preparation.\n\nDuring this gap period, I was neither admitted to any other regular college nor engaged in any unlawful activity. All supporting records are genuine.\n\nPlace: Jaipur, Rajasthan\nDeponent: ${applicantName}`
      );
    } else if (type === 'income') {
      setStatementTitle('ANNUAL FAMILY INCOME UNDERTAKING');
      setStatementBody(
        `I hereby certify that my family's gross annual income from all sources (Agriculture, Business, and Other) during the preceding Financial Year is less than INR 2,50,000 (Rupees Two Lakh Fifty Thousand Only).\n\nThis undertaking is furnished for the specific purpose of availing Post-Matric Fee Reimbursement under government regulations.\n\nPlace: Jaipur, Rajasthan\nApplicant: ${applicantName}`
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            Document & Image Converter
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs font-medium text-slate-500">
            PNG ⇄ JPG ⇄ WebP &amp; Word Documents (.doc / .rtf)
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
          Universal Format Converter (Images &amp; Documents)
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
          Convert document scans, photos, and signatures between PNG, JPG, and WebP with solid white background support for official portal uploads, or generate formatted Word / RTF statements (.doc / .rtf / .txt).
        </p>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setActiveMode('image-converter');
            setConversionResult(null);
            setErrorMessage(null);
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeMode === 'image-converter'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Image Converter (PNG ⇄ JPG ⇄ WebP)</span>
        </button>

        <button
          onClick={() => {
            setActiveMode('text-to-doc');
            setConversionResult(null);
            setErrorMessage(null);
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeMode === 'text-to-doc'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Statement to Word Document (.doc / .rtf / .txt)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5">
          {activeMode === 'image-converter' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  1. Select Image / Scan / Signature
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 hover:border-indigo-500 transition-colors">
                  <input
                    type="file"
                    id="img-upload-input"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/bmp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageSelected(f);
                    }}
                    className="hidden"
                  />
                  <label htmlFor="img-upload-input" className="cursor-pointer block">
                    <Upload className="w-7 h-7 mx-auto text-indigo-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900 block">
                      {imageFile ? imageFile.name : 'Choose Image (PNG, JPG, WebP, SVG, BMP)'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {imageFile ? formatFileSize(imageFile.size / 1024) : 'Max 25 MB • Secure local processing'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Target Format Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  2. Target Output Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { format: 'image/jpeg' as const, label: 'JPG / JPEG', desc: 'Standard for Portals' },
                    { format: 'image/png' as const, label: 'PNG', desc: 'Lossless Clarity' },
                    { format: 'image/webp' as const, label: 'WebP', desc: 'Modern Web' },
                  ].map((item) => (
                    <button
                      key={item.format}
                      type="button"
                      onClick={() => setTargetFormat(item.format)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        targetFormat === item.format
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-200'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color & Preset Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Background Color
                  </label>
                  <select
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="white">Solid White (Govt Portals)</option>
                    <option value="transparent">Transparent (PNG/WebP only)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    White removes black/alpha backgrounds on scanned signatures.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Dimension Preset
                  </label>
                  <select
                    value={dimensionPreset}
                    onChange={(e) => setDimensionPreset(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="original">Original Dimensions</option>
                    <option value="passport">Passport Photo (350 x 450 px)</option>
                    <option value="signature">Signature Crop (280 x 100 px)</option>
                    <option value="hd">Full HD (1920 x 1080 px)</option>
                  </select>
                </div>
              </div>

              {/* Quality Slider */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Quality Factor:</span>
                  <span className="font-bold text-indigo-700">{Math.round(qualityLevel * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={qualityLevel}
                  onChange={(e) => setQualityLevel(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleConvertImage}
                disabled={!imageFile || isProcessing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Converting Format...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      Convert to {targetFormat === 'image/jpeg' ? 'JPG' : targetFormat === 'image/png' ? 'PNG' : 'WebP'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeMode === 'text-to-doc' && (
            <div className="space-y-4">
              {/* Preset buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Quick Official Statement Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleLoadSampleStatement('undertaking')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    General Undertaking
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleStatement('gap')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Study Gap Affidavit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleStatement('income')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Income Declaration
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={statementTitle}
                    onChange={(e) => setStatementTitle(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                    placeholder="Statement title"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                    Applicant / Beneficiary Name
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                    placeholder="Applicant full name"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Statement Body / Undertaking Content
                </label>
                <textarea
                  rows={6}
                  value={statementBody}
                  onChange={(e) => setStatementBody(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono focus:border-indigo-600"
                  placeholder="Enter declaration text..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                  Output Document Format (Non-PDF)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { format: 'rtf' as const, label: 'Word (.doc / .rtf)', desc: 'Opens in MS Word' },
                    { format: 'txt' as const, label: 'Plain Text (.txt)', desc: 'Form Textareas' },
                    { format: 'html' as const, label: 'Web (.html)', desc: 'Printable Web Page' },
                  ].map((item) => (
                    <button
                      key={item.format}
                      type="button"
                      onClick={() => setDocumentOutputFormat(item.format)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        documentOutputFormat === item.format
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-200'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleConvertStatement}
                disabled={isProcessing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Formatted Document...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Generate Document ({documentOutputFormat.toUpperCase()})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Output & Preview Column (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Conversion Preview &amp; Verification</span>
            </h2>
            {conversionResult && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Ready: {conversionResult.outputFormat.toUpperCase()}
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {!conversionResult ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <FileDown className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
              <div className="text-xs font-bold text-slate-700">No output generated yet</div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Configure conversion parameters on the left and click Convert to inspect the result here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Successfully converted to {conversionResult.outputFormat.toUpperCase()}</span>
                </div>
                <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {formatFileSize(conversionResult.sizeKb)}
                </span>
              </div>

              {/* Preview Box */}
              {['jpg', 'jpeg', 'png', 'webp'].includes(conversionResult.outputFormat) ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center p-3 max-h-80">
                  <img
                    src={conversionResult.dataUrl}
                    alt="Converted output preview"
                    className="max-h-72 w-auto object-contain rounded shadow-xs"
                  />
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 font-mono text-xs max-h-80 overflow-y-auto space-y-2 text-slate-800">
                  <div className="text-[11px] font-bold text-indigo-700 pb-1 border-b border-slate-200">
                    File: {conversionResult.outputFileName}
                  </div>
                  <pre className="whitespace-pre-wrap">{statementBody}</pre>
                </div>
              )}

              {/* Download Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {conversionResult.outputFileName} ({formatFileSize(conversionResult.sizeKb)})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
