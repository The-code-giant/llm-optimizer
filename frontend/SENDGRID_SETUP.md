# Job Application Form Setup

## SendGrid Configuration

To enable email functionality for the job application form, you need to configure SendGrid:

### 1. Environment Variables

Add these variables to your `.env.local` file:

```bash
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@cleversearch.ai
JOB_APPLICATION_EMAIL=hi@cleversearch.ai
```

### 2. SendGrid Setup

1. **Create SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com)
2. **Generate API Key**: 
   - Go to Settings > API Keys
   - Create a new API key with "Full Access" permissions
   - Copy the API key and add it to your environment variables
3. **Verify Sender Email**:
   - Go to Settings > Sender Authentication
   - Verify your domain or single sender email
   - Use the verified email as `SENDGRID_FROM_EMAIL`

### 3. Features

- **Form Validation**: Uses React Hook Form + Zod for client-side validation
- **File Upload**: Supports PDF, DOC, DOCX files up to 10MB
- **Email Notifications**: 
  - Sends application to hiring team
  - Sends confirmation email to applicant
- **Error Handling**: Comprehensive error handling and user feedback
- **Responsive Design**: Works on all device sizes

### 4. API Endpoint

The form submits to `/api/job-application` which:
- Validates the form data
- Converts the resume file to base64
- Sends email via SendGrid with attachment
- Sends confirmation email to applicant
- Returns success/error response

### 5. Form Fields

- First Name (required, min 2 characters)
- Last Name (required, min 2 characters)  
- Email (required, valid email format)
- Position (required, dropdown with available positions)
- Cover Letter (required, min 50 characters)
- Resume/CV (required, PDF/DOC/DOCX, max 10MB)
