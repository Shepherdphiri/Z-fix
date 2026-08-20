import { Adjustments, Layer, Project, LiveEnhancementState } from '../types';
import {
  applyNoiseReduction,
  applySkinRetouching,
  applyAutoEnhance,
  generateForegroundMask,
} from './imageProcessors';

export interface RenderOptions {
  showComparisonSplit?: boolean;
  comparisonPosition?: number; // 0 to 1
  renderOnlyLayerId?: string;
  exportScale?: number;
  liveEnhancement?: LiveEnhancementState | null;
  activeLayerId?: string;
}


// Generates procedural film grain pattern
function applyGrain(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  if (amount <= 0) return;
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = width;
  grainCanvas.height = height;
  const gCtx = grainCanvas.getContext('2d');
  if (!gCtx) return;

  const imgData = gCtx.createImageData(width, height);
  const data = imgData.data;
  const factor = (amount / 100) * 45;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * factor;
    data[i] = 128 + noise;
    data[i + 1] = 128 + noise;
    data[i + 2] = 128 + noise;
    data[i + 3] = Math.min(255, (amount / 100) * 160);
  }

  gCtx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.restore();
}

// Generates smooth optical vignette
function applyVignette(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  if (amount <= 0) return;
  const radius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    radius * 0.35,
    width / 2,
    height / 2,
    radius
  );

  const opacity = (amount / 100) * 0.85;
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.7, `rgba(0, 0, 0, ${opacity * 0.4})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${opacity})`);

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// Convert adjustments to canvas filter string & color matrices
export function buildCanvasFilterString(adj: Adjustments): string {
  const filters: string[] = [];

  // Brightness and exposure calculation
  const totalBrightness = 100 + adj.brightness + adj.exposure * 0.8;
  if (totalBrightness !== 100) {
    filters.push(`brightness(${Math.max(0, totalBrightness)}%)`);
  }

  // Contrast
  const totalContrast = 100 + adj.contrast;
  if (totalContrast !== 100) {
    filters.push(`contrast(${Math.max(0, totalContrast)}%)`);
  }

  // Saturation & Vibrance
  const totalSat = 100 + adj.saturation + adj.vibrance * 0.5;
  if (totalSat !== 100) {
    filters.push(`saturate(${Math.max(0, totalSat)}%)`);
  }

  // Blur
  if (adj.blur > 0) {
    filters.push(`blur(${adj.blur}px)`);
  }

  // Temperature / Tint simulation via hue-rotate & sepia tones
  if (adj.temperature !== 0) {
    if (adj.temperature > 0) {
      filters.push(`sepia(${adj.temperature * 0.35}%)`);
    } else {
      filters.push(`hue-rotate(${adj.temperature * 0.25}deg)`);
    }
  }

  if (adj.tint !== 0) {
    filters.push(`hue-rotate(${adj.tint * 0.3}deg)`);
  }

  return filters.join(' ') || 'none';
}

// Image cache to avoid re-decoding image blobs every frame
const imageElementCache = new Map<string, HTMLImageElement>();

// Create a procedural studio fallback canvas when remote image is unreachable
function createFallbackImageCanvas(width = 1200, height = 800): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Elegant studio gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1e1e24');
    grad.addColorStop(0.5, '#2b2b36');
    grad.addColorStop(1, '#18181f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Centered label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Z-FIX STUDIO RAW MASTER', width / 2, height / 2);
  }
  return canvas;
}

export function getCachedImage(url: string): Promise<HTMLImageElement | HTMLCanvasElement> {
  if (imageElementCache.has(url)) {
    const cached = imageElementCache.get(url)!;
    if (cached.complete && (cached.naturalWidth > 0 || cached.width > 0)) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      // Retry without anonymous crossOrigin
      const fallbackImg = document.createElement('img');
      fallbackImg.onload = () => {
        imageElementCache.set(url, fallbackImg);
        resolve(fallbackImg);
      };
      fallbackImg.onerror = () => {
        // Safe procedural studio fallback canvas
        const fallbackCanvas = createFallbackImageCanvas(1200, 800);
        resolve(fallbackCanvas);
      };
      fallbackImg.src = url;
    };
    img.src = url;
  });
}

// Draw a single layer onto a context
export async function renderLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  canvasWidth: number,
  canvasHeight: number,
  options: RenderOptions = {}
) {
  if (!layer.visible || layer.opacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = layer.opacity / 100;
  ctx.globalCompositeOperation = layer.blendMode;

  const t = layer.transform || { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipH: false, flipV: false };
  const centerX = canvasWidth / 2 + (t.x ?? 0);
  const centerY = canvasHeight / 2 + (t.y ?? 0);

  ctx.translate(centerX, centerY);
  if (t.rotation && t.rotation !== 0) {
    ctx.rotate((t.rotation * Math.PI) / 180);
  }
  ctx.scale(t.flipH ? -(t.scaleX ?? 1) : (t.scaleX ?? 1), t.flipV ? -(t.scaleY ?? 1) : (t.scaleY ?? 1));

  // Apply layer adjustments filter
  const filterStr = buildCanvasFilterString(layer.adjustments);
  ctx.filter = filterStr;

  if (layer.type === 'image' && layer.imageUrl) {
    try {
      const img = await getCachedImage(layer.imageUrl);
      const naturalW = ('naturalWidth' in img ? img.naturalWidth : img.width) || 1200;
      const naturalH = ('naturalHeight' in img ? img.naturalHeight : img.height) || 800;
      const imgAspect = naturalW / naturalH;
      
      let drawW = layer.originalWidth || naturalW;
      let drawH = layer.originalHeight || naturalH;

      // Ensure draw dimensions preserve the natural image aspect ratio without stretching
      const targetAspect = drawW / drawH;
      if (Math.abs(targetAspect - imgAspect) > 0.02) {
        if (targetAspect > imgAspect) {
          drawW = drawH * imgAspect;
        } else {
          drawH = drawW / imgAspect;
        }
      }

      const isLiveActive =
        options.activeLayerId === layer.id &&
        options.liveEnhancement &&
        options.liveEnhancement.activeTool !== 'none' &&
        !options.liveEnhancement.isComparingOriginal;

      if (isLiveActive && options.liveEnhancement) {
        const tool = options.liveEnhancement.activeTool;
        // Render onto an intermediate offscreen canvas to apply neural/pixel enhancements live on the main canvas
        const tempCanvas = document.createElement('canvas');
        // Render at crisp target scale
        const scaleFactor = Math.min(1, 1400 / Math.max(drawW, drawH));
        const pW = Math.round(drawW * scaleFactor);
        const pH = Math.round(drawH * scaleFactor);
        tempCanvas.width = pW;
        tempCanvas.height = pH;

        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0, pW, pH);

          if (tool === 'denoise') {
            applyNoiseReduction(
              tempCtx,
              pW,
              pH,
              options.liveEnhancement.denoise.luminance,
              options.liveEnhancement.denoise.color
            );
          } else if (tool === 'skin_retouch') {
            applySkinRetouching(
              tempCtx,
              pW,
              pH,
              options.liveEnhancement.skinRetouch.smoothing,
              options.liveEnhancement.skinRetouch.blemish,
              options.liveEnhancement.skinRetouch.glow
            );
          } else if (tool === 'auto_enhance') {
            applyAutoEnhance(tempCtx, pW, pH);
          } else if (tool === 'bg_remover') {
            const bgOpt = options.liveEnhancement.bgRemover;
            const imgData = tempCtx.getImageData(0, 0, pW, pH);
            const data = imgData.data;

            const mask = generateForegroundMask(data, pW, pH, {
              threshold: bgOpt.threshold,
              feather: bgOpt.feather ?? 4,
              protectSubject: bgOpt.protectSubject !== false,
            });

            // Apply alpha mask to foreground
            for (let i = 0; i < pW * pH; i++) {
              data[i * 4 + 3] = mask[i];
            }
            tempCtx.putImageData(imgData, 0, 0);

            // If mode is not transparent, render backdrop on a secondary canvas
            if (bgOpt.mode === 'color') {
              const compCanvas = document.createElement('canvas');
              compCanvas.width = pW;
              compCanvas.height = pH;
              const cCtx = compCanvas.getContext('2d');
              if (cCtx) {
                cCtx.fillStyle = bgOpt.color || '#ffffff';
                cCtx.fillRect(0, 0, pW, pH);

                if (bgOpt.shadowType && bgOpt.shadowType !== 'none') {
                  const shadowOpacity = (bgOpt.shadowOpacity ?? 45) / 100;
                  const shadowBlur = bgOpt.shadowBlur ?? 20;
                  cCtx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
                  cCtx.shadowBlur = shadowBlur;
                  if (bgOpt.shadowType === 'drop') {
                    cCtx.shadowOffsetX = 10;
                    cCtx.shadowOffsetY = 15;
                  } else if (bgOpt.shadowType === 'floor') {
                    cCtx.shadowOffsetX = 0;
                    cCtx.shadowOffsetY = 28;
                    cCtx.shadowBlur = shadowBlur * 1.5;
                  } else if (bgOpt.shadowType === 'floating') {
                    cCtx.shadowOffsetX = 0;
                    cCtx.shadowOffsetY = 10;
                    cCtx.shadowBlur = shadowBlur * 2;
                  }
                }

                cCtx.drawImage(tempCanvas, 0, 0);
                tempCtx.drawImage(compCanvas, 0, 0);
              }
            } else if (bgOpt.mode === 'blur') {
              const compCanvas = document.createElement('canvas');
              compCanvas.width = pW;
              compCanvas.height = pH;
              const cCtx = compCanvas.getContext('2d');
              if (cCtx) {
                cCtx.filter = `blur(${bgOpt.blurRadius || 24}px) brightness(0.9)`;
                cCtx.drawImage(img, 0, 0, pW, pH);
                cCtx.filter = 'none';

                if (bgOpt.shadowType && bgOpt.shadowType !== 'none') {
                  const shadowOpacity = (bgOpt.shadowOpacity ?? 45) / 100;
                  const shadowBlur = bgOpt.shadowBlur ?? 20;
                  cCtx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
                  cCtx.shadowBlur = shadowBlur;
                  cCtx.shadowOffsetX = 0;
                  cCtx.shadowOffsetY = 15;
                }

                cCtx.drawImage(tempCanvas, 0, 0);
                tempCtx.drawImage(compCanvas, 0, 0);
              }
            } else if (bgOpt.mode === 'photo' && bgOpt.photoUrl) {
              const compCanvas = document.createElement('canvas');
              compCanvas.width = pW;
              compCanvas.height = pH;
              const cCtx = compCanvas.getContext('2d');
              if (cCtx) {
                try {
                  const bgImg = await getCachedImage(bgOpt.photoUrl);
                  cCtx.drawImage(bgImg, 0, 0, pW, pH);
                } catch (e) {
                  cCtx.fillStyle = '#ffffff';
                  cCtx.fillRect(0, 0, pW, pH);
                }

                if (bgOpt.shadowType && bgOpt.shadowType !== 'none') {
                  const shadowOpacity = (bgOpt.shadowOpacity ?? 45) / 100;
                  const shadowBlur = bgOpt.shadowBlur ?? 20;
                  cCtx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
                  cCtx.shadowBlur = shadowBlur;
                  cCtx.shadowOffsetX = 10;
                  cCtx.shadowOffsetY = 15;
                }

                cCtx.drawImage(tempCanvas, 0, 0);
                tempCtx.drawImage(compCanvas, 0, 0);
              }
            } else if (bgOpt.mode === 'gradient') {
              const compCanvas = document.createElement('canvas');
              compCanvas.width = pW;
              compCanvas.height = pH;
              const cCtx = compCanvas.getContext('2d');
              if (cCtx) {
                const grad = cCtx.createLinearGradient(0, 0, pW, pH);
                grad.addColorStop(0, '#1e1b4b');
                grad.addColorStop(1, '#09090b');
                cCtx.fillStyle = grad;
                cCtx.fillRect(0, 0, pW, pH);

                if (bgOpt.shadowType && bgOpt.shadowType !== 'none') {
                  const shadowOpacity = (bgOpt.shadowOpacity ?? 45) / 100;
                  const shadowBlur = bgOpt.shadowBlur ?? 20;
                  cCtx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
                  cCtx.shadowBlur = shadowBlur;
                  cCtx.shadowOffsetX = 0;
                  cCtx.shadowOffsetY = 15;
                }

                cCtx.drawImage(tempCanvas, 0, 0);
                tempCtx.drawImage(compCanvas, 0, 0);
              }
            } else {
              // Transparent PNG mode with optional shadow
              if (bgOpt.shadowType && bgOpt.shadowType !== 'none') {
                const compCanvas = document.createElement('canvas');
                compCanvas.width = pW;
                compCanvas.height = pH;
                const cCtx = compCanvas.getContext('2d');
                if (cCtx) {
                  const shadowOpacity = (bgOpt.shadowOpacity ?? 45) / 100;
                  const shadowBlur = bgOpt.shadowBlur ?? 20;
                  cCtx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
                  cCtx.shadowBlur = shadowBlur;
                  cCtx.shadowOffsetX = 8;
                  cCtx.shadowOffsetY = 14;
                  cCtx.drawImage(tempCanvas, 0, 0);
                  tempCtx.drawImage(compCanvas, 0, 0);
                }
              }
            }
          } else if (tool === 'upscale') {
            tempCtx.filter = 'contrast(108%) saturate(104%)';
            tempCtx.drawImage(tempCanvas, 0, 0);
            tempCtx.filter = 'none';
          }

          ctx.drawImage(tempCanvas, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        }
      } else {
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      }
    } catch (e) {
      console.warn('Failed to load layer image:', layer.imageUrl, e);
    }
  } else if (layer.type === 'solid' && layer.fillColor) {
    ctx.fillStyle = layer.fillColor;
    ctx.fillRect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
  } else if (layer.type === 'text' && layer.text) {
    ctx.font = `${layer.fontWeight || '600'} ${layer.fontSize || 48}px ${
      layer.fontFamily || 'system-ui, sans-serif'
    }`;
    ctx.fillStyle = layer.textColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(layer.text, 0, 0);
  }

  // Post-render effects for the layer (grain & vignette)
  ctx.restore();

  if (layer.adjustments.grain > 0) {
    applyGrain(ctx, canvasWidth, canvasHeight, layer.adjustments.grain);
  }
  if (layer.adjustments.vignette > 0) {
    applyVignette(ctx, canvasWidth, canvasHeight, layer.adjustments.vignette);
  }
}

// Master composite render function for project
export async function renderProjectToCanvas(
  targetCanvas: HTMLCanvasElement,
  project: Project,
  options: RenderOptions = {}
) {
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const width = project.width;
  const height = project.height;

  if (targetCanvas.width !== width || targetCanvas.height !== height) {
    targetCanvas.width = width;
    targetCanvas.height = height;
  }

  // Clear canvas with dark studio background
  ctx.clearRect(0, 0, width, height);

  // If Split comparison is requested, we render unedited base on left and fully graded stack on right
  if (options.showComparisonSplit && typeof options.comparisonPosition === 'number') {
    const splitX = Math.max(0, Math.min(width, width * options.comparisonPosition));

    // Render Original unadjusted base on left
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, height);
    ctx.clip();

    const baseLayer = project.layers[0];
    if (baseLayer && baseLayer.imageUrl) {
      try {
        const img = await getCachedImage(baseLayer.imageUrl);
        ctx.drawImage(img, 0, 0, width, height);
      } catch (e) {
        // fallback
      }
    }
    ctx.restore();

    // Render fully graded stack on right
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, width - splitX, height);
    ctx.clip();

    for (const layer of project.layers) {
      await renderLayer(ctx, layer, width, height, options);
    }
    ctx.restore();

    // Draw split divider line with indicator
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, height);
    ctx.stroke();

    // Split handle badge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(splitX, height / 2, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
    return;
  }

  // Normal composite render
  for (const layer of project.layers) {
    if (options.renderOnlyLayerId && layer.id !== options.renderOnlyLayerId) {
      continue;
    }
    await renderLayer(ctx, layer, width, height, options);
  }
}


// Export canvas image to Blob or DataURL with custom quality & format
export async function exportProjectImage(
  project: Project,
  format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  quality = 0.92,
  scale = 1
): Promise<Blob> {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = Math.round(project.width * scale);
  exportCanvas.height = Math.round(project.height * scale);

  const scaledProject = {
    ...project,
    width: exportCanvas.width,
    height: exportCanvas.height,
  };

  await renderProjectToCanvas(exportCanvas, scaledProject);

  return new Promise((resolve, reject) => {
    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas export failed'));
        }
      },
      format,
      quality
    );
  });
}
