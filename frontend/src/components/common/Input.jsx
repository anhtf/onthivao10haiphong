import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={clsx('flex flex-col gap-1', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon size={15} className="text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'form-input',
            Icon ? 'pl-9' : 'pl-3',
            IconRight ? 'pr-9' : 'pr-3',
            error && '!border-red-500 focus:!ring-red-500/10 focus:!border-red-500',
            className
          )}
          {...props}
        />
        {IconRight && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <IconRight size={15} className="text-gray-400" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
