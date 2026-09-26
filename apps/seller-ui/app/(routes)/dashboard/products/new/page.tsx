// page.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ChevronRight, Plus, Maximize2, Wand2, Banknote, SlidersHorizontal, X, Wand, Trash2 } from 'lucide-react';
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
import { apiRequest } from '@/shared/utils/fetch';
import { toast } from 'react-toastify';
import { enhancementOptions } from '@/shared/utils/enhancement';
import { useRouter } from 'next/navigation';

const MAX_IMAGES = 8;
type ImageSlot = {
  id: string;
  url: string | null
  uploadedFileName?: string;
  uploadedFileId?: string;
};
type ImageUploadResponse = {
  success: boolean;
  message?: string; // Only present if there is an error
  data?: {          // Only present if successful
    file_name: string;
    url: string;
    fileId: string;
  };
};
type ProductCreateResponse = {
  success: boolean;
  message?: string; // Only present if there is an error
};
const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const CreateProductPage = () => {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  const [images, setImages] = useState<ImageSlot[]>([{ id: 'slot-0', url: null }]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeEffect, setActiveEffect] = useState<string | null>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const idCounter = useRef(1);

  // Load from localStorage only AFTER hydration to prevent mismatch
  useEffect(() => {
    const savedImages = localStorage.getItem('draft_product_images');
    if (savedImages) {
      try {
        const parsed = JSON.parse(savedImages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setImages(parsed);
          const maxId = Math.max(0, ...parsed.map((img: any) => parseInt(img.id.replace('slot-', '')) || 0));
          idCounter.current = maxId + 1;
        }
      } catch (e) {}
    }

    const savedForm = localStorage.getItem('draft_product_form');
    if (savedForm) {
      try {
        const parsedForm = JSON.parse(savedForm);
        reset(parsedForm);
      } catch (e) {}
    }

    const savedDiscounts = localStorage.getItem('draft_product_discounts');
    if (savedDiscounts) {
      try {
        const parsedDiscounts = JSON.parse(savedDiscounts);
        if (Array.isArray(parsedDiscounts)) {
          setSelectedDiscounts(parsedDiscounts);
        }
      } catch (e) {}
    }

    setIsInitialized(true);
  }, [reset]);

  // Save to localStorage whenever images change (but only after initial load)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('draft_product_images', JSON.stringify(images));
    }
  }, [images, isInitialized]);

  const makeSlot = (): ImageSlot => ({
    id: `slot-${idCounter.current++}`,
    url: null,
  });


  const [openImageModal, setOpenImageModal] = useState<boolean>(false);
  const [isCleared] = useState<boolean>(true)
  const [finalLoading, setFinalLoading] = useState<boolean>(false)
  const [pictureUploading, setPictureUploading] = useState<boolean>(false)
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);


  // Decoupled States: Active Image vs Modal Visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewerActiveId, setViewerActiveId] = useState<string | null>(() => {
    if (typeof window !== 'undefined')
      return localStorage.getItem('product_images_active_id');
    return null;
  });

  const router = useRouter()

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

  const convertFileToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    })
  }

  const syncFormValue = (slots: ImageSlot[]) =>
    setValue('images', slots.map((s) => s.url).filter(Boolean));

  const handleImageChange = async (file: File | null, id: string) => {
    if (!file) return;
    setPictureUploading(true)

    try {
      const base64 = await convertFileToBase64(file)

      const response = await apiRequest<ImageUploadResponse>(
        `/api/products/product/upload-product-image`,
        { 
          method: 'POST',
          body: { 
            image: base64, 
            fileName: file.name 
          } 
        }
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to upload image to server");
      }

      const { file_name, fileId, url } = response.data;

      setImages((prev) => {
        const updated = prev.map((slot) => {
          if (slot.id !== id) return slot;
          
          return {
            ...slot,
            url,
            uploadedFileName: file_name, // Inject the backend response here!
            uploadedFileId: fileId,
          };
        });

        const isLastSlot = updated[updated.length - 1]?.id === id;
        if (isLastSlot && file && updated.length < MAX_IMAGES) {
          updated.push(makeSlot());
        }
        
        // 4. Sync the form with the newly uploaded strings
        syncFormValue(updated);
        return updated;
      });

      if (file) handleSelectActiveId(id);
    } catch (error) {
      console.error("Failed to upload image:", error);
      const errorMessage = (error as Error)?.message || "Failed to upload image.";
      toast.error(errorMessage);
    } finally {
      setPictureUploading(false)
    }
  };

  const handleRemoveImage = async (id: string) => {
    // 1. Find the target image in your current state to get the filename
    const targetSlot = images.find((s) => s.id === id);
    // const fileNameToDelete = targetSlot?.uploadedFileName;
    const fileIdToDelete = targetSlot?.uploadedFileId;

    try {
      // 2. If the image was successfully uploaded to the server, delete it there first
      if (fileIdToDelete) {
        await apiRequest(
          `/api/products/product/delete-product-image`,
          { 
            method: 'DELETE',
            body: { fileId: fileIdToDelete } 
          }
        );
      }

      // 3. Once deleted from the server (or if it was never uploaded), remove it from the UI
      setImages((prev) => {
        let updated = prev.filter((slot) => slot.id !== id);
        
        // Ensure there is always at least one empty slot
        if (updated.length === 0) {
            updated = [makeSlot()];
        } 
        // Append a new empty slot if we have room and don't already have one
        else if (!updated.some((s) => s.url === null) && updated.length < MAX_IMAGES) {
            updated.push(makeSlot());
        }
        
        syncFormValue(updated);
        return updated;
      });

      if (viewerActiveId === id) handleSelectActiveId(null);

    } catch (error) {
      console.error("An error occurred while deleting the image:", error);
      const errorMessage = (error as Error)?.message || "Failed to delete image from the server.";
      toast.error(errorMessage);
    }
  };

  const applyTransformation = (transformation: string | null) => {
    if (!activeSlot?.url || processing) return;
    setProcessing(true);
    setActiveEffect(transformation)

    try {
      // 1. Clean the URL: Split at '?' to remove any previously applied transformations
      const baseUrl = activeSlot.url.split('?')[0];
      
      // If an effect was selected, append it. If deselected (null), just use the clean base URL.
      const transformationUrl = transformation ? `${baseUrl}?tr=${transformation}` : baseUrl

      // 3. Update the master state so the UI and the form data both update
      setImages((prev) => {
        const updated = prev.map((slot) => {
          // Find the currently active image and update its URL
          if (slot.id === activeSlot.id) {
            return { ...slot, url: transformationUrl };
          }
          return slot;
        });
        
        // 4. Sync it to react-hook-form so the final submission gets the transformed URL
        syncFormValue(updated); 
        return updated;
      });
    } catch (error) {
      console.error("An error occured")
      toast.error((error as Error)?.message)
    } finally {
      setProcessing(false);
    }
   }

  const onSubmit = async (data: any) => {
    // 1. Extract valid image objects (including the fileId from ImageKit)
    const validImages = images
      .filter((slot) => slot.url !== null)
      .map((slot) => ({
        fileId: slot.uploadedFileId || "", // Pass the ID for backend mapping
        url: slot.url as string
      }));

    if (validImages.length === 0) {
      setError('images', {
        type: 'required',
        message: 'At least one product image is required',
      });
      return;
    }

    setFinalLoading(true)
    
    try {
      // 2. Format Colors for Prisma ({ name, hexCode })
      const formattedColors = (data.colors || []).map((hex: string) => ({
        name: hex, // Fallback to hex string since ColorSelector doesn't provide color names
        hexCode: hex
      }));

      // 3. Format Custom Properties to match Prisma's "propertyName" key
      const formattedCustomProperties = (data.customProperties || []).map((prop: any) => ({
        propertyName: prop.label,
        values: prop.values
      }));

      // 4. Map Custom Specs: Strips out React Hook Form's hidden 'id' field and removes blank rows
      const formattedCustomSpecs = (data.custom_specifications || [])
        .filter((spec: any) => spec.name && spec.value) // Ignores rows where the user clicked "Add" but typed nothing
        .map((spec: any) => ({
          name: spec.name,
          value: spec.value
        }));

      // 4. Build the final payload
      const payload = {
        ...data,
        images: validImages,
        colors: formattedColors,
        custom_properties: formattedCustomProperties,
        custom_specifications: formattedCustomSpecs,
        discount_codes: selectedDiscounts, // Insert the state variable here
        
        // Ensure numbers are parsed just in case react-hook-form left them as strings
        sale_price: parseFloat(data.sale_price),
        regularPrice: parseFloat(data.regular_price || data.sale_price), // Fallback if missing
        stock: parseInt(data.stock, 10)
      };

      const response = await apiRequest<ProductCreateResponse>(
        `/api/products/product/create-product`,
        { 
          method: 'POST',
          body: payload 
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to create product");
      } 

      toast.success("Product created successfully!");
      router.push("/dashboard/products/all");

      localStorage.removeItem('draft_product_images');
      localStorage.removeItem('draft_product_form');
      localStorage.removeItem('draft_product_discounts');
      setImages([makeSlot()])
    } catch (error) {
      const errorMsg = (error as Error).message;
      toast.error(errorMsg);
      if (errorMsg === "No shop found for this seller profile.") {
        localStorage.setItem('draft_product_form', JSON.stringify(data));
        localStorage.setItem('draft_product_images', JSON.stringify(images));
        localStorage.setItem('draft_product_discounts', JSON.stringify(selectedDiscounts));
        router.push('/create-shop?returnUrl=/dashboard/products/new');
      }
    } finally {
      setProcessing(false)
      setFinalLoading(false)
    }
  };

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
  const uploadedImages = images.filter((s) => s.url !== null);
  const emptySlot = images.find((s) => s.url === null);
  const activeSlot =
    images.find((s) => s.id === viewerActiveId && s.url) ||
    uploadedImages[0];
  const viewerImages = uploadedImages.map((s) => ({
    id: s.id,
    url: s.url!,
  }));

  const handleToggle = (codeId: string) => {
    setSelectedDiscounts((prev) => 
      prev.includes(codeId) 
        ? prev.filter((id) => id !== codeId) // Remove it if already selected
        : [...prev, codeId]                  // Add it if not selected
    );
  };

  return (
    <form
      className="w-full mx-auto p-4 md:p-8 shadow-md rounded-lg text-white"
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

      <div className="py-4 w-full flex flex-col lg:flex-row gap-4 lg:gap-8">
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
                    disabled={pictureUploading}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#18181b] hover:bg-gray-800 border border-gray-700 rounded-lg p-2 transition-colors"
                    title="Upload New Image"
                  >
                    <Plus size={18} className="text-[#80Deea]" />
                  </button>
                )}

                {/* Fullscreen Modal Button */}
                {activeSlot?.url && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#18181b] hover:bg-gray-800 border border-gray-700 rounded-lg p-2 transition-colors"
                    title="Open Fullscreen Gallery"
                  >
                    <Maximize2 size={18} className="text-[#80Deea]" />
                  </button>
                )}

                {/* Delete Image Button */}
                {activeSlot?.url && (
                  <button
                    type="button"
                    disabled={pictureUploading}
                    onClick={() => handleRemoveImage(activeSlot.id)}
                    className="bg-[#18181b] hover:bg-red-900/30 border border-gray-700 rounded-lg p-2 transition-colors"
                    title="Delete Image"
                  >
                    <Trash2 size={18} className="text-red-400" />
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
              <div className="relative group">
                <ImagePlaceholder
                  id={activeSlot.id}
                  pictureLoading={pictureUploading}
                  size="765 x 850"
                  small={false}
                  url={activeSlot.url}
                  onImageChange={handleImageChange}
                  onRemove={handleRemoveImage}
                  onOpenViewer={() => setIsModalOpen(true)} 
                />
                
                {/* 👈 THE TRIGGER BUTTON: Only shows if there is an uploaded image */}
                {activeSlot.url && (
                  <button 
                    type="button"
                    onClick={() => setOpenImageModal(true)}
                    className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-md transition-colors z-10"
                  >
                    ✨ Enhance
                  </button>
                )}
              </div>
            ) : (
              <div className="h-[300px] md:h-[450px] w-full border border-gray-700 rounded-lg flex items-center justify-center bg-[#1e1e1e] text-gray-400 text-sm">
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
                  // Strip HTML tags and replace common entities to correctly count words
                  const plainText = value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ');
                  const wordCount = plainText.split(/\s+/).filter((word: string) => word.trim().length > 0).length;
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

          <div className='mt-2'>
            <Input
              type="number"
              label="Stock *"
              placeholder="100"
              error={errors.stock?.message as string}
              {...register('stock', {
                required: "Stock is required",
                valueAsNumber: true,
                max: { value: 1000, message: "Stock cannot exceed 1000" },
                validate: (value) => {
                  if (isNaN(value)) return "Only numbers are allowed";
                  if (!Number.isInteger(value)) {
                    return "Stock must be a whole number"
                  }
                  return true
                }
              })}
            />
          </div>

          <div className='mt-2'>
            <Input
              type="number"
              label="Regular Price"
              placeholder="1000"
              error={errors.regular_price?.message as string}
              {...register('regular_price', {
                valueAsNumber: true,
                validate: (value) => {
                  if (isNaN(value)) return true;
                  if (value <= 0) return "Regular price must be greater than 0";
                  return true;
                }
              })}
            />
          </div>

          <div className='mt-2'>
            <Input
              type="number"
              label="Sale Price *"
              placeholder="1000"
              error={errors.sale_price?.message as string}
              {...register('sale_price', {
                required: "Sale Price is required",
                valueAsNumber: true,
                min: { value: 1, message: "Sale price must be at least 1" },
                validate: (value) => {
                  if (isNaN(value)) return "Only numbers are allowed";
                  if (regularPrice && value > regularPrice) {
                    return "Sale Price cannot be greater than Regular Price"
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
                {discountCodes?.map((code: any) => {
                  const isSelected = selectedDiscounts.includes(code.id);

                  return (
                    <button
                      key={code.id}
                      type='button' 
                      onClick={() => handleToggle(code.id)}
                      className={`
                        px-3 py-1 rounded-md text-sm font-semibold border transition-colors
                        ${isSelected 
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-500"}
                      `} 
                    >
                      {code?.public_name} ({code.discountValue}{code.discountType === "percentage" ? "%" : "$"})
                    </button> 
                  );
                })}
                {
                  discountError && (
                    <span className="text-xs font-medium text-red-400">{discountError}</span>
                  )
                }
              </div>
            )}
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
              disabled={finalLoading}
              className="px-6 py-2.5 bg-[#80Deea] text-black font-semibold rounded-lg hover:bg-[#80Deea]/80 disabled:opacity-50 transition-colors"
            >
              {finalLoading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>

      {openImageModal && activeSlot?.url && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          {/* Modal Container: Two-column layout on md+ screens for a premium editor feel */}
          <div className="bg-[#18181b] rounded-2xl w-full max-w-4xl border border-gray-800 shadow-2xl flex flex-col md:flex-row overflow-hidden">
            
            {/* LEFT COLUMN: Image Preview */}
            <div className="w-full md:w-1/2 bg-[#0f0f11] p-6 flex flex-col border-b md:border-b-0 md:border-r border-gray-800">
              <div className="flex items-center justify-between md:hidden mb-4">
                <h2 className="text-lg font-semibold text-white">Enhance Image</h2>
                <button onClick={() => setOpenImageModal(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative w-full aspect-square bg-black/40 rounded-xl overflow-hidden border border-gray-800/50 shadow-inner flex-shrink-0">
                <img
                  src={activeSlot.url}
                  alt="Product preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">
                Select an AI enhancement to apply it to your product.
              </p>
            </div>

            {/* RIGHT COLUMN: Tools & Settings */}
            <div className="w-full md:w-1/2 p-6 flex flex-col max-h-[85vh]">
              {/* Header (Desktop) */}
              <div className="hidden md:flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Wand size={20} className="text-blue-500" />
                  AI Enhancements
                </h2>
                <button 
                  onClick={() => setOpenImageModal(false)} // 👈 Changed from !openImageModal to explicitly false
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Enhancement List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {enhancementOptions?.map(({ label, effect, description }) => {
                  const isActive = activeEffect === effect;
                  return (
                    <button
                      key={effect}
                      disabled={processing}
                      onClick={() => isActive ? applyTransformation(null) : applyTransformation(effect)} // 👈 Assuming you have this state setter
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group flex flex-col gap-1 ${
                        isActive 
                          ? "bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                          : "bg-gray-800/30 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${
                          isActive ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-400 group-hover:text-gray-300"
                        }`}>
                          <Wand size={16} />
                        </div>
                        <span className={`font-medium ${isActive ? "text-blue-400" : "text-gray-200"}`}>
                          {label}
                        </span>
                      </div>
                      {description && (
                        <p className={`text-xs pl-11 leading-relaxed ${isActive ? "text-blue-200/70" : "text-gray-500"}`}>
                          {description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="mt-6 pt-5 border-t border-gray-800">
                <button 
                  onClick={() => setOpenImageModal(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}



      {isModalOpen && viewerImages.length > 0 && (
        <ImageViewerModal
          pictureLoading={pictureUploading}
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
