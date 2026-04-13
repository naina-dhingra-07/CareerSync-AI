# CareerSync - Email Verification System

## Required Configuration

### Firebase Console Settings
1. **Email Enumeration Protection**: 
   - Go to **Firebase Console** -> **Authentication** -> **Settings**.
   - Find **Email Enumeration Protection** and disable it during development to ensure verification emails are sent correctly for new accounts.
2. **Authorized Domains**:
   - Go to **Firebase Console** -> **Authentication** -> **Settings** -> **Authorized Domains**.
   - Ensure `localhost` and your production domain are added to the list.
3. **Email Templates**:
   - Go to **Firebase Console** -> **Authentication** -> **Templates**.
   - Verify the "Email address verification" template is configured with a valid "From" address.

### Environment Variables
Copy `.env.example` to `.env` and fill in the following:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (ensure the private key handles `\n` correctly)
