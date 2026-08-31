import React from 'react';
import { GameStats } from '../types';
import { Trophy, RotateCcw, Home, Skull, Shield, Zap, Lock } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  onRestart?: () => void;
  onHome?: () => void;
  onReturnMenu?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart, onHome, onReturnMenu }) => {
  const isKillerWin = stats.winner === 'killer';
  const isSurvivorWin = stats.winner === 'survivor';
  const isDraw = stats.winner === 'draw';

  const handleHome = onHome || onReturnMenu || (() => window.location.reload());
  const handleRestart = onRestart || onReturnMenu || (() => window.location.reload());

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}分 ${s < 10 ? '0' : ''}${s}秒`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020304]/90 backdrop-blur-2xl flex items-center justify-center p-4 font-sans select-none animate-fadeIn">
      <div className="bg-[#0a0d0c]/95 border border-white/15 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Top Glow Accent */}
        <div
          className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${
            isKillerWin
              ? 'from-rose-600 via-red-500 to-amber-600 shadow-[0_0_15px_rgba(225,29,72,0.8)]'
              : isSurvivorWin
              ? 'from-blue-600 via-cyan-500 to-emerald-600 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
              : 'from-amber-500 via-purple-500 to-rose-500'
          }`}
        />

        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border shadow-2xl ${
            isKillerWin
              ? 'bg-rose-950/80 border-rose-500/80 text-rose-400 shadow-[0_0_25px_rgba(225,29,72,0.4)]'
              : isSurvivorWin
              ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
              : 'bg-amber-950/80 border-amber-500/80 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
          }`}
        >
          {isKillerWin && <Skull className="w-8 h-8 drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]" />}
          {isSurvivorWin && <Shield className="w-8 h-8 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />}
          {isDraw && <Trophy className="w-8 h-8" />}
        </div>

        {/* Result Heading */}
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-wide">
          {isKillerWin && '殺手陣營 獲勝！'}
          {isSurvivorWin && '逃生者陣營 獲勝！'}
          {isDraw && '棋逢敵手 • 勢均力敵 (平局)'}
        </h2>
        
        {/* Win Reason Explanation */}
        <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 mb-6 text-xs text-slate-300 font-medium leading-relaxed">
          {stats.winReason || (
            isKillerWin
              ? '3 名以上逃生者已被獻祭或關押，殺手掌控了整場對局。'
              : isSurvivorWin
              ? '3 名以上逃生者成功打開大門逃離生天。'
              : '逃脫與獻祭人數相當，雙方戰成平手。'
          )}
        </div>

        {/* Match Stats Grid */}
        <div className="w-full bg-[#050706]/80 p-4 rounded-2xl border border-white/10 text-xs grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 shadow-inner">
          <div className="p-2.5 rounded-xl bg-[#0a0d0c]/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> 修復電箱
            </span>
            <span className="text-sm font-black text-white mt-1">{stats.gensCompleted} / 5</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0a0d0c]/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" /> 成功逃脫
            </span>
            <span className="text-sm font-black text-cyan-300 mt-1">{stats.survivorsEscaped} 人</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0a0d0c]/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
              <Skull className="w-3 h-3 text-rose-400" /> 獻祭死亡
            </span>
            <span className="text-sm font-black text-rose-400 mt-1">{stats.survivorsKilled} 人</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0a0d0c]/60 border border-white/5 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3 text-purple-400" /> 當前關押
            </span>
            <span className="text-sm font-black text-purple-300 mt-1">{stats.survivorsCaged || 0} 人</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0a0d0c]/60 border border-white/5 flex flex-col items-center col-span-2 sm:col-span-2">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">對戰耗時 (上限 10 分鐘)</span>
            <span className="text-sm font-black text-slate-200 mt-1 font-mono">{formatTime(stats.matchTime)} / 10分 00秒</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex gap-3">
          <button
            onClick={handleHome}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-black text-xs transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            <Home className="w-4 h-4" />
            <span>返回主選單</span>
          </button>

          <button
            onClick={handleRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-950/80 border border-rose-400/50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再玩一局</span>
          </button>
        </div>

      </div>
    </div>
  );
};
