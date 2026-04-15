import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Sparkles, 
  User, 
  FileText, 
  ChevronRight, 
  Send, 
  Play,
  Pause,
  Loader2, 
  TrendingUp, 
  CheckCircle2,
  BrainCircuit,
  LogOut,
  Search,
  MessageSquare,
  GraduationCap,
  Mail,
  X,
  Sun,
  Moon,
  RefreshCw,
  Mic,
  Square,
  Paperclip,
  Building2,
  BadgeCheck,
  Layout
} from 'lucide-react';
import Markdown from 'react-markdown';
import { NavItem, MobileNavItem } from '../components/Navigation';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { ResumeBuilder } from '../components/ResumeBuilder';

interface StudentViewProps {
  user: any;
  theme: string;
  toggleTheme: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  logout: () => void;
  skills: string;
  setSkills: (val: string) => void;
  goals: string;
  setGoals: (val: string) => void;
  advice: string;
  handleGetAdvice: () => void;
  loading: boolean;
  skillAnalysis: any;
  resumeText: string;
  setResumeText: (val: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAnalyzeResume: () => void;
  analysis: any;
  search: string;
  setSearch: (val: string) => void;
  fetchJobs: () => void;
  fetchTeachers: () => void;
  jobs: any[];
  handleApply: (job: any) => void;
  teachers: any[];
  teacherRequests: any[];
  handleApplyToTeacher: (id: string) => void;
  setSelectedTeacher: (teacher: any) => void;
  selectedTeacher: any;
  chatMessages: any[];
  chatLoading: boolean;
  newMessage: string;
  setNewMessage: (val: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  handleSendAudioMessage: (blob: Blob) => void;
  handleSendFileMessage: (file: File) => void;
  handleUpdateProfile: (data: any) => void;
  isEmailModalOpen: boolean;
  setIsEmailModalOpen: (val: boolean) => void;
  selectedJob: any;
  emailDraft: string;
  setEmailDraft: (val: string) => void;
  recruiterEmail: string;
  setRecruiterEmail: (val: string) => void;
  sendingEmail: boolean;
  handleSendEmail: (attachment?: File) => void;
  applications: any[];
  chats: any[];
  resumeData: any;
  setResumeData: (data: any) => void;
  generatedResumes: any[];
  handleGenerateResumes: () => void;
}

export function StudentView(props: StudentViewProps) {
  const { 
    user, theme, toggleTheme, activeTab, setActiveTab, logout, 
    skills, setSkills, goals, setGoals, advice, handleGetAdvice, loading, skillAnalysis,
    resumeText, setResumeText, handleFileUpload, handleAnalyzeResume, analysis,
    search, setSearch, fetchJobs, fetchTeachers, jobs, handleApply,
    teachers, teacherRequests, handleApplyToTeacher, setSelectedTeacher, selectedTeacher,
    chatMessages, chatLoading, newMessage, setNewMessage, handleSendMessage,
    handleSendAudioMessage, handleSendFileMessage, handleUpdateProfile,
    isEmailModalOpen, setIsEmailModalOpen, selectedJob, emailDraft, setEmailDraft,
    recruiterEmail, setRecruiterEmail, sendingEmail, handleSendEmail,
    applications, chats, resumeData, setResumeData, generatedResumes, handleGenerateResumes
  } = props;

  const getRequestStatus = (teacherId: string) => {
    const request = teacherRequests.find(r => r.teacherId === teacherId);
    return request ? request.status : null;
  };

  const [teacherSearch, setTeacherSearch] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [playingAudioId, setPlayingAudioId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);

  const [downloadingPdf, setDownloadingPdf] = React.useState<string | null>(null);

  const downloadPdf = async (id: string, fileName: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    
    setDownloadingPdf(id);
    try {
      // Scroll into view to ensure it's visible for capture
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Wait for scroll and any potential re-renders
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: true,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(id);
          if (clonedElement) {
            // Remove constraints from parent in the clone to ensure full height is rendered
            let parent = clonedElement.parentElement;
            while (parent) {
              parent.style.maxHeight = 'none';
              parent.style.overflow = 'visible';
              parent = parent.parentElement;
            }

            // Force styles in the clone to ensure capture
            clonedElement.style.height = 'auto';
            clonedElement.style.width = '800px';
            clonedElement.style.margin = '0';
            clonedElement.style.padding = '40px';
            clonedElement.style.display = 'flex'; // Ensure flex is preserved
            clonedElement.style.flexDirection = 'row';
            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.color = '#000000';
            clonedElement.style.visibility = 'visible';
            clonedElement.style.opacity = '1';
            
            // Fix for sidebar layouts specifically in the clone
            const sidebar = clonedElement.querySelector('.w-1\\/3');
            if (sidebar) {
              (sidebar as HTMLElement).style.display = 'block';
              (sidebar as HTMLElement).style.minHeight = '100%';
              (sidebar as HTMLElement).style.backgroundColor = (sidebar as HTMLElement).style.backgroundColor || '#002147';
            }
            const main = clonedElement.querySelector('.w-2\\/3');
            if (main) {
              (main as HTMLElement).style.display = 'block';
              (main as HTMLElement).style.backgroundColor = '#ffffff';
            }
          }
        }
      });
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Generated canvas is empty');
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Local state for profile fields to ensure smooth typing
  const [localCompanyName, setLocalCompanyName] = React.useState(user.companyName || '');
  const [localJobRole, setLocalJobRole] = React.useState(user.jobRole || '');
  const [localCareerGoals, setLocalCareerGoals] = React.useState(user.careerGoals || '');

  // Update local state when user prop changes
  React.useEffect(() => {
    setLocalCompanyName(user.companyName || '');
  }, [user.companyName]);

  React.useEffect(() => {
    setLocalJobRole(user.jobRole || '');
  }, [user.jobRole]);

  React.useEffect(() => {
    setLocalCareerGoals(user.careerGoals || '');
  }, [user.careerGoals]);

  // Reset history when tab changes
  React.useEffect(() => {
    setShowHistory(false);
  }, [activeTab]);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Find supported MIME type
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/aac',
      ];
      const mimeType = types.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
      
      const recorder = new MediaRecorder(stream, { mimeType });
      setMediaRecorder(recorder);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        handleSendAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher => 
    (teacher.name || '').toLowerCase().includes(teacherSearch.toLowerCase()) ||
    (teacher.email || '').toLowerCase().includes(teacherSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a] text-[#1a1a1a] dark:text-[#f5f5f5] font-sans selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-[#111111] border-r border-black/5 dark:border-white/5 p-6 hidden lg:flex flex-col z-10">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
            <Briefcase size={22} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight dark:text-white">CareerSync AI</h1>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem 
            active={activeTab === 'advice'} 
            onClick={() => setActiveTab('advice')}
            icon={<Sparkles size={18} />}
            label="Get Personalized Advice"
          />
          <NavItem 
            active={activeTab === 'resume'} 
            onClick={() => setActiveTab('resume')}
            icon={<FileText size={18} />}
            label="Optimize Your Resume"
          />
          <NavItem 
            active={activeTab === 'resume-builder'} 
            onClick={() => setActiveTab('resume-builder')}
            icon={<Layout size={18} />}
            label="Resume Builder"
          />
          <NavItem 
            active={activeTab === 'jobs'} 
            onClick={() => setActiveTab('jobs')}
            icon={<Search size={18} />}
            label="Job Search"
          />
          <NavItem 
            active={activeTab === 'teachers'} 
            onClick={() => setActiveTab('teachers')}
            icon={<GraduationCap size={18} />}
            label="My Teachers"
          />
          <NavItem 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')}
            icon={<MessageSquare size={18} />}
            label="Messages"
          />
          <NavItem 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')}
            icon={<User size={18} />}
            label="My Profile"
          />
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
              <TrendingUp size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Pro Tip</span>
            </div>
            <p className="text-xs text-emerald-800/70 dark:text-emerald-300/70 leading-relaxed">
              Keep your skills updated to get more accurate AI recommendations.
            </p>
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 p-4 md:p-8 lg:p-12 max-w-6xl mx-auto pb-24 lg:pb-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-semibold tracking-tight mb-2 dark:text-white whitespace-nowrap"
            >
              {activeTab === 'advice' && "Get Personalized Advice"}
              {activeTab === 'resume' && "Optimize Your Resume"}
              {activeTab === 'resume-builder' && "AI Resume Builder"}
              {activeTab === 'jobs' && "Find Your Next Role"}
              {activeTab === 'chat' && (selectedTeacher ? `Chat with ${selectedTeacher.name}` : "Career Consultations")}
              {activeTab === 'profile' && "Your Career Profile"}
              {activeTab === 'teachers' && "Find a Mentor"}
            </motion.h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {activeTab === 'advice' && `Welcome back, ${user.name}! Let's plan your next move.`}
              {activeTab === 'resume' && "Paste your resume text below for a deep dive analysis."}
              {activeTab === 'resume-builder' && "Generate professional resumes in multiple styles using AI."}
              {activeTab === 'jobs' && "Browse hand-picked opportunities tailored for you."}
              {activeTab === 'chat' && (selectedTeacher ? "Get live help from your teacher." : "Connect with career experts and mentors.")}
              {activeTab === 'profile' && "Manage your professional information and history."}
              {activeTab === 'teachers' && "Select a teacher to get personalized guidance."}
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-[#111111] p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm transition-colors duration-300">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-emerald-400" />}
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1" />
            {activeTab === 'teachers' ? (
              <button 
                onClick={fetchTeachers}
                className="px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Refresh List
              </button>
            ) : (
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  showHistory 
                    ? 'bg-emerald-500 text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                {showHistory ? 'Back' : 'History'}
              </button>
            )}
            <button 
              onClick={() => {
                setShowHistory(false);
                if (activeTab === 'chat') setSelectedTeacher(null);
              }}
              className="px-4 py-2 text-sm font-medium bg-black dark:bg-emerald-600 text-white rounded-xl shadow-lg shadow-black/10 dark:shadow-emerald-900/20 hover:bg-gray-800 dark:hover:bg-emerald-700 transition-all"
            >
              New Session
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'advice' && (
            <motion.div 
              key="advice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6 transition-colors duration-300">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Current Skills</label>
                    <textarea 
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="e.g. React, TypeScript, UI Design, Project Management..."
                      className="w-full min-h-[120px] p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-lg dark:text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Career Goals</label>
                    <textarea 
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      placeholder="e.g. Become a Senior Frontend Engineer at a top tech company..."
                      className="w-full min-h-[120px] p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-lg dark:text-white"
                    />
                  </div>

                  <button 
                    onClick={handleGetAdvice}
                    disabled={loading || !skills || !goals}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        Generate AI Advice
                        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

                {advice && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm transition-colors duration-300"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                        <BrainCircuit size={18} />
                      </div>
                      <h3 className="text-xl font-semibold dark:text-white">AI Recommendations</h3>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap text-lg">
                      {advice}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="space-y-6">
                <StatCard 
                  title="Market Demand" 
                  value={jobs.length > 0 ? (jobs.length > 50 ? "Very High" : "High") : "Moderate"} 
                  trend={jobs.length > 0 ? `+${Math.min(25, Math.floor(jobs.length / 2))}%` : "Stable"} 
                  color="emerald"
                />
                <StatCard 
                  title="Skill Match" 
                  value={skillAnalysis ? `${skillAnalysis.skillScore}%` : "N/A"} 
                  trend={skillAnalysis ? "AI Calculated" : "Analysis Required"} 
                  color="blue"
                />
                
                {skillAnalysis && (
                  <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm transition-colors duration-300">
                    <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-gray-400 dark:text-gray-500">Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {skillAnalysis.missingSkills.map((s: any, i: number) => (
                        <span key={i} className={`px-3 py-1 rounded-full text-xs font-bold ${
                          s.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 
                          s.priority === 'medium' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 
                          'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        }`}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm transition-colors duration-300">
                  <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-gray-400 dark:text-gray-500">Career Progress</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Profile Completion</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {(() => {
                          let progress = 30;
                          if (user.name && user.email) progress += 30;
                          if (analysis) progress += 35;
                          if (applications.length > 0) progress = Math.min(100, progress + 5);
                          return `${progress}%`;
                        })()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: (() => {
                          let progress = 30;
                          if (user.name && user.email) progress += 30;
                          if (analysis) progress += 35;
                          if (applications.length > 0) progress = Math.min(100, progress + 5);
                          return `${progress}%`;
                        })() }}></div>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">
                      {!analysis && "Upload a resume to reach 95% completion!"}
                      {analysis && applications.length === 0 && "Apply for your first job to reach 100%!"}
                      {analysis && applications.length > 0 && "Great job! Keep applying to increase your chances."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'resume' && (
            <motion.div 
              key="resume"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6 transition-colors duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Resume Content</label>
                    <label className="cursor-pointer text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 hover:underline">
                      <FileText size={14} />
                      Upload PDF
                      <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  <textarea 
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume text here..."
                    className="w-full min-h-[300px] p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-lg dark:text-white"
                  />

                  <button 
                    onClick={handleAnalyzeResume}
                    disabled={loading || !resumeText}
                    className="w-full py-4 bg-black dark:bg-emerald-600 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-black/10 dark:shadow-emerald-900/20 hover:bg-gray-800 dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        Analyze with Gemini AI
                        <Send size={18} />
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-6">
                  {analysis ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm transition-colors duration-300"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                            <FileText size={20} />
                          </div>
                          <h3 className="text-xl font-semibold dark:text-white">ATS Analysis</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Score</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analysis.strengthScore}%</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase mb-3">Suggestions</h4>
                          <ul className="space-y-2">
                            {analysis.suggestions.map((s: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase mb-3">Missing Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keywordsMissing.map((k: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-bold">
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-gray-100/50 dark:bg-[#1a1a1a]/50 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-colors duration-300">
                      <Sparkles className="text-gray-300 dark:text-gray-700 mb-4" size={48} />
                      <h4 className="text-lg font-semibold text-gray-400 dark:text-gray-500">No Analysis Yet</h4>
                      <p className="text-gray-400 dark:text-gray-500 text-sm max-w-[200px]">Upload your resume to see AI-powered suggestions and ATS scores.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'jobs' && (
            <motion.div 
              key="jobs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {showHistory ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold dark:text-white">Application History</h3>
                    <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-bold">
                      {applications.length} Applications
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {applications.length > 0 ? applications.map((app) => (
                      <div key={app.id} className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-bold dark:text-white">{app.jobTitle}</h4>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{app.company}</p>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                            {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : 'Just now'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Mail size={14} />
                            {app.recipientEmail}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center bg-white dark:bg-[#111111] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                        <Briefcase className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-gray-400 dark:text-gray-500">No application history</h3>
                        <p className="text-gray-400 dark:text-gray-500">Your sent applications will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                      <input 
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                        placeholder="Search jobs, companies, or keywords..."
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#111111] border border-black/5 dark:border-white/5 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      />
                    </div>
                    <button 
                      onClick={fetchJobs}
                      className="px-8 bg-black dark:bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-gray-800 dark:hover:bg-emerald-700 transition-all"
                    >
                      Search
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {jobs.length > 0 ? jobs.map((job) => (
                      <div key={job._id} className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors dark:text-white">{job.title}</h4>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{job.company}</p>
                          </div>
                          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
                            {job.careerCategory}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-6">{job.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">{job.location}</span>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleApply(job)}
                              className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all"
                            >
                              <Mail size={16} />
                              Apply
                            </button>
                            <button className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold hover:gap-3 transition-all text-sm">
                              Details <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-20 text-center bg-white dark:bg-[#111111] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 transition-colors duration-300">
                        <Briefcase className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-gray-400 dark:text-gray-500">No jobs found</h3>
                        <p className="text-gray-400 dark:text-gray-500">Try adjusting your search or category</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'teachers' && (
            <motion.div 
              key="teachers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm flex items-center gap-3 transition-colors duration-300">
                <Search className="text-gray-400 dark:text-gray-500" size={20} />
                <input 
                  type="text"
                  placeholder="Search teachers by name or email..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.length > 0 ? filteredTeachers.map((teacher: any) => {
                  const status = getRequestStatus(teacher.uid);
                  const isAssigned = user.teacherId === teacher.uid;

                  return (
                    <div key={teacher.uid} className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-xl">
                          {teacher.name?.[0] || 'T'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg dark:text-white">{teacher.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{teacher.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isAssigned ? (
                          <div className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-sm font-semibold text-center">
                            Assigned
                          </div>
                        ) : status === 'pending' ? (
                          <div className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-xl text-sm font-semibold text-center">
                            Request Pending
                          </div>
                        ) : status === 'denied' ? (
                          <button 
                            onClick={() => handleApplyToTeacher(teacher.uid)}
                            className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                          >
                            Re-Apply
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleApplyToTeacher(teacher.uid)}
                            className="flex-1 py-2 bg-black dark:bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-emerald-700 transition-all"
                          >
                            Apply to Teacher
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setActiveTab('chat');
                          }}
                          className="p-2 bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                        >
                          <MessageSquare size={20} />
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-20 text-center bg-white dark:bg-[#111111] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 transition-colors duration-300">
                    <GraduationCap className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-gray-400 dark:text-gray-500">No teachers found</h3>
                    <p className="text-gray-400 dark:text-gray-500">
                      {teacherSearch ? "Try adjusting your search." : "Teachers will appear here once they join the platform."}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-[#111111] rounded-3xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-[600px] transition-colors duration-300"
            >
              {showHistory ? (
                <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold dark:text-white">Chat History</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{chats.length} Conversations</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chats.length > 0 ? chats.map((chat) => {
                      const otherParticipantId = chat.participants.find((id: string) => id !== user.uid);
                      const teacher = teachers.find(t => t.uid === otherParticipantId);
                      
                      return (
                        <button
                          key={chat.id}
                          onClick={() => {
                            if (teacher) {
                              setSelectedTeacher(teacher);
                              setShowHistory(false);
                            }
                          }}
                          className="w-full p-4 flex items-center gap-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-left group"
                        >
                          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            {teacher?.name?.charAt(0) || <User size={24} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold dark:text-white truncate">{teacher?.name || 'Unknown Teacher'}</h4>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleDateString() : 'Recent'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {chat.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                          <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                        </button>
                      );
                    }) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <MessageSquare size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
                        <p className="text-gray-400 dark:text-gray-500">No chat history found</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : !selectedTeacher ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <MessageSquare size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 dark:text-gray-500">Select a Teacher to Start Chatting</h3>
                  <button 
                    onClick={() => setActiveTab('teachers')}
                    className="mt-4 px-6 py-2 bg-black dark:bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-emerald-700 transition-all"
                  >
                    Go to Teachers
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-[#1a1a1a]/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold">
                        {selectedTeacher.name?.[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold dark:text-white">{selectedTeacher.name}</h4>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">Online</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedTeacher(null)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all text-gray-400"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfcfc] dark:bg-[#0a0a0a]">
                    {chatLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-gray-300 dark:text-gray-600" />
                      </div>
                    ) : chatMessages.length > 0 ? chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                          msg.senderId === user.uid 
                            ? 'bg-black dark:bg-emerald-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
                        }`}>
                          {msg.type === 'audio' ? (
                            <div className="flex items-center gap-2 min-w-[150px]">
                              {!msg.audioUrl ? (
                                <>
                                  <Loader2 size={14} className="animate-spin opacity-50" />
                                  <span className="text-[10px] font-bold opacity-70 italic">Uploading voice...</span>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => {
                                      const fullUrl = msg.audioUrl.startsWith('http') ? msg.audioUrl : window.location.origin + msg.audioUrl;
                                      
                                      if (playingAudioId === msg.id && audioRef.current) {
                                        audioRef.current.pause();
                                        setPlayingAudioId(null);
                                        return;
                                      }

                                      if (audioRef.current) {
                                        audioRef.current.pause();
                                      }

                                      const audio = new Audio(fullUrl);
                                      audioRef.current = audio;
                                      setPlayingAudioId(msg.id);
                                      
                                      audio.onended = () => setPlayingAudioId(null);
                                      audio.onerror = () => {
                                        setPlayingAudioId(null);
                                        alert('Could not play audio. The format might not be supported by your browser.');
                                      };

                                      audio.play().catch(err => {
                                        console.error('Playback failed:', err);
                                        setPlayingAudioId(null);
                                        alert('Could not play audio. The format might not be supported by your browser.');
                                      });
                                    }}
                                    className={`p-2 rounded-full ${msg.senderId === user.uid ? 'bg-white/20 hover:bg-white/30' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'} transition-all`}
                                  >
                                    {playingAudioId === msg.id ? <Pause size={14} /> : <Play size={14} />}
                                  </button>
                                  <div className="flex-1 h-1 bg-current opacity-20 rounded-full overflow-hidden">
                                    <div className="h-full bg-current w-1/3 animate-pulse" />
                                  </div>
                                  <span className="text-[10px] font-bold opacity-70">Voice</span>
                                </>
                              )}
                            </div>
                          ) : msg.type === 'file' ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <div className="flex items-center gap-3 p-3 bg-white/10 dark:bg-white/5 rounded-xl border border-white/10">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                  <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{msg.fileName || 'Shared File'}</p>
                                  <p className="text-[10px] opacity-60 uppercase tracking-widest">
                                    {msg.fileType?.split('/')[1] || 'Document'}
                                  </p>
                                </div>
                              </div>
                              {msg.fileUrl ? (
                                <a 
                                  href={msg.fileUrl.startsWith('http') ? msg.fileUrl : window.location.origin + msg.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`w-full py-2 rounded-lg text-xs font-bold text-center transition-all ${
                                    msg.senderId === user.uid 
                                      ? 'bg-white text-black hover:bg-gray-100' 
                                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                  }`}
                                >
                                  View / Download
                                </a>
                              ) : (
                                <div className="flex items-center justify-center gap-2 py-2 opacity-50 italic text-xs">
                                  <Loader2 size={12} className="animate-spin" />
                                  Uploading...
                                </div>
                              )}
                            </div>
                          ) : (
                            msg.content
                          )}
                          <p className={`text-[9px] mt-1 opacity-50 ${msg.senderId === user.uid ? 'text-right' : 'text-left'}`}>
                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-12">
                        <p className="text-gray-400 dark:text-gray-500 text-sm">No messages yet. Say hello!</p>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5 dark:border-white/5 bg-white dark:bg-[#111111]">
                    <div className="flex gap-2">
                      <input 
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleSendFileMessage(file);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }
                        }}
                        accept=".pdf,.docx,.txt"
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isRecording}
                        className="p-3 bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 rounded-2xl hover:bg-gray-200 dark:hover:bg-white/5 transition-all disabled:opacity-50"
                        title="Attach File (PDF, DOCX, TXT)"
                      >
                        <Paperclip size={20} />
                      </button>
                      <button 
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5'}`}
                      >
                        {isRecording ? <Square size={20} /> : <Mic size={20} />}
                      </button>
                      <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isRecording ? "Recording voice note..." : "Type your message..."}
                        disabled={isRecording}
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white disabled:opacity-50"
                      />
                      <button 
                        type="submit"
                        disabled={!newMessage.trim() || isRecording}
                        className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm flex flex-col items-center text-center transition-colors duration-300">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mb-6 flex items-center justify-center text-gray-400 dark:text-gray-500 border-4 border-white dark:border-gray-900 shadow-lg overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={48} />
                  )}
                </div>
                <h3 className="text-2xl font-semibold mb-1 dark:text-white">{user.displayName || user.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{user.email}</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider">Active</span>
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold uppercase tracking-wider">Verified</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-6 dark:text-white">Quick Stats</h3>
                <div className="space-y-4">
                  <ProfileStat label="User ID" value={user.uid.substring(0, 8) + '...'} />
                  <ProfileStat label="Role" value={user.role || 'Student'} />
                  <ProfileStat label="Email" value={user.email} />
                  <ProfileStat label="Last Login" value={user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Today'} />
                  <ProfileStat label="Skills Tracked" value={user.skills?.length || 0} />
                </div>
              </div>

              <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm col-span-full transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-6 dark:text-white">Employment Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Status</label>
                    <select 
                      value={user.employmentStatus || 'unemployed'}
                      onChange={(e) => handleUpdateProfile({ employmentStatus: e.target.value })}
                      className="w-full p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                    >
                      <option value="unemployed">Unemployed</option>
                      <option value="employed">Employed</option>
                    </select>
                  </div>
                  {user.employmentStatus === 'employed' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Company Name</label>
                        <input 
                          type="text"
                          value={localCompanyName}
                          onChange={(e) => {
                            setLocalCompanyName(e.target.value);
                            handleUpdateProfile({ companyName: e.target.value });
                          }}
                          placeholder="e.g. Google"
                          className="w-full p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Job Role</label>
                        <input 
                          type="text"
                          value={localJobRole}
                          onChange={(e) => {
                            setLocalJobRole(e.target.value);
                            handleUpdateProfile({ jobRole: e.target.value });
                          }}
                          placeholder="e.g. Software Engineer"
                          className="w-full p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm col-span-full transition-colors duration-300">
                {user.teacherId ? (
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-300">
                        {teachers.find(t => t.uid === user.teacherId)?.name || 'Your Teacher'}
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400">Assigned Mentor</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-500 dark:text-gray-400">You don't have an assigned teacher yet. Apply to a teacher to get personalized guidance:</p>
                    <button 
                      onClick={() => setActiveTab('teachers')}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                      <GraduationCap size={20} />
                      Find a Teacher
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'resume-builder' && (
            <motion.div 
              key="resume-builder"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ResumeBuilder 
                initialProfile={{
                  name: user.displayName || user.name,
                  email: user.email,
                  phone: user.phone,
                  location: user.location,
                  summary: user.careerGoals
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Email Application Modal */}
      <AnimatePresence>
        {isEmailModalOpen && selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#111111] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-black/5 dark:border-white/5 transition-colors duration-300"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg dark:text-white">Apply to {selectedJob.company}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">{selectedJob.title}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEmailModalOpen(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Recruiter Email</label>
                  <input 
                    type="email"
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    className="w-full p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Upload Resume (PDF)</label>
                  <div className="relative">
                    <input 
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label 
                      htmlFor="resume-upload"
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                    >
                      <Paperclip size={20} className="text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {selectedFile ? selectedFile.name : 'Choose PDF file...'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Application Email</label>
                    <button 
                      onClick={() => handleApply(selectedJob)}
                      disabled={loading}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Regenerate with AI
                    </button>
                  </div>
                  <textarea 
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="Write your application email here..."
                    className="w-full min-h-[300px] p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-base leading-relaxed dark:text-white"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-black/5 dark:border-white/5 bg-gray-50 dark:bg-[#1a1a1a] flex gap-4">
                <button 
                  onClick={() => setIsEmailModalOpen(false)}
                  className="flex-1 py-4 bg-white dark:bg-transparent border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSendEmail(selectedFile || undefined)}
                  disabled={sendingEmail || !emailDraft || !recruiterEmail}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-semibold shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {sendingEmail ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                  Send Application
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#111111] border-t border-black/5 dark:border-white/5 p-4 flex justify-around lg:hidden z-20 transition-colors duration-300">
        <MobileNavItem 
          active={activeTab === 'advice'} 
          onClick={() => setActiveTab('advice')}
          icon={<Sparkles size={20} />}
        />
        <MobileNavItem 
          active={activeTab === 'resume'} 
          onClick={() => setActiveTab('resume')}
          icon={<FileText size={20} />}
        />
        <MobileNavItem 
          active={activeTab === 'resume-builder'} 
          onClick={() => setActiveTab('resume-builder')}
          icon={<Layout size={20} />}
        />
        <MobileNavItem 
          active={activeTab === 'jobs'} 
          onClick={() => setActiveTab('jobs')}
          icon={<Search size={20} />}
        />
        <MobileNavItem 
          active={activeTab === 'teachers'} 
          onClick={() => setActiveTab('teachers')}
          icon={<GraduationCap size={20} />}
        />
        <MobileNavItem 
          active={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')}
          icon={<MessageSquare size={20} />}
        />
        <MobileNavItem 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')}
          icon={<User size={20} />}
        />
      </nav>
    </div>
  );
}

function StatCard({ title, value, trend, color }: { title: string, value: string, trend: string, color: 'emerald' | 'blue' }) {
  const colorClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
  };

  return (
    <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm transition-colors duration-300">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">{title}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-3xl font-bold tracking-tight dark:text-white">{value}</h4>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${colorClasses[color]}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors duration-300">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-semibold dark:text-white">{value}</span>
    </div>
  );
}
