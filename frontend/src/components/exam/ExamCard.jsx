import { Link } from 'react-router-dom';
import { Clock, BookOpen, ChevronRight, Trash2 } from 'lucide-react';
import Button from '../common/Button';

export default function ExamCard({ exam, onStart, onDelete, isAdmin, loading }) {
  const statusMap = {
    PUBLISHED: { label: 'Đã công bố', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    DRAFT:     { label: 'Nháp',       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    ARCHIVED:  { label: 'Lưu trữ',    cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  };
  const status = statusMap[exam.status] || statusMap.DRAFT;

  const isExpired = exam.expiresAt && new Date() > new Date(exam.expiresAt);

  return (
    <div
      className="bg-white border border-gray-200 p-5 flex flex-col gap-4 shadow-card hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
      style={{ borderRadius: '4px' }}
    >
      {/* Status + subject */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="badge bg-blue-50 text-blue-700 border-blue-200">Toán</span>
        {isAdmin && (
          <span className={`badge ${status.cls}`}>{status.label}</span>
        )}
        {isExpired && !isAdmin && (
          <span className="badge bg-red-50 text-red-700 border-red-200">Hết hạn</span>
        )}
      </div>

      {/* Title */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
          {exam.title}
        </h3>
        {exam.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{exam.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1">
          <BookOpen size={12} />
          <span>{exam.totalQuestions} câu</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{exam.timeLimitMinutes} phút</span>
        </div>
        {exam.creator && (
          <span className="ml-auto truncate">{exam.creator.fullName}</span>
        )}
      </div>

      {/* Actions */}
      {isAdmin ? (
        <div className="flex gap-2">
          <Link to={`/admin/exams/${exam.id}/edit`} className="flex-1">
            <Button variant="secondary" size="sm" fullWidth>Chỉnh sửa</Button>
          </Link>
          <Link to={`/admin/exams/${exam.id}/analytics`}>
            <Button variant="ghost" size="sm" icon={ChevronRight}></Button>
          </Link>
          {onDelete && (
            <button onClick={() => onDelete(exam.id)} className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-colors border border-transparent hover:border-red-200">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ) : (
        <Button
          variant={isExpired ? "secondary" : "primary"}
          size="sm"
          fullWidth
          loading={loading}
          iconRight={!isExpired ? ChevronRight : undefined}
          onClick={() => !isExpired && onStart(exam.id)}
          disabled={exam.status !== 'PUBLISHED' || isExpired}
        >
          {exam.status !== 'PUBLISHED' ? 'Chưa mở' : isExpired ? 'Đã hết hạn' : 'Bắt đầu làm bài'}
        </Button>
      )}
    </div>
  );
}
