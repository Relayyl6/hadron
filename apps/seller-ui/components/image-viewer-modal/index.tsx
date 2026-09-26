// image-viewer-modal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  LayoutGrid,
  GalleryHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface ViewerImage {
  id: string;
  url: string;
}

interface Props {
  pictureLoading: boolean;
  images: ViewerImage[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

type ViewMode = 'filmstrip' | 'stack';

const ImageViewerModal = ({ 
  pictureLoading,
  images, 
  activeId, 
  onSelect, 
  onClose 
}: Props) => {
  const [mode, setMode] = useState<ViewMode>('filmstrip');

  const activeIndex = Math.max(
    images.findIndex((img) => img.id === activeId),
    0,
  );
  const active = images[activeIndex];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && activeIndex < images.length - 1) {
        onSelect(images[activeIndex + 1].id);
      }
      if (e.key === 'ArrowLeft' && activeIndex > 0) {
        onSelect(images[activeIndex - 1].id);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, images, onClose, onSelect]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/85 flex flex-col items-center justify-center p-6"
      onClick={onClose} // Clicking anywhere in this background container closes the modal
    >
      <div
        className="absolute top-4 right-4 flex gap-2 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() =>
            setMode((m) => (m === 'filmstrip' ? 'stack' : 'filmstrip'))
          }
          aria-label={
            mode === 'filmstrip'
              ? 'Switch to stacked view'
              : 'Switch to filmstrip view'
          }
          className="bg-black/60 hover:bg-black/80 rounded-full p-2"
        >
          {mode === 'filmstrip' ? (
            <LayoutGrid size={18} className="text-white" />
          ) : (
            <GalleryHorizontal size={18} className="text-white" />
          )}
        </button>
        <button
          type="button"
          disabled={pictureLoading}
          onClick={onClose}
          aria-label="Close preview"
          className="bg-black/60 hover:bg-black/80 rounded-full p-2"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (activeIndex > 0) onSelect(images[activeIndex - 1].id);
            }}
            disabled={activeIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 disabled:opacity-30 rounded-full p-2 z-50"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (activeIndex < images.length - 1)
                onSelect(images[activeIndex + 1].id);
            }}
            disabled={activeIndex === images.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 disabled:opacity-30 rounded-full p-2 z-50"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </>
      )}

      {/* THE FIX: Removed w-full h-full from the image so it shrinks to fit the visible pixels */}
      <div className="flex-1 flex items-center justify-center w-full relative">
        <img
          src={active.url}
          alt="Full size preview"
          onClick={(e) => e.stopPropagation()} // Clicking the actual picture stops the close event
          className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
        />
      </div>

      <div
        className="mt-6 w-full flex justify-center z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {mode === 'filmstrip' ? (
          <div className="flex gap-2 overflow-x-auto max-w-full px-4 pb-2">
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => onSelect(img.id)}
                className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  img.id === active.id
                    ? 'border-blue-400 scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="relative h-48 w-full flex items-center justify-center">
            <div className="relative w-[100px] h-[140px] flex items-center justify-center">
              {images.map((img, i) => {
                const delta = i - activeIndex;
                const isActive = img.id === active.id;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => onSelect(img.id)}
                    className="absolute inset-0 rounded-lg overflow-hidden shadow-2xl border-2 border-white/30 transition-all duration-300"
                    style={{
                      transformOrigin: 'bottom center',
                      transform: `translateX(${delta * 36}px) rotate(${delta * 8}deg) translateY(${Math.abs(delta) * 4}px) scale(${isActive ? 1.1 : 0.95})`,
                      zIndex: isActive ? 50 : 10 - Math.abs(delta),
                      boxShadow: isActive
                        ? '0 20px 25px -5px rgba(0, 0, 0, 0.7)'
                        : '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
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
        )}
      </div>
    </div>
  );
};

export default ImageViewerModal;
