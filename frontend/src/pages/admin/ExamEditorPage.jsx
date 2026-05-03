import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, FileSpreadsheet, Globe, Archive, Pencil, Save, X, Eye, Crop } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import QuestionEditor from '../../components/admin/QuestionEditor';
import PdfCropper from '../../components/admin/PdfCropper';
import MathText from '../../components/common/MathText';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getExam, updateExam, uploadAnswerKey, publishExam, archiveExam, listQuestions, uploadQuestionImage, createQuestion } from '../../api/exams.api';
import { getErrorMessage } from '../../utils/helpers';

export default function ExamEditorPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({});
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [pdfPageNum, setPdfPageNum] = useState(1);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const pdfRef = useRef();
  const excelRef = useRef();

  const reload = async () => {
    const { data } = await listQuestions(examId);
    setQuestions(data);
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [examRes, qRes] = await Promise.all([getExam(examId), listQuestions(examId)]);
        setExam(examRes.data);
        
        let initialExpiresAt = '';
        if (examRes.data.expiresAt) {
          const dateObj = new Date(examRes.data.expiresAt);
          // Format as YYYY-MM-DDThh:mm
          const tzOffset = dateObj.getTimezoneOffset() * 60000;
          initialExpiresAt = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
        }

        setMetaForm({ 
          title: examRes.data.title, 
          description: examRes.data.description || '', 
          timeLimitMinutes: examRes.data.timeLimitMinutes,
          expiresAt: initialExpiresAt
        });
        setQuestions(qRes.data);
      } catch (err) { toast.error(getErrorMessage(err)); navigate('/admin'); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [examId]);

  const saveMeta = async () => {
    setIsSavingMeta(true);
    try {
      const payload = { 
        ...metaForm, 
        subject: 'Toán', 
        timeLimitMinutes: parseInt(metaForm.timeLimitMinutes),
        expiresAt: metaForm.expiresAt ? new Date(metaForm.expiresAt).toISOString() : null
      };
      const { data } = await updateExam(examId, payload);
      setExam(data);
      setIsEditingMeta(false);
      toast.success('Đã cập nhật.');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsSavingMeta(false); }
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    setShowCropper(true);
    e.target.value = '';
  };

  const handleCrop = async (blob) => {
    const nextQNum = questions.length + 1;
    const toastId = toast.loading(`Đang lưu câu ${nextQNum}...`);
    try {
      const form = new FormData();
      form.append('image', blob, `question-${nextQNum}.jpg`);
      
      const res = await uploadQuestionImage(form);
      const imageUrl = res.data.imageUrl;
      
      await createQuestion({ examId, questionNumber: nextQNum, imageUrl });
      toast.success(`Đã lưu câu ${nextQNum}!`, { id: toastId });
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err), { id: toastId });
    }
  };

  // Removed handleExcel because user no longer wants Excel upload

  const doPublish = async () => {
    if (!confirm('Công bố đề thi để học sinh làm bài?')) return;
    setIsPublishing(true);
    try {
      const { data } = await publishExam(examId);
      setExam(data.exam);
      toast.success('Đã công bố!');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsPublishing(false); }
  };

  const doArchive = async () => {
    if (!confirm('Lưu trữ đề thi?')) return;
    try {
      const { data } = await archiveExam(examId);
      setExam(data.exam);
      toast.success('Đã lưu trữ.');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (isLoading) return <><Navbar /><div className="flex items-center justify-center h-64"><LoadingSpinner /></div></>;

  const statusMap = {
    DRAFT:     { label: 'Nháp',        cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    PUBLISHED: { label: 'Đã công bố',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ARCHIVED:  { label: 'Lưu trữ',     cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  };
  const st = statusMap[exam?.status] || statusMap.DRAFT;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm mb-5 transition-colors">
          <ArrowLeft size={14} /> Quay lại
        </button>

        {/* Exam meta */}
        <div className="bg-white border border-gray-200 shadow-card p-5 mb-5" style={{ borderRadius: '4px' }}>
          {isEditingMeta ? (
            <div className="flex flex-col gap-3">
              <Input label="Tiêu đề" value={metaForm.title} onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Thời gian (phút)" type="number" value={metaForm.timeLimitMinutes} onChange={(e) => setMetaForm({ ...metaForm, timeLimitMinutes: e.target.value })} />
                <Input label="Hạn chót" type="datetime-local" value={metaForm.expiresAt} onChange={(e) => setMetaForm({ ...metaForm, expiresAt: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Mô tả</label>
                <textarea className="form-input resize-none" rows={2} value={metaForm.description} onChange={(e) => setMetaForm({ ...metaForm, description: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" icon={Save} loading={isSavingMeta} onClick={saveMeta}>Lưu</Button>
                <Button variant="ghost" size="sm" icon={X} onClick={() => setIsEditingMeta(false)}>Hủy</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-blue-50 text-blue-700 border-blue-200">Toán</span>
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                </div>
                <h1 className="text-lg font-bold text-gray-900 mb-1">{exam?.title}</h1>
                {exam?.description && <p className="text-sm text-gray-500">{exam.description}</p>}
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>⏱ {exam?.timeLimitMinutes} phút</span>
                  <span>📝 {questions.length} câu hỏi</span>
                  {exam?.expiresAt && <span className="text-red-500">⏰ Hạn: {new Date(exam.expiresAt).toLocaleString('vi-VN')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setIsEditingMeta(true)}>Sửa</Button>
                {exam?.status === 'DRAFT' && <Button variant="primary" size="sm" icon={Globe} loading={isPublishing} onClick={doPublish}>Công bố</Button>}
                {exam?.status === 'PUBLISHED' && <Button variant="secondary" size="sm" icon={Archive} onClick={doArchive}>Lưu trữ</Button>}
                <Button variant="secondary" size="sm" icon={Eye} onClick={() => setShowPreview(true)}>Xem trước</Button>
              </div>
            </div>
          )}
        </div>

        {/* Upload tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-white border border-gray-200 shadow-card p-4" style={{ borderRadius: '4px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-50 border border-blue-200 flex items-center justify-center" style={{ borderRadius: '3px' }}>
                <Crop size={15} className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Cắt ảnh từ PDF</div>
                <div className="text-xs text-gray-400">Giữ nguyên công thức Toán 100%</div>
              </div>
            </div>
            <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfSelect} />
            <Button variant="secondary" size="sm" fullWidth icon={Upload} onClick={() => pdfRef.current?.click()}>
              Chọn file PDF đề thi
            </Button>
          </div>

        </div>

        {/* Math hint */}
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-xs text-blue-800" style={{ borderRadius: '3px' }}>
          💡 <b>Hỗ trợ công thức Toán:</b> Dùng <code className="bg-blue-100 px-1">$công thức$</code> cho inline (VD: <code>$x^2 + y^2 = r^2$</code>) và <code className="bg-blue-100 px-1">$$công thức$$</code> cho block math.
        </div>

        {/* Question editor */}
        <QuestionEditor examId={examId} questions={questions} onQuestionsChange={reload} />
      </main>

      {/* Cropper */}
      {showCropper && pdfFile && (
        <PdfCropper 
          file={pdfFile} 
          pageNum={pdfPageNum}
          onPageChange={setPdfPageNum}
          onCancel={() => setShowCropper(false)}
          onCrop={handleCrop}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto flex flex-col">
          <div className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div>
              <h2 className="font-bold text-lg text-gray-900">Xem trước: {exam?.title}</h2>
              <p className="text-sm text-gray-500">Giao diện này giống hệt những gì học sinh sẽ thấy</p>
            </div>
            <Button variant="secondary" icon={X} onClick={() => setShowPreview(false)}>Đóng xem trước</Button>
          </div>
          <div className="flex-1 bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {questions.map((q, idx) => {
                // Inline a minimal QuestionView representation for preview
                // Real implementation should ideally reuse QuestionView, but since QuestionView expects onSelect etc, we just render a simplified one or import it.
                // We'll import QuestionView dynamically or just use it here if we add it to imports.
                return (
                  <div key={q.id} className="bg-white border border-gray-200 p-5 shadow-sm" style={{ borderRadius: '4px' }}>
                     <h3 className="font-bold text-gray-800 mb-3">Câu {q.questionNumber}:</h3>
                     {q.imageUrl ? (
                       <img src={q.imageUrl} alt="Câu hỏi" className="max-w-full" />
                     ) : (
                       <MathText text={q.content} block />
                     )}
                     <div className="mt-4 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        Đây là bản xem trước. Nút chọn đáp án sẽ hiển thị khi thi thật.
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
