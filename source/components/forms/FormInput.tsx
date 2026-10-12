import { forwardRef, useId } from "react";

import { cn } from "@/lib/utils";

const FIELD_CLASSES = "field mt-1";

type FieldShellProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

function FieldShell({ id, label, error, required, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-xs text-rose-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput({ label, error, id, required, className, ...props }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <FieldShell id={inputId} label={label} error={error} required={required}>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            FIELD_CLASSES,
            error && "border-rose-500 focus:ring-rose-200",
            className,
          )}
          {...props}
        />
      </FieldShell>
    );
  },
);

type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    { label, error, id, required, className, ...props },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <FieldShell id={inputId} label={label} error={error} required={required}>
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            FIELD_CLASSES,
            "min-h-[140px] resize-y",
            error && "border-rose-500 focus:ring-rose-200",
            className,
          )}
          {...props}
        />
      </FieldShell>
    );
  },
);

type FormCheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: React.ReactNode;
  error?: string;
};

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  function FormCheckbox({ label, error, id, className, ...props }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={className}>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-navy-900"
            {...props}
          />
          <label htmlFor={inputId} className="text-sm text-slate-600">
            {label}
          </label>
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-1 text-xs text-rose-600"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);
