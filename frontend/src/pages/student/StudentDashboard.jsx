import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trophy, Target, TrendingUp, Search, FlaskConical, Lock } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import ExamCard from '../../components/exam/ExamCard';
import StatsCard from '../../components/admin/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { listExams } from '../../api/exams.api';
import { getMyResults } from '../../api/results.api';
import { createSession } from '../../api/sessions.api';
import { getErrorMessage, formatPercent } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, resultsRes] = await Promise.all([listExams({ limit: 100 }), getMyResults()]);
        setExams(examsRes.data.exams);
        setResults(resultsRes.data);
      } catch {
        toast.error('Không thể tải dữ liệu.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartExam = async (examId) => {
    setStartingId(examId);
    try {
      const { data } = await createSession(examId);
      if (data.resuming) toast('Tiếp tục bài thi còn dở.', { icon: '▶️' });
      navigate(`/exam/${data.sessionId}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStartingId(null);
    }
  };

  const filteredExams = exams.filter((e) =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  );

  const completed = results.filter((r) => r.percentage !== undefined);
  const avgScore = completed.length ? completed.reduce((a, b) => a + b.percentage, 0) / completed.length : 0;
  const bestScore = completed.length ? Math.max(...completed.map((r) => r.percentage)) : 0;

  if (isLoading) return <><Navbar /><div className="flex items-center justify-center h-64"><LoadingSpinner /></div></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-xl font-bold text-gray-900">Chào mừng, {user?.fullName} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hãy luyện thi và chinh phục kỳ thi của bạn!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard label="Đề đã làm" value={results.length} icon={Target} color="blue" />
          <StatsCard label="Điểm trung bình" value={`${formatPercent(avgScore)}`} icon={TrendingUp} color="emerald" />
          <StatsCard label="Điểm cao nhất" value={`${formatPercent(bestScore)}`} icon={Trophy} color="amber" />
        </div>

        {/* Exam list */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 flex-1">Đề thi ({filteredExams.length})</h2>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm đề thi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-8 pr-3 w-52"
            />
          </div>
        </div>

        {filteredExams.length === 0 ? (
          <div className="text-center py-14 bg-white border border-gray-200" style={{ borderRadius: '4px' }}>
            <p className="text-gray-400 text-sm">Không tìm thấy đề thi phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} onStart={handleStartExam} loading={startingId === exam.id} />
            ))}
          </div>
        )}

        {/* History */}
        {results.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Lịch sử làm bài</h2>
            <div className="bg-white border border-gray-200 shadow-card overflow-hidden" style={{ borderRadius: '4px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Đề thi</th>
                    <th>Điểm</th>
                    <th>Ngày thi</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 10).map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium text-gray-900">{r.exam?.title}</td>
                      <td>
                        <span className={`font-semibold ${r.percentage >= 80 ? 'text-emerald-600' : r.percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {r.score}/10 Điểm ({formatPercent(r.percentage)})
                        </span>
                      </td>
                      <td className="text-gray-400">{new Date(r.submittedAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <button onClick={() => navigate(`/result/${r.sessionId}`)} className="text-xs text-blue-600 hover:underline font-medium">
                          Xem lại
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
