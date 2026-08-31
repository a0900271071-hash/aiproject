import React from 'react';
import { MapMetrics, MapObject } from '../types';
import { Box, CheckCircle2, Shield, Zap, AlertTriangle, Layers, Ruler, BarChart2, Lock } from 'lucide-react';

interface LevelDesignInspectorProps {
  selectedObject: MapObject | null;
  objects: MapObject[];
  metrics: MapMetrics;
  onRepairGenerator: (genId: string) => void;
}

export const LevelDesignInspector: React.FC<LevelDesignInspectorProps> = ({
  selectedObject,
  objects,
  metrics,
  onRepairGenerator
}) => {
  const activeGensCount = objects.filter((o) => o.type === 'generator' && o.isActiveGenerator).length;
  const decoyGensCount = objects.filter((o) => o.type === 'generator' && !o.isActiveGenerator).length;
  const cagesCount = objects.filter((o) => o.type === 'cage').length;

  return (
    <aside className="w-80 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col text-slate-200 overflow-y-auto shrink-0 z-20">
      
      {/* Level Design Audit Card Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2 mb-2">
          <BarChart2 className="w-4 h-4 text-amber-400" />
          <h2 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
            關卡審計 Audit Metrics
          </h2>
        </div>

        {/* Tactical Scores Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">總面積 Dimensions</span>
            <span className="font-bold text-slate-200 font-mono text-sm">14,400 m²</span>
            <span className="text-[10px] text-amber-400 block">120m × 120m</span>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">掩體覆蓋率 Cover</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">{metrics.coverDensityPercent}%</span>
            <span className="text-[10px] text-slate-400 block">{metrics.totalCoverObjects} 個掩體物件</span>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">發電機平衡分 Gen Score</span>
            <span className="font-bold text-amber-300 font-mono text-sm">{metrics.generatorDistributionScore} / 100</span>
            <span className="text-[10px] text-slate-400 block">{activeGensCount} 目標 + {decoyGensCount} 誘餌</span>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">監獄隱蔽分 Cage Score</span>
            <span className="font-bold text-rose-400 font-mono text-sm">{metrics.prisonSeclusionScore} / 100</span>
            <span className="text-[10px] text-slate-400 block">{cagesCount} 處角落鐵籠</span>
          </div>
        </div>
      </div>

      {/* Selected Object Inspector */}
      <div className="p-4 border-b border-slate-800 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">物件檢察器 Inspector</h3>
          </div>
          {selectedObject && (
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
              ID: {selectedObject.id}
            </span>
          )}
        </div>

        {selectedObject ? (
          <div className="space-y-4">
            
            {/* Object Name & Type */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase block font-mono mb-1">
                {selectedObject.type.toUpperCase()}
              </span>
              <h4 className="font-bold text-amber-300 text-base">{selectedObject.name}</h4>
            </div>

            {/* Spatial Position & Size */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-slate-400" />
                  <span>三維座標 Coordinates</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  ({selectedObject.position.x}m, {selectedObject.position.y}m, {selectedObject.position.z}m)
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                <span className="text-slate-400">體積尺寸 Dimensions (W×H×D)</span>
                <span className="font-mono text-slate-200">
                  {selectedObject.size.width}m × {selectedObject.size.height}m × {selectedObject.size.depth}m
                </span>
              </div>
            </div>

            {/* Generator Special Controls */}
            {selectedObject.type === 'generator' && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>目標屬性 Objective Type</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedObject.isActiveGenerator
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {selectedObject.isActiveGenerator ? '5 大目標發電機 (Target)' : '5 大非目標發電機 (Decoy)'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">修理進度 Repair Progress</span>
                    <span className="text-emerald-400 font-bold">{selectedObject.repairProgress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${selectedObject.repairProgress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Manual Repair Button */}
                <button
                  onClick={() => onRepairGenerator(selectedObject.id)}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                    selectedObject.isRepaired
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{selectedObject.isRepaired ? '強制取消修理完成' : '手動切換為修理完成 (100%)'}</span>
                </button>
              </div>
            )}

            {/* Cage Special Info */}
            {selectedObject.type === 'cage' && (
              <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-800/50 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>角落隱密鐵籠 (Prison Cage)</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  佈置於 120m 大教堂四個深處角落，距離中央發電機群 &gt;45 米，有效延長殺手押送與逃生者救援動線。
                </p>
              </div>
            )}

          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            點擊 3D View 或 2D Blueprint 上的任意發電機、鐵籠或掩體以檢視數據。
          </div>
        )}

      </div>

      {/* Map Objects List Navigation */}
      <div className="p-4 border-t border-slate-800">
        <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>地圖物件清單 ({objects.length})</span>
        </h4>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {objects.map((obj) => (
            <div
              key={obj.id}
              onClick={() => {}}
              className={`p-2 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer ${
                obj.id === selectedObject?.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="truncate max-w-[180px]">{obj.name}</span>
              <span className="font-mono text-[10px] text-slate-500 uppercase">{obj.type}</span>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
};
