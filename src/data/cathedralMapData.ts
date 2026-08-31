import { Character, MapObject } from '../types';

export const INITIAL_MAP_OBJECTS: MapObject[] = [
  // 5 Active Objectives (Generators)
  {
    id: 'gen_01',
    name: '中央祭壇聖火發電機 A',
    type: 'generator',
    position: { x: 0, y: 0, z: -25 },
    size: { width: 3, height: 2.5, depth: 3 },
    isActiveGenerator: true,
    isRepaired: false,
    repairProgress: 0,
    color: '#10b981'
  },
  {
    id: 'gen_02',
    name: '左翼祈禱室發電機 B',
    type: 'generator',
    position: { x: -35, y: 0, z: -20 },
    size: { width: 3, height: 2.5, depth: 3 },
    isActiveGenerator: true,
    isRepaired: false,
    repairProgress: 0,
    color: '#10b981'
  },
  {
    id: 'gen_03',
    name: '右翼告解室發電機 C',
    type: 'generator',
    position: { x: 35, y: 0, z: -20 },
    size: { width: 3, height: 2.5, depth: 3 },
    isActiveGenerator: true,
    isRepaired: false,
    repairProgress: 0,
    color: '#10b981'
  },
  {
    id: 'gen_04',
    name: '中庭破敗長椅區發電機 D',
    type: 'generator',
    position: { x: -20, y: 0, z: 10 },
    size: { width: 3, height: 2.5, depth: 3 },
    isActiveGenerator: true,
    isRepaired: false,
    repairProgress: 0,
    color: '#10b981'
  },
  {
    id: 'gen_05',
    name: '南門正殿迴廊發電機 E',
    type: 'generator',
    position: { x: 20, y: 0, z: 10 },
    size: { width: 3, height: 2.5, depth: 3 },
    isActiveGenerator: true,
    isRepaired: false,
    repairProgress: 0,
    color: '#10b981'
  },

  // 5 Decoy Generators
  {
    id: 'decoy_01',
    name: '偽裝故障發電機 V (誘餌)',
    type: 'generator',
    position: { x: -30, y: 0, z: 40 },
    size: { width: 2.8, height: 2.2, depth: 2.8 },
    isActiveGenerator: false,
    isRepaired: false,
    repairProgress: 0,
    color: '#64748b'
  },
  {
    id: 'decoy_02',
    name: '偽裝故障發電機 W (誘餌)',
    type: 'generator',
    position: { x: 30, y: 0, z: 40 },
    size: { width: 2.8, height: 2.2, depth: 2.8 },
    isActiveGenerator: false,
    isRepaired: false,
    repairProgress: 0,
    color: '#64748b'
  },
  {
    id: 'decoy_03',
    name: '偽裝故障發電機 X (誘餌)',
    type: 'generator',
    position: { x: -45, y: 0, z: 5 },
    size: { width: 2.8, height: 2.2, depth: 2.8 },
    isActiveGenerator: false,
    isRepaired: false,
    repairProgress: 0,
    color: '#64748b'
  },
  {
    id: 'decoy_04',
    name: '偽裝故障發電機 Y (誘餌)',
    type: 'generator',
    position: { x: 45, y: 0, z: 5 },
    size: { width: 2.8, height: 2.2, depth: 2.8 },
    isActiveGenerator: false,
    isRepaired: false,
    repairProgress: 0,
    color: '#64748b'
  },
  {
    id: 'decoy_05',
    name: '偽裝故障發電機 Z (誘餌)',
    type: 'generator',
    position: { x: 0, y: 0, z: 48 },
    size: { width: 2.8, height: 2.2, depth: 2.8 },
    isActiveGenerator: false,
    isRepaired: false,
    repairProgress: 0,
    color: '#64748b'
  },

  // 1 Main Arch Exit Gate
  {
    id: 'gate_main',
    name: '哥德大教堂主拱門出口',
    type: 'exit_gate',
    position: { x: 0, y: 0, z: -58 },
    size: { width: 14, height: 10, depth: 4 },
    color: '#eab308'
  },

  // 4 Secluded Prison Cages
  {
    id: 'cage_01',
    name: '西北隱密鐵籠 1',
    type: 'cage',
    position: { x: -50, y: 0, z: -45 },
    size: { width: 3.5, height: 4, depth: 3.5 },
    color: '#ef4444'
  },
  {
    id: 'cage_02',
    name: '東北隱密鐵籠 2',
    type: 'cage',
    position: { x: 50, y: 0, z: -45 },
    size: { width: 3.5, height: 4, depth: 3.5 },
    color: '#ef4444'
  },
  {
    id: 'cage_03',
    name: '西南隱密鐵籠 3',
    type: 'cage',
    position: { x: -50, y: 0, z: 45 },
    size: { width: 3.5, height: 4, depth: 3.5 },
    color: '#ef4444'
  },
  {
    id: 'cage_04',
    name: '東南隱密鐵籠 4',
    type: 'cage',
    position: { x: 50, y: 0, z: 45 },
    size: { width: 3.5, height: 4, depth: 3.5 },
    color: '#ef4444'
  },

  // Central Altar
  {
    id: 'altar_main',
    name: '大教堂大理石主祭壇',
    type: 'altar',
    position: { x: 0, y: 0, z: -32 },
    size: { width: 12, height: 3, depth: 6 },
    isCover: true,
    color: '#94a3b8'
  },

  // Pillars & Colonnades
  { id: 'pillar_01', name: '石柱 Pillar N1', type: 'pillar', position: { x: -12, y: 0, z: -15 }, size: { width: 2.5, height: 12, depth: 2.5 }, isCover: true, color: '#475569' },
  { id: 'pillar_02', name: '石柱 Pillar N2', type: 'pillar', position: { x: 12, y: 0, z: -15 }, size: { width: 2.5, height: 12, depth: 2.5 }, isCover: true, color: '#475569' },
  { id: 'pillar_03', name: '石柱 Pillar M1', type: 'pillar', position: { x: -12, y: 0, z: 5 }, size: { width: 2.5, height: 12, depth: 2.5 }, isCover: true, color: '#475569' },
  { id: 'pillar_04', name: '石柱 Pillar M2', type: 'pillar', position: { x: 12, y: 0, z: 5 }, size: { width: 2.5, height: 12, depth: 2.5 }, isCover: true, color: '#475569' },
  { id: 'pillar_05', name: '石柱 Pillar S1', type: 'pillar', position: { x: -12, y: 0, z: 25 }, size: { width: 2.5, height: 12, depth: 2.5 }, isCover: true, color: '#475569' },
  { id: 'pillar_06', name: '石柱 Pillar S2', type: 'pillar', position: { x: 12, y: 0, z: 25 }, size: { width: 2.5, height: 12, depth: 2.5 }, isCover: true, color: '#475569' },

  // Pews
  { id: 'pew_01', name: '長椅 Pew L1', type: 'pew', position: { x: -6, y: 0, z: -5 }, size: { width: 4, height: 1.5, depth: 1.2 }, isCover: true, color: '#78350f' },
  { id: 'pew_02', name: '長椅 Pew R1', type: 'pew', position: { x: 6, y: 0, z: -5 }, size: { width: 4, height: 1.5, depth: 1.2 }, isCover: true, color: '#78350f' },
  { id: 'pew_03', name: '長椅 Pew L2', type: 'pew', position: { x: -6, y: 0, z: 15 }, size: { width: 4, height: 1.5, depth: 1.2 }, isCover: true, color: '#78350f' },
  { id: 'pew_04', name: '長椅 Pew R2', type: 'pew', position: { x: 6, y: 0, z: 15 }, size: { width: 4, height: 1.5, depth: 1.2 }, isCover: true, color: '#78350f' },

  // Covers / Ruins
  { id: 'cover_01', name: '塌陷牆垣 Cover 01', type: 'cover', position: { x: -25, y: 0, z: -35 }, size: { width: 6, height: 2, depth: 1.5 }, isCover: true, color: '#334155' },
  { id: 'cover_02', name: '殘破雕像 Cover 02', type: 'cover', position: { x: 25, y: 0, z: -35 }, size: { width: 4, height: 3, depth: 4 }, isCover: true, color: '#334155' },
  { id: 'cover_03', name: '碎石堆 Cover 03', type: 'cover', position: { x: -38, y: 0, z: -5 }, size: { width: 5, height: 1.8, depth: 3 }, isCover: true, color: '#334155' },
  { id: 'cover_04', name: '倒榻木樑 Cover 04', type: 'cover', position: { x: 38, y: 0, z: -5 }, size: { width: 6, height: 1.5, depth: 2 }, isCover: true, color: '#334155' },
  { id: 'cover_05', name: '告解亭廢墟 Cover 05', type: 'cover', position: { x: -15, y: 0, z: 32 }, size: { width: 4, height: 2.8, depth: 3 }, isCover: true, color: '#334155' },
  { id: 'cover_06', name: '聖歌架遺跡 Cover 06', type: 'cover', position: { x: 15, y: 0, z: 32 }, size: { width: 4, height: 2.2, depth: 3 }, isCover: true, color: '#334155' },

  // Outer 120m x 120m Boundary Walls
  { id: 'wall_north', name: '外圍北牆', type: 'wall', position: { x: 0, y: 0, z: -60 }, size: { width: 120, height: 12, depth: 2 }, color: '#0f172a' },
  { id: 'wall_south', name: '外圍南牆', type: 'wall', position: { x: 0, y: 0, z: 60 }, size: { width: 120, height: 12, depth: 2 }, color: '#0f172a' },
  { id: 'wall_west', name: '外圍西牆', type: 'wall', position: { x: -60, y: 0, z: 0 }, size: { width: 2, height: 12, depth: 120 }, color: '#0f172a' },
  { id: 'wall_east', name: '外圍東牆', type: 'wall', position: { x: 60, y: 0, z: 0 }, size: { width: 2, height: 12, depth: 120 }, color: '#0f172a' }
];

export const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'killer_1',
    name: '【老饕】陳家豪',
    role: 'killer',
    characterId: 'gourmet',
    health: 'healthy',
    position: { x: 0, z: -18 },
    rotation: 0,
    color: '#ef4444'
  },
  {
    id: 'survivor_1',
    name: '佐藤 健人 (Kento)',
    role: 'survivor',
    characterId: 'kento',
    health: 'healthy',
    position: { x: -35, z: 25 },
    rotation: Math.PI / 4,
    color: '#38bdf8'
  },
  {
    id: 'survivor_2',
    name: '傑克・米勒 (Jack)',
    role: 'survivor',
    characterId: 'jack',
    health: 'healthy',
    position: { x: 35, z: 25 },
    rotation: -Math.PI / 4,
    color: '#10b981'
  },
  {
    id: 'survivor_3',
    name: '艾瑞克・托森 (Erik)',
    role: 'survivor',
    characterId: 'erik',
    health: 'healthy',
    position: { x: -25, z: -10 },
    rotation: Math.PI / 2,
    color: '#f97316'
  },
  {
    id: 'survivor_4',
    name: '塔里克 (Tariq)',
    role: 'survivor',
    characterId: 'tariq',
    health: 'healthy',
    position: { x: 25, z: -10 },
    rotation: -Math.PI / 2,
    color: '#a855f7'
  }
];
