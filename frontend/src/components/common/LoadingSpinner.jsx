export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' };

  const spinner = (
    <div className={`${sizeMap[size]} border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 gap-3">
        {spinner}
        <p className="text-sm text-gray-400">Đang tải...</p>
      </div>
    );
  }

  return <div className="flex items-center justify-center">{spinner}</div>;
}
