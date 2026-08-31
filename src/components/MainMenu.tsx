import React, { useState } from 'react';
import { Faction, MapType, KILLERS, SURVIVORS, CharacterInfo } from '../types';
import { CharacterArt } from './CharacterArt';
import { JACK_SPRITE_ITEMS } from '../game/jackCharacter';
import { TARIQ_SPRITE_ITEMS } from '../game/tariqCharacter';
import { ERIK_SPRITE_ITEMS } from '../game/erikCharacter';
import { GOURMET_SPRITE_ITEMS } from '../game/gourmetCharacter';
import { ELENA_SPRITE_ITEMS } from '../game/elenaCharacter';
import { KENTO_SPRITE_ITEMS } from '../game/kentoCharacter';
import {
  Shield,
  Skull,
  Zap,
  Play,
  LogOut,
  Flame,
  HeartPulse,
  UserCheck,
  Crosshair,
  Map,
  BookOpen,
  User,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface MainMenuProps {
  onStartGame?: (config: {
    userFaction: Faction;
    userCharacterId: string;
    mapType: MapType;
    mapSelection?: 'random' | MapType;
  }) => void;
  onStartMatch?: (config: {
    userFaction: Faction;
    userCharacterId: string;
    mapType: MapType;
    mapSelection?: 'random' | MapType;
  }) => void;
  onBackToTitle?: () => void;
  onExitApp?: () => void;
  initialFaction?: Faction;
  initialCharacterId?: string;
  initialMap?: 'random' | MapType;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onStartMatch,
  onBackToTitle,
  onExitApp,
  initialFaction = 'survivor',
  initialCharacterId = 'kento',
  initialMap = 'random',
}) => {
  const [faction, setFaction] = useState<Faction>(initialFaction);
  const [selectedCharId, setSelectedCharId] = useState<string>(initialCharacterId);
  const [mapSelection, setMapSelection] = useState<'random' | MapType>(initialMap || 'random');

  const currentCharacters = faction === 'killer' ? KILLERS : SURVIVORS;
  const selectedCharacter =
    currentCharacters.find(c => c.id === selectedCharId) || currentCharacters[0];

  const handleFactionSelect = (f: Faction) => {
    setFaction(f);
    setSelectedCharId(f === 'killer' ? KILLERS[0].id : SURVIVORS[0].id);
  };

  const handleStart = () => {
    // 50% chance for Ximending, 50% chance for Cathedral when random
    const finalMap: MapType =
      mapSelection === 'random'
        ? (Math.random() < 0.5 ? 'ximending' : 'cathedral')
        : mapSelection;

    const config = {
      userFaction: faction,
      userCharacterId: selectedCharacter.id,
      mapType: finalMap,
      mapSelection: mapSelection,
    };
    if (onStartGame) onStartGame(config);
    else if (onStartMatch) onStartMatch(config);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050607] text-slate-100 flex flex-col justify-between p-4 md:p-8 overflow-y-auto select-none font-sans">
      {/* Dark Ambient Gradient & Fog Background */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#050607] to-[#020304]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-rose-950/20 via-transparent to-transparent" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-950/20 via-transparent to-transparent" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-wrap justify-between items-center border-b border-white/10 pb-4 mb-6 gap-3">
        <div className="flex items-center gap-3">
          {onBackToTitle && (
            <button
              onClick={onBackToTitle}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition shadow-md flex items-center gap-1 text-xs font-bold mr-1"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>首頁</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-950/50 border border-rose-400/40">
            <Skull className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-slate-200">
              選擇陣營與角色檔案
            </h1>
            <p className="text-xs text-slate-400">4v1 非對稱恐怖生存對戰 • 全中文設定集</p>
          </div>
        </div>

        {/* TOP UNMISSABLE START GAME BUTTON */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleStart}
            className={`px-7 py-3 rounded-xl font-black text-sm md:text-base flex items-center gap-2 shadow-2xl transition-all transform hover:scale-105 active:scale-100 border ${
              faction === 'killer'
                ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white border-rose-400/80 shadow-[0_0_25px_rgba(225,29,72,0.6)]'
                : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-500 hover:to-cyan-500 text-white border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.6)]'
            }`}
          >
            <Play className="w-5 h-5 fill-current text-white animate-pulse" />
            <span>開始對戰局</span>
          </button>

          <button
            onClick={onExitApp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0a0d0c]/80 hover:bg-rose-950/60 border border-white/10 text-slate-400 hover:text-rose-200 transition shadow-lg text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">退出</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
        
        {/* Left Column: Faction & Character Selection */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Faction Tabs */}
          <div className="bg-[#0a0d0c]/85 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 flex gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <button
              onClick={() => handleFactionSelect('survivor')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-sm transition-all ${
                faction === 'survivor'
                  ? 'bg-gradient-to-r from-blue-900/90 to-cyan-950/90 text-cyan-200 border border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>逃生者 (4人陣營)</span>
            </button>

            <button
              onClick={() => handleFactionSelect('killer')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-sm transition-all ${
                faction === 'killer'
                  ? 'bg-gradient-to-r from-rose-950/90 to-red-950/90 text-rose-200 border border-rose-600/60 shadow-[0_0_20px_rgba(225,29,72,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Skull className="w-4 h-4 text-rose-500" />
              <span>殺手 (1人陣營)</span>
            </button>
          </div>

          {/* Character List Grid */}
          <div className="bg-[#0a0d0c]/85 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>選擇角色 ({currentCharacters.length} 種可選)</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {currentCharacters.map((char) => {
                const isSelected = char.id === selectedCharId;
                return (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharId(char.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? faction === 'killer'
                          ? 'bg-rose-950/50 border-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.25)]'
                          : 'bg-cyan-950/50 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-[#050706]/60 border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-inner border border-white/20"
                        style={{ backgroundColor: char.avatarColor }}
                      />
                      <span className="font-black text-sm truncate">{char.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{char.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Selection Option */}
          <div className="bg-[#0a0d0c]/85 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Map className="w-3.5 h-3.5 text-emerald-400" />
              <span>對戰地圖選擇 (進入遊戲後隨機生成)</span>
            </h2>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => setMapSelection('random')}
                className={`py-2 px-3 rounded-xl border font-bold transition-all ${
                  mapSelection === 'random'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-[#050706]/60 border-white/5 text-slate-400 hover:bg-white/5'
                }`}
              >
                🎲 隨機選擇
              </button>
              <button
                onClick={() => setMapSelection('ximending')}
                className={`py-2 px-3 rounded-xl border font-bold transition-all ${
                  mapSelection === 'ximending'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-[#050706]/60 border-white/5 text-slate-400 hover:bg-white/5'
                }`}
              >
                廢土西門町
              </button>
              <button
                onClick={() => setMapSelection('cathedral')}
                className={`py-2 px-3 rounded-xl border font-bold transition-all ${
                  mapSelection === 'cathedral'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                    : 'bg-[#050706]/60 border-white/5 text-slate-400 hover:bg-white/5'
                }`}
              >
                破敗大教堂
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Character Detailed Dossier & Large Art */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-[#0a0d0c]/85 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          
          {/* Top Quick Action Bar with Unmissable START GAME Button */}
          <div className="flex items-center justify-between gap-4 bg-[#050706] p-3 rounded-2xl border border-white/10">
            <div>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">當前選擇</span>
              <span className="text-sm font-black text-white">{selectedCharacter.name} ({faction === 'killer' ? '殺手' : '逃生者'})</span>
            </div>

            <button
              onClick={handleStart}
              className={`px-8 py-3 rounded-xl font-black text-base flex items-center gap-2 shadow-2xl transition-all transform hover:scale-105 active:scale-100 border ${
                faction === 'killer'
                  ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white border-rose-400/80 shadow-[0_0_25px_rgba(225,29,72,0.6)]'
                  : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-500 hover:to-cyan-500 text-white border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.6)]'
              }`}
            >
              <Play className="w-5 h-5 fill-current text-white animate-pulse" />
              <span>開始對戰局</span>
            </button>
          </div>

          {/* Large Character Art Preview Panel */}
          <CharacterArt characterId={selectedCharacter.id} className="w-full h-64 md:h-80 shadow-2xl" />

          {/* Kento Sato: 6 Action Sprites Gallery */}
          {selectedCharacter.id === 'kento' && (
            <div className="bg-[#05070a] p-3 rounded-2xl border border-blue-500/30">
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>【被加班吞噬的幽魂】佐藤健人 動作映射表 (6幀狀態機圖資)</span>
                <span className="text-[9px] text-blue-300 font-mono">0.5s 週期狀態機驅動</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {KENTO_SPRITE_ITEMS.map(asset => (
                  <div
                    key={asset.key}
                    className="flex flex-col items-center bg-slate-950/80 rounded-xl p-1.5 border border-white/10 hover:border-blue-400/60 transition group text-center"
                    title={asset.description}
                  >
                    <img
                      src={asset.src}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[9px] font-mono text-slate-300 mt-1 font-bold truncate max-w-full">
                      {asset.name}
                    </span>
                    <span className="text-[8px] text-blue-400/80 font-bold truncate max-w-full">
                      {asset.key === 'front'
                        ? '正面靜止'
                        : asset.key === 'left1'
                        ? 'WA 幀 1'
                        : asset.key === 'left2'
                        ? 'WA 幀 2'
                        : asset.key === 'right1'
                        ? 'SD 幀 1'
                        : asset.key === 'right2'
                        ? 'SD 幀 2'
                        : '擊倒瀕死'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jack Miller: 6 Action Sprites Gallery */}
          {selectedCharacter.id === 'jack' && (
            <div className="bg-[#050706] p-3 rounded-2xl border border-emerald-500/30">
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>【二戰美軍步兵下士】傑克・米勒 動作映射表 (6幀狀態機圖資)</span>
                <span className="text-[9px] text-emerald-300 font-mono">0.5s 週期狀態機驅動</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {JACK_SPRITE_ITEMS.map(asset => (
                  <div
                    key={asset.key}
                    className="flex flex-col items-center bg-slate-950/80 rounded-xl p-1.5 border border-white/10 hover:border-emerald-400/60 transition group text-center"
                    title={asset.description}
                  >
                    <img
                      src={asset.src}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[9px] font-mono text-slate-300 mt-1 font-bold truncate max-w-full">
                      {asset.name}
                    </span>
                    <span className="text-[8px] text-emerald-400/90 font-bold truncate max-w-full">
                      {asset.key === 'front'
                        ? '正面靜止'
                        : asset.key === 'left1'
                        ? 'WA 幀 1'
                        : asset.key === 'left2'
                        ? 'WA 幀 2'
                        : asset.key === 'right1'
                        ? 'SD 幀 1'
                        : asset.key === 'right2'
                        ? 'SD 幀 2'
                        : '擊倒瀕死'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tariq Al-Hashim: 6 Action Sprites Gallery */}
          {selectedCharacter.id === 'tariq' && (
            <div className="bg-[#0c0517] p-3 rounded-2xl border border-purple-500/30">
              <div className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>【潛伏的背叛者】塔里克 動作映射表 (6幀狀態機圖資)</span>
                <span className="text-[9px] text-purple-300 font-mono">0.5s 週期狀態機驅動</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {TARIQ_SPRITE_ITEMS.map(asset => (
                  <div
                    key={asset.key}
                    className="flex flex-col items-center bg-slate-950/80 rounded-xl p-1.5 border border-white/10 hover:border-purple-400/60 transition group text-center"
                    title={asset.description}
                  >
                    <img
                      src={asset.src}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[9px] font-mono text-slate-300 mt-1 font-bold truncate max-w-full">
                      {asset.name}
                    </span>
                    <span className="text-[8px] text-purple-400/90 font-bold truncate max-w-full">
                      {asset.key === 'front'
                        ? '正面靜止'
                        : asset.key === 'left1'
                        ? 'WA 幀 1'
                        : asset.key === 'left2'
                        ? 'WA 幀 2'
                        : asset.key === 'right1'
                        ? 'SD 幀 1'
                        : asset.key === 'right2'
                        ? 'SD 幀 2'
                        : '擊倒瀕死'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Erik Thorsson: 6 Action Sprites Gallery */}
          {selectedCharacter.id === 'erik' && (
            <div className="bg-[#0b0603] p-3 rounded-2xl border border-orange-500/30">
              <div className="text-[10px] font-black text-orange-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>【維京狂戰士】艾瑞克・「紅髮」托森 動作映射表 (6幀狀態機圖資)</span>
                <span className="text-[9px] text-orange-300 font-mono">0.5s 週期狀態機驅動</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {ERIK_SPRITE_ITEMS.map(asset => (
                  <div
                    key={asset.key}
                    className="flex flex-col items-center bg-slate-950/80 rounded-xl p-1.5 border border-white/10 hover:border-orange-400/60 transition group text-center"
                    title={asset.description}
                  >
                    <img
                      src={asset.src}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[9px] font-mono text-slate-300 mt-1 font-bold truncate max-w-full">
                      {asset.name}
                    </span>
                    <span className="text-[8px] text-orange-400/90 font-bold truncate max-w-full">
                      {asset.key === 'front'
                        ? '正面靜止'
                        : asset.key === 'left1'
                        ? 'WA 幀 1'
                        : asset.key === 'left2'
                        ? 'WA 幀 2'
                        : asset.key === 'right1'
                        ? 'SD 幀 1'
                        : asset.key === 'right2'
                        ? 'SD 幀 2'
                        : '擊倒瀕死'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chen Chia-Hao (The Gourmet): 6 Action Sprites Gallery */}
          {selectedCharacter.id === 'gourmet' && (
            <div className="bg-[#0f0404] p-3 rounded-2xl border border-rose-600/40">
              <div className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>【老饕】陳家豪 動作映射表 (6幀狀態機圖資)</span>
                <span className="text-[9px] text-slate-400 font-mono">0.5s 週期狀態機驅動</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {GOURMET_SPRITE_ITEMS.map(asset => (
                  <div
                    key={asset.key}
                    className="flex flex-col items-center bg-slate-950/80 rounded-xl p-1.5 border border-white/10 hover:border-rose-500/60 transition group text-center"
                    title={asset.description}
                  >
                    <img
                      src={asset.src}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[8px] font-mono text-slate-300 mt-1 font-bold truncate max-w-full">
                      {asset.name}
                    </span>
                    <span className="text-[7px] text-rose-400/80 font-bold truncate max-w-full">
                      {asset.key === 'front'
                        ? '正面靜止'
                        : asset.key === 'left1'
                        ? 'WA 幀 1'
                        : asset.key === 'left2'
                        ? 'WA 幀 2'
                        : asset.key === 'right1'
                        ? 'SD 幀 1'
                        : asset.key === 'right2'
                        ? 'SD 幀 2'
                        : '擊倒瀕死'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Elena (The Tundra Shaman): 6 Action & Attack Sprites Gallery */}
          {selectedCharacter.id === 'elena' && (
            <div className="bg-[#040f1a] p-3 rounded-2xl border border-sky-500/40">
              <div className="text-[10px] font-black text-sky-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>【凍原祭司】艾琳娜 動作與攻擊圖資 (6幀狀態機與魔法投射)</span>
                <span className="text-[9px] text-sky-300 font-mono">Shift 投射 attack.png</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {ELENA_SPRITE_ITEMS.map(asset => (
                  <div
                    key={asset.key}
                    className="flex flex-col items-center bg-slate-950/80 rounded-xl p-1.5 border border-white/10 hover:border-sky-500/60 transition group text-center"
                    title={asset.description}
                  >
                    <img
                      src={asset.src}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[9px] font-mono text-slate-300 mt-1 font-bold truncate max-w-full">
                      {asset.name}
                    </span>
                    <span className="text-[8px] text-sky-400/90 font-bold truncate max-w-full">
                      {asset.key === 'front'
                        ? '正面靜止'
                        : asset.key === 'left1'
                        ? '向左幀 1'
                        : asset.key === 'left2'
                        ? '向左幀 2'
                        : asset.key === 'right1'
                        ? '向右幀 1'
                        : asset.key === 'right2'
                        ? '向右幀 2'
                        : '冰霜魔法'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Character Header & Basic Profile */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                      faction === 'killer'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-600/60'
                        : 'bg-blue-950/80 text-blue-300 border-blue-600/60'
                    }`}
                  >
                    {faction === 'killer' ? '殺手 陣營' : '逃生者 陣營'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{selectedCharacter.title}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white">{selectedCharacter.name}</h2>
              </div>
            </div>

            {/* Profile Grid (國籍/身高體重/職業) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="bg-[#050706] p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block font-bold">國籍 / 種族</span>
                <span className="text-slate-200 font-extrabold">{selectedCharacter.nationality}</span>
              </div>
              <div className="bg-[#050706] p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block font-bold">身高 / 體重</span>
                <span className="text-slate-200 font-extrabold">{selectedCharacter.heightWeight}</span>
              </div>
              <div className="bg-[#050706] p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block font-bold">職業 / 身分</span>
                <span className="text-slate-200 font-extrabold">{selectedCharacter.career}</span>
              </div>
            </div>

            {/* Visual Design & Appearance */}
            <div className="bg-[#050706]/70 p-3.5 rounded-xl border border-white/5">
              <span className="text-xs font-black text-slate-300 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>外觀與視覺風格 (Visual Design)</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedCharacter.appearance}</p>
            </div>

            {/* Inner Personality */}
            <div className="bg-[#050706]/70 p-3.5 rounded-xl border border-white/5">
              <span className="text-xs font-black text-slate-300 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>內在性格 (Personality)</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedCharacter.personality}</p>
            </div>

            {/* Backstory Overview */}
            <div className="bg-[#050706]/70 p-3.5 rounded-xl border border-white/5">
              <span className="text-xs font-black text-slate-300 flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>背景故事概述 (Backstory)</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedCharacter.backstory}</p>
            </div>

            {/* Unique Character Skill Card */}
            <div className="bg-[#050706] p-4 rounded-xl border border-amber-500/40 shadow-inner">
              <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-black text-sm">
                <Zap className="w-4 h-4 fill-amber-400" />
                <span>角色特有技能：{selectedCharacter.skillName}</span>
                <span className="ml-auto text-[10px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/50">
                  {selectedCharacter.skillKey}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedCharacter.skillDescription}</p>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-4">
            <div className="text-[11px] text-slate-400">
              提示: <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded text-slate-200 font-mono">WASD</kbd> 移動 •{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded text-slate-200 font-mono">Space</kbd> 互動/攻擊 •{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded text-slate-200 font-mono">Shift</kbd> 技能
            </div>

            <button
              onClick={handleStart}
              className={`px-8 py-3.5 rounded-xl font-black text-base flex items-center gap-2 shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 border ${
                faction === 'killer'
                  ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white border-rose-400/60 shadow-rose-950/80 hover:shadow-[0_0_25px_rgba(225,29,72,0.5)]'
                  : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-500 hover:to-cyan-500 text-white border-cyan-400/60 shadow-cyan-950/80 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>開始對戰局</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
