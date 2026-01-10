const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send OTP email with optional password (for Admin/Employee account creation)
const sendOTPEmail = async (email, otpCode, firstName = 'User', password = null, userId = null) => {
  try {
    const transporter = createTransporter();
    
    // Generate verification URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = userId 
      ? `${frontendUrl}/verify-otp?userId=${userId}&email=${encodeURIComponent(email)}`
      : `${frontendUrl}/verify-otp`;

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'RBAC Auth'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email - OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p>Hello ${firstName},</p>
            ${password ? `
            <p>Your account has been created! Please use the following credentials to access your account:</p>
            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
            </div>
            <p><strong>Important:</strong> Please verify your email address using the OTP code below, then change your password after logging in.</p>
            ` : `
            <p>Thank you for signing up! Please use the following OTP code to verify your email address:</p>
            `}
            <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h1 style="color: #333; font-size: 32px; letter-spacing: 5px; margin: 0;">${otpCode}</h1>
            </div>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #333; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="text-align: center; color: #666; font-size: 12px;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 11px; text-align: center;">${verifyUrl}</p>
            <p>If you didn't create an account, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Email Verification
        
        Hello ${firstName},
        
        ${password ? `
        Your account has been created! Please use the following credentials to access your account:
        
        Email: ${email}
        Temporary Password: ${password}
        
        Important: Please verify your email address using the OTP code below, then change your password after logging in.
        ` : `
        Thank you for signing up! Please use the following OTP code to verify your email address:
        `}
        
        OTP Code: ${otpCode}
        
        This code will expire in 10 minutes.
        
        Verify your email by clicking this link:
        ${verifyUrl}
        
        If you didn't create an account, please ignore this email.
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    throw new Error('Failed to send OTP email. Please try again later.');
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetUrl, firstName = 'User') => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'RBAC Auth'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p>Hello ${firstName},</p>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #333; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
            <p><strong>This link will expire in 10 minutes.</strong></p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello ${firstName},
        
        You requested to reset your password. Click the link below to reset it:
        
        ${resetUrl}
        
        This link will expire in 10 minutes.
        
        If you didn't request a password reset, please ignore this email.
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    throw new Error('Failed to send password reset email. Please try again later.');
  }
};

module.exports = { sendOTPEmail, sendPasswordResetEmail };
