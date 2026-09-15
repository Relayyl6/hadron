// page.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ChevronRight, Plus, Maximize2, Wand2, Banknote, SlidersHorizontal } from 'lucide-react';
import ImagePlaceholder from '@/components/image-placeholder';
import ImageViewerModal from '@/components/image-viewer-modal';
import ImageCardStack, { ViewMode } from '@/components/image-card-stack';
import Input from '@/components/input';
import ColorSelector from '@/components/ColorSelector';
import CustomSpecification from '@/components/CustomSpecifications';
import CustomProperties from '@/components/CustomProperties';
import SegmentedControl from '@/components/SegmentedControl';
import { useCategories } from '@/hooks/useCategories';
import RichTextEditor from '@/components/RichTextEditor';
import SizeSelector from '@/components/SizeSelector.tsx';
import CategorySelector from '@/components/CategorySelector';
import { useDiscount } from '@/hooks/useDiscount';

const MAX_IMAGES = 8;
type ImageSlot = {
  id: string;
  file: File | null;
  previewUrl: string | null;
};
const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const CreateProductPage = () => {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  const idCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const makeSlot = (): ImageSlot => ({
    id: `slot-${idCounter.current++}`,
    file: null,
    previewUrl: null,
  });

  const [images, setImages] = useState<ImageSlot[]>(() => [makeSlot()]);
  const [isCleared, setIsCleared] = useState<boolean>(true)


  // Decoupled States: Active Image vs Modal Visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewerActiveId, setViewerActiveId] = useState<string | null>(() => {
    if (typeof window !== 'undefined')
      return localStorage.getItem('product_images_active_id');
    return null;
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(
        'product_images_view_mode',
      ) as ViewMode;
      if (savedMode === 'stack' || savedMode === 'grid') return savedMode;
    }
    return 'stack';
  });

  const handleToggleViewMode = () => {
    const nextMode = viewMode === 'stack' ? 'grid' : 'stack';
    setViewMode(nextMode);
    localStorage.setItem('product_images_view_mode', nextMode);
  };

  const handleSelectActiveId = (id: string | null) => {
    setViewerActiveId(id);
    if (id) localStorage.setItem('product_images_active_id', id);
    else localStorage.removeItem('product_images_active_id');
  };

  useEffect(() => {
    return () => {
      images.forEach((slot) => {
        if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncFormValue = (slots: ImageSlot[]) =>
    setValue('images', slots.map((s) => s.file).filter(Boolean));

  const handleImageChange = (file: File | null, id: string) => {
    setImages((prev) => {
      const updated = prev.map((slot) => {
        if (slot.id !== id) return slot;
        if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
        return {
          ...slot,
          file,
          previewUrl: file ? URL.createObjectURL(file) : null,
        };
      });
      const isLastSlot = updated[updated.length - 1]?.id === id;
      if (isLastSlot && file && updated.length < MAX_IMAGES)
        updated.push(makeSlot());
      syncFormValue(updated);
      return updated;
    });
    if (file) handleSelectActiveId(id);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      let updated = prev.filter((slot) => slot.id !== id);
      if (updated.length === 0) updated = [makeSlot()];
      else if (
        !updated.some((s) => s.file === null) &&
        updated.length < MAX_IMAGES
      )
        updated.push(makeSlot());
      syncFormValue(updated);
      return updated;
    });
    if (viewerActiveId === id) handleSelectActiveId(null);
  };

  const onSubmit = async (data: any) => {
    if (!images.some((slot) => slot.file !== null)) {
      setError('images', {
        type: 'required',
        message: 'At least one product image is required',
      });
      return;
    }
    try {
      console.log(data);
    } finally {
      // Do nothing
    }
  };

  const handleSaveDraft = () => {

  }

  const handleGenerateSlug = () => {
    const currentTitle = getValues('title');

    if (currentTitle) {
      const generatedSlug = currentTitle
        // 1. Normalize accents/diacritics (e.g., "Café" -> "Cafe", "Piñata" -> "Pinata")
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

        // 2. Convert to lowercase and trim edges
        .toLowerCase()
        .trim()

        // 3. Semantic symbol replacements for better SEO
        .replace(/&/g, '-and-')
        .replace(/@/g, '-at-')
        .replace(/%/g, '-percent-')

        // 4. Strip out any remaining invalid characters (keep letters, numbers, spaces, and dashes)
        .replace(/[^a-z0-9\s-]/g, '')

        // 5. Replace spaces and multiple dashes with a single dash
        .replace(/[\s-]+/g, '-')

        // 6. Clean up trailing or leading dashes just in case
        .replace(/^-+|-+$/g, '');

      // Set the value and trigger validation immediately
      setValue('slug', generatedSlug, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const { categories, subCategories, isLoading, isError } = useCategories();
  const { discountCodes, isLoading: discountLoading, isError: discountError } = useDiscount()

  const regularPrice = watch('regular_price');

  console.log(categories, subCategories);

  // 1. Watch the array of selections (e.g., ["Automotive", "Car Accessories"])
  const categoryPath = watch("categoryPath") || [];

  // 2. Compute the visible dropdowns dynamically
  const dynamicDropdowns = useMemo(() => {
    if (!categories) return [];

    const dropdowns = [];
    
    // Level 0: The main categories
    dropdowns.push({
      level: 0,
      label: "Category",
      options: categories,
      selectedValue: categoryPath[0] || ""
    });

    // Traverse the subcategory tree for subsequent levels
    let currentNodes = categoryPath[0] && subCategories ? subCategories[categoryPath[0]] : null;
    let currentLevel = 1;

    while (currentNodes && Array.isArray(currentNodes) && categoryPath[currentLevel - 1]) {
      dropdowns.push({
        level: currentLevel,
        label: currentLevel === 1 ? "Subcategory" : `Sub-Level ${currentLevel}`,
        options: currentNodes,
        selectedValue: categoryPath[currentLevel] || ""
      });

      // Prepare the next deeper level if the user has made a selection
      const selectedName = categoryPath[currentLevel];
      if (!selectedName) break;

      const found = currentNodes.find((item: any) => (item.name || item) === selectedName);
      
      // If the selected item has further nested arrays, loop again
      if (found && found.subcategories && Array.isArray(found.subcategories) && found.subcategories.length > 0) {
        currentNodes = found.subcategories;
        currentLevel++;
      } else {
        currentNodes = null; // Reached the deepest level, stop loop
      }
    }

    return dropdowns;
  }, [categories, subCategories, categoryPath]);

  // Derived Arrays for UI Layout
  const uploadedImages = images.filter((s) => s.previewUrl !== null);
  const emptySlot = images.find((s) => s.previewUrl === null);
  const activeSlot =
    images.find((s) => s.id === viewerActiveId && s.previewUrl) ||
    uploadedImages[0];
  const viewerImages = uploadedImages.map((s) => ({
    id: s.id,
    previewUrl: s.previewUrl!,
  }));

  return (
    <form
      className="w-full mx-auto p-8 shadow-md rounded-lg text-white"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h2 className="text-2xl py-2 font-semibold font-poppins text-white">
        Create Product
      </h2>
      <div className="flex items-center mb-6">
        <span className="text-[#80Deea]">Dashboard</span>
        <ChevronRight size={20} className="opacity-[0.8]" />
        <span>Create Product</span>
      </div>

      <div className="py-4 w-full flex gap-4">
        {/* Strict Single Left-Hand Column Layout */}
        <div className="w-full lg:w-[40%] flex flex-col gap-6">
          {/* 1. Main Large Image Preview Header & Toolbar */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-300">Main Preview</p>

              <div className="flex gap-2">
                {/* Add Image Button (Triggers Hidden Input) */}
                {emptySlot && uploadedImages.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#18181b] hover:bg-gray-800 border border-gray-700 rounded-lg p-2 transition-colors"
                    title="Upload New Image"
                  >
                    <Plus size={18} className="text-[#80Deea]" />
                  </button>
                )}

                {/* Fullscreen Modal Button */}
                {activeSlot && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#18181b] hover:bg-gray-800 border border-gray-700 rounded-lg p-2 transition-colors"
                    title="Open Fullscreen Gallery"
                  >
                    <Maximize2 size={18} className="text-[#80Deea]" />
                  </button>
                )}
              </div>
            </div>

            {/* Hidden File Input for the Plus Button */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && emptySlot) handleImageChange(file, emptySlot.id);
                // Reset input so the same file can be selected again if needed
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />

            {activeSlot ? (
              <ImagePlaceholder
                id={activeSlot.id}
                size="765 x 850"
                small={false}
                previewUrl={activeSlot.previewUrl}
                onImageChange={handleImageChange}
                onRemove={handleRemoveImage}
                onOpenViewer={() => setIsModalOpen(true)} // Disabled clicking the image to open modal
              />
            ) : (
              <div className="h-[450px] w-full border border-gray-700 rounded-lg flex items-center justify-center bg-[#1e1e1e] text-gray-400 text-sm">
                "765 x 850" recommended
              </div>
            )}
            {errors.images && (
              <p className="text-red-400 text-sm mt-1">
                {errors.images.message as string}
              </p>
            )}
          </div>

          {/* 2. Visual Gallery */}
          <ImageCardStack
            images={images}
            activeId={viewerActiveId}
            onSelect={handleSelectActiveId}
            viewMode={viewMode}
            onToggleViewMode={handleToggleViewMode}
            onOpenModal={() => setIsModalOpen(true)}
          />
        </div>

        {/* Middle Column (Form Inputs) */}
        <div className="w-full lg:w-[30%] flex flex-col">
          <Input
            label="Product Title"
            placeholder="Enter product title"
            error={errors.title?.message as string}
            {...register('title', {
              required: 'Product title is required',
              minLength: {
                value: 3,
                message: 'Title must be at least 3 characters',
              },
            })}
          />

          <div className="mt-2">
            <Input
              type="textarea"
              rows={4}
              cols={20}
              label="Short Description * (Max 150 words)"
              placeholder="Enter product description for quick view"
              error={errors.description?.message as string}
              {...register('description', {
                required: 'Product description is required',
                validate: (value) => {
                  if (!value) return "Product description is required";
                  const wordCount = value.trim().split(/\s+/).length;
                  return (
                    wordCount <= 150 ||
                    `Description cannot exceed 150 words (Current: ${wordCount})`
                  );
                },
              })}
            />
          </div>

          <div className='mt-2'>
            <label className='block font-semibold text-gray-300 mb-1'>
              Detailed Description * (Min 100 words)
            </label>
            <Controller
              name="detailed_description"
              control={control}
              rules={{
                required: "Detailed description is required!",
                validate: (value) => {
                  if (!value) return "Detailed description is required!";
                  const wordCount = value.split(/\s+/).filter((word: string) => word).length;
                  return (
                    wordCount >= 100 || "Description must be at least 100 words"
                  );
                }
              }}
              render={({field}) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  toolbarPreset="orderly"
                  placeholder="Describe the product — material, fit, care instructions..."
                  minHeight="190px"
                  autoExpand
                  showWordCount
                  debounceDelay={150}
                />
              )}
            />
            {errors.detailed_description && (
              <p className='text-red-500 text-xs mt-1'>
                {errors.detailed_description.message as string}
              </p>
            )}
          </div>

          <div className="mt-2">
            <Input
              label="Tags *"
              placeholder="Apple, flegship, etc."
              error={errors.tags?.message as string}
              {...register('tags', {
                required: 'Seperate related products tags with a comma',
              })}
            />
          </div>

          <div className="mt-2">
            <Input
              label="Warranty *"
              placeholder="1 year / No warranty."
              error={errors.warranty?.message as string}
              {...register('warranty', {
                required: 'Product warranty is required',
              })}
            />
          </div>

          <div className="mt-2 flex items-start gap-3 w-full">
            <div className="flex-1">
              <Input
                label="Slug *"
                placeholder="Product Slug"
                error={errors.slug?.message as string}
                {...register('slug', {
                  required: 'Product slug is required',
                  pattern: {
                    value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message:
                      'Invalid slug format! Use only lowercase letters, numbers and hyphens',
                  },
                  minLength: {
                    value: 3,
                    message: 'Slug must be at least 3 characters long.',
                  },
                  maxLength: {
                    value: 50,
                    message: 'Slug cannot be longer than 50 characters.',
                  },
                })}
              />
            </div>

            <div className="pt-[26px]">
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="h-[50px] px-4 bg-[#18181b] hover:bg-gray-800 text-[#80Deea] border border-gray-700 rounded-xl transition-colors flex items-center justify-center whitespace-nowrap"
                title="Auto-generate from Title"
              >
                <Wand2 size={18} />
              </button>
            </div>
          </div>

          <div className="mt-2">
            <Input
              label="Brand"
              placeholder="Apple"
              error={errors.brand?.message as string}
              {...register('brand')}
            />
          </div>

          <div className="mt-2">
            <ColorSelector control={control} errors={errors} />
          </div>
        </div>

        {/* Right Column (Custom Specs) */}
        <div className="w-full lg:w-[30%]">
          <div className="mt-2">
            <CustomSpecification control={control} errors={errors} />
          </div>

          <div className="mt-2">
            <CustomProperties control={control} errors={errors} />
          </div>

          <div className="mt-2">
            <SegmentedControl
              name="cash_on_delivery"
              control={control}
              errors={errors}
              label="Cash on Delivery *"
              icon={<Banknote size={18} />}
              defaultValue="yes"
              rules={{ required: 'You must select a delivery payment option' }}
              options={[
                { label: 'Yes, allow COD', value: 'yes' },
                { label: 'No, prepaid only', value: 'no' },
              ]}
            />
          </div>

          <div className='mt-2'>
            <CategorySelector
              dropdowns={dynamicDropdowns}
              isLoading={isLoading}
              isError={isError}
              control={control}
              errors={errors}
              categoryPath={categoryPath}
              setValue={setValue}
            />
          </div>

          <div className="mt-2">
            <Input
              label="Video URL"
              placeholder="https://www.youtube.com/embed/xyz123"
              error={errors.video_url?.message as string}
              {...register('video_url', {
                pattern: {
                  // Matches youtube.com/watch?v=..., youtu.be/..., and youtube.com/embed/...
                  value: /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/,
                  message: "Please enter a valid YouTube URL"
                }
              })}
            />
          </div>

          <div className='mt-2'>
            <Input
              label="Sale Price *"
              placeholder="$1000"
              error={errors.sale_price?.message as string}
              {...register('sale_price', {
                required: "Sale Price is required",
                valueAsNumber: true,
                min: { value: 1, message: "Sale price must be at least 1" },
                validate: (value) => {
                  if (isNaN(value)) return "Only nubers are allowed";
                  if (regularPrice && value >= regularPrice) {
                    return "Sale Price must be less than Regular Price"
                  }
                  return true
                }
              })}
            />
          </div>

          <div className='mt-2'>
            <Input
              label="Stock *"
              placeholder="100"
              error={errors.stock?.message as string}
              {...register('stock', {
                required: "Stock is required",
                valueAsNumber: true,
                max: { value: 1000, message: "Stock cannot exceed 1000" },
                validate: (value) => {
                  if (isNaN(value)) return "Only nubers are allowed";
                  if (!Number.isInteger(value)) {
                    return "Stock must be a whole number"
                  }
                  return true
                }
              })}
            />
          </div>

          <div className='mt-2'>
            <Controller
              name="sizes"
              control={control}
              rules={{
                validate: (value) => (value && value.length > 0 ? true : "Select at least one size"),
              }}
              render={({ field }) => (
                <SizeSelector
                  multiple
                  sizes={AVAILABLE_SIZES}
                  value={field.value}
                  onChange={field.onChange}
                  label="Available sizes"
                  error={errors.sizes?.message as string}
                />
              )}
            />
          </div>

          <div className='mt-3'>
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal size={18} className="text-[#80Deea]" />
              <label className="block text-sm font-semibold text-gray-300">
                Select Discount Codes
              </label>
              <span className="text-xs text-gray-500 font-normal ml-auto">
                Optional
              </span>
            </div>

            {discountLoading ? (
              <p className='text-gray-400'>
                Loading Discount Codes...
              </p>
            ): (
              <div className='flex flex-wrap gap-2'>
                {discountCodes?.map((code: any) => (
                  <button
                    className={`
                      px-3 py-1 rounded-md text-sm font-semibold border 
                      ${watch("discountCodes")?.(code.id) 
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-700"}
                      `} 
                    type='button' 
                    key={code.id}
                    onClick={() => {
                      const currentSelection = watch("discountCodes") || []
                      const updatedSelection = currentSelection?.includes(code.id) 
                        ? currentSelection.filter((id: string) => id !== code.id) 
                        : [...currentSelection, code.id]; setValue("discountCodes", updatedSelection) 
                    }}
                  >
                    {code?.public_name} ({code.discountValue} {code.discountType === "percentage" ? "%" : "$"})
                  </button> 
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        {isCleared && (
          <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-[#80Deea] text-black font-semibold rounded-lg hover:bg-[#80Deea]/80 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save Draft'}
        </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-[#80Deea] text-black font-semibold rounded-lg hover:bg-[#80Deea]/80 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create Product'}
        </button>
      </div>

      {isModalOpen && viewerImages.length > 0 && (
        <ImageViewerModal
          images={viewerImages}
          activeId={viewerActiveId || viewerImages[0].id}
          onSelect={handleSelectActiveId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </form>
  );
};

export default CreateProductPage;
