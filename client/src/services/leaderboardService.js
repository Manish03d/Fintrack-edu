import API from './api';

export const fetchStudentLeaderboard = async (timeframe = 'all-time') => {
  try {
    const res = await API.get(`/student/leaderboard?timeframe=${timeframe}`);
    return res.data.data;
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    throw error;
  }
};

