import React, { useState } from 'react';
import { Character, MapObject } from '../types';
import { ShieldAlert, Zap, Lock, Grid, User } from 'lucide-react';

interface TacticalOverlay2DProps {
  objects: MapObject[];
  characters: Character[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  showLOSOverlay: boolean;
  showTerrorRadius: boolean;
  killerTerrorRadius: number;
  onMoveCharacter: (charId: string, x: number, z: number) => void;
}

export const TacticalOverlay2D: React.FC<TacticalOverlay2DProps> = ({
  objects,
  characters,
  selectedObjectId,
  onSelectObject,
  showLOSOverlay,
  showTerrorRadius,
  killerTerrorRadius,
  onMoveCharacter
}) => {
  const [draggingCharId, setDraggingCharId] = useState<string | null>(null);

  // Map dimensions (-60m to +60m)
  const MAP_SIZE = 120;

  // Convert real meter coords (x, z) to SVG percentage (0% to 100%)
  const toSVGCoord = (val: number) => ((val + MAP_SIZE / 2) / MAP_SIZE) * 100;

  // Convert SVG click back to meter coords
  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingCharId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickXPercent = (e.clientX - rect.left) / rect.width;
    const clickZPercent = (e.clientY - rect.top) / rect.height;

    const realX = Math.round((clickXPercent * MAP_SIZE - MAP_SIZE / 2) * 10) / 10;
    const realZ = Math.round((clickZPercent * MAP_SIZE - MAP_SIZE / 2) * 10) / 10;

    onMoveCharacter(draggingCharId, realX, realZ);
    setDraggingCharId(null);
  };

  const killer = characters.find((c) => c.role === 'killer');

  return (
    <div className="w-full h-full bg-slate-950 relative flex items-center justify-center p-4 overflow-hidden select-none">
      
      {/* Blueprint Container */}
      <div className="relative w-full h-full max-w-4xl max-h-[85vh] aspect-square bg-slate-900/90 rounded-2xl border-2 border-slate-800 shadow-2xl p-2 flex flex-col">
        
        {/* Header HUD inside Blueprint */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-2 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-300">2D TACTICAL BLUEPRINT (120m × 120m)</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {draggingCharId ? (
              <span className="text-amber-400 animate-pulse font-semibold">點擊地圖任意處重新放置該角色 Pawn...</span>
            ) : (
              <span>拖曳/點擊角色圖示可實時移動擺放</span>
            )}
          </div>
        </div>

        {/* SVG Tactical Map Canvas */}
        <div className="relative flex-1 rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden">
          <svg
            className="w-full h-full cursor-crosshair"
            viewBox="0 0 100 100"
            onClick={handleSVGClick}
          >
            {/* Grid Lines (Every 10 Meters) */}
            {Array.from({ length: 13 }).map((_, i) => {
              const pos = (i / 12) * 100;
              return (
                <g key={`grid_${i}`}>
                  <line x1={pos} y1="0" x2={pos} y2="100" stroke="#1e293b" strokeWidth="0.2" />
                  <line x1="0" y1={pos} x2="100" y2={pos} stroke="#1e293b" strokeWidth="0.2" />
                </g>
              );
            })}

            {/* Main Axis Center Lines */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="#334155" strokeWidth="0.4" strokeDasharray="1,1" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="0.4" strokeDasharray="1,1" />

            {/* Killer Terror Radius Circle Overlay (32m = 26.6% SVG radius) */}
            {showTerrorRadius && killer && (
              <g>
                <circle
                  cx={toSVGCoord(killer.position.x)}
                  cy={toSVGCoord(killer.position.z)}
                  r={(killerTerrorRadius / MAP_SIZE) * 100}
                  fill="rgba(239, 68, 68, 0.12)"
                  stroke="#ef4444"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                  className="animate-pulse"
                />
              </g>
            )}

            {/* Line of Sight Shadows Overlay */}
            {showLOSOverlay && killer && (
              <polygon
                points={`${toSVGCoord(killer.position.x)},${toSVGCoord(killer.position.z)} ${toSVGCoord(killer.position.x - 20)},${toSVGCoord(killer.position.z + 35)} ${toSVGCoord(killer.position.x + 20)},${toSVGCoord(killer.position.z + 35)}`}
                fill="rgba(56, 189, 248, 0.08)"
                stroke="rgba(56, 189, 248, 0.3)"
                strokeWidth="0.3"
              />
            )}

            {/* Map Objects (Generators, Cages, Exit Gate, Altar, Pillars) */}
            {objects.map((obj) => {
              const cx = toSVGCoord(obj.position.x);
              const cy = toSVGCoord(obj.position.z);
              const w = (obj.size.width / MAP_SIZE) * 100;
              const h = (obj.size.depth / MAP_SIZE) * 100;
              const isSelected = obj.id === selectedObjectId;

              if (obj.type === 'generator') {
                return (
                  <g
                    key={obj.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectObject(obj.id);
                    }}
                    className="cursor-pointer transition-all"
                  >
                    <rect
                      x={cx - w / 2}
                      y={cy - h / 2}
                      width={w}
                      height={h}
                      rx="0.5"
                      fill={obj.isRepaired ? '#38bdf8' : obj.isActiveGenerator ? '#10b981' : '#475569'}
                      stroke={isSelected ? '#f59e0b' : '#000'}
                      strokeWidth={isSelected ? '1.2' : '0.4'}
                    />
                    <text
                      x={cx}
                      y={cy + 0.8}
                      fontSize="2.2"
                      fill="#ffffff"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {obj.isActiveGenerator ? (obj.isRepaired ? '✓' : '⚡') : 'X'}
                    </text>
                  </g>
                );
              }

              if (obj.type === 'cage') {
                return (
                  <g
                    key={obj.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectObject(obj.id);
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x={cx - w / 2}
                      y={cy - h / 2}
                      width={w}
                      height={h}
                      rx="0.5"
                      fill="#ef4444"
                      stroke={isSelected ? '#f59e0b' : '#991b1b'}
                      strokeWidth="0.8"
                    />
                    <text x={cx} y={cy + 0.8} fontSize="2.2" fill="#fff" textAnchor="middle" fontWeight="bold">
                      🔒
                    </text>
                  </g>
                );
              }

              if (obj.type === 'exit_gate') {
                return (
                  <g key={obj.id}>
                    <rect
                      x={cx - w / 2}
                      y={cy - h / 2}
                      width={w}
                      height={h}
                      fill="#eab308"
                      stroke="#ca8a04"
                      strokeWidth="0.8"
                    />
                    <text x={cx} y={cy + 1} fontSize="2.8" fill="#000" textAnchor="middle" fontWeight="bold">
                      GATE
                    </text>
                  </g>
                );
              }

              return (
                <rect
                  key={obj.id}
                  x={cx - w / 2}
                  y={cy - h / 2}
                  width={w}
                  height={h}
                  fill={isSelected ? '#f59e0b' : obj.isCover ? '#334155' : '#1e293b'}
                  stroke="#0f172a"
                  strokeWidth="0.3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject(obj.id);
                  }}
                  className="cursor-pointer"
                />
              );
            })}

            {/* Character Pawns */}
            {characters.map((char) => {
              const cx = toSVGCoord(char.position.x);
              const cy = toSVGCoord(char.position.z);
              const isKiller = char.role === 'killer';
              const isDragging = draggingCharId === char.id;

              return (
                <g
                  key={char.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDraggingCharId(char.id);
                  }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isKiller ? '2.8' : '2.2'}
                    fill={isKiller ? '#ef4444' : char.id === 'survivor_1' ? '#38bdf8' : '#10b981'}
                    stroke={isDragging ? '#f59e0b' : '#ffffff'}
                    strokeWidth={isDragging ? '1.2' : '0.6'}
                    className={isDragging ? 'animate-bounce' : ''}
                  />
                  <text
                    x={cx}
                    y={cy + 0.8}
                    fontSize="1.8"
                    fill="#ffffff"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {isKiller ? 'K' : char.name[0]}
                  </text>
                  <text
                    x={cx}
                    y={cy - 3.2}
                    fontSize="1.8"
                    fill={isKiller ? '#f87171' : '#a7f3d0'}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {char.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

      </div>

    </div>
  );
};
