"use client";

/**
 * CategorySelector
 * ---------------------------------------------------------------------------
 * UI refinement of the cascading category <select> grid. Logic (the
 * `dynamicDropdowns` derivation) is unchanged and still belongs in the
 * parent form — pass it in as a prop, along with react-hook-form's
 * `control` / `setValue` / `errors` / `categoryPath`. This component is
 * purely about presentation:
 *
 * - Custom chevron icon over `appearance-none` selects (native arrows look
 *   inconsistent across browsers, especially on dark backgrounds).
 * - Skeleton loading state instead of a plain "Loading..." line.
 * - Error state gets a red border + inline icon, not just red text below.
 * - Each newly-revealed dropdown (as the user drills into subcategories)
 *   fades/slides in instead of just popping into the grid.
 * - Consistent spacing, focus rings, and hover states across every level.
 *
 * Usage:
 *   <CategorySelector
 *     dropdowns={dynamicDropdowns}
 *     isLoading={isLoading}
 *     isError={isError}
 *     control={control}
 *     errors={errors}
 *     categoryPath={categoryPath}
 *     setValue={setValue}
 *   />
 * ---------------------------------------------------------------------------
 */

import React, { useEffect, useState } from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";

export interface CategoryDropdown {
  level: number;
  label: string;
  options: Array<string | { name: string }>;
  selectedValue: string;
}

interface CategorySelectorProps {
  dropdowns: CategoryDropdown[];
  isLoading: boolean;
  isError: boolean;
  control: Control<any>;
  errors: FieldErrors<any>;
  categoryPath: string[];
  setValue: (name: "categoryPath", value: string[], options?: Record<string, unknown>) => void;
  className?: string;
}

// Small chevron, drawn inline so this file has no icon-library dependency.
const ChevronIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
  >
    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 text-red-500 shrink-0">
    <path
      d="M10 6.5v4M10 13.25h.01M10 2.5l7.5 13H2.5l7.5-13Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Fades a dropdown in the moment it's added to the grid (new subcategory
 *  level appearing as the user drills down), without any animation deps. */
const RevealOnMount: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="transition-all duration-200 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(4px)",
      }}
    >
      {children}
    </div>
  );
};

const SelectSkeleton = () => (
  <div className="w-full">
    <div className="h-3 w-20 rounded bg-zinc-800 animate-pulse mb-1.5" />
    <div className="h-[38px] w-full rounded-md bg-zinc-800 animate-pulse" />
  </div>
);

const CategorySelector: React.FC<CategorySelectorProps> = ({
  dropdowns,
  isLoading,
  isError,
  control,
  errors,
  categoryPath,
  setValue,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={["grid grid-cols-1 sm:grid-cols-2 gap-4", className].filter(Boolean).join(" ")}>
        <SelectSkeleton />
        <SelectSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2">
        <AlertIcon />
        <p className="text-red-400 text-sm">Couldn't load categories. Try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className={["grid grid-cols-1 sm:grid-cols-2 gap-4", className].filter(Boolean).join(" ")}>
      {dropdowns.map((dropdown) => {
        const fieldError = (errors.categoryPath as any)?.[dropdown.level];

        return (
          <RevealOnMount key={`category-level-${dropdown.level}`}>
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-400 mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                {dropdown.label}
              </label>

              <Controller
                name={`categoryPath.${dropdown.level}`}
                control={control}
                rules={{ required: `Please select a ${dropdown.label.toLowerCase()}` }}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      {...field}
                      value={dropdown.selectedValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newPath = [...categoryPath.slice(0, dropdown.level), val];
                        setValue("categoryPath", newPath, { shouldValidate: true });
                      }}
                      className={[
                        "w-full h-[38px] pl-3 pr-8 rounded-md border text-sm bg-transparent",
                        "appearance-none outline-none transition-colors duration-150",
                        "hover:border-gray-500",
                        "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40",
                        fieldError ? "border-red-500/60" : "border-gray-700",
                      ].join(" ")}
                    >
                      <option value="" className="bg-zinc-900 text-gray-400">
                        Select {dropdown.label.toLowerCase()}...
                      </option>
                      {dropdown.options.map((opt) => {
                        const optName = typeof opt === "string" ? opt : opt.name;
                        return (
                          <option key={optName} value={optName} className="bg-zinc-900 text-white">
                            {optName}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronIcon />
                  </div>
                )}
              />

              {fieldError && (
                <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5">
                  <AlertIcon />
                  {fieldError.message as string}
                </p>
              )}
            </div>
          </RevealOnMount>
        );
      })}
    </div>
  );
};

export default CategorySelector;