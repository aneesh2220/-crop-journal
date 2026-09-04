import { forwardRef, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  endAdornment?: React.ReactNode
  /** Sizing/layout classes (flex-1, col-span-2, …) — applied to the field's wrapper, not the raw <input>. */
  className?: string
  /** Styling classes for the <input> element itself (rarely needed). */
  inputClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, endAdornment, className, inputClassName, id, ...props }, ref) => {
    const inputId = id || props.name
    return (
      <div className={clsx('flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--text)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <span className="absolute left-3.5 text-[var(--text-muted)]">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full h-12 rounded-xl border bg-[var(--surface)] px-4 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent',
              icon && 'pl-11',
              endAdornment && 'pr-11',
              error ? 'border-red-400' : 'border-[var(--border)]',
              inputClassName
            )}
            {...props}
          />
          {endAdornment && <span className="absolute right-3.5">{endAdornment}</span>}
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
