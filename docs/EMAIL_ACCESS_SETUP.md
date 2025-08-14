# Email Access Feature Setup Guide

## 🚀 Overview

The Email Access feature allows you to send tool access credentials to selected participants via email using the Resend API. This feature includes:

- ✅ Multi-participant email sending
- ✅ Credential selection (select individual or all tools)
- ✅ Professional HTML email templates
- ✅ Real-time sending status and error handling
- ✅ Detailed success/failure reporting

## 📦 Installation

### Step 1: Install Resend Package
```bash
# Using pnpm (recommended)
pnpm add resend

# Or using npm
npm install resend

# Or using yarn
yarn add resend
```

### Step 2: Environment Configuration
The Resend API key has been added to your `.env.local` file:
```env
RESEND_API_KEY=re_FuWEsP4t_57FGZEkUyxct65xaqCYXvQGG
```

## 🔧 How It Works

### 1. **User Flow**
1. Navigate to Project → Enrollment Tab → Participants Table
2. Select participants using checkboxes
3. Click "Actions" → "Email Access"
4. Choose which credentials to send (individual selection or "Select All")
5. Click "Send Email" to dispatch emails

### 2. **API Endpoint**
- **Path**: `/api/email/send-credentials`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "participants": [/* participant objects with toolAccesses */],
    "credentials": [/* selected credential types */],
    "projectName": "Project Name"
  }
  ```

### 3. **Email Template Features**
- **Professional Design**: Modern, responsive HTML template
- **Security Reminder**: Includes best practices for credential security
- **Organized Credentials**: Table format with tool names, usernames, access codes
- **Branded Header**: EDWIND system branding
- **Tool Links**: Clickable URLs for each tool (if provided)

## 📧 Email Content Structure

Each participant receives an email containing:

```
🔐 Access Credentials - [Project Name]

Hello [Participant Name],

Your access credentials for the training tools have been prepared:

[TABLE WITH SELECTED CREDENTIALS]
| Tool | Credentials |
|------|-------------|
| CRM  | Username: alice_j_dev |
|      | Access Code: ALC123XYZ |
|      | URL: https://crm.company.com |

🛡️ Security Reminder
- Keep credentials secure
- Don't share with others  
- Change password after first login
- Contact support for issues
```

## 🔍 Features Implemented

### **EmailAccessDialog Component** (`src/components/EmailAccessDialog.js`)
- Multi-select credential interface
- Participant summary with chips
- Select All functionality with indeterminate states
- Real-time credential counting
- Loading states during email sending

### **API Handler** (`src/pages/api/email/send-credentials.js`)
- Individual email sending per participant
- Credential filtering per participant
- Error handling and retry logic
- Detailed response with success/failure counts
- Professional HTML email generation

### **ParticipantsTable Integration**
- Updated ActionButton with "Email Access" option
- State management for selected participants
- API integration with detailed feedback
- Success/error notifications with statistics

## ⚙️ Configuration Options

### **Resend Configuration**
- Sender email: `EDWIND System <noreply@edwind.app>`
- API key from environment variable
- Fallback to hardcoded key if env not available

### **Email Customization**
You can modify the email template in `/api/email/send-credentials.js`:
- Change sender name/email
- Customize HTML styling
- Add company branding
- Modify security messaging

## 🧪 Testing

### **Test the Feature**
1. Ensure you have participants with tool access credentials
2. Navigate to a project with participants
3. Select multiple participants
4. Test the email sending flow
5. Check recipient inboxes for formatted emails

### **Error Scenarios to Test**
- Participants without email addresses
- Participants without matching credentials  
- Network failures during sending
- Invalid email addresses

## 🔒 Security Considerations

- ✅ Credentials sent only to participant's registered email
- ✅ HTTPS required for credential transmission
- ✅ Individual emails (no CC/BCC exposure)
- ✅ Security reminders in each email
- ✅ Error logging without exposing sensitive data

## 🚨 Important Notes

1. **Resend Account**: Ensure the API key `re_FuWEsP4t_57FGZEkUyxct65xaqCYXvQGG` is valid and has sending limits
2. **Email Limits**: Check Resend plan limits for bulk email sending
3. **From Address**: Verify `noreply@edwind.app` is configured in Resend dashboard
4. **Production**: Consider adding email delivery tracking for production use

## 📊 Success Metrics

The system tracks and reports:
- Total participants selected
- Emails successfully sent
- Failed email attempts
- Credential types included
- Individual participant status

## 🛠️ Troubleshooting

### Common Issues:
1. **"Resend not found"**: Install the resend package
2. **"API key invalid"**: Check environment variable
3. **"No matching credentials"**: Verify participant has tool access
4. **"Email failed"**: Check recipient email address validity

### Debug Information:
- Check browser console for detailed API responses
- Review server logs for email sending errors
- Verify participant tool access data in database

---

🎉 **The Email Access feature is now ready to use!**