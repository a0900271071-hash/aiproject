import React from 'react';
import { PlayerState, GeneratorState, ExitGateState, CharacterInfo, LoudNoisePing, MapType } from '../types';
import { Zap, Shield, Skull, Heart, Lock, AlertTriangle, LogOut, Crosshair, Map, Hammer } from 'lucide-react';
import { CHARACTER_PORTRAITS } from '../game/characterArt';
import { getCharacterAssetUrl } from '../game/imageAssets';
import { FALLBACK_PLACEHOLDER_DATA_URL, loadImageWithRetry } from '../game/assetLoader';

interface HUDProps {
  humanPlayer: PlayerState;
  allPlayers: PlayerState[];
  characterMap: Record<string, CharacterInfo>;
  generators: GeneratorState[];
  exitGates: ExitGateState[];
  killerBreakCharges: number;
  matchTime: number;
  noisePings: LoudNoisePing[];
  actionPrompt: string | null;
  escapeNotifications?: { id: string; text: string; expiresAt: number }[];
  mapType?: MapType;
  onPrimaryActionPress?: () => void;
  onPrimaryActionStart?: () => void;
  onPrimaryActionEnd?: () => void;
  onSkillPress: () => void;
  onExitMatch: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  humanPlayer,
  allPlayers = [],
  characterMap = {},
  generators = [],
  exitGates = [],
  killerBreakCharges = 0,
  matchTime = 0,
  noisePings = [],
  actionPrompt,
  escapeNotifications = [],
  mapType = 'ximending',
  onPrimaryActionPress,
  onPrimaryActionStart,
  onPrimaryActionEnd,
  onSkillPress,
  onExitMatch,
}) => {
  if (!humanPlayer) return null;

  const isKiller = humanPlayer.faction === 'killer';
  const humanChar = characterMap[humanPlayer.characterId];

  // Calculate stats
  const completedGens = (generators || []).filter(g => g.isCompleted).length;
  const targetGensNeeded = 5;
  const gatesPowered = completedGens >= targetGensNeeded;

  const survivors = (allPlayers || []).filter(p => p.faction === 'survivor');
  const activeScreamAlert = (noisePings || [])[(noisePings || []).length - 1];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 md:p-6 font-sans">
      {/* Top Bar Status */}
      <div className="flex justify-between items-start gap-4">
        {/* Match Objectives HUD (Top Left) */}
        <div className="pointer-events-auto bg-[#0a0d0c]/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-4">
          
          {/* Current Map Indicator */}
          <div className="flex items-center gap-2.5 border-r border-white/10 pr-4">
            <Map className={`w-4 h-4 ${mapType === 'cathedral' ? 'text-purple-400' : 'text-amber-400'}`} />
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">當前地圖</div>
              <div className="text-xs font-black text-white">
                {mapType === 'cathedral' ? (
                  <span className="text-purple-300 font-bold flex items-center gap-1">🏰 破敗大教堂</span>
                ) : (
                  <span className="text-amber-300 font-bold flex items-center gap-1">🏙️ 廢土西門町</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 border-r border-white/10 pr-4">
            <Zap className={`w-5 h-5 ${completedGens >= 5 ? 'text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'text-slate-400'}`} />
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">修復電箱進度</div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>{completedGens} / {targetGensNeeded}</span>
                {completedGens >= 5 && <span className="text-xs text-amber-400 font-extrabold animate-bounce">大門通電!</span>}
              </div>
            </div>
          </div>

          {isKiller && (
            <div className="flex items-center gap-2.5 border-r border-white/10 pr-4">
              <Hammer className={`w-5 h-5 ${killerBreakCharges > 0 ? 'text-rose-400 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-slate-500'}`} />
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-rose-300">破壞電箱機會</div>
                <div className="text-sm font-black text-white flex items-center gap-1.5 font-mono">
                  <span className={killerBreakCharges > 0 ? "text-rose-300 font-extrabold" : "text-slate-500"}>
                    {killerBreakCharges} 次
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal font-sans">
                    {killerBreakCharges > 0 ? '(-10%進度)' : '(需押送逃生者入獄)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 border-r border-white/10 pr-4">
            <Lock className={`w-4 h-4 ${gatesPowered ? 'text-emerald-400 animate-bounce' : 'text-slate-400'}`} />
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">逃生大門</div>
              <div className="text-xs font-black text-slate-200">
                {gatesPowered ? (
                  exitGates.some(g => g.isOpen) ? (
                    <span className="text-emerald-400 font-bold">已開啟 (可逃離!)</span>
                  ) : (
                    <span className="text-amber-300 font-bold">需拉開電閘 (30s)</span>
                  )
                ) : (
                  <span className="text-slate-500 font-medium">未通電</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">對戰時間</div>
            <div className="text-xs font-mono font-bold text-slate-200">{formatTime(matchTime)}</div>
          </div>
        </div>

        {/* Top Right Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onExitMatch}
            className="bg-[#0a0d0c]/85 hover:bg-rose-950/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/15 hover:border-rose-500/60 text-slate-300 hover:text-white text-xs font-black transition-all flex items-center gap-2 shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>退出對戰</span>
          </button>
        </div>
      </div>

      {/* Escape Success Notification Banner (5 seconds display) */}
      {escapeNotifications && escapeNotifications.length > 0 && (
        <div className="self-center flex flex-col gap-2 items-center z-50 pointer-events-none mb-3">
          {escapeNotifications.map(notif => (
            <div
              key={notif.id}
              className="bg-emerald-950/95 border-2 border-emerald-400 text-emerald-100 px-8 py-3.5 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.85)] backdrop-blur-xl flex items-center gap-3.5 animate-bounce"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-xl">
                🚪
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black tracking-widest text-emerald-300 uppercase">
                  逃生成功通知
                </span>
                <span className="text-base font-extrabold text-white drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">
                  {notif.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Middle Scream / Noise Alert Banner */}
      {activeScreamAlert && Date.now() - activeScreamAlert.createdAt < 6000 && (
        <div className="self-center bg-rose-950/95 border-2 border-rose-500 text-rose-100 px-6 py-3 rounded-2xl shadow-[0_0_35px_rgba(225,29,72,0.8)] backdrop-blur-xl flex items-center gap-3 animate-bounce">
          <AlertTriangle className="w-6 h-6 text-rose-400 animate-ping" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-black tracking-wide text-rose-300">
              😱 恐懼尖叫暴音提醒！
            </span>
            <span className="text-sm font-extrabold text-white">
              {activeScreamAlert.label}
            </span>
          </div>
        </div>
      )}

      {/* Central Interactive Action Prompt */}
      {actionPrompt && (
        <div className="self-center mb-4 bg-[#0a0d0c]/90 backdrop-blur-xl px-6 py-3 rounded-2xl border border-amber-500/80 text-amber-300 font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center gap-3 animate-pulse">
          <Crosshair className="w-4 h-4 text-amber-400" />
          <span>{actionPrompt}</span>
        </div>
      )}

      {/* Kento Sato: Active Fear Scream Activation Window Prompt */}
      {humanPlayer.characterId === 'kento' && (humanPlayer.kentoFearScreamTime || 0) > 0 && (
        <div className="self-center mb-4 bg-sky-950/90 backdrop-blur-xl px-6 py-2.5 rounded-2xl border-2 border-sky-400 text-sky-200 font-black text-xs shadow-[0_0_25px_rgba(56,189,248,0.5)] flex items-center gap-2.5 animate-bounce">
          <Zap className="w-4 h-4 text-sky-400 animate-spin" />
          <span>😱 恐懼應激狀態！按下 <kbd className="px-1.5 py-0.5 bg-sky-900 border border-sky-300 rounded font-mono text-white">Shift</kbd> 激活修機速度 +10%！(剩餘 {Math.ceil(humanPlayer.kentoFearScreamTime || 0)}s)</span>
        </div>
      )}

      {/* Kento Sato: Active Repair Buff */}
      {humanPlayer.characterId === 'kento' && (humanPlayer.satoBuffTime || 0) > 0 && (
        <div className="self-center mb-4 bg-emerald-950/90 backdrop-blur-xl px-6 py-2 rounded-2xl border border-emerald-400/80 text-emerald-200 font-black text-xs shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>⚡ 社畜專注中：修理電箱速度提升 10% (剩餘 {Math.ceil(humanPlayer.satoBuffTime || 0)}s)</span>
        </div>
      )}

      {/* Jack Miller: Skill Ready Window Prompt (Injured or Rescued) */}
      {humanPlayer.characterId === 'jack' &&
        humanPlayer.skillCooldown <= 0 &&
        (humanPlayer.health === 'injured' || (humanPlayer.jackRescuedWindow || 0) > 0 || humanPlayer.wasRescuedFromCage) &&
        (humanPlayer.jackBuffTime || 0) <= 0 && (
          <div className="self-center mb-4 bg-emerald-950/90 backdrop-blur-xl px-6 py-2.5 rounded-2xl border-2 border-emerald-400 text-emerald-200 font-black text-xs shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2.5 animate-bounce">
            <Zap className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>🎖️ 戰術強韌準備就緒！按下 <kbd className="px-1.5 py-0.5 bg-emerald-900 border border-emerald-300 rounded font-mono text-white">Shift</kbd> 激活治療與修機速度 +10%！</span>
          </div>
        )}

      {/* Jack Miller: Active Battlefield Grit Buff */}
      {humanPlayer.characterId === 'jack' && (humanPlayer.jackBuffTime || 0) > 0 && (
        <div className="self-center mb-4 bg-emerald-950/90 backdrop-blur-xl px-6 py-2 rounded-2xl border border-emerald-400/80 text-emerald-200 font-black text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>🎖️ 戰術強韌生效中：治療隊友與修機速度 +10% (剩餘 {Math.ceil(humanPlayer.jackBuffTime || 0)}s)</span>
        </div>
      )}

      {/* Tariq Al-Hashim: Active Stealth & Speed Boost Buff */}
      {humanPlayer.characterId === 'tariq' && ((humanPlayer.tariqStealthTime || 0) > 0 || (humanPlayer.tariqSpeedBoostTime || 0) > 0) && (
        <div className="self-center mb-4 bg-purple-950/90 backdrop-blur-xl px-6 py-2 rounded-2xl border border-purple-400/80 text-purple-200 font-black text-xs shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span>💀 背叛之影生效中：自身氣場與足跡消失 (剩餘 {Math.ceil(humanPlayer.tariqStealthTime || 0)}s)，額外移速 (剩餘 {Math.ceil(humanPlayer.tariqSpeedBoostTime || 0)}s)</span>
        </div>
      )}

      {/* Erik Thorsson: Skill Ready Prompt (Injured & Skill available) */}
      {humanPlayer.characterId === 'erik' &&
        humanPlayer.health === 'injured' &&
        humanPlayer.erikSkillAvailable !== false &&
        humanPlayer.skillCooldown <= 0 &&
        (humanPlayer.vikingBuffTime || 0) <= 0 && (
          <div className="self-center mb-4 bg-orange-950/90 backdrop-blur-xl px-6 py-2.5 rounded-2xl border-2 border-orange-500 text-orange-200 font-black text-xs shadow-[0_0_25px_rgba(249,115,22,0.6)] flex items-center gap-2.5 animate-bounce">
            <Zap className="w-4 h-4 text-orange-400 animate-spin" />
            <span>🪓 受傷狂暴充能完畢！按下 <kbd className="px-1.5 py-0.5 bg-orange-900 border border-orange-400 rounded font-mono text-white">Shift</kbd> 激活移動速度 1.5 倍（持續 20 秒）！</span>
          </div>
        )}

      {/* Erik Thorsson: Active Berserker Surge Buff */}
      {humanPlayer.characterId === 'erik' && (humanPlayer.vikingBuffTime || 0) > 0 && (
        <div className="self-center mb-4 bg-orange-950/90 backdrop-blur-xl px-6 py-2 rounded-2xl border border-orange-500/80 text-orange-200 font-black text-xs shadow-[0_0_20px_rgba(249,115,22,0.5)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
          <span>🪓 狂怒疾馳爆發中：移動速度 1.5 倍 (剩餘 {Math.ceil(humanPlayer.vikingBuffTime || 0)}s，需被重新治療充能)</span>
        </div>
      )}

      {/* Gourmet (Chen Chia-Hao): Active Berserk Rage Mode Banner */}
      {humanPlayer.characterId === 'gourmet' && (humanPlayer.berserkTime || 0) > 0 && (
        <div className="self-center mb-4 bg-rose-950/95 backdrop-blur-xl px-6 py-2.5 rounded-2xl border-2 border-rose-500 text-rose-200 font-black text-xs shadow-[0_0_30px_rgba(225,29,72,0.8)] flex items-center gap-2.5 animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>🔪【老饕】狂暴化模式進行中！斬擊將施加「深度受傷」（治療時間增加 1.5 倍）！(剩餘 {Math.ceil(humanPlayer.berserkTime || 0)}s)</span>
        </div>
      )}

      {/* Bottom Row */}
      <div className="flex justify-between items-end gap-4">
        
        {/* Bottom Left: Team Status Badges with Realistic Portrait Avatars */}
        <div className="pointer-events-auto bg-[#0a0d0c]/90 backdrop-blur-xl p-4 rounded-2xl border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col gap-2.5 max-w-xs">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center justify-between">
            <span>逃生者狀態 (4人)</span>
            {isKiller && (
              <span className="text-rose-400 font-bold">
                破壞電箱次數: {killerBreakCharges}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {survivors.map(surv => {
              const char = characterMap[surv.characterId];
              const isUser = surv.id === humanPlayer.id;
              const portraitUrl = CHARACTER_PORTRAITS[surv.characterId];

              return (
                <div
                  key={surv.id}
                  className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                    isUser
                      ? 'bg-blue-950/70 border-blue-500/80 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : 'bg-[#050706]/70 border-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {portraitUrl ? (
                      <img
                        src={portraitUrl}
                        alt={char?.name || surv.characterId}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const fallbackSrc = getCharacterAssetUrl(surv.characterId, 'portrait');
                          loadImageWithRetry(fallbackSrc, 3)
                            .then(img => {
                              target.src = img.src;
                            })
                            .catch(() => {
                              target.src = FALLBACK_PLACEHOLDER_DATA_URL;
                            });
                        }}
                        className="w-7 h-7 rounded-lg object-cover object-top border border-white/20 shadow-sm bg-slate-900"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-lg border border-white/20 flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: char?.avatarColor || '#3b82f6' }}
                      >
                        {surv.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-black text-slate-200">
                      {char?.name.split(' ')[0] || surv.name}
                      {isUser && <span className="text-[10px] text-cyan-300 ml-1 font-mono">(您)</span>}
                    </span>
                  </div>

                  {/* Health State Badge & Progress */}
                  <div className="flex flex-col gap-1 mt-0.5">
                    <div className="flex items-center gap-1.5 font-black text-[11px]">
                      {surv.health === 'healthy' && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-emerald-400" /> 健康
                        </span>
                      )}
                      {surv.health === 'injured' && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> 受傷
                        </span>
                      )}
                      {surv.health === 'downed' && (
                        <span className="text-rose-400 flex items-center gap-1 font-black animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> 瀕死倒地
                        </span>
                      )}
                      {surv.health === 'caged' && (
                        <span className="text-purple-400 flex items-center gap-1 font-black animate-pulse">
                          <Lock className="w-3 h-3" /> 監牢中 ({Math.ceil(surv.cageTimer)}s)
                        </span>
                      )}
                      {surv.health === 'escaped' && (
                        <span className="text-cyan-300 flex items-center gap-1 font-black">
                          ✓ 成功逃離
                        </span>
                      )}
                      {surv.health === 'dead' && (
                        <span className="text-slate-500 flex items-center gap-1 font-bold line-through">
                          <Skull className="w-3 h-3" /> 已獻祭
                        </span>
                      )}
                      {surv.deepInjury && surv.health !== 'dead' && surv.health !== 'escaped' && (
                        <span className="bg-rose-950/90 text-rose-300 text-[9px] px-1.5 py-0.5 rounded border border-rose-500/60 font-bold animate-pulse">
                          🩸 深度受傷 (+1.5x)
                        </span>
                      )}
                    </div>

                    {/* Active Healing Progress Bar (15s base) */}
                    {(surv.health === 'downed' || surv.health === 'injured') && (surv.healProgress || 0) > 0 && (
                      <div className="w-full">
                        <div className="flex justify-between items-center text-[9px] text-emerald-300 font-bold mb-0.5">
                          <span>💚 {surv.health === 'downed' ? '急救' : '治療'} {surv.healersCount && surv.healersCount > 1 ? `(${surv.healersCount}人 ${Math.pow(1.25, surv.healersCount - 1).toFixed(2)}x)` : ''}</span>
                          <span>{Math.floor(surv.healProgress || 0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-emerald-500/40">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-100"
                            style={{ width: `${Math.min(100, surv.healProgress || 0)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Active Caging Channel Progress Bar (5s channel) */}
                    {surv.health === 'downed' && (surv.cagingProgress || 0) > 0 && (
                      <div className="w-full">
                        <div className="flex justify-between items-center text-[9px] text-purple-300 font-bold mb-0.5 animate-pulse">
                          <span>⛓️ 押送引導中 (5s)</span>
                          <span>{Math.floor(surv.cagingProgress || 0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-purple-500/40">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-rose-500 transition-all duration-100"
                            style={{ width: `${Math.min(100, surv.cagingProgress || 0)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Active Cage Rescue Channel Progress Bar (1.5s channel) */}
                    {surv.health === 'caged' && (surv.rescueProgress || 0) > 0 && (
                      <div className="w-full">
                        <div className="flex justify-between items-center text-[9px] text-amber-300 font-bold mb-0.5 animate-pulse">
                          <span>🔓 解救引導中 (1.5s)</span>
                          <span>{Math.floor(surv.rescueProgress || 0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-amber-500/40">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-100"
                            style={{ width: `${Math.min(100, surv.rescueProgress || 0)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Right: Controls & Skill Button with Realistic Active Character Card */}
        <div className="pointer-events-auto bg-[#0a0d0c]/90 backdrop-blur-xl p-3.5 rounded-2xl border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-4">
          
          {/* Active Player Character Card & Portrait */}
          <div className="flex items-center gap-3 border-r border-white/10 pr-4">
            {CHARACTER_PORTRAITS[humanPlayer.characterId] ? (
              <img
                src={CHARACTER_PORTRAITS[humanPlayer.characterId]}
                alt={humanChar?.name || humanPlayer.characterId}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const fallbackSrc = getCharacterAssetUrl(humanPlayer.characterId, 'portrait');
                  loadImageWithRetry(fallbackSrc, 3)
                    .then(img => {
                      target.src = img.src;
                    })
                    .catch(() => {
                      target.src = FALLBACK_PLACEHOLDER_DATA_URL;
                    });
                }}
                className={`w-12 h-12 rounded-xl bg-slate-950/80 border border-amber-500/60 shadow-lg ${
                  CHARACTER_PORTRAITS[humanPlayer.characterId]?.includes('.png') ? 'object-contain p-0.5' : 'object-cover object-top'
                }`}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl border border-amber-500/60 flex items-center justify-center font-black text-base text-white"
                style={{ backgroundColor: humanChar?.avatarColor || '#3b82f6' }}
              >
                {humanChar?.name?.charAt(0) || 'P'}
              </div>
            )}
            <div>
              <div className="text-[10px] font-black uppercase text-amber-400">當前角色</div>
              <div className="text-xs font-black text-white">{humanChar?.name || '角色'}</div>
              <div className="text-[10px] text-slate-400">{isKiller ? '陣營：殺手' : '陣營：逃生者'}</div>
            </div>
          </div>

          {/* Key Bindings Helper */}
          <div className="hidden sm:flex flex-col text-[11px] text-slate-300 border-r border-white/10 pr-4 space-y-1">
            <div><kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded font-mono text-slate-100">WASD</kbd> 前進 / 後退 / 向左 / 向右</div>
            <div><kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded font-mono text-slate-100">Space</kbd> {isKiller ? '攻擊及傳送逃生者到監牢' : '修理及治療隊友'}</div>
            <div><kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded font-mono text-slate-100">Shift</kbd> 施放技能 (冷卻 15 秒)</div>
            <div className="text-cyan-300 font-semibold">🖱️ 移動滑鼠旋轉視角 • 滾輪縮放鏡頭</div>
          </div>

          {/* Primary Action Button (Space - Attack / Cage / Break / Repair) */}
          <button
            onPointerDown={onPrimaryActionStart}
            onPointerUp={onPrimaryActionEnd}
            onPointerLeave={onPrimaryActionEnd}
            onClick={onPrimaryActionPress}
            disabled={isKiller ? (humanPlayer.attackCooldown || 0) > 0 : false}
            className={`relative p-3.5 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1 transition-all min-w-[105px] border shadow-2xl ${
              isKiller
                ? (humanPlayer.attackCooldown || 0) <= 0
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer'
                  : 'bg-slate-900/80 border-white/10 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer'
            }`}
          >
            <Crosshair className="w-5 h-5" />
            <span>{isKiller ? '近戰/互動' : '互動/修機'}</span>
            <span className="text-[10px] font-mono">
              {isKiller && (humanPlayer.attackCooldown || 0) > 0 ? `${(humanPlayer.attackCooldown || 0).toFixed(1)}s` : '[Space]'}
            </span>
          </button>

          {/* Character Skill Button */}
          <button
            onClick={onSkillPress}
            disabled={humanPlayer.skillCooldown > 0}
            className={`relative p-3.5 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1 transition-all min-w-[100px] border shadow-2xl ${
              humanPlayer.skillCooldown <= 0
                ? isKiller
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 border-rose-400 text-white animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.5)]'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-cyan-400 text-white animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                : 'bg-slate-900/80 border-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-5 h-5 fill-current" />
            <span>{humanChar?.skillName.split(' ')[0] || '技能'}</span>
            <span className="text-[10px] font-mono">
              {humanPlayer.skillCooldown > 0 ? `${Math.ceil(humanPlayer.skillCooldown)}s` : '[Shift]'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
