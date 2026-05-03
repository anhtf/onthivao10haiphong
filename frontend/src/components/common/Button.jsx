import { clsx } from 'clsx';

const variants = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 disabled:text-gray-400',
  danger:    'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400',
  success:   'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-400',
  ghost:     'bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900',
  outline:   'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm font-semibold',
  xl: 'px-6 py-3 text-base font-semibold',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      style={{ borderRadius: '3px' }}
      className={clsx(
        'btn',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon size={size === 'sm' ? 13 : size === 'lg' || size === 'xl' ? 17 : 15} />
      ) : null}
      {children}
      {!loading && IconRight && <IconRight size={size === 'sm' ? 13 : 15} />}
    </button>
  );
}
