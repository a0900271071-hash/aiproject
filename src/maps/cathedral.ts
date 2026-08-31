import * as THREE from 'three';
import { MapData } from './ximending';

export function buildCathedralMap(scene: THREE.Scene): MapData {
  // 1. 環境氛圍與神祕暗紫濃霧
  scene.background = new THREE.Color(0x0d0714);
  scene.fog = new THREE.FogExp2(0x140a24, 0.015);

  const colliders: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];

  // --- 2. 燈光系統 ---
  const ambientLight = new THREE.AmbientLight(0x6b5b95, 2.0);
  scene.add(ambientLight);

  // 慘白冷月光（斜照投射殘破建築巨大陰影）
  const moonLight = new THREE.DirectionalLight(0xe2e8f0, 3.0);
  moonLight.position.set(32, 65, 30);
  moonLight.castShadow = true;
  scene.add(moonLight);

  // 深紫紅補光
  const fillLight = new THREE.DirectionalLight(0x9333ea, 1.8);
  fillLight.position.set(-35, 45, -40);
  scene.add(fillLight);

  // 玫瑰窗穿透光柱 (Godray Spotlight)
  const roseSpotlight = new THREE.SpotLight(0x38bdf8, 5.0, 95, Math.PI / 4.5, 0.7);
  roseSpotlight.position.set(0, 22, -56);
  roseSpotlight.target.position.set(0, 2, -10);
  scene.add(roseSpotlight);
  scene.add(roseSpotlight.target);

  // --- 3. 材質庫 ---
  const stoneFloorMat = new THREE.MeshStandardMaterial({ color: 0x222530, roughness: 0.8, metalness: 0.2 });
  const ruinWallMat = new THREE.MeshStandardMaterial({ color: 0x1e2433, roughness: 0.9, metalness: 0.1 });
  const gothicStonePillarMat = new THREE.MeshStandardMaterial({ color: 0x333b4f, roughness: 0.7, metalness: 0.2 });
  const goldAltarMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });

  // --- 4. 建築基座與地板 ---
  const floorGeo = new THREE.PlaneGeometry(130, 130);
  const floorMesh = new THREE.Mesh(floorGeo, stoneFloorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // 中央正殿步道
  const aisleMesh = new THREE.Mesh(new THREE.BoxGeometry(18, 0.15, 115), new THREE.MeshStandardMaterial({ color: 0x2e3548, roughness: 0.7 }));
  aisleMesh.position.set(0, 0.075, 0);
  aisleMesh.receiveShadow = true;
  scene.add(aisleMesh);

  // --- 5. 大型外圍石牆邊界 (防止掉出場外) ---
  const createWall = (x: number, z: number, w: number, d: number, h: number = 10) => {
    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ruinWallMat);
    wallMesh.position.set(x, h / 2, z);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);
    colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });
  };

  // 外圍石牆 (北/南/西/東)
  createWall(0, -62, 70, 2, 12);
  createWall(0, 62, 70, 2, 12);
  createWall(-35, 0, 2, 124, 12);
  createWall(35, 0, 2, 124, 12);

  // --- 6. 哥德式立體石柱群 (具有精確碰撞箱) ---
  const createPillar = (x: number, z: number) => {
    const pGeo = new THREE.BoxGeometry(2.4, 16, 2.4);
    const pillar = new THREE.Mesh(pGeo, gothicStonePillarMat);
    pillar.position.set(x, 8, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);

    colliders.push({
      minX: x - 1.3,
      maxX: x + 1.3,
      minZ: z - 1.3,
      maxZ: z + 1.3,
    });
  };

  [-35, -15, 5, 25, 45].forEach((zVal) => {
    createPillar(-12, zVal);
    createPillar(12, zVal);
  });

  // --- 7. 中央廢墟殘壁與祭壇 (破敗掩體，提供追逐周旋) ---
  // 北側聖殿大祭壇
  const altarMesh = new THREE.Mesh(new THREE.BoxGeometry(8, 2.2, 4), goldAltarMat);
  altarMesh.position.set(0, 1.1, -50);
  altarMesh.castShadow = true;
  scene.add(altarMesh);
  colliders.push({ minX: -4.2, maxX: 4.2, minZ: -52.2, maxZ: -47.8 });

  // 左右側殘破長椅 (掩體障礙物)
  const createBench = (x: number, z: number) => {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.0, 1.2), ruinWallMat);
    bench.position.set(x, 0.5, z);
    bench.castShadow = true;
    scene.add(bench);
    colliders.push({ minX: x - 2.4, maxX: x + 2.4, minZ: z - 0.7, maxZ: z + 0.7 });
  };

  [-25, -5, 15, 35].forEach((zVal) => {
    createBench(-6, zVal);
    createBench(6, zVal);
  });

  // --- 8. 大型玫瑰花窗與哥德式立體拱門迴廊 ---
  const roseWindowGroup = new THREE.Group();
  roseWindowGroup.position.set(0, 20, -58);
  const roseOuterRing = new THREE.Mesh(new THREE.RingGeometry(6.0, 8.5, 32), goldAltarMat);
  roseWindowGroup.add(roseOuterRing);

  const roseInnerGlass = new THREE.Mesh(
    new THREE.CircleGeometry(5.8, 32),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
  );
  roseInnerGlass.position.z = -0.1;
  roseWindowGroup.add(roseInnerGlass);

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.4, 11.5, 0.3), ruinWallMat);
    spoke.rotation.z = angle;
    roseWindowGroup.add(spoke);
  }
  scene.add(roseWindowGroup);

  // 哥德式立體拱門肋拱
  const archCurveGeo = new THREE.TorusGeometry(8.5, 0.7, 8, 24, Math.PI);
  [-35, -15, 5, 25, 45].forEach((zVal) => {
    const leftRib = new THREE.Mesh(archCurveGeo, gothicStonePillarMat);
    leftRib.position.set(-12, 17, zVal);
    leftRib.rotation.y = Math.PI / 2;
    leftRib.castShadow = true;
    scene.add(leftRib);

    const rightRib = new THREE.Mesh(archCurveGeo, gothicStonePillarMat);
    rightRib.position.set(12, 17, zVal);
    rightRib.rotation.y = Math.PI / 2;
    rightRib.castShadow = true;
    scene.add(rightRib);
  });

  // --- 9. 回傳遊戲所需的地標座標與碰撞資料 ---
  return {
    colliders,
    genPositions: [
      { x: -22, z: -25 }, // 1. 西北長廊外側
      { x: 22, z: -25 },  // 2. 東北長廊外側
      { x: -22, z: 15 },  // 3. 西南外側中段
      { x: 22, z: 15 },   // 4. 東南外側中段
      { x: 0, z: -35 },   // 5. 玫瑰窗主祭壇前 (高風險)
      { x: -25, z: -45 }, // 6. 西北鐘塔遺址
      { x: 25, z: -45 },  // 7. 東北懺悔室殘壁
      { x: 0, z: 10 },    // 8. 正殿中央十字迴廊
      { x: -22, z: 42 },  // 9. 西南迴廊深處
      { x: 22, z: 42 },   // 10. 東南洗禮池旁
    ],
    cagePositions: [
      { x: -25, z: 25 },
      { x: 25, z: 25 },
      { x: -28, z: -30 },
      { x: 28, z: -30 },
    ],
    // 逃生大門點（北側邊界牆緊貼一扇大門立牌）
    gatePositions: [
      { x: 0, z: -60.0, rotationY: 0 },
    ],
    spawnPoints: [
      { x: 0, z: -20 },
      { x: -25, z: 35 },
      { x: 25, z: 35 },
      { x: -25, z: -35 },
      { x: 25, z: -35 },
    ],
  };
}
