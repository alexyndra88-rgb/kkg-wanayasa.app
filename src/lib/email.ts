/**
 * Email Service for KKG Portal
 * Supports multiple email providers: Resend, SendGrid, or SMTP
 */

export interface EmailConfig {
    provider: 'resend' | 'sendgrid' | 'smtp';
    apiKey?: string;
    from?: string;
    fromName?: string;
}

export interface EmailMessage {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

// ============================================
// Email Templates
// ============================================

export function getPasswordResetEmailTemplate(resetUrl: string, userName: string): { html: string; text: string } {
    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Portal KKG</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                📚 Portal Digital KKG
              </h1>
              <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">
                Gugus 3 Kecamatan Wanayasa
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">
                Halo, ${userName}! 👋
              </h2>
              
              <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                Kami menerima permintaan untuk mereset password akun Portal KKG Anda. 
                Klik tombol di bawah ini untuk membuat password baru:
              </p>
              
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                      🔐 Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #64748b; font-size: 14px; line-height: 1.6;">
                <strong>⏰ Link ini akan kadaluarsa dalam 1 jam.</strong>
              </p>
              
              <p style="margin: 0 0 20px; color: #64748b; font-size: 14px; line-height: 1.6;">
                Jika Anda tidak meminta reset password, abaikan email ini. 
                Password Anda akan tetap aman.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                Jika tombol tidak berfungsi, salin dan tempel link berikut ke browser Anda:<br>
                <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © ${new Date().getFullYear()} Portal Digital KKG Gugus 3 Wanayasa<br>
                Kabupaten Purwakarta, Jawa Barat
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

    const text = `
Halo, ${userName}!

Kami menerima permintaan untuk mereset password akun Portal KKG Anda.

Klik link berikut untuk membuat password baru:
${resetUrl}

Link ini akan kadaluarsa dalam 1 jam.

Jika Anda tidak meminta reset password, abaikan email ini.

---
Portal Digital KKG Gugus 3 Wanayasa
Kabupaten Purwakarta, Jawa Barat
  `;

    return { html, text };
}

export function getWelcomeEmailTemplate(userName: string, loginUrl: string): { html: string; text: string } {
    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Selamat Datang - Portal KKG</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                🎉 Selamat Datang!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">
                Halo, ${userName}! 👋
              </h2>
              <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                Selamat bergabung dengan Portal Digital KKG Gugus 3 Wanayasa!
              </p>
              <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.6;">
                Anda sekarang dapat mengakses berbagai fitur menarik seperti:
              </p>
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #475569;">
                <li>📧 Generator Surat Undangan dengan AI</li>
                <li>📋 Generator Program Kerja</li>
                <li>✅ Absensi Digital</li>
                <li>📚 Repository Materi</li>
                <li>💬 Forum Diskusi</li>
              </ul>
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                      🚀 Mulai Menggunakan Portal
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © ${new Date().getFullYear()} Portal Digital KKG Gugus 3 Wanayasa
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

    const text = `
Halo, ${userName}!

Selamat bergabung dengan Portal Digital KKG Gugus 3 Wanayasa!

Anda sekarang dapat mengakses berbagai fitur menarik seperti:
- Generator Surat Undangan dengan AI
- Generator Program Kerja
- Absensi Digital
- Repository Materi
- Forum Diskusi

Mulai menggunakan portal: ${loginUrl}

---
Portal Digital KKG Gugus 3 Wanayasa
  `;

    return { html, text };
}

// ============================================
// Email Sending Functions
// ============================================

async function sendViaResend(apiKey: string, from: string, message: EmailMessage): Promise<boolean> {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: from,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Resend API error:', error);
        return false;
    }

    return true;
}

async function sendViaSendGrid(apiKey: string, from: string, message: EmailMessage): Promise<boolean> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            personalizations: [{ to: [{ email: message.to }] }],
            from: { email: from },
            subject: message.subject,
            content: [
                { type: 'text/plain', value: message.text || message.subject },
                { type: 'text/html', value: message.html },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('SendGrid API error:', error);
        return false;
    }

    return true;
}

// ============================================
// Main Email Service
// ============================================

export async function sendEmail(
    config: EmailConfig,
    message: EmailMessage
): Promise<{ success: boolean; error?: string }> {
    try {
        const from = config.from || 'noreply@kkg-wanayasa.id';

        if (!config.apiKey) {
            console.error('Email API key not configured');
            return { success: false, error: 'Email service not configured' };
        }

        let success = false;

        switch (config.provider) {
            case 'resend':
                success = await sendViaResend(config.apiKey, from, message);
                break;
            case 'sendgrid':
                success = await sendViaSendGrid(config.apiKey, from, message);
                break;
            default:
                console.error('Unknown email provider:', config.provider);
                return { success: false, error: 'Unknown email provider' };
        }

        return { success };
    } catch (error: any) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// Helper Functions
// ============================================

export function generateResetToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function getResetTokenExpiry(): string {
    // Token expires in 1 hour
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    return expiry.toISOString();
}
