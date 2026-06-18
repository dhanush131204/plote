const nodemailer = require('nodemailer')

/**
 * Create transporter from env config.
 * Supports Gmail, SMTP, or falls back to Ethereal (dev test account).
 */
async function createTransporter() {
  // If SMTP credentials are set in .env, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // If Gmail shorthand is set
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })
  }

  // Fallback: Ethereal test account (prints preview URL to console in dev)
  const testAccount = await nodemailer.createTestAccount()
  console.log('⚠️  No SMTP config found. Using Ethereal test email account.')
  console.log(`   Ethereal user: ${testAccount.user}`)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  })
}

/**
 * Send a builder welcome + magic login link email.
 * @param {object} opts
 * @param {string} opts.to        - Builder's email address
 * @param {string} opts.name      - Builder's name
 * @param {string} opts.token     - Verification/magic login token
 * @param {string} opts.plan      - Selected plan name (optional)
 */
async function sendBuilderWelcomeEmail({ to, name, token, plan }) {
  const transporter = await createTransporter()

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const loginLink = `${frontendUrl}/verify-email?token=${token}${plan ? `&plan=${encodeURIComponent(plan)}` : ''}`
  const displayName = name || to.split('@')[0]
  const planText = plan ? `<strong style="color:#10b981">${plan}</strong>` : 'your selected plan'

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to PlotVision</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header gradient bar -->
          <tr>
            <td style="height:5px;background:linear-gradient(90deg,#34d399,#10b981,#059669);"></td>
          </tr>

          <!-- Logo + Brand -->
          <tr>
            <td style="padding:32px 40px 0;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="display:inline-table;">
                <tr>
                  <td style="background:linear-gradient(135deg,#10b981,#059669);border-radius:12px;padding:10px;vertical-align:middle;">
                    <img src="https://via.placeholder.com/24/ffffff/ffffff?text=+" width="24" height="24" alt="logo" style="display:block;" />
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:1.25rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">
                      Plot<span style="color:#10b981;">Vision</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:28px 40px 0;">
              <h1 style="margin:0 0 8px;font-size:1.75rem;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">
                Welcome, ${displayName}! 👋
              </h1>
              <p style="margin:0 0 20px;font-size:1rem;color:#475569;line-height:1.6;">
                Your PlotVision builder account has been created successfully.
                ${plan ? `You selected ${planText} — click the button below to log in and complete your subscription.` : 'Click the button below to log in to your account.'}
              </p>

              <!-- Plan badge -->
              ${plan ? `
              <div style="background:#ecfdf5;border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:12px 16px;margin-bottom:24px;display:inline-block;">
                <span style="font-size:0.8rem;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.05em;">Selected Plan</span>
                <p style="margin:4px 0 0;font-size:1rem;font-weight:700;color:#0f172a;">${plan}</p>
              </div>` : ''}

              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0;">
                <a href="${loginLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;text-decoration:none;font-size:1rem;font-weight:700;padding:16px 36px;border-radius:12px;box-shadow:0 4px 16px rgba(16,185,129,0.35);">
                  ✦ Log In to PlotVision →
                </a>
              </div>

              <p style="margin:0 0 8px;font-size:0.8125rem;color:#94a3b8;text-align:center;">
                This link expires in <strong>24 hours</strong>. Do not share it with anyone.
              </p>

              <!-- Divider -->
              <div style="height:1px;background:#f1f5f9;margin:24px 0;"></div>

              <!-- Link fallback -->
              <p style="margin:0 0 4px;font-size:0.8rem;color:#64748b;">If the button doesn't work, copy and paste this link:</p>
              <p style="margin:0;font-size:0.75rem;color:#10b981;word-break:break-all;">${loginLink}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;">
              <div style="height:1px;background:#f1f5f9;margin-bottom:20px;"></div>
              <p style="margin:0;font-size:0.75rem;color:#94a3b8;text-align:center;line-height:1.6;">
                You received this email because an account was created for you on PlotVision.<br/>
                If you did not request this, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.GMAIL_USER || '"PlotVision" <noreply@plotvision.app>',
    to,
    subject: plan
      ? `Your PlotVision account is ready — ${plan} plan`
      : 'Welcome to PlotVision — Your account is ready',
    html,
    text: `Welcome to PlotVision, ${displayName}!\n\nYour account has been created.${plan ? ` Selected plan: ${plan}.` : ''}\n\nClick to log in: ${loginLink}\n\nThis link expires in 24 hours.`,
  })

  // In dev with Ethereal, log the preview URL
  if (info.messageId && nodemailer.getTestMessageUrl(info)) {
    console.log(`📧 Email preview (Ethereal): ${nodemailer.getTestMessageUrl(info)}`)
  }

  return info
}

module.exports = { sendBuilderWelcomeEmail }
