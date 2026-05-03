import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react';
import Timer from '../../components/exam/Timer';
import QuestionView from '../../components/exam/QuestionView';
import QuestionNav from '../../components/exam/QuestionNav';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getSession, submitSession, reportTabSwitch } from '../../api/sessions.api';
import useExamStore from '../../stores/examStore';
import { getErrorMessage } from '../../utils/helpers';

export default function ExamPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { answers, setAnswer, currentQuestionIndex, setCurrentQuestion, resetExam } = useExamStore();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const leaveCountRef = useRef(0);
  const leaveTimerRef = useRef(null);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    resetExam();
    const fetchSession = async () => {
      try {
        const { data } = await getSession(sessionId);
        if (data.session.status !== 'IN_PROGRESS') {
          navigate(`/result/${sessionId}`, { replace: true });
          return;
        }
        setSession(data.session);
        setQuestions(data.questions);
        if (data.answers) {
          Object.entries(data.answers).forEach(([qId, ans]) => { if (ans) setAnswer(qId, ans); });
        }
        const elapsed = (Date.now() - new Date(data.session.startedAt).getTime()) / 1000;
        setTimeLeft(Math.max(0, data.session.timeLimitMinutes * 60 - Math.floor(elapsed)));
        setIsLoading(false);
      } catch (err) {
        toast.error(getErrorMessage(err));
        navigate('/dashboard');
      }
    };
    fetchSession();
  }, [sessionId]);

  // Anti-cheat
  useEffect(() => {
    const onVisibility = () => {
      if (autoSubmittedRef.current || session?.status !== 'IN_PROGRESS') return;

      if (document.hidden) {
        leaveCountRef.current += 1;
        
        if (leaveCountRef.current > 2) {
          toast.error('Bạn đã rời khỏi màn hình quá 2 lần! Bài thi tự động được nộp.', { duration: 5000 });
          autoSubmittedRef.current = true;
          handleSubmit(true);
          return;
        }

        reportTabSwitch(sessionId).catch(() => {});
        
        // Start 30s timer
        leaveTimerRef.current = setTimeout(() => {
          if (!autoSubmittedRef.current) {
            toast.error('Bạn đã rời khỏi màn hình quá 30 giây! Bài thi tự động được nộp.', { duration: 5000 });
            autoSubmittedRef.current = true;
            handleSubmit(true);
          }
        }, 30000);

      } else {
        // Visible again
        if (leaveTimerRef.current) {
          clearTimeout(leaveTimerRef.current);
          leaveTimerRef.current = null;
        }
        
        if (!autoSubmittedRef.current && leaveCountRef.current <= 2) {
          setShowTabWarning(true);
        }
      }
    };
    const preventKeys = (e) => { if (e.ctrlKey && ['c','a','p'].includes(e.key)) e.preventDefault(); };
    const preventMenu = (e) => e.preventDefault();
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', preventKeys);
    document.addEventListener('contextmenu', preventMenu);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('keydown', preventKeys);
      document.removeEventListener('contextmenu', preventMenu);
    };
  }, [sessionId, session]);

  const handleSubmit = useCallback(async (isAuto = false) => {
    setIsSubmitting(true);
    setShowSubmitModal(false);
    try {
      await submitSession(sessionId, answers);
      toast.success(isAuto ? 'Hết giờ! Bài thi đã được nộp tự động.' : 'Nộp bài thành công!');
      navigate(`/result/${sessionId}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsSubmitting(false);
    }
  }, [sessionId, answers, navigate]);

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const unansweredCount = questions.length - answeredCount;
  const currentQ = questions[currentQuestionIndex];

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 no-select">
      {/* Exam header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 text-sm truncate">{session?.exam?.title}</h1>
            <p className="text-xs text-gray-400">{answeredCount}/{questions.length} câu đã trả lời</p>
          </div>
          <div className="flex items-center gap-2">
            {timeLeft > 0 && <Timer totalSeconds={timeLeft} onExpire={() => handleSubmit(true)} />}
            <Button variant="primary" size="sm" icon={Send} onClick={() => setShowSubmitModal(true)} disabled={isSubmitting}>
              Nộp bài
            </Button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Main */}
        <div className="flex-1 min-w-0">
          {currentQ && (
            <QuestionView
              key={currentQ.id}
              question={currentQ}
              questionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              selectedAnswer={answers[currentQ.id]}
              onSelect={(ans) => setAnswer(currentQ.id, ans)}
            />
          )}
          <div className="flex items-center justify-between mt-6">
            <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => setCurrentQuestion(Math.max(0, currentQuestionIndex - 1))} disabled={currentQuestionIndex === 0}>
              Trước
            </Button>
            <span className="text-xs text-gray-400">{currentQuestionIndex + 1} / {questions.length}</span>
            <Button variant="secondary" size="sm" iconRight={ChevronRight} onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))} disabled={currentQuestionIndex === questions.length - 1}>
              Tiếp
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-20">
            <QuestionNav questions={questions} currentIndex={currentQuestionIndex} answers={answers} onSelect={setCurrentQuestion} />
          </div>
        </div>
      </div>

      {/* Submit modal */}
      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Xác nhận nộp bài"
        footer={<><Button variant="secondary" onClick={() => setShowSubmitModal(false)}>Tiếp tục làm</Button><Button variant="primary" icon={Send} loading={isSubmitting} onClick={() => handleSubmit(false)}>Nộp bài</Button></>}>
        <div className="text-center py-3">
          {unansweredCount > 0 ? (
            <>
              <div className="w-12 h-12 bg-amber-100 flex items-center justify-center mx-auto mb-3" style={{ borderRadius: '50%' }}>
                <AlertTriangle size={22} className="text-amber-600" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">Còn {unansweredCount} câu chưa trả lời</p>
              <p className="text-sm text-gray-500">Câu chưa trả lời sẽ bị tính sai.</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-emerald-100 flex items-center justify-center mx-auto mb-3" style={{ borderRadius: '50%' }}>
                <Send size={20} className="text-emerald-600" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">Đã hoàn thành tất cả {questions.length} câu!</p>
              <p className="text-sm text-gray-500">Xác nhận nộp bài để xem kết quả.</p>
            </>
          )}
        </div>
      </Modal>

      {/* Tab switch warning */}
      <Modal isOpen={showTabWarning} onClose={() => setShowTabWarning(false)} title="⚠️ Cảnh báo vi phạm" closeOnOverlay={false}>
        <div className="text-center py-2">
          <p className="font-medium text-red-600 mb-2">Bạn vừa rời khỏi màn hình làm bài!</p>
          <p className="text-sm text-gray-700 mb-2">Hành động này đã được ghi nhận vào hệ thống.</p>
          <div className="bg-red-50 p-3 mb-4 rounded border border-red-200">
            <p className="text-sm font-semibold text-red-800">Cảnh báo: Bạn đã vi phạm {leaveCountRef.current}/2 lần.</p>
            <p className="text-xs text-red-600 mt-1">Nếu rời khỏi màn hình quá 2 lần hoặc quá 30 giây/lần, bài làm sẽ tự động bị nộp!</p>
          </div>
          <Button variant="primary" fullWidth onClick={() => setShowTabWarning(false)}>Tôi đã hiểu và tiếp tục làm bài</Button>
        </div>
      </Modal>
    </div>
  );
}
