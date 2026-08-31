/**
 * ============================================================================
 * 遊戲資源載入器與狀態管理器 (Asset Loader & Resilience Engine) V2
 * ============================================================================
 * 
 * 功能特點：
 * 1. 統一管理所有永久 HTTPS 圖片資源的載入、重試與狀態
 * 2. 指數退避自動重試機制 (500ms, 1000ms, 2000ms, 4000ms)
 * 3. 預載入全遊戲資源 preloadAllGameImages()
 * 4. Three.js Texture 載入與快取 (支援非同步重試與 Fallback)
 * 5. 即時狀態廣播給開發者偵錯面板 (Asset Debug Panel)
 */

import * as THREE from 'three';
import { getAllAssetEntries, withVersion, getCharacterAssetUrl } from './imageAssets';

export type AssetStatusType = 'IDLE' | 'LOADING' | 'LOADED' | 'RETRYING' | 'ERROR';

export interface AssetItemStatus {
  id: string;
  name: string;
  url: string;
  category: string;
  status: AssetStatusType;
  retryCount: number;
  lastAttemptTime?: number;
  errorMessage?: string;
}

// 統一錯誤佔位圖 (SVG Data URL)
export const FALLBACK_PLACEHOLDER_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="%231e293b"/><text x="64" y="68" font-size="14" fill="%2394a3b8" text-anchor="middle" font-family="sans-serif">Asset Loading</text></svg>';

/**
 * 建立一個立即可供 WebGL 使用的安全 Canvas 佔位紋理
 */
export function createPlaceholderCanvas(text = 'Loading', width = 64, height = 64): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    return {} as HTMLCanvasElement;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }
  return canvas;
}

// 全局圖片狀態表
const assetStatusMap = new Map<string, AssetItemStatus>();
const imageCache = new Map<string, HTMLImageElement>();
const threeTextureCache = new Map<string, THREE.Texture>();
const statusListeners = new Set<(stats: AssetSummaryStats) => void>();

export interface AssetSummaryStats {
  total: number;
  loaded: number;
  loading: number;
  retrying: number;
  error: number;
  totalRetries: number;
  items: AssetItemStatus[];
}

function getSummaryStats(): AssetSummaryStats {
  const items = Array.from(assetStatusMap.values());
  let loaded = 0;
  let loading = 0;
  let retrying = 0;
  let error = 0;
  let totalRetries = 0;

  for (const item of items) {
    totalRetries += item.retryCount;
    if (item.status === 'LOADED') loaded++;
    else if (item.status === 'LOADING') loading++;
    else if (item.status === 'RETRYING') retrying++;
    else if (item.status === 'ERROR') error++;
  }

  return {
    total: items.length,
    loaded,
    loading,
    retrying,
    error,
    totalRetries,
    items,
  };
}

function notifyListeners() {
  const stats = getSummaryStats();
  statusListeners.forEach(listener => {
    try {
      listener(stats);
    } catch {
      // safe ignore
    }
  });
}

export function subscribeAssetStatus(callback: (stats: AssetSummaryStats) => void): () => void {
  statusListeners.add(callback);
  callback(getSummaryStats());
  return () => {
    statusListeners.delete(callback);
  };
}

// 初始化狀態表
const initialEntries = getAllAssetEntries();
for (const entry of initialEntries) {
  assetStatusMap.set(entry.url, {
    id: entry.id,
    name: entry.name,
    url: entry.url,
    category: entry.category,
    status: 'IDLE',
    retryCount: 0,
  });
}

/**
 * 具備指數退避重試的 HTMLImage 載入器
 */
export async function loadImageWithRetry(
  url: string,
  maxRetries: number = 5,
  delays: number[] = [500, 1000, 2000, 4000, 5000]
): Promise<HTMLImageElement> {
  const formattedUrl = url.includes('?version=') ? url : withVersion(url);

  if (imageCache.has(formattedUrl)) {
    const cachedImg = imageCache.get(formattedUrl)!;
    if (cachedImg.complete && cachedImg.naturalWidth > 0) {
      return cachedImg;
    }
  }

  let item = assetStatusMap.get(formattedUrl);
  if (!item) {
    item = {
      id: formattedUrl.split('/').pop() || 'custom-asset',
      name: formattedUrl.split('/').pop() || 'custom-asset',
      url: formattedUrl,
      category: 'Dynamic',
      status: 'LOADING',
      retryCount: 0,
    };
    assetStatusMap.set(formattedUrl, item);
  }

  let attempt = 0;

  const tryLoad = (): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      item!.status = attempt === 0 ? 'LOADING' : 'RETRYING';
      item!.lastAttemptTime = Date.now();
      notifyListeners();

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';

      img.onload = () => {
        item!.status = 'LOADED';
        item!.errorMessage = undefined;
        imageCache.set(formattedUrl, img);
        notifyListeners();
        resolve(img);
      };

      img.onerror = () => {
        attempt++;
        item!.retryCount++;
        const errMsg = `Failed to load asset: ${formattedUrl} (Attempt ${attempt}/${maxRetries})`;
        item!.errorMessage = errMsg;
        console.warn(`[ASSET LOADER] ${errMsg}`);
        notifyListeners();

        if (attempt <= maxRetries) {
          const delay = delays[attempt - 1] || 4000;
          setTimeout(() => {
            tryLoad().then(resolve).catch(reject);
          }, delay);
        } else {
          item!.status = 'ERROR';
          notifyListeners();
          console.error(`[ASSET ERROR] 找不到圖片或網路連線失敗：${formattedUrl}`);
          reject(new Error(errMsg));
        }
      };

      img.src = formattedUrl;
    });
  };

  return tryLoad();
}

const threeLoader = new THREE.TextureLoader();

/**
 * Three.js 紋理載入器 (具備自動重試與永續快取)
 */
export function loadThreeTextureWithRetry(
  url: string,
  onLoaded?: (tex: THREE.Texture) => void
): THREE.Texture {
  const formattedUrl = url.includes('?version=') ? url : withVersion(url);

  if (threeTextureCache.has(formattedUrl)) {
    const cachedTex = threeTextureCache.get(formattedUrl)!;
    if (cachedTex.image && onLoaded) {
      onLoaded(cachedTex);
    }
    return cachedTex;
  }

  const initialCanvas = createPlaceholderCanvas();
  const texture: THREE.Texture<HTMLImageElement | HTMLCanvasElement> = new THREE.Texture(initialCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  threeTextureCache.set(formattedUrl, texture as THREE.Texture);

  // 透過 HTMLImageElement + retry 引擎載入圖片後更新 Three.js Texture
  loadImageWithRetry(formattedUrl)
    .then(img => {
      texture.image = img;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      if (onLoaded) {
        onLoaded(texture);
      }
    })
    .catch(() => {
      // 載入失敗時保持 Canvas 佔位圖，不讓 WebGL 崩潰
    });

  return texture;
}

/**
 * 取得特定角色與動作之 Three.js 紋理
 */
export function getCharacterPoseThreeTexture(
  characterId: string,
  pose: string,
  onLoaded?: (tex: THREE.Texture) => void
): THREE.Texture {
  const url = getCharacterAssetUrl(characterId, pose);
  return loadThreeTextureWithRetry(url, onLoaded);
}

/**
 * 預載入全遊戲資源 (preloadAllGameImages)
 */
export async function preloadAllGameImages(
  onProgress?: (loaded: number, total: number, current: string) => void
): Promise<{ loaded: number; failed: number }> {
  const entries = getAllAssetEntries();
  const total = entries.length;
  let loadedCount = 0;
  let failedCount = 0;

  console.log(`[ASSET LOADER] 開始預載入 ${total} 項遊戲資源...`);

  const promises = entries.map(async entry => {
    try {
      await loadImageWithRetry(entry.url, 4);
      loadedCount++;
    } catch {
      failedCount++;
    } finally {
      if (onProgress) {
        onProgress(loadedCount + failedCount, total, entry.name);
      }
    }
  });

  await Promise.allSettled(promises);
  console.log(`[ASSET LOADER] 預載入完成：成功 ${loadedCount} 項，失敗 ${failedCount} 項。`);

  return { loaded: loadedCount, failed: failedCount };
}
