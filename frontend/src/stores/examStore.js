import { create } from 'zustand';

const useExamStore = create((set) => ({
  // Current session answers: { [questionId]: selectedAnswer }
  answers: {},
  currentQuestionIndex: 0,

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),

  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),

  resetExam: () => set({ answers: {}, currentQuestionIndex: 0 }),
}));

export default useExamStore;
