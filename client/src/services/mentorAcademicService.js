import API from './api';

export const fetchMentorLiveClasses = async () => {
  const res = await API.get('/mentor/live-classes');
  return res.data.data;
};

export const createMentorLiveClassApi = async (payload) => {
  const res = await API.post('/mentor/live-classes', payload);
  return res.data;
};

export const updateMentorLiveClassStatusApi = async (classId, status) => {
  const res = await API.put(`/mentor/live-classes/${classId}/status`, { status });
  return res.data;
};

export const fetchMentorSubmissions = async () => {
  const res = await API.get('/mentor/assignments/submissions');
  return res.data.data;
};

export const gradeMentorSubmissionApi = async (submissionId, payload) => {
  const res = await API.put(`/mentor/assignments/submissions/${submissionId}/grade`, payload);
  return res.data;
};

