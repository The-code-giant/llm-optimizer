import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

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
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@cleversearch.ai',
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

    // Send email
    await sgMail.send(msg);

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

    return NextResponse.json(
      { message: 'Application submitted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error submitting job application:', error);
    
    return NextResponse.json(
      { message: 'Failed to submit application. Please try again.' },
      { status: 500 }
    );
  }
}
