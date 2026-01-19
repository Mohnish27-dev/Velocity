import axios from "axios";
import "dotenv/config";

/**
 * Email Service Client
 * 
 * This module calls the external Vercel-deployed email service.
 * The email service is deployed separately to bypass SMTP restrictions on Render.
 * 
 * Environment Variables Required:
 * - EMAIL_SERVICE_URL: URL of the Vercel email service
 * - EMAIL_API_KEY: API key for authentication
 * 
 * For local development without the external service, direct SMTP is used as fallback.
 */

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;

// Check if external email service is configured
const isExternalServiceConfigured = EMAIL_SERVICE_URL && EMAIL_API_KEY;

// Fallback nodemailer import for local development
let nodemailer;
let transporter;

const initLocalTransporter = async () => {
  if (!nodemailer) {
    nodemailer = (await import("nodemailer")).default;
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });
    console.log('📬 Local email transporter initialized');
  }
  return transporter;
};

// Helper function to call external email service
const callEmailService = async (endpoint, data) => {
  if (!isExternalServiceConfigured) {
    throw new Error('External email service not configured. Set EMAIL_SERVICE_URL and EMAIL_API_KEY.');
  }

  const url = `${EMAIL_SERVICE_URL}${endpoint}`;
  console.log(`📧 Calling email service: ${endpoint}`);

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': EMAIL_API_KEY
      },
      timeout: 30000 // 30 second timeout
    });

    console.log(`✅ Email service response: ${response.data.messageId || 'success'}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Email service error: ${error.response.data.error || error.response.statusText}`);
    }
    throw new Error(`Email service error: ${error.message}`);
  }
};

// Log initialization status
if (isExternalServiceConfigured) {
  console.log('📬 Email service configured: Using external Vercel service');
  console.log(`   URL: ${EMAIL_SERVICE_URL}`);
} else {
  console.log('📬 Email service: External service not configured, will use local SMTP');
}

/**
 * Send job application email to recruiter
 */
export const sendJobApplicationEmail = async ({
  recruiterEmail,
  recruiterName = 'Hiring Manager',
  jobTitle,
  companyName,
  applicantName,
  applicantEmail,
  applicantPhone,
  resumeUrl,
  message = ''
}) => {
  try {
    if (isExternalServiceConfigured) {
      return await callEmailService('/api/send-job-application', {
        recruiterEmail,
        recruiterName,
        jobTitle,
        companyName,
        applicantName,
        applicantEmail,
        applicantPhone,
        resumeUrl,
        message
      });
    }

    // Fallback to local SMTP
    const transport = await initLocalTransporter();
    let resumeAttachment;

    if (resumeUrl) {
      const response = await axios.get(resumeUrl, { responseType: 'arraybuffer' });
      resumeAttachment = {
        filename: `${applicantName.replace(/\s+/g, '_')}_Resume.pdf`,
        content: Buffer.from(response.data),
        contentType: 'application/pdf'
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recruiterEmail,
      subject: `Job Application for ${jobTitle} - ${applicantName}`,
      html: `<h1>New Job Application</h1><p>Application from ${applicantName} for ${jobTitle} at ${companyName}</p>`,
      attachments: resumeAttachment ? [resumeAttachment] : []
    };

    const info = await transport.sendMail(mailOptions);
    console.log('Application email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending job application email:', error);
    throw new Error(`Failed to send application email: ${error.message}`);
  }
};

/**
 * Send matching job notification email
 */
export const sendMatchingJobMail = async ({
  userEmail,
  userName = 'there',
  jobTitle,
  companyName,
  jobDescription,
  jobLocation,
  jobType,
  salary,
  applyLink,
  postedDate
}) => {
  try {
    if (isExternalServiceConfigured) {
      return await callEmailService('/api/send-matching-job', {
        userEmail,
        userName,
        jobTitle,
        companyName,
        jobDescription,
        jobLocation,
        jobType,
        salary,
        applyLink,
        postedDate
      });
    }

    // Fallback to local SMTP
    const transport = await initLocalTransporter();

    const mailOptions = {
      from: `"Velocity Jobs" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎯 New Job Match: ${jobTitle} at ${companyName}`,
      html: `<h1>New Job Match</h1><p>${jobTitle} at ${companyName}</p><a href="${applyLink}">Apply Now</a>`
    };

    const info = await transport.sendMail(mailOptions);
    console.log('Job matching email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending job matching email:', error);
    throw new Error(`Failed to send job matching email: ${error.message}`);
  }
};

/**
 * Send job alert email with multiple jobs
 */
export const sendJobAlertEmail = async ({
  userEmail,
  userName = 'there',
  alertTitle,
  jobs = []
}) => {
  try {
    console.log(`\n${'*'.repeat(60)}`);
    console.log(`📧 MAIL SERVICE: SENDING EMAIL`);
    console.log(`${'*'.repeat(60)}`);
    console.log(`📬 To: ${userEmail}`);
    console.log(`👤 User: ${userName}`);
    console.log(`🎯 Alert: ${alertTitle}`);
    console.log(`📊 Jobs: ${jobs.length}`);
    console.log(`${'*'.repeat(60)}\n`);

    if (!userEmail) {
      throw new Error('No recipient email address provided!');
    }

    if (!jobs.length) {
      throw new Error('No jobs to send');
    }

    if (isExternalServiceConfigured) {
      const result = await callEmailService('/api/send-job-alert', {
        userEmail,
        userName,
        alertTitle,
        jobs
      });

      console.log(`\n${'✅'.repeat(30)}`);
      console.log(`📧 EMAIL SUCCESSFULLY SENT!`);
      console.log(`📬 To: ${userEmail}`);
      console.log(`📊 Jobs Included: ${jobs.length}`);
      console.log(`${'✅'.repeat(30)}\n`);

      return result;
    }

    // Fallback to local SMTP
    const transport = await initLocalTransporter();

    const jobListHtml = jobs.map((job, i) =>
      `<div style="margin: 10px 0; padding: 10px; border-left: 3px solid #6366f1;">
        <strong>${i + 1}. ${job.title}</strong><br>
        ${job.company}${job.location ? ` - ${job.location}` : ''}<br>
        <a href="${job.applyLink}">Apply</a>
      </div>`
    ).join('');

    const mailOptions = {
      from: `"Velocity Jobs" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎯 ${jobs.length} New Job${jobs.length > 1 ? 's' : ''} Matching "${alertTitle}"`,
      html: `<h1>New Jobs for ${alertTitle}</h1>${jobListHtml}`
    };

    const info = await transport.sendMail(mailOptions);

    console.log(`\n${'✅'.repeat(30)}`);
    console.log(`📧 EMAIL SUCCESSFULLY SENT!`);
    console.log(`📬 To: ${userEmail}`);
    console.log(`📝 Message ID: ${info.messageId}`);
    console.log(`📊 Jobs Included: ${jobs.length}`);
    console.log(`${'✅'.repeat(30)}\n`);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending job alert email:', error);
    throw new Error(`Failed to send job alert email: ${error.message}`);
  }
};

/**
 * Send proposal approval notification email to student
 */
export const sendProposalApprovalEmail = async ({
  studentEmail,
  studentName = 'there',
  challengeTitle,
  companyName,
  corporateName,
  proposedPrice,
  estimatedDays,
  feedback = '',
  chatRoomId
}) => {
  try {
    console.log(`\n📧 Sending proposal approval email to: ${studentEmail}`);

    if (!studentEmail) {
      throw new Error('No recipient email address provided!');
    }

    if (isExternalServiceConfigured) {
      return await callEmailService('/api/send-proposal-approval', {
        studentEmail,
        studentName,
        challengeTitle,
        companyName,
        corporateName,
        proposedPrice,
        estimatedDays,
        feedback,
        chatRoomId,
        frontendUrl: process.env.FRONTEND_URL
      });
    }

    // Fallback to local SMTP
    const transport = await initLocalTransporter();
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: `"Velocity Fellowships" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `🎉 Congratulations! Your Proposal Has Been Accepted`,
      html: `
        <h1>🎉 Proposal Accepted!</h1>
        <p>Congratulations ${studentName}!</p>
        <p><strong>${companyName}</strong> has accepted your proposal for: <strong>${challengeTitle}</strong></p>
        <p>💰 Agreed Price: ₹${proposedPrice.toLocaleString()}</p>
        <p>⏱️ Timeline: ${estimatedDays} day${estimatedDays > 1 ? 's' : ''}</p>
        ${feedback ? `<p>Message: ${feedback}</p>` : ''}
        <a href="${FRONTEND_URL}/fellowship/messages/${chatRoomId}">Start Conversation</a>
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Proposal approval email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending proposal approval email:', error);
    throw new Error(`Failed to send proposal approval email: ${error.message}`);
  }
};