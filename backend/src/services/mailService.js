import nodemailer from "nodemailer";
import axios from "axios";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: parseInt(process.env.EMAIL_PORT || '587') === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  family: 4, // Force IPv4
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000, // 5 seconds
  socketTimeout: 10000 // 10 seconds
});

// Verify transporter on startup
const verifyTransporter = async () => {
  console.log('📬 Initializing mail service...');
  const emailUser = process.env.EMAIL_USER;

  if (!emailUser) {
    console.error('❌ EMAIL_USER not configured in environment variables');
    console.error('   Please set EMAIL_USER and EMAIL_PASS in your .env file');
    console.error('   Example: EMAIL_USER=your_email@gmail.com');
    return;
  }

  if (!process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_PASS not configured in environment variables');
    console.error('   Please set EMAIL_PASS in your .env file');
    return;
  }

  console.log(`🔑 Using email account: ${emailUser.replace(/(.{3}).*@/, '$1***@')}`);

  try {
    await transporter.verify();
    console.log('✅ Email service ready - SMTP connection successful');
  } catch (err) {
    console.error('❌ Email service error:');
    console.error(`   Message: ${err.message}`);
    console.error(`   Code: ${err.code}`);
    console.error(`   Command: ${err.command}`);
    if (err.code === 'EAUTH') {
      console.error('   Hint: Make sure you are using an App Password, not your regular Gmail password');
    }
  }
};

verifyTransporter();

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
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-row { margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #667eea; }
            .label { font-weight: bold; color: #667eea; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Job Application</h1>
              <p>${jobTitle} at ${companyName}</p>
            </div>
            <div class="content">
              <p>Dear ${recruiterName},</p>
              <p>You have received a new job application for the position of <strong>${jobTitle}</strong>.</p>
              
              <h3>Applicant Details:</h3>
              <div class="info-row">
                <span class="label">Name:</span> ${applicantName}
              </div>
              <div class="info-row">
                <span class="label">Email:</span> <a href="mailto:${applicantEmail}">${applicantEmail}</a>
              </div>
              ${applicantPhone ? `
              <div class="info-row">
                <span class="label">Phone:</span> ${applicantPhone}
              </div>
              ` : ''}
              
              ${message ? `
              <h3>Cover Message:</h3>
              <div class="info-row">
                ${message}
              </div>
              ` : ''}
              
              <p style="margin-top: 30px;">
                <strong>Resume attached:</strong> Please find the applicant's resume attached to this email.
              </p>
              
              <p>Best regards,<br>Velocity Job Platform</p>
            </div>
            <div class="footer">
              <p>This is an automated email from Velocity Job Application Platform</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: resumeAttachment ? [resumeAttachment] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Application email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending job application email:', error);
    throw new Error(`Failed to send application email: ${error.message}`);
  }
};

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
    console.log(`\n📧 Sending matching job email to: ${userEmail}`);

    if (!userEmail) {
      throw new Error('No recipient email address provided!');
    }

    // Format salary display
    const formatSalary = (sal) => {
      if (!sal) return null;
      if (typeof sal === 'string') return sal;
      if (sal.min && sal.max) {
        const currency = sal.currency || 'USD';
        return `${currency} ${sal.min.toLocaleString()} - ${sal.max.toLocaleString()}`;
      }
      return null;
    };

    const formattedSalary = formatSalary(salary);
    const jobDetails = [jobLocation, jobType, formattedSalary].filter(Boolean).join(' • ');

    const mailOptions = {
      from: `"Velocity Jobs" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎯 New Job Match: ${jobTitle} at ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="x-apple-disable-message-reformatting">
          <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
          <meta name="color-scheme" content="dark light">
          <meta name="supported-color-schemes" content="dark light">
          <title>New Job Match</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; }
            
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; padding: 16px !important; }
              .mobile-padding { padding: 24px 20px !important; }
              .mobile-text { font-size: 15px !important; line-height: 1.5 !important; }
              .mobile-title { font-size: 22px !important; }
              .mobile-job-title { font-size: 20px !important; }
              .mobile-button { 
                display: block !important; 
                width: 100% !important; 
                text-align: center !important;
                padding: 16px 24px !important;
                font-size: 16px !important;
              }
              .mobile-stack { display: block !important; width: 100% !important; }
              .mobile-center { text-align: center !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000; -webkit-font-smoothing: antialiased;">
          
          <!-- Preheader -->
          <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
            ${jobTitle} at ${companyName} ${jobLocation ? `• ${jobLocation}` : ''} - Apply now on Velocity
          </div>
          
          <!-- Main Container -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; padding: 40px 20px;">
            <tr>
              <td align="center">
                <!-- Email Wrapper -->
                <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: linear-gradient(180deg, #1c1c1e 0%, #0a0a0a 100%); border-radius: 20px; border: 1px solid #2c2c2e; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 36px 40px 28px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);" class="mobile-padding">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;" class="mobile-title">Velocity</h1>
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">We found a job that matches your profile!</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;" class="mobile-padding">
                      <!-- Greeting -->
                      <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px; font-weight: 600;">Hello ${userName},</p>
                      
                      <!-- Message -->
                      <p style="margin: 0 0 32px 0; color: #a1a1a6; font-size: 16px; line-height: 1.6;" class="mobile-text">
                        Great news! We found a job opportunity that matches your preferences. Check it out below:
                      </p>
                      
                      <!-- Job Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%); border-radius: 16px; border: 1px solid #3a3a3c; overflow: hidden; margin-bottom: 32px;">
                        <tr>
                          <td style="padding: 28px;" class="mobile-padding">
                            <!-- Job Title -->
                            <h2 style="margin: 0 0 8px 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3;" class="mobile-job-title">${jobTitle}</h2>
                            
                            <!-- Company -->
                            <p style="margin: 0 0 16px 0; color: #8b5cf6; font-size: 16px; font-weight: 600;">${companyName}</p>
                            
                            <!-- Job Details -->
                            ${jobDetails ? `
                            <p style="margin: 0 0 20px 0; color: #8e8e93; font-size: 14px; line-height: 1.5;">
                              📍 ${jobDetails}
                            </p>
                            ` : ''}
                            
                            <!-- Description Preview -->
                            ${jobDescription ? `
                            <div style="margin: 0 0 24px 0; padding: 16px; background-color: rgba(99, 102, 241, 0.1); border-radius: 12px; border-left: 3px solid #6366f1;">
                              <p style="margin: 0; color: #a1a1a6; font-size: 14px; line-height: 1.6;">
                                ${jobDescription.length > 200 ? jobDescription.substring(0, 200) + '...' : jobDescription}
                              </p>
                            </div>
                            ` : ''}
                            
                            ${postedDate ? `
                            <p style="margin: 0 0 24px 0; color: #6e6e73; font-size: 13px;">
                              🕐 Posted: ${new Date(postedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            ` : ''}
                            
                            <!-- Apply Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td align="center">
                                  <!--[if mso]>
                                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${applyLink}" style="height:52px;v-text-anchor:middle;width:200px;" arcsize="15%" strokecolor="#6366f1" fillcolor="#6366f1">
                                    <w:anchorlock/>
                                    <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">Apply Now →</center>
                                  </v:roundrect>
                                  <![endif]-->
                                  <!--[if !mso]><!-->
                                  <a href="${applyLink}" target="_blank" class="mobile-button" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); mso-hide: all;">Apply Now →</a>
                                  <!--<![endif]-->
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Closing -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="padding-top: 24px; border-top: 1px solid #2c2c2e;">
                        <tr>
                          <td>
                            <p style="margin: 0 0 8px 0; color: #a1a1a6; font-size: 15px;">Best of luck with your application!</p>
                            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">The Velocity Team</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 28px 40px; background-color: #0a0a0a; border-top: 1px solid #2c2c2e;" class="mobile-padding">
                      <p style="margin: 0 0 8px 0; color: #6e6e73; font-size: 13px; line-height: 1.5;">
                        You're receiving this because your profile matches this job.
                      </p>
                      <p style="margin: 0; color: #48484a; font-size: 12px;">
                        To update your preferences, visit your dashboard.
                      </p>
                    </td>
                  </tr>
                  
                </table>
                
                <!-- Copyright -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin-top: 24px;">
                  <tr>
                    <td align="center" style="padding: 20px;">
                      <p style="margin: 0; color: #48484a; font-size: 12px;">© ${new Date().getFullYear()} Velocity. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
                
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      // Plain text fallback
      text: `
Hello ${userName},

Great news! We found a job opportunity that matches your preferences.

${jobTitle}
${companyName}
${jobDetails || ''}

${jobDescription ? `Description: ${jobDescription.substring(0, 300)}${jobDescription.length > 300 ? '...' : ''}` : ''}

Apply here: ${applyLink}

Best of luck with your application!
The Velocity Team

---
You received this email because your profile matches this job.
      `.trim()
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Job matching email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending job matching email:', error);
    throw new Error(`Failed to send job matching email: ${error.message}`);
  }
};

/**
 * Send job alert email with multiple jobs
 * @param {Object} params
 * @param {string} params.userEmail - Recipient email
 * @param {string} params.userName - Recipient name
 * @param {string} params.alertTitle - Alert name/title
 * @param {Array} params.jobs - Array of job objects to include
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

    // Format salary display
    const formatSalary = (salary) => {
      if (!salary || (!salary.min && !salary.max)) return null;
      const currency = salary.currency || 'USD';
      if (salary.min && salary.max) {
        return `${currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
      }
      return `${currency} ${(salary.min || salary.max).toLocaleString()}`;
    };

    // Generate dark-themed responsive job list HTML with improved mobile stacking
    const jobListHtml = jobs.map((job, index) => {
      const salary = formatSalary(job.salary);
      const jobDetails = [job.location, job.employmentType, salary, job.isRemote ? '🏠 Remote' : null].filter(Boolean).join(' • ');
      return `
        <tr>
          <td style="padding: 0 0 16px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%); border-radius: 16px; border: 1px solid #3a3a3c; overflow: hidden;">
              <tr>
                <td style="padding: 24px;" class="mobile-padding">
                  <!-- Job Info Section -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td class="mobile-stack" style="vertical-align: top;">
                        <!-- Job Number Badge -->
                        <div style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; width: 28px; height: 28px; border-radius: 8px; text-align: center; line-height: 28px; font-size: 13px; font-weight: 700; margin-bottom: 12px;">
                          ${index + 1}
                        </div>
                        
                        <!-- Job Title -->
                        <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 18px; font-weight: 700; line-height: 1.4;" class="mobile-job-title">${job.title}</h3>
                        
                        <!-- Company -->
                        <p style="margin: 0 0 12px 0; color: #a78bfa; font-size: 15px; font-weight: 600;">${job.company}</p>
                        
                        <!-- Job Details Tags -->
                        ${jobDetails ? `
                        <p style="margin: 0 0 20px 0; color: #8e8e93; font-size: 13px; line-height: 1.6;">
                          ${jobDetails}
                        </p>
                        ` : ''}
                        
                        <!-- Apply Button - Full width on mobile -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <!--[if mso]>
                              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${job.applyLink}" style="height:48px;v-text-anchor:middle;width:140px;" arcsize="15%" strokecolor="#6366f1" fillcolor="#6366f1">
                                <w:anchorlock/>
                                <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:600;">Apply Now →</center>
                              </v:roundrect>
                              <![endif]-->
                              <!--[if !mso]><!-->
                              <a href="${job.applyLink}" target="_blank" class="mobile-button" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35); mso-hide: all;">Apply Now →</a>
                              <!--<![endif]-->
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }).join('');

    const mailOptions = {
      from: `"Velocity Jobs" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎯 ${jobs.length} New Job${jobs.length > 1 ? 's' : ''} Matching "${alertTitle}"`,
      html: `
        <!DOCTYPE html>
        <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="x-apple-disable-message-reformatting">
          <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
          <meta name="color-scheme" content="dark">
          <meta name="supported-color-schemes" content="dark">
          <title>New Job Opportunities</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; }
            
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; padding: 12px !important; }
              .mobile-padding { padding: 20px 16px !important; }
              .mobile-text { font-size: 15px !important; line-height: 1.5 !important; }
              .mobile-title { font-size: 22px !important; }
              .mobile-job-title { font-size: 16px !important; }
              .mobile-stack { display: block !important; width: 100% !important; }
              .mobile-button { 
                display: block !important; 
                width: 100% !important; 
                text-align: center !important; 
                padding: 16px 24px !important;
                font-size: 16px !important;
                margin-top: 8px !important;
              }
              .mobile-hide-padding { padding-right: 0 !important; }
              .mobile-center { text-align: center !important; }
            }
            
            @media (prefers-color-scheme: light) {
              .dark-mode { background-color: #f5f5f7 !important; }
              .dark-card { background-color: #ffffff !important; border-color: #d1d1d6 !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000; line-height: 1.6; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
          <!-- Preheader text -->
          <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
            ${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching ${alertTitle} • Review opportunities now
          </div>
          
          <!-- Main container -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; padding: 40px 20px;" class="dark-mode">
            <tr>
              <td align="center">
                <!-- Email wrapper -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: linear-gradient(180deg, #1c1c1e 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid #2c2c2e; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);" class="dark-card">
                  
                  <!-- Header with gradient -->
                  <tr>
                    <td style="padding: 32px 40px 24px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); border-radius: 16px 16px 0 0;" class="mobile-padding">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;" class="mobile-title">Velocity</h1>
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">Your Job Search Partner</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 36px 40px;" class="mobile-padding">
                      <!-- Greeting -->
                      <p style="margin: 0 0 12px 0; color: #ffffff; font-size: 18px; font-weight: 600;">Hello ${userName},</p>
                      
                      <!-- Message -->
                      <p style="margin: 0 0 28px 0; color: #a1a1a6; font-size: 16px; line-height: 1.6;" class="mobile-text">
                        We've found <strong style="color: #ffffff; font-weight: 600;">${jobs.length} new opportunity${jobs.length > 1 ? 's' : ''}</strong> matching your alert:
                      </p>
                      
                      <!-- Alert badge -->
                      <div style="margin: 0 0 28px 0; padding: 12px 18px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%); border-radius: 10px; border: 1px solid rgba(99, 102, 241, 0.3); display: inline-block;">
                        <p style="margin: 0; color: #a78bfa; font-size: 14px; font-weight: 600;">📌 ${alertTitle}</p>
                      </div>
                      
                      <!-- Jobs List -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                        ${jobListHtml}
                      </table>
                      
                      <!-- Closing -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #2c2c2e;">
                        <tr>
                          <td>
                            <p style="margin: 0 0 8px 0; color: #a1a1a6; font-size: 15px;">Best of luck with your applications,</p>
                            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">The Velocity Team</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 28px 40px; background-color: #0a0a0a; border-radius: 0 0 16px 16px; border-top: 1px solid #2c2c2e;" class="mobile-padding">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 12px;">
                            <p style="margin: 0; color: #6e6e73; font-size: 13px; line-height: 1.5;">
                              You're receiving this because you created a job alert on Velocity.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p style="margin: 0; color: #48484a; font-size: 12px; line-height: 1.5;">
                              To manage your alerts or preferences, visit your dashboard. For support, reach out anytime.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                </table>
                
                <!-- Footer link -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin-top: 20px;">
                  <tr>
                    <td style="text-align: center; padding: 20px;">
                      <p style="margin: 0; color: #48484a; font-size: 12px;">
                        © ${new Date().getFullYear()} Velocity. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
                
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      // Plain text version for email clients that don't support HTML
      text: `
Hello ${userName},

We found ${jobs.length} new job opportunity${jobs.length > 1 ? 's' : ''} matching your alert: "${alertTitle}"

${jobs.map((job, i) => `${i + 1}. ${job.title}\n   Company: ${job.company}${job.location ? `\n   Location: ${job.location}` : ''}\n   Apply: ${job.applyLink}`).join('\n\n')}

Best regards,
The Velocity Team

---
You received this email because you created a job alert on Velocity.
To manage or delete your alerts, please visit your dashboard.
      `.trim()
    };

    const info = await transporter.sendMail(mailOptions);
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
 * @param {Object} params - Email parameters
 * @param {string} params.studentEmail - Student's verified email
 * @param {string} params.studentName - Student's name
 * @param {string} params.challengeTitle - Challenge title
 * @param {string} params.companyName - Company name
 * @param {string} params.corporateName - Corporate representative name
 * @param {number} params.proposedPrice - Agreed price
 * @param {number} params.estimatedDays - Estimated completion days
 * @param {string} params.feedback - Optional feedback from company
 * @param {string} params.chatRoomId - Chat room ID for communication
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

    const mailOptions = {
      from: `"Velocity Fellowships" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `🎉 Congratulations! Your Proposal Has Been Accepted`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Proposal Accepted</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
            
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; padding: 16px !important; }
              .mobile-padding { padding: 24px 20px !important; }
              .mobile-text { font-size: 15px !important; }
              .mobile-title { font-size: 24px !important; }
            }
          </style>
        </head>
        <body style="background-color: #f3f4f6; padding: 40px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Success Header -->
                  <tr>
                    <td style="padding: 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-align: center;" class="mobile-padding">
                      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                      <h1 style="margin: 0 0 8px 0; color: white; font-size: 28px; font-weight: 700;" class="mobile-title">Proposal Accepted!</h1>
                      <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Great news from Velocity Fellowships</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;" class="mobile-padding">
                      <p style="margin: 0 0 24px 0; color: #111827; font-size: 18px; font-weight: 600;">Hello ${studentName},</p>
                      
                      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;" class="mobile-text">
                        Congratulations! <strong style="color: #111827;">${companyName}</strong> has accepted your proposal for the challenge:
                      </p>
                      
                      <!-- Challenge Info Box -->
                      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 28px;">
                        <h3 style="margin: 0 0 12px 0; color: #047857; font-size: 18px; font-weight: 600;">${challengeTitle}</h3>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; color: #065f46; font-size: 14px;">
                              <strong>💰 Agreed Price:</strong> ₹${proposedPrice.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #065f46; font-size: 14px;">
                              <strong>⏱️ Timeline:</strong> ${estimatedDays} day${estimatedDays > 1 ? 's' : ''}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #065f46; font-size: 14px;">
                              <strong>🏢 Company:</strong> ${companyName}
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      ${feedback ? `
                      <!-- Feedback Section -->
                      <div style="background: #f9fafb; border-left: 4px solid #6366f1; padding: 20px; border-radius: 8px; margin-bottom: 28px;">
                        <h4 style="margin: 0 0 12px 0; color: #4338ca; font-size: 16px; font-weight: 600;">Message from ${corporateName}:</h4>
                        <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">${feedback}</p>
                      </div>
                      ` : ''}
                      
                      <!-- Next Steps -->
                      <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
                        <h3 style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px; font-weight: 600;">📋 Next Steps:</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 15px; line-height: 1.8;">
                          <li>Start a conversation with ${companyName} to discuss project details</li>
                          <li>Clarify requirements and deliverables</li>
                          <li>Set up milestones and checkpoints</li>
                          <li>Begin working on the project</li>
                        </ul>
                      </div>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                        <tr>
                          <td align="center">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/fellowship/messages/${chatRoomId}" 
                               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                              Start Conversation →
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Closing -->
                      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 15px;">Best of luck with your project!</p>
                        <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">The Velocity Team</p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;" class="mobile-padding">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-align: center;">
                        You're receiving this because your proposal was accepted on Velocity Fellowships.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} Velocity. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Congratulations ${studentName}!

Your proposal has been accepted by ${companyName}!

Challenge: ${challengeTitle}
Agreed Price: ₹${proposedPrice.toLocaleString()}
Timeline: ${estimatedDays} day${estimatedDays > 1 ? 's' : ''}
${feedback ? `\nMessage from ${corporateName}:\n${feedback}` : ''}

Next Steps:
- Start a conversation with ${companyName} to discuss project details
- Clarify requirements and deliverables
- Set up milestones and checkpoints
- Begin working on the project

Click here to start the conversation: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/fellowship/messages/${chatRoomId}

Best of luck with your project!
The Velocity Team

---
You received this email because your proposal was accepted on Velocity Fellowships.
      `.trim()
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Proposal approval email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending proposal approval email:', error);
    throw new Error(`Failed to send proposal approval email: ${error.message}`);
  }
};