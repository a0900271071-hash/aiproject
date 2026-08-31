import * as THREE from 'three';
import { CHARACTER_PORTRAITS, CHARACTER_POSES } from './characterArt';
import { ElenaStateMachine } from './elenaCharacter';
import { GourmetStateMachine } from './gourmetCharacter';
import { TariqStateMachine } from './tariqCharacter';
import { KentoStateMachine } from './kentoCharacter';
import { JackStateMachine } from './jackCharacter';
import { ErikStateMachine } from './erikCharacter';
import { getCharacterAssetUrl } from './imageAssets';
import { getCharacterPoseThreeTexture, loadThreeTextureWithRetry } from './assetLoader';

export type PoseType = 'front' | 'left' | 'left1' | 'left2' | 'right' | 'right1' | 'right2' | 'ko' | 'back' | 'chase';

export function getCharacterPoseTexture(
  characterId: string,
  pose: PoseType,
  onLoaded?: (tex: THREE.Texture) => void
): THREE.Texture | null {
  return getCharacterPoseThreeTexture(characterId, pose, onLoaded);
}

/**
 * Creates a clean 2D Photorealistic Standee / Avatar Mesh attached to a 3D Collision Base.
 * Replaces low-poly blocky geometric meshes with high-resolution realistic artwork,
 * while maintaining 3D positioning, collision radius, and horror atmosphere.
 */
export function createCharacter3DMesh(characterId: string): THREE.Group {
  const group = new THREE.Group();

  // Character physical heights (in meters)
  const heightMap: Record<string, number> = {
    jack: 1.8,
    kento: 1.7,
    erik: 1.85,
    tariq: 1.65,
    elena: 2.2, // 200 cm tall + antler headpiece
    gourmet: 1.8,
  };

  const isKiller = characterId === 'elena' || characterId === 'gourmet';
  const height = heightMap[characterId] || 1.8;
  const width = height * 0.65;

  // 1. Ground Collision Base & Directional Ring Indicator
  const baseRadius = 0.4;
  const baseGeo = new THREE.CylinderGeometry(baseRadius, baseRadius, 0.1, 24);
  const baseMat = new THREE.MeshStandardMaterial({
    color: isKiller ? 0x991b1b : 0x0284c7,
    metalness: 0.8,
    roughness: 0.2,
    emissive: isKiller ? 0x450a0a : 0x075985,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.05;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Direction Pointer Arrow on Ground Base
  const arrowPivot = new THREE.Group();
  arrowPivot.position.y = 0.11;
  const arrowGeo = new THREE.ConeGeometry(0.12, 0.25, 3);
  const arrowMat = new THREE.MeshBasicMaterial({ color: isKiller ? 0xef4444 : 0x38bdf8 });
  const arrow = new THREE.Mesh(arrowGeo, arrowMat);
  arrow.rotation.x = Math.PI / 2;
  arrow.position.set(0, 0, 0.35);
  arrowPivot.add(arrow);
  group.add(arrowPivot);

  // Soft Ground Shadow Disc
  const shadowGeo = new THREE.RingGeometry(0.01, baseRadius * 1.3, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.01;
  group.add(shadowMesh);

  // 2. High-Resolution Photorealistic Artwork Standee Card
  // Preload all available pose textures for this character so switching is instantaneous
  const posesToPreload: PoseType[] = ['front', 'left', 'left1', 'left2', 'right', 'right1', 'right2', 'ko'];
  posesToPreload.forEach(p => getCharacterPoseTexture(characterId, p));

  const initialTexture = getCharacterPoseTexture(characterId, 'front');
  let currentPose: PoseType = 'front';

  const cardGeo = new THREE.PlaneGeometry(width, height);
  const cardMat = new THREE.MeshBasicMaterial({
    map: initialTexture || null,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
  });
  const cardMesh = new THREE.Mesh(cardGeo, cardMat);
  cardMesh.position.y = height / 2 + 0.1;
  cardMesh.castShadow = true;
  cardMesh.renderOrder = 10;
  group.add(cardMesh);

  // Character specific state machine controllers for 0.5s frame switches
  const elenaStateMachine = characterId === 'elena' ? new ElenaStateMachine() : null;
  const gourmetStateMachine = characterId === 'gourmet' ? new GourmetStateMachine() : null;
  const tariqStateMachine = characterId === 'tariq' ? new TariqStateMachine() : null;
  const kentoStateMachine = characterId === 'kento' ? new KentoStateMachine() : null;
  const jackStateMachine = characterId === 'jack' ? new JackStateMachine() : null;
  const erikStateMachine = characterId === 'erik' ? new ErikStateMachine() : null;

  // Helper method attached to group.userData for switching poses dynamically
  group.userData = {
    characterId,
    currentPose,
    cardMesh,
    cardMat,
    lastDir: 'right',
    elenaStateMachine,
    gourmetStateMachine,
    tariqStateMachine,
    kentoStateMachine,
    jackStateMachine,
    erikStateMachine,
    updateMovementPose: (
      deltaTime: number,
      isMoving: boolean,
      screenDeltaXOrDir: number | 'left' | 'right' | 'left_or_forward' | 'right_or_backward' | 'idle',
      health: string = 'healthy'
    ): PoseType => {
      // 0. Downed / KO Check
      if (health === 'downed' || health === 'caged' || health === 'dead') {
        group.userData.setPose('ko');
        return 'ko';
      }

      // 轉換方向給其他狀態機 (若為 left_or_forward 轉為 'left'，right_or_backward 轉為 'right')
      const generalDir: number | 'left' | 'right' = 
        screenDeltaXOrDir === 'left_or_forward' ? 'left' :
        screenDeltaXOrDir === 'right_or_backward' ? 'right' :
        screenDeltaXOrDir === 'idle' ? 'left' : screenDeltaXOrDir;

      // 1. Elena (凍原祭司) - 專屬狀態機 (每 0.5 秒切換 left1/left2 或 right1/right2，靜止為 front)
      if (characterId === 'elena' && elenaStateMachine) {
        const animState = elenaStateMachine.update(deltaTime, isMoving, screenDeltaXOrDir);
        group.userData.setPose(animState.poseName);
        return animState.poseName;
      }

      // 2. Gourmet (老饕 - 陳家豪) - 專屬狀態機 (每 0.5 秒切換 left1/left2 或 right1/right2，靜止為 front，倒地為 ko)
      if (characterId === 'gourmet' && gourmetStateMachine) {
        const animState = gourmetStateMachine.update(deltaTime, isMoving, screenDeltaXOrDir, health as any);
        group.userData.setPose(animState.poseName);
        return animState.poseName;
      }

      // 3. Tariq (塔里克·阿爾-哈希姆) - 專屬狀態機 (每 0.5 秒切換 left1/left2 或 right1/right2，靜止為 front，倒地為 ko)
      if (characterId === 'tariq' && tariqStateMachine) {
        const animState = tariqStateMachine.update(deltaTime, isMoving, screenDeltaXOrDir, health as any);
        group.userData.setPose(animState.poseName);
        return animState.poseName;
      }

      // 4. Kento (佐藤 健人) - 專屬狀態機 (每 0.5 秒切換 left1/left2 或 right1/right2，靜止為 front，倒地為 ko)
      if (characterId === 'kento' && kentoStateMachine) {
        const animState = kentoStateMachine.update(deltaTime, isMoving, screenDeltaXOrDir, health as any);
        group.userData.setPose(animState.poseName);
        return animState.poseName;
      }

      // 5. Jack (傑克・米勒) - 專屬狀態機 (每 0.5 秒切換 left1/left2 或 right1/right2，靜止為 front，倒地為 ko)
      if (characterId === 'jack' && jackStateMachine) {
        const animState = jackStateMachine.update(deltaTime, isMoving, screenDeltaXOrDir, health as any);
        group.userData.setPose(animState.poseName);
        return animState.poseName;
      }

      // 6. Erik (艾瑞克·「紅髮」托森) - 專屬狀態機 (每 0.5 秒切換 left1/left2 或 right1/right2，靜止為 front，倒地為 ko)
      if (characterId === 'erik' && erikStateMachine) {
        const animState = erikStateMachine.update(deltaTime, isMoving, screenDeltaXOrDir, health as any);
        group.userData.setPose(animState.poseName);
        return animState.poseName;
      }

      // 7. 通用角色跑動切換
      if (!isMoving) {
        group.userData.setPose('front');
        return 'front';
      }

      let isRight = false;
      if (screenDeltaXOrDir === 'left') {
        isRight = false;
        group.userData.lastDir = 'left';
      } else if (screenDeltaXOrDir === 'right') {
        isRight = true;
        group.userData.lastDir = 'right';
      } else if (typeof screenDeltaXOrDir === 'number') {
        if (screenDeltaXOrDir > 0.005) {
          isRight = true;
          group.userData.lastDir = 'right';
        } else if (screenDeltaXOrDir < -0.005) {
          isRight = false;
          group.userData.lastDir = 'left';
        } else {
          isRight = group.userData.lastDir !== 'left';
        }
      }

      const nowSec = performance.now() / 1000;
      const isFrame2 = (Math.floor(nowSec / 0.5) % 2) === 1;
      const pose: PoseType = isRight ? (isFrame2 ? 'right2' : 'right1') : (isFrame2 ? 'left2' : 'left1');
      group.userData.setPose(pose);
      return pose;
    },
    setFacingAngle: (moveRotationY: number, cameraYaw: number) => {
      arrowPivot.rotation.y = moveRotationY - cameraYaw;
    },
    setPose: (newPose: PoseType) => {
      if (currentPose === newPose && cardMat.map) return;
      const tex = getCharacterPoseTexture(characterId, newPose);
      if (tex) {
        cardMat.map = tex;
        cardMat.needsUpdate = true;
        currentPose = newPose;
        group.userData.currentPose = newPose;

        // Auto-scale mesh width to match texture aspect ratio without distortion
        const applyScale = () => {
          if (tex.image && cardMesh) {
            const img = tex.image as HTMLImageElement | HTMLCanvasElement;
            const imgW = (img as HTMLImageElement).naturalWidth || img.width;
            const imgH = (img as HTMLImageElement).naturalHeight || img.height;
            if (imgW && imgH && width && imgH > 0) {
              const aspect = imgW / imgH;
              const newScaleX = (height * aspect) / width;
              if (!isNaN(newScaleX) && isFinite(newScaleX) && newScaleX > 0) {
                cardMesh.scale.x = newScaleX;
              }
            }
          }
        };

        if (tex.image) {
          const img = tex.image as HTMLImageElement;
          if (img.complete && img.naturalWidth) {
            applyScale();
          } else if (img.addEventListener) {
            img.addEventListener('load', () => {
              applyScale();
              cardMat.needsUpdate = true;
            }, { once: true });
          }
        }
      }
    },
    billboard: (camera: THREE.Camera) => {
      if (cardMesh) {
        // Compute angle in XZ plane from cardMesh to camera so character stays upright and faces camera
        const worldPos = new THREE.Vector3();
        cardMesh.getWorldPosition(worldPos);
        const dx = camera.position.x - worldPos.x;
        const dz = camera.position.z - worldPos.z;
        const angleToCam = Math.atan2(dx, dz);
        // Because cardMesh is inside group (which has rotation group.rotation.y),
        // we subtract group.rotation.y so cardMesh always faces camera in world space!
        cardMesh.rotation.set(0, angleToCam - group.rotation.y, 0);
      }
    },
  };

  return group;
}
