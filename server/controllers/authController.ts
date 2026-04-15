import admin from '../firebaseAdmin.js';

export const register = async (req: any, res: any, next: any) => {
  const { email, password, name, role } = req.body;

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    res.status(201).json({
      message: 'User registered successfully.',
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Internal Server Error',
    });
  }
};

export const login = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firebase Auth' });
};

export const logout = async (req: any, res: any) => {
  res.status(501).json({ message: 'Moved to Firebase Auth' });
};

export const getMe = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firebase Auth' });
};

export const getTeachers = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firebase Auth' });
};
