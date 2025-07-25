// src/lib/emailService.ts
import nodemailer from 'nodemailer';

// Create transporter for Zoho Mail
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.ZOHO_EMAIL, // Your Zoho email
      pass: process.env.ZOHO_APP_PASSWORD, // Your Zoho app password
    },
    tls: {
      rejectUnauthorized: false
    }
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
    subject: 'Verify Your Email Address - OTP Code',
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
            
            <p>Best regards,<br>The Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
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
      The Team
      
      This is an automated message, please do not reply to this email.
    `
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
                  <a href="mailto:${formData.email}" style="color: #667eea;">${formData.email}</a>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">
                  <a href="tel:${formData.phone}" style="color: #667eea;">${formData.phone}</a>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Company:</span>
                <span class="info-value">${formData.company}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Submitted:</span>
                <span class="info-value">${new Date().toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}</span>
              </div>
            </div>
            
            <h2>Message</h2>
            <div class="message-box">
              <p style="white-space: pre-wrap; line-height: 1.6; margin: 0;">${formData.message}</p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #e8f4fd; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #0066cc;">Quick Actions</h3>
              <p style="margin: 5px 0;">
                <strong>Reply:</strong> 
                <a href="mailto:${formData.email}?subject=Re: Your inquiry - SourcingScreen" style="color: #667eea;">
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
      Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      
      Message:
      ${formData.message}
      
      Quick Actions:
      - Reply via email: ${formData.email}
      - Call: ${formData.phone}
      
      This email was automatically generated from the SourcingScreen contact form.
    `
  };
};

export const sendOTPEmail = async (email: string, name: string, otp: string): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const emailTemplate = getOTPEmailTemplate(name, otp);
    
    const mailOptions = {
      from: {
        name: 'Sourcing Screen',
        address: process.env.ZOHO_EMAIL!,
      },
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Sourcing Screen',
        address: process.env.ZOHO_EMAIL!,
      },
      to: email,
      subject: 'Welcome to Our Platform!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Our Platform!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Congratulations! Your account has been successfully created and verified.</p>
              <p>You can now access all the features of our platform. We're excited to have you on board!</p>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!
        
        Congratulations! Your account has been successfully created and verified.
        
        You can now access all the features of our platform. We're excited to have you on board!
        
        If you have any questions, feel free to reach out to our support team.
        
        Best regards,
        The Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

export const sendContactFormEmail = async (formData: ContactFormData): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const emailTemplate = getContactFormEmailTemplate(formData);
    
    const mailOptions = {
      from: {
        name: 'SourcingScreen Contact Form',
        address: process.env.ZOHO_EMAIL!,
      },
      to: process.env.ZOHO_EMAIL!, // Send to your own email
      replyTo: formData.email, // Allow direct reply to the form submitter
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Contact form email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending contact form email:', error);
    return false;
  }
};