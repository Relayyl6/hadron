import React from 'react';
import { Controller } from 'react-hook-form';

interface Option {
  label: string;
  value: string | boolean | number;
}

interface SegmentedControlProps {
  name: string;
  control: any;
  errors?: any;
  label: string;
  options: Option[];
  icon?: React.ReactNode;
  rules?: any;
  defaultValue?: string | boolean | number;
}

const SegmentedControl = ({
  name,
  control,
  errors,
  label,
  options,
  icon,
  rules,
  defaultValue,
}: SegmentedControlProps) => {
  return (
    <div className="w-full mt-4">
      {/* Header Section */}
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-[#80Deea]">{icon}</span>}
        <label className="block text-sm font-semibold text-gray-300">
          {label}
        </label>
      </div>

      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={rules}
        render={({ field }) => (
          <div className="flex bg-[#18181b] border border-gray-800 rounded-lg p-1 w-full sm:w-fit">
            {options.map((option, index) => {
              const isActive = field.value === option.value;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={`flex-1 sm:w-40 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 flex justify-center items-center ${
                    isActive
                      ? 'bg-gray-700/50 text-white shadow-sm border border-gray-600'
                      : 'text-gray-500 border border-transparent hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      />

      {/* Validation Error */}
      {errors?.[name]?.message && (
        <span className="text-xs font-medium text-red-400 mt-2 block">
          {errors[name].message as string}
        </span>
      )}
    </div>
  );
};

export default SegmentedControl;
