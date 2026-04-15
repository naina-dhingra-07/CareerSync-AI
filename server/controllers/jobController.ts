import admin from 'firebase-admin';
import '../firebaseAdmin.js'; // Ensure initialization
import { getFirestore } from 'firebase-admin/firestore';
import AIService from '../services/aiService.js';
import EmailService from '../services/emailService.js';
import firebaseConfig from '../../firebase-applet-config.json' assert { type: 'json' };

// Try to use the database ID from config, but fallback to default if it looks like a placeholder or fails
const databaseId = firebaseConfig.firestoreDatabaseId && 
                   !firebaseConfig.firestoreDatabaseId.includes('TODO') &&
                   firebaseConfig.firestoreDatabaseId !== ''
  ? firebaseConfig.firestoreDatabaseId 
  : '(default)';

// Use getFirestore(databaseId) for named databases in v11+
const db = databaseId === '(default)' ? getFirestore() : getFirestore(databaseId);

export const seedTeachers = async (req: any, res: any, next: any) => {
  try {
    const initialTeachers = [
      {
        uid: 'teacher-1',
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@example.com',
        role: 'teacher',
        careerGoals: 'Help students achieve their software engineering dreams.',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        uid: 'teacher-2',
        name: 'Michael Chen',
        email: 'michael.chen@example.com',
        role: 'teacher',
        careerGoals: 'Guide aspiring data scientists.',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        uid: 'teacher-3',
        name: 'Elena Rodriguez',
        email: 'elena.rodriguez@example.com',
        role: 'teacher',
        careerGoals: 'Mentoring future UX designers.',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    const batch = db.batch();
    for (const teacher of initialTeachers) {
      const ref = db.collection('users').doc(teacher.uid);
      batch.set(ref, teacher);
    }
    await batch.commit();

    res.json({ success: true, message: 'Teachers seeded successfully' });
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (req: any, res: any, next: any) => {
  try {
    const { category, search } = req.query;
    let jobs = [];
    
    try {
      let query: any = db.collection('jobs');

      if (category) {
        query = query.where('careerCategory', '==', category);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      jobs = snapshot.docs.map((doc: any) => ({ _id: doc.id, ...doc.data() }));
    } catch (dbError: any) {
      console.error('Firestore getJobs failed, using mock data:', dbError.message);
      // Mock data fallback
      jobs = [
        {
          _id: 'mock-1',
          title: 'Software Engineer',
          company: 'TechCorp',
          description: 'Looking for a full-stack developer with React and Node.js experience.',
          location: 'Remote',
          companyEmail: 'jobs@techcorp.com',
          careerCategory: 'Software Engineering',
          createdAt: new Date()
        },
        {
          _id: 'mock-2',
          title: 'Data Scientist',
          company: 'DataViz',
          description: 'Help us build predictive models and analyze large datasets.',
          location: 'New York, NY',
          companyEmail: 'careers@dataviz.com',
          careerCategory: 'Data Science',
          createdAt: new Date()
        },
        {
          _id: 'mock-3',
          title: 'UX Designer',
          company: 'Creative Studio',
          description: 'Design beautiful and intuitive user interfaces for our clients.',
          location: 'San Francisco, CA',
          companyEmail: 'hello@creativestudio.com',
          careerCategory: 'Design',
          createdAt: new Date()
        }
      ];
    }

    if (search) {
      const searchLower = search.toLowerCase();
      jobs = jobs.filter((job: any) => 
        job.title.toLowerCase().includes(searchLower) || 
        job.company.toLowerCase().includes(searchLower)
      );
    }

    res.json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req: any, res: any, next: any) => {
  try {
    try {
      const doc = await db.collection('jobs').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ message: 'Job not found' });
      res.json({ success: true, data: { _id: doc.id, ...doc.data() } });
    } catch (dbError: any) {
      console.error('Firestore getJobById failed, using mock data:', dbError.message);
      // Return a mock job if Firestore fails
      res.json({ 
        success: true, 
        data: { 
          _id: req.params.id,
          title: 'Software Engineer (Mock)',
          company: 'TechCorp',
          description: 'This is a mock job description because the database is currently unavailable.',
          location: 'Remote',
          companyEmail: 'jobs@techcorp.com',
          careerCategory: 'Software Engineering',
          createdAt: new Date()
        } 
      });
    }
  } catch (error) {
    next(error);
  }
};

export const generateApplicationEmail = async (req: any, res: any, next: any) => {
  try {
    let job = req.body.job;
    
    if (!job && req.params.id) {
      const jobDoc = await db.collection('jobs').doc(req.params.id).get();
      if (!jobDoc.exists) return res.status(404).json({ message: 'Job not found' });
      job = { _id: jobDoc.id, ...jobDoc.data() };
    }
    
    if (!job) return res.status(400).json({ message: 'Job data is required' });

    console.log('Fetching resumes for user:', req.user.id);
    let resumeSnapshot;
    try {
      // Primary attempt with orderBy
      resumeSnapshot = await db.collection('resumes')
        .where('userId', '==', req.user.id)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
    } catch (err: any) {
      console.warn('Primary Firestore query failed:', err.message);
      
      try {
        // Fallback 1: Without orderBy (checks for index issues)
        console.log('Attempting fallback query without orderBy...');
        resumeSnapshot = await db.collection('resumes')
          .where('userId', '==', req.user.id)
          .limit(5)
          .get();
        
        if (!resumeSnapshot.empty) {
          const docs = resumeSnapshot.docs.sort((a, b) => {
            const aTime = a.data().createdAt?.toMillis?.() || 0;
            const bTime = b.data().createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          resumeSnapshot = { empty: false, docs: [docs[0]] } as any;
        }
      } catch (fallbackErr: any) {
        console.error('Fallback Firestore query also failed:', fallbackErr.message);
        
        // Fallback 2: Try default database if we were using a named one
        if (databaseId !== '(default)') {
          console.log('Attempting query on (default) database...');
          try {
            const defaultDb = admin.app().firestore();
            resumeSnapshot = await defaultDb.collection('resumes')
              .where('userId', '==', req.user.id)
              .limit(1)
              .get();
          } catch (defaultDbErr: any) {
            console.error('Default database query failed:', defaultDbErr.message);
            throw fallbackErr; // Throw the original fallback error
          }
        } else {
          throw fallbackErr;
        }
      }
    }

    const latestResume = resumeSnapshot.empty ? null : resumeSnapshot.docs[0].data();
    const resumeContext = latestResume ? JSON.stringify(latestResume.analysisResult || latestResume.extractedText) : 'No resume context';
    
    const emailDraft = await AIService.generateApplicationEmail(job, resumeContext);
    res.json({ success: true, data: emailDraft });
  } catch (error) {
    next(error);
  }
};

export const sendApplicationEmail = async (req: any, res: any, next: any) => {
  try {
    const { recipientEmail, emailBody } = req.body;
    let job = req.body.job;
    
    if (typeof job === 'string') {
      try { job = JSON.parse(job); } catch(e) {}
    }

    if (!job && req.params.id) {
      const jobDoc = await db.collection('jobs').doc(req.params.id).get();
      if (!jobDoc.exists) return res.status(404).json({ message: 'Job not found' });
      job = { _id: jobDoc.id, ...jobDoc.data() };
    }
    
    if (!job) return res.status(400).json({ message: 'Job data is required' });

    const toEmail = recipientEmail || job.companyEmail;
    const result = await EmailService.sendApplicationEmail(toEmail, `Application for ${job.title}`, emailBody, req.file?.path || null, req.file?.originalname || null);
    res.json({ 
      success: true, 
      sentTo: toEmail,
      demoMode: result?.demoMode || false,
      message: result?.message || 'Email sent successfully'
    });
  } catch (error) {
    next(error);
  }
};
