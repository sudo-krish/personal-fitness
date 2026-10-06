import { useId, useState, type InputHTMLAttributes, type Ref } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface UnderlineFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string | null;
  ref?: Ref<HTMLInputElement>;
}

/** Minimal underline input with a floating label and sage focus line. */
export function UnderlineField({ label, error, type = 'text', className = '', ref, ...props }: UnderlineFieldProps) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword && reveal ? 'text' : type;

  return (
    <div className={`relative ${className}`}>
      <input
        ref={ref}
        id={id}
        type={effectiveType}
        placeholder=" "
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        className="peer w-full bg-transparent border-0 border-b border-ink/15 pt-6 pb-2 pr-10 text-[17px] text-ink outline-none transition-colors focus:border-sage-500 aria-invalid:border-clay"
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 top-6 text-[15px] text-ink-muted transition-all duration-200 peer-focus:top-0 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.08em] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.08em]"
      >
        {label}
      </label>
      <span
        aria-hidden
        className="absolute left-0 bottom-0 h-[1.5px] w-full origin-left scale-x-0 bg-sage-500 transition-transform duration-300 peer-focus:scale-x-100"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          aria-label={reveal ? 'Hide password' : 'Show password'}
          className="absolute right-0 top-5 p-1.5 text-ink-muted hover:text-ink cursor-pointer"
        >
          {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-[13px] text-clay">
          {error}
        </p>
      )}
    </div>
  );
}
