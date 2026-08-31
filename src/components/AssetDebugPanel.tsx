import React, { useState, useEffect } from 'react';
import { subscribeAssetStatus, AssetSummaryStats, loadImageWithRetry, FALLBACK_PLACEHOLDER_DATA_URL } from '../game/assetLoader';
import { Image, CheckCircle, AlertTriangle, RefreshCw, XCircle, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

export const AssetDebugPanel: React.FC = () => {
  const [stats, setStats] = useState<AssetSummaryStats | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  useEffect(() => {
    const unsubscribe = subscribeAssetStatus(newStats => {
      setStats({ ...newStats });
    });
    return () => unsubscribe();
  }, []);

  if (!stats) return null;

  const categories = ['ALL', 'Character', 'Object', 'Effect'];
  const filteredItems = stats.items.filter(item => {
    if (filterCategory === 'ALL') return true;
    return item.category === filterCategory;
  });

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans select-none text-xs">
      {/* 折疊按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md shadow-2xl transition-all border ${
          stats.error > 0
            ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse'
            : stats.retrying > 0
            ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
            : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
        }`}
      >
        <Image className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold tracking-wide">立繪資產 Debug</span>
        <div className="flex items-center gap-1 font-mono text-[11px] bg-black/40 px-1.5 py-0.5 rounded">
          <span className="text-emerald-400">{stats.loaded}</span>/<span>{stats.total}</span>
          {stats.error > 0 && <span className="text-rose-400 font-bold">({stats.error} 異常)</span>}
        </div>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* 展開面板 */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-[460px] max-h-[540px] bg-slate-950/95 border border-slate-800 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-xl text-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                遊戲立繪永久載入系統 V2 (Asset Inspector)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                來源：raw.githubusercontent.com | 跨電腦持久化保證
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">總資產數</div>
              <div className="text-sm font-bold text-white font-mono">{stats.total}</div>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-900/50 p-2 rounded-xl">
              <div className="text-[10px] text-emerald-400 uppercase">已成功載入</div>
              <div className="text-sm font-bold text-emerald-300 font-mono flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" /> {stats.loaded}
              </div>
            </div>
            <div className="bg-amber-950/40 border border-amber-900/50 p-2 rounded-xl">
              <div className="text-[10px] text-amber-400 uppercase">重試/載入中</div>
              <div className="text-sm font-bold text-amber-300 font-mono flex items-center justify-center gap-1">
                <RefreshCw className={`w-3 h-3 ${stats.retrying > 0 ? 'animate-spin' : ''}`} /> {stats.loading + stats.retrying}
              </div>
            </div>
            <div className="bg-rose-950/40 border border-rose-900/50 p-2 rounded-xl">
              <div className="text-[10px] text-rose-400 uppercase">失敗/異常</div>
              <div className="text-sm font-bold text-rose-300 font-mono flex items-center justify-center gap-1">
                <XCircle className="w-3 h-3" /> {stats.error}
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800/80">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`flex-1 py-1 rounded-lg font-medium transition-colors text-[11px] ${
                  filterCategory === cat
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? '全部資源' : cat === 'Character' ? '角色立繪' : cat === 'Object' ? '物件/電箱' : '技能特效'}
              </button>
            ))}
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[290px] scrollbar-thin scrollbar-thumb-slate-700">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 p-2 rounded-xl transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-lg bg-black/60 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={item.url}
                    alt={item.name}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={e => {
                      (e.target as HTMLImageElement).src = FALLBACK_PLACEHOLDER_DATA_URL;
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-100 truncate text-xs">{item.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider shrink-0 ${
                        item.status === 'LOADED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : item.status === 'LOADING'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800/60'
                          : item.status === 'RETRYING'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                          : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{item.url}</div>
                  {item.retryCount > 0 && (
                    <div className="text-[10px] text-amber-400/80 mt-0.5">
                      重試次數：{item.retryCount} 次
                    </div>
                  )}
                </div>

                {/* Action button if error */}
                {item.status === 'ERROR' && (
                  <button
                    onClick={() => loadImageWithRetry(item.url, 3)}
                    className="px-2 py-1 bg-rose-800/60 hover:bg-rose-700 text-white rounded text-[10px] shrink-0 flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> 重試
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-[10px] text-slate-500 text-center border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>累積 Retry 總次數：{stats.totalRetries}</span>
            <span className="text-emerald-400/80">✓ 跨電腦 HTTPS 直連架構已啟用</span>
          </div>
        </div>
      )}
    </div>
  );
};
