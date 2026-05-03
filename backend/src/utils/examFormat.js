const QUESTION_TYPES = {
  MCQ: 'MCQ',                 // 4 options A/B/C/D
  TRUE_FALSE: 'TRUE_FALSE',   // 4 statements, True/False for each
  SHORT_ANSWER: 'SHORT_ANSWER'// Fill in the blank
};

const getQuestionType = (questionNumber) => {
  const num = parseInt(questionNumber, 10);
  if (num <= 12) return QUESTION_TYPES.MCQ;
  if (num >= 13 && num <= 16) return QUESTION_TYPES.TRUE_FALSE;
  return QUESTION_TYPES.SHORT_ANSWER;
};

// Điểm tối đa theo barem chuẩn (Toán vào 10 mới)
const calculatePoints = (questionType, correctAnswer, studentAnswer) => {
  if (!studentAnswer || !correctAnswer) return 0;
  
  if (questionType === QUESTION_TYPES.MCQ) {
    return studentAnswer === correctAnswer ? 0.25 : 0;
  }
  
  if (questionType === QUESTION_TYPES.TRUE_FALSE) {
    // Format: "T,F,T,F"
    const correctArr = correctAnswer.split(',');
    const studentArr = studentAnswer.split(',');
    
    let correctCount = 0;
    for (let i = 0; i < 4; i++) {
      if (studentArr[i] && studentArr[i] === correctArr[i]) {
        correctCount++;
      }
    }
    
    if (correctCount === 1) return 0.1;
    if (correctCount === 2) return 0.25;
    if (correctCount === 3) return 0.5;
    if (correctCount === 4) return 1.0;
    return 0;
  }
  
  if (questionType === QUESTION_TYPES.SHORT_ANSWER) {
    const normalize = (s) => String(s).toLowerCase().replace(/\s+/g, '');
    return normalize(studentAnswer) === normalize(correctAnswer) ? 0.5 : 0;
  }
  
  return 0;
};

module.exports = {
  QUESTION_TYPES,
  getQuestionType,
  calculatePoints
};
