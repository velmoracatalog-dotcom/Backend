import nodemailer from "nodemailer";
import { hasSmtp, smtpConfig } from "../config/env.js";

export { hasSmtp };

export async function sendOtpEmail(to: string, code: string) {
  if (!hasSmtp()) {
    throw new Error("Add SMTP_HOST, SMTP_USER and SMTP_PASS to backend/.env first");
  }

  const smtp = smtpConfig();
  const from = smtp.from.includes("@") && !smtp.from.includes("noreply@velmora.com")
    ? smtp.from
    : `Velmora <${smtp.user}>`;

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject: `${code} is your Velmora code`,
    text: `Your Velmora verification code is ${code}. It expires in 10 minutes. If you did not ask for this, ignore the email.`,
    html: `
      <div style="background:#f7f4ef;padding:40px 16px;font-family:Georgia,serif;color:#141414">
        <div style="max-width:440px;margin:0 auto;background:#fff;border:1px solid #e4ddd2;padding:36px 32px">
          <p style="margin:0;letter-spacing:0.28em;font-size:11px;color:#8b7355;text-transform:uppercase">Velmora</p>
          <h1 style="margin:16px 0 12px;font-size:28px;font-weight:500">Your code</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#6f6860">
            Enter this code to finish signing in. It expires in 10 minutes.
          </p>
          <p style="margin:0 0 28px;letter-spacing:0.4em;font-size:32px;font-weight:600">${code}</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#6f6860">
            If you did not request this, you can ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}
