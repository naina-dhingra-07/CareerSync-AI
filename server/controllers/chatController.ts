export const uploadAudio = async (req: any, res: any, next: any) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload an audio file' });
    
    // Return the URL to the uploaded file
    const url = `/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, url });
  } catch (error) {
    console.error('Audio upload error:', error);
    next(error);
  }
};

export const uploadFile = async (req: any, res: any, next: any) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a file' });
    
    // Return the URL to the uploaded file
    const url = `/uploads/${req.file.filename}`;
    res.status(200).json({ 
      success: true, 
      url, 
      fileName: req.file.originalname,
      fileType: req.file.mimetype 
    });
  } catch (error) {
    console.error('File upload error:', error);
    next(error);
  }
};

export const getConversation = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firestore' });
};

export const sendMessage = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firestore' });
};

export const getConversationList = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firestore' });
};

export const getUnreadCount = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firestore' });
};
