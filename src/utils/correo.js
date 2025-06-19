// utils/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'veronica.pineda@virginiogomez.cl',
    pass: 'xiil wrof tgpj mhdu', // Usa una contraseña de aplicación, NO la normal
  },
});


export async function sendConfirmationEmail(to, subject, html) {
  const mailOptions = {
    from: 'veronica.pineda@virginiogomez.cl',
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
}

