import { useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp, Plus, Save, X, CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import MathText from '../common/MathText';
import { updateQuestion, deleteQuestion } from '../../api/exams.api';
import { getQuestionType, QUESTION_TYPES } from '../../utils/examFormat';
import toast from 'react-hot-toast';

const LABELS = ['A', 'B', 'C', 'D'];
const KEYS   = ['optionA', 'optionB', 'optionC', 'optionD'];

function AnswerEditor({ question, onSave }) {
  const [ans, setAns] = useState(question.correctAnswer || '');
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    await onSave(question.id, ans);
    setSaving(false);
  };
  
  const type = getQuestionType(question.questionNumber);
  
  const needsSave = ans !== (question.correctAnswer || '');

  return (
    <div className="flex items-center gap-2">
      {type === QUESTION_TYPES.MCQ && (
        <div className="flex gap-1">
          {['A','B','C','D'].map(l => (
            <button 
              key={l} 
              onClick={() => { setAns(l); }} 
              className={`w-8 h-8 text-sm font-bold border rounded ${ans === l ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 hover:border-emerald-400'}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      {type === QUESTION_TYPES.TRUE_FALSE && (
        <div className="w-40">
          <Input value={ans} onChange={e => setAns(e.target.value)} placeholder="VD: T,F,T,F" className="!py-1 text-sm" />
        </div>
      )}
      {type === QUESTION_TYPES.SHORT_ANSWER && (
        <div className="w-40">
          <Input value={ans} onChange={e => setAns(e.target.value)} placeholder="Nhập đáp án" className="!py-1 text-sm" />
        </div>
      )}
      
      {needsSave ? (
        <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>Lưu đáp án</Button>
      ) : (
        <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded">
          <CheckCircle size={12} /> Đã lưu
        </span>
      )}
    </div>
  );
}

function QuestionForm({ examId, question, onSave, onCancel, isNew }) {
  const [form, setForm] = useState(question || {
    questionNumber: '', content: '',
    optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: '', explanation: '',
  });
  const [saving, setSaving] = useState(false);
  const [previewMath, setPreviewMath] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.content || !form.optionA || !form.optionB || !form.optionC || !form.optionD) {
      return toast.error('Vui lòng điền đủ nội dung câu hỏi và 4 đáp án.');
    }
    setSaving(true);
    try {
      let saved;
      if (isNew) {
        const { data } = await createQuestion({ ...form, examId, questionNumber: parseInt(form.questionNumber) });
        saved = data;
        toast.success('Đã thêm câu hỏi.');
      } else {
        const { data } = await updateQuestion(question.id, form);
        saved = data;
        toast.success('Đã lưu.');
      }
      onSave(saved);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 flex flex-col gap-3" style={{ borderRadius: '3px' }}>
      {isNew && (
        <Input label="Số câu" type="number" value={form.questionNumber} onChange={(e) => set('questionNumber', e.target.value)} placeholder="1" required />
      )}

      {form.imageUrl ? (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Ảnh câu hỏi</label>
          <img src={form.imageUrl} alt={`Câu ${form.questionNumber}`} className="max-w-full border border-gray-300" />
          <button type="button" onClick={() => set('imageUrl', null)} className="text-xs text-red-500 mt-2 hover:underline">
            Xóa ảnh (Chuyển về nhập chữ)
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Nội dung câu hỏi <span className="text-red-500">*</span></label>
            <button type="button" onClick={() => setPreviewMath(!previewMath)} className="text-xs text-blue-600 hover:underline">
              {previewMath ? 'Ẩn preview' : 'Xem công thức'}
            </button>
          </div>
          <textarea
            className="form-input resize-none"
            rows={3}
            value={form.content || ''}
            onChange={(e) => set('content', e.target.value)}
            placeholder="Nhập nội dung... Công thức: $x^2$, $$\frac{a}{b}$$"
          />
          {previewMath && form.content && (
            <div className="mt-1.5 p-3 bg-white border border-gray-200 text-sm text-gray-800" style={{ borderRadius: '3px' }}>
              <MathText text={form.content} block />
            </div>
          )}
        </div>
      )}

      {!form.imageUrl && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LABELS.map((l, i) => (
            <div key={l}>
              <label className="text-sm font-medium text-gray-700 block mb-1">Đáp án {l} <span className="text-red-500">*</span></label>
              <input
                className="form-input"
                value={form[KEYS[i]] || ''}
                onChange={(e) => set(KEYS[i], e.target.value)}
                placeholder={`Nhập đáp án ${l}... (hỗ trợ $công thức$)`}
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Đáp án đúng <span className="text-red-500">*</span></label>
        <div className="flex gap-2">
          {LABELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => set('correctAnswer', l)}
              className={`w-9 h-9 text-sm font-bold border-2 transition-all ${
                form.correctAnswer === l
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-emerald-400'
              }`}
              style={{ borderRadius: '3px' }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Giải thích (tùy chọn)</label>
        <textarea
          className="form-input resize-none"
          rows={2}
          value={form.explanation || ''}
          onChange={(e) => set('explanation', e.target.value)}
          placeholder="Giải thích đáp án đúng... (hỗ trợ $công thức$)"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="primary" size="sm" loading={saving} onClick={handleSave} icon={Save}>Lưu</Button>
        <Button variant="ghost" size="sm" onClick={onCancel} icon={X}>Hủy</Button>
      </div>
    </div>
  );
}

export default function QuestionEditor({ examId, questions: init, onQuestionsChange }) {
  const [questions, setQuestions] = useState(init || []);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const handleSaveAnswer = async (id, newAns) => {
    try {
      const { data } = await updateQuestion(id, { correctAnswer: newAns });
      setQuestions((prev) => prev.map((q) => q.id === id ? data : q));
      toast.success('Đã lưu đáp án.');
      onQuestionsChange?.();
    } catch { toast.error('Lưu thất bại.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    setDeletingId(id);
    try {
      await deleteQuestion(id);
      setQuestions((p) => p.filter((q) => q.id !== id));
      toast.success('Đã xóa.');
      onQuestionsChange?.();
    } catch { toast.error('Xóa thất bại.'); }
    finally { setDeletingId(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900">Danh sách câu hỏi ({questions.length})</h3>
        <p className="text-xs text-gray-500">Cắt ảnh từ PDF để thêm câu hỏi mới</p>
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((q) => (
          <div key={q.id} className="bg-white border border-gray-200 shadow-sm" style={{ borderRadius: '6px' }}>
            <div className="flex items-start gap-4 p-4">
              <span className="w-8 h-8 bg-blue-100 border border-blue-200 text-sm font-bold text-blue-700 flex items-center justify-center shrink-0" style={{ borderRadius: '4px' }}>
                {q.questionNumber}
              </span>
              <div className="flex-1 min-w-0">
                {q.imageUrl ? (
                  <img src={q.imageUrl} alt={`Câu ${q.questionNumber}`} className="max-w-full rounded-md border border-gray-200" />
                ) : (
                  <div className="text-base text-gray-900">
                    <MathText text={q.content} block />
                  </div>
                )}
                
                {/* Answer Display */}
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-700 w-16">Đáp án:</span>
                    <AnswerEditor question={q} onSave={handleSaveAnswer} />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <Button variant="secondary" size="sm" icon={Trash2} disabled={deletingId === q.id} onClick={() => handleDelete(q.id)} className="!text-red-600 hover:!bg-red-50 !border-red-200">
                    Xóa câu hỏi này
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300" style={{ borderRadius: '6px' }}>
          <p className="text-sm text-gray-400">Chưa có câu hỏi. Tải PDF lên hoặc thêm thủ công.</p>
          <p className="text-xs text-gray-400 mt-1">Hỗ trợ công thức Toán: <code className="bg-gray-200 px-1 py-0.5">$x^2 + y^2$</code></p>
        </div>
      )}
    </div>
  );
}
