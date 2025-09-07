import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found in environment variables');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const position = formData.get('position') as string;
    const coverLetter = formData.get('coverLetter') as string;
    const resumeFile = formData.get('resume') as File;

    // Validate required fields
    if (!firstName || !lastName || !email || !position || !coverLetter || !resumeFile) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log('SendGrid not configured, logging application data instead');
      console.log('Application Data:', {
        firstName,
        lastName,
        email,
        position,
        coverLetter,
        resumeFileName: resumeFile.name,
        resumeFileSize: resumeFile.size
      });
      
      return NextResponse.json(
        { message: 'Application received successfully (SendGrid not configured)' },
        { status: 200 }
      );
    }

    // Convert file to base64 for SendGrid attachment
    const fileBuffer = await resumeFile.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');

    // Prepare email content
    const emailContent = `
      <h2>New Job Application</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Position:</strong> ${position}</p>
      <p><strong>Cover Letter:</strong></p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${coverLetter.replace(/\n/g, '<br>')}
      </div>
      <p><em>Resume attached as PDF/DOC file.</em></p>
    `;

    // SendGrid email configuration
    const msg = {
      to: process.env.JOB_APPLICATION_EMAIL || 'hi@cleversearch.ai',
      from: process.env.SENDGRID_FROM_EMAIL || 'hi@cleversearch.ai',
      subject: `Job Application: ${position} - ${firstName} ${lastName}`,
      html: emailContent,
      attachments: [
        {
          content: base64File,
          filename: resumeFile.name,
          type: resumeFile.type,
          disposition: 'attachment'
        }
      ]
    };

    // Validate sender email before sending
    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('SENDGRID_FROM_EMAIL environment variable is required and must be a verified sender in SendGrid');
    }

    console.log('Attempting to send email via SendGrid...');
    console.log('From:', msg.from);
    console.log('To:', msg.to);
    console.log('Subject:', msg.subject);

    // Send email
    await sgMail.send(msg);
    console.log('Application email sent successfully');

    // Send confirmation email to applicant
    const confirmationMsg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@cleversearch.ai',
      subject: 'Application Received - Cleversearch',
      html: `
        <h2>Thank you for your application!</h2>
        <p>Dear ${firstName},</p>
        <p>We have received your application for the <strong>${position}</strong> position at Cleversearch.</p>
        <p>Our team will review your application and get back to you within 5-7 business days.</p>
        <p>If you have any questions, please don't hesitate to contact us at hi@cleversearch.ai</p>
        <br>
        <p>Best regards,<br>The Cleversearch Team</p>
      `
    };

    await sgMail.send(confirmationMsg);
    console.log('Confirmation email sent successfully');

    return NextResponse.json(
      { message: 'Application submitted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error submitting job application:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if it's a SendGrid specific error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('SendGrid error code:', error.code);
      console.error('SendGrid error response:', error.response);
    }
    
    return NextResponse.json(
      { message: 'Failed to submit application. Please try again or contact us directly.' },
      { status: 500 }
    );
  }
}
