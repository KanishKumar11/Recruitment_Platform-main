// src/lib/emailService.ts
import nodemailer from "nodemailer";

// Create transporter for ZeptoMail (using original variable names for compatibility)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.zeptomail.in", // ZeptoMail SMTP host
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.ZOHO_EMAIL, // Your ZeptoMail email
      pass: process.env.ZOHO_APP_PASSWORD, // Your ZeptoMail password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Contact form data interface
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

// Email templates
const getOTPEmailTemplate = (name: string, otp: string) => {
  return {
    subject: "Verify Your Email Address - OTP Code",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .otp-box { background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for registering with our platform. To complete your registration, please verify your email address using the OTP code below:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 18px; color: #333;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; font-size: 14px; color: #666;">This code will expire in 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't request this verification code, please ignore this email. Never share your OTP with anyone.
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>Team SourcingScreen<br>partner@sourcingscreen.com<br>www.sourcingscreen.com</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} SourcingScreen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name}!
      
      Thank you for registering with our platform. To complete your registration, please verify your email address using the OTP code below:
      
      Your verification code is: ${otp}
      
      This code will expire in 10 minutes.
      
      Security Notice: If you didn't request this verification code, please ignore this email. Never share your OTP with anyone.
      
      If you have any questions or need assistance, please don't hesitate to contact our support team.
      
      Best regards,
      Team SourcingScreen
      partner@sourcingscreen.com
      www.sourcingscreen.com
      
      This is an automated message, please do not reply to this email.
    `,
  };
};

const getContactFormEmailTemplate = (formData: ContactFormData) => {
  return {
    subject: `New Contact Form Submission from ${formData.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Form Submission</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; }
          .info-item { margin: 15px 0; }
          .info-label { font-weight: bold; color: #333; display: inline-block; width: 120px; }
          .info-value { color: #555; }
          .message-box { background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .priority { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 New Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="priority">
              <strong>🔔 Action Required:</strong> New contact form submission received. Please respond within 24 hours.
            </div>
            
            <h2>Contact Information</h2>
            <div class="info-box">
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${formData.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">
                  <a href="mailto:${formData.email}" style="color: #667eea;">${
      formData.email
    }</a>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">
                  <a href="tel:${formData.phone}" style="color: #667eea;">${
      formData.phone
    }</a>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Company:</span>
                <span class="info-value">${formData.company}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Submitted:</span>
                <span class="info-value">${new Date().toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}</span>
              </div>
            </div>
            
            <h2>Message</h2>
            <div class="message-box">
              <p style="white-space: pre-wrap; line-height: 1.6; margin: 0;">${
                formData.message
              }</p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #e8f4fd; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #0066cc;">Quick Actions</h3>
              <p style="margin: 5px 0;">
                <strong>Reply:</strong> 
                <a href="mailto:${
                  formData.email
                }?subject=Re: Your inquiry - SourcingScreen" style="color: #667eea;">
                  Send Email Reply
                </a>
              </p>
              <p style="margin: 5px 0;">
                <strong>Call:</strong> 
                <a href="tel:${formData.phone}" style="color: #667eea;">
                  ${formData.phone}
                </a>
              </p>
            </div>
            
          </div>
          <div class="footer">
            <p>This email was automatically generated from the SourcingScreen contact form.</p>
            <p>&copy; ${new Date().getFullYear()} SourcingScreen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      NEW CONTACT FORM SUBMISSION
      ===========================
      
      Contact Information:
      Name: ${formData.name}
      Email: ${formData.email}
      Phone: ${formData.phone}
      Company: ${formData.company}
      Submitted: ${new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}
      
      Message:
      ${formData.message}
      
      Quick Actions:
      - Reply via email: ${formData.email}
      - Call: ${formData.phone}
      
      This email was automatically generated from the SourcingScreen contact form.
    `,
  };
};

export const sendOTPEmail = async (
  email: string,
  name: string,
  otp: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const emailTemplate = getOTPEmailTemplate(name, otp);

    const mailOptions = {
      from: {
        name: "Sourcing Screen",
        address: process.env.ZOHO_EMAIL!,
      },
      to: email,
      replyTo: "partner@sourcingscreen.com",
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};

// Password reset email template
const getPasswordResetEmailTemplate = (name: string, resetUrl: string) => {
  return {
    subject: "Reset Your Password - SourcingScreen",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .reset-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
          .url-box { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>We received a request to reset your password for your SourcingScreen account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0; color: #ffffff;">
              <a href="${resetUrl}" class="reset-button">Reset Your Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <div class="url-box">${resetUrl}</div>
            
            <div class="warning">
              <strong>Security Notice:</strong> This password reset link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>If you continue to have problems or didn't request this reset, please contact our support team.</p>
            
            <p>Best regards,<br>The SourcingScreen Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} SourcingScreen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name}!
      
      We received a request to reset your password for your SourcingScreen account. If you made this request, please visit the following link to reset your password:
      
      ${resetUrl}
      
      Security Notice: This password reset link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
      
      If you continue to have problems or didn't request this reset, please contact our support team.
      
      Best regards,
      The SourcingScreen Team
      
      This is an automated message, please do not reply to this email.
    `,
  };
};

// Password reset confirmation email template
const getPasswordResetConfirmationTemplate = (name: string) => {
  return {
    subject: "Password Successfully Reset - SourcingScreen",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .success-icon { font-size: 48px; color: #28a745; text-align: center; margin: 20px 0; }
          .warning { background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0; color: #0c5460; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Successful</h1>
          </div>
          <div class="content">
            <div class="success-icon">✅</div>
            <h2>Hello ${name}!</h2>
            <p>Your password has been successfully reset for your SourcingScreen account.</p>
            
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately. Your account security is important to us.
            </div>
            
            <p>You can now log in to your account using your new password.</p>
            
            <p>Best regards,<br>The SourcingScreen Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} SourcingScreen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name}!
      
      Your password has been successfully reset for your SourcingScreen account.
      
      Security Notice: If you didn't make this change, please contact our support team immediately. Your account security is important to us.
      
      You can now log in to your account using your new password.
      
      Best regards,
      The SourcingScreen Team
      
      This is an automated message, please do not reply to this email.
    `,
  };
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetUrl: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const emailTemplate = getPasswordResetEmailTemplate(name, resetUrl);

    const mailOptions = {
      from: {
        name: "Sourcing Screen",
        address: process.env.ZOHO_EMAIL!,
      },
      to: email,
      replyTo: "partner@sourcingscreen.com",
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

export const sendPasswordResetConfirmationEmail = async (
  email: string,
  name: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const emailTemplate = getPasswordResetConfirmationTemplate(name);

    const mailOptions = {
      from: {
        name: "Sourcing Screen",
        address: process.env.ZOHO_EMAIL!,
      },
      to: email,
      replyTo: "partner@sourcingscreen.com",
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      "Password reset confirmation email sent successfully:",
      result.messageId
    );
    return true;
  } catch (error) {
    console.error("Error sending password reset confirmation email:", error);
    return false;
  }
};

// Welcome email for recruiters with PDF attachment
export const sendRecruiterWelcomeEmail = async (
  email: string,
  name: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const path = require("path");
    const fs = require("fs");

    // Path to the PDF attachment
    const pdfPath = path.join(
      process.cwd(),
      "public",
      "SourcingScreen – Partner Agreement & Sourcing Guidelines.pdf"
    );

    // Check if PDF exists
    let attachments = [];
    if (fs.existsSync(pdfPath)) {
      attachments.push({
        filename:
          "SourcingScreen – Partner Agreement & Sourcing Guidelines.pdf",
        path: pdfPath,
        contentType: "application/pdf",
      });
    }

    const mailOptions = {
      from: {
        name: "SourcingScreen",
        address: process.env.ZOHO_EMAIL!,
      },
      to: email,
      replyTo: "partner@sourcingscreen.com",
      subject:
        "Welcome to SourcingScreen – Partnership Confirmation & Next Steps",
      attachments: attachments,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to SourcingScreen</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
            .content { padding: 40px 30px; color: #333; }
            .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
            .welcome-text { font-size: 16px; margin-bottom: 25px; }
            .section { margin: 25px 0; }
            .section-title { font-size: 18px; font-weight: bold; color: #667eea; margin-bottom: 15px; }
            .attachment-info { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
            .next-steps { background-color: #e8f4fd; border-radius: 8px; padding: 20px; margin: 25px 0; }
            .next-steps h3 { color: #667eea; margin-top: 0; }
            .next-steps ol { margin: 10px 0; padding-left: 20px; }
            .next-steps li { margin: 8px 0; }
            .contact-info { background-color: #f0f8ff; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #666; }
            .website-link { color: #667eea; text-decoration: none; font-weight: bold; }
            .website-link:hover { text-decoration: underline; }
            .checkmark { color: #28a745; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to SourcingScreen!</h1>
            </div>
            <div class="content">
              <div class="greeting">
                Dear ${name},
              </div>
              
              <div class="welcome-text">
                Greetings from SourcingScreen! 🚀
              </div>
              
              <p>We're delighted to welcome you as our <strong>Recruitment Partner</strong>. Thank you for registering with us — we're excited to collaborate with you in building successful hiring journeys for our clients.</p>
              
              <div class="section">
                <div class="section-title">📎 Attachments:</div>
                <div class="attachment-info">
                  <strong>• Partner Agreement & Sourcing Guidelines</strong><br>
                  By joining the platform, you already agree to our terms and conditions outlined in these documents.
                </div>
              </div>
              
              <div class="next-steps">
                <h3><span class="checkmark">✅</span> Next Steps:</h3>
                <ol>
                  <li><strong>Review the attached Partner Agreement & Sourcing Guidelines carefully.</strong></li>
                  <li><strong>We conduct onboarding/walkthrough calls every week or 15 days, and also schedule them on request</strong> to help partners get familiar with the platform and processes.</li>
                </ol>
              </div>
              
              <p>We're confident this partnership will be rewarding and look forward to seeing your successful candidate submissions soon.</p>
              
              <div class="contact-info">
                <p>If you have any questions in the meantime, feel free to reach out to us at <strong>partner@sourcingscreen.com</strong>.</p>
              </div>
              
              <p style="font-size: 18px; font-weight: bold; color: #667eea;">Welcome aboard! 🎊</p>
              
              <p style="margin-top: 30px;">
                Warm regards,<br>
                <strong>Team SourcingScreen</strong><br>
                <a href="https://sourcingscreen.com/" class="website-link">https://sourcingscreen.com/</a>
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SourcingScreen. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Dear ${name},
        
        Greetings from SourcingScreen!
        
        We're delighted to welcome you as our Recruitment Partner. Thank you for registering with us — we're excited to collaborate with you in building successful hiring journeys for our clients.
        
        As part of the onboarding process, please find attached the following documents for your review and records:
        
        Attachments:
        • Partner Agreement & Sourcing Guidelines
        
        By joining the platform, you already agree to our terms and conditions outlined in these documents.
        
        Next Steps:
        1. Review the attached Partner Agreement & Sourcing Guidelines carefully.
        2. We conduct onboarding/walkthrough calls every week or 15 days, and also schedule them on request to help partners get familiar with the platform and processes.
        
        We're confident this partnership will be rewarding and look forward to seeing your successful candidate submissions soon.
        
        If you have any questions in the meantime, feel free to reach out to us at partner@sourcingscreen.com.
        
        Welcome aboard!
        
        Warm regards,
        Team SourcingScreen
        https://sourcingscreen.com/
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending recruiter welcome email:", error);
    return false;
  }
};

// General welcome email for non-recruiter users (without PDF attachment)
export const sendWelcomeEmail = async (
  email: string,
  name: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: "SourcingScreen",
        address: process.env.ZOHO_EMAIL!,
      },
      to: email,
      subject: "Welcome to SourcingScreen!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to SourcingScreen</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; }
            .content { padding: 40px 30px; color: #333; }
            .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
            .welcome-text { font-size: 16px; margin-bottom: 25px; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #666; }
            .website-link { color: #667eea; text-decoration: none; font-weight: bold; }
            .website-link:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to SourcingScreen!</h1>
            </div>
            <div class="content">
              <div class="greeting">
                Dear ${name},
              </div>
              
              <div class="welcome-text">
                Welcome to SourcingScreen! We're excited to have you on board.
              </div>
              
              <p>Thank you for joining our platform. We're committed to providing you with the best experience possible.</p>
              
              <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>Team SourcingScreen</strong><br>
                <a href="https://sourcingscreen.com/" class="website-link">https://sourcingscreen.com/</a>
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SourcingScreen. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Dear ${name},
        
        Welcome to SourcingScreen! We're excited to have you on board.
        
        Thank you for joining our platform. We're committed to providing you with the best experience possible.
        
        If you have any questions or need assistance, please don't hesitate to reach out to our support team.
        
        Best regards,
        Team SourcingScreen
        https://sourcingscreen.com/
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};

export const sendContactFormEmail = async (
  formData: ContactFormData
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const emailTemplate = getContactFormEmailTemplate(formData);

    const mailOptions = {
      from: {
        name: "SourcingScreen Contact Form",
        address: process.env.ZOHO_EMAIL!,
      },
      to: process.env.ZOHO_EMAIL!, // Send to your own email
      replyTo: "partner@sourcingscreen.com",
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Contact form email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending contact form email:", error);
    return false;
  }
};

// Support ticket interfaces
interface SupportTicketData {
  ticketNumber: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
}

interface TicketResponseData {
  ticketNumber: string;
  subject: string;
  responseMessage: string;
  respondedBy: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
}

// Support ticket email templates
const getNewTicketEmailTemplate = (ticketData: SupportTicketData) => {
  const priorityColor =
    {
      Low: "#28a745",
      Medium: "#ffc107",
      High: "#fd7e14",
      Critical: "#dc3545",
    }[ticketData.priority] || "#6c757d";

  const categoryIcon =
    {
      "Technical Issue": "🔧",
      "Account Issue": "👤",
      "Feature Request": "💡",
      "General Inquiry": "❓",
      "Bug Report": "🐛",
    }[ticketData.category] || "📝";

  return {
    subject: `🎫 New Support Ticket: ${ticketData.subject} [${ticketData.ticketNumber}]`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Support Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .ticket-info { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; }
          .info-item { margin: 15px 0; }
          .info-label { font-weight: bold; color: #333; display: inline-block; width: 120px; }
          .info-value { color: #555; }
          .priority-badge { 
            display: inline-block; 
            padding: 4px 12px; 
            border-radius: 20px; 
            color: white; 
            font-weight: bold; 
            font-size: 12px;
            background-color: ${priorityColor};
          }
          .category-badge { 
            display: inline-block; 
            padding: 4px 12px; 
            border-radius: 4px; 
            background-color: #e9ecef; 
            color: #495057; 
            font-size: 12px;
            font-weight: bold;
          }
          .message-box { 
            background-color: #fff; 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 20px 0; 
            line-height: 1.6;
          }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .action-box { 
            background-color: #e8f4fd; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 20px 0; 
            text-align: center;
          }
          .action-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px;
          }
          .urgent-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 New Support Ticket</h1>
          </div>
          <div class="content">
            ${
              ticketData.priority === "Critical" ||
              ticketData.priority === "High"
                ? `
            <div class="urgent-notice">
              <strong>⚠️ ${ticketData.priority} Priority Ticket:</strong> This ticket requires immediate attention. Please respond as soon as possible.
            </div>
            `
                : ""
            }
            
            <h2>Ticket Information</h2>
            <div class="ticket-info">
              <div class="info-item">
                <span class="info-label">Ticket #:</span>
                <span class="info-value"><strong>${
                  ticketData.ticketNumber
                }</strong></span>
              </div>
              <div class="info-item">
                <span class="info-label">Subject:</span>
                <span class="info-value">${ticketData.subject}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Category:</span>
                <span class="info-value">
                  <span class="category-badge">${categoryIcon} ${
      ticketData.category
    }</span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Priority:</span>
                <span class="info-value">
                  <span class="priority-badge">${ticketData.priority}</span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Submitted By:</span>
                <span class="info-value">
                  ${ticketData.userName} 
                  (<a href="mailto:${
                    ticketData.userEmail
                  }" style="color: #667eea;">${ticketData.userEmail}</a>)
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Submitted At:</span>
                <span class="info-value">${ticketData.createdAt.toLocaleString(
                  "en-IN",
                  {
                    timeZone: "Asia/Kolkata",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}</span>
              </div>
            </div>
            
            <h2>Message</h2>
            <div class="message-box">
              <p style="white-space: pre-wrap; margin: 0;">${
                ticketData.message
              }</p>
            </div>
            
            <div class="action-box">
              <h3 style="margin: 0 0 15px 0; color: #0066cc;">Quick Actions</h3>
              <a href="mailto:${ticketData.userEmail}?subject=Re: ${
      ticketData.subject
    } [${ticketData.ticketNumber}]" class="action-button">
                📧 Reply to User
              </a>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                Log in to the admin panel to manage this ticket and update its status.
              </p>
            </div>
            
          </div>
          <div class="footer">
            <p>This email was automatically generated from the SourcingScreen support system.</p>
            <p>&copy; ${new Date().getFullYear()} SourcingScreen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      NEW SUPPORT TICKET SUBMITTED
      ============================
      
      ${
        ticketData.priority === "Critical" || ticketData.priority === "High"
          ? `⚠️ ${ticketData.priority} PRIORITY TICKET - IMMEDIATE ATTENTION REQUIRED\n`
          : ""
      }
      
      Ticket Information:
      Ticket #: ${ticketData.ticketNumber}
      Subject: ${ticketData.subject}
      Category: ${ticketData.category}
      Priority: ${ticketData.priority}
      Submitted By: ${ticketData.userName} (${ticketData.userEmail})
      Submitted At: ${ticketData.createdAt.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}
      
      Message:
      ${ticketData.message}
      
      Quick Actions:
      - Reply to user: ${ticketData.userEmail}
      - Subject: Re: ${ticketData.subject} [${ticketData.ticketNumber}]
      
      Log in to the admin panel to manage this ticket and update its status.
      
      This email was automatically generated from the SourcingScreen support system.
    `,
  };
};

const getTicketResponseEmailTemplate = (responseData: TicketResponseData) => {
  return {
    subject: `📬 Response to Your Support Ticket [${responseData.ticketNumber}]`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Support Ticket Response</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .ticket-info { background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; }
          .info-item { margin: 15px 0; }
          .info-label { font-weight: bold; color: #333; display: inline-block; width: 120px; }
          .info-value { color: #555; }
          .response-box { 
            background-color: #fff; 
            border: 1px solid #28a745; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 20px 0; 
            line-height: 1.6;
          }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .action-box { 
            background-color: #e8f5e8; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 20px 0; 
            text-align: center;
          }
          .action-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 Support Team Response</h1>
          </div>
          <div class="content">
            <h2>Hello ${responseData.userName}!</h2>
            <p>We've responded to your support ticket. Here are the details:</p>
            
            <div class="ticket-info">
              <div class="info-item">
                <span class="info-label">Ticket #:</span>
                <span class="info-value"><strong>${
                  responseData.ticketNumber
                }</strong></span>
              </div>
              <div class="info-item">
                <span class="info-label">Subject:</span>
                <span class="info-value">${responseData.subject}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Responded By:</span>
                <span class="info-value">${responseData.respondedBy}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Response Date:</span>
                <span class="info-value">${responseData.createdAt.toLocaleString(
                  "en-IN",
                  {
                    timeZone: "Asia/Kolkata",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}</span>
              </div>
            </div>
            
            <h2>Our Response</h2>
            <div class="response-box">
              <p style="white-space: pre-wrap; margin: 0;">${
                responseData.responseMessage
              }</p>
            </div>
            
            <div class="action-box">
              <h3 style="margin: 0 0 15px 0; color: #155724;">Need Further Assistance?</h3>
              <p style="margin: 10px 0; color: #155724;">
                If you need additional help or have follow-up questions, you can:
              </p>
              <a href="mailto:${process.env.ZOHO_EMAIL}?subject=Re: ${
      responseData.subject
    } [${responseData.ticketNumber}]" class="action-button">
                📧 Reply to This Ticket
              </a>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                Or log in to your dashboard to view all your support tickets.
              </p>
            </div>
            
            <p>Thank you for using our support system. We're here to help!</p>
            <p>Best regards,<br>The SourcingScreen Support Team</p>
            
          </div>
          <div class="footer">
            <p>This email was automatically generated from the SourcingScreen support system.</p>
            <p>&copy; ${new Date().getFullYear()} SourcingScreen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      SUPPORT TEAM RESPONSE
      =====================
      
      Hello ${responseData.userName}!
      
      We've responded to your support ticket. Here are the details:
      
      Ticket Information:
      Ticket #: ${responseData.ticketNumber}
      Subject: ${responseData.subject}
      Responded By: ${responseData.respondedBy}
      Response Date: ${responseData.createdAt.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}
      
      Our Response:
      ${responseData.responseMessage}
      
      Need Further Assistance?
      If you need additional help or have follow-up questions, please reply to this email or log in to your dashboard to view all your support tickets.
      
      Thank you for using our support system. We're here to help!
      
      Best regards,
      The SourcingScreen Support Team
      
      This email was automatically generated from the SourcingScreen support system.
    `,
  };
};

// Support ticket email functions
export const sendNewTicketNotification = async (
  ticketData: SupportTicketData,
  supportEmail?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const transporter = createTransporter();
    const emailTemplate = getNewTicketEmailTemplate(ticketData);

    // Use provided support email or fallback to default
    const toEmail = supportEmail || process.env.ZOHO_EMAIL!;

    const mailOptions = {
      from: {
        name: "SourcingScreen Support System",
        address: process.env.ZOHO_EMAIL!,
      },
      to: toEmail,
      replyTo: "partner@sourcingscreen.com",
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `New ticket notification sent successfully to ${toEmail}:`,
      result.messageId
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending new ticket notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const sendTicketResponseNotification = async (
  responseData: TicketResponseData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const transporter = createTransporter();
    const emailTemplate = getTicketResponseEmailTemplate(responseData);

    const mailOptions = {
      from: {
        name: "SourcingScreen Support Team",
        address: process.env.ZOHO_EMAIL!,
      },
      to: responseData.userEmail,
      replyTo: "partner@sourcingscreen.com",
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Ticket response notification sent successfully to ${responseData.userEmail}:`,
      result.messageId
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending ticket response notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
