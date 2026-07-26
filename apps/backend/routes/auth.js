const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

const transporter = require('../utils/email');

// ============================================
// TAHAP 1: ROUTE POST /api/auth/login
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi!' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah!' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email atau password salah!' });
    }

    // --- BAGIAN BARU: OTP ---
    // 1. Buat 6 digit angka acak (misal: 849201)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Tentukan waktu kedaluwarsa (5 menit dari sekarang)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 3. Simpan kode OTP ini ke database user tersebut
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: otpCode,
        otpExpiresAt: expiresAt
      }
    });

    // 4. Kirim email berisi OTP ke user
    const mailOptions = {
      from: `"Sistem E-Lapbul Polda Sulut" <${process.env.EMAIL_USER}>`,
      to: user.email, // Kirim ke email user yang sedang login
      subject: 'Kode OTP Login E-Lapbul',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2>Kode Keamanan Login</h2>
          <p>Seseorang mencoba masuk ke akun E-Lapbul Anda.</p>
          <p>Gunakan kode OTP 6-digit berikut untuk melanjutkan login:</p>
          <h1 style="color: #1d4ed8; letter-spacing: 5px; background: #eff6ff; padding: 10px; display: inline-block;">${otpCode}</h1>
          <p><em>Kode ini hanya berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun!</em></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // 5. Beri tahu Frontend (React) bahwa password benar, 
    // tapi belum dikasih token JWT. Mereka harus ke tahap 2.
    res.json({
      message: 'OTP telah dikirim ke email Anda. Silakan cek Inbox.',
      requireOtp: true, // Sinyal untuk Frontend agar menampilkan kotak input OTP
      email: user.email
    });

  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});


// ============================================
// TAHAP 2: ROUTE POST /api/auth/verify-otp
// ============================================
router.post('/verify-otp', async (req, res) => {
  try {
    // 1. Tangkap email dan OTP yang diketik user
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email dan OTP wajib diisi!' });
    }

    // 2. Cari user di database
    const user = await prisma.user.findUnique({ where: { email } });

    // 3. Validasi Keamanan OTP
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    if (!user.otp) return res.status(400).json({ error: 'OTP belum di-request' });
    if (user.otp !== otp) return res.status(401).json({ error: 'Kode OTP salah!' });

    // Cek apakah waktu saat ini sudah melewati batas kedaluwarsa (5 menit)
    if (new Date() > user.otpExpiresAt) {
      return res.status(401).json({ error: 'Kode OTP sudah kedaluwarsa! Silakan login ulang.' });
    }

    // 4. Jika semua aman, HAPUS OTP dari database agar tidak bisa dipakai 2x
    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiresAt: null }
    });

    // 5. Buatkan Token JWT (KTP Digital)
    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 6. Selesai! User resmi login.
    res.json({
      message: 'Login OTP Berhasil!',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error verifikasi OTP:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// ============================================
// TAHAP 3: ROUTE GET /api/auth/users (ADMIN ONLY)
// ============================================
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// ============================================
// TAHAP 4: ROUTE POST /api/auth/register (ADMIN ONLY)
// ============================================
router.post('/register', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Semua kolom wajib diisi!' });
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah digunakan!' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan ke database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    });

    res.status(201).json({
      message: 'User berhasil didaftarkan!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Error register user:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// ============================================
// TAHAP 5: ROUTE PUT /api/auth/users/:id (EDIT USER)
// ============================================
router.put('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const updateData = { name, email, role };

    // Jika password diisi, berarti admin ingin mengubah password juga
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ message: 'User berhasil diperbarui', user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role } });
  } catch (error) {
    console.error('Error update user:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// ============================================
// TAHAP 6: ROUTE DELETE /api/auth/users/:id (HAPUS USER)
// ============================================
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Jangan izinkan admin menghapus dirinya sendiri jika perlu, tapi kita asumsikan ID 1 adalah superadmin
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Error delete user:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server (Mungkin user memiliki laporan terkait)' });
  }
});

// ============================================
// TAHAP 7: ROUTE POST /api/auth/users/:id/reset-password
// ============================================
router.post('/users/:id/reset-password', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buat password acak 8 karakter atau set default
    const newPassword = 'Polres' + Math.floor(1000 + Math.random() * 9000);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword }
    });

    res.json({ 
      message: 'Password berhasil direset', 
      newPassword: newPassword,
      email: user.email
    });
  } catch (error) {
    console.error('Error reset password:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;
