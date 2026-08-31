/**
 * ============================================================================
 * 【凍原祭司】艾琳娜 (Elena, The Tundra Shaman) - 角色控制與狀態機模組
 * ============================================================================
 * 
 * 依據重構規格：
 * 1. 圖片資源與動畫狀態 (Animation States)
 *    - 靜止狀態 (Idle): 當沒有按下任何移動鍵時，顯示 front.png (重置計時器並立刻切回)
 *    - 向左/向前移動: 按住 W 或 A 鍵時，每 0.5 秒在 left1.png 與 left2.png 之間循環切換
 *    - 向右/向後移動: 按住 S 或 D 鍵時，每 0.5 秒在 right1.png 與 right2.png 之間循環切換
 *    - 放開按鍵時重置計時器，立刻切回靜止狀態
 * 
 * 2. 技能與攻擊機制 (Actions)
 *    - 技能攻擊: 按下 Shift 鍵時，向角色當前朝向（前方）生成/扔出 specialattack.png 判定物件
 *    - 普通互動/攻擊: 按下 Space (空格鍵) 時，觸發近戰互動：
 *        - 若範圍內有正常/受傷逃生者：觸發普通攻擊
 *        - 若範圍內有被擊倒逃生者：執行送進監獄動作
 *        - 若範圍內有修理進度的電箱：執行破壞電箱動作
 */

import { CharacterInfo, PlayerState, HealthState } from '../types';
import { IMAGE_ASSETS, getCharacterAssetUrl } from './imageAssets';

export const ELENA_SPECIAL_ATTACK_IMG = getCharacterAssetUrl('elena', 'specialAttack');

export enum ElenaSpriteIndex {
  FRONT = 0,          // 靜止狀態: elena-front.png
  LEFT_1 = 1,         // 向左/向前移動 幀1: elena-left1.png
  LEFT_2 = 2,         // 向左/向前移動 幀2: elena-left2.png
  RIGHT_1 = 3,        // 向右/向後移動 幀1: elena-right1.png
  RIGHT_2 = 4,        // 向右/向後移動 幀2: elena-right2.png
  SPECIAL_ATTACK = 5, // 技能攻擊: elena-specialattack.png
}

export const ELENA_SPRITE_ASSETS: readonly string[] = [
  getCharacterAssetUrl('elena', 'front'),
  getCharacterAssetUrl('elena', 'left1'),
  getCharacterAssetUrl('elena', 'left2'),
  getCharacterAssetUrl('elena', 'right1'),
  getCharacterAssetUrl('elena', 'right2'),
  getCharacterAssetUrl('elena', 'specialAttack'),
] as const;

export const ELENA_POSE_MAP = {
  front: getCharacterAssetUrl('elena', 'front'),
  left: getCharacterAssetUrl('elena', 'left1'),
  left1: getCharacterAssetUrl('elena', 'left1'),
  left2: getCharacterAssetUrl('elena', 'left2'),
  right: getCharacterAssetUrl('elena', 'right1'),
  right1: getCharacterAssetUrl('elena', 'right1'),
  right2: getCharacterAssetUrl('elena', 'right2'),
  attack: getCharacterAssetUrl('elena', 'specialAttack'),
  specialAttack: getCharacterAssetUrl('elena', 'specialAttack'),
  portrait: getCharacterAssetUrl('elena', 'portrait'),
} as const;

export const ELENA_SPRITE_ITEMS = [
  { key: 'front', name: '【凍原祭司】艾琳娜 elena-front.png', src: ELENA_POSE_MAP.front, description: '靜止狀態 (Idle)' },
  { key: 'left1', name: '【凍原祭司】艾琳娜 elena-left1.png', src: ELENA_POSE_MAP.left1, description: '向左/向前移動 幀1' },
  { key: 'left2', name: '【凍原祭司】艾琳娜 elena-left2.png', src: ELENA_POSE_MAP.left2, description: '向左/向前移動 幀2' },
  { key: 'right1', name: '【凍原祭司】艾琳娜 elena-right1.png', src: ELENA_POSE_MAP.right1, description: '向右/向後移動 幀1' },
  { key: 'right2', name: '【凍原祭司】艾琳娜 elena-right2.png', src: ELENA_POSE_MAP.right2, description: '向右/向後移動 幀2' },
  { key: 'specialAttack', name: '【凍原祭司】艾琳娜 elena-specialattack.png', src: ELENA_POSE_MAP.specialAttack, description: '特殊技能投射物' },
] as const;

// ============================================================================
// 2. 角色基本設定 (Character Info)
// ============================================================================
export const ELENA_CHARACTER_INFO: CharacterInfo = {
  id: 'elena',
  name: '【凍原祭司】艾琳娜',
  title: 'Elena, The Tundra Shaman',
  faction: 'killer',
  avatarColor: '#38bdf8',
  nationality: '俄羅斯帝國庫頁島 / 歐裔西伯利亞人',
  heightWeight: '200 公分 / 50 公斤 (極度不協調身形，四肢修長，佩戴巨大鹿角)',
  career: '凍原祭司 / 通古斯薩滿教繼承者',
  appearance:
    '皮膚呈死灰般慘白，雙眼混濁死白無瞳孔；披著狼皮與鹿皮編織的破爛神衣，佩戴巨大馴鹿角頭飾，手持生鏽捕鯨叉。',
  personality:
    '極度冷酷且狂熱瘋狂。遊走在現實與惡靈幻象之間，哼唱著詭異的招魂曲，將誤入凍原的人類視為獻給惡靈的祭品。',
  backstory:
    '出生於庫頁島流放地，在毀滅性瘟疫奪走親人後接觸了古老的「冰封惡靈」禁忌信仰，成為荒原上操縱暴風雪與極寒詛咒的凍原祭司。',
  skillName: '冰封詛咒 (Curse of Permafrost)',
  skillKey: 'Shift 鍵 (發射特殊攻擊物件)',
  skillDescription:
    '【技能 (Shift)】向正前方扔出冰魔法特殊攻擊 (specialattack.png)，命中使逃生者受傷並凍傷 20 秒，且自身加速 20 秒。\n【近戰互動 (Space)】近身斬擊逃生者 / 關押倒地逃生者 / 破壞修復中的電箱。',
  modelStyle: {
    bodyColor: 0x38bdf8,
    accentColor: 0x0284c7,
    height: 2.2,
    width: 0.65,
  },
};

// ============================================================================
// 3. 重構後動畫狀態機 (Clean Animation State Machine)
// ============================================================================
export type ElenaMovementState = 'IDLE' | 'MOVING_LEFT_FORWARD' | 'MOVING_RIGHT_BACKWARD';

export interface ElenaAnimationState {
  state: ElenaMovementState;
  frameTimer: number;
  currentFrame: number; // 0 或 1 (每 0.5 秒切換)
  currentTextureUrl: string;
  poseName: 'front' | 'left1' | 'left2' | 'right1' | 'right2';
}

export class ElenaStateMachine {
  public static readonly FRAME_DURATION = 0.5; // 每 0.5 秒循環切換

  private state: ElenaMovementState = 'IDLE';
  private frameTimer: number = 0;
  private currentFrame: number = 0;

  /**
   * 重置計時器並立刻回到靜止狀態 (front.png)
   */
  public reset(): ElenaAnimationState {
    this.state = 'IDLE';
    this.frameTimer = 0;
    this.currentFrame = 0;
    return {
      state: 'IDLE',
      frameTimer: 0,
      currentFrame: 0,
      currentTextureUrl: ELENA_POSE_MAP.front,
      poseName: 'front',
    };
  }

  /**
   * 根據按鍵或位移更新動畫狀態
   * 
   * 規格：
   * 1. 靜止 (Idle)：沒有按下任何移動鍵時，顯示 front.png (重置計時器並立刻切回)
   * 2. 向左/向前移動：按住 W 或 A 鍵時，每 0.5 秒在 left1.png 與 left2.png 之間循環切換
   * 3. 向右/向後移動：按住 S 或 D 鍵時，每 0.5 秒在 right1.png 與 right2.png 之間循環切換
   * 4. 放開按鍵時，動畫計時器會重置，並立刻切回靜止狀態
   */
  public update(
    deltaTime: number,
    isMoving: boolean,
    direction: 'left_or_forward' | 'right_or_backward' | 'left' | 'right' | 'idle' | number
  ): ElenaAnimationState {
    if (!isMoving || direction === 'idle') {
      return this.reset();
    }

    let targetState: ElenaMovementState = 'MOVING_LEFT_FORWARD';
    if (direction === 'left_or_forward' || direction === 'left') {
      targetState = 'MOVING_LEFT_FORWARD';
    } else if (direction === 'right_or_backward' || direction === 'right') {
      targetState = 'MOVING_RIGHT_BACKWARD';
    } else if (typeof direction === 'number') {
      // 數值方向：負數或向前偏左為 LEFT_FORWARD，正數為 RIGHT_BACKWARD
      targetState = direction <= 0 ? 'MOVING_LEFT_FORWARD' : 'MOVING_RIGHT_BACKWARD';
    }

    if (this.state !== targetState) {
      this.state = targetState;
      this.frameTimer = 0;
      this.currentFrame = 0;
    } else {
      this.frameTimer += Math.max(0, deltaTime);
      while (this.frameTimer >= ElenaStateMachine.FRAME_DURATION) {
        this.frameTimer -= ElenaStateMachine.FRAME_DURATION;
        this.currentFrame = (this.currentFrame + 1) % 2;
      }
    }

    if (this.state === 'MOVING_LEFT_FORWARD') {
      // W/A 鍵：每 0.5 秒在 left1.png 與 left2.png 切換
      const isFrame2 = this.currentFrame === 1;
      return {
        state: 'MOVING_LEFT_FORWARD',
        frameTimer: this.frameTimer,
        currentFrame: this.currentFrame,
        currentTextureUrl: isFrame2 ? ELENA_POSE_MAP.left2 : ELENA_POSE_MAP.left1,
        poseName: isFrame2 ? 'left2' : 'left1',
      };
    } else {
      // S/D 鍵：每 0.5 秒在 right1.png 與 right2.png 切換
      const isFrame2 = this.currentFrame === 1;
      return {
        state: 'MOVING_RIGHT_BACKWARD',
        frameTimer: this.frameTimer,
        currentFrame: this.currentFrame,
        currentTextureUrl: isFrame2 ? ELENA_POSE_MAP.right2 : ELENA_POSE_MAP.right1,
        poseName: isFrame2 ? 'right2' : 'right1',
      };
    }
  }

  public updateByKeys(
    deltaTime: number,
    keys: { w?: boolean; a?: boolean; s?: boolean; d?: boolean }
  ): ElenaAnimationState {
    const isW = !!keys.w;
    const isA = !!keys.a;
    const isS = !!keys.s;
    const isD = !!keys.d;

    if (!isW && !isA && !isS && !isD) {
      return this.reset();
    }

    const direction = (isW || isA) ? 'left_or_forward' : 'right_or_backward';
    return this.update(deltaTime, true, direction);
  }

  public getState(): ElenaMovementState {
    return this.state;
  }
}

// ============================================================================
// 4. 技能與互動設定 (Skill & Action Configurations)
// ============================================================================
export const ELENA_SKILL_CONFIG = {
  COOLDOWN_SECONDS: 12,          // 技能冷卻時間
  PROJECTILE_SPEED: 26,          // 投射物飛行速度 (m/s)
  PROJECTILE_MAX_RANGE: 35,      // 投射物最大射程 (m)
  PROJECTILE_HIT_RADIUS: 3.2,    // 冰晶爆炸判定半徑
  FROSTBITE_DURATION: 20,        // 逃生者凍傷減速持續時間 (20s)
  KILLER_SPEED_BUFF_DURATION: 20,// 艾琳娜加速持續時間 (20s)
  KILLER_SPEED_BUFF_FACTOR: 1.25,// 艾琳娜 1.25x 移動速度加成
  MELEE_ATTACK_RANGE: 2.8,       // 普通近戰攻擊範圍 (m)
  CAGE_SURVIVOR_RANGE: 2.8,      // 關押倒地逃生者範圍 (m)
  KICK_GENERATOR_RANGE: 2.8,     // 踢擊/破壞電箱範圍 (m)
  KICK_GEN_DAMAGE: 15,           // 破壞電箱減少進度 (%)
} as const;
