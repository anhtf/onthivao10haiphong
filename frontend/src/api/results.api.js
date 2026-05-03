import api from './axios';

export const getMyResults = () => api.get('/results/my');
export const getSessionResult = (sessionId) => api.get(`/results/session/${sessionId}`);
export const getExamResults = (examId, params) => api.get(`/results/exam/${examId}`, { params });
export const getExamAnalytics = (examId) => api.get(`/results/analytics/${examId}`);
export const getOverviewAnalytics = () => api.get('/results/analytics/overview');
