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
} from 'lucide-react';
import { convertImageToPdf, convertTextToPdf, convertImageFormat, ConversionResult } from '../utils/conversion';
import { formatFileSize } from '../utils/compression';

export const DocumentConverter: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'image-to-pdf' | 'text-to-pdf' | 'format-flip'>('image-to-pdf');

  // Image to PDF state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [headerTitle, setHeaderTitle] = useState('OFFICIAL ATTACHMENT & SUPPORTING CERTIFICATE');

  // Text to PDF state
  const [statementTitle, setStatementTitle] = useState('SELF DECLARATION / UNDERTAKING');
  const [statementBody, setStatementBody] = useState(
    `I hereby declare that all information furnished in my application form is true, complete and correct to the best of my knowledge and belief. I understand that in the event of any information being found false or incorrect at any stage, my candidature / scholarship shall stand cancelled automatically.\n\nPlace: Jaipur, Rajasthan\nBeneficiary: Anitesh Kumar Singh`
  );

  // Format flip state
  const [flipTarget, setFlipTarget] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageSelected = (file: File) => {
    setImageFile(file);
    setConversionResult(null);
    setErrorMessage(null);
  };

  const handleConvertImageToPdf = async () => {
    if (!imageFile) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await convertImageToPdf(imageFile, {
        fileName: imageFile.name,
        includeHeaderTitle: includeHeader ? headerTitle : undefined,
      });
      setConversionResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Image to PDF conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertTextToPdf = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await convertTextToPdf(statementTitle, statementBody, 'Anitesh Kumar Singh');
      setConversionResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Text to PDF conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormatFlip = async () => {
    if (!imageFile) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await convertImageFormat(imageFile, flipTarget);
      setConversionResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Format conversion failed');
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            Document Preparation Utility
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs font-medium text-slate-500">Official Portal Formats</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
          Universal File Format Converter
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
          Convert document scans, photos, and statements into strictly required portal formats like PDF or JPEG. All conversions execute securely on your device.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setActiveMode('image-to-pdf');
            setConversionResult(null);
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeMode === 'image-to-pdf'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Image / Photo to Official PDF</span>
        </button>

        <button
          onClick={() => {
            setActiveMode('text-to-pdf');
            setConversionResult(null);
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeMode === 'text-to-pdf'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Statement / Declaration to PDF</span>
        </button>

        <button
          onClick={() => {
            setActiveMode('format-flip');
            setConversionResult(null);
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeMode === 'format-flip'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>PNG &harr; JPG &harr; WebP</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5">
          {activeMode === 'image-to-pdf' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Select Image / Document Scan
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50">
                  <input
                    type="file"
                    id="img-to-pdf"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageSelected(f);
                    }}
                    className="hidden"
                  />
                  <label htmlFor="img-to-pdf" className="cursor-pointer block">
                    <Upload className="w-7 h-7 mx-auto text-indigo-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900 block">
                      {imageFile ? imageFile.name : 'Choose JPG, PNG, or WebP'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standard A4 output with margins
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeHeader"
                    checked={includeHeader}
                    onChange={(e) => setIncludeHeader(e.target.checked)}
                    className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="includeHeader" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Include Official Header Banner on Top
                  </label>
                </div>

                {includeHeader && (
                  <input
                    type="text"
                    value={headerTitle}
                    onChange={(e) => setHeaderTitle(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                    placeholder="Header banner title"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleConvertImageToPdf}
                disabled={!imageFile || isProcessing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Official PDF...</span>
                  </>
                ) : (
                  <>
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Convert to Official PDF</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeMode === 'text-to-pdf' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={statementTitle}
                  onChange={(e) => setStatementTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Statement Body Text
                </label>
                <textarea
                  rows={8}
                  value={statementBody}
                  onChange={(e) => setStatementBody(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleConvertTextToPdf}
                disabled={!statementBody.trim() || isProcessing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Generate Certified PDF</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeMode === 'format-flip' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Select Source File
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50">
                  <input
                    type="file"
                    id="flip-file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageSelected(f);
                    }}
                    className="hidden"
                  />
                  <label htmlFor="flip-file" className="cursor-pointer block">
                    <Upload className="w-7 h-7 mx-auto text-indigo-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900 block">
                      {imageFile ? imageFile.name : 'Choose File to Flip'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Target Format Required by Portal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { format: 'image/jpeg', label: 'JPG / JPEG' },
                    { format: 'image/png', label: 'PNG' },
                    { format: 'image/webp', label: 'WebP' },
                  ].map((f) => (
                    <button
                      key={f.format}
                      type="button"
                      onClick={() => setFlipTarget(f.format as any)}
                      className={`p-2 text-xs font-bold rounded-lg border text-center ${
                        flipTarget === f.format
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 text-slate-700 bg-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleFormatFlip}
                disabled={!imageFile || isProcessing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Converting Format...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Convert to {flipTarget === 'image/jpeg' ? 'JPG' : flipTarget === 'image/png' ? 'PNG' : 'WebP'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Preview / Output (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Conversion Result Preview</span>
            </h2>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {!conversionResult ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FileCode className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
              <div className="text-xs font-bold text-slate-700">Ready to Convert</div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Configure your document settings on the left and click convert to preview and download.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Successfully Converted!</span>
                </div>
                <span className="font-mono text-emerald-800 font-bold">
                  {formatFileSize(conversionResult.sizeKb)} • {conversionResult.outputFormat.toUpperCase()}
                </span>
              </div>

              {/* PDF or Image iframe/img preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 h-72 flex items-center justify-center">
                {conversionResult.outputFormat === 'pdf' ? (
                  <iframe
                    src={conversionResult.previewUrl}
                    title="PDF Preview"
                    className="w-full h-full border-none"
                  />
                ) : (
                  <img
                    src={conversionResult.previewUrl}
                    alt="Converted output"
                    className="max-h-68 max-w-full object-contain"
                  />
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono truncate max-w-xs">
                  {conversionResult.outputFileName}
                </span>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Converted File</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
