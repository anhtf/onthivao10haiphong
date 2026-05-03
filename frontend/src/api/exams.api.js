import api from './axios';

export const listExams = (params) => api.get('/exams', { params });
export const getExam = (id) => api.get(`/exams/${id}`);
export const createExam = (data) => api.post('/exams', data);
export const updateExam = (id, data) => api.put(`/exams/${id}`, data);
export const deleteExam = (id) => api.delete(`/exams/${id}`);
export const publishExam = (id) => api.patch(`/exams/${id}/publish`);
export const archiveExam = (id) => api.patch(`/exams/${id}/archive`);

export const uploadPdf = (id, formData) =>
  api.post(`/exams/${id}/upload-pdf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });

export const uploadAnswerKey = (id, formData) =>
  api.post(`/exams/${id}/upload-answer-key`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const listQuestions = (examId) => api.get('/questions', { params: { examId } });
export const createQuestion = (data) => api.post('/questions', data);
export const bulkSaveQuestions = (examId, questions) => api.post('/questions/bulk', { examId, questions });
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);
export const uploadQuestionImage = (formData) => api.post('/questions/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
