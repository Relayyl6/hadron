// image-placeholder.tsx
'use client';

import React, { useRef } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface Props {
  size: string;
  small: boolean;
  id: string;
  previewUrl: string | null;
  onImageChange: (file: File | null, id: string) => void;
  onRemove: (id: string) => void;
  onOpenViewer: () => void;
}

// No local preview state anymore — previewUrl is owned entirely by the
// parent's images array, so this component just renders what it's given.
const ImagePlaceholder = ({
  size,
  small,
  id,
  previewUrl,
  onImageChange,
  onRemove,
  onOpenViewer,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file) onImageChange(file, id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = '';
    onRemove(id);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (previewUrl) {
      e.preventDefault();
      onOpenViewer();
    }
  };

  return (
    <label
      htmlFor={`image-upload-${id}`}
      onClick={handleImageClick}
      className={`relative ${
        small ? 'h-[180px]' : 'h-[450px]'
      } w-full cursor-pointer bg-[#1e1e1e] border border-gray-600 rounded-lg flex flex-col justify-center items-center overflow-hidden`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        id={`image-upload-${id}`}
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt="Product"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <span
              aria-label="Preview full size"
              className="bg-black/60 rounded-full p-1"
            >
              <ZoomIn size={16} className="text-white" />
            </span>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove image"
              className="bg-black/60 hover:bg-black/80 rounded-full p-1"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </>
      ) : (
        <span className="text-gray-400 text-sm text-center px-2">
          {size}px recommended
        </span>
      )}
    </label>
  );
};

export default ImagePlaceholder;
