import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

let transporter;

export const initializeEmailService = async () => {
  try {
    // Check if SMTP is properly configured
    console.log('🔍 Checking SMTP config:', {
      user: config.smtp.user,
      password: config.smtp.password ? '***' : 'undefined',
      host: config.smtp.host
    });
    
    const isSmtpConfigured = config.smtp.user !== 'your-email@gmail.com' && 
                             config.smtp.password !== 'your-app-password' &&
                             config.smtp.user && config.smtp.password;

    console.log('🔍 SMTP Configured:', isSmtpConfigured);

    if (!isSmtpConfigured) {
      console.warn('⚠️ SMTP not configured. Using test mode (emails will be logged, not sent)');
      console.log('❌ SMTP config details:', {
        userMatches: config.smtp.user === 'your-email@gmail.com',
        userValue: config.smtp.user,
        passwordMatches: config.smtp.password === 'your-app-password',
        passwordValue: config.smtp.password,
        userTruthy: !!config.smtp.user,
        passwordTruthy: !!config.smtp.password
      });
      // Create a test transporter that doesn't actually send emails
      transporter = {
        sendMail: async (options) => {
          return { messageId: 'test-' + Date.now() };
        },
        verify: (callback) => callback(null, true)
      };
    } else {
      console.log('✅ SMTP PROPERLY CONFIGURED - attempting real email');
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.password
        }
      });

      // Verify SMTP configuration and fall back to test transporter on auth errors
      try {
        await transporter.verify();
      } catch (verifyErr) {
        console.error('⚠️ SMTP verification failed:', verifyErr && verifyErr.message);
        console.warn('Falling back to test email mode to avoid runtime failures. Fix SMTP credentials to enable real email sending.');
        transporter = {
          sendMail: async (options) => {
            return { messageId: 'fallback-test-' + Date.now() };
          },
          verify: (callback) => callback(null, true)
        };
      }
    }
  } catch (error) {
    console.error('❌ Error initializing email service:', error);
    // Fallback to test transporter
    transporter = {
      sendMail: async (options) => {
        return { messageId: 'fallback-' + Date.now() };
      },
      verify: (callback) => callback(null, true)
    };
    return transporter;
  }
};

export const sendRegistrationEmail = async (email, name, verificationLink) => {
  try {
    if (!transporter) {
      console.error('❌ Email transporter not initialized');
      throw new Error('Email service not initialized. Please call initializeEmailService() first.');
    }

    await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: 'Welcome to Hotel Booking - Verify Your Email',
      html: `
        <h2>Welcome, ${name}!</h2>
        <p>Thank you for registering at Hotel Booking.</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>Or copy this link: ${verificationLink}</p>
        <p>This link expires in 24 hours.</p>
      `
    });
  } catch (error) {
    console.error('Error sending registration email:', error.message);
    throw error;
  }
};

export const sendBookingConfirmationEmail = async (email, bookingDetails) => {
  try {
    if (!transporter) {
      console.error('❌ Email transporter not initialized');
      throw new Error('Email service not initialized. Please call initializeEmailService() first.');
    }

    const { bookingId, hotelName, roomType, checkIn, checkOut, totalPrice, guestName } = bookingDetails;
    
    await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: `Booking Confirmation - ${bookingId}`,
      html: `
        <h2>Booking Confirmation</h2>
        <p>Dear ${guestName},</p>
        <p>Your booking has been confirmed!</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Booking ID:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Hotel:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${hotelName}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Room Type:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${roomType}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Check-In:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${checkIn}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Check-Out:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${checkOut}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Price:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">$${totalPrice}</td>
          </tr>
        </table>
        <p>Thank you for booking with us!</p>
      `
    });
  } catch (error) {
    console.error('Error sending booking confirmation email:', error.message);
    throw error;
  }
};

export const sendBillEmail = async (email, billDetails, pdfBuffer) => {
  // Billing emails removed — keep function as a no-op to avoid runtime errors from leftover imports.
};

export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    if (!transporter) {
      console.error('❌ Email transporter not initialized');
      throw new Error('Email service not initialized. Please call initializeEmailService() first.');
    }

    await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>We received a request to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>Or copy this link: ${resetLink}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
    throw error;
  }
};

export const sendAdminNotificationEmail = async (adminEmail, subject, message, details = {}) => {
  try {
    if (!transporter) {
      console.error('❌ Email transporter not initialized');
      throw new Error('Email service not initialized. Please call initializeEmailService() first.');
    }

    await transporter.sendMail({
      from: config.smtp.from,
      to: adminEmail,
      subject: `[Admin Notification] ${subject}`,
      html: `
        <h2>Admin Notification</h2>
        <p>${message}</p>
        <h3>Details:</h3>
        <ul>
          ${Object.entries(details).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
        </ul>
      `
    });
  } catch (error) {
    console.error('Error sending admin notification:', error.message);
    throw error;
  }
};

// NEW: Send OTP email for booking
export const sendOTPEmail = async (email, otp, purpose = 'booking') => {
  try {
    if (!transporter) {
      console.error('❌ Email transporter not initialized');
      throw new Error('Email service not initialized. Please call initializeEmailService() first.');
    }

    const purposeText = purpose === 'booking' ? 'booking' : 'ID retrieval';
    
    await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: `Your OTP for ${purposeText} - Aishwaryam Inn`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Aishwaryam Inn</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for ${purposeText} is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #1e40af; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          <p><strong>This OTP is valid for 5 minutes only.</strong></p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            Aishwaryam Inn<br>
            Yercaud, Tamil Nadu
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    throw error;
  }
};

// NEW: Send unique ID to guest
export const sendUniqueIdEmail = async (email, uniqueId, name) => {
  try {
    if (!transporter) {
      console.error('❌ Email transporter not initialized');
      throw new Error('Email service not initialized. Please call initializeEmailService() first.');
    }

    // Format uniqueId safely - handle different lengths
    const idStr = String(uniqueId);
    const formattedId = idStr.length >= 14 
      ? `${idStr.slice(0, 2)}-${idStr.slice(2, 6)}-${idStr.slice(6, 10)}-${idStr.slice(10)}`
      : idStr; // fallback to original if too short
    
    await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: 'Your Booking ID - Aishwaryam Inn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Aishwaryam Inn</h2>
          <p>Hello ${name},</p>
          <p>Your Unique Booking ID is:</p>
          <div style="background-color: #dbeafe; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px dashed #2563eb;">
            <h1 style="color: #1e40af; font-size: 28px; letter-spacing: 4px; margin: 0;">${formattedId}</h1>
          </div>
          <p><strong>Important:</strong> Use this ID to view and manage all your bookings at:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="http://localhost:3001/my-bookings" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View My Bookings
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Please save this ID for future reference. You'll need it to check your booking status, view details, or make changes.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            Aishwaryam Inn<br>
            No. 1, Suguna Vilas 1st Cross<br>
            Yercaud - 636 602, Tamil Nadu<br>
            Phone: 9443224498
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending unique ID email:', error.message);
    throw error;
  }
};

// NEW: Send booking confirmation with unique ID
// NEW: Send direct HTML email (for bill template)
export const sendHtmlEmail = async (to, subject, html, attachments = []) => {
  try {
    if (!transporter) {
      console.error('❌ Email transporter not initialized');
      throw new Error('Email service not initialized. Please call initializeEmailService() first.');
    }

    const result = await transporter.sendMail({
      from: config.smtp.from,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error in sendHtmlEmail:', error.message);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 200) + '...'
    });
    throw error;
  }
};

export const sendGuestBookingConfirmation = async (email, bookingDetails) => {
  try {
    if (!transporter) {
      console.error('❌ Email transporter not initialized');
      throw new Error('Email service not initialized. Please call initializeEmailService() first.');
    }

    const { 
      uniqueId, 
      confirmationNumber, 
      guestName, 
      hotelName, 
      roomType, 
      checkIn, 
      checkOut, 
      guests, 
      totalPrice 
    } = bookingDetails;
    
    // Format uniqueId safely - handle different lengths
    const idStr = String(uniqueId);
    const formattedId = idStr.length >= 14 
      ? `${idStr.slice(0, 2)}-${idStr.slice(2, 6)}-${idStr.slice(6, 10)}-${idStr.slice(10)}`
      : idStr; // fallback to original if too short
    
    await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: `Booking Confirmed #${confirmationNumber} - Aishwaryam Inn`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">✓ Booking Confirmed!</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #2563eb; margin-top: 0;">Aishwaryam Inn</h2>
            <p>Dear ${guestName},</p>
            <p>Your booking has been successfully confirmed. We look forward to welcoming you!</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Booking Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Confirmation Number:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${confirmationNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Hotel:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${hotelName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Room Type:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${roomType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Check-in:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${new Date(checkIn).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Check-out:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${new Date(checkOut).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Guests:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${guests}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 18px;">Total Amount:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #10b981; font-size: 18px;">₹${totalPrice}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; border: 2px solid #2563eb; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">📋 Your Unique Booking ID</h3>
              <div style="text-align: center; margin: 15px 0;">
                <span style="font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: 3px;">${formattedId}</span>
              </div>
              <p style="margin: 10px 0; font-size: 14px; color: #1e40af;">
                <strong>IMPORTANT:</strong> Save this ID! You'll need it to view or manage your bookings.
              </p>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="http://localhost:3001/my-bookings" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View My Bookings
              </a>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <h4 style="color: #92400e; margin-top: 0;">Check-in Information</h4>
              <ul style="color: #78350f; margin: 10px 0; padding-left: 20px;">
                <li>Check-in time: 2:00 PM</li>
                <li>Check-out time: 10:00 AM</li>
                <li>Please carry a valid ID proof</li>
                <li>Early check-in subject to availability</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions, please contact us at:<br>
              📞 Phone: 9443224498<br>
              📧 Email: aishwaryaminn@gmail.com
            </p>
          </div>
          
          <div style="background-color: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
            <p style="margin: 5px 0;">Aishwaryam Inn</p>
            <p style="margin: 5px 0;">No. 1, Suguna Vilas 1st Cross, Near Petrol Bunk</p>
            <p style="margin: 5px 0;">Nagalur Main Road, YERCAUD - 636 602, Tamil Nadu</p>
          </div>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending booking confirmation email:', error.message);
    throw error;
  }
};

