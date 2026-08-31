import * as THREE from 'three';
import { IMAGE_ASSETS } from './imageAssets';
import { loadThreeTextureWithRetry } from './assetLoader';
import { PlayerState, HealthState } from '../types';
import { sound } from '../audio';

let specialAttackTexture: THREE.Texture | null = null;

export function getSpecialAttackTexture(): THREE.Texture {
  if (!specialAttackTexture) {
    specialAttackTexture = loadThreeTextureWithRetry(IMAGE_ASSETS.Elena.specialAttack);
  }
  return specialAttackTexture;
}

export interface ActiveIceProjectile {
  id: string;
  casterId: string;
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  dirX: number;
  dirZ: number;
  speed: number;
  distanceTraveled: number;
  maxDistance: number;
  isAlive: boolean;
  hitPlayerIds: Set<string>; // 紀錄已命中的玩家，防止同一發投射物多幀重複扣血
}

export interface ProjectileImpactResult {
  hitPlayerId: string;
  hitPlayerName: string;
  previousHealth: HealthState;
  newHealth: HealthState;
  message: string;
}

/**
 * 創建並發射【凍原祭司】艾琳娜【冰封詛咒】特殊攻擊判定物件 (elena-specialattack.png)
 * 依照角色當前朝向（前方）扔出，純粹呈現 elena-specialattack.png 圖檔
 */
export function spawnIceAttackProjectile(
  scene: THREE.Scene,
  casterId: string,
  startX: number,
  startY: number,
  startZ: number,
  facingRotationY: number = 0,
  speed: number = 24,
  maxRange: number = 32
): ActiveIceProjectile {
  const group = new THREE.Group();
  group.position.set(startX, startY + 1.2, startZ);

  // 純粹使用 elena-specialattack.png 精靈 (無額外疊加之舊特效平面或雜亂光環)
  const tex = getSpecialAttackTexture();
  const spriteMat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.05,
    opacity: 1.0,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  // elena-specialattack.png 解析度為 280 x 318，等比縮放
  const spriteHeight = 3.0;
  const spriteWidth = spriteHeight * (280 / 318);
  sprite.scale.set(spriteWidth, spriteHeight, 1.0);
  group.add(sprite);

  scene.add(group);

  // 計算正前方發射向量 (基於 facingRotationY)
  const dirX = Math.sin(facingRotationY);
  const dirZ = Math.cos(facingRotationY);

  return {
    id: `ice_proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    casterId,
    group,
    x: startX,
    y: startY + 1.2,
    z: startZ,
    dirX,
    dirZ,
    speed,
    distanceTraveled: 0,
    maxDistance: maxRange,
    isAlive: true,
    hitPlayerIds: new Set<string>(),
  };
}

/**
 * 命中爆炸冰晶特效
 */
export function spawnFrostImpactEffect(
  scene: THREE.Scene,
  x: number,
  y: number,
  z: number
) {
  const impactGroup = new THREE.Group();
  impactGroup.position.set(x, y, z);

  const burstGeo = new THREE.SphereGeometry(1.8, 16, 16);
  const burstMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    wireframe: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const burstMesh = new THREE.Mesh(burstGeo, burstMat);
  impactGroup.add(burstMesh);

  const flashLight = new THREE.PointLight(0x7dd3fc, 8.0, 15);
  impactGroup.add(flashLight);

  scene.add(impactGroup);

  const startTime = performance.now();
  const animInterval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    burstMesh.scale.setScalar(1.0 + elapsed * 6.0);
    burstMat.opacity = Math.max(0, 0.9 - elapsed * 2.8);
    flashLight.intensity = Math.max(0, 8.0 - elapsed * 25);
    if (elapsed >= 0.35) {
      clearInterval(animInterval);
      scene.remove(impactGroup);
      burstGeo.dispose();
      burstMat.dispose();
    }
  }, 30);
}

/**
 * 更新所有飛行中的冰封詛咒特殊攻擊，並即時檢測單體與多目標碰撞傷害
 */
export function updateIceProjectilesAndCheckHits(
  projectiles: ActiveIceProjectile[],
  delta: number,
  camera: THREE.Camera | null,
  scene: THREE.Scene,
  players: PlayerState[]
): {
  aliveProjectiles: ActiveIceProjectile[];
  updatedPlayers: PlayerState[];
  impacts: ProjectileImpactResult[];
} {
  const aliveList: ActiveIceProjectile[] = [];
  let nextPlayers = [...players];
  const impacts: ProjectileImpactResult[] = [];

  for (const proj of projectiles) {
    if (!proj.isAlive) {
      scene.remove(proj.group);
      continue;
    }

    const moveStep = proj.speed * delta;
    proj.x += proj.dirX * moveStep;
    proj.z += proj.dirZ * moveStep;
    proj.distanceTraveled += moveStep;

    proj.group.position.set(proj.x, proj.y, proj.z);

    // 碰撞/AOE 傷害判定 (半徑 3.2 公尺)
    const HIT_RADIUS = 3.2;
    const hitSurvivorsThisFrame: number[] = [];

    for (let i = 0; i < nextPlayers.length; i++) {
      const p = nextPlayers[i];
      if (
        p.faction === 'survivor' &&
        p.health !== 'dead' &&
        p.health !== 'escaped' &&
        p.health !== 'caged' &&
        p.health !== 'downed' &&
        (!p.hitBoostTime || p.hitBoostTime <= 0) &&
        !proj.hitPlayerIds.has(p.id)
      ) {
        const dist = Math.hypot(p.x - proj.x, p.z - proj.z);
        if (dist <= HIT_RADIUS) {
          hitSurvivorsThisFrame.push(i);
        }
      }
    }

    if (hitSurvivorsThisFrame.length > 0) {
      proj.isAlive = false;
      sound.playHitSound();
      sound.playScreamSound();
      spawnFrostImpactEffect(scene, proj.x, 1.2, proj.z);

      const hitNames: string[] = [];

      hitSurvivorsThisFrame.forEach(index => {
        const p = nextPlayers[index];
        proj.hitPlayerIds.add(p.id);

        const prevHealth = p.health;
        let newHealth: HealthState = 'injured';
        let isDirectlyDowned = false;

        if (prevHealth === 'healthy') {
          newHealth = 'injured';
          isDirectlyDowned = false;
        } else if (prevHealth === 'injured') {
          newHealth = 'downed';
          isDirectlyDowned = true;
        } else {
          newHealth = prevHealth;
        }

        nextPlayers[index] = {
          ...p,
          health: newHealth,
          frostbiteTime: 20, // 附加 20 秒凍傷狀態
          hitBoostTime: newHealth === 'injured' ? 2.0 : 0, // 受傷加速爆發 2 秒與短暫無敵
          healProgress: 0,
          cagingProgress: 0,
          erikSkillAvailable: p.characterId === 'erik' ? true : p.erikSkillAvailable,
        };

        hitNames.push(p.name);

        const msg = isDirectlyDowned
          ? `❄️【冰封詛咒】擊中受傷狀態的 ${p.name}！目標瀕死倒地 (Downed)！`
          : `❄️【冰封詛咒】命中健康狀態的 ${p.name}！造成受傷 (Injured) 並施加 20s 凍傷詛咒！`;

        impacts.push({
          hitPlayerId: p.id,
          hitPlayerName: p.name,
          previousHealth: prevHealth,
          newHealth,
          message: msg,
        });
      });

      // 施法者艾琳娜獲得 20 秒移動速度 1.25x 加成
      nextPlayers = nextPlayers.map(p => {
        if (p.id === proj.casterId) {
          return {
            ...p,
            elenaBuffTime: 20,
            speed: 6.2 * 1.25,
          };
        }
        return p;
      });

      if (hitNames.length > 1) {
        impacts.unshift({
          hitPlayerId: 'multi',
          hitPlayerName: hitNames.join(', '),
          previousHealth: 'healthy',
          newHealth: 'injured',
          message: `❄️【冰封詛咒】範圍衝擊！同時命中 ${hitNames.join('、')}！全員受傷並附加 20s 凍傷！`,
        });
      }

      scene.remove(proj.group);
    } else if (proj.distanceTraveled >= proj.maxDistance) {
      proj.isAlive = false;
      scene.remove(proj.group);
    } else {
      aliveList.push(proj);
    }
  }

  return {
    aliveProjectiles: aliveList,
    updatedPlayers: nextPlayers,
    impacts,
  };
}
