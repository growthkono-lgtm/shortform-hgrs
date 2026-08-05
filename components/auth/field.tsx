import { cn } from "@/lib/cn";

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  autoComplete,
  hint,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-bold">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(
          "mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm",
          "placeholder:text-muted/70",
          "focus:border-ink focus:outline-none",
        )}
      />
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function SubmitError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-accent/40 bg-accent/[0.07] px-4 py-3 text-sm text-accent-deep"
    >
      {message}
    </p>
  );
}
