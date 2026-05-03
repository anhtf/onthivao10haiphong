/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format a percentage to a clean string
 */
export function formatPercent(value, decimals = 1) {
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Get score grade label
 */
export function getScoreGrade(percentage) {
  if (percentage >= 90) return { label: 'Xuất sắc', color: 'text-emerald-400' };
  if (percentage >= 80) return { label: 'Giỏi', color: 'text-green-400' };
  if (percentage >= 65) return { label: 'Khá', color: 'text-blue-400' };
  if (percentage >= 50) return { label: 'Trung bình', color: 'text-amber-400' };
  return { label: 'Cần cố gắng', color: 'text-red-400' };
}

/**
 * Format date to Vietnamese locale
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Get error message from axios error
 */
export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

/**
 * Subject badge colors
 */
export const SUBJECT_COLORS = {
  'Toán': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Văn': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Tiếng Anh': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Lý': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Hóa': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Sinh': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Sử': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Địa': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'Tổng hợp': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export function getSubjectColor(subject) {
  return SUBJECT_COLORS[subject] || SUBJECT_COLORS['Tổng hợp'];
}
