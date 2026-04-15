import admin from 'firebase-admin';
import '../firebaseAdmin.js'; // Ensure initialization
import firebaseConfig from '../../firebase-applet-config.json' assert { type: 'json' };

export const protect = async (req: any, res: any, next: any) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        id: decodedToken.uid,
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        role: decodedToken.role || 'student'
      };
      next();
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};
