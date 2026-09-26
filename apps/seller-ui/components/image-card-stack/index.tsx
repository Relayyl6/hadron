// components/image-card-stack.tsx
'use client';

import React from 'react';
import { LayoutGrid, GalleryHorizontal } from 'lucide-react';

export interface StackImage {
  id: string;
  url: string | null;
}

export type ViewMode = 'stack' | 'grid';

interface Props {
  images: StackImage[];
  activeId: string | null;
  onSelect: (id: string) => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  onOpenModal?: () => void; // Kept optional so it doesn't break your page.tsx
}

const ImageCardStack = ({
  images,
  activeId,
  onSelect,
  viewMode,
  onToggleViewMode,
}: Props) => {
  const validImages = images.filter(
    (img): img is StackImage & { url: string } =>
      img.url !== null,
  );
  const currentActiveId = activeId ?? validImages[0]?.id;

  if (validImages.length === 0) return null;

  return (
    <div className="w-full p-3 flex flex-col bg-[#18181b] border border-gray-800 rounded-xl relative">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
          Visual Gallery ({validImages.length})
        </p>
        <button
          type="button"
          onClick={onToggleViewMode}
          className="bg-black/40 hover:bg-black/70 border border-gray-700 rounded-lg p-2 transition-colors text-white"
        >
          {viewMode === 'stack' ? (
            <LayoutGrid size={18} className="text-[#80Deea]" />
          ) : (
            <GalleryHorizontal size={18} className="text-[#80Deea]" />
          )}
        </button>
      </div>

      {viewMode === 'stack' ? (
        /* True Fanned Card Deck View - ONLY selects images now */
        <div className="relative h-60 w-full flex items-center justify-center overflow-hidden py-4">
          <div className="relative w-[130px] h-[180px] flex items-center justify-center transition-transform hover:scale-105">
            {validImages.map((img, i) => {
              const activeIndex = Math.max(
                validImages.findIndex((im) => im.id === currentActiveId),
                0,
              );
              const delta = i - activeIndex;
              const isActive = img.id === currentActiveId;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents any bubbling
                    onSelect(img.id); // Sets this image as the active one in the Main Preview
                  }}
                  className="absolute inset-0 rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.6)] border-[3px] transition-all duration-400 cursor-pointer"
                  style={{
                    borderColor: isActive ? '#80Deea' : '#27272a',
                    transformOrigin: 'bottom center',
                    transform: `translateX(${delta * 45}px) translateY(${Math.abs(delta) * 12}px) rotate(${delta * 10}deg) scale(${isActive ? 1.05 : 0.95})`,
                    zIndex: isActive ? 50 : 10 - Math.abs(delta),
                  }}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid / Filmstrip View */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
          {validImages.map((img) => {
            const isActive = img.id === currentActiveId;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onSelect(img.id)}
                className={`relative h-28 rounded-lg overflow-hidden border-2 transition-all ${
                  isActive
                    ? 'border-[#80Deea] scale-105 shadow-lg'
                    : 'border-gray-700 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageCardStack;
