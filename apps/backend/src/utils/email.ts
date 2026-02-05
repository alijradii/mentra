import crypto from "crypto";
import { Resend } from "resend";
import { getEnv, getRequiredEnv } from "./env";

// Initialize Resend client
const resend = new Resend(getRequiredEnv("RESEND_API_KEY"));
const EMAIL_FROM = getRequiredEnv("EMAIL_FROM");
const FRONTEND_URL = getEnv("FRONTEND_URL", "http://localhost:3011");

/**
 * Generate a random email verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Verify your email address - Mentra",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Mentra!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
              
              <p style="font-size: 16px; color: #555;">
                Thank you for signing up! To complete your registration and start using Mentra, please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 600;
                          font-size: 16px;
                          display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="font-size: 14px; color: #777; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 13px; color: #667eea; word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 6px;">
                ${verificationUrl}
              </p>
              
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 13px; color: #999; margin: 0;">
                  ⏱️ This link will expire in 24 hours for security reasons.
                </p>
                <p style="font-size: 13px; color: #999; margin: 10px 0 0 0;">
                  If you didn't create an account with Mentra, you can safely ignore this email.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Mentra. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`✅ Verification email sent successfully to ${email}`);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

/**
 * Send welcome email after successful email verification
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Welcome to Mentra! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Mentra!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
              
              <p style="font-size: 16px; color: #555;">
                Your email has been successfully verified. You're all set to start exploring Mentra!
              </p>
              
              <p style="font-size: 16px; color: #555;">
                We're excited to have you on board. Here's what you can do next:
              </p>
              
              <ul style="font-size: 15px; color: #555; line-height: 2;">
                <li>Complete your profile</li>
                <li>Explore the dashboard</li>
                <li>Discover new features</li>
              </ul>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${FRONTEND_URL}/dashboard" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 600;
                          font-size: 16px;
                          display: inline-block;">
                  Go to Dashboard
                </a>
              </div>
              
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 13px; color: #999; margin: 0;">
                  Need help? Feel free to reach out to our support team.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Mentra. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`✅ Welcome email sent successfully to ${name} (${email})`);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    // Don't throw error for welcome email - it's not critical
  }
}
