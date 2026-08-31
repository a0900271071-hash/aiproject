import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Character, MapObject } from '../types';
import { IMAGE_ASSETS } from '../game/imageAssets';
import { loadThreeTextureWithRetry } from '../game/assetLoader';

const unfixTexture = loadThreeTextureWithRetry(IMAGE_ASSETS.Objects.generatorUnfix);
const hasfixTexture = loadThreeTextureWithRetry(IMAGE_ASSETS.Objects.generatorHasfix);
const noopenTexture = loadThreeTextureWithRetry(IMAGE_ASSETS.Objects.gateNoopen);
const openTexture = loadThreeTextureWithRetry(IMAGE_ASSETS.Objects.gateOpen);

interface ThreeCanvasProps {
  objects: MapObject[];
  characters: Character[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  cameraView: 'orbit' | 'top_down' | 'first_person' | 'killer_perspective';
  selectedCharacterId?: string;
  showLOSOverlay: boolean;
  showTerrorRadius: boolean;
  killerTerrorRadius: number;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  objects,
  characters,
  selectedObjectId,
  cameraView,
  selectedCharacterId = 'survivor_1'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // --- 1. 場景、氛圍與神祕暗紫濃霧 ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0714); 
    scene.fog = new THREE.FogExp2(0x140a24, 0.013); 

    // --- 2. 鏡頭配置 ---
    const camera = new THREE.PerspectiveCamera(52, container.clientWidth / container.clientHeight, 0.1, 500);
    camera.position.set(0, 35, 65);

    // --- 3. 渲染器配置與陰影貼圖 ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 鏡頭軌道控制
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // --- 4. 驚悚末日光影系統 ---
    const ambientLight = new THREE.AmbientLight(0x473b64, 1.1);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xe2e8f0, 3.2);
    moonLight.position.set(32, 65, 30);
    moonLight.castShadow = true;
    scene.add(moonLight);

    const fillLight = new THREE.DirectionalLight(0x7c3aed, 1.6);
    fillLight.position.set(-35, 45, -40);
    scene.add(fillLight);

    const roseSpotlight = new THREE.SpotLight(0x38bdf8, 4.5, 95, Math.PI / 4.5, 0.7);
    roseSpotlight.position.set(0, 22, -56);
    roseSpotlight.target.position.set(0, 2, -10);
    scene.add(roseSpotlight);
    scene.add(roseSpotlight.target);

    // --- 5. 基礎材質庫 ---
    const stoneFloorMat = new THREE.MeshStandardMaterial({ color: 0x1e2230, roughness: 0.85, metalness: 0.15 });
    const crackedTileMat = new THREE.MeshStandardMaterial({ color: 0x2a3042, roughness: 0.75, metalness: 0.2 });
    const ruinWallMat = new THREE.MeshStandardMaterial({ color: 0x1a1f2c, roughness: 0.9, metalness: 0.1 });
    const gothicStonePillarMat = new THREE.MeshStandardMaterial({ color: 0x333b4f, roughness: 0.7, metalness: 0.2 });
    const goldAltarMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
    const selectedGlowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.85 });

    // --- 6. 地表與建築基座 ---
    const mapRootGroup = new THREE.Group();
    scene.add(mapRootGroup);

    const floorGeo = new THREE.PlaneGeometry(130, 130);
    const floorMesh = new THREE.Mesh(floorGeo, stoneFloorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    mapRootGroup.add(floorMesh);

    const aisleGeo = new THREE.BoxGeometry(18, 0.15, 115);
    const aisleMesh = new THREE.Mesh(aisleGeo, crackedTileMat);
    aisleMesh.position.set(0, 0.075, 0);
    aisleMesh.receiveShadow = true;
    mapRootGroup.add(aisleMesh);

    // --- 7. 大型玫瑰花窗與哥德式拱形迴廊 ---
    const roseWindowGroup = new THREE.Group();
    roseWindowGroup.position.set(0, 20, -58);
    const roseOuterRing = new THREE.Mesh(new THREE.RingGeometry(6.0, 8.5, 32), goldAltarMat);
    roseWindowGroup.add(roseOuterRing);

    const roseInnerGlass = new THREE.Mesh(new THREE.CircleGeometry(5.8, 32), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    roseInnerGlass.position.z = -0.1;
    roseWindowGroup.add(roseInnerGlass);

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.4, 11.5, 0.3), ruinWallMat);
      spoke.rotation.z = angle;
      roseWindowGroup.add(spoke);
    }
    mapRootGroup.add(roseWindowGroup);

    const archCurveGeo = new THREE.TorusGeometry(8.5, 0.7, 8, 24, Math.PI);
    [-35, -15, 5, 25, 45].forEach((zVal) => {
      const leftRib = new THREE.Mesh(archCurveGeo, gothicStonePillarMat);
      leftRib.position.set(-12, 17, zVal);
      leftRib.rotation.y = Math.PI / 2;
      leftRib.castShadow = true;
      mapRootGroup.add(leftRib);

      const rightRib = new THREE.Mesh(archCurveGeo, gothicStonePillarMat);
      rightRib.position.set(12, 17, zVal);
      rightRib.rotation.y = Math.PI / 2;
      rightRib.castShadow = true;
      mapRootGroup.add(rightRib);
    });

    // --- 8. 讀取 objects 陣列動態生成 3D 地圖物件 ---
    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);

    objects.forEach((obj) => {
      const isSelected = obj.id === selectedObjectId;
      const group = new THREE.Group();
      group.position.set(obj.position.x, obj.position.y || 0, obj.position.z);

      const w = obj.size?.width || 2;
      const h = obj.size?.height || 2;
      const d = obj.size?.depth || 2;

      if (obj.type === 'generator') {
        // 2D 例繪立牌發電機 (SpriteVisual 子物件，直立於地面)
        const planeMat = new THREE.MeshBasicMaterial({
          map: obj.isRepaired ? hasfixTexture : unfixTexture,
          transparent: true,
          side: THREE.DoubleSide,
          color: isSelected ? 0x38bdf8 : 0xffffff,
        });
        const spriteVisual = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), planeMat);
        spriteVisual.name = 'SpriteVisual';
        spriteVisual.position.y = 1.8;
        group.add(spriteVisual);
      } else if (obj.type === 'exit_gate') {
        // 2D 例繪立牌大門 (0~99% noopen.png, 100% open.png)
        const planeMat = new THREE.MeshBasicMaterial({
          map: obj.isRepaired ? openTexture : noopenTexture,
          transparent: true,
          side: THREE.DoubleSide,
          color: isSelected ? 0x38bdf8 : 0xffffff,
        });
        const spriteVisual = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.5), planeMat);
        spriteVisual.name = 'GateSpriteVisual';
        spriteVisual.position.y = 3.75;
        group.add(spriteVisual);
      } else {
        // 牆壁、長椅與十字架障礙物
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), isSelected ? selectedGlowMat : ruinWallMat);
        mesh.position.y = h / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }

      objectsGroup.add(group);
    });

    // --- 9. 讀取 characters 繪製角色方塊 ---
    const charGroup = new THREE.Group();
    scene.add(charGroup);

    characters.forEach((char) => {
      const isUser = char.id === selectedCharacterId;
      const charMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 3, 1.6),
        new THREE.MeshStandardMaterial({ color: char.role === 'killer' ? 0xd97706 : isUser ? 0x10b981 : 0x2563eb })
      );
      charMesh.position.set(char.position.x, 1.5, char.position.z);
      charMesh.castShadow = true;
      charGroup.add(charMesh);
    });

    // --- 10. 動態動畫渲染循環 ---
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      
      // 根據 cameraView 參數動態調整相機視角
      if (cameraView === 'top_down') {
        camera.position.set(0, 90, 0);
        camera.lookAt(0, 0, 0);
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // 視窗大小自動縮放
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 清除記憶體
    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [objects, characters, cameraView, selectedObjectId, selectedCharacterId]);

  return <div ref={containerRef} className="w-full h-full relative" />;
};
