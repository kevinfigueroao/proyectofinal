// utils/email.js
import nodemailer  from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: 'veronica.pineda@virginiogomez.cl',
    pass: 'uywv riiy zeuz ipjt', // Usa una contraseña de aplicación, NO la normal
  },
});


export async function sendConfirmationEmail(to, subject, text) {
   const mailOptions = {
    from: 'veronica.pineda@virginiogomez.cl',
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
}

