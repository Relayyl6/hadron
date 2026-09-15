import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import Input from '../input'; // Adjust import path if needed
import { Plus, X, Tags, CornerDownRight } from 'lucide-react';

interface CustomPropertiesProps {
  control: any;
  errors: any;
}

interface CustomProperty {
  label: string;
  values: string[];
}

const CustomProperties = ({ control, errors }: CustomPropertiesProps) => {
  // Track the "new value" input for each property independently using its index
  const [newValues, setNewValues] = useState<{ [key: number]: string }>({});
  const [newLabel, setNewLabel] = useState('');

  return (
    <div className="w-full mt-6">
      {/* Header Section */}
      <div className="flex items-center gap-2 mb-3">
        <Tags size={18} className="text-[#80Deea]" />
        <label className="block text-sm font-semibold text-gray-300">
          Custom Properties
        </label>
        <span className="text-xs text-gray-500 font-normal ml-auto">
          Optional
        </span>
      </div>

      <Controller
        name="customProperties"
        control={control}
        defaultValue={[]} // Ensure it starts as an array
        render={({ field }) => {
          const properties: CustomProperty[] = field.value || [];

          // --- Action Handlers ---
          const addProperty = () => {
            if (!newLabel.trim()) return;
            field.onChange([
              ...properties,
              { label: newLabel.trim(), values: [] },
            ]);
            setNewLabel('');
          };

          const removeProperty = (index: number) => {
            const updated = properties.filter((_, i) => i !== index);
            field.onChange(updated);

            // Cleanup the specific input state for this index
            const updatedNewValues = { ...newValues };
            delete updatedNewValues[index];
            setNewValues(updatedNewValues);
          };

          const addValue = (index: number) => {
            const val = newValues[index];
            if (!val || !val.trim()) return;

            const updated = [...properties];
            // Prevent duplicate values in the same property
            if (!updated[index].values.includes(val.trim())) {
              updated[index].values.push(val.trim());
              field.onChange(updated);
            }
            // Clear the input field for this specific property
            setNewValues({ ...newValues, [index]: '' });
          };

          const removeValue = (propIndex: number, valueToRemove: string) => {
            const updated = [...properties];
            updated[propIndex].values = updated[propIndex].values.filter(
              (v) => v !== valueToRemove,
            );
            field.onChange(updated);
          };

          return (
            <div className="flex flex-col gap-2">
              {/* Empty State */}
              {properties.length === 0 && (
                <div className="w-full border-2 border-dashed border-gray-700/50 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-gray-800/10">
                  <p className="text-sm text-gray-400">
                    No custom properties added.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Useful for variants like "Size", "Color", or "Material".
                  </p>
                </div>
              )}

              {/* Populated Properties */}
              {properties.length > 0 && (
                <div className="flex flex-col gap-3">
                  {properties.map((property, index) => (
                    <div
                      key={index}
                      className="border border-gray-800 bg-[#18181b]/50 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-200 font-semibold text-sm flex items-center gap-2">
                          {property.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProperty(index)}
                          className="text-gray-500 hover:text-red-400 transition-colors p-1"
                          title="Remove Property"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Show Existing Values (Chips) */}
                      {property.values.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {property.values.map((value, valIndex) => (
                            <span
                              key={valIndex}
                              className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-gray-800/80 border border-gray-700 text-gray-300 text-xs rounded-md"
                            >
                              {value}
                              <button
                                type="button"
                                onClick={() => removeValue(index, value)}
                                className="text-gray-500 hover:text-red-400 hover:bg-gray-700 p-0.5 rounded transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Input to add new value to this property */}
                      <div className="flex items-center gap-2">
                        <CornerDownRight
                          size={16}
                          className="text-gray-600 shrink-0"
                        />
                        <div className="flex-1">
                          <Input
                            placeholder={`Add value for ${property.label} (e.g. XL, Red, Leather)`}
                            value={newValues[index] || ''}
                            onChange={(e: any) =>
                              setNewValues({
                                ...newValues,
                                [index]: e.target.value,
                              })
                            }
                            onKeyDown={(e: any) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addValue(index);
                              }
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="h-[50px] px-4 bg-[#18181b] text-gray-400 border border-gray-700 hover:border-[#80Deea]/50 hover:text-[#80Deea] rounded-lg transition-all font-medium text-sm"
                          onClick={() => addValue(index)}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input to create a completely new Property Label */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1">
                  <Input
                    placeholder="New property name (e.g. Material, Edition)"
                    value={newLabel}
                    onChange={(e: any) => setNewLabel(e.target.value)}
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addProperty();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="h-[50px] px-5 bg-[#80Deea]/10 text-[#80Deea] border border-[#80Deea]/30 hover:bg-[#80Deea] hover:text-black rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  onClick={addProperty}
                  disabled={!newLabel.trim()}
                >
                  <Plus size={18} className="mr-1.5" />
                  Create
                </button>
              </div>

              {/* Validation Errors */}
              {errors?.customProperties?.message && (
                <span className="text-xs font-medium text-red-400 block">
                  {errors.customProperties.message as string}
                </span>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};

export default CustomProperties;
