import React from 'react';
import { GameMatchState, MapObject } from '../types';
import { Play, Pause, RotateCcw, Zap, DoorOpen, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface SimulationControlsProps {
  matchState: GameMatchState;
  objects: MapObject[];
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onResetMatch: () => void;
  onManualRepairGen: (genId: string) => void;
  onToggleCageSurvivor: () => void;
  onOpenExitGate: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  matchState,
  objects,
  isSimulating,
  onToggleSimulate,
  onResetMatch,
  onManualRepairGen,
  onToggleCageSurvivor,
  onOpenExitGate
}) => {
  const activeGens = objects.filter((o) => o.type === 'generator' && o.isActiveGenerator);
  const unrepairedGens = activeGens.filter((o) => !o.isRepaired);

  return (
    <div className="h-20 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-slate-200 z-30 shrink-0">
      
      {/* Simulation Toggle & Reset */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSimulate}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
            isSimulating
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
          }`}
        >
          {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          <span className="text-sm">{isSimulating ? '暫停對局模擬' : '開始戰術模擬'}</span>
        </button>

        <button
          onClick={onResetMatch}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition-all"
          title="重置對局與模擬狀態"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Timer */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-amber-400">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>
            {Math.floor(matchState.elapsedTime / 60)
              .toString()
              .padStart(2, '0')}
            :{(matchState.elapsedTime % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Generator Objectives Counter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px]">目標發電機</span>
            <span className="font-bold font-mono text-emerald-400 text-sm">
              {matchState.generatorsCompleted} / 5 已修理
            </span>
          </div>
        </div>

        {/* Exit Gate Status */}
        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <DoorOpen
            className={`w-4 h-4 ${
              matchState.exitGateState === 'open'
                ? 'text-amber-400'
                : matchState.exitGateState === 'powering'
                ? 'text-cyan-400 animate-bounce'
                : 'text-slate-500'
            }`}
          />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px]">拱門出口大門</span>
            <span
              className={`font-bold uppercase text-xs ${
                matchState.exitGateState === 'open'
                  ? 'text-amber-400'
                  : matchState.exitGateState === 'powering'
                  ? 'text-cyan-400'
                  : 'text-slate-500'
              }`}
            >
              {matchState.exitGateState === 'open'
                ? '🔓 已通電開啟 (OPEN)'
                : matchState.exitGateState === 'powering'
                ? '⚡ 充電中 (POWERING)'
                : '🔒 鎖定中 (LOCKED)'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Match Override Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (unrepairedGens.length > 0) {
              onManualRepairGen(unrepairedGens[0].id);
            }
          }}
          disabled={unrepairedGens.length === 0}
          className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 disabled:opacity-40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">快速完成 1 台發電機</span>
        </button>

        <button
          onClick={onOpenExitGate}
          disabled={matchState.exitGateState === 'open'}
          className="px-3 py-2 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 disabled:opacity-40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <DoorOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">開啟哥德大門</span>
        </button>
      </div>

    </div>
  );
};
