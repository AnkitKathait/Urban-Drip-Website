import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:   string
  error?:   string
  hint?:    string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'input-field',
            error && 'border-ud-accent focus:ring-ud-accent',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-ud-accent">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-ud-muted">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export { Input }
