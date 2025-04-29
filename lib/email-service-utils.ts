// lib/email-service-utils.ts

import nodemailer from "nodemailer"

// Function to send email
async function sendEmail(to: string, subject: string, html: string) {
  // Only allow this in production server environment
  if (process.env.NODE_ENV !== "production") {
    console.log("Email sending skipped in development/preview mode")
    return { success: true, message: "Email sending skipped in development mode" }
  }

  try {
    // Create a transporter using email credentials from environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Get the sender email and name from environment variables
    const SENDER_EMAIL = process.env.EMAIL_USER || "news@yourdomain.com"
    const SENDER_NAME = process.env.SENDER_NAME || "News Digest"

    // Send the email
    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Email sending error:", error)
    return {
      error: "Failed to send email",
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Function to create confirmation email HTML
function createConfirmationEmailHtml(
  name: string,
  email: string,
  emailPreferences: { updates: boolean; offers: boolean; newsletter: boolean },
  confirmationLink: string,
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirm Your Subscription</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; }
        .content { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { margin-top: 30px; font-size: 0.9em; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 15px; }
      </style>
    </head>
    <body>
      <h1>Confirm Your Subscription</h1>
      <p>Hello ${name},</p>
      
      <div class="content">
        <p>Thank you for subscribing to our personalized news digest!</p>
        <p>Please confirm your email address by clicking the button below:</p>
        <a href="${confirmationLink}" class="button">Confirm Subscription</a>
      </div>
      
      <p>You will receive updates based on your selected preferences:</p>
      <ul>
        <li>Updates: ${emailPreferences.updates ? "Yes" : "No"}</li>
        <li>Offers: ${emailPreferences.offers ? "Yes" : "No"}</li>
        <li>Newsletter: ${emailPreferences.newsletter ? "Yes" : "No"}</li>
      </ul>
      
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `
}

export { sendEmail, createConfirmationEmailHtml }
