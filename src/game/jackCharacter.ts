/**
 * ============================================================================
 * 逃生者角色設定：傑克・米勒 (Jack Miller) —— 二戰美軍步兵連下士
 * ============================================================================
 *
 * 【模組職責說明】
 * 1. 角色檔案 (Profile)、外觀特徵 (Appearance)、性格與心態 (Personality)、背景故事 (Backstory)。
 * 2. 動作狀態機 (JackStateMachine):
 *    - 鍵盤觸發 WA 時使用 Jack-left1,2 每 0.5 秒進行交互
 *    - 觸發 SD 時使用 Jack-right1,2 每 0.5 秒進行交互
 *    - 靜止時使用 Jack-front
 *    - 被殺手擊倒時使用 Jack-ko
 * 3. 角色技能:
 *    - 當這角色進入受傷狀態或從監獄獲救後，按下 Shift 鍵增加治療隊友及修機速度 10%，時間為 30 秒（冷卻 15 秒）。
 *    - 若無達成受傷狀況或從監獄獲救的條件則 Shift 鍵無法使用（按了無反應）。
 */

import { PlayerState, CharacterInfo, PoseType, HealthState } from '../types';
import { IMAGE_ASSETS, getCharacterAssetUrl } from './imageAssets';

/**
 * 動作資源索引列舉 (明確對應 6 張立繪圖片檔案)
 */
export enum JackSpriteIndex {
  FRONT = 0,    // Jack-front.png.png (靜止時使用)
  LEFT_1 = 1,   // Jack-left1.png.png (鍵盤觸發 WA 時每0.5秒交互 幀1)
  LEFT_2 = 2,   // Jack-left2.png.png (鍵盤觸發 WA 時每0.5秒交互 幀2)
  RIGHT_1 = 3,  // Jack-right1.png.png (鍵盤觸發 SD 時每0.5秒交互 幀1)
  RIGHT_2 = 4,  // Jack-right2.png.png (鍵盤觸發 SD 時每0.5秒交互 幀2)
  KO = 5,       // Jack-ko.png.png (被殺手擊倒時使用)
}

/**
 * 動作姿態快速查詢映射表 (供 Three.js 看板網格即時更新貼圖)
 */
export const JACK_POSE_MAP: Record<string, string> = {
  front: getCharacterAssetUrl('jack', 'front'),
  left: getCharacterAssetUrl('jack', 'left1'),
  left1: getCharacterAssetUrl('jack', 'left1'),
  left2: getCharacterAssetUrl('jack', 'left2'),
  left_2: getCharacterAssetUrl('jack', 'left2'),
  right: getCharacterAssetUrl('jack', 'right1'),
  right1: getCharacterAssetUrl('jack', 'right1'),
  right2: getCharacterAssetUrl('jack', 'right2'),
  ko: getCharacterAssetUrl('jack', 'ko'),
  portrait: getCharacterAssetUrl('jack', 'portrait'),
};

/**
 * 圖片資源陣列
 */
export const JACK_SPRITE_ASSETS: readonly {
  index: JackSpriteIndex;
  key: string;
  name: string;
  src: string;
  description: string;
}[] = [
  {
    index: JackSpriteIndex.FRONT,
    key: 'front',
    name: 'Jack-front.png.png',
    src: JACK_POSE_MAP.front,
    description: '靜止時使用 Jack-front',
  },
  {
    index: JackSpriteIndex.LEFT_1,
    key: 'left1',
    name: 'Jack-left1.png.png',
    src: JACK_POSE_MAP.left1,
    description: '鍵盤觸發 WA 時使用 Jack-left1,2 每0.5秒進行交互(幀1)',
  },
  {
    index: JackSpriteIndex.LEFT_2,
    key: 'left2',
    name: 'Jack-left2.png.png',
    src: JACK_POSE_MAP.left2,
    description: '鍵盤觸發 WA 時使用 Jack-left1,2 每0.5秒進行交互(幀2)',
  },
  {
    index: JackSpriteIndex.RIGHT_1,
    key: 'right1',
    name: 'Jack-right1.png.png',
    src: JACK_POSE_MAP.right1,
    description: '觸發 SD 時使用 Jack-right1,2 每0.5秒進行交互(幀1)',
  },
  {
    index: JackSpriteIndex.RIGHT_2,
    key: 'right2',
    name: 'Jack-right2.png.png',
    src: JACK_POSE_MAP.right2,
    description: '觸發 SD 時使用 Jack-right1,2 每0.5秒進行交互(幀2)',
  },
  {
    index: JackSpriteIndex.KO,
    key: 'ko',
    name: 'Jack-ko.png.png',
    src: JACK_POSE_MAP.ko,
    description: '被殺手擊倒時使用 Jack-ko',
  },
] as const;

export const JACK_SPRITE_ITEMS = [
  { key: 'front', name: 'Jack-front.png.png', src: JACK_POSE_MAP.front, description: '靜止時使用 Jack-front' },
  { key: 'left1', name: 'Jack-left1.png.png', src: JACK_POSE_MAP.left1, description: '鍵盤觸發 WA 時每0.5秒交互(幀1)' },
  { key: 'left2', name: 'Jack-left2.png.png', src: JACK_POSE_MAP.left2, description: '鍵盤觸發 WA 時每0.5秒交互(幀2)' },
  { key: 'right1', name: 'Jack-right1.png.png', src: JACK_POSE_MAP.right1, description: '觸發 SD 時每0.5秒交互(幀1)' },
  { key: 'right2', name: 'Jack-right2.png.png', src: JACK_POSE_MAP.right2, description: '觸發 SD 時每0.5秒交互(幀2)' },
  { key: 'ko', name: 'Jack-ko.png.png', src: JACK_POSE_MAP.ko, description: '被殺手擊倒時使用 Jack-ko' },
] as const;

// ============================================================================
// 2. 傑克・米勒 完整角色設定
// ============================================================================
export const JACK_CHARACTER_CONFIG: CharacterInfo = {
  id: 'jack',
  name: '傑克・米勒 (Jack Miller)',
  title: '二戰美軍步兵連下士 (Corporal, US Army Infantry)',
  faction: 'survivor',
  avatarColor: '#10b981',
  nationality: '人類（美國人）',
  heightWeight: '身高 180 公分，體重 80 公斤（精實、結實的戰鬥體格，長期承受高壓軍事訓練與戰場勞動，肌肉線條明顯但不顯笨重）',
  career: '第二次世界大戰美國陸軍步兵連下士（Corporal），在一次密林夜間遭遇戰中與部隊失散，隨後被捲入未知的詭異迷霧與恐怖禁區。',
  appearance:
    '【面部特徵】白人膚色，長期日曬與風吹雨淋帶有粗糙感。右側臉頰上有一條由刺刀或彈片劃開的明顯舊傷疤，眼神銳利且充滿戒備。\n' +
    '【髮型與髮色】經典的美軍短寸頭，金色的頭髮在塵土與血污中顯得有些黯淡。\n' +
    '【服裝與配色】\n' +
    '• 主色調：橄欖褐色（Olive Drab）與卡其色（Khaki）。\n' +
    '• 服裝細節：身穿破損且沾滿泥巴的 M41 野戰夾克，內搭卡其色羊毛衫。袖口和褲管紮在軍靴內，腰間繫著帶有彈藥袋與刺刀鞘的帆布腰帶。衣服多處有因爆炸或掙扎造成的焦黑與撕裂痕跡，散發濃厚的美式寫實軍事恐怖氛圍。',
  personality:
    '【核心特質】剛毅、勇猛、極度務實、臨危不亂。\n' +
    '【背景心理】經歷過血腥的諾曼第或太平洋島嶼戰役，見證過同袍的死亡。這讓他對「生存」有著超乎常人的執著，但也背負著戰場創傷後遺症（PTSD）。在面對超自然或非理性的恐怖時，他起初會試圖用軍事戰術去理解與對抗，隨後才會意識到傳統武器的無力。',
  backstory:
    '1944 年秋天，傑克所屬的步兵連在法國某處陰森的密林中執行夜間偵察任務。隨著濃重的血色霧氣漫山遍野地湧來，通訊設備徹底失效，四周響起了非人的低語與沉重而詭異的腳步聲。在隨後的混戰中，德軍的防線早已不重要，因為黑暗中爬出的是遠比戰爭更為恐怖、無法用子彈殺死的扭曲怪物。傑克的同袍一個接一個在迷霧中被拖走，而他在拼死反擊、用刺刀劃破某個怪物的軀體後，逃進了一處深不見底的迷霧裂隙中。當他再次醒來時，戰場的槍砲聲已然消失，取而代之的是永無止境的詭異廢墟與那令人窒息的追逐夢魘。',
  skillName: '戰術強韌 / 戰地救援與修復 (Battlefield Grit & Repair)',
  skillKey: 'Shift 鍵 (受傷狀態或從監獄獲救後觸發)',
  skillDescription:
    '當這角色進入受傷狀態或從監獄獲救後，按下 Shift 鍵增加治療隊友及修機速度 10%，時間為 30 秒（技能冷卻 15 秒）。\n' +
    '【使用限制】：若無達成受傷狀況或從監獄獲救的條件則 Shift 鍵無法使用（按了無反應）。',
  modelStyle: {
    bodyColor: 0x15803d,
    accentColor: 0xca8a04,
    height: 1.8,
    width: 0.6,
  },
};

// ============================================================================
// 3. 移動與動作狀態機 (State Machine)
// ============================================================================
export type JackMotionState = 'IDLE' | 'MOVE_LEFT' | 'MOVE_RIGHT' | 'DOWNED';

export interface JackAnimationOutput {
  state: JackMotionState;
  poseName: PoseType;
  spriteIndex: JackSpriteIndex;
  frameTimer: number;
}

/**
 * 傑克・米勒專屬動作切換狀態機
 * - 鍵盤觸發 WA 時使用 Jack-left1,2 每 0.5 秒進行交互
 * - 觸發 SD 時使用 Jack-right1,2 每 0.5 秒進行交互
 * - 靜止時使用 Jack-front
 * - 被殺手擊倒時使用 Jack-ko
 */
export class JackStateMachine {
  private currentState: JackMotionState = 'IDLE';
  private frameTimer: number = 0;
  private currentFrameIndex: number = 0; // 0: 幀1, 1: 幀2
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
  ): JackAnimationOutput {
    // 1. 被殺手擊倒時使用 Jack-ko (優先權最高)
    if (health === 'downed' || health === 'caged' || health === 'dead') {
      this.currentState = 'DOWNED';
      this.frameTimer = 0;
      return {
        state: 'DOWNED',
        poseName: 'ko',
        spriteIndex: JackSpriteIndex.KO,
        frameTimer: 0,
      };
    }

    // 2. 靜止時使用 Jack-front
    if (!isMoving || screenDeltaXOrDir === 'idle') {
      this.currentState = 'IDLE';
      this.frameTimer = 0;
      this.currentFrameIndex = 0;
      return {
        state: 'IDLE',
        poseName: 'front',
        spriteIndex: JackSpriteIndex.FRONT,
        frameTimer: 0,
      };
    }

    // 3. 鍵盤觸發 WA (left_or_forward / left) 時使用 Jack-left1,2 每 0.5 秒進行交互
    // 觸發 SD (right_or_backward / right) 時使用 Jack-right1,2 每 0.5 秒進行交互
    let movingLeft = false;
    if (screenDeltaXOrDir === 'left_or_forward' || screenDeltaXOrDir === 'left') {
      movingLeft = true;
    } else if (screenDeltaXOrDir === 'right_or_backward' || screenDeltaXOrDir === 'right') {
      movingLeft = false;
    } else if (typeof screenDeltaXOrDir === 'number') {
      movingLeft = screenDeltaXOrDir < -0.005;
    }

    const targetState: JackMotionState = movingLeft ? 'MOVE_LEFT' : 'MOVE_RIGHT';

    if (this.currentState !== targetState) {
      this.currentState = targetState;
      this.frameTimer = 0;
      this.currentFrameIndex = 0;
    } else {
      this.frameTimer += deltaTime;
      if (this.frameTimer >= this.FRAME_DURATION) {
        this.frameTimer -= this.FRAME_DURATION;
        this.currentFrameIndex = (this.currentFrameIndex + 1) % 2;
      }
    }

    if (this.currentState === 'MOVE_LEFT') {
      const isFrame2 = this.currentFrameIndex === 1;
      const poseName: PoseType = isFrame2 ? 'left2' : 'left1';
      return {
        state: 'MOVE_LEFT',
        poseName,
        spriteIndex: isFrame2 ? JackSpriteIndex.LEFT_2 : JackSpriteIndex.LEFT_1,
        frameTimer: this.frameTimer,
      };
    } else {
      const isFrame2 = this.currentFrameIndex === 1;
      const poseName: PoseType = isFrame2 ? 'right2' : 'right1';
      return {
        state: 'MOVE_RIGHT',
        poseName,
        spriteIndex: isFrame2 ? JackSpriteIndex.RIGHT_2 : JackSpriteIndex.RIGHT_1,
        frameTimer: this.frameTimer,
      };
    }
  }
}

// ============================================================================
// 4. 角色技能檢驗與觸發邏輯
// ============================================================================

export interface JackSkillCheckResult {
  canActivate: boolean;
  reason?: string;
}

export interface JackSkillExecutionResult {
  updatedPlayers: PlayerState[];
  success: boolean;
  message: string;
}

/**
 * 檢查傑克・米勒是否滿足釋放技能條件
 * 條件：
 * 1. 角色必須為傑克 (characterId === 'jack')
 * 2. 技能冷卻完成 (skillCooldown <= 0)
 * 3. 進入受傷狀態 (health === 'injured') OR 從監獄獲救後 (jackRescuedWindow > 0 或 wasRescuedFromCage === true)
 * 4. 非倒地/監禁/死亡狀態
 */
export function checkJackSkillCondition(
  caster: PlayerState
): JackSkillCheckResult {
  if (caster.characterId !== 'jack') {
    return { canActivate: false, reason: '非傑克・米勒角色' };
  }

  if (caster.health === 'caged' || caster.health === 'dead' || caster.health === 'downed') {
    return { canActivate: false, reason: '處於無法行動或瀕死狀態' };
  }

  if (caster.skillCooldown > 0) {
    return { canActivate: false, reason: `技能冷卻中 (${Math.ceil(caster.skillCooldown)}s)` };
  }

  const isInjured = caster.health === 'injured';
  const isRescued = (caster.jackRescuedWindow || 0) > 0 || caster.wasRescuedFromCage === true;

  if (!isInjured && !isRescued) {
    return {
      canActivate: false,
      reason: '未達成觸發條件：必須處於「受傷狀態」或「從監獄獲救後」方可按下 Shift 鍵',
    };
  }

  return { canActivate: true };
}

/**
 * 執行傑克・米勒技能釋放
 * 當這角色進入受傷狀態或從監獄獲救後，按下 Shift 鍵增加治療隊友及修機速度 10%，時間為 30 秒
 */
export function castJackSkill(
  caster: PlayerState,
  allPlayers: PlayerState[]
): JackSkillExecutionResult {
  const check = checkJackSkillCondition(caster);
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
        jackBuffTime: 30, // 增加治療隊友及修機速度 10%，持續 30 秒
        skillCooldown: 15, // 15 秒冷卻
        wasRescuedFromCage: false, // 消耗獲救增益窗口標記
      };
    }
    return p;
  });

  const triggerReason = caster.health === 'injured' ? '受傷狀態激發' : '從監獄獲救後激發';

  return {
    updatedPlayers,
    success: true,
    message: `🎖️【傑克・米勒】(${triggerReason}) 進入戰鬥專注！治療隊友及修機速度提升 +10%（持續 30 秒）`,
  };
}

export const jackPortraitImg = JACK_POSE_MAP.portrait;
