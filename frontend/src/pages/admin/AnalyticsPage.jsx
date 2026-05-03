import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Trophy, Target, Clock, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Navbar from '../../components/common/Navbar';
import StatsCard from '../../components/admin/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getExam } from '../../api/exams.api';
import { getExamAnalytics, getExamResults } from '../../api/results.api';
import { getErrorMessage, formatPercent, formatDate } from '../../utils/helpers';

export default function AnalyticsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [examRes, analyticsRes, resultsRes] = await Promise.all([
          getExam(examId),
          getExamAnalytics(examId),
          getExamResults(examId, { limit: 50 }),
        ]);
        setExam(examRes.data);
        setAnalytics(analyticsRes.data);
        setResults(resultsRes.data.results);
      } catch (err) {
        toast.error(getErrorMessage(err));
        navigate('/admin');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [examId]);

  if (isLoading) return <><Navbar /><div className="flex items-center justify-center h-64"><LoadingSpinner /></div></>;

  const distChartData = analytics?.distribution?.map((d) => ({
    name: d.range,
    count: d.count,
  })) || [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Quay lại
        </button>

        <h1 className="text-xl font-bold text-white mb-1">{exam?.title}</h1>
        <p className="text-slate-400 text-sm mb-6">Phân tích kết quả thi</p>

        {analytics?.totalSubmissions === 0 ? (
          <div className="text-center py-16 glass-card">
            <p className="text-slate-500">Chưa có học sinh nào làm bài thi này.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard label="Lượt thi" value={analytics?.totalSubmissions} icon={Target} color="blue" />
              <StatsCard label="Điểm trung bình" value={formatPercent(analytics?.averageScore || 0)} icon={Trophy} color="emerald" />
              <StatsCard label="Điểm cao nhất" value={formatPercent(analytics?.maxScore || 0)} icon={TrendingDown} color="purple" />
              <StatsCard label="Điểm thấp nhất" value={formatPercent(analytics?.minScore || 0)} icon={Clock} color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Score distribution */}
              <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4">Phân phối điểm số</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={distChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {distChartData.map((_, i) => (
                        <Cell key={i} fill={i < 2 ? '#ef4444' : i < 3 ? '#f59e0b' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Hardest questions */}
              <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4">Câu hỏi khó nhất</h2>
                <div className="flex flex-col gap-3">
                  {analytics?.hardestQuestions?.map((q, i) => (
                    <div key={q.questionId} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center text-xs font-bold text-red-400 shrink-0">
                        {q.question?.questionNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 line-clamp-1">{q.question?.content}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${q.correctRate * 100}%` }} />
                          </div>
                          <span className="text-xs text-red-400 font-semibold shrink-0">
                            {formatPercent(q.correctRate * 100)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!analytics?.hardestQuestions?.length && <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>}
                </div>
              </div>
            </div>

            {/* Results table */}
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700">
                <h2 className="text-sm font-semibold text-slate-300">Kết quả học sinh ({results.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Học sinh</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Email</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Điểm</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">%</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Ngày thi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {results.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-200 font-medium">{r.student?.fullName}</td>
                        <td className="px-4 py-3 text-slate-500">{r.student?.email}</td>
                        <td className="px-4 py-3 text-slate-200">{r.score}/10</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${r.percentage >= 80 ? 'text-emerald-400' : r.percentage >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {formatPercent(r.percentage)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(r.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
