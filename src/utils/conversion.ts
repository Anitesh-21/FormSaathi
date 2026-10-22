import { blobToDataUrl } from './compression';

export interface ConversionResult {
  blob: Blob;
  dataUrl: string;
  outputFormat: 'jpeg' | 'png' | 'webp' | 'rtf' | 'txt' | 'html';
  outputFileName: string;
  sizeKb: number;
  previewUrl: string;
  width?: number;
  height?: number;
}

export interface ImageConversionOptions {
  fileName?: string;
  targetFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
  backgroundColor?: 'white' | 'transparent' | 'none';
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Converts an image between standard web and portal image formats (PNG, JPG/JPEG, WebP)
 * with background filling (e.g. solid white for portal signatures/photos) and resolution presets.
 */
export async function convertImageFormat(
  file: File | Blob,
  options: ImageConversionOptions = {}
): Promise<ConversionResult> {
  const targetFormat = options.targetFormat || 'image/jpeg';
  const quality = options.quality ?? 0.92;
  const dataUrl = await blobToDataUrl(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const finalWidth = options.width || img.width;
      const finalHeight = options.height || img.height;

      const canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      // Solid white background for portals requiring JPG/no transparency
      if (options.backgroundColor === 'white' || targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, finalWidth, finalHeight);
      }

      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      canvas.toBlob(
        async (blob) => {
          if (!blob) return reject(new Error('Image conversion failed'));
          const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/png' ? 'png' : 'webp';
          const baseName = (options.fileName || (file instanceof File ? file.name : 'converted_image'))
            .replace(/\.[^/.]+$/, '');
          const outputFileName = `${baseName}.${ext}`;
          const outputDataUrl = URL.createObjectURL(blob);

          resolve({
            blob,
            dataUrl: outputDataUrl,
            outputFormat: ext as any,
            outputFileName,
            sizeKb: Math.round((blob.size / 1024) * 10) / 10,
            previewUrl: outputDataUrl,
            width: finalWidth,
            height: finalHeight,
          });
        },
        targetFormat,
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to read image for format conversion'));
    img.src = dataUrl;
  });
}

/**
 * Converts text / statement / self-declaration into a formal Word/RTF document (.rtf),
 * formatted HTML document (.html), or plain statement (.txt) for official submissions.
 * (Note: PDF output has been completely removed in accordance with portal requirements).
 */
export async function convertTextToDocument(
  title: string,
  content: string,
  format: 'rtf' | 'txt' | 'html' = 'rtf',
  applicantName?: string
): Promise<ConversionResult> {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const cleanBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  if (format === 'rtf') {
    // Rich Text Format (RTF) - Opens natively in MS Word, LibreOffice, WordPad, Apple Pages
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}{\\f1\\fnil\\fcharset0 Times New Roman;}}
{\\colortbl ;\\red30\\green41\\blue59;\\red67\\green56\\blue202;\\red100\\green116\\blue139;}
\\viewkind4\\uc1\\pard\\cf1\\b\\f0\\fs28 ${title.toUpperCase()}\\par
\\cf2\\b0\\fs18 OFFICIAL DECLARATION & STATEMENT OF UNDERTAKING\\par
\\cf3\\fs16 FormSaathi Document Engine \\bullet Generated on ${dateStr}\\par
\\line\\par
\\cf0\\fs22 ${content.replace(/\n/g, '\\par\n')}\\par
\\line\\line\\par
\\b APPLICANT CONFIRMATION & VERIFICATION\\b0\\par
\\fs18 Full Legal Name: ${applicantName || 'Applicant'}\\par
Date: ${dateStr}\\par
Status: Certified Valid Declaration\\par
}`;

    const blob = new Blob([rtfContent], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const fileName = `${cleanBase}.rtf`;

    return {
      blob,
      dataUrl: url,
      outputFormat: 'rtf',
      outputFileName: fileName,
      sizeKb: Math.round((blob.size / 1024) * 10) / 10,
      previewUrl: url,
    };
  }

  if (format === 'html') {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 24px; color: #1e293b; line-height: 1.6; }
    .header { border-bottom: 2px solid #4338ca; padding-bottom: 12px; margin-bottom: 24px; }
    h1 { color: #0f172a; margin: 0 0 6px 0; font-size: 22px; text-transform: uppercase; }
    .badge { font-size: 12px; color: #4338ca; font-weight: 600; }
    .content { font-size: 14px; white-space: pre-wrap; margin: 24px 0; }
    .footer { margin-top: 48px; border-top: 1px solid #cbd5e1; padding-top: 16px; font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="badge">OFFICIAL DECLARATION & STATEMENT OF UNDERTAKING</div>
    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">FormSaathi Document Engine • Date: ${dateStr}</div>
  </div>
  <div class="content">${content}</div>
  <div class="footer">
    <p><strong>Applicant Name:</strong> ${applicantName || 'Applicant'}</p>
    <p><strong>Submission Date:</strong> ${dateStr}</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const fileName = `${cleanBase}.html`;

    return {
      blob,
      dataUrl: url,
      outputFormat: 'html',
      outputFileName: fileName,
      sizeKb: Math.round((blob.size / 1024) * 10) / 10,
      previewUrl: url,
    };
  }

  // Plain Text format (.txt)
  const textContent = `${title.toUpperCase()}
=====================================================
OFFICIAL DECLARATION & STATEMENT OF UNDERTAKING
Date: ${dateStr}
Applicant: ${applicantName || 'Applicant'}
-----------------------------------------------------

${content}

-----------------------------------------------------
Signature / Verification: Electronically Certified
Date of Generation: ${dateStr}
=====================================================`;

  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const fileName = `${cleanBase}.txt`;

  return {
    blob,
    dataUrl: url,
    outputFormat: 'txt',
    outputFileName: fileName,
    sizeKb: Math.round((blob.size / 1024) * 10) / 10,
    previewUrl: url,
  };
}
