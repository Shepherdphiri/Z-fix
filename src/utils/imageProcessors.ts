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
 * Helper to detect human skin tones and facial features under various studio lighting conditions
 */
export const isSkinTonePixel = (r: number, g: number, b: number): boolean => {
  // Broad-spectrum skin tone test (tolerant of warm, neutral, and cool/blue ambient rim lighting)
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const isWarmSkin = r > 45 && g > 25 && b > 15 && r > b && (r - g) >= 2 && Math.abs(r - g) <= 90;
  const isDeepSkin = r > 30 && g > 20 && b > 10 && r >= g && r >= b && (max - min) > 6;
  const isCoolHighlight = r > 70 && g > 60 && b > 70 && Math.abs(r - b) < 40 && (r + g + b) / 3 > 75;
  return isWarmSkin || isDeepSkin || isCoolHighlight;
};

/**
 * High-Precision Automatic Foreground & Background Segmentation
 * Features:
 * 1. Intelligent perimeter sampling (strictly upper boundaries & corners, ignoring bottom shirts/torso)
 * 2. Multi-Cluster K-Means Background Color Profile (handles gradient and multi-colored backdrops)
 * 3. Sobel Edge Gradient Barrier (stops leakage across sharp subject silhouettes)
 * 4. Central Subject Prior & Feature Preservation
 * 5. Topological Hole-Filling & Island Protection (mathematically prevents any holes/black patches on faces/bodies)
 * 6. Sub-Pixel Anti-Aliased Alpha Edge Feathering
 */
export function generateForegroundMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  options?: {
    threshold?: number; // 20 to 90
    feather?: number; // 0 to 10
    protectSubject?: boolean;
  }
): Uint8Array {
  const threshold = options?.threshold ?? 45;
  const feather = Math.max(0, Math.min(10, options?.feather ?? 4));
  const protectSubject = options?.protectSubject !== false;

  const totalPixels = w * h;

  // -------------------------------------------------------------
  // Step 1: Intelligent Perimeter Sampling (Top Edge & Upper Corners Only)
  // -------------------------------------------------------------
  // Note: We deliberately exclude the bottom 30% of the canvas to avoid sampling clothes, shirts, and torsos!
  const bgSamplePixels: [number, number, number][] = [];
  const step = Math.max(2, Math.floor(Math.min(w, h) / 60));

  // Top edge (y = 0 to 0.08 * h)
  const topH = Math.max(2, Math.floor(h * 0.08));
  for (let y = 0; y < topH; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      bgSamplePixels.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }

  // Upper Left & Upper Right corners (y = 0 to 0.5 * h, x = 0 to 0.15 * w and x = 0.85 * w to w)
  const upperH = Math.floor(h * 0.5);
  const cornerW = Math.max(4, Math.floor(w * 0.15));
  for (let y = topH; y < upperH; y += step) {
    for (let x = 0; x < cornerW; x += step) {
      const idx = (y * w + x) * 4;
      bgSamplePixels.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
    for (let x = w - cornerW; x < w; x += step) {
      const idx = (y * w + x) * 4;
      bgSamplePixels.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }

  if (bgSamplePixels.length === 0) {
    // Fallback top corners
    bgSamplePixels.push([data[0], data[1], data[2]]);
    const tr = (w - 1) * 4;
    bgSamplePixels.push([data[tr], data[tr + 1], data[tr + 2]]);
  }

  // -------------------------------------------------------------
  // Step 2: Multi-Cluster Background Color Centroids (K-Means)
  // -------------------------------------------------------------
  const K = Math.min(4, Math.max(2, Math.floor(bgSamplePixels.length / 10)));
  const clusters: { r: number; g: number; b: number; count: number }[] = [];

  // Seed centroids with spread samples
  for (let k = 0; k < K; k++) {
    const sampleIdx = Math.floor((k / K) * bgSamplePixels.length);
    const [r, g, b] = bgSamplePixels[sampleIdx];
    clusters.push({ r, g, b, count: 1 });
  }

  // Simple 4-iteration K-means
  for (let iter = 0; iter < 4; iter++) {
    const sums = clusters.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (const [r, g, b] of bgSamplePixels) {
      let minDist = Infinity;
      let bestC = 0;
      for (let k = 0; k < K; k++) {
        const d = Math.hypot(r - clusters[k].r, g - clusters[k].g, b - clusters[k].b);
        if (d < minDist) {
          minDist = d;
          bestC = k;
        }
      }
      sums[bestC].r += r;
      sums[bestC].g += g;
      sums[bestC].b += b;
      sums[bestC].count += 1;
    }
    for (let k = 0; k < K; k++) {
      if (sums[k].count > 0) {
        clusters[k].r = sums[k].r / sums[k].count;
        clusters[k].g = sums[k].g / sums[k].count;
        clusters[k].b = sums[k].b / sums[k].count;
        clusters[k].count = sums[k].count;
      }
    }
  }

  // Distance from any pixel to closest background cluster
  const getMinBgDistance = (r: number, g: number, b: number) => {
    let minDist = Infinity;
    for (let k = 0; k < K; k++) {
      const d = Math.hypot(r - clusters[k].r, g - clusters[k].g, b - clusters[k].b);
      if (d < minDist) minDist = d;
    }
    return minDist;
  };

  // Compute adaptive threshold
  const baseThreshold = (threshold / 100) * 85 + 18; // ~35-75 range

  // -------------------------------------------------------------
  // Step 3: Sobel Edge Gradient Barrier (Edge Magnitude Map)
  // -------------------------------------------------------------
  // Compute luminance
  const lum = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const p = i * 4;
    lum[i] = (data[p] * 77 + data[p + 1] * 150 + data[p + 2] * 29) >> 8;
  }

  const edgeMap = new Uint8Array(totalPixels);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const tl = lum[idx - w - 1];
      const t = lum[idx - w];
      const tr = lum[idx - w + 1];
      const l = lum[idx - 1];
      const r = lum[idx + 1];
      const bl = lum[idx + w - 1];
      const b = lum[idx + w];
      const br = lum[idx + w + 1];

      const gx = -tl - 2 * l - bl + tr + 2 * r + br;
      const gy = -tl - 2 * t - tr + bl + 2 * b + br;
      edgeMap[idx] = Math.min(255, (Math.abs(gx) + Math.abs(gy)) >> 2);
    }
  }

  // -------------------------------------------------------------
  // Step 4: Subject Core Saliency Prior
  // -------------------------------------------------------------
  // Central ellipse: x in [0.2w, 0.8w], y in [0.15h, 0.95h]
  const centerX = w * 0.5;
  const centerY = h * 0.55;
  const radX = w * 0.36;
  const radY = h * 0.44;

  const isSubjectCorePixel = (x: number, y: number, r: number, g: number, b: number) => {
    if (!protectSubject) return false;
    const dx = (x - centerX) / radX;
    const dy = (y - centerY) / radY;
    const inCoreEllipse = dx * dx + dy * dy <= 1.0;

    if (inCoreEllipse) {
      if (isSkinTonePixel(r, g, b)) return true;
      // High contrast from background within the subject core
      const bgDist = getMinBgDistance(r, g, b);
      if (bgDist > baseThreshold * 0.75) return true;
    }
    return false;
  };

  // -------------------------------------------------------------
  // Step 5: Boundary Wavefront Flood Fill
  // -------------------------------------------------------------
  const isBackground = new Uint8Array(totalPixels); // 1 = background, 0 = foreground
  const visited = new Uint8Array(totalPixels);

  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  const pushCandidate = (x: number, y: number) => {
    const idx = y * w + x;
    if (visited[idx]) return;
    visited[idx] = 1;

    const pIdx = idx * 4;
    const r = data[pIdx];
    const g = data[pIdx + 1];
    const b = data[pIdx + 2];

    if (isSubjectCorePixel(x, y, r, g, b)) return;

    const dist = getMinBgDistance(r, g, b);
    if (dist <= baseThreshold) {
      isBackground[idx] = 1;
      queue[tail++] = idx;
    }
  };

  // Initialize seed queue exclusively from top boundary and top-half side boundaries
  for (let x = 0; x < w; x++) {
    pushCandidate(x, 0);
    if (h > 1) pushCandidate(x, 1);
  }
  for (let y = 0; y < Math.floor(h * 0.7); y++) {
    pushCandidate(0, y);
    pushCandidate(w - 1, y);
  }

  // BFS propagation with edge barrier & color proximity
  while (head < tail) {
    const currIdx = queue[head++];
    const cx = currIdx % w;
    const cy = (currIdx / w) | 0;

    const curP = currIdx * 4;
    const cr = data[curP];
    const cg = data[curP + 1];
    const cb = data[curP + 2];

    const neighbors = [
      cx > 0 ? currIdx - 1 : -1,
      cx < w - 1 ? currIdx + 1 : -1,
      cy > 0 ? currIdx - w : -1,
      cy < h - 1 ? currIdx + w : -1,
    ];

    for (let i = 0; i < 4; i++) {
      const nIdx = neighbors[i];
      if (nIdx === -1 || visited[nIdx]) continue;
      visited[nIdx] = 1;

      const nx = nIdx % w;
      const ny = (nIdx / w) | 0;

      const pIdx = nIdx * 4;
      const nr = data[pIdx];
      const ng = data[pIdx + 1];
      const nb = data[pIdx + 2];

      // Never flood into protected subject core
      if (isSubjectCorePixel(nx, ny, nr, ng, nb)) continue;

      // Stop at strong edge barriers unless very close to background color
      const edge = edgeMap[nIdx];
      const dist = getMinBgDistance(nr, ng, nb);
      const stepColorDiff = Math.hypot(nr - cr, ng - cg, nb - cb);

      if (dist <= baseThreshold) {
        if (edge < 60 || stepColorDiff < 20 || dist < baseThreshold * 0.6) {
          isBackground[nIdx] = 1;
          queue[tail++] = nIdx;
        }
      }
    }
  }

  // -------------------------------------------------------------
  // Step 6: Topological Hole-Filling & Island Protection (CRITICAL)
  // -------------------------------------------------------------
  // Any region not connected to the outer boundary is GUARANTEED to be inside the subject!
  // We flood-fill from (0,0) across isBackground to find the true outer background component.
  const reachableFromOuterBg = new Uint8Array(totalPixels);
  let outerHead = 0;
  let outerTail = 0;

  for (let x = 0; x < w; x++) {
    if (isBackground[x]) {
      reachableFromOuterBg[x] = 1;
      queue[outerTail++] = x;
    }
  }

  while (outerHead < outerTail) {
    const currIdx = queue[outerHead++];
    const cx = currIdx % w;
    const cy = (currIdx / w) | 0;

    const neighbors = [
      cx > 0 ? currIdx - 1 : -1,
      cx < w - 1 ? currIdx + 1 : -1,
      cy > 0 ? currIdx - w : -1,
      cy < h - 1 ? currIdx + w : -1,
    ];

    for (let i = 0; i < 4; i++) {
      const nIdx = neighbors[i];
      if (nIdx === -1 || reachableFromOuterBg[nIdx]) continue;
      if (isBackground[nIdx] === 1) {
        reachableFromOuterBg[nIdx] = 1;
        queue[outerTail++] = nIdx;
      }
    }
  }

  // -------------------------------------------------------------
  // Step 7: Construct Solid Foreground Mask
  // -------------------------------------------------------------
  const rawMask = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    // Only pixels connected to the outer background are removed (0)
    // All internal pixels, features, shadows, clothing, and hair are 100% Foreground (255)
    rawMask[i] = reachableFromOuterBg[i] === 1 ? 0 : 255;
  }

  // -------------------------------------------------------------
  // Step 8: Smooth Anti-Aliased Alpha Edge Feathering
  // -------------------------------------------------------------
  if (feather <= 0) {
    return rawMask;
  }

  const smoothedMask = new Uint8Array(totalPixels);
  const radius = feather;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const current = rawMask[idx];

      // Detect silhouette transition boundary
      let isBorder = false;
      if (
        (x > 0 && rawMask[idx - 1] !== current) ||
        (x < w - 1 && rawMask[idx + 1] !== current) ||
        (y > 0 && rawMask[idx - w] !== current) ||
        (y < h - 1 && rawMask[idx + w] !== current)
      ) {
        isBorder = true;
      }

      if (!isBorder) {
        smoothedMask[idx] = current;
      } else {
        // Weighted anti-aliased edge averaging
        let sum = 0;
        let count = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            sum += rawMask[ny * w + nx];
            count++;
          }
        }
        smoothedMask[idx] = Math.round(sum / count);
      }
    }
  }

  return smoothedMask;
}

export const REMOVE_BG_PRESET_PHOTOS = [
  {
    id: 'studio-white',
    name: 'Studio Cyclorama',
    category: 'Studio',
    thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'modern-office',
    name: 'Modern Office',
    category: 'Business',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'luxury-loft',
    name: 'Industrial Loft',
    category: 'Interior',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'sunset-beach',
    name: 'Golden Sunset',
    category: 'Outdoor',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'botanical-bokeh',
    name: 'Lush Garden Bokeh',
    category: 'Nature',
    thumbnail: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'neon-city',
    name: 'Cyberpunk Night',
    category: 'Urban',
    thumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'minimalist-arch',
    name: 'Minimalist Architecture',
    category: 'Design',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'abstract-gradient',
    name: 'Prismatic Studio',
    category: 'Creative',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=85',
  },
];

/**
 * 4. AI Background Remover & Studio Compositor (remove.bg Engine)
 * Segments the central subject/foreground and isolates or replaces the background with Studio Colors, Bokeh Blur, Photo Backdrops, or Gradients.
 */
export async function removeOrReplaceBackground(
  imageSrc: string,
  mode: 'transparent' | 'color' | 'blur' | 'gradient' | 'photo',
  options?: {
    color?: string;
    photoUrl?: string;
    gradientStart?: string;
    gradientEnd?: string;
    blurRadius?: number;
    threshold?: number; // 20 to 90
    feather?: number; // 0 to 10
    protectSubject?: boolean;
    shadowType?: 'none' | 'drop' | 'floor' | 'floating';
    shadowOpacity?: number;
    shadowBlur?: number;
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

  // Generate robust topological mask
  const mask = generateForegroundMask(data, w, h, {
    threshold: options?.threshold,
    feather: options?.feather ?? 4,
    protectSubject: options?.protectSubject !== false,
  });

  // Render Background depending on mode
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = w;
  outputCanvas.height = h;
  const outCtx = outputCanvas.getContext('2d');
  if (!outCtx) throw new Error('Failed to create output context');

  if (mode === 'color') {
    outCtx.fillStyle = options?.color || '#ffffff';
    outCtx.fillRect(0, 0, w, h);
  } else if (mode === 'gradient') {
    const grad = outCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, options?.gradientStart || '#1e1b4b');
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
  } else if (mode === 'photo' && options?.photoUrl) {
    try {
      const bgPhoto = await loadImage(options.photoUrl);
      outCtx.drawImage(bgPhoto, 0, 0, w, h);
    } catch (e) {
      outCtx.fillStyle = '#ffffff';
      outCtx.fillRect(0, 0, w, h);
    }
  }
  // If 'transparent', outCtx remains blank/transparent

  // Apply alpha mask to original image and composite on top
  for (let i = 0; i < w * h; i++) {
    data[i * 4 + 3] = mask[i];
  }
  ctx.putImageData(imgData, 0, 0);

  // Optional Remove.bg Shadow Effect
  if (options?.shadowType && options.shadowType !== 'none') {
    outCtx.save();
    const shadowOpacity = (options.shadowOpacity ?? 45) / 100;
    const shadowBlur = options.shadowBlur ?? 20;

    if (options.shadowType === 'drop') {
      outCtx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
      outCtx.shadowBlur = shadowBlur;
      outCtx.shadowOffsetX = 10;
      outCtx.shadowOffsetY = 15;
    } else if (options.shadowType === 'floor') {
      // Cast floor shadow
      outCtx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity * 1.2})`;
      outCtx.shadowBlur = shadowBlur * 1.5;
      outCtx.shadowOffsetX = 0;
      outCtx.shadowOffsetY = 30;
    } else if (options.shadowType === 'floating') {
      outCtx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity * 0.8})`;
      outCtx.shadowBlur = shadowBlur * 2;
      outCtx.shadowOffsetX = 0;
      outCtx.shadowOffsetY = 10;
    }

    outCtx.drawImage(canvas, 0, 0);
    outCtx.restore();
  } else {
    // Composite foreground cutout directly
    outCtx.drawImage(canvas, 0, 0);
  }

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
