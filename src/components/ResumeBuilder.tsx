import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Plus, 
  Trash2, 
  Download, 
  FileText,
  Globe,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  Layout,
  Type,
  Palette,
  Sparkles,
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link: string;
}

interface SkillGroup {
  id: string;
  category: string;
  items: string;
}

interface ResumeData {
  profile: {
    name: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    summary: string;
  };
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  skills: SkillGroup[];
}

const initialData: ResumeData = {
  profile: {
    name: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    summary: '',
  },
  workExperience: [],
  education: [],
  projects: [],
  skills: [],
};

interface ResumeBuilderProps {
  initialProfile?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    summary?: string;
  };
}

export function ResumeBuilder({ initialProfile }: ResumeBuilderProps) {
  const [data, setData] = useState<ResumeData>({
    ...initialData,
    profile: {
      ...initialData.profile,
      name: initialProfile?.name || '',
      email: initialProfile?.email || '',
      phone: initialProfile?.phone || '',
      location: initialProfile?.location || '',
      summary: initialProfile?.summary || '',
    }
  });
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimal'>('modern');
  const [zoom, setZoom] = useState(0.7);
  const previewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [improving, setImproving] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const calculateATSScore = () => {
    let score = 0;
    if (data.profile.name) score += 10;
    if (data.profile.email) score += 5;
    if (data.profile.phone) score += 5;
    if (data.profile.summary) score += 15;
    
    score += Math.min(data.workExperience.length * 10, 25);
    score += Math.min(data.skills.length * 5, 20);
    
    const allExpHaveDesc = data.workExperience.length > 0 && data.workExperience.every(exp => exp.description.trim().length > 0);
    if (allExpHaveDesc) score += 20;
    
    return score;
  };

  const calculateCompletion = () => {
    let count = 0;
    if (data.profile.name) count += 10;
    if (data.profile.email) count += 10;
    if (data.profile.phone) count += 5;
    if (data.profile.summary) count += 15;
    if (data.workExperience.length > 0) count += 20;
    if (data.education.length > 0) count += 15;
    if (data.skills.length > 0) count += 15;
    if (data.projects.length > 0) count += 10;
    return count;
  };

  const handleImproveWithAI = async (text: string, onUpdate: (newText: string) => void, id: string) => {
    if (!text.trim()) return;
    setImproving(id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `You are a professional resume writer. Rewrite the following resume bullet points or summary to be more impactful, using strong action verbs and quantified achievements where possible. Return only the improved text, no explanation.\n\nText: ${text}`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      const improvedText = response.text;
      if (improvedText) {
        onUpdate(improvedText);
        setAiError(null);
      }
    } catch (error) {
      console.error('AI Error:', error);
      setAiError(id);
      setTimeout(() => setAiError(null), 3000);
    } finally {
      setImproving(null);
    }
  };

  const moveItem = (section: keyof Omit<ResumeData, 'profile'>, id: string, direction: 'up' | 'down') => {
    setData(prev => {
      const list = [...(prev[section] as any)];
      const index = list.findIndex(item => item.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= list.length) return prev;
      
      const [movedItem] = list.splice(index, 1);
      list.splice(newIndex, 0, movedItem);
      
      return { ...prev, [section]: list };
    });
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'experience', label: 'Experience', icon: <Briefcase size={18} /> },
    { id: 'education', label: 'Education', icon: <GraduationCap size={18} /> },
    { id: 'skills', label: 'Skills', icon: <Code size={18} /> },
    { id: 'projects', label: 'Projects', icon: <Layout size={18} /> },
  ];

  const updateProfile = (field: keyof ResumeData['profile'], value: string) => {
    setData(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  const addItem = (section: keyof Omit<ResumeData, 'profile'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setData(prev => ({
      ...prev,
      [section]: [...(prev[section] as any), { id, ...(section === 'workExperience' ? { company: '', position: '', location: '', startDate: '', endDate: '', description: '' } : section === 'education' ? { school: '', degree: '', location: '', startDate: '', endDate: '', description: '' } : section === 'projects' ? { name: '', description: '', technologies: '', link: '' } : { category: '', items: '' }) }]
    }));
  };

  const updateItem = (section: keyof Omit<ResumeData, 'profile'>, id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [section]: (prev[section] as any).map((item: any) => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeItem = (section: keyof Omit<ResumeData, 'profile'>, id: string) => {
    setData(prev => ({
      ...prev,
      [section]: (prev[section] as any).filter((item: any) => item.id !== id)
    }));
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    
    try {
      const element = previewRef.current;
      const parent = element.parentElement;
      const originalParentOverflow = parent ? parent.style.overflow : '';
      
      if (parent) parent.style.overflow = 'visible';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc, clonedElement) => {
          const el = clonedElement as HTMLElement;
          el.style.transform = 'scale(1)';
          el.style.transition = 'none';
          el.style.boxShadow = 'none';
          el.style.margin = '0';
          el.style.display = 'block';
          el.style.visibility = 'visible';
          el.style.position = 'relative';
          el.style.left = '0';
          el.style.top = '0';
          
          let p = el.parentElement;
          while (p) {
            p.style.display = 'block';
            p.style.visibility = 'visible';
            p.style.overflow = 'visible';
            p = p.parentElement;
          }
        }
      });

      if (parent) parent.style.overflow = originalParentOverflow;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width || 1;
      const canvasHeight = canvas.height || 1;
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;
      
      let heightLeft = imgHeight;
      let pageCount = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        pageCount++;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -(pdfHeight * pageCount), imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`${data.profile.name || 'resume'}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const loadSampleData = () => {
    setData({
      profile: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1 (555) 000-1234',
        location: 'San Francisco, CA',
        website: 'linkedin.com/in/janesmith',
        summary: 'Dedicated Software Engineer with 5+ years of experience in building scalable web applications. Proficient in React, Node.js, and cloud technologies. Passionate about creating intuitive user experiences and mentoring junior developers.',
      },
      workExperience: [
        {
          id: '1',
          company: 'Tech Innovations Inc.',
          position: 'Senior Frontend Developer',
          location: 'San Francisco, CA',
          startDate: 'Jan 2021',
          endDate: 'Present',
          description: '• Led the development of a high-traffic e-commerce platform using React and Next.js.\n• Optimized application performance, reducing load times by 40%.\n• Mentored a team of 5 junior developers and conducted code reviews.',
        },
        {
          id: '2',
          company: 'Creative Solutions',
          position: 'Full Stack Engineer',
          location: 'Austin, TX',
          startDate: 'Jun 2018',
          endDate: 'Dec 2020',
          description: '• Developed and maintained RESTful APIs using Node.js and Express.\n• Implemented responsive UI components using Tailwind CSS.\n• Collaborated with designers to translate wireframes into functional code.',
        }
      ],
      education: [
        {
          id: '1',
          school: 'University of California, Berkeley',
          degree: 'B.S. in Computer Science',
          location: 'Berkeley, CA',
          startDate: '2014',
          endDate: '2018',
          description: 'GPA: 3.8/4.0. Relevant coursework: Data Structures, Algorithms, Web Development.',
        }
      ],
      projects: [
        {
          id: '1',
          name: 'OpenResume Clone',
          description: 'A real-time resume builder with PDF export functionality.',
          technologies: 'React, TypeScript, Tailwind CSS, jsPDF',
          link: 'github.com/janesmith/openresume',
        }
      ],
      skills: [
        {
          id: '1',
          category: 'Languages',
          items: 'JavaScript (ES6+), TypeScript, Python, SQL',
        },
        {
          id: '2',
          category: 'Frameworks',
          items: 'React, Node.js, Express, Next.js, Tailwind CSS',
        }
      ],
    });
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all data?')) {
      setData(initialData);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-gray-50/50 dark:bg-[#0a0a0a] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#111111] z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-xl">
            <Palette size={14} className="text-gray-400" />
            <select 
              value={template}
              onChange={(e) => setTemplate(e.target.value as any)}
              className="bg-transparent border-none text-xs font-bold dark:text-white focus:ring-0 outline-none cursor-pointer"
            >
              <option value="modern">Modern Template</option>
              <option value="classic">Classic Template</option>
              <option value="minimal">Minimal Template</option>
            </select>
          </div>
          <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
          <div className="flex items-center gap-2">
            <button 
              onClick={loadSampleData}
              className="px-3 py-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
            >
              Load Sample
            </button>
            <button 
              onClick={clearAll}
              className="px-3 py-1.5 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Zoom</span>
            <input 
              type="range" 
              min="0.4" 
              max="1.2" 
              step="0.1" 
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-24 accent-emerald-500"
            />
            <span className="text-[10px] font-bold text-gray-500 w-8">{Math.round(zoom * 100)}%</span>
          </div>
          <button 
            onClick={downloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {downloading ? <span className="animate-spin">⌛</span> : <Download size={18} />}
            Download PDF
          </button>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div className="px-4 pb-4 bg-white dark:bg-[#111111] border-b border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${calculateCompletion()}%` }}
            />
          </div>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest w-12">{calculateCompletion()}%</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-20 md:w-64 border-r border-black/5 dark:border-white/5 bg-white dark:bg-[#111111] flex flex-col p-4 gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                activeSection === section.id 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                  : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <div className={`p-2 rounded-xl ${activeSection === section.id ? 'bg-white dark:bg-[#1a1a1a] shadow-sm' : ''}`}>
                {section.icon}
              </div>
              <span className="hidden md:block font-bold text-sm">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-[#111111]">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            {activeSection === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black dark:text-white mb-1">Personal Information</h3>
                  <p className="text-sm text-gray-500">How can employers reach you?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" value={data.profile.name} onChange={v => updateProfile('name', v)} />
                  <Input label="Email" value={data.profile.email} onChange={v => updateProfile('email', v)} />
                  <Input label="Phone" value={data.profile.phone} onChange={v => updateProfile('phone', v)} />
                  <Input label="Location" value={data.profile.location} onChange={v => updateProfile('location', v)} />
                  <Input label="Website/LinkedIn" value={data.profile.website} onChange={v => updateProfile('website', v)} className="md:col-span-2" />
                  <div className="md:col-span-2">
                    <Textarea 
                      label="Professional Summary"
                      value={data.profile.summary}
                      onChange={v => updateProfile('summary', v)}
                      placeholder="Write a brief overview of your professional background and goals..."
                      onImprove={() => handleImproveWithAI(data.profile.summary, (v) => updateProfile('summary', v), 'summary')}
                      improving={improving === 'summary'}
                      id="summary"
                      error={aiError === 'summary'}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'experience' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black dark:text-white mb-1">Work Experience</h3>
                  <p className="text-sm text-gray-500">Your professional journey and achievements.</p>
                </div>
                <div className="space-y-6">
                  {data.workExperience.map((item, index) => (
                    <div key={item.id} className="p-6 bg-gray-50 dark:bg-[#1a1a1a] rounded-3xl space-y-6 relative group border border-transparent hover:border-emerald-500/20 transition-all">
                      <div className="absolute top-6 right-6 flex items-center gap-2">
                        <ReorderButtons 
                          onMoveUp={() => moveItem('workExperience', item.id, 'up')}
                          onMoveDown={() => moveItem('workExperience', item.id, 'down')}
                          isFirst={index === 0}
                          isLast={index === data.workExperience.length - 1}
                        />
                        <button 
                          onClick={() => removeItem('workExperience', item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Company" value={item.company} onChange={v => updateItem('workExperience', item.id, 'company', v)} />
                        <Input label="Position" value={item.position} onChange={v => updateItem('workExperience', item.id, 'position', v)} />
                        <Input label="Location" value={item.location} onChange={v => updateItem('workExperience', item.id, 'location', v)} />
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Start Date" value={item.startDate} onChange={v => updateItem('workExperience', item.id, 'startDate', v)} />
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">End Date</label>
                              <button 
                                onClick={() => updateItem('workExperience', item.id, 'endDate', item.endDate === 'Present' ? '' : 'Present')}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 transition-all"
                              >
                                {item.endDate === 'Present' ? <CheckSquare size={12} /> : <Square size={12} />}
                                Current
                              </button>
                            </div>
                            <input 
                              type="text"
                              value={item.endDate}
                              disabled={item.endDate === 'Present'}
                              onChange={e => updateItem('workExperience', item.id, 'endDate', e.target.value)}
                              placeholder={item.endDate === 'Present' ? 'Present' : ''}
                              className="w-full p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white text-sm disabled:opacity-50"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Textarea 
                            label="Description"
                            value={item.description}
                            onChange={v => updateItem('workExperience', item.id, 'description', v)}
                            placeholder="Describe your key responsibilities and achievements..."
                            onImprove={() => handleImproveWithAI(item.description, (v) => updateItem('workExperience', item.id, 'description', v), item.id)}
                            improving={improving === item.id}
                            id={item.id}
                            error={aiError === item.id}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => addItem('workExperience')}
                    className="w-full py-4 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl text-gray-400 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                  >
                    <Plus size={18} /> Add Experience
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'education' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black dark:text-white mb-1">Education</h3>
                  <p className="text-sm text-gray-500">Your academic background.</p>
                </div>
                <div className="space-y-6">
                  {data.education.map((item, index) => (
                    <div key={item.id} className="p-6 bg-gray-50 dark:bg-[#1a1a1a] rounded-3xl space-y-6 relative group border border-transparent hover:border-emerald-500/20 transition-all">
                      <div className="absolute top-6 right-6 flex items-center gap-2">
                        <ReorderButtons 
                          onMoveUp={() => moveItem('education', item.id, 'up')}
                          onMoveDown={() => moveItem('education', item.id, 'down')}
                          isFirst={index === 0}
                          isLast={index === data.education.length - 1}
                        />
                        <button 
                          onClick={() => removeItem('education', item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="School" value={item.school} onChange={v => updateItem('education', item.id, 'school', v)} />
                        <Input label="Degree" value={item.degree} onChange={v => updateItem('education', item.id, 'degree', v)} />
                        <Input label="Location" value={item.location} onChange={v => updateItem('education', item.id, 'location', v)} />
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Start Date" value={item.startDate} onChange={v => updateItem('education', item.id, 'startDate', v)} />
                          <Input label="End Date" value={item.endDate} onChange={v => updateItem('education', item.id, 'endDate', v)} />
                        </div>
                        <div className="md:col-span-2">
                          <Textarea 
                            label="Description"
                            value={item.description}
                            onChange={v => updateItem('education', item.id, 'description', v)}
                            placeholder="Describe your academic achievements, GPA, or relevant coursework..."
                            onImprove={() => handleImproveWithAI(item.description, (v) => updateItem('education', item.id, 'description', v), item.id)}
                            improving={improving === item.id}
                            id={item.id}
                            error={aiError === item.id}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => addItem('education')}
                    className="w-full py-4 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl text-gray-400 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                  >
                    <Plus size={18} /> Add Education
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'skills' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black dark:text-white mb-1">Skills</h3>
                  <p className="text-sm text-gray-500">Group your skills by category.</p>
                </div>
                <div className="space-y-6">
                  {data.skills.map((item, index) => (
                    <div key={item.id} className="p-6 bg-gray-50 dark:bg-[#1a1a1a] rounded-3xl space-y-6 relative group border border-transparent hover:border-emerald-500/20 transition-all">
                      <div className="absolute top-6 right-6 flex items-center gap-2">
                        <ReorderButtons 
                          onMoveUp={() => moveItem('skills', item.id, 'up')}
                          onMoveDown={() => moveItem('skills', item.id, 'down')}
                          isFirst={index === 0}
                          isLast={index === data.skills.length - 1}
                        />
                        <button 
                          onClick={() => removeItem('skills', item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="space-y-6">
                        <Input label="Category (e.g. Languages)" value={item.category} onChange={v => updateItem('skills', item.id, 'category', v)} />
                        <Input label="Items (comma separated)" value={item.items} onChange={v => updateItem('skills', item.id, 'items', v)} />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => addItem('skills')}
                    className="w-full py-4 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl text-gray-400 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                  >
                    <Plus size={18} /> Add Skill Group
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'projects' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black dark:text-white mb-1">Projects</h3>
                  <p className="text-sm text-gray-500">Showcase your best work.</p>
                </div>
                <div className="space-y-6">
                  {data.projects.map((item, index) => (
                    <div key={item.id} className="p-6 bg-gray-50 dark:bg-[#1a1a1a] rounded-3xl space-y-6 relative group border border-transparent hover:border-emerald-500/20 transition-all">
                      <div className="absolute top-6 right-6 flex items-center gap-2">
                        <ReorderButtons 
                          onMoveUp={() => moveItem('projects', item.id, 'up')}
                          onMoveDown={() => moveItem('projects', item.id, 'down')}
                          isFirst={index === 0}
                          isLast={index === data.projects.length - 1}
                        />
                        <button 
                          onClick={() => removeItem('projects', item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Project Name" value={item.name} onChange={v => updateItem('projects', item.id, 'name', v)} />
                        <Input label="Link" value={item.link} onChange={v => updateItem('projects', item.id, 'link', v)} />
                        <Input label="Technologies" value={item.technologies} onChange={v => updateItem('projects', item.id, 'technologies', v)} className="md:col-span-2" />
                        <div className="md:col-span-2">
                          <Textarea 
                            label="Description"
                            value={item.description}
                            onChange={v => updateItem('projects', item.id, 'description', v)}
                            placeholder="Describe what you built and your role..."
                            onImprove={() => handleImproveWithAI(item.description, (v) => updateItem('projects', item.id, 'description', v), item.id)}
                            improving={improving === item.id}
                            id={item.id}
                            error={aiError === item.id}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => addItem('projects')}
                    className="w-full py-4 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl text-gray-400 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                  >
                    <Plus size={18} /> Add Project
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Preview Section */}
        <div className="hidden lg:flex flex-1 bg-gray-100 dark:bg-[#0a0a0a] overflow-hidden relative border-l border-black/5 dark:border-white/5">
          {/* ATS Score Badge */}
          <div className="absolute top-6 right-6 z-20">
            <div className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl border backdrop-blur-md flex items-center gap-2 ${
              calculateATSScore() < 40 
                ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                : calculateATSScore() < 70 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                calculateATSScore() < 40 ? 'bg-red-500' : calculateATSScore() < 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              ATS Score: {calculateATSScore()}
            </div>
          </div>

          {/* Desk Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <div className="flex-1 overflow-auto p-12 flex justify-center items-start custom-scrollbar">
            <div 
              ref={previewRef}
              className={`bg-white text-black shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] origin-top transition-transform duration-300 ease-out ${
                template === 'classic' ? 'font-serif' : 'font-sans'
              }`}
              style={{ 
                width: '210mm', 
                minHeight: '297mm', 
                padding: '20mm',
                transform: `scale(${zoom})`,
                marginBottom: '100px'
              }}
            >
          {template === 'modern' && (
            <>
              {/* Modern Header */}
              <header className="border-b-4 pb-6 mb-8" style={{ borderBottomColor: '#10b981' }}>
                <h1 className="text-4xl font-black tracking-tight mb-2 uppercase" style={{ color: '#111827' }}>{data.profile.name || 'Your Name'}</h1>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium" style={{ color: '#4b5563' }}>
                  {data.profile.email && <span className="flex items-center gap-1.5"><Mail size={14} style={{ color: '#059669' }} /> {data.profile.email}</span>}
                  {data.profile.phone && <span className="flex items-center gap-1.5"><Phone size={14} style={{ color: '#059669' }} /> {data.profile.phone}</span>}
                  {data.profile.location && <span className="flex items-center gap-1.5"><MapPin size={14} style={{ color: '#059669' }} /> {data.profile.location}</span>}
                  {data.profile.website && <span className="flex items-center gap-1.5"><Globe size={14} style={{ color: '#059669' }} /> {data.profile.website}</span>}
                </div>
              </header>

              {/* Modern Summary */}
              {data.profile.summary && (
                <section className="mb-8">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#059669' }}>Professional Summary</h2>
                  <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{data.profile.summary}</p>
                </section>
              )}

              {/* Modern Experience */}
              {data.workExperience.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-4" style={{ color: '#059669' }}>Work Experience</h2>
                  <div className="space-y-6">
                    {data.workExperience.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-bold text-base" style={{ color: '#111827' }}>{exp.position}</h3>
                          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>{exp.startDate} — {exp.endDate}</span>
                        </div>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="font-bold text-sm" style={{ color: '#374151' }}>{exp.company}</span>
                          <span className="text-xs italic" style={{ color: '#6b7280' }}>{exp.location}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#4b5563' }}>{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Modern Education */}
              {data.education.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-4" style={{ color: '#059669' }}>Education</h2>
                  <div className="space-y-4">
                    {data.education.map((edu) => (
                      <div key={edu.id}>
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-bold text-base" style={{ color: '#111827' }}>{edu.school}</h3>
                          <span className="text-xs font-bold" style={{ color: '#6b7280' }}>{edu.startDate} — {edu.endDate}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium" style={{ color: '#374151' }}>{edu.degree}</span>
                          <span className="text-xs italic" style={{ color: '#6b7280' }}>{edu.location}</span>
                        </div>
                        {edu.description && <p className="text-xs mt-2 leading-relaxed" style={{ color: '#4b5563' }}>{edu.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-2 gap-8">
                {/* Modern Skills */}
                {data.skills.length > 0 && (
                  <section>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#059669' }}>Skills</h2>
                    <div className="space-y-3">
                      {data.skills.map((skill) => (
                        <div key={skill.id} className="text-sm">
                          <p className="font-bold mb-1" style={{ color: '#1f2937' }}>{skill.category}</p>
                          <p className="leading-relaxed" style={{ color: '#4b5563' }}>{skill.items}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Modern Projects */}
                {data.projects.length > 0 && (
                  <section>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-4" style={{ color: '#059669' }}>Projects</h2>
                    <div className="space-y-4">
                      {data.projects.map((project) => (
                        <div key={project.id}>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-sm" style={{ color: '#111827' }}>{project.name}</h3>
                          </div>
                          <p className="text-[10px] font-black mb-1 uppercase tracking-wider" style={{ color: '#059669' }}>{project.technologies}</p>
                          <p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>{project.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}

          {template === 'classic' && (
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>{data.profile.name || 'Your Name'}</h1>
              <div className="flex justify-center gap-3 text-sm mb-6 italic" style={{ color: '#374151' }}>
                {[data.profile.email, data.profile.phone, data.profile.location, data.profile.website]
                  .filter(Boolean)
                  .map((field, i, arr) => (
                    <React.Fragment key={i}>
                      <span>{field}</span>
                      {i < arr.length - 1 && <span>•</span>}
                    </React.Fragment>
                  ))}
              </div>
              
              <div className="text-left space-y-8">
                {data.profile.summary && (
                  <section>
                    <h2 className="text-lg font-bold border-b mb-2" style={{ borderBottomColor: '#1f2937', color: '#000000' }}>Summary</h2>
                    <p className="text-sm leading-relaxed" style={{ color: '#000000' }}>{data.profile.summary}</p>
                  </section>
                )}

                {data.workExperience.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold border-b mb-4" style={{ borderBottomColor: '#1f2937', color: '#000000' }}>Experience</h2>
                    <div className="space-y-6">
                      {data.workExperience.map((exp) => (
                        <div key={exp.id}>
                          <div className="flex justify-between font-bold" style={{ color: '#000000' }}>
                            <span>{exp.company}</span>
                            <span>{exp.startDate} - {exp.endDate}</span>
                          </div>
                          <div className="flex justify-between italic mb-2" style={{ color: '#374151' }}>
                            <span>{exp.position}</span>
                            <span>{exp.location}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: '#000000' }}>{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {data.education.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold border-b mb-4" style={{ borderBottomColor: '#1f2937', color: '#000000' }}>Education</h2>
                    {data.education.map((edu) => (
                      <div key={edu.id} className="mb-4">
                        <div className="flex justify-between font-bold" style={{ color: '#000000' }}>
                          <span>{edu.school}</span>
                          <span>{edu.startDate} - {edu.endDate}</span>
                        </div>
                        <div className="flex justify-between italic" style={{ color: '#374151' }}>
                          <span>{edu.degree}</span>
                          <span>{edu.location}</span>
                        </div>
                        {edu.description && <p className="text-sm mt-1" style={{ color: '#000000' }}>{edu.description}</p>}
                      </div>
                    ))}
                  </section>
                )}

                {data.skills.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold border-b mb-4" style={{ borderBottomColor: '#1f2937', color: '#000000' }}>Skills</h2>
                    <div className="space-y-2">
                      {data.skills.map((skill) => (
                        <div key={skill.id} className="text-sm">
                          <span className="font-bold">{skill.category}: </span>
                          <span>{skill.items}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {data.projects.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold border-b mb-4" style={{ borderBottomColor: '#1f2937', color: '#000000' }}>Projects</h2>
                    <div className="space-y-4">
                      {data.projects.map((project) => (
                        <div key={project.id}>
                          <div className="flex justify-between font-bold" style={{ color: '#000000' }}>
                            <span>{project.name}</span>
                            {project.link && <span className="text-xs font-normal">{project.link}</span>}
                          </div>
                          <p className="text-xs italic mb-1" style={{ color: '#374151' }}>{project.technologies}</p>
                          <p className="text-sm" style={{ color: '#000000' }}>{project.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}

          {template === 'minimal' && (
            <div className="space-y-10">
              <header>
                <h1 className="text-5xl font-light tracking-tighter mb-4" style={{ color: '#000000' }}>{data.profile.name || 'Your Name'}</h1>
                <div className="flex gap-6 text-xs font-medium uppercase tracking-widest" style={{ color: '#9ca3af' }}>
                  <span>{data.profile.email}</span>
                  <span>{data.profile.phone}</span>
                  <span>{data.profile.location}</span>
                </div>
              </header>

              <div className="grid grid-cols-12 gap-12">
                <div className="col-span-4 space-y-10">
                  {data.skills.length > 0 && (
                    <section>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: '#d1d5db' }}>Skills</h2>
                      <div className="space-y-4">
                        {data.skills.map(s => (
                          <div key={s.id}>
                            <p className="text-xs font-bold mb-1" style={{ color: '#000000' }}>{s.category}</p>
                            <p className="text-[10px] leading-relaxed" style={{ color: '#6b7280' }}>{s.items}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  {data.education.length > 0 && (
                    <section>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: '#d1d5db' }}>Education</h2>
                      <div className="space-y-4">
                        {data.education.map(edu => (
                          <div key={edu.id}>
                            <p className="text-xs font-bold" style={{ color: '#000000' }}>{edu.school}</p>
                            <p className="text-[10px]" style={{ color: '#6b7280' }}>{edu.degree}</p>
                            <p className="text-[9px] mt-1" style={{ color: '#9ca3af' }}>{edu.startDate} - {edu.endDate}</p>
                            {edu.description && <p className="text-[9px] mt-2 leading-relaxed" style={{ color: '#4b5563' }}>{edu.description}</p>}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="col-span-8 space-y-10">
                  {data.profile.summary && (
                    <section>
                      <p className="text-sm leading-relaxed italic border-l-2 pl-6" style={{ color: '#4b5563', borderLeftColor: '#f3f4f6' }}>{data.profile.summary}</p>
                    </section>
                  )}
                  {data.workExperience.length > 0 && (
                    <section>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6" style={{ color: '#d1d5db' }}>Experience</h2>
                      <div className="space-y-8">
                        {data.workExperience.map(exp => (
                          <div key={exp.id} className="relative pl-6 border-l" style={{ borderLeftColor: '#f9fafb' }}>
                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#e5e7eb' }} />
                            <div className="flex justify-between items-baseline mb-1">
                              <h3 className="text-sm font-bold" style={{ color: '#000000' }}>{exp.position}</h3>
                              <span className="text-[10px]" style={{ color: '#9ca3af' }}>{exp.startDate} - {exp.endDate}</span>
                            </div>
                            <p className="text-xs font-medium mb-3" style={{ color: '#6b7280' }}>{exp.company}</p>
                            <p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {data.projects.length > 0 && (
                    <section>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6" style={{ color: '#d1d5db' }}>Projects</h2>
                      <div className="space-y-8">
                        {data.projects.map(project => (
                          <div key={project.id} className="relative pl-6 border-l" style={{ borderLeftColor: '#f9fafb' }}>
                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#e5e7eb' }} />
                            <div className="flex justify-between items-baseline mb-1">
                              <h3 className="text-sm font-bold" style={{ color: '#000000' }}>{project.name}</h3>
                            </div>
                            <p className="text-[10px] font-black mb-2 uppercase tracking-wider" style={{ color: '#9ca3af' }}>{project.technologies}</p>
                            <p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>{project.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
  );
}

function Input({ label, value, onChange, className = "" }: { label: string, value: string, onChange: (v: string) => void, className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</label>
      <input 
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white text-sm"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, onImprove, improving, id, error }: { 
  label: string, 
  value: string, 
  onChange: (v: string) => void, 
  placeholder?: string,
  onImprove?: () => void,
  improving?: boolean,
  id: string,
  error?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</label>
        <div className="flex items-center gap-3">
          {error && <span className="text-[10px] font-bold text-red-500 animate-pulse">AI Failed</span>}
          {onImprove && (
            <button 
              onClick={onImprove}
              disabled={improving || !value.trim()}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-600 disabled:opacity-50 transition-all"
            >
              {improving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Improve with AI
            </button>
          )}
        </div>
      </div>
      <textarea 
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border-none focus:ring-2 focus:ring-emerald-500/20 min-h-[120px] dark:text-white text-sm transition-all"
      />
    </div>
  );
}

function ReorderButtons({ onMoveUp, onMoveDown, isFirst, isLast }: { onMoveUp: () => void, onMoveDown: () => void, isFirst: boolean, isLast: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <button 
        onClick={onMoveUp}
        disabled={isFirst}
        className="p-1.5 text-gray-400 hover:text-emerald-500 disabled:opacity-20 transition-all"
      >
        <ChevronUp size={16} />
      </button>
      <button 
        onClick={onMoveDown}
        disabled={isLast}
        className="p-1.5 text-gray-400 hover:text-emerald-500 disabled:opacity-20 transition-all"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
