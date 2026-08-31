import * as THREE from 'three';

export interface MapData {
  sceneGroup?: THREE.Group;
  colliders: { minX: number; maxX: number; minZ: number; maxZ: number }[];
  genPositions: { x: number; z: number }[];
  gatePositions: { x: number; z: number; rotationY: number }[];
  cagePositions: { x: number; z: number }[];
  spawnPoints?: { x: number; z: number }[];
}

export function buildXimendingMap(scene: THREE.Scene): MapData {
  // 1. 環境背景與大氣霧氣設定（明亮且帶有雨夜西門町深夜霓虹層次感）
  scene.background = new THREE.Color(0x0f172a);
  scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

  // 碰撞箱陣列
  const colliders: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];

  // --- 2. 大幅增強 3D 燈光系統 ---
  // 全場基礎環境光（高強度，確保各小巷與建築背面無死黑死角）
  const ambientLight = new THREE.AmbientLight(0xcfd8dc, 2.2);
  scene.add(ambientLight);

  // 主平行光（從高處斜照整個街道街廓，提供清晰的物件陰影與立體感）
  const mainDirLight = new THREE.DirectionalLight(0x7dd3fc, 1.8);
  mainDirLight.position.set(25, 55, 30);
  scene.add(mainDirLight);

  // 輔助補光（桃紅霓虹暖色補光，營造西門町不夜城的繁華氛圍）
  const fillDirLight = new THREE.DirectionalLight(0xf43f5e, 0.95);
  fillDirLight.position.set(-25, 45, -30);
  scene.add(fillDirLight);

  // --- 3. 地面系統（擴大為包含主街道、橫向防火巷與兩側後巷的完整街廓） ---
  // 總地面（覆蓋 X: -35 ~ 35, Z: -64 ~ 64）
  const totalGroundGeo = new THREE.PlaneGeometry(72, 130);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x243044,
    roughness: 0.6,
    metalness: 0.1,
  });
  const totalGround = new THREE.Mesh(totalGroundGeo, roadMat);
  totalGround.rotation.x = -Math.PI / 2;
  totalGround.position.set(0, 0, 0);
  totalGround.receiveShadow = true;
  scene.add(totalGround);

  // 中央主幹道人行道基座（凸顯中央大道與小巷的層次）
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x3b4c68,
    roughness: 0.65,
    metalness: 0.1,
  });

  // 左側中央步道緣石
  const leftSidewalk = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 120), sidewalkMat);
  leftSidewalk.position.set(-12.5, 0.08, 0);
  leftSidewalk.receiveShadow = true;
  scene.add(leftSidewalk);

  // 右側中央步道緣石
  const rightSidewalk = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 120), sidewalkMat);
  rightSidewalk.position.set(12.5, 0.08, 0);
  rightSidewalk.receiveShadow = true;
  scene.add(rightSidewalk);

  // 街道中央彩虹反光裝飾線（西門町標誌性地景）
  const rainbowColors = [0xef4444, 0xf97316, 0xeab308, 0x10b981, 0x3b82f6, 0x8b5cf6];
  rainbowColors.forEach((col, idx) => {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 95),
      new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.35,
        roughness: 0.5,
      })
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(-2.5 + idx * 1.0, 0.015, 0);
    scene.add(stripe);
  });

  // 夜雨積水反光坑（保留高鏡面反射質感，映照巷弄與招牌倒影）
  const createPuddle = (x: number, z: number, w: number, h: number) => {
    const puddleGeo = new THREE.PlaneGeometry(w, h);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.05,
      metalness: 0.9,
    });
    const puddle = new THREE.Mesh(puddleGeo, puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, 0.02, z);
    scene.add(puddle);
  };

  // 主街與小巷中的積水坑
  createPuddle(0, -10, 5, 8);
  createPuddle(-5, 15, 4, 7);
  createPuddle(4, 25, 5, 9);
  createPuddle(-18.5, -27, 4, 5); // 左一防火巷積水
  createPuddle(-18.5, 31, 4, 5);  // 左三小巷積水
  createPuddle(18.5, -27, 4, 5);  // 右一防火巷積水
  createPuddle(18.5, 31, 4, 5);   // 右三小巷積水
  createPuddle(-28, 0, 4, 8);     // 西側後巷積水
  createPuddle(28, 0, 4, 8);      // 東側後巷積水

  // --- 4. 大樓建築材質與窗戶材質 ---
  const bldgMatA = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.15 });
  const bldgMatB = new THREE.MeshStandardMaterial({ color: 0x3e4c5e, roughness: 0.65, metalness: 0.2 });
  const bldgMatC = new THREE.MeshStandardMaterial({ color: 0x293548, roughness: 0.75, metalness: 0.1 });

  const winMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfef08a,
    emissiveIntensity: 0.55,
  });

  // 獨立大樓生成輔助函式
  const createBuilding = (
    name: string,
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    mat: THREE.Material
  ) => {
    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    bMesh.position.set(x, h / 2, z);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    scene.add(bMesh);

    // 碰撞箱（精確對應大樓邊界）
    colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });

    // 大樓正面發光窗戶
    const floors = Math.floor(h / 4.5);
    for (let f = 1; f <= floors; f++) {
      const winY = f * 4.2;
      const winCount = Math.max(1, Math.floor(d / 5));
      for (let wi = 0; wi < winCount; wi++) {
        const offsetZ = (wi - (winCount - 1) / 2) * 4.5;
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 2.0), winMat);
        const winX = x > 0 ? x - w / 2 - 0.1 : x + w / 2 + 0.1;
        win.position.set(winX, winY, z + offsetZ);
        scene.add(win);
      }
    }
  };

  // --- 5. 左側獨立大樓群（4 棟建築，中間留出 6m 寬橫向防火巷） ---
  // 左 1 (西北角): 萬年大樓
  createBuilding('萬年商業大樓', -19, -40, 9, 20, 24, bldgMatA);
  // [防火巷 1: Z -30 ~ -24]

  // 左 2 (中北區): 刺青街商場
  createBuilding('刺青街商場', -19, -12, 9, 18, 18, bldgMatB);
  // [橫向小巷 2 (阿宗麵線巷): Z -3 ~ +5]

  // 左 3 (中南區): 西門町娛樂城
  createBuilding('西門町娛樂城', -19, +17, 9, 20, 22, bldgMatC);
  // [防火巷 3: Z +27 ~ +33]

  // 左 4 (西南角): 潮流服飾城
  createBuilding('潮流服飾城', -19, +45, 9, 18, 20, bldgMatA);

  // --- 6. 右側獨立大樓群（4 棟建築，中間留出 6m 寬橫向防火巷） ---
  // 右 1 (東北角): 老店錄影出租 / 懷舊戲院
  createBuilding('老店錄影出租', 19, -40, 9, 20, 22, bldgMatB);
  // [防火巷 1: Z -30 ~ -24]

  // 右 2 (中北區): 流行影音 KTV
  createBuilding('流行影音KTV', 19, -12, 9, 18, 26, bldgMatA);
  // [橫向小巷 2: Z -3 ~ +5]

  // 右 3 (中南區): 巨星大型機台遊樂場
  createBuilding('巨星遊戲機台', 19, +17, 9, 20, 20, bldgMatB);
  // [防火巷 3: Z +27 ~ +33]

  // 右 4 (東南角): 青年商務旅館
  createBuilding('青年商務旅館', 19, +45, 9, 18, 24, bldgMatC);

  // --- 7. 外圍邊界圍牆（防止玩家穿出整個街區） ---
  const wallBorderMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });

  // 北邊界牆 (Z = -63)
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(72, 14, 2), wallBorderMat);
  northWall.position.set(0, 7, -63);
  scene.add(northWall);
  colliders.push({ minX: -36, maxX: 36, minZ: -65, maxZ: -61 });

  // 南邊界牆 (Z = 63)
  const southWall = new THREE.Mesh(new THREE.BoxGeometry(72, 14, 2), wallBorderMat);
  southWall.position.set(0, 7, 63);
  scene.add(southWall);
  colliders.push({ minX: -36, maxX: 36, minZ: 61, maxZ: 65 });

  // 西邊界牆 (X = -35)
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 126), wallBorderMat);
  westWall.position.set(-35, 7, 0);
  scene.add(westWall);
  colliders.push({ minX: -37, maxX: -33, minZ: -65, maxZ: 65 });

  // 東邊界牆 (X = 35)
  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 126), wallBorderMat);
  eastWall.position.set(35, 7, 0);
  scene.add(eastWall);
  colliders.push({ minX: 33, maxX: 37, minZ: -65, maxZ: 65 });

  // --- 8. 沿街路燈與巷弄照明燈光 ---
  const streetLampPositions = [
    // 主街道兩側
    { x: -11, z: -45 },
    { x: 11, z: -45 },
    { x: -11, z: -20 },
    { x: 11, z: -20 },
    { x: -11, z: 5 },
    { x: 11, z: 5 },
    { x: -11, z: 35 },
    { x: 11, z: 35 },
    // 橫向防火巷深處路燈
    { x: -28, z: -27 },
    { x: 28, z: -27 },
    { x: -28, z: 30 },
    { x: 28, z: 30 },
  ];

  streetLampPositions.forEach(pos => {
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 6.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.3 });
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.set(pos.x, 3.25, pos.z);
    scene.add(poleMesh);

    const lampBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    lampBulb.position.set(pos.x, 6.4, pos.z);
    scene.add(lampBulb);

    const lampLight = new THREE.PointLight(0xffbe3b, 3.5, 28);
    lampLight.position.set(pos.x, 6.2, pos.z);
    scene.add(lampLight);
  });

  // --- 9. 西門町經典繁體中文發光霓虹招牌 ---
  const createSign = (text: string, x: number, y: number, z: number, colorHex: number, rotY = 0) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 50px "Microsoft JhengHei", "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const signMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 1.8), signMat);
    signMesh.position.set(x, y, z);
    signMesh.rotation.y = rotY;
    scene.add(signMesh);

    // 招牌周圍點光源
    const signLight = new THREE.PointLight(colorHex, 4.5, 20);
    signLight.position.set(x + (rotY === Math.PI / 2 ? 0.8 : rotY === -Math.PI / 2 ? -0.8 : 0), y, z);
    scene.add(signLight);
  };

  // 各大樓主要招牌
  createSign('萬年商業大樓', -14.2, 7.5, -40, 0xff007f, Math.PI / 2);
  createSign('刺青街 潮牌', -14.2, 6.5, -12, 0x00e5ff, Math.PI / 2);
  createSign('西門町 娛樂城', -14.2, 7.0, 17, 0xffcc00, Math.PI / 2);
  createSign('潮流 服飾館', -14.2, 6.0, 45, 0xec4899, Math.PI / 2);

  createSign('老店 錄影出租', 14.2, 7.5, -40, 0x00e5ff, -Math.PI / 2);
  createSign('流行影音 KTV', 14.2, 8.5, -12, 0x10b981, -Math.PI / 2);
  createSign('巨星 遊戲機台', 14.2, 6.5, 17, 0xf59e0b, -Math.PI / 2);
  createSign('青年 商務旅館', 14.2, 7.5, 45, 0xa855f7, -Math.PI / 2);

  // 防火巷口警示招牌
  createSign('防火巷 請勿堆置', -19, 4.2, -24, 0xff2200, 0);
  createSign('逃生通道', 19, 4.2, -24, 0x10b981, 0);

  // --- 10. 回傳遊戲邏輯所需的地標座標與碰撞資料 ---
  return {
    colliders,
    // 10 個發電機重生點（分散於主幹道、縱橫防火巷與大樓後方暗巷）
    genPositions: [
      { x: 0, z: 0 },         // 1. 中央彩虹大道十字交界處 (高風險高回報)
      { x: -28, z: -40 },     // 2. 萬年大樓後方西側暗巷 (適合繞建築周旋)
      { x: -19, z: -27 },     // 3. 左側一號防火巷深處 (狹窄避難點)
      { x: -28, z: 17 },      // 4. 娛樂城後方西巷轉角
      { x: -19, z: 30 },      // 5. 左側三號小巷轉角
      { x: 28, z: -40 },      // 6. 懷舊戲院後方東側暗巷
      { x: 19, z: -27 },      // 7. 右側一號防火巷深處
      { x: 28, z: 17 },       // 8. 巨星遊樂場後巷
      { x: 19, z: 30 },       // 9. 右側三號小巷出口
      { x: 0, z: -48 },       // 10. 北側出口長廊前
    ],
    // 鐵籠重生點（設置在防火巷交叉口與後巷死角）
    cagePositions: [
      { x: -28, z: -12 },     // 左側二號建築後巷
      { x: 28, z: -12 },      // 右側 KTV 後方東巷
      { x: -28, z: 45 },      // 西南角落後巷
      { x: 28, z: 45 },       // 東南角落後巷
    ],
    // 逃生大門點（北側邊界牆緊貼一扇大門立牌）
    gatePositions: [
      { x: 0, z: -60.0, rotationY: 0 },
    ],
    // 玩家重生點（分散於西門町四方暗巷與大道）
    spawnPoints: [
      { x: 0, z: -20 },       // 殺手重生於中路
      { x: -28, z: 35 },      // 逃生者 1: 西南暗巷
      { x: 28, z: 35 },       // 逃生者 2: 東南暗巷
      { x: -28, z: -35 },     // 逃生者 3: 西北暗巷
      { x: 28, z: -35 },      // 逃生者 4: 東北暗巷
    ],
  };
}
