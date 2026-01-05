import { cn } from '@/lib/utils'

export default function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = ''
}) {
  return (
    <div className="mb-4">
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-neutral-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg',
          'bg-neutral-950 border border-neutral-800',
          'text-white placeholder:text-neutral-500',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500',
          'disabled:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          error ? 'border-red-500/50 focus:ring-red-500/50' : '',
          className
        )}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
