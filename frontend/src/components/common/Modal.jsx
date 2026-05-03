import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && closeOnOverlay) onClose();
  }, [onClose, closeOnOverlay]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Overlay */}
      <div
        className="absolute inset-0 modal-overlay"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      {/* Panel */}
      <div
        className={`relative w-full ${sizeClasses[size]} bg-white border border-gray-200 shadow-dropdown animate-slide-up`}
        style={{ borderRadius: '4px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            style={{ borderRadius: '3px' }}
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="p-5">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50"
            style={{ borderRadius: '0 0 4px 4px' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
