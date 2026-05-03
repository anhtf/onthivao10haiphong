import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Users, BookOpen, TrendingUp, Trophy, Search } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import ExamCard from '../../components/exam/ExamCard';
import StatsCard from '../../components/admin/StatsCard';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { listExams, createExam, deleteExam } from '../../api/exams.api';
import { getOverviewAnalytics } from '../../api/results.api';
import { useForm } from 'react-hook-form';
import { getErrorMessage, formatPercent } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { subject: 'Toán', timeLimitMinutes: 45 } });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, analyticsRes] = await Promise.all([
          listExams({ limit: 100 }),
          getOverviewAnalytics().catch(() => ({ data: null })),
        ]);
        setExams(examsRes.data.exams);
        setAnalytics(analyticsRes.data);
      } catch { toast.error('Không thể tải dữ liệu.'); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const handleCreate = async (data) => {
    setIsCreating(true);
    try {
      const { data: exam } = await createExam({ title: data.title, subject: 'Toán', description: data.description, timeLimitMinutes: parseInt(data.timeLimitMinutes) });
      setShowCreateModal(false);
      reset();
      toast.success('Đã tạo đề thi!');
      navigate(`/admin/exams/${exam.id}/edit`);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đề thi này không? Mọi kết quả bài làm của học sinh cũng sẽ bị xóa.')) return;
    try {
      await deleteExam(id);
      setExams(exams.filter(e => e.id !== id));
      toast.success('Đã xóa đề thi thành công.');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const filteredExams = exams.filter((e) => {
    const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (isLoading) return <><Navbar /><div className="flex items-center justify-center h-64"><LoadingSpinner /></div></>;

  const filters = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'DRAFT', label: 'Nháp' },
    { key: 'PUBLISHED', label: 'Đã công bố' },
    { key: 'ARCHIVED', label: 'Lưu trữ' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quản trị viên</h1>
            <p className="text-sm text-gray-400 mt-0.5">Xin chào, {user?.fullName}</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>Tạo đề thi</Button>
        </div>

        {/* Stats */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard label="Học sinh" value={analytics.totalStudents} icon={Users} color="blue" />
            <StatsCard label="Đề đã công bố" value={analytics.totalExams} icon={BookOpen} color="emerald" />
            <StatsCard label="Lượt làm bài" value={analytics.totalSubmissions} icon={TrendingUp} color="purple" />
            <StatsCard label="Điểm TB nền tảng" value={formatPercent(analytics.avgPlatformScore || 0)} icon={Trophy} color="amber" />
          </div>
        )}

        {/* Recent activity */}
        {analytics?.recentResults?.length > 0 && (
          <div className="bg-white border border-gray-200 shadow-card mb-8" style={{ borderRadius: '4px' }}>
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Hoạt động gần đây</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Học sinh</th><th>Đề thi</th><th>Điểm</th></tr>
              </thead>
              <tbody>
                {analytics.recentResults.slice(0, 5).map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.student?.fullName}</td>
                    <td className="text-gray-500">{r.exam?.title}</td>
                    <td className={`font-semibold ${r.percentage >= 80 ? 'text-emerald-600' : r.percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {formatPercent(r.percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Exam list */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h2 className="text-sm font-semibold text-gray-900 flex-1">
            Quản lý đề thi ({filteredExams.length})
          </h2>
          <div className="flex gap-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1 text-xs font-medium border transition-colors ${
                  statusFilter === f.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
                style={{ borderRadius: '3px' }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Tìm đề thi..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-8 pr-3 w-48" />
          </div>
        </div>

        {filteredExams.length === 0 ? (
          <div className="text-center py-14 bg-white border border-gray-200 shadow-card" style={{ borderRadius: '4px' }}>
            <p className="text-sm text-gray-400 mb-4">Chưa có đề thi nào. Tạo đề thi đầu tiên ngay!</p>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowCreateModal(true)}>Tạo đề thi</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredExams.map((exam) => <ExamCard key={exam.id} exam={exam} isAdmin onDelete={handleDelete} />)}
          </div>
        )}
      </main>

      {/* Create modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); reset(); }} title="Tạo đề thi Toán mới" size="sm"
        footer={<><Button variant="secondary" onClick={() => { setShowCreateModal(false); reset(); }}>Hủy</Button><Button variant="primary" loading={isCreating} onClick={handleSubmit(handleCreate)}>Tạo & chỉnh sửa</Button></>}>
        <form className="flex flex-col gap-4">
          <Input label="Tiêu đề" placeholder="VD: Đề thi Toán vào lớp 10 năm 2024" error={errors.title?.message} required
            {...register('title', { required: 'Tiêu đề là bắt buộc.' })} />
          <Input label="Thời gian (phút)" type="number" min="5" max="180" error={errors.timeLimitMinutes?.message} required
            {...register('timeLimitMinutes', { required: true, min: { value: 5, message: 'Tối thiểu 5 phút.' }, max: { value: 180, message: 'Tối đa 180 phút.' } })} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Mô tả</label>
            <textarea className="form-input resize-none" rows={3} placeholder="Mô tả ngắn về đề thi..." {...register('description')} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
