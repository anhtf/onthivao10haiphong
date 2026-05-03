export default function QuestionNav({ questions, currentIndex, answers, onSelect, reviewMode, studentAnswers }) {
  const getDotClass = (index) => {
    if (index === currentIndex) return 'nav-dot nav-dot-current';
    if (reviewMode && studentAnswers) {
      const sa = studentAnswers.find((a) => a.questionId === questions[index]?.id);
      if (!sa) return 'nav-dot nav-dot-unanswered';
      return sa.isCorrect ? 'nav-dot nav-dot-correct' : 'nav-dot nav-dot-incorrect';
    }
    return answers?.[questions[index]?.id] ? 'nav-dot nav-dot-answered' : 'nav-dot nav-dot-unanswered';
  };

  const answeredCount = questions.filter((q) => answers?.[q.id]).length;

  return (
    <div className="bg-white border border-gray-200 p-4 shadow-card" style={{ borderRadius: '4px' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {reviewMode ? 'Xem lại' : 'Điều hướng'}
        </span>
        {!reviewMode && (
          <span className="text-xs text-gray-400">{answeredCount}/{questions.length}</span>
        )}
      </div>

      {/* Progress bar */}
      {!reviewMode && (
        <div className="w-full h-1 bg-gray-200 mb-3 overflow-hidden" style={{ borderRadius: '2px' }}>
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${(answeredCount / questions.length) * 100}%`, borderRadius: '2px' }}
          />
        </div>
      )}

      {/* Dots */}
      <div className="flex flex-wrap gap-1">
        {questions.map((_, index) => (
          <button key={index} className={getDotClass(index)} onClick={() => onSelect(index)}>
            {index + 1}
          </button>
        ))}
      </div>

      {/* Legend */}
      {!reviewMode && (
        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="nav-dot nav-dot-answered w-4 h-4 text-[9px]" />
            <span className="text-xs text-gray-400">Đã trả lời</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="nav-dot nav-dot-unanswered w-4 h-4 text-[9px]" />
            <span className="text-xs text-gray-400">Chưa</span>
          </div>
        </div>
      )}
    </div>
  );
}
