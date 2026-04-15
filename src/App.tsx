import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Sparkles, 
  User, 
  Users,
  GraduationCap,
  FileText, 
  ChevronRight, 
  Send, 
  Loader2, 
  TrendingUp, 
  CheckCircle2,
  BrainCircuit,
  LogOut,
  Search,
  MessageSquare,
  Mail,
  X,
  Trash2,
  Sun,
  Moon
} from 'lucide-react';
import { 
  getCareerAdvice, 
  analyzeResume as analyzeResumeAI,
  analyzeSkillGap as analyzeSkillGapAI,
  searchJobsWithAI,
  generateResumes,
  generateApplicationEmail as generateApplicationEmailAI
} from './geminiService';
import { useAuth } from './context/AuthContext';
import * as api from './services/api';
import { db, OperationType, handleFirestoreError } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs, getDoc, orderBy, limit, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

import { StudentView } from './views/StudentView';
import { TeacherView } from './views/TeacherView';

type Tab = 'advice' | 'resume' | 'jobs' | 'chat' | 'profile' | 'students' | 'teachers' | 'resume-builder';

export default function App() {
  const { user, loading: authLoading, login, logout, register, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('advice');
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', role: 'student' });
  
  const [skills, setSkills] = useState('');
  const [goals, setGoals] = useState('');
  const [advice, setAdvice] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [resumeData, setResumeData] = useState({
    name: '',
    phone: '',
    email: '',
    github_link: '',
    linkedin_link: '',
    education: '',
    skills: '',
    experience: '',
    achievements: '',
    projects: '',
    certifications: ''
  });
  const [generatedResumes, setGeneratedResumes] = useState<any[]>([]);

  const [jobs, setJobs] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cached_jobs');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [search, setSearch] = useState('');

  const [skillAnalysis, setSkillAnalysis] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cached_teachers');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [students, setStudents] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [teacherRequests, setTeacherRequests] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [emailDraft, setEmailDraft] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Toggling theme to:', newTheme);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Immediate DOM update as a fallback
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    console.log('Theme changed to:', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (user && activeTab === 'profile') {
      fetchUserHistory();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user) {
      if (user.role === 'student') {
        const unsubscribeJobs = fetchJobs();
        const unsubscribeRequests = fetchStudentRequests();
        const unsubscribeApps = fetchApplications();
        const unsubscribeChats = fetchChats();
        return () => {
          unsubscribeJobs && unsubscribeJobs();
          unsubscribeRequests && unsubscribeRequests();
          unsubscribeApps && unsubscribeApps();
          unsubscribeChats && unsubscribeChats();
        };
      }
      
      if (user.role === 'teacher') {
        fetchStudents();
        const unsubscribeRequests = fetchTeacherRequests();
        const unsubscribeChats = fetchChats();
        return () => {
          unsubscribeRequests && unsubscribeRequests();
          unsubscribeChats && unsubscribeChats();
        };
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'student' && activeTab === 'teachers') {
      const unsubscribe = fetchTeachers();
      return () => unsubscribe && unsubscribe();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user && activeTab === 'chat' && selectedTeacher) {
      const unsubscribe = fetchChatMessages();
      return () => {
        unsubscribe && unsubscribe();
      };
    }
  }, [user, activeTab, selectedTeacher]);

  const fetchStudentRequests = () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'teacherRequests'), where('studentId', '==', user.uid));
      return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeacherRequests(requests);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'teacherRequests');
      });
    } catch (error) {
      console.error('Failed to fetch student requests:', error);
    }
  };

  const fetchTeacherRequests = () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'teacherRequests'), where('teacherId', '==', user.uid), where('status', '==', 'pending'));
      return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeacherRequests(requests);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'teacherRequests');
      });
    } catch (error) {
      console.error('Failed to fetch teacher requests:', error);
    }
  };

  const handleApplyToTeacher = async (teacherId: string) => {
    if (!user) return;
    try {
      // Check if request already exists
      const q = query(
        collection(db, 'teacherRequests'), 
        where('studentId', '==', user.uid), 
        where('teacherId', '==', teacherId),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        showToast('You already have a pending request for this teacher.', 'error');
        return;
      }

      await addDoc(collection(db, 'teacherRequests'), {
        studentId: user.uid,
        studentName: user.displayName || user.name,
        studentEmail: user.email,
        teacherId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      showToast('Application sent to teacher!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'teacherRequests');
    }
  };

  const handleRequestAction = async (requestId: string, studentId: string, action: 'approved' | 'denied') => {
    if (!user) return;
    try {
      const requestRef = doc(db, 'teacherRequests', requestId);
      await updateDoc(requestRef, { status: action });

      if (action === 'approved') {
        const studentRef = doc(db, 'users', studentId);
        await updateDoc(studentRef, { teacherId: user.uid });
        showToast('Student approved and assigned to you!', 'success');
      } else {
        showToast('Request denied.', 'success');
      }
      fetchStudents(); // Refresh student list
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'teacherRequests');
    }
  };

  const fetchChatMessages = () => {
    if (!user || !selectedTeacher) return;
    setChatLoading(true);
    try {
      const chatId = [user.uid, selectedTeacher.uid].sort().join('_');
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        where('participants', 'array-contains', user.uid),
        orderBy('createdAt', 'asc'),
        limit(50)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChatMessages(msgs);
        setChatLoading(false);
      }, (error) => {
        setChatLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'messages');
      });

      return unsubscribe;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTeacher || !newMessage.trim()) return;

    const chatId = [user.uid, selectedTeacher.uid].sort().join('_');
    const messageData = {
      chatId,
      senderId: user.uid,
      receiverId: selectedTeacher.uid,
      participants: [user.uid, selectedTeacher.uid],
      content: newMessage,
      type: 'text',
      createdAt: serverTimestamp()
    };

    try {
      const msgText = newMessage;
      setNewMessage('');
      
      // Add message and update metadata in parallel
      const chatRef = doc(db, 'chats', chatId);
      await Promise.all([
        addDoc(collection(db, 'messages'), messageData),
        setDoc(chatRef, {
          participants: [user.uid, selectedTeacher.uid],
          lastMessage: msgText,
          lastMessageType: 'text',
          updatedAt: serverTimestamp()
        }, { merge: true })
      ]);

      if (user.role === 'teacher') fetchStudents();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const handleSendAudioMessage = async (blob: Blob) => {
    if (!user || !selectedTeacher || !blob || blob.size === 0) {
      console.warn('Cannot send empty audio message');
      return;
    }
    
    setChatLoading(true);
    try {
      console.log('Starting audio message process...', blob.size);
      const chatId = [user.uid, selectedTeacher.uid].sort().join('_');
      
      // Determine extension from blob type
      let extension = 'webm';
      if (blob.type.includes('mp4')) extension = 'mp4';
      else if (blob.type.includes('ogg')) extension = 'ogg';
      else if (blob.type.includes('wav')) extension = 'wav';
      else if (blob.type.includes('aac')) extension = 'aac';
      
      const fileName = `audio_${Date.now()}.${extension}`;
      
      // 1. Create a placeholder message in Firestore instantly
      const messageData = {
        chatId,
        senderId: user.uid,
        receiverId: selectedTeacher.uid,
        participants: [user.uid, selectedTeacher.uid],
        type: 'audio',
        audioUrl: '', // Empty initially
        content: 'Voice Note (Uploading...)',
        createdAt: serverTimestamp()
      };
      
      const messageRef = await addDoc(collection(db, 'messages'), messageData);
      console.log('Placeholder message created:', messageRef.id);

      // 2. Start upload in background (using server-side upload for speed)
      const formData = new FormData();
      formData.append('audio', blob, fileName);
      const uploadPromise = api.uploadAudio(formData).then(res => res.data.url);
      
      // 3. Update chat metadata immediately
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        participants: [user.uid, selectedTeacher.uid],
        lastMessage: 'Voice Note',
        lastMessageType: 'audio',
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 4. Wait for upload to finish
      const audioUrl = await uploadPromise;
      console.log('Audio uploaded successfully:', audioUrl);

      // 5. Update the message with the real URL
      await updateDoc(messageRef, {
        audioUrl,
        content: 'Voice Note'
      });

      if (user.role === 'teacher') fetchStudents();
      console.log('Audio message finalized successfully');
    } catch (error) {
      console.error('Error sending audio message:', error);
      // Only report as firestore error if it actually failed at the firestore step
      if (error.message?.includes('permission') || error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.CREATE, 'messages');
      } else {
        showToast('Failed to send audio message. Please check your connection.', 'error');
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendFileMessage = async (file: File) => {
    if (!user || !selectedTeacher || !file) return;

    setChatLoading(true);
    try {
      const chatId = [user.uid, selectedTeacher.uid].sort().join('_');
      
      // 1. Create a placeholder message in Firestore instantly
      const messageData = {
        chatId,
        senderId: user.uid,
        receiverId: selectedTeacher.uid,
        participants: [user.uid, selectedTeacher.uid],
        type: 'file',
        fileUrl: '', // Empty initially
        fileName: file.name,
        fileType: file.type,
        content: `File: ${file.name} (Uploading...)`,
        createdAt: serverTimestamp()
      };
      
      const messageRef = await addDoc(collection(db, 'messages'), messageData);

      // 2. Start upload in background
      const formData = new FormData();
      formData.append('file', file);
      const uploadPromise = api.uploadFile(formData).then(res => res.data.url);
      
      // 3. Update chat metadata immediately
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        participants: [user.uid, selectedTeacher.uid],
        lastMessage: `File: ${file.name}`,
        lastMessageType: 'file',
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 4. Wait for upload to finish
      const fileUrl = await uploadPromise;

      // 5. Update the message with the real URL
      await updateDoc(messageRef, {
        fileUrl,
        content: `File: ${file.name}`
      });

      if (user.role === 'teacher') fetchStudents();
      showToast('File shared successfully!', 'success');
    } catch (error) {
      console.error('Error sending file message:', error);
      if (error.message?.includes('permission') || error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.CREATE, 'messages');
      } else {
        showToast('Failed to share file. Only PDF, DOCX, and TXT are allowed.', 'error');
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!user || !selectedTeacher || user.role !== 'teacher') return;
    
    setChatLoading(true);
    try {
      const chatId = [user.uid, selectedTeacher.uid].sort().join('_');
      const q = query(collection(db, 'messages'), where('chatId', '==', chatId));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Also update chat metadata
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: 'Chat cleared',
        lastMessageType: 'text',
        updatedAt: serverTimestamp()
      });
      
      showToast('Chat cleared successfully!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'messages');
    } finally {
      setChatLoading(false);
    }
  };

  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleUpdateProfile = async (data: any) => {
    if (!user) return;
    
    // Clear existing timeout
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    // Set a new timeout to update Firestore after 1 second of inactivity
    const timeout = setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
        showToast('Profile updated successfully!', 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }, 1000);

    setUpdateTimeout(timeout);
  };

  const fetchTeachers = () => {
    console.log('Fetching teachers from Firestore...');
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const teacherList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        console.log(`Found ${teacherList.length} teachers in Firestore`);
        
        setTeachers(teacherList);
        localStorage.setItem('cached_teachers', JSON.stringify(teacherList));
        setLoading(false);

        if (teacherList.length === 0) {
          console.log('No teachers found, seeding initial teachers...');
          seedInitialTeachers();
        }
      }, (error) => {
        console.error('Failed to fetch teachers (onSnapshot):', error);
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'users');
      });

      return unsubscribe;
    } catch (error) {
      console.error('Failed to setup teachers listener:', error);
      setLoading(false);
    }
  };

  const seedInitialTeachers = async () => {
    try {
      console.log('Calling seedTeachers API...');
      const response = await api.seedTeachers();
      console.log('Seed teachers response:', response.data);
      
      // Re-fetch after seeding to ensure state is updated
      const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const querySnapshot = await getDocs(q);
      const teacherList = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      console.log(`After seeding, found ${teacherList.length} teachers`);
      
      setTeachers(teacherList);
      localStorage.setItem('cached_teachers', JSON.stringify(teacherList));
    } catch (error) {
      console.error('Failed to seed teachers:', error);
    }
  };

  const fetchStudents = async () => {
    if (!user || user.role !== 'teacher') return;
    try {
      // Get assigned students
      const qAssigned = query(
        collection(db, 'users'), 
        where('teacherId', '==', user.uid),
        where('role', '==', 'student')
      );
      const assignedSnapshot = await getDocs(qAssigned);
      const assignedStudents = assignedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Get all chats for this teacher to find other students who messaged
      const qChats = query(
        collection(db, 'chats'), 
        where('participants', 'array-contains', user.uid)
      );
      const chatsSnapshot = await getDocs(qChats);
      const chatList = chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatList);

      const messagingStudentIds = chatList
        .map((chat: any) => chat.participants.find((p: string) => p !== user.uid))
        .filter(id => id && !assignedStudents.find(s => s.id === id));

      let allStudents = [...assignedStudents];

      if (messagingStudentIds.length > 0) {
        // Fetch these students' profiles individually
        // This is safer than a query if we don't have a common field
        const studentsPromises = messagingStudentIds.map(id => getDoc(doc(db, 'users', id)));
        const studentDocs = await Promise.all(studentsPromises);
        const messagingStudents = studentDocs
          .filter(d => d.exists())
          .map(d => ({ id: d.id, ...d.data(), isMessagingOnly: true }));
        allStudents = [...allStudents, ...messagingStudents];
      }

      setStudents(allStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  };

  const handleSelectTeacher = async (teacherId: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { teacherId });
      showToast('Teacher selected successfully!', 'success');
      // Refresh user data is handled by AuthContext onAuthStateChanged if it re-fetches, 
      // but here we might need to manually update local state if AuthContext doesn't.
      // For now, let's assume the user will see it on refresh or next load.
      window.location.reload(); // Simple way to refresh profile
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleApply = async (job: any) => {
    setSelectedJob(job);
    setRecruiterEmail(job.companyEmail || '');
    setIsEmailModalOpen(true);
    setLoading(true);
    try {
      // Use frontend AI service instead of backend to avoid PERMISSION_DENIED/500 issues
      const resumeContext = analysis ? JSON.stringify(analysis) : (resumeText || 'No resume provided');
      const draft = await generateApplicationEmailAI(job, resumeContext);
      setEmailDraft(draft);
    } catch (error: any) {
      console.error('Failed to generate email draft:', error);
      setEmailDraft(`Dear Recruiter,\n\nI am interested in the ${job.title} position at ${job.company}.\n\nBest regards,\n${user.name || user.displayName}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (attachment?: File) => {
    if (!selectedJob || !emailDraft || !user) return;
    setSendingEmail(true);
    try {
      // 1. Send email via backend
      const response = await api.sendApplicationEmail(selectedJob._id, {
        emailBody: emailDraft,
        recipientEmail: recruiterEmail,
        job: selectedJob
      });

      // 2. Save to history in Firestore
      await addDoc(collection(db, 'applications'), {
        userId: user.uid,
        jobId: selectedJob._id,
        jobTitle: selectedJob.title,
        company: selectedJob.company,
        emailBody: emailDraft,
        recipientEmail: recruiterEmail,
        createdAt: serverTimestamp()
      });

      if (response.data.demoMode) {
        showToast(response.data.message || 'Application simulated (Demo Mode)', 'success');
      } else {
        showToast('Application sent successfully!', 'success');
      }
      setIsEmailModalOpen(false);
    } catch (error: any) {
      console.error('Failed to send email:', error);
      const message = error.response?.data?.message || error.message || 'Failed to send application email.';
      showToast(message, 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const fetchApplications = () => {
    if (!user || user.role !== 'student') return;
    try {
      const q = query(
        collection(db, 'applications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setApplications(apps);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'applications');
      });

      return unsubscribe;
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const fetchChats = () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChats(chatList);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'chats');
      });

      return unsubscribe;
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchUserHistory = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'resumes'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const lastResume = querySnapshot.docs[0].data();
        setAnalysis(lastResume.analysisResult);
        setResumeText(lastResume.extractedText || '');
      }
    } catch (error) {
      console.error('Failed to fetch user history:', error);
    }
  };

  const fetchJobs = () => {
    try {
      if (search) {
        handleSearchJobs();
        return;
      }

      const q = query(collection(db, 'jobs'), limit(20));
      return onSnapshot(q, (snapshot) => {
        const jobList = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        setJobs(jobList);
        localStorage.setItem('cached_jobs', JSON.stringify(jobList));

        if (jobList.length === 0 && !search) {
          seedInitialJobs();
        }
      }, (error) => {
        console.error('Failed to fetch jobs');
        handleFirestoreError(error, OperationType.GET, 'jobs');
      });
    } catch (error) {
      console.error('Failed to fetch jobs');
    }
  };

  const handleSearchJobs = async () => {
    if (!search) {
      fetchJobs();
      return;
    }
    
    setLoading(true);
    try {
      const aiJobs = await searchJobsWithAI(search);
      const jobList = aiJobs.map((job: any, index: number) => ({ _id: `ai-job-${index}`, ...job }));
      setJobs(jobList);
    } catch (error) {
      console.error('Failed to search jobs with AI:', error);
      showToast('Search failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const seedInitialJobs = async () => {
    const initialJobs = [
      {
        title: 'Frontend Developer',
        company: 'TechCorp',
        description: 'Looking for a React expert to join our team.',
        location: 'Remote',
        careerCategory: 'Web Developer',
        companyEmail: 'jobs@techcorp.com',
        createdAt: serverTimestamp()
      },
      {
        title: 'Data Scientist',
        company: 'DataViz',
        description: 'Help us analyze large datasets and build models.',
        location: 'New York, NY',
        careerCategory: 'Data Scientist',
        companyEmail: 'hr@dataviz.io',
        createdAt: serverTimestamp()
      },
      {
        title: 'UX Designer',
        company: 'Creative Studio',
        description: 'Design beautiful and intuitive user interfaces.',
        location: 'San Francisco, CA',
        careerCategory: 'UX Designer',
        companyEmail: 'design@creativestudio.com',
        createdAt: serverTimestamp()
      }
    ];

    try {
      for (const job of initialJobs) {
        await addDoc(collection(db, 'jobs'), job);
      }
      // Re-fetch after seeding
      const q = query(collection(db, 'jobs'), limit(20));
      const querySnapshot = await getDocs(q);
      const jobList = querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
      setJobs(jobList);
    } catch (error) {
      console.error('Failed to seed jobs:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login({ email: authForm.email, password: authForm.password });
      } else {
        await register(authForm);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      showToast(error.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGetAdvice = async () => {
    if (!skills || !goals || !user) return;
    setLoading(true);
    try {
      // 1. Get advice (text)
      const adviceResult = await getCareerAdvice(skills, goals);
      setAdvice(adviceResult);

      // 2. Get structured skill gap analysis
      const skillList = skills.split(',').map(s => s.trim());
      const gapAnalysis = await analyzeSkillGapAI(skillList, goals);
      setSkillAnalysis(gapAnalysis);

      // 3. Save to Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        skills: skillList,
        careerGoals: goals,
        skillAnalysis: gapAnalysis,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResumes = async () => {
    if (!resumeData.name || !resumeData.email || !resumeData.education || !resumeData.skills) {
      showToast('Please fill in at least Name, Email, Education, and Skills.', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await generateResumes(resumeData);
      setGeneratedResumes(result);
      showToast('Resumes generated successfully!', 'success');
    } catch (error) {
      console.error('Failed to generate resumes:', error);
      showToast('Failed to generate resumes. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText || !user) return;
    setLoading(true);
    try {
      const result = await analyzeResumeAI(resumeText);
      setAnalysis(result);

      // Save analysis to Firestore
      await addDoc(collection(db, 'resumes'), {
        userId: user.uid,
        fileName: 'Manual Paste',
        extractedText: resumeText,
        analysisResult: result,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      console.log('Starting file upload and extraction...');
      
      // 1. Prepare Backend extraction and upload (using server-side for speed)
      const formData = new FormData();
      formData.append('resume', file);
      const uploadResponse = await api.uploadResumeFile(formData);
      
      const extractedText = uploadResponse.data.extractedText || "";
      const downloadURL = uploadResponse.data.url;
      console.log('Text extracted and file uploaded to server:', extractedText.length, downloadURL);

      // 2. Analyze text with Gemini immediately
      console.log('Analyzing with Gemini...');
      const analysisResult = await analyzeResumeAI(extractedText);
      setAnalysis(analysisResult);
      console.log('Analysis complete');

      // 3. Save metadata to Firestore
      await addDoc(collection(db, 'resumes'), {
        userId: user.uid,
        fileName: file.name,
        fileUrl: downloadURL,
        extractedText: extractedText,
        analysisResult: analysisResult,
        createdAt: serverTimestamp()
      });
      console.log('Metadata saved to Firestore');
      showToast('Resume processed successfully!', 'success');
    } catch (error) {
      console.error('File upload failed:', error);
      showToast('Failed to process resume. Please try again or paste text manually.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderToast = () => {
    if (!toast) return null;
    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border transition-all duration-300 ${
        toast.type === 'error' 
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-400' 
          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
      }`}>
        {toast.message}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] dark:bg-[#0a0a0a] transition-colors duration-300">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {renderToast()}
        <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a] flex items-center justify-center p-4 transition-colors duration-300">
          <div className="fixed top-4 right-4 flex gap-2">
            <button
              onClick={toggleTheme}
              className="p-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
              {theme === 'light' ? <Moon size={20} className="text-gray-600" /> : <Sun size={20} className="text-emerald-400" />}
            </button>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[#111111] p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full border border-black/5 dark:border-white/5 transition-colors duration-300"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 mb-4">
              <Briefcase size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">CareerSync AI</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-center">Your AI-powered career companion</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Role</label>
                  <select 
                    value={authForm.role}
                    onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                    className="w-full p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Email Address</label>
              <input 
                type="email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Password</label>
              <input 
                type="password"
                required
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                placeholder="••••••••"
              />
              {!isLogin && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                  Must be 8+ chars with uppercase, lowercase, and special character.
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </motion.div>
      </div>
      </>
    );
  }

  if (user.role === 'teacher') {
    return (
      <>
        {renderToast()}
        <TeacherView 
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logout={logout}
        students={students}
        teacherRequests={teacherRequests}
        handleRequestAction={handleRequestAction}
        setSelectedTeacher={setSelectedTeacher}
        selectedTeacher={selectedTeacher}
        chatMessages={chatMessages}
        chatLoading={chatLoading}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        handleSendAudioMessage={handleSendAudioMessage}
        handleUpdateProfile={handleUpdateProfile}
        handleClearChat={handleClearChat}
        handleSendFileMessage={handleSendFileMessage}
        chats={chats}
      />
      </>
    );
  }

  return (
    <>
      {renderToast()}
      <StudentView 
      user={user}
      theme={theme}
      toggleTheme={toggleTheme}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      logout={logout}
      skills={skills}
      setSkills={setSkills}
      goals={goals}
      setGoals={setGoals}
      advice={advice}
      handleGetAdvice={handleGetAdvice}
      loading={loading}
      skillAnalysis={skillAnalysis}
      resumeText={resumeText}
      setResumeText={setResumeText}
      handleFileUpload={handleFileUpload}
      handleAnalyzeResume={handleAnalyzeResume}
      analysis={analysis}
      search={search}
      setSearch={setSearch}
      fetchJobs={fetchJobs}
      fetchTeachers={fetchTeachers}
      jobs={jobs}
      handleApply={handleApply}
      teachers={teachers}
      teacherRequests={teacherRequests}
      handleApplyToTeacher={handleApplyToTeacher}
      setSelectedTeacher={setSelectedTeacher}
      selectedTeacher={selectedTeacher}
      chatMessages={chatMessages}
      chatLoading={chatLoading}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      handleSendMessage={handleSendMessage}
      handleSendAudioMessage={handleSendAudioMessage}
      handleSendFileMessage={handleSendFileMessage}
      handleUpdateProfile={handleUpdateProfile}
      isEmailModalOpen={isEmailModalOpen}
      setIsEmailModalOpen={setIsEmailModalOpen}
      selectedJob={selectedJob}
      emailDraft={emailDraft}
      setEmailDraft={setEmailDraft}
      recruiterEmail={recruiterEmail}
      setRecruiterEmail={setRecruiterEmail}
      sendingEmail={sendingEmail}
      handleSendEmail={handleSendEmail}
      applications={applications}
      chats={chats}
      resumeData={resumeData}
      setResumeData={setResumeData}
      generatedResumes={generatedResumes}
      handleGenerateResumes={handleGenerateResumes}
    />
    </>
  );
}
