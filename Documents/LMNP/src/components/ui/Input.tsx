import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: string;
  prefix?: string;
  helpText?: string;
}

export function Input({ label, error, suffix, prefix, helpText, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-500 text-sm pointer-events-none">{prefix}</span>
        )}
        <input
          className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500
            ${prefix ? 'pl-7' : ''}
            ${suffix ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-500 text-sm pointer-events-none">{suffix}</span>
        )}
      </div>
      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
