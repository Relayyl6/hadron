// image-placeholder.tsx
'use client';

import React, { useRef } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface Props {
  size: string;
  small: boolean;
  pictureLoading: boolean;
  id: string;
  url: string | null;
  onImageChange: (file: File | null, id: string) => void;
  onRemove: (id: string) => void;
  onOpenViewer: () => void;
}

// No local preview state anymore — url is owned entirely by the
// parent's images array, so this component just renders what it's given.
const ImagePlaceholder = ({
  size,
  small,
  pictureLoading,
  id,
  url,
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
    if (url) {
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

      {url ? (
        <>
          <img
            src={url}
            alt="Product"
            className="w-full h-full object-contain"
          />
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
