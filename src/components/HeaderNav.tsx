import React from 'react';
import { Camera, Compass, Eye, EyeOff, Radio, Download, ShieldAlert, Layers } from 'lucide-react';

interface HeaderNavProps {
  cameraView: 'orbit' | 'top_down' | 'first_person' | 'killer_perspective';
  onSetCameraView: (view: 'orbit' | 'top_down' | 'first_person' | 'killer_perspective') => void;
  showLOSOverlay: boolean;
  onToggleLOS: () => void;
  showTerrorRadius: boolean;
  onToggleTerrorRadius: () => void;
  onExportBlueprint: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  cameraView,
  onSetCameraView,
  showLOSOverlay,
  onToggleLOS,
  showTerrorRadius,
  onToggleTerrorRadius,
  onExportBlueprint
}) => {
  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between text-slate-100 z-30 shrink-0">
      
      {/* Title & Level Metadata */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm sm:text-base tracking-wide text-amber-100">
              破敗大教堂 (120m × 120m)
            </h1>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/40 uppercase">
              戰術藍圖 v2.5
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            Decayed Gothic Cathedral Level Blueprint & Tactical Audit
          </p>
        </div>
      </div>

      {/* Camera View Selector */}
      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs gap-1">
        <button
          onClick={() => onSetCameraView('orbit')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
            cameraView === 'orbit'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>軌道 3D</span>
        </button>

        <button
          onClick={() => onSetCameraView('top_down')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
            cameraView === 'top_down'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>俯視藍圖</span>
        </button>

        <button
          onClick={() => onSetCameraView('first_person')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
            cameraView === 'first_person'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>第一人稱</span>
        </button>

        <button
          onClick={() => onSetCameraView('killer_perspective')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
            cameraView === 'killer_perspective'
              ? 'bg-red-500 text-white font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>殺手視角</span>
        </button>
      </div>

      {/* Overlay Toggles & Export Action */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleLOS}
          title="切換視線遮蔽陰影 (Line of Sight)"
          className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
            showLOSOverlay
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
          }`}
        >
          {showLOSOverlay ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4" />}
          <span className="hidden lg:inline">視線陰影</span>
        </button>

        <button
          onClick={onToggleTerrorRadius}
          title="切換殺手恐懼氣場範圍 (32m)"
          className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
            showTerrorRadius
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <Radio className={`w-4 h-4 ${showTerrorRadius ? 'text-rose-400 animate-pulse' : ''}`} />
          <span className="hidden lg:inline">恐懼氣場</span>
        </button>

        <button
          onClick={onExportBlueprint}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>匯出藍圖 JSON</span>
        </button>
      </div>

    </header>
  );
};
