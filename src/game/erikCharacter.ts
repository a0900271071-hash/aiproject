/**
 * ============================================================================
 * 角色核心模組：古代維京狂戰士 —— 艾瑞克·「紅髮」托森 (Erik "The Red" Thorsson)
 * ============================================================================
 *
 * 【模組核心設計職責】
 * 1. 角色基本設定、外觀特徵、背景故事與立繪圖資對應陣列 (Profile, Lore & Sprites)
 * 2. 0.5 秒跑動幀切換狀態機 (WA 鍵 left1/left2，SD 鍵 right1/right2，靜止 front，擊倒 ko)
 * 3. 專屬技能【狂怒疾馳 / 狂戰突圍】：
 *    - 觸發條件：被殺手攻擊到受傷 (health === 'injured')
 *    - 限制防護：在未受傷狀態下或在當前受傷週期內已使用過（未重新被治療至健康），Shift 鍵無法發動
 *    - 技能效果：按下 Shift 鍵移動速度提升短暫提升 20 秒（速度 * 1.5 倍）
 *    - 重置機制：之後必須被重新治療至健康狀態才可再次使用
 */

import { PlayerState, CharacterInfo, PoseType, HealthState } from '../types';
import { IMAGE_ASSETS, getCharacterAssetUrl } from './imageAssets';

/**
 * 動作資源索引列舉 (對應 6 張立繪圖片檔案)
 */
export enum ErikSpriteIndex {
  FRONT = 0,    // Eric-front.png.png (正面靜止)
  LEFT_1 = 1,   // Eric-left1.png.png (WA 跑動 幀 1)
  LEFT_2 = 2,   // Eric-left2.png.png (WA 跑動 幀 2)
  RIGHT_1 = 3,  // Eric-right1.png.png (SD 跑動 幀 1)
  RIGHT_2 = 4,  // Eric-right2.png.png (SD 跑動 幀 2)
  KO = 5,       // Eric-ko.png.png (被殺手擊倒)
}

/**
 * 動作姿態快速查詢映射表
 */
export const ERIK_POSE_MAP: Record<string, string> = {
  front: getCharacterAssetUrl('erik', 'front'),
  left: getCharacterAssetUrl('erik', 'left1'),
  left1: getCharacterAssetUrl('erik', 'left1'),
  left2: getCharacterAssetUrl('erik', 'left2'),
  right: getCharacterAssetUrl('erik', 'right1'),
  right1: getCharacterAssetUrl('erik', 'right1'),
  right2: getCharacterAssetUrl('erik', 'right2'),
  ko: getCharacterAssetUrl('erik', 'ko'),
  portrait: getCharacterAssetUrl('erik', 'portrait'),
};

/**
 * 圖片資源陣列
 */
export const ERIK_SPRITE_ASSETS: readonly {
  index: ErikSpriteIndex;
  key: string;
  name: string;
  src: string;
  description: string;
}[] = [
  {
    index: ErikSpriteIndex.FRONT,
    key: 'front',
    name: 'Eric-front.png.png',
    src: ERIK_POSE_MAP.front,
    description: '正面靜止 (Idle)',
  },
  {
    index: ErikSpriteIndex.LEFT_1,
    key: 'left1',
    name: 'Eric-left1.png.png',
    src: ERIK_POSE_MAP.left1,
    description: 'WA 跑動 幀 1 (0.5s 循環)',
  },
  {
    index: ErikSpriteIndex.LEFT_2,
    key: 'left2',
    name: 'Eric-left2.png.png',
    src: ERIK_POSE_MAP.left2,
    description: 'WA 跑動 幀 2 (0.5s 循環)',
  },
  {
    index: ErikSpriteIndex.RIGHT_1,
    key: 'right1',
    name: 'Eric-right1.png.png',
    src: ERIK_POSE_MAP.right1,
    description: 'SD 跑動 幀 1 (0.5s 循環)',
  },
  {
    index: ErikSpriteIndex.RIGHT_2,
    key: 'right2',
    name: 'Eric-right2.png.png',
    src: ERIK_POSE_MAP.right2,
    description: 'SD 跑動 幀 2 (0.5s 循環)',
  },
  {
    index: ErikSpriteIndex.KO,
    key: 'ko',
    name: 'Eric-ko.png.png',
    src: ERIK_POSE_MAP.ko,
    description: '被殺手擊倒 (KO / Downed)',
  },
] as const;

/**
 * 主選單展示清單
 */
export const ERIK_SPRITE_ITEMS = [
  { key: 'front', name: 'Eric-front.png.png', src: ERIK_POSE_MAP.front, description: '正面靜止 (Idle)' },
  { key: 'left1', name: 'Eric-left1.png.png', src: ERIK_POSE_MAP.left1, description: 'WA 跑動 幀 1 (0.5s 循環)' },
  { key: 'left2', name: 'Eric-left2.png.png', src: ERIK_POSE_MAP.left2, description: 'WA 跑動 幀 2 (0.5s 循環)' },
  { key: 'right1', name: 'Eric-right1.png.png', src: ERIK_POSE_MAP.right1, description: 'SD 跑動 幀 1 (0.5s 循環)' },
  { key: 'right2', name: 'Eric-right2.png.png', src: ERIK_POSE_MAP.right2, description: 'SD 跑動 幀 2 (0.5s 循環)' },
  { key: 'ko', name: 'Eric-ko.png.png', src: ERIK_POSE_MAP.ko, description: '擊倒瀕死 (Downed)' },
] as const;

// ============================================================================
// 2. 角色設定與背景故事 (Character Info, Lore & Skill)
// ============================================================================
export const ERIK_CHARACTER_CONFIG: CharacterInfo = {
  id: 'erik',
  name: '艾瑞克·「紅髮」托森 (Erik "The Red" Thorsson)',
  title: '維京狂戰士 (Úlfhéðnar Berserker)',
  faction: 'survivor',
  avatarColor: '#f97316',
  nationality: '11世紀中葉古斯堪地那維亞人（瑞典維京人）',
  heightWeight: '185公分，90公斤（精壯、充滿爆發力的戰士體格，長期在極地與航海中鍛鍊出的紮實肌肉）',
  career: '西元11世紀中葉的古代維京狂戰士（Úlfhéðnar 信仰背景）',
  appearance:
    '【膚色與臉部】長期受北歐海風與烈日摧殘的白皙皮膚，但在顴骨和鼻樑處有明顯的日曬紅暈與密集的淡褐色雀斑。\n' +
    '【髮色與毛髮】如野火般耀眼的深紅色亂髮與編起短辮的落腮鬍，沾著微乾的血漬與泥土。\n' +
    '【服裝點綴】身穿粗糙耐磨的褐色亞麻長袖上衣，搭配寬鬆的羊毛寬褲，繫著一條磨損嚴重的皮革腰帶，上面掛著空無一物的劍鞘與幾個殘破的護身符皮袋。',
  personality:
    '【個性及身分】西元11世紀中葉的古代維京狂戰士（Úlfhéðnar 信仰背景），生性勇猛好戰、固執且極度具有戒心。\n' +
    '【心理狀態】面對超自然恐怖時，最初會試圖用凡人的武力與戰吼去對抗，但在見證無法理解的詭異力量後，內心深處正逐漸被恐懼與絕望侵蝕。',
  backstory:
    '【霧中瓦爾哈拉】\n' +
    '在西元1050年的深秋，艾瑞克所屬的長船艦隊在波羅的海遭遇了一場詭異的深海濃霧。那不是自然的霧氣，而是帶著腐爛海草與鐵鏽味的冰冷黑煙。當船隻撞擊上未知的黑色礁石時，船員們紛紛跳入冰冷的海水中求生。\n\n' +
    '然而，當艾瑞克從一座陰森、佈滿灰白泥濘與枯樹的海岸線上醒來時，他的同伴們已經不見了。取而代之的是空氣中揮之不去的低語聲，以及森林深處傳來、不屬於人類的骨骼碎裂聲。\n\n' +
    '他試圖用手中的戰斧劈開黑暗，但隨即發現這裡沒有榮耀的戰鬥，只有無盡的獵殺與扭曲的邪神幻影。這片被詛咒的迷霧領域將他視為獵物，而他那身曾在北歐戰場上令敵軍膽寒的勇猛，在此地化為了一場場血腥的噩夢。現在，他必須學會在這片充滿畸形恐怖的異空間中潛行、喘息，並在每一次心跳加速的追逐中尋找一線生機。',
  skillName: '狂怒疾馳 (Berserker Surge)',
  skillKey: 'Shift 鍵 (受傷時提升速度 20 秒)',
  skillDescription:
    '被殺手攻擊到受傷時，按下 Shift 鍵移動速度短暫提升 20 秒，之後要被重新治療才可再次使用技能。若未受傷或當次受傷已使用過技能，則無法觸發。',
  modelStyle: {
    bodyColor: 0xc2410c,
    accentColor: 0x78350f,
    height: 1.85,
    width: 0.65,
  },
};

// ============================================================================
// 3. 移動與動作狀態機 (State Machine)
// ============================================================================
export type ErikMotionState = 'IDLE' | 'MOVE_LEFT' | 'MOVE_RIGHT' | 'DOWNED';

export interface ErikAnimationOutput {
  state: ErikMotionState;
  poseName: PoseType;
  spriteIndex: ErikSpriteIndex;
  frameTimer: number;
}

/**
 * 艾瑞克・「紅髮」托森專屬動作切換狀態機
 * - 角色靜止時：顯示正面靜止圖 (Eric-front.png)
 * - 鍵盤 WA 觸發時：在 Eric-left1.png 與 Eric-left2.png 每 0.5 秒交替循環
 * - 鍵盤 SD 觸發時：在 Eric-right1.png 與 Eric-right2.png 每 0.5 秒交替循環
 * - 被殺手擊倒時：使用 Eric-ko.png
 */
export class ErikStateMachine {
  private currentState: ErikMotionState = 'IDLE';
  private frameTimer: number = 0;
  private currentFrameIndex: number = 0; // 0 或 1，控制 0.5s 交替
  public readonly FRAME_DURATION: number = 0.5; // 每 0.5 秒切換幀

  /**
   * 重置狀態機內部計數
   */
  public reset(): void {
    this.currentState = 'IDLE';
    this.frameTimer = 0;
    this.currentFrameIndex = 0;
  }

  /**
   * 根據每幀時間差與移動輸入/按鍵方向更新姿態
   * @param deltaTime 幀間時間 (秒)
   * @param isMoving 是否處於移動中
   * @param screenDeltaXOrDir 螢幕投影水平位移量或方向 ('left' | 'right' | 'left_or_forward' | 'right_or_backward' | 'idle')
   * @param health 玩家當前生命狀態
   */
  public update(
    deltaTime: number,
    isMoving: boolean,
    screenDeltaXOrDir: number | 'left' | 'right' | 'left_or_forward' | 'right_or_backward' | 'idle',
    health: HealthState = 'healthy'
  ): ErikAnimationOutput {
    // 1. 被擊倒 / 瀕死 / 監牢狀態優先檢查 -> Eric-ko.png
    if (health === 'downed' || health === 'caged' || health === 'dead') {
      this.currentState = 'DOWNED';
      this.frameTimer = 0;
      return {
        state: 'DOWNED',
        poseName: 'ko',
        spriteIndex: ErikSpriteIndex.KO,
        frameTimer: 0,
      };
    }

    // 2. 靜止無位移狀態 -> Eric-front.png
    if (!isMoving || screenDeltaXOrDir === 'idle') {
      this.currentState = 'IDLE';
      this.frameTimer = 0;
      this.currentFrameIndex = 0;
      return {
        state: 'IDLE',
        poseName: 'front',
        spriteIndex: ErikSpriteIndex.FRONT,
        frameTimer: 0,
      };
    }

    // 3. 移動狀態判斷 (W/A 鍵向左 left1/left2，S/D 鍵向右 right1/right2)
    let targetState: ErikMotionState = 'MOVE_LEFT';
    if (screenDeltaXOrDir === 'left' || screenDeltaXOrDir === 'left_or_forward') {
      targetState = 'MOVE_LEFT';
    } else if (screenDeltaXOrDir === 'right' || screenDeltaXOrDir === 'right_or_backward') {
      targetState = 'MOVE_RIGHT';
    } else if (typeof screenDeltaXOrDir === 'number') {
      targetState = screenDeltaXOrDir < -0.0001 ? 'MOVE_LEFT' : 'MOVE_RIGHT';
    }

    if (this.currentState !== targetState) {
      this.currentState = targetState;
      this.frameTimer = 0;
      this.currentFrameIndex = 0;
    } else {
      this.frameTimer += Math.max(0, deltaTime);
      while (this.frameTimer >= this.FRAME_DURATION) {
        this.frameTimer -= this.FRAME_DURATION;
        this.currentFrameIndex = (this.currentFrameIndex + 1) % 2;
      }
    }

    if (this.currentState === 'MOVE_LEFT') {
      const isFrame2 = this.currentFrameIndex === 1;
      return {
        state: 'MOVE_LEFT',
        poseName: isFrame2 ? 'left2' : 'left1',
        spriteIndex: isFrame2 ? ErikSpriteIndex.LEFT_2 : ErikSpriteIndex.LEFT_1,
        frameTimer: this.frameTimer,
      };
    } else {
      const isFrame2 = this.currentFrameIndex === 1;
      return {
        state: 'MOVE_RIGHT',
        poseName: isFrame2 ? 'right2' : 'right1',
        spriteIndex: isFrame2 ? ErikSpriteIndex.RIGHT_2 : ErikSpriteIndex.RIGHT_1,
        frameTimer: this.frameTimer,
      };
    }
  }
}

// ============================================================================
// 4. 角色技能檢驗與觸發邏輯 (狂怒疾馳 / 狂戰突圍)
// ============================================================================

export interface ErikSkillCheckResult {
  canActivate: boolean;
  reason?: string;
}

export interface ErikSkillExecutionResult {
  updatedPlayers: PlayerState[];
  success: boolean;
  message: string;
}

/**
 * 檢查艾瑞克是否滿足釋放技能條件
 * 條件：
 * 1. 角色必須為艾瑞克 (characterId === 'erik')
 * 2. 處於受傷狀況 (health === 'injured')
 * 3. 當前受傷週期內技能尚未消耗 (erikSkillAvailable !== false)
 * 4. 技能冷卻完成 (skillCooldown <= 0)
 * 5. 非倒地/監禁/死亡狀態
 */
export function checkErikSkillCondition(
  caster: PlayerState
): ErikSkillCheckResult {
  if (caster.characterId !== 'erik') {
    return { canActivate: false, reason: '非艾瑞克角色' };
  }

  if (caster.health === 'caged' || caster.health === 'dead' || caster.health === 'downed') {
    return { canActivate: false, reason: '處於無法行動或瀕死狀態' };
  }

  if (caster.health !== 'injured') {
    return {
      canActivate: false,
      reason: '未達成觸發條件：必須處於「被殺手攻擊受傷」狀態下方可使用 Shift 鍵',
    };
  }

  if (caster.erikSkillAvailable === false) {
    return {
      canActivate: false,
      reason: '技能已於本次受傷中使用過：必須由隊友重新治療至健康狀態後方可再次充能使用',
    };
  }

  if (caster.skillCooldown > 0) {
    return { canActivate: false, reason: `技能冷卻中 (${Math.ceil(caster.skillCooldown)}s)` };
  }

  return { canActivate: true };
}

/**
 * 執行艾瑞克技能釋放
 * - 移動速度短暫提升 20 秒 (vikingBuffTime: 20, 速度 * 1.5 倍)
 * - 消耗當次受傷技能次數 (erikSkillAvailable = false)
 * - 技能冷卻 15 秒
 */
export function castErikSkill(
  caster: PlayerState,
  allPlayers: PlayerState[]
): ErikSkillExecutionResult {
  const check = checkErikSkillCondition(caster);
  if (!check.canActivate) {
    return {
      updatedPlayers: allPlayers,
      success: false,
      message: check.reason || '無法發動技能',
    };
  }

  const updatedPlayers = allPlayers.map(p => {
    if (p.id === caster.id) {
      return {
        ...p,
        vikingBuffTime: 20, // 20 秒移動速度提升
        erikSkillAvailable: false, // 標記已使用，需重新治療才能恢復
        skillCooldown: 15, // 15 秒冷卻
      };
    }
    return p;
  });

  return {
    updatedPlayers,
    success: true,
    message: '🪓【艾瑞克・狂怒疾馳】移動速度提升（持續 20 秒）！需被重新治療才可再次使用技能！',
  };
}
