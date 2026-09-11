import { forwardRef, type ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  // Primary is the Organic system's single warm accent, and it carries the
  // theme's own contrast colour so it stays readable on both grounds.
  primary:
    'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm hover:brightness-95 active:brightness-90',
  secondary:
    'bg-sage-300 text-sage-900 hover:bg-sage-400 active:bg-sage-500 shadow-sm disabled:hover:bg-sage-300',
  outline:
    'border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--surface-muted)]',
  ghost: 'bg-transparent text-[var(--text)] hover:bg-[var(--surface-muted)]',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm h-9 px-4 gap-1.5 rounded-full',
  md: 'text-sm h-11 px-5 gap-2 rounded-full',
  lg: 'text-base h-13 px-7 gap-2 rounded-full',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? <Spinner size={16} className={variant === 'primary' || variant === 'secondary' ? 'text-current' : undefined} /> : icon}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
