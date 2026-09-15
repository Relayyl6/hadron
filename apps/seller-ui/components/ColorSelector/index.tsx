import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Plus, Check } from 'lucide-react';

export const DEFAULT_COLOR_PALETTE = [
  '#80Deea',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#D946EF',
  '#EC4899',
  '#F43F5E',
  '#FFD700',
  '#00FA9A',
  '#40E0D0',
  '#1E90FF',
];

const ColorSelector = ({ control, errors, name = 'colors' }: any) => {
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColor, setNewColor] = useState('#ffffff');

  return (
    <div className="w-full flex flex-col gap-1.5 mt-2">
      <label className="text-sm font-semibold text-gray-300">Colors</label>

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const selectedColors = field.value || [];

          return (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 flex-wrap items-center">
                {[...DEFAULT_COLOR_PALETTE, ...customColors].map((color) => {
                  const isSelected = selectedColors.includes(color);
                  // Determine if the color is light to flip the checkmark icon to black
                  const isLight =
                    [
                      '#ffffff',
                      '#ffff00',
                      '#FFD700',
                      '#80Deea',
                      '#00FA9A',
                    ].includes(color.toUpperCase()) ||
                    ['#ffffff', '#ffff00'].includes(color.toLowerCase());

                  return (
                    <button
                      type="button"
                      key={color}
                      onClick={() =>
                        field.onChange(
                          isSelected
                            ? selectedColors.filter((c: string) => c !== color)
                            : [...selectedColors, color],
                        )
                      }
                      className={`
                                        relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#18181b] focus:ring-[#80Deea]
                                        ${
                                          isSelected
                                            ? 'scale-110 shadow-lg ring-2 ring-white ring-offset-2 ring-offset-[#18181b]'
                                            : 'hover:scale-110 shadow-sm border border-gray-700/50'
                                        }
                                    `}
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {isSelected && (
                        <Check
                          size={16}
                          className={isLight ? 'text-black' : 'text-white'}
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}

                {/* Add Custom Color Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed transition-all duration-200
                                ${
                                  showColorPicker
                                    ? 'border-[#80Deea] bg-[#80Deea]/10 text-[#80Deea] rotate-45'
                                    : 'border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-400 hover:text-white'
                                }
                            `}
                  title="Add custom color"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Styled Custom Color Picker Interface */}
              {showColorPicker && (
                <div className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg w-fit animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Hidden overflow masks the ugly default HTML color picker UI */}
                  <div className="relative w-10 h-10 rounded-md overflow-hidden border border-gray-600 focus-within:ring-2 focus-within:ring-[#80Deea]">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase font-mono">
                      {newColor}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Add to custom array AND auto-select it in the form
                      if (
                        !customColors.includes(newColor) &&
                        !DEFAULT_COLOR_PALETTE.includes(newColor)
                      ) {
                        setCustomColors([...customColors, newColor]);
                        field.onChange([...selectedColors, newColor]);
                      } else if (!selectedColors.includes(newColor)) {
                        field.onChange([...selectedColors, newColor]);
                      }
                      setShowColorPicker(false);
                    }}
                    className="ml-2 px-3 py-1.5 text-sm font-medium bg-[#80Deea] text-black rounded-md hover:bg-[#80Deea]/80 transition-colors"
                  >
                    Add Color
                  </button>
                </div>
              )}
            </div>
          );
        }}
      />

      {/* Dynamic Error Message Display */}
      {errors?.[name] && (
        <span className="text-xs font-medium text-red-400 mt-1">
          {errors[name]?.message as string}
        </span>
      )}
    </div>
  );
};

export default ColorSelector;
