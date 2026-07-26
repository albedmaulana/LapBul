require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('User:', process.env.EMAIL_USER);
console.log('Pass:', process.env.EMAIL_PASS ? '***' : 'KOSONG');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Gunakan SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    // Abaikan error sertifikat SSL lokal (berguna jika diblokir Antivirus)
    rejectUnauthorized: false
  }
});

transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ ERROR NODEMAILER:', error);
  } else {
    console.log('✅ Server Email Siap digunakan!');
  }
});
