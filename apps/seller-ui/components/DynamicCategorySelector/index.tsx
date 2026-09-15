import React, { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export default function DynamicCategorySelector({ categories, subCategories, control, watch, setValue, errors }: any) {
  // Watch the entire category path array (e.g., ["Automotive", "Car Accessories", "Interior", "Seat Covers"])
  const selectedPath: string[] = watch("categoryPath") || [];

  // Helper to compute subcategories dynamically at any depth `level`
  const getSubcategoriesAtLevel = (path: Array<string>, currentLevel: number) => {
    if (!subCategories) return [];
    
    if (currentLevel === 0) {
      // Level 0: Main categories dictionary keys
      return categories || [];
    }

    // Traverse down the nested tree based on the user's prior selections
    let currentNodes: any = subCategories[path[0]];
    
    for (let i = 1; i < currentLevel; i++) {
      const selectedName = path[i];
      if (!Array.isArray(currentNodes)) return [];
      const found = currentNodes.find((item: any) => (item.name || item) === selectedName);
      if (!found || !found.subcategories) return [];
      currentNodes = found.subcategories;
    }

    return Array.isArray(currentNodes) ? currentNodes : [];
  };

  // Build the list of active dropdown rows dynamically
  const renderDropdowns = () => {
    const dropdowns = [];
    let currentLevel = 0;
    let hasMoreLevels = true;

    while (hasMoreLevels) {
      const options = getSubcategoriesAtLevel(selectedPath, currentLevel);

      // If no options exist for this level, stop generating further dropdowns
      if (!options || options.length === 0) {
        hasMoreLevels = false;
        break;
      }

      const levelIndex = currentLevel;
      const label = levelIndex === 0 ? "Category" : levelIndex === 1 ? "Subcategory" : `Sub-Level ${levelIndex}`;

      dropdowns.push(
        <div key={`level-${levelIndex}`} className="space-y-1">
          <label className="block text-xs font-medium text-gray-400">{label}</label>
          <Controller
            name={`categoryPath.${levelIndex}`}
            control={control}
            rules={{ required: `${label} is required` }}
            render={({ field }) => (
              <select
                {...field}
                value={selectedPath[levelIndex] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  // Slice the path up to the current level and append the new selection
                  const newPath = [...selectedPath.slice(0, levelIndex), val];
                  setValue("categoryPath", newPath);
                }}
                className='w-full p-2.5 border outline-none rounded-md border-gray-700 bg-transparent text-sm focus:border-indigo-500 transition-colors'
              >
                <option value="" className='bg-zinc-900 text-gray-400'>
                  Select {label.toLowerCase()}...
                </option>
                {options.map((opt: any) => {
                  const optName = typeof opt === 'string' ? opt : opt.name;
                  return (
                    <option key={optName} value={optName} className='bg-zinc-900 text-white'>
                      {optName}
                    </option>
                  );
                })}
              </select>
            )}
          />
        </div>
      );

      // If the user hasn't made a selection for this level yet, stop expanding further levels down
      if (!selectedPath[levelIndex]) {
        hasMoreLevels = false;
      } else {
        currentLevel++;
      }
    }

    return dropdowns;
  };

  return (
    <div className="space-y-4">
      {renderDropdowns()}
    </div>
  );
}