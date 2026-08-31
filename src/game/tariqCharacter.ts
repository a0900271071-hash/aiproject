/**
 * ============================================================================
 * 【塔里克·阿爾-哈希姆】(Tariq Al-Hashim) - 角色系統核心模組
 * ============================================================================
 * 
 * 模組核心功能與架構：
 * 1. 角色基本設定與詳細背景故事 (Profile, Lore & Visual Aesthetic)
 * 2. 6 張 GitHub 官方高畫質 PNG 圖片資源陣列與動作索引對應 (6-Sprite Asset Registry & Pose Map)
 * 3. 動作狀態機與 0.5 秒幀動畫控制器 (Movement State Machine & Frame Counter)
 * 4. 專屬技能「背叛之影 / 潛伏的背叛者」條件判定與觸發引擎 (Unique Skill Engine)
 * 
 * 技能觸發機制 (Unique Perks):
 * - 當你與另一名逃生者同時被殺手追逐時，按下 Shift 鍵消失自己的氣場及足跡且讓隊友的足跡或氣場更明顯 10 秒，而你獲得額外的移動速度加成 5 秒。
 * - 只有在同時被追逐時才可觸發，若未達成條件則 Shift 鍵無法使用（按了無反應）。冷卻時間 15 秒。
 */

import { CharacterInfo, PlayerState } from '../types';
import { IMAGE_ASSETS, getCharacterAssetUrl } from './imageAssets';

/**
 * 動作姿勢枚舉與圖片陣列索引對照表 (0~5)
 */
export enum TariqSpriteIndex {
  FRONT = 0,   // 正面靜止 (Tariq-front.png.png)
  LEFT_1 = 1,  // 觸發 WA 幀 1 (Tariq-left1.png.png)
  LEFT_2 = 2,  // 觸發 WA 幀 2 (Tariq-left2.png.png)
  RIGHT_1 = 3, // 觸發 SD 幀 1 (Tariq-right1.png.png)
  RIGHT_2 = 4, // 觸發 SD 幀 2 (Tariq-right2.png.png)
  KO = 5,      // 被殺手擊倒 (Tariq-ko.png.png)
}

/**
 * 規範圖片資源陣列 (按動作索引精確排序)
 */
export const TARIQ_SPRITE_ASSETS: readonly string[] = [
  getCharacterAssetUrl('tariq', 'front'),
  getCharacterAssetUrl('tariq', 'left1'),
  getCharacterAssetUrl('tariq', 'left2'),
  getCharacterAssetUrl('tariq', 'right1'),
  getCharacterAssetUrl('tariq', 'right2'),
  getCharacterAssetUrl('tariq', 'ko'),
] as const;

export interface TariqSpriteItem {
  key: string;
  name: string;
  src: string;
  description: string;
}

export const TARIQ_SPRITE_ITEMS: TariqSpriteItem[] = [
  { key: 'front', name: 'Tariq-front.png.png', src: getCharacterAssetUrl('tariq', 'front'), description: '靜止時使用 Tariq-front' },
  { key: 'left1', name: 'Tariq-left1.png.png', src: getCharacterAssetUrl('tariq', 'left1'), description: '鍵盤觸發 WA 時每0.5秒進行交互(幀1)' },
  { key: 'left2', name: 'Tariq-left2.png.png', src: getCharacterAssetUrl('tariq', 'left2'), description: '鍵盤觸發 WA 時每0.5秒進行交互(幀2)' },
  { key: 'right1', name: 'Tariq-right1.png.png', src: getCharacterAssetUrl('tariq', 'right1'), description: '觸發 SD 時每0.5秒進行交互(幀1)' },
  { key: 'right2', name: 'Tariq-right2.png.png', src: getCharacterAssetUrl('tariq', 'right2'), description: '觸發 SD 時每0.5秒進行交互(幀2)' },
  { key: 'ko', name: 'Tariq-ko.png.png', src: getCharacterAssetUrl('tariq', 'ko'), description: '被殺手擊倒時使用 Tariq-ko' },
];

/**
 * 圖片鍵名對照表 (供 3D Mesh 與 UI 檢索)
 */
export const TARIQ_POSE_MAP = {
  front: getCharacterAssetUrl('tariq', 'front'),
  left: getCharacterAssetUrl('tariq', 'left1'),
  left1: getCharacterAssetUrl('tariq', 'left1'),
  left2: getCharacterAssetUrl('tariq', 'left2'),
  left_2: getCharacterAssetUrl('tariq', 'left2'),
  right: getCharacterAssetUrl('tariq', 'right1'),
  right1: getCharacterAssetUrl('tariq', 'right1'),
  right2: getCharacterAssetUrl('tariq', 'right2'),
  ko: getCharacterAssetUrl('tariq', 'ko'),
  portrait: getCharacterAssetUrl('tariq', 'portrait'),
} as const;

// ============================================================================
// 2. 角色基本設定與詳細背景故事 (Basic Profile, Lore & Aesthetic)
// ============================================================================
export const TARIQ_CHARACTER_INFO: CharacterInfo = {
  id: 'tariq',
  name: '塔里克·阿爾-哈希姆 (Tariq Al-Hashim)',
  title: '潛伏的背叛者 (The Cunning Infiltrator)',
  faction: 'survivor',
  avatarColor: '#a855f7',
  nationality: '南非人（具備混合血統與中東生活背景）',
  heightWeight: '165 公分，55 公斤（身材精瘦、敏捷，擅長在狹窄空間中鑽動與躲藏）',
  career: '前極端組織 ISIS 敵後滲透情報刺探者 / 南非籍流亡移工',
  appearance:
    '【視覺配色】\n' +
    '• 臉頰與膚色：深棕色，帶有風沙吹拂與長期熬夜的粗糙質感。\n' +
    '• 頭髮：全黑色、凌亂且帶有油光的短髮。\n' +
    '• 服裝點綴：外罩一件中東傳統的黑白相間傳統長袍（Keffiyeh風格融合日常戰術服飾），長袍邊緣沾滿塵土、乾涸的血跡與撕裂的破口，在黑暗中能形成獨特的視覺剪影。\n' +
    '【細節表現】\n' +
    '• 眼神：眼神閃爍、多疑，時常呈現驚恐卻又帶著算計的冷酷。\n' +
    '• 動作語言：走路時習慣壓低身形、貼牆而行；受傷時會發出壓抑的喘息聲，但眼神仍死死盯著周遭的人。',
  personality:
    '【核心特質】冷酷殘酷、自私自利的極致求生哲學。\n' +
    '【生存理念】「為達目的不擇手段」，在他眼中，其他的逃生者不是並肩作戰的夥伴，而是隨時可以犧牲的誘餌與擋箭牌。在無數次殘酷的生存與追殺中磨練出極其冷血的求生本能。',
  backstory:
    '表面上，塔里克是一名流亡海外、尋求庇護的南非籍移工；實際上，他曾是極端組織 ISIS 內部負責敵後滲透與情報刺探的狡詐潛伏者。他在無數次殘酷的生存與追殺中磨練出極其冷血的求生本能。\n\n' +
    '當他被捲入這個超自然的恐怖異空間時，他那套「為達目的不擇手段」的生存哲學並未改變——在他眼中，其他的逃生者不是並肩作戰的夥伴，而是隨時可以犧牲的誘餌與擋箭牌。',
  skillName: '背叛之影 (Shadow of Betrayal)',
  skillKey: 'Shift 鍵 (雙人同時被追逐時解鎖)',
  skillDescription:
    '當你與另一名逃生者同時被殺手追逐時，按下 Shift 鍵消失自己的氣場及足跡且讓隊友的足跡或氣場更明顯 10 秒，而你獲得額外的移動速度加成 5 秒。\n' +
    '【使用限制】：若無達成「與另一名逃生者同時被殺手追逐」條件則 Shift 鍵無法使用（按了無反應）。冷卻時間 15 秒。',
  modelStyle: {
    bodyColor: 0x6b21a8,
    accentColor: 0xe2e8f0,
    height: 1.65, // 165 公分精瘦敏捷
    width: 0.48,
  },
};

// ============================================================================
// 3. 移動狀態機 (State Machine & Animation Controller)
// ============================================================================
export type TariqMovementState = 'IDLE' | 'MOVING_LEFT' | 'MOVING_RIGHT' | 'DOWNED';

export interface TariqAnimationState {
  state: TariqMovementState;
  frameTimer: number;       // 當前幀累計時間 (秒)
  currentFrame: number;     // 0 或 1 (每 0.5 秒切換)
  currentTextureUrl: string; // 當前渲染的貼圖路徑
  poseName: 'front' | 'left1' | 'left2' | 'right1' | 'right2' | 'ko';
}

/**
 * 塔里克專屬動作狀態機控制器
 * 嚴格遵循：
 * 1. 角色靜止時：使用 Tariq-front (正面靜止)。
 * 2. 鍵盤觸發 WA 時：使用 Tariq-left1 與 Tariq-left2 每 0.5 秒進行交互切換。
 * 3. 鍵盤觸發 SD 時：使用 Tariq-right1 與 Tariq-right2 每 0.5 秒進行交互切換。
 * 4. 被殺手擊倒時：使用 Tariq-ko。
 */
export class TariqStateMachine {
  private static readonly FRAME_DURATION = 0.5; // 每 0.5 秒切換一幀動畫

  private state: TariqMovementState = 'IDLE';
  private frameTimer: number = 0;
  private currentFrame: number = 0;

  /**
   * 根據時間步長、移動狀態、按鍵方向與血量狀態更新狀態機
   * @param deltaTime 幀間時間 (秒)
   * @param isMoving 是否正在移動
   * @param screenDeltaXOrDir 方向標記 ('left_or_forward' | 'right_or_backward' | 'left' | 'right' | number)
   * @param health 當前角色健康狀態 ('healthy' | 'injured' | 'downed' | 'caged' 等)
   */
  public update(
    deltaTime: number,
    isMoving: boolean,
    screenDeltaXOrDir: number | 'left_or_forward' | 'right_or_backward' | 'left' | 'right' | string,
    health: string = 'healthy'
  ): TariqAnimationState {
    // 1. 擊倒狀態處理 (KO / Downed)
    if (health === 'downed' || health === 'caged' || health === 'dead') {
      this.state = 'DOWNED';
      this.frameTimer = 0;
      this.currentFrame = 0;

      return {
        state: 'DOWNED',
        frameTimer: 0,
        currentFrame: 0,
        currentTextureUrl: TARIQ_POSE_MAP.ko,
        poseName: 'ko',
      };
    }

    // 2. 靜止狀態處理 (IDLE)
    if (!isMoving) {
      this.state = 'IDLE';
      this.frameTimer = 0;
      this.currentFrame = 0;

      return {
        state: 'IDLE',
        frameTimer: 0,
        currentFrame: 0,
        currentTextureUrl: TARIQ_POSE_MAP.front,
        poseName: 'front',
      };
    }

    // 3. 移動方向判斷 (向左/WA 或 向右/SD)
    // 鍵盤 WA (left_or_forward 或 left) -> MOVING_LEFT (left1 與 left2 每 0.5 秒交替切換)
    // 鍵盤 SD (right_or_backward 或 right) -> MOVING_RIGHT (right1 與 right2 每 0.5 秒交替切換)
    let newState: TariqMovementState = 'MOVING_LEFT';
    if (screenDeltaXOrDir === 'left_or_forward' || screenDeltaXOrDir === 'left') {
      newState = 'MOVING_LEFT';
    } else if (screenDeltaXOrDir === 'right_or_backward' || screenDeltaXOrDir === 'right') {
      newState = 'MOVING_RIGHT';
    } else if (typeof screenDeltaXOrDir === 'number') {
      newState = screenDeltaXOrDir < -0.0001 ? 'MOVING_LEFT' : 'MOVING_RIGHT';
    }

    // 狀態切換時重置幀計時器
    if (this.state !== newState) {
      this.state = newState;
      this.frameTimer = 0;
      this.currentFrame = 0;
    } else {
      // 累加計時器 (每 0.5 秒切換幀)
      this.frameTimer += Math.max(0, deltaTime);
      while (this.frameTimer >= TariqStateMachine.FRAME_DURATION) {
        this.frameTimer -= TariqStateMachine.FRAME_DURATION;
        this.currentFrame = (this.currentFrame + 1) % 2; // 0 與 1 交替循環
      }
    }

    // 4. 根據狀態與當前幀組裝貼圖與姿勢
    if (this.state === 'MOVING_LEFT') {
      const isFrame0 = this.currentFrame === 0;
      return {
        state: 'MOVING_LEFT',
        frameTimer: this.frameTimer,
        currentFrame: this.currentFrame,
        currentTextureUrl: isFrame0 ? TARIQ_POSE_MAP.left1 : TARIQ_POSE_MAP.left2,
        poseName: isFrame0 ? 'left1' : 'left2',
      };
    }

    // MOVING_RIGHT
    const isFrame0 = this.currentFrame === 0;
    return {
      state: 'MOVING_RIGHT',
      frameTimer: this.frameTimer,
      currentFrame: this.currentFrame,
      currentTextureUrl: isFrame0 ? TARIQ_POSE_MAP.right1 : TARIQ_POSE_MAP.right2,
      poseName: isFrame0 ? 'right1' : 'right2',
    };
  }

  /**
   * 重置狀態機
   */
  public reset(): void {
    this.state = 'IDLE';
    this.frameTimer = 0;
    this.currentFrame = 0;
  }
}

// ============================================================================
// 4. 專屬技能引擎 (Unique Perk Engine - Shadow of Betrayal)
// ============================================================================

export interface TariqSkillCheckResult {
  canActivate: boolean;
  targetTeammate: PlayerState | null;
  tariqDistToKiller: number;
  teammateDistToKiller: number;
  reason?: string;
}

/**
 * 檢查塔里克是否滿足施放技能的條件：
 * 【條件】：塔里克自身與另一名存活逃生者「同時被殺手追逐」
 * (雙方與殺手的直線距離均小於 chaseRadius，預設 20 公尺)
 */
export function checkTariqSkillCondition(
  tariq: PlayerState,
  allPlayers: PlayerState[],
  chaseRadius: number = 20
): TariqSkillCheckResult {
  // 基本冷卻與狀態檢查
  if (tariq.skillCooldown > 0) {
    return {
      canActivate: false,
      targetTeammate: null,
      tariqDistToKiller: Infinity,
      teammateDistToKiller: Infinity,
      reason: `技能冷卻中 (${Math.ceil(tariq.skillCooldown)}s)`,
    };
  }

  if (tariq.health === 'caged' || tariq.health === 'dead' || tariq.health === 'escaped' || tariq.health === 'downed') {
    return {
      canActivate: false,
      targetTeammate: null,
      tariqDistToKiller: Infinity,
      teammateDistToKiller: Infinity,
      reason: '當前狀態無法施放技能',
    };
  }

  // 尋找所有存活殺手
  const killers = allPlayers.filter(p => p.faction === 'killer' && p.health !== 'dead');
  if (killers.length === 0) {
    return {
      canActivate: false,
      targetTeammate: null,
      tariqDistToKiller: Infinity,
      teammateDistToKiller: Infinity,
      reason: '未找到殺手',
    };
  }

  // 尋找任一殺手，滿足「塔里克與隊友同時在其追逐範圍內」
  let bestActivation: {
    targetTeammate: PlayerState;
    tariqDist: number;
    teammateDist: number;
  } | null = null;
  let minTariqDistToAnyKiller = Infinity;

  for (const killer of killers) {
    const tariqDist = Math.hypot(tariq.x - killer.x, tariq.z - killer.z);
    if (tariqDist < minTariqDistToAnyKiller) {
      minTariqDistToAnyKiller = tariqDist;
    }

    if (tariqDist <= chaseRadius) {
      // 尋找同樣在此殺手追逐半徑內的另一名逃生者隊友
      let nearestTeammate: PlayerState | null = null;
      let minTeammateDist = Infinity;

      allPlayers.forEach(p => {
        if (
          p.id !== tariq.id &&
          p.faction === 'survivor' &&
          (p.health === 'healthy' || p.health === 'injured')
        ) {
          const d = Math.hypot(p.x - killer.x, p.z - killer.z);
          if (d <= chaseRadius && d < minTeammateDist) {
            minTeammateDist = d;
            nearestTeammate = p;
          }
        }
      });

      if (nearestTeammate) {
        bestActivation = {
          targetTeammate: nearestTeammate,
          tariqDist,
          teammateDist: minTeammateDist,
        };
        break;
      }
    }
  }

  if (!bestActivation) {
    if (minTariqDistToAnyKiller > chaseRadius) {
      return {
        canActivate: false,
        targetTeammate: null,
        tariqDistToKiller: minTariqDistToAnyKiller,
        teammateDistToKiller: Infinity,
        reason: '未被殺手追逐 (需與隊友同時被殺手追逐)',
      };
    }
    return {
      canActivate: false,
      targetTeammate: null,
      tariqDistToKiller: minTariqDistToAnyKiller,
      teammateDistToKiller: Infinity,
      reason: '身旁無其他隊友同時被殺手追逐',
    };
  }

  return {
    canActivate: true,
    targetTeammate: bestActivation.targetTeammate,
    tariqDistToKiller: bestActivation.tariqDist,
    teammateDistToKiller: bestActivation.teammateDist,
  };
}

/**
 * 施放塔里克專屬技能「背叛之影」
 * @param tariq 施法者
 * @param allPlayers 全體玩家
 * @returns 包含更新後玩家陣列與提示訊息的結果
 */
export function castTariqBetrayalSkill(
  tariq: PlayerState,
  allPlayers: PlayerState[]
): {
  updatedPlayers: PlayerState[];
  success: boolean;
  message: string;
  targetTeammateId: string | null;
} {
  const check = checkTariqSkillCondition(tariq, allPlayers);

  if (!check.canActivate || !check.targetTeammate) {
    return {
      updatedPlayers: allPlayers,
      success: false,
      message: check.reason || '未滿足施放條件 (需與另一名隊友同時被殺手追逐)',
      targetTeammateId: null,
    };
  }

  const teammate = check.targetTeammate;

  // 執行技能數值更新：
  // 1. 塔里克：獲得 10 秒隱形氣場與足跡消除 (tariqStealthTime = 10)、5 秒移動速度加成 (tariqSpeedBoostTime = 5)、冷卻 15 秒
  // 2. 被背叛的隊友：獲得 10 秒高亮誘餌氣場 (betrayedTeammateTime = 10)
  const updatedPlayers = allPlayers.map(p => {
    if (p.id === tariq.id) {
      return {
        ...p,
        skillCooldown: 15,          // 15 秒冷卻
        skillActiveTime: 10,        // 技能持續時間
        tariqStealthTime: 10,       // 自身消失氣場與足跡 10 秒
        tariqSpeedBoostTime: 5,     // 額外跑速加成 5 秒
        betrayedTeammateId: teammate.id,
        betrayedTeammateTime: 10,
      };
    }

    if (p.id === teammate.id) {
      return {
        ...p,
        betrayedTeammateTime: 10,   // 被作為誘餌，氣場與足跡更加顯著 10 秒
      };
    }

    return p;
  });

  return {
    updatedPlayers,
    success: true,
    message: `💀 塔里克發動【背叛之影】！已隱藏自身氣場與足跡並獲得額外移速 5 秒，將隊友 ${teammate.name} 氣場與足跡顯著標記 10 秒！`,
    targetTeammateId: teammate.id,
  };
}

export const tariqPortraitImg = TARIQ_POSE_MAP.portrait;
