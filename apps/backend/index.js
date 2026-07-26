// ============================================
// INDEX.JS — File Utama Server API (Backend)
// ============================================

// 1. IMPORT LIBRARY
const express = require('express');         // Framework server
const cors = require('cors');             // Mengizinkan Frontend mengakses API ini
require('dotenv').config();               // Membaca file .env

// 2. INISIALISASI SERVER
const app = express();
const PORT = process.env.PORT || 5000;

// 3. MIDDLEWARE
// Middleware adalah "satpam" atau "pembantu" yang memproses request 
// sebelum masuk ke jalur (route) utama.
app.use(cors());                          // Izinkan semua domain mengakses API kita
app.use(express.json());                  // Izinkan server membaca data format JSON dari React

// 4. ROUTE DASAR (Jalur API)
// Saat kita membuka http://localhost:5000/ di browser, ini yang muncul
app.get('/', (req, res) => {
  res.json({
    message: 'Selamat datang di API E-Lapbul Polda Sulut',
    status: 'Server Berjalan Lancar 🟢'
  });
});

// Daftarkan route Auth
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes); // Semua URL login akan diawali dengan /api/auth

// Nanti di sini kita akan tambahkan route untuk:
// - Ambil Data Master Tindak Pidana
const masterRoutes = require('./routes/master');
app.use('/api/master', masterRoutes);

// - Simpan Laporan
const lapbulRoutes = require('./routes/lapbul');
app.use('/api/lapbul', lapbulRoutes);

// - Notifikasi
const notificationRoutes = require('./routes/notification');
app.use('/api/notifications', notificationRoutes);

// - Rekapitulasi Data (Bisa ditambahkan nanti jika perlu rute khusus rekap)

// 5. JALANKAN SERVER ATAU EXPORT UNTUK VERCEL
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server API E-Lapbul berjalan di: http://localhost:${PORT}`);
    console.log('Tekan Ctrl + C untuk mematikan server.\n');
  });
}

// EKSPOR APP UNTUK VERCEL SERVERLESS FUNCTION
module.exports = app;
