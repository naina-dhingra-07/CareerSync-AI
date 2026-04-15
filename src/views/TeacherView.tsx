import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  User, 
  Users,
  LogOut,
  MessageSquare,
  ChevronRight,
  Send,
  Play,
  Pause,
  Loader2,
  X,
  Sun,
  Moon,
  Mic,
  Square,
  BadgeCheck,
  GraduationCap,
  Trophy,
  Building2,
  Trash2,
  Paperclip,
  FileText
} from 'lucide-react';
import { NavItem, MobileNavItem } from '../components/Navigation';

interface TeacherViewProps {
  user: any;
  theme: string;
  toggleTheme: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  logout: () => void;
  students: any[];
  teacherRequests: any[];
  handleRequestAction: (requestId: string, studentId: string, action: 'approved' | 'denied') => void;
  setSelectedTeacher: (student: any) => void;
  selectedTeacher: any;
  chatMessages: any[];
  chatLoading: boolean;
  newMessage: string;
  setNewMessage: (val: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  handleSendAudioMessage: (blob: Blob) => void;
  handleSendFileMessage: (file: File) => void;
  handleUpdateProfile: (data: any) => void;
  handleClearChat: () => void;
  chats: any[];
}

export function TeacherView(props: TeacherViewProps) {
  const { 
    user, theme, toggleTheme, activeTab, setActiveTab, logout, 
    students, teacherRequests, handleRequestAction, setSelectedTeacher, selectedTeacher,
    chatMessages, chatLoading, newMessage, setNewMessage, handleSendMessage,
    handleSendAudioMessage, handleSendFileMessage, handleUpdateProfile, handleClearChat,
    chats
  } = props;

  const [isRecording, setIsRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [playingAudioId, setPlayingAudioId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  
  // Local state for profile fields to ensure smooth typing
  const [localQualifications, setLocalQualifications] = React.useState(user.qualifications || '');
  const [localAchievements, setLocalAchievements] = React.useState(user.achievements || '');

  // Update local state when user prop changes (e.g. on initial load or if updated from elsewhere)
  React.useEffect(() => {
    setLocalQualifications(user.qualifications || '');
  }, [user.qualifications]);

  React.useEffect(() => {
    setLocalAchievements(user.achievements || '');
  }, [user.achievements]);

  // Reset history when tab changes
  React.useEffect(() => {
    setShowHistory(false);
  }, [activeTab]);
  const audioChunksRef = React.useRef<Blob[]>([]);
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

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a] text-[#1a1a1a] dark:text-[#f5f5f5] font-sans selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-[#111111] border-r border-black/5 dark:border-white/5 p-6 hidden lg:flex flex-col z-10">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
            <Briefcase size={22} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight dark:text-white">CareerSync Pro</h1>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')}
            icon={<Users size={18} />}
            label="My Students"
            badge={teacherRequests.length}
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

        <div className="mt-auto space-y-2">
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
              className="text-3xl md:text-4xl font-semibold tracking-tight mb-2 dark:text-white"
            >
              {activeTab === 'students' && "Your Students"}
              {activeTab === 'chat' && (selectedTeacher ? `Chat with ${selectedTeacher.name}` : "Student Consultations")}
              {activeTab === 'profile' && "Your Professional Profile"}
            </motion.h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {activeTab === 'students' && "Manage and guide your assigned students."}
              {activeTab === 'chat' && (selectedTeacher ? "Provide guidance to your student." : "Connect with your students.")}
              {activeTab === 'profile' && "Manage your professional information."}
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
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                showHistory 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              {showHistory ? 'Back' : 'History'}
            </button>
            <button 
              onClick={() => {
                setShowHistory(false);
                if (activeTab === 'chat') setSelectedTeacher(null);
              }}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all"
            >
              New Session
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'students' && (
            <motion.div 
              key="students"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              {/* Pending Requests */}
              {teacherRequests.length > 0 && (
                <section>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 dark:text-white">
                    <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                    Pending Student Requests
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teacherRequests.map((request: any) => (
                      <div key={request.id} className="bg-white dark:bg-[#111111] p-6 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30 shadow-sm transition-colors duration-300">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl">
                            {request.studentName?.[0] || 'S'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg dark:text-white">{request.studentName}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{request.studentEmail}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleRequestAction(request.id, request.studentId, 'approved')}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRequestAction(request.id, request.studentId, 'denied')}
                            className="flex-1 py-2 bg-white dark:bg-transparent border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* My Students */}
              <section>
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 dark:text-white">
                  <Users size={20} className="text-gray-400 dark:text-gray-500" />
                  My Assigned Students
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {students.length > 0 ? students.map((student: any) => (
                    <div key={student.uid} className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl">
                          {student.name?.[0] || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg dark:text-white">{student.name}</h3>
                            {student.employmentStatus === 'employed' ? (
                              <div className="group relative">
                                <BadgeCheck size={16} className="text-emerald-500" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Building2 size={10} />
                                    <span className="font-bold uppercase tracking-widest">{student.companyName}</span>
                                  </div>
                                  <p className="opacity-70">{student.jobRole}</p>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black" />
                                </div>
                              </div>
                            ) : student.isMessagingOnly ? (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest">Messaging</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-widest">Unemployed</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedTeacher(student); // Reusing state for chat partner
                          setActiveTab('chat');
                        }}
                        className="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={16} />
                        Chat with Student
                      </button>
                    </div>
                  )) : (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-[#1a1a1a] rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors duration-300">
                      <p className="text-gray-400 dark:text-gray-500">No students assigned to you yet.</p>
                    </div>
                  )}
                </div>
              </section>
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
                      const student = students.find(s => s.uid === otherParticipantId);
                      
                      return (
                        <button
                          key={chat.id}
                          onClick={() => {
                            if (student) {
                              setSelectedTeacher(student);
                              setShowHistory(false);
                            }
                          }}
                          className="w-full p-4 flex items-center gap-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-left group"
                        >
                          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            {student?.name?.charAt(0) || <User size={24} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold dark:text-white truncate">{student?.name || 'Unknown Student'}</h4>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleDateString() : 'Recent'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {chat.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                          <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
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
                  <MessageSquare size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 dark:text-gray-500">Select a Student to Start Chatting</h3>
                  <button 
                    onClick={() => setActiveTab('students')}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
                  >
                    Go to Students
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                        {selectedTeacher.name?.[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold dark:text-white">{selectedTeacher.name}</h4>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={handleClearChat}
                        title="Clear Chat"
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button 
                        onClick={() => setSelectedTeacher(null)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all text-gray-400"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfcfc] dark:bg-[#0a0a0a]">
                    {chatLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-gray-300 dark:text-gray-700" />
                      </div>
                    ) : chatMessages.length > 0 ? chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                          msg.senderId === user.uid 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
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
                                    className={`p-2 rounded-full ${msg.senderId === user.uid ? 'bg-white/20 hover:bg-white/30' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'} transition-all`}
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
                                      : 'bg-indigo-500 text-white hover:bg-indigo-600'
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
                        <p className="text-gray-400 dark:text-gray-600 text-sm">No messages yet. Say hello!</p>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5 dark:border-white/5 bg-white dark:bg-[#111111] transition-colors duration-300">
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
                        className="p-3 bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5 transition-all disabled:opacity-50"
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
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white disabled:opacity-50"
                      />
                      <button 
                        type="submit"
                        disabled={!newMessage.trim() || isRecording}
                        className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
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
                <div className="w-24 h-24 bg-gray-100 dark:bg-[#1a1a1a] rounded-full mb-6 flex items-center justify-center text-gray-400 border-4 border-white dark:border-[#111111] shadow-lg overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={48} />
                  )}
                </div>
                <h3 className="text-2xl font-semibold mb-1 dark:text-white">{user.displayName || user.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{user.email}</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider">Active</span>
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold uppercase tracking-wider">Verified</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-6 dark:text-white">Quick Stats</h3>
                <div className="space-y-4">
                  <ProfileStat label="User ID" value={user.uid.substring(0, 8) + '...'} />
                  <ProfileStat label="Role" value={user.role || 'Teacher'} />
                  <ProfileStat label="Email" value={user.email} />
                  <ProfileStat label="Last Login" value={user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Today'} />
                </div>
              </div>

              <div className="bg-white dark:bg-[#111111] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm col-span-full transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-6 dark:text-white">Professional Details</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                      <GraduationCap size={14} />
                      Educational Qualifications
                    </label>
                    <textarea 
                      value={localQualifications}
                      onChange={(e) => {
                        setLocalQualifications(e.target.value);
                        handleUpdateProfile({ qualifications: e.target.value });
                      }}
                      placeholder="Mention your degrees, certifications, and academic background..."
                      className="w-full min-h-[100px] p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                      <Trophy size={14} />
                      Achievements
                    </label>
                    <textarea 
                      value={localAchievements}
                      onChange={(e) => {
                        setLocalAchievements(e.target.value);
                        handleUpdateProfile({ achievements: e.target.value });
                      }}
                      placeholder="List your key professional achievements, awards, and milestones..."
                      className="w-full min-h-[100px] p-4 bg-gray-50 dark:bg-[#1a1a1a] border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#111111] border-t border-black/5 dark:border-white/5 p-4 flex justify-around lg:hidden z-20 transition-colors duration-300">
        <MobileNavItem 
          active={activeTab === 'students'} 
          onClick={() => setActiveTab('students')}
          icon={<Users size={20} />}
          badge={teacherRequests.length}
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

function ProfileStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors duration-300">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-semibold dark:text-white">{value}</span>
    </div>
  );
}
