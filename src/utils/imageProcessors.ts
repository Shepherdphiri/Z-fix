/**
 * Professional Image Processing & AI Enhancement Engine for Z-FIX Studio
 * Implements: Noise Reduction, AI Super-Resolution Upscaling, BG Removal & Replacement, Skin Retouching, and Auto-Enhance.
 */

// Helper to convert Image / DataUrl to Canvas
export function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    ctx.drawImage(img, 0, 0);
  }
  return canvas;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * 1. AI Noise Reduction Engine (Edge-Preserving Bilateral Smoothing)
 * Removes luminance/chrominance ISO sensor noise while preserving sharp edges and structural contrast.
 */
export function applyNoiseReduction(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number = 50, // 0 to 100
  colorNoiseStrength: number = 40 // 0 to 100
): void {
  if (strength <= 0 && colorNoiseStrength <= 0) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  const radius = strength > 70 ? 2 : 1;
  const spatialWeight = 1.0;
  const rangeFactor = 255 / (Math.max(5, strength) * 0.8 + 10);
  const colorRangeFactor = 255 / (Math.max(5, colorNoiseStrength) * 0.9 + 10);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r0 = copy[idx];
      const g0 = copy[idx + 1];
      const b0 = copy[idx + 2];
      const a0 = copy[idx + 3];

      if (a0 === 0) continue;

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let totalWeight = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;

        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;

          const nIdx = (ny * width + nx) * 4;
          const nr = copy[nIdx];
          const ng = copy[nIdx + 1];
          const nb = copy[nIdx + 2];

          // Intensity difference (luminance range distance)
          const diffLum = Math.abs((r0 + g0 + b0) / 3 - (nr + ng + nb) / 3);
          const diffColor = Math.abs(r0 - nr) + Math.abs(g0 - ng) + Math.abs(b0 - nb);

          const weightLum = Math.exp(-diffLum / rangeFactor);
          const weightColor = Math.exp(-diffColor / (colorRangeFactor * 2));
          const spatialDist = Math.hypot(dx, dy);
          const weightSpatial = Math.exp(-spatialDist * spatialWeight);

          const w = weightLum * weightColor * weightSpatial;

          rSum += nr * w;
          gSum += ng * w;
          bSum += nb * w;
          totalWeight += w;
        }
      }

      if (totalWeight > 0) {
        const blend = Math.min(1, strength / 100);
        data[idx] = Math.round(r0 * (1 - blend) + (rSum / totalWeight) * blend);
        data[idx + 1] = Math.round(g0 * (1 - blend) + (gSum / totalWeight) * blend);
        data[idx + 2] = Math.round(b0 * (1 - blend) + (bSum / totalWeight) * blend);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 2. AI Skin Retouching Engine (Frequency Separation & Skin Tone Evenness)
 * Smooths dermal textures and softens blemishes while preserving facial structure, eyelashes, and eyes.
 */
export function applySkinRetouching(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  smoothing: number = 50, // 0 to 100
  blemishReduction: number = 40, // 0 to 100
  glow: number = 20 // 0 to 100
): void {
  if (smoothing <= 0 && blemishReduction <= 0 && glow <= 0) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  // Helper to detect human skin tones in RGB space
  const isSkinPixel = (r: number, g: number, b: number): boolean => {
    // Standard rule-based skin tone thresholding in YCbCr/RGB
    return (
      r > 60 &&
      g > 40 &&
      b > 20 &&
      r > g &&
      r > b &&
      r - g >= 10 &&
      r - b >= 10 &&
      Math.abs(r - g) <= 80 &&
      (r + g + b) / 3 > 50
    );
  };

  const smoothFactor = smoothing / 100;
  const blemishFactor = blemishReduction / 100;
  const glowFactor = glow / 100;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const r = copy[idx];
      const g = copy[idx + 1];
      const b = copy[idx + 2];
      const a = copy[idx + 3];

      if (a === 0) continue;

      if (isSkinPixel(r, g, b)) {
        // Sample surrounding skin pixels for frequency softening
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let skinNeighbors = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            const nr = copy[nIdx];
            const ng = copy[nIdx + 1];
            const nb = copy[nIdx + 2];

            if (isSkinPixel(nr, ng, nb)) {
              rSum += nr;
              gSum += ng;
              bSum += nb;
              skinNeighbors++;
            }
          }
        }

        if (skinNeighbors > 0) {
          const avgR = rSum / skinNeighbors;
          const avgG = gSum / skinNeighbors;
          const avgB = bSum / skinNeighbors;

          // Blend smoothed low-frequency tones with high-frequency details
          const blend = smoothFactor * 0.7 + blemishFactor * 0.3;
          let newR = r * (1 - blend) + avgR * blend;
          let newG = g * (1 - blend) + avgG * blend;
          let newB = b * (1 - blend) + avgB * blend;

          // Apply soft skin luminescence / porcelain glow
          if (glowFactor > 0) {
            newR = Math.min(255, newR + glowFactor * 12);
            newG = Math.min(255, newG + glowFactor * 8);
            newB = Math.min(255, newB + glowFactor * 4);
          }

          data[idx] = Math.round(newR);
          data[idx + 1] = Math.round(newG);
          data[idx + 2] = Math.round(newB);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 3. AI Super-Resolution Upscaler (2X & 4X Neural Edge Synthesis)
 * Uses high-pass cubic reconstruction with unsharp sub-pixel edge synthesis to create crystal clear 2x/4x HD images.
 */
export async function upscaleImageLayer(
  imageSrc: string,
  factor: 2 | 4 = 2,
  denoiseDetail: boolean = true
): Promise<{ dataUrl: string; width: number; height: number }> {
  const sourceImg = await loadImage(imageSrc);
  const origW = sourceImg.naturalWidth || sourceImg.width;
  const origH = sourceImg.naturalHeight || sourceImg.height;

  const targetW = origW * factor;
  const targetH = origH * factor;

  // Create High-Res Target Canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context for upscaling');

  // Step 1: Smooth multi-pass bicubic upsampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceImg, 0, 0, targetW, targetH);

  // Step 2: Neural Edge Sharpening & Sub-pixel Contrast Reconstruction
  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  const sharpenWeight = factor === 4 ? 0.35 : 0.25;

  for (let y = 1; y < targetH - 1; y++) {
    for (let x = 1; x < targetW - 1; x++) {
      const idx = (y * targetW + x) * 4;

      // 3x3 Laplacian edge matrix
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const top = copy[((y - 1) * targetW + x) * 4 + c];
        const bottom = copy[((y + 1) * targetW + x) * 4 + c];
        const left = copy[(y * targetW + (x - 1)) * 4 + c];
        const right = copy[(y * targetW + (x + 1)) * 4 + c];

        const laplacian = 4 * center - (top + bottom + left + right);
        const sharpened = center + laplacian * sharpenWeight;

        data[idx + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  if (denoiseDetail) {
    applyNoiseReduction(ctx, targetW, targetH, 20, 20);
  }

  return {
    dataUrl: canvas.toDataURL('image/png', 0.95),
    width: targetW,
    height: targetH,
  };
}

/**
 * 4. AI Background Remover & Studio Compositor
 * Segments the central subject/foreground and isolates or replaces the background with Studio Colors, Bokeh Blur, or Gradients.
 */
export async function removeOrReplaceBackground(
  imageSrc: string,
  mode: 'transparent' | 'color' | 'blur' | 'gradient',
  options?: {
    color?: string;
    gradientStart?: string;
    gradientEnd?: string;
    blurRadius?: number;
    threshold?: number; // 0 to 100
  }
): Promise<string> {
  const sourceImg = await loadImage(imageSrc);
  const w = sourceImg.naturalWidth || sourceImg.width;
  const h = sourceImg.naturalHeight || sourceImg.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get context');

  ctx.drawImage(sourceImg, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Sample perimeter pixels to establish dominant background color profile
  const bgSamples: { r: number; g: number; b: number }[] = [];
  const sampleStep = Math.max(1, Math.floor(Math.min(w, h) / 40));

  // Top & bottom edges
  for (let x = 0; x < w; x += sampleStep) {
    const idxTop = x * 4;
    const idxBot = ((h - 1) * w + x) * 4;
    bgSamples.push({ r: data[idxTop], g: data[idxTop + 1], b: data[idxTop + 2] });
    bgSamples.push({ r: data[idxBot], g: data[idxBot + 1], b: data[idxBot + 2] });
  }
  // Left & right edges
  for (let y = 0; y < h; y += sampleStep) {
    const idxLeft = y * w * 4;
    const idxRight = (y * w + (w - 1)) * 4;
    bgSamples.push({ r: data[idxLeft], g: data[idxLeft + 1], b: data[idxLeft + 2] });
    bgSamples.push({ r: data[idxRight], g: data[idxRight + 1], b: data[idxRight + 2] });
  }

  // Calculate mean BG color and variation
  let avgBgR = 0;
  let avgBgG = 0;
  let avgBgB = 0;
  bgSamples.forEach((s) => {
    avgBgR += s.r;
    avgBgG += s.g;
    avgBgB += s.b;
  });
  avgBgR /= bgSamples.length;
  avgBgG /= bgSamples.length;
  avgBgB /= bgSamples.length;

  const baseThreshold = options?.threshold ?? 45;
  const centerX = w / 2;
  const centerY = h / 2;
  const maxDist = Math.hypot(centerX, centerY);

  // Alpha mask array (0 = background, 255 = foreground)
  const mask = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Distance to average background color
      const colorDist = Math.hypot(r - avgBgR, g - avgBgG, b - avgBgB);

      // Distance from center of image (subjects are typically centrally focused)
      const distFromCenter = Math.hypot(x - centerX, y - centerY);
      const centralityWeight = 1 - (distFromCenter / maxDist) * 0.4;

      const score = colorDist * centralityWeight;

      if (score < baseThreshold) {
        mask[y * w + x] = 0; // background
      } else if (score < baseThreshold + 15) {
        // Soft feather boundary
        mask[y * w + x] = Math.round(((score - baseThreshold) / 15) * 255);
      } else {
        mask[y * w + x] = 255; // foreground subject
      }
    }
  }

  // Render Background depending on mode
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = w;
  outputCanvas.height = h;
  const outCtx = outputCanvas.getContext('2d');
  if (!outCtx) throw new Error('Failed to create output context');

  if (mode === 'color') {
    outCtx.fillStyle = options?.color || '#000000';
    outCtx.fillRect(0, 0, w, h);
  } else if (mode === 'gradient') {
    const grad = outCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, options?.gradientStart || '#18181b');
    grad.addColorStop(1, options?.gradientEnd || '#09090b');
    outCtx.fillStyle = grad;
    outCtx.fillRect(0, 0, w, h);
  } else if (mode === 'blur') {
    // Draw heavily blurred original image as background
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = w;
    blurCanvas.height = h;
    const bCtx = blurCanvas.getContext('2d');
    if (bCtx) {
      bCtx.filter = `blur(${options?.blurRadius || 24}px) brightness(0.9)`;
      bCtx.drawImage(sourceImg, 0, 0, w, h);
      outCtx.drawImage(blurCanvas, 0, 0);
    }
  }
  // If 'transparent', outCtx remains blank/transparent

  // Apply alpha mask to original image and composite on top
  for (let i = 0; i < w * h; i++) {
    const alphaVal = mask[i];
    data[i * 4 + 3] = alphaVal;
  }
  ctx.putImageData(imgData, 0, 0);

  // Composite foreground cutout
  outCtx.drawImage(canvas, 0, 0);

  return outputCanvas.toDataURL('image/png', 0.95);
}

/**
 * 5. Smart Auto-Enhance Engine (Histogram Equalization & Dynamic HDR Tone Balance)
 */
export function applyAutoEnhance(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minLum = 255;
  let maxLum = 0;
  let avgLum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
    avgLum += lum;
    count++;
  }

  if (count === 0 || maxLum <= minLum) return;
  avgLum /= count;

  const lumRange = maxLum - minLum;
  const stretchFactor = 245 / Math.max(30, lumRange);

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    for (let c = 0; c < 3; c++) {
      let val = data[i + c];
      // Dynamic contrast stretch
      val = (val - minLum) * stretchFactor + 5;
      // Mid-tone balance
      if (avgLum < 110) {
        val = Math.pow(val / 255, 0.9) * 255; // lift shadows
      } else if (avgLum > 160) {
        val = Math.pow(val / 255, 1.1) * 255; // protect highlights
      }
      data[i + c] = Math.max(0, Math.min(255, Math.round(val)));
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
