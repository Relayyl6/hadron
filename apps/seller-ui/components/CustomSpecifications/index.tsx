import React from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import Input from '../input';
import { Plus, Trash2, SlidersHorizontal } from 'lucide-react';

interface CustomSpecificationProps {
  control: any;
  errors: any;
}

const CustomSpecification = ({ control, errors }: CustomSpecificationProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'custom_specifications',
  });

  return (
    <div className="w-full mt-6">
      {/* Header Section */}
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={18} className="text-[#80Deea]" />
        <label className="block text-sm font-semibold text-gray-300">
          Custom Specifications
        </label>
        <span className="text-xs text-gray-500 font-normal ml-auto">
          Optional
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Empty State */}
        {fields.length === 0 && (
          <div className="w-full border-2 border-dashed border-gray-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-gray-800/10 transition-colors hover:bg-gray-800/30">
            <p className="text-sm text-gray-400 mb-4">
              No custom specifications added yet. Use this to highlight unique
              product features.
            </p>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-[#18181b] text-[#80Deea] border border-gray-700 rounded-lg hover:border-[#80Deea]/50 hover:bg-[#80Deea]/10 transition-all font-medium text-sm"
              onClick={() => append({ name: '', value: '' })}
            >
              <Plus size={16} />
              <span>Add First Specification</span>
            </button>
          </div>
        )}

        {/* Populated State */}
        {fields.length > 0 && (
          <div className="w-full rounded-xl p-0 flex flex-col gap-4">
            {fields.map((item, index) => {
              const rowErrors = errors?.custom_specifications?.[index];

              return (
                <div
                  key={item.id}
                  className="flex gap-3 items-start w-full group relative animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="flex-1">
                    <Controller
                      name={`custom_specifications.${index}.name`}
                      control={control}
                      rules={{ required: 'Name is required' }}
                      render={({ field }) => (
                        <Input
                          label={index === 0 ? 'Name' : undefined} // Only show label on the first row for a cleaner look
                          placeholder="e.g. Battery Life, Weight"
                          error={rowErrors?.name?.message as string}
                          {...field}
                        />
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <Controller
                      name={`custom_specifications.${index}.value`}
                      control={control}
                      rules={{ required: 'Value is required' }}
                      render={({ field }) => (
                        <Input
                          label={index === 0 ? 'Value' : undefined}
                          placeholder="e.g. 4000mAh, 1.5kg"
                          error={rowErrors?.value?.message as string}
                          {...field}
                        />
                      )}
                    />
                  </div>

                  {/* Action Button: Alignment adjusts based on whether the labels are showing (first row vs others) */}
                  <div className={`${index === 0 ? 'pt-[26px]' : 'pt-0'}`}>
                    <button
                      type="button"
                      className="h-[50px] px-2 py-2 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      onClick={() => remove(index)}
                      title="Remove specification"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Another Button (Full width ghost button) */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 w-full mt-2 py-3 border border-dashed border-gray-700 text-gray-400 hover:text-[#80Deea] hover:border-[#80Deea]/50 hover:bg-[#80Deea]/5 rounded-lg transition-all font-medium text-sm"
              onClick={() => append({ name: '', value: '' })}
            >
              <Plus size={16} />
              <span>Add Another Specification</span>
            </button>
          </div>
        )}
      </div>

      {/* Root level array errors */}
      {errors?.custom_specifications?.message && (
        <span className="text-xs font-medium text-red-400 mt-2 block">
          {errors.custom_specifications.message as string}
        </span>
      )}
    </div>
  );
};

export default CustomSpecification;
