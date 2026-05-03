import api from './axios';

export const createSession = (examId) => api.post('/sessions', { examId });
export const getSession = (sessionId) => api.get(`/sessions/${sessionId}`);
export const submitSession = (sessionId, answers) => api.post(`/sessions/${sessionId}/submit`, { answers });
export const reportTabSwitch = (sessionId) => api.patch(`/sessions/${sessionId}/tab-switch`);
