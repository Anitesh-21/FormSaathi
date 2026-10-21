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

          // 6 iterations of binary search on quality
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
