import React, { forwardRef, useId } from 'react';

interface BaseProps {
  label?: string;
  type?: 'text' | 'number' | 'password' | 'email' | 'textarea';
  className?: string;
  error?: string;
  helperText?: string;
}

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type Props = InputProps | TextareaProps;

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  (
    {
      label,
      type = 'text',
      className = '',
      error,
      helperText,
      id: externalId,
      ...props
    },
    ref,
  ) => {
    // Auto-generate a unique ID if one isn't passed, to bind the label to the input
    const internalId = useId();
    const id = externalId || internalId;

    // Clean, scalable Tailwind classes
    const baseInputStyles =
      'w-full border bg-transparent p-3 rounded-lg text-white outline-none transition-all duration-200 placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed';

    // Dynamic styles based on whether there's an error
    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
      : 'border-gray-700 hover:border-gray-500 focus:border-[#80Deea] focus:ring-1 focus:ring-[#80Deea]/30';

    const combinedClassName = `${baseInputStyles} ${stateStyles} ${className}`;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-gray-300">
            {label}
          </label>
        )}

        {type === 'textarea' ? (
          <textarea
            id={id}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={combinedClassName}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={id}
            type={type}
            ref={ref as React.Ref<HTMLInputElement>}
            className={combinedClassName}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {/* Dynamic Error or Helper Message below the input */}
        {error ? (
          <span className="text-xs font-medium text-red-400">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-gray-500">{helperText}</span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
