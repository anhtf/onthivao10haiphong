import { clsx } from 'clsx';
import { CheckCircle, XCircle } from 'lucide-react';
import MathText from '../common/MathText';
import { QUESTION_TYPES, getQuestionType } from '../../utils/examFormat';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const TF_LABELS = ['a', 'b', 'c', 'd'];

export default function QuestionView({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer, // For MCQ: 'A', for TF: 'T,F,T,F', for SHORT_ANSWER: 'text'
  onSelect,
  reviewMode = false,
  correctAnswer,
}) {
  const qType = getQuestionType(question.questionNumber);
  const getState = (letter) => {
    if (!reviewMode) return selectedAnswer === letter ? 'selected' : 'default';
    if (letter === correctAnswer) return 'correct';
    if (letter === selectedAnswer && selectedAnswer !== correctAnswer) return 'incorrect';
    return 'default';
  };

  return (
    <div className="animate-fade-in">
      {/* Question number bar */}
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold" style={{ borderRadius: '2px' }}>
          Câu {questionIndex + 1}
        </span>
        <span className="text-xs text-gray-400">/ {totalQuestions}</span>
      </div>

      {/* Question content */}
      <div
        className="bg-white border border-gray-200 px-5 py-4 mb-4 shadow-card"
        style={{ borderRadius: '4px' }}
      >
        {question.imageUrl ? (
          <img src={question.imageUrl} alt={`Câu ${questionIndex + 1}`} className="max-w-full" />
        ) : (
          <MathText
            text={question.content}
            className="text-gray-900 leading-relaxed text-base"
            block
          />
        )}
      </div>

      {/* Options depending on type */}
      {qType === QUESTION_TYPES.MCQ && (
        <div className="flex gap-4 justify-center mt-6">
          {OPTION_LABELS.map((letter) => {
            const state = getState(letter);
            const optionClass = clsx(
              'w-14 h-14 flex flex-col items-center justify-center font-bold text-lg border-2 transition-all',
              state === 'selected' && 'bg-blue-600 text-white border-blue-600',
              state === 'correct'  && 'bg-emerald-500 text-white border-emerald-500',
              state === 'incorrect'&& 'bg-red-500 text-white border-red-500',
              state === 'default'  && 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            );

            return (
              <button
                key={letter}
                className={optionClass}
                style={{ borderRadius: '8px' }}
                onClick={() => !reviewMode && onSelect?.(letter)}
                disabled={reviewMode}
              >
                <span>{letter}</span>
              </button>
            );
          })}
        </div>
      )}

      {qType === QUESTION_TYPES.TRUE_FALSE && (() => {
        const selectedArr = (selectedAnswer || ',,,').split(',');
        const correctArr = (correctAnswer || ',,,').split(',');
        
        const handleTFToggle = (idx, val) => {
          if (reviewMode) return;
          const newArr = [...selectedArr];
          newArr[idx] = val;
          onSelect?.(newArr.join(','));
        };

        return (
          <div className="flex flex-col gap-3 mt-4 max-w-sm mx-auto">
            {TF_LABELS.map((lbl, idx) => {
              const myAns = selectedArr[idx];
              const trueAns = correctArr[idx];
              
              // Determine button styling based on reviewMode
              let btnTClass = "flex-1 py-2 font-bold text-sm border transition-all ";
              let btnFClass = "flex-1 py-2 font-bold text-sm border transition-all ";
              
              if (!reviewMode) {
                btnTClass += myAns === 'T' ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
                btnFClass += myAns === 'F' ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
              } else {
                // Review mode styling
                btnTClass += myAns === 'T' ? (trueAns === 'T' ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-500 text-white border-red-500") : "bg-white text-gray-400 border-gray-200 opacity-50";
                btnFClass += myAns === 'F' ? (trueAns === 'F' ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-500 text-white border-red-500") : "bg-white text-gray-400 border-gray-200 opacity-50";
                // Show missed correct answers
                if (trueAns === 'T' && myAns !== 'T') btnTClass = "flex-1 py-2 font-bold text-sm border-2 border-emerald-500 text-emerald-600 bg-emerald-50 border-dashed";
                if (trueAns === 'F' && myAns !== 'F') btnFClass = "flex-1 py-2 font-bold text-sm border-2 border-emerald-500 text-emerald-600 bg-emerald-50 border-dashed";
              }

              return (
                <div key={lbl} className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded-full shrink-0">
                    {lbl}
                  </span>
                  <div className="flex flex-1 gap-2">
                    <button className={btnTClass + " rounded-l-md"} onClick={() => handleTFToggle(idx, 'T')} disabled={reviewMode}>Đúng</button>
                    <button className={btnFClass + " rounded-r-md"} onClick={() => handleTFToggle(idx, 'F')} disabled={reviewMode}>Sai</button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {qType === QUESTION_TYPES.SHORT_ANSWER && (
        <div className="mt-4 max-w-sm mx-auto flex flex-col gap-2">
          {reviewMode ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded">
                <span className="text-sm font-medium text-gray-600">Bạn đã điền:</span>
                <span className={`text-sm font-bold ${selectedAnswer === correctAnswer ? 'text-emerald-600' : 'text-red-500'}`}>
                  {selectedAnswer || '(trống)'}
                </span>
                {selectedAnswer === correctAnswer ? <CheckCircle size={16} className="text-emerald-500 ml-auto" /> : <XCircle size={16} className="text-red-500 ml-auto" />}
              </div>
              {selectedAnswer !== correctAnswer && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded">
                  <span className="text-sm font-medium text-emerald-800">Đáp án đúng:</span>
                  <span className="text-sm font-bold text-emerald-700">{correctAnswer}</span>
                </div>
              )}
            </div>
          ) : (
            <input
              type="text"
              className="form-input text-center text-lg font-bold py-3"
              placeholder="Nhập đáp án của bạn..."
              value={selectedAnswer || ''}
              onChange={(e) => onSelect?.(e.target.value)}
            />
          )}
        </div>
      )}

      {/* Explanation (review mode) */}
      {reviewMode && question.explanation && (
        <div
          className="mt-4 px-4 py-3 bg-blue-50 border border-blue-200"
          style={{ borderRadius: '3px' }}
        >
          <p className="text-xs font-semibold text-blue-700 mb-1">💡 Giải thích</p>
          <MathText text={question.explanation} className="text-sm text-blue-800" block />
        </div>
      )}
    </div>
  );
}
