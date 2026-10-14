import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else if (user && pass) {
    // Standard Gmail or common service
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  } else {
    // Fallback: log to console during development
    transporter = {
      sendMail: async (options) => {
        console.log('───────────────────────────────────────────────────────');
        console.log('✉️  EMAIL (NO SMTP CONFIGURED — FALLBACK SIMULATOR) ✉️');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Text Preview: ${options.text || '(HTML message)'}`);
        console.log('───────────────────────────────────────────────────────');
        return { messageId: 'simulated-' + Date.now() };
      },
    };
  }

  return transporter;
}

export async function sendOtpEmail(email, otp, name = 'there') {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@sati.com';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Your SATI Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7f3eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171512;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f3eb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid rgba(0, 0, 0, 0.08); overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
                <tr>
                  <td style="background-color: #e94717; padding: 24px 32px; text-align: center;">
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: normal; color: #ffffff; letter-spacing: 0.15em;">SATI</h1>
                    <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255, 255, 255, 0.85);">Timeless Atelier</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 32px;">
                    <h2 style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 22px; color: #171512;">Verify your email address</h2>
                    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #706c66;">
                      Hello ${name},<br />
                      Thank you for creating an account with SATI. Use the verification code below to complete your registration.
                    </p>
                    <div style="background-color: #f7f3eb; border: 1px dashed #e94717; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
                      <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #8b867e;">Your 6-Digit OTP</p>
                      <div style="font-family: monospace, Courier; font-size: 36px; font-weight: bold; letter-spacing: 0.25em; color: #e94717; margin-left: 0.25em;">
                        ${otp}
                      </div>
                      <p style="margin: 10px 0 0 0; font-size: 11px; color: #8b867e;">Expires in 10 minutes</p>
                    </div>
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #8b867e;">
                      If you didn't request this code, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f7f3eb; padding: 18px 32px; text-align: center; border-top: 1px solid rgba(0, 0, 0, 0.06); font-size: 11px; color: #8b867e;">
                    &copy; ${new Date().getFullYear()} SATI Atelier. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return mailer.sendMail({
    from: `"SATI" <${from}>`,
    to: email,
    subject: `${otp} is your SATI verification code`,
    text: `Your SATI verification code is: ${otp}. It expires in 10 minutes.`,
    html,
  });
}

export async function sendPasswordResetEmail(email, otp, name = 'there') {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@sati.com';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Reset Your SATI Password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7f3eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171512;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f3eb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid rgba(0, 0, 0, 0.08); overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
                <tr>
                  <td style="background-color: #171512; padding: 24px 32px; text-align: center;">
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: normal; color: #ffffff; letter-spacing: 0.15em;">SATI</h1>
                    <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255, 255, 255, 0.85);">Security & Account Recovery</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 32px;">
                    <h2 style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 22px; color: #171512;">Password Reset Request</h2>
                    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #706c66;">
                      Hello ${name},<br />
                      We received a request to reset your SATI account password. Use the verification code below to set a new password.
                    </p>
                    <div style="background-color: #f7f3eb; border: 1px dashed #e94717; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
                      <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #8b867e;">Your 6-Digit Reset Code</p>
                      <div style="font-family: monospace, Courier; font-size: 36px; font-weight: bold; letter-spacing: 0.25em; color: #e94717; margin-left: 0.25em;">
                        ${otp}
                      </div>
                      <p style="margin: 10px 0 0 0; font-size: 11px; color: #8b867e;">Expires in 10 minutes</p>
                    </div>
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #8b867e;">
                      If you did not request this password reset, please ignore this email or contact support if you suspect unauthorized activity.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f7f3eb; padding: 18px 32px; text-align: center; border-top: 1px solid rgba(0, 0, 0, 0.06); font-size: 11px; color: #8b867e;">
                    &copy; ${new Date().getFullYear()} SATI Atelier. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return mailer.sendMail({
    from: `"SATI" <${from}>`,
    to: email,
    subject: `${otp} is your SATI password reset code`,
    text: `Your SATI password reset code is: ${otp}. It expires in 10 minutes.`,
    html,
  });
}

export async function sendContactNotificationEmail({
  from_name,
  from_email,
  from_phone,
  message,
  recipientEmail,
}) {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@sati.com';
  const to = recipientEmail || process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'surajacharya239@gmail.com';

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 20px; background-color: #f7f3eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #171512;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); padding: 32px;">
          <h2 style="color: #e94717; margin-top: 0;">New Contact Form Message</h2>
          <p><strong>From:</strong> ${from_name}</p>
          <p><strong>Email:</strong> <a href="mailto:${from_email}">${from_email}</a></p>
          <p><strong>Phone:</strong> ${from_phone || 'Not provided'}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Message:</strong></p>
          <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message}</div>
        </div>
      </body>
    </html>
  `;

  return mailer.sendMail({
    from: `"SATI Atelier Contact" <${from}>`,
    to,
    replyTo: from_email,
    subject: `New Inquiry from ${from_name} — SATI Atelier`,
    text: `From: ${from_name} (${from_email}, Phone: ${from_phone || 'N/A'})\n\nMessage:\n${message}`,
    html,
  });
}


