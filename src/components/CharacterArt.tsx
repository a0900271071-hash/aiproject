import React from 'react';
import { getCharacterAssetUrl } from '../game/imageAssets';
import { FALLBACK_PLACEHOLDER_DATA_URL, loadImageWithRetry } from '../game/assetLoader';

interface CharacterArtProps {
  characterId: string;
  className?: string;
}

export const CharacterArt: React.FC<CharacterArtProps> = ({ characterId, className = '' }) => {
  const imageUrl = getCharacterAssetUrl(characterId, 'front');

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#080c10] border border-white/15 shadow-2xl flex items-center justify-center group ${className}`}>
      {/* Ambient Blurred Background Fill */}
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      {/* Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent pointer-events-none z-10" />

      {/* Complete Uncropped Character Artwork */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={characterId}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            loadImageWithRetry(imageUrl, 3)
              .then(img => {
                target.src = img.src;
              })
              .catch(() => {
                target.src = FALLBACK_PLACEHOLDER_DATA_URL;
              });
          }}
          className="relative z-10 w-full h-full object-contain p-1 transform transition-transform duration-700 group-hover:scale-105 filter contrast-105 brightness-95 drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]"
        />
      ) : (
        <div className="text-xs text-slate-400 font-mono">Image Asset Not Found</div>
      )}

      {/* Vignette Overlay for Atmospheric Depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070a]/90 via-transparent to-[#05070a]/30 pointer-events-none z-10" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none z-10" />
    </div>
  );
};
