import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
  port: smtpPort,
  secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465, // Auto-secure for 465
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
  tls: {
    // Do not fail on invalid certs (common in some corporate/dev environments)
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
  }
});

// Verify transporter on initialization
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
let isSmtpReady = false;

if (smtpUser && !smtpUser.includes('example.com') && !smtpUser.includes('your_smtp_user')) {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  console.log(`📡 Attempting SMTP connection to ${host}:${smtpPort} (User: ${smtpUser})`);
  transporter.verify((error) => {
    if (error) {
      console.info('ℹ️ SMTP Server not authenticated. Email features will run in Demo Mode.');
      isSmtpReady = false;
    } else {
      console.log('✅ SMTP Server is ready to take our messages');
      isSmtpReady = true;
    }
  });
} else {
  console.log('ℹ️ SMTP credentials not configured. Email features will run in Demo Mode.');
  isSmtpReady = false;
}

class EmailService {
  static isConfigured() {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const from = process.env.SMTP_FROM || user; // Fallback to user if from is missing
    
    const hasUser = !!(user && !user.includes('example.com') && !user.includes('your_smtp_user'));
    const hasPass = !!(pass && pass !== 'your_smtp_password');
    const hasFrom = !!(from && from.includes('@'));
    
    if (!hasUser || !hasPass) {
      return { configured: false, reason: 'Missing or placeholder credentials' };
    }
    if (!hasFrom) {
      return { configured: false, reason: 'Missing or invalid SMTP_FROM address' };
    }
    
    return { configured: true, from };
  }

  static async sendApplicationEmail(to: string, subject: string, body: string, attachmentPath: string | null, attachmentName: string | null) {
    const config = this.isConfigured();
    
    if (!config.configured) {
      console.log(`ℹ️ SMTP not fully configured (${config.reason}). Using Demo Mode.`);
      return { success: true, demoMode: true, message: `Email delivery simulated (Demo Mode: ${config.reason})` };
    }

    const mailOptions: any = {
      from: config.from,
      to,
      subject,
      text: body,
    };

    if (attachmentPath) {
      mailOptions.attachments = [
        {
          filename: attachmentName || 'resume.pdf',
          path: attachmentPath,
        },
      ];
    }

    try {
      // Ensure transporter is ready
      if (!isSmtpReady) {
        try {
          await transporter.verify();
          isSmtpReady = true;
        } catch (verifyError: any) {
          console.warn('⚠️ SMTP Verification failed at runtime:', verifyError.message);
          return { success: true, demoMode: true, message: 'Email delivery simulated (Auth failed)' };
        }
      }

      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', to);
      return { success: true, demoMode: false };
    } catch (error: any) {
      console.error('❌ Email delivery error:', error.message);
      
      // Handle authentication failures silently for demo purposes
      if (error.message.includes('535') || error.message.includes('Authentication failed') || error.message.includes('EAUTH')) {
        console.log('ℹ️ SMTP Authentication failed during send. Using Demo Mode.');
        return { success: true, demoMode: true, message: 'Email delivery simulated (Auth failed)' };
      }
      
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }
}

export default EmailService;
