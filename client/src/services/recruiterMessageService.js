import API from './api';

export const fetchRecruiterConversations = async () => {
  const res = await API.get('/recruiter/messages/conversations');
  return res.data.data;
};

export const fetchRecruiterThread = async (candidateId) => {
  const res = await API.get(`/recruiter/messages/thread/${candidateId}`);
  return res.data.data;
};

export const sendRecruiterMessageApi = async (candidateId, text) => {
  const res = await API.post('/recruiter/messages/send', { candidateId, text });
  return res.data;
};

