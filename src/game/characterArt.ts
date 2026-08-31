import { IMAGE_ASSETS, getCharacterAssetUrl } from './imageAssets';

export const CHARACTER_PORTRAITS: Record<string, string> = {
  jack: getCharacterAssetUrl('jack', 'portrait'),
  kento: getCharacterAssetUrl('kento', 'portrait'),
  erik: getCharacterAssetUrl('erik', 'portrait'),
  tariq: getCharacterAssetUrl('tariq', 'portrait'),
  elena: getCharacterAssetUrl('elena', 'portrait'),
  gourmet: getCharacterAssetUrl('gourmet', 'portrait'),
};

export const CHARACTER_POSES: Record<string, {
  front: string;
  left: string;
  left1: string;
  left2: string;
  right: string;
  right1: string;
  right2: string;
  ko: string;
}> = {
  elena: {
    front: getCharacterAssetUrl('elena', 'front'),
    left: getCharacterAssetUrl('elena', 'left1'),
    left1: getCharacterAssetUrl('elena', 'left1'),
    left2: getCharacterAssetUrl('elena', 'left2'),
    right: getCharacterAssetUrl('elena', 'right1'),
    right1: getCharacterAssetUrl('elena', 'right1'),
    right2: getCharacterAssetUrl('elena', 'right2'),
    ko: getCharacterAssetUrl('elena', 'ko'),
  },
  kento: {
    front: getCharacterAssetUrl('kento', 'front'),
    left: getCharacterAssetUrl('kento', 'left1'),
    left1: getCharacterAssetUrl('kento', 'left1'),
    left2: getCharacterAssetUrl('kento', 'left2'),
    right: getCharacterAssetUrl('kento', 'right1'),
    right1: getCharacterAssetUrl('kento', 'right1'),
    right2: getCharacterAssetUrl('kento', 'right2'),
    ko: getCharacterAssetUrl('kento', 'ko'),
  },
  jack: {
    front: getCharacterAssetUrl('jack', 'front'),
    left: getCharacterAssetUrl('jack', 'left1'),
    left1: getCharacterAssetUrl('jack', 'left1'),
    left2: getCharacterAssetUrl('jack', 'left2'),
    right: getCharacterAssetUrl('jack', 'right1'),
    right1: getCharacterAssetUrl('jack', 'right1'),
    right2: getCharacterAssetUrl('jack', 'right2'),
    ko: getCharacterAssetUrl('jack', 'ko'),
  },
  erik: {
    front: getCharacterAssetUrl('erik', 'front'),
    left: getCharacterAssetUrl('erik', 'left1'),
    left1: getCharacterAssetUrl('erik', 'left1'),
    left2: getCharacterAssetUrl('erik', 'left2'),
    right: getCharacterAssetUrl('erik', 'right1'),
    right1: getCharacterAssetUrl('erik', 'right1'),
    right2: getCharacterAssetUrl('erik', 'right2'),
    ko: getCharacterAssetUrl('erik', 'ko'),
  },
  gourmet: {
    front: getCharacterAssetUrl('gourmet', 'front'),
    left: getCharacterAssetUrl('gourmet', 'left1'),
    left1: getCharacterAssetUrl('gourmet', 'left1'),
    left2: getCharacterAssetUrl('gourmet', 'left2'),
    right: getCharacterAssetUrl('gourmet', 'right1'),
    right1: getCharacterAssetUrl('gourmet', 'right1'),
    right2: getCharacterAssetUrl('gourmet', 'right2'),
    ko: getCharacterAssetUrl('gourmet', 'ko'),
  },
  tariq: {
    front: getCharacterAssetUrl('tariq', 'front'),
    left: getCharacterAssetUrl('tariq', 'left1'),
    left1: getCharacterAssetUrl('tariq', 'left1'),
    left2: getCharacterAssetUrl('tariq', 'left2'),
    right: getCharacterAssetUrl('tariq', 'right1'),
    right1: getCharacterAssetUrl('tariq', 'right1'),
    right2: getCharacterAssetUrl('tariq', 'right2'),
    ko: getCharacterAssetUrl('tariq', 'ko'),
  },
};
