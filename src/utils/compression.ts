import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { jsPDF } from 'jspdf';

// Configure pdfjs worker in browser environment
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  } catch (e) {
    console.warn('pdfjs worker initialization error:', e);
  }
}

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  reductionPercentage: number;
  width: number;
  height: number;
  qualityUsed: number;
  isReadabilityWarning: boolean;
  format: string;
  pageCount?: number;
  thumbnailUrl?: string;
  isPdf?: boolean;
}

/**
 * Compresses an image file with iterative quality and dimensional scaling
 * to hit an exact target size (in KB) or quality factor.
 */
export async function compressImage(
  file: File | Blob,
  options: {
    targetSizeKb?: number;
    initialQuality?: number;
    maxWidth?: number;
    maxHeight?: number;
    outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
  } = {}
): Promise<CompressionResult> {
  const originalSizeKb = file.size / 1024;
  const targetKb = options.targetSizeKb;
  const format = options.outputFormat || (file.type === 'image/png' ? 'image/jpeg' : (file.type as any) || 'image/jpeg');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        let currentWidth = img.width;
        let currentHeight = img.height;

        // Scale down if dimensions are huge
        const maxDim = 2400;
        if (currentWidth > maxDim || currentHeight > maxDim) {
          const ratio = Math.min(maxDim / currentWidth, maxDim / currentHeight);
          currentWidth = Math.round(currentWidth * ratio);
          currentHeight = Math.round(currentHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable'));

        // Fill white background for JPEGs (in case source had transparency)
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, currentWidth, currentHeight);
        }
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

        // If target size is specified, perform binary/iterative search to reach target
        if (targetKb && targetKb > 0) {
          let low = 0.05;
          let high = 0.98;
          let bestBlob: Blob | null = null;
          let bestQuality = 0.8;
          let bestDataUrl = '';

          // Iterations of binary search on quality
          for (let i = 0; i < 7; i++) {
            const mid = (low + high) / 2;
            const testBlob: Blob = await new Promise((res) => {
              canvas.toBlob((b) => res(b || new Blob()), format, mid);
            });

            const testKb = testBlob.size / 1024;
            bestBlob = testBlob;
            bestQuality = mid;

            if (testKb > targetKb) {
              high = mid;
            } else {
              low = mid;
            }
          }

          // If still larger than targetKb, scale canvas dimensions down
          if (bestBlob && bestBlob.size / 1024 > targetKb) {
            let scaleFactor = 0.8;
            while (scaleFactor > 0.25 && bestBlob && bestBlob.size / 1024 > targetKb) {
              const scaledW = Math.round(currentWidth * scaleFactor);
              const scaledH = Math.round(currentHeight * scaleFactor);
              const scaledCanvas = document.createElement('canvas');
              scaledCanvas.width = scaledW;
              scaledCanvas.height = scaledH;
              const sCtx = scaledCanvas.getContext('2d');
              if (sCtx) {
                if (format === 'image/jpeg') {
                  sCtx.fillStyle = '#FFFFFF';
                  sCtx.fillRect(0, 0, scaledW, scaledH);
                }
                sCtx.drawImage(img, 0, 0, scaledW, scaledH);
                bestBlob = await new Promise((res) => {
                  scaledCanvas.toBlob((b) => res(b || new Blob()), format, Math.max(0.4, bestQuality));
                });
                currentWidth = scaledW;
                currentHeight = scaledH;
              }
              scaleFactor -= 0.15;
            }
          }

          const compressedSizeKb = (bestBlob?.size || 0) / 1024;
          const reduction = Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100));
          bestDataUrl = await blobToDataUrl(bestBlob!);

          const isWarning = bestQuality < 0.35 || compressedSizeKb < 15;

          resolve({
            blob: bestBlob!,
            dataUrl: bestDataUrl,
            originalSizeKb: Math.round(originalSizeKb * 10) / 10,
            compressedSizeKb: Math.round(compressedSizeKb * 10) / 10,
            reductionPercentage: reduction,
            width: currentWidth,
            height: currentHeight,
            qualityUsed: Math.round(bestQuality * 100),
            isReadabilityWarning: isWarning,
            format,
            thumbnailUrl: bestDataUrl,
            isPdf: false,
          });
        } else {
          // Fixed quality mode
          const quality = options.initialQuality ?? 0.75;
          canvas.toBlob(async (blob) => {
            if (!blob) return reject(new Error('Compression produced empty output'));
            const compressedSizeKb = blob.size / 1024;
            const reduction = Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100));
            const dataUrl = await blobToDataUrl(blob);

            resolve({
              blob,
              dataUrl,
              originalSizeKb: Math.round(originalSizeKb * 10) / 10,
              compressedSizeKb: Math.round(compressedSizeKb * 10) / 10,
              reductionPercentage: reduction,
              width: currentWidth,
              height: currentHeight,
              qualityUsed: Math.round(quality * 100),
              isReadabilityWarning: quality < 0.35,
              format,
              thumbnailUrl: dataUrl,
              isPdf: false,
            });
          }, format, quality);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an official PDF document (single or multi-page)
 * down to the required portal KB limits while preserving document legibility.
 */
export async function compressPdf(
  file: File | Blob,
  options: {
    targetSizeKb?: number;
    initialQuality?: number;
  } = {}
): Promise<CompressionResult> {
  const originalSizeKb = file.size / 1024;
  const targetKb = options.targetSizeKb;

  // 1. Read arrayBuffer from PDF file
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) {
    throw new Error('PDF file contains no readable pages.');
  }

  // 2. Render each page to an offscreen canvas at high clarity
  const pageCanvases: HTMLCanvasElement[] = [];
  let firstPageWidth = 0;
  let firstPageHeight = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    // Fill solid white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    if (pageNum === 1) {
      firstPageWidth = canvas.width;
      firstPageHeight = canvas.height;
    }
    pageCanvases.push(canvas);
  }

  const thumbnailUrl = pageCanvases[0].toDataURL('image/jpeg', 0.85);

  // Helper to construct a compressed PDF from page canvases at given quality & scale
  const renderPdfBlob = async (quality: number, scaleFactor: number): Promise<Blob> => {
    const isLandscape = firstPageWidth > firstPageHeight;
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    for (let i = 0; i < pageCanvases.length; i++) {
      const srcCanvas = pageCanvases[i];
      let workingCanvas = srcCanvas;

      if (scaleFactor < 1) {
        workingCanvas = document.createElement('canvas');
        workingCanvas.width = Math.max(100, Math.round(srcCanvas.width * scaleFactor));
        workingCanvas.height = Math.max(100, Math.round(srcCanvas.height * scaleFactor));
        const wCtx = workingCanvas.getContext('2d');
        if (wCtx) {
          wCtx.fillStyle = '#FFFFFF';
          wCtx.fillRect(0, 0, workingCanvas.width, workingCanvas.height);
          wCtx.drawImage(srcCanvas, 0, 0, workingCanvas.width, workingCanvas.height);
        }
      }

      const imgData = workingCanvas.toDataURL('image/jpeg', quality);

      if (i > 0) {
        doc.addPage('a4', workingCanvas.width > workingCanvas.height ? 'landscape' : 'portrait');
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    }

    return doc.output('blob');
  };

  let bestBlob: Blob | null = null;
  let bestQuality = options.initialQuality ?? 0.75;
  let bestScale = 1.0;

  // 3. If target size is specified, binary search on JPEG quality
  if (targetKb && targetKb > 0) {
    let low = 0.05;
    let high = 0.95;

    for (let step = 0; step < 7; step++) {
      const mid = (low + high) / 2;
      const testBlob = await renderPdfBlob(mid, 1.0);
      bestBlob = testBlob;
      bestQuality = mid;

      if (testBlob.size / 1024 > targetKb) {
        high = mid;
      } else {
        low = mid;
      }
    }

    // If still larger than targetKb, scale canvas dimensions
    if (bestBlob && bestBlob.size / 1024 > targetKb) {
      let scale = 0.85;
      while (scale >= 0.25 && bestBlob && bestBlob.size / 1024 > targetKb) {
        bestScale = scale;
        bestBlob = await renderPdfBlob(Math.max(0.35, bestQuality), scale);
        scale -= 0.15;
      }
    }
  } else {
    bestBlob = await renderPdfBlob(bestQuality, 1.0);
  }

  const compressedSizeKb = (bestBlob?.size || 0) / 1024;
  const reduction = Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100));
  const dataUrl = URL.createObjectURL(bestBlob!);

  const isWarning = bestQuality < 0.35 || bestScale < 0.6 || compressedSizeKb < (15 * numPages);

  return {
    blob: bestBlob!,
    dataUrl,
    originalSizeKb: Math.round(originalSizeKb * 10) / 10,
    compressedSizeKb: Math.round(compressedSizeKb * 10) / 10,
    reductionPercentage: reduction,
    width: Math.round(firstPageWidth * bestScale),
    height: Math.round(firstPageHeight * bestScale),
    qualityUsed: Math.round(bestQuality * 100),
    isReadabilityWarning: isWarning,
    format: 'application/pdf',
    pageCount: numPages,
    thumbnailUrl,
    isPdf: true,
  };
}

/**
 * Universal document compression router: handles both image formats and PDF files.
 */
export async function compressDocument(
  file: File | Blob,
  options: {
    targetSizeKb?: number;
    initialQuality?: number;
    maxWidth?: number;
    maxHeight?: number;
    outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  } = {}
): Promise<CompressionResult> {
  const isPdf =
    file.type === 'application/pdf' ||
    (file instanceof File && file.name.toLowerCase().endsWith('.pdf'));

  if (isPdf) {
    return compressPdf(file, options);
  }
  return compressImage(file, {
    targetSizeKb: options.targetSizeKb,
    initialQuality: options.initialQuality,
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    outputFormat: options.outputFormat === 'application/pdf' ? 'image/jpeg' : options.outputFormat,
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function formatFileSize(kb: number): string {
  if (kb < 1) return `${Math.round(kb * 1024)} B`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb.toFixed(1)} KB`;
}
