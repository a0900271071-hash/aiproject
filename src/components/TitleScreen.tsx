import React from 'react';
import { Play, Skull, Shield, Zap, Flame, Compass, ChevronRight } from 'lucide-react';

interface TitleScreenProps {
  onEnterGame?: () => void;
  onStartGame?: () => void;
  onStart?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onEnterGame, onStartGame, onStart }) => {
  const handleEnter = () => {
    if (onEnterGame) onEnterGame();
    else if (onStartGame) onStartGame();
    else if (onStart) onStart();
  };
  return (
    <div className="relative min-h-screen w-full bg-[#030405] text-slate-100 flex flex-col items-center justify-between p-6 md:p-12 overflow-hidden select-none font-sans">
      {/* Ambient Dark Atmospheric Background Gradients */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-950/20 via-[#030405] to-black" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-amber-950/20 via-transparent to-transparent" />

      {/* Misty Fog Overlay Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none opacity-40" />

      {/* Top Header Bar */}
      <div className="relative z-10 w-full max-w-6xl flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-950/80 border border-rose-400/50">
            <Skull className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
          </div>
          <div>
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase block">4v1 非對稱恐怖生存對戰</span>
            <span className="text-sm font-bold text-slate-200">Deadly Escape Protocol</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>引擎運作中</span>
          </div>

          {/* TOP PROMINENT ENTER GAME BUTTON */}
          <button
            onClick={handleEnter}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-sm tracking-wide shadow-[0_0_20px_rgba(225,29,72,0.6)] border border-rose-400/80 transition-all transform hover:scale-105 active:scale-100 flex items-center gap-2 animate-pulse"
          >
            <Play className="w-4 h-4 fill-current text-white" />
            <span>進入遊戲 • 選擇陣營</span>
          </button>
        </div>
      </div>

      {/* Center Hero Section */}
      <div className="relative z-10 my-auto max-w-4xl text-center flex flex-col items-center py-8">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-950/80 via-purple-950/80 to-blue-950/80 border border-rose-500/40 text-rose-300 text-xs font-black tracking-widest mb-6 shadow-[0_0_20px_rgba(225,29,72,0.3)] animate-pulse">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>全新 PDF 角色檔案完整導入 • 6 大獨特角色對戰</span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]">
          迷霧生死鬥
        </h1>

        <p className="text-base md:text-xl font-bold text-slate-300 max-w-2xl mb-8 leading-relaxed">
          社畜、二戰老兵、維京狂戰士與潛伏者，在血色迷霧中對抗凍原祭司與狂暴老饕。
          修復電箱，拉開大門電閘，開啟生還之路。
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 w-full max-w-3xl">
          <div className="bg-[#0a0d0c]/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center justify-center gap-2 text-xs font-black text-slate-300 shadow-lg">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>3D 第三視角跟隨</span>
          </div>

          <div className="bg-[#0a0d0c]/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center justify-center gap-2 text-xs font-black text-slate-300 shadow-lg">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>4 人逃生者陣營</span>
          </div>

          <div className="bg-[#0a0d0c]/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center justify-center gap-2 text-xs font-black text-slate-300 shadow-lg">
            <Skull className="w-4 h-4 text-rose-400" />
            <span>1 人強烈殺手陣營</span>
          </div>

          <div className="bg-[#0a0d0c]/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center justify-center gap-2 text-xs font-black text-slate-300 shadow-lg">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>繁體中文角色設定</span>
          </div>
        </div>

        {/* MASSIVE ENTER GAME BUTTON */}
        <button
          onClick={handleEnter}
          className="group relative px-12 py-5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:via-red-500 hover:to-amber-500 text-white font-black text-xl tracking-wider shadow-[0_0_40px_rgba(225,29,72,0.6)] border border-rose-400/60 transition-all transform hover:-translate-y-1 hover:scale-105 active:translate-y-0 flex items-center gap-3"
        >
          <Play className="w-7 h-7 fill-current text-white group-hover:scale-110 transition-transform" />
          <span>進入遊戲 • 選擇陣營與角色</span>
          <ChevronRight className="w-6 h-6 text-amber-300 group-hover:translate-x-1.5 transition-transform" />
        </button>

      </div>

      {/* Footer Info Bar */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-4 text-xs text-slate-500 gap-2">
        <div>
          按鍵提示: <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded font-mono text-slate-300">WASD</kbd> 移動 •{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded font-mono text-slate-300">Space</kbd> 互動/攻擊 •{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded font-mono text-slate-300">Shift</kbd> 角色技能
        </div>
        <div>
          Deadly Escape Protocol © 2026 • 完整繁體中文 PDF 角色支援
        </div>
      </div>
    </div>
  );
};
