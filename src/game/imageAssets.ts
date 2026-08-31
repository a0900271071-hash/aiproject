/**
 * ============================================================================
 * 中央圖片資源管理中心 (Central IMAGE_ASSETS Registry) V2
 * ============================================================================
 * 
 * 規則與原則：
 * 1. 外部永久 HTTPS 資源：採用 GitHub Raw 官方原始檔案網址
 * 2. 嚴格對應 GitHub pic 資料夾中之真實檔名 (包含大小寫與 .png.png 副檔名)
 * 3. 跨電腦/跨裝置/無快取/全新瀏覽器環境保證 100% 可載入
 * 4. 禁止使用 blob:、file://、localStorage/sessionStorage 儲存圖片本體
 */

export const ASSET_VERSION = '2026-08-25';
export const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/a0900271071-hash/game/main/pic';

export function withVersion(url: string): string {
  return `${url}?version=${ASSET_VERSION}`;
}

export interface CharacterAssetMap {
  front: string;
  left1: string;
  left2: string;
  right1: string;
  right2: string;
  ko: string;
  portrait: string;
  specialAttack?: string;
}

export const IMAGE_ASSETS = {
  // 艾瑞克 (Eric / Erik)
  Eric: {
    front: `${GITHUB_RAW_BASE}/Eric-front.png.png`,
    left1: `${GITHUB_RAW_BASE}/Eric-left1.png.png`,
    left2: `${GITHUB_RAW_BASE}/Eric-left2.png.png`,
    right1: `${GITHUB_RAW_BASE}/Eric-right1.png.png`,
    right2: `${GITHUB_RAW_BASE}/Eric-right2.png.png`,
    ko: `${GITHUB_RAW_BASE}/Eric-ko.png.png`,
    portrait: `${GITHUB_RAW_BASE}/Eric-front.png.png`,
  },
  // 老饕 (Gourmet / Gourmer)
  Gourmet: {
    front: `${GITHUB_RAW_BASE}/Gourmer-front.png.png`,
    left1: `${GITHUB_RAW_BASE}/Gourmer-left1.png.png`,
    left2: `${GITHUB_RAW_BASE}/Gourmer-left2.png.png`,
    right1: `${GITHUB_RAW_BASE}/Gourmer-right1.png.png`,
    right2: `${GITHUB_RAW_BASE}/Gourmer-right2.png.png`,
    ko: `${GITHUB_RAW_BASE}/Gourmer-front.png.png`,
    portrait: `${GITHUB_RAW_BASE}/Gourmer-front.png.png`,
  },
  // 傑克 (Jack)
  Jack: {
    front: `${GITHUB_RAW_BASE}/Jack-front.png.png`,
    left1: `${GITHUB_RAW_BASE}/Jack-left1.png.png`,
    left2: `${GITHUB_RAW_BASE}/Jack-left2.png.png`,
    right1: `${GITHUB_RAW_BASE}/Jack-right1.png.png`,
    right2: `${GITHUB_RAW_BASE}/Jack-right2.png.png`,
    ko: `${GITHUB_RAW_BASE}/Jack-ko.png.png`,
    portrait: `${GITHUB_RAW_BASE}/Jack-front.png.png`,
  },
  // 健人 (Kento)
  Kento: {
    front: `${GITHUB_RAW_BASE}/Kento-front.png.png`,
    left1: `${GITHUB_RAW_BASE}/Kento-left1.png.png`,
    left2: `${GITHUB_RAW_BASE}/Kento-left2.png.png`,
    right1: `${GITHUB_RAW_BASE}/Kento-right1.png.png`,
    right2: `${GITHUB_RAW_BASE}/Kento-right2.png.png`,
    ko: `${GITHUB_RAW_BASE}/Kento-ko.png.png`,
    portrait: `${GITHUB_RAW_BASE}/Kento-front.png.png`,
  },
  // 塔里克 (Tariq)
  Tariq: {
    front: `${GITHUB_RAW_BASE}/Tariq-front.png.png`,
    left1: `${GITHUB_RAW_BASE}/Tariq-left1.png.png`,
    left2: `${GITHUB_RAW_BASE}/Tariq-left2.png.png`,
    right1: `${GITHUB_RAW_BASE}/Tariq-right1.png.png`,
    right2: `${GITHUB_RAW_BASE}/Tariq-right2.png.png`,
    ko: `${GITHUB_RAW_BASE}/Tariq-ko.png.png`,
    portrait: `${GITHUB_RAW_BASE}/Tariq-front.png.png`,
  },
  // 艾琳娜 (Elena)
  Elena: {
    front: `${GITHUB_RAW_BASE}/elena-front.png`,
    left1: `${GITHUB_RAW_BASE}/elena-left1.png`,
    left2: `${GITHUB_RAW_BASE}/elena-left2.png`,
    right1: `${GITHUB_RAW_BASE}/elena-right1.png`,
    right2: `${GITHUB_RAW_BASE}/elena-right2.png`,
    ko: `${GITHUB_RAW_BASE}/elena-front.png`,
    specialAttack: `${GITHUB_RAW_BASE}/elena-specialattack.png`,
    portrait: `${GITHUB_RAW_BASE}/elena-front.png`,
  },
  // 發電機 / 電箱 (Generators)
  Objects: {
    generatorUnfix: `${GITHUB_RAW_BASE}/unfix.png`,
    generatorHasfix: `${GITHUB_RAW_BASE}/hasfix.png`,
    gateNoopen: `${GITHUB_RAW_BASE}/noopen.png.png`,
    gateOpen: `${GITHUB_RAW_BASE}/open.png.png`,
    elenaSpecialAttack: `${GITHUB_RAW_BASE}/elena-specialattack.png`,
  }
} as const;

/**
 * 標準化角色 ID 查找
 */
export function normalizeCharacterKey(characterId: string): keyof typeof IMAGE_ASSETS | null {
  const lower = characterId.toLowerCase();
  if (lower === 'eric' || lower === 'erik') return 'Eric';
  if (lower === 'gourmet' || lower === 'gourmer') return 'Gourmet';
  if (lower === 'jack') return 'Jack';
  if (lower === 'kento') return 'Kento';
  if (lower === 'tariq') return 'Tariq';
  if (lower === 'elena') return 'Elena';
  return null;
}

/**
 * 取得角色立繪 URL
 */
export function getCharacterAssetUrl(characterId: string, pose: string = 'front'): string {
  const charKey = normalizeCharacterKey(characterId);
  if (!charKey || !IMAGE_ASSETS[charKey]) {
    console.warn(`[ASSET ERROR] 找不到角色圖片配置：${characterId}`);
    return withVersion(IMAGE_ASSETS.Elena.front);
  }

  const charMap = IMAGE_ASSETS[charKey] as Record<string, string>;
  let url = charMap[pose];
  if (!url) {
    if (pose === 'left' || pose === 'left1') url = charMap.left1;
    else if (pose === 'left2') url = charMap.left2 || charMap.left1;
    else if (pose === 'right' || pose === 'right1') url = charMap.right1;
    else if (pose === 'right2') url = charMap.right2 || charMap.right1;
    else if (pose === 'ko') url = charMap.ko || charMap.front;
    else url = charMap.front;
  }

  return withVersion(url || charMap.front);
}

/**
 * 取得發電機立牌 URL
 */
export function getGeneratorAssetUrl(isFixed: boolean): string {
  return withVersion(isFixed ? IMAGE_ASSETS.Objects.generatorHasfix : IMAGE_ASSETS.Objects.generatorUnfix);
}

/**
 * 取得逃生大門立繪 URL
 */
export function getGateAssetUrl(isOpen: boolean): string {
  return withVersion(isOpen ? IMAGE_ASSETS.Objects.gateOpen : IMAGE_ASSETS.Objects.gateNoopen);
}

/**
 * 取得所有需要預載入的圖片 URL 列表
 */
export function getAllAssetEntries(): Array<{ id: string; name: string; url: string; category: string }> {
  const list: Array<{ id: string; name: string; url: string; category: string }> = [];

  const characters = ['Eric', 'Gourmet', 'Jack', 'Kento', 'Tariq', 'Elena'] as const;
  for (const char of characters) {
    const map = IMAGE_ASSETS[char] as Record<string, string>;
    for (const [pose, url] of Object.entries(map)) {
      list.push({
        id: `${char}-${pose}`,
        name: `${char} (${pose})`,
        url: withVersion(url),
        category: 'Character',
      });
    }
  }

  list.push({
    id: 'generator-unfix',
    name: '電箱 (未修復)',
    url: withVersion(IMAGE_ASSETS.Objects.generatorUnfix),
    category: 'Object',
  });
  list.push({
    id: 'generator-hasfix',
    name: '電箱 (已修復)',
    url: withVersion(IMAGE_ASSETS.Objects.generatorHasfix),
    category: 'Object',
  });
  list.push({
    id: 'gate-noopen',
    name: '逃生大門 (未開啟)',
    url: withVersion(IMAGE_ASSETS.Objects.gateNoopen),
    category: 'Object',
  });
  list.push({
    id: 'gate-open',
    name: '逃生大門 (已開啟)',
    url: withVersion(IMAGE_ASSETS.Objects.gateOpen),
    category: 'Object',
  });
  list.push({
    id: 'elena-specialattack',
    name: '艾琳娜特殊攻擊特效',
    url: withVersion(IMAGE_ASSETS.Objects.elenaSpecialAttack),
    category: 'Effect',
  });

  return list;
}
