import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

// Add a request interceptor to include the Firebase ID Token
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;

// Auth API
export const register = (data: any) => api.post('/auth/register', data);
export const login = (data: any) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Skills API
export const analyzeSkills = (careerGoal: string, currentSkills: string[], aiAnalysis: any) => 
  api.post('/skills/analyze', { careerGoal, currentSkills, aiAnalysis });
export const getMySkills = () => api.get('/skills/me');
export const markSkillComplete = (skillId: string, skillName: string) => 
  api.put(`/skills/${skillId}/complete`, { skillName });

// Resumes API
export const uploadResumeFile = (formData: FormData) => 
  api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const updateResumeAnalysis = (id: string, analysisResult: any) => 
  api.put(`/resumes/${id}/analysis`, { analysisResult });
export const getResumes = () => api.get('/resumes');
export const getLatestResume = () => api.get('/resumes/latest');
export const deleteResume = (id: string) => api.delete(`/resumes/${id}`);

// Jobs API
export const getJobs = (params: any) => api.get('/jobs', { params });
export const seedTeachers = () => api.post('/jobs/seed-teachers');
export const getJobById = (id: string) => api.get(`/jobs/${id}`);
export const generateApplicationEmail = (id: string, job: any) => api.post(`/jobs/${id}/generate-email`, { job });
export const sendApplicationEmail = (id: string, data: any) => api.post(`/jobs/${id}/send-email`, data);

// Chat API
export const getConversationList = () => api.get('/chat');
export const getConversation = (userId: string) => api.get(`/chat/${userId}`);
export const uploadAudio = (formData: FormData) => 
  api.post('/chat/upload-audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const uploadFile = (formData: FormData) => 
  api.post('/chat/upload-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const sendMessage = (userId: string, content: string, attachment?: File) => {
  const formData = new FormData();
  formData.append('content', content);
  if (attachment) formData.append('attachment', attachment);
  return api.post(`/chat/${userId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
