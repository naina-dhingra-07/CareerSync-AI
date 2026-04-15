import fs from 'fs';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export const uploadResume = async (req: any, res: any, next: any) => {
  try {
    console.log('Upload request received:', req.file?.originalname);
    if (!req.file) return res.status(400).json({ message: 'Please upload a file' });
    
    let extractedText = '';
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    if (mimeType === 'application/pdf') {
      console.log('Extracting text from PDF using PDFParse class...');
      const dataBuffer = fs.readFileSync(filePath);
      
      const parser = new PDFParse({ data: dataBuffer });
      try {
        const result = await parser.getText();
        extractedText = result.text;
        console.log('Text extraction complete. Length:', extractedText.length);
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        throw new Error('Failed to parse PDF file. Please ensure it is a valid PDF.');
      } finally {
        await parser.destroy();
      }
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('Extracting text from DOCX...');
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
      console.log('Text extraction complete. Length:', extractedText.length);
    } else if (mimeType === 'text/plain') {
      console.log('Reading text from TXT...');
      extractedText = fs.readFileSync(filePath, 'utf8');
      console.log('Text extraction complete. Length:', extractedText.length);
    }

    // Return the URL to the uploaded file and the extracted text
    const url = `/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, extractedText, url });
  } catch (error) {
    console.error('Resume upload error:', error);
    next(error);
  }
};

export const updateResumeAnalysis = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firestore' });
};

export const saveResume = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firestore' });
};

export const getResumes = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firestore' });
};

export const deleteResume = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firestore' });
};

export const getLatestResume = async (req: any, res: any, next: any) => {
  res.status(501).json({ message: 'Moved to Firestore' });
};
