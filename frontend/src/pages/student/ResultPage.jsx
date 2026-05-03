import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import QuestionView from '../../components/exam/QuestionView';
import QuestionNav from '../../components/exam/QuestionNav';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getSessionResult } from '../../api/results.api';
import { getErrorMessage, getScoreGrade, formatTime, formatPercent } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';

export default function ResultPage() {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getSessionResult(sessionId);
        setSession(data);
      } catch (err) {
        toast.error(getErrorMessage(err));
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [sessionId]);

  if (isLoading) return <><Navbar /><div className="flex items-center justify-center h-64"><LoadingSpinner /></div></>;

  const result = session?.result;
  const answers = session?.studentAnswers || [];
  const questions = answers.map((a) => a.question);
  const { score, totalQuestions, percentage } = result || {};
  const { label: gradeLabel, color: gradeColor } = getScoreGrade(percentage || 0);
  const currentQ = questions[reviewIndex];
  const currentAnswer = answers[reviewIndex];
  
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const incorrectCount = totalQuestions - correctCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Result summary card */}
        <div className="bg-white border border-gray-200 shadow-card p-6 mb-6 animate-bounce-in" style={{ borderRadius: '4px' }}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score circle */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
                <circle cx="56" cy="56" r="48" fill="none" stroke="#F3F4F6" strokeWidth="7" />
                <circle
                  cx="56" cy="56" r="48" fill="none"
                  stroke={percentage >= 80 ? '#059669' : percentage >= 50 ? '#D97706' : '#DC2626'}
                  strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - (percentage || 0) / 100)}`}
                  strokeLinecap="square"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{score}/10</span>
                <span className="text-xs text-gray-400">Điểm số</span>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 text-center sm:text-left">
              <div className="text-2xl font-bold text-gray-900 mb-0.5">
                {gradeLabel} <span className={gradeColor}>·</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{session?.exam?.title}</p>
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-600" />
                  <span><b className="text-emerald-600">{correctCount}</b> đúng</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle size={14} className="text-red-500" />
                  <span><b className="text-red-500">{incorrectCount}</b> sai</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-500" />
                  <span>{formatTime(result?.timeTakenSeconds || 0)}</span>
                </div>
              </div>
            </div>

            <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate('/dashboard')}>
              Về trang chủ
            </Button>
          </div>
        </div>

        {/* Question review */}
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Xem lại bài làm</h2>
            {currentQ && (
              <QuestionView
                key={currentQ.id}
                question={currentQ}
                questionIndex={reviewIndex}
                totalQuestions={questions.length}
                selectedAnswer={currentAnswer?.selectedAnswer}
                correctAnswer={currentQ.correctAnswer}
                reviewMode
                isPro={user?.isPro}
              />
            )}
            <div className="flex items-center justify-between mt-5">
              <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))} disabled={reviewIndex === 0}>Trước</Button>
              <span className="text-xs text-gray-400">{reviewIndex + 1} / {questions.length}</span>
              <Button variant="secondary" size="sm" iconRight={ChevronRight} onClick={() => setReviewIndex(Math.min(questions.length - 1, reviewIndex + 1))} disabled={reviewIndex === questions.length - 1}>Tiếp</Button>
            </div>
          </div>

          <div className="w-56 shrink-0 hidden lg:block">
            <div className="sticky top-20">
              <QuestionNav questions={questions} currentIndex={reviewIndex} studentAnswers={answers} onSelect={setReviewIndex} reviewMode />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
