"use client";

/**
 * SizeSelector
 * ---------------------------------------------------------------------------
 * A pill/button-group size picker for product forms. Works as a controlled
 * component so it drops straight into react-hook-form's <Controller />,
 * the same pattern the category selector uses elsewhere in this form.
 *
 * - Single-select (radio behaviour) by default; pass `multiple` for
 *   multi-select (checkbox behaviour) — e.g. "which sizes are in stock".
 * - Sizes can be plain strings ("S", "M", "42") or objects if you need to
 *   disable specific sizes (out of stock) without removing them from view.
 * - Keyboard accessible: arrow keys move a roving tabIndex across options,
 *   Space/Enter toggles the focused one. Matches native radio/checkbox
 *   group semantics for screen readers.
 * - Visual language matches the dark UI already in use: zinc/gray
 *   surfaces, indigo-500 as the selected/focus accent.
 *
 * Usage (single-select via Controller):
 *   <Controller
 *     name="size"
 *     control={control}
 *     rules={{ required: "Please select a size" }}
 *     render={({ field }) => (
 *       <SizeSelector
 *         sizes={["XS", "S", "M", "L", "XL", { label: "XXL", value: "XXL", disabled: true }]}
 *         value={field.value}
 *         onChange={field.onChange}
 *         error={errors.size?.message as string}
 *       />
 *     )}
 *   />
 *
 * Usage (multi-select — e.g. "available sizes"):
 *   <SizeSelector sizes={sizes} value={availableSizes} onChange={setAvailableSizes} multiple />
 * ---------------------------------------------------------------------------
 */

import React, { useCallback, useMemo, useRef, useState } from "react";

export interface SizeOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export type SizeInput = string | SizeOption;

interface SingleSelectProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiSelectProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

export type SizeSelectorProps = (SingleSelectProps | MultiSelectProps) & {
  /** The sizes to display, in display order. */
  sizes: SizeInput[];
  /** Optional label rendered above the size group. */
  label?: string;
  /** Shows a skeleton state instead of the sizes (e.g. sizes still loading). */
  isLoading?: boolean;
  /** Validation / server error shown under the group. */
  error?: string;
  /** Disables the entire group (e.g. while the form is submitting). */
  disabled?: boolean;
  /** Extra class name for the wrapping element. */
  className?: string;
};

function normalizeSizes(sizes: SizeInput[]): SizeOption[] {
  return sizes.map((s) => (typeof s === "string" ? { label: s, value: s } : s));
}

const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  value,
  onChange,
  multiple = false,
  label,
  isLoading = false,
  error,
  disabled = false,
  className,
}) => {
  const options = useMemo(() => normalizeSizes(sizes), [sizes]);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  

  const isSelected = useCallback(
    (optValue: string) =>
      multiple ? (value as string[] | undefined)?.includes(optValue) ?? false : value === optValue,
    [multiple, value],
  );

  const selectOption = useCallback(
    (opt: SizeOption) => {
      if (opt.disabled || disabled) return;

      if (multiple) {
        const current = (value as string[]) || [];
        const next = current.includes(opt.value)
          ? current.filter((v) => v !== opt.value)
          : [...current, opt.value];
        (onChange as MultiSelectProps["onChange"])(next);
      } else {
        (onChange as SingleSelectProps["onChange"])(opt.value);
      }
    },
    [disabled, multiple, onChange, value],
  );

  // Roving tabIndex keyboard navigation, matching native radiogroup behaviour.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const lastIndex = options.length - 1;
      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = index === lastIndex ? 0 : index + 1;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = index === 0 ? lastIndex : index - 1;
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          selectOption(options[index]);
          return;
        default:
          return;
      }

      e.preventDefault();
      if (nextIndex !== null) {
        setFocusIndex(nextIndex);
        buttonRefs.current[nextIndex]?.focus();
      }
    },
    [options, selectOption],
  );

  if (isLoading) {
    return (
      <div className={className}>
        {label && <div className="mb-1.5 h-3.5 w-16 rounded bg-zinc-800 animate-pulse" />}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-12 rounded-md bg-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-gray-300 mb-1.5">{label}</label>
      )}

      <div
        role={multiple ? "group" : "radiogroup"}
        aria-label={label}
        aria-invalid={!!error}
        className="flex flex-wrap gap-2"
      >
        {options.map((opt, index) => {
          const selected = isSelected(opt.value);
          const isDisabled = disabled || opt.disabled;

          return (
            <button
              key={opt.value}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={selected}
              aria-disabled={isDisabled}
              tabIndex={index === focusIndex ? 0 : -1}
              disabled={isDisabled}
              onClick={() => selectOption(opt)}
              onFocus={() => setFocusIndex(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={[
                "min-w-[2.75rem] h-9 px-3 rounded-md border text-sm font-medium",
                "transition-colors duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                isDisabled
                  ? "border-gray-800 text-gray-600 cursor-not-allowed line-through bg-transparent"
                  : selected
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white bg-transparent",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
};

export default SizeSelector;