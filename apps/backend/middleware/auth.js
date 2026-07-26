const jwt = require('jsonwebtoken');

// Middleware untuk melindungi endpoint API
// Hanya user yang sudah login (punya Token valid) yang boleh lewat
const verifyToken = (req, res, next) => {
  // 1. Ambil token dari Headers request (umumnya format: "Bearer <token_acak>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Ambil teks setelah kata "Bearer"

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak! Token tidak ditemukan.' });
  }

  try {
    // 2. Verifikasi Token menggunakan Secret Key kita
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Jika valid, simpan data user ke dalam variabel 'req'
    // agar bisa dipakai oleh fungsi-fungsi API lainnya
    req.user = decoded; 
    
    // 4. Lanjutkan ke langkah berikutnya
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token tidak valid atau sudah kedaluwarsa!' });
  }
};

// Middleware tambahan khusus untuk memeriksa apakah user adalah Admin Polda
const requireAdmin = (req, res, next) => {
  // Asumsinya verifyToken selalu dijalankan sebelum ini
  if (req.user && req.user.role === 'ADMIN_POLDA') {
    next(); // Izinkan lewat
  } else {
    res.status(403).json({ error: 'Akses khusus Admin Polda!' });
  }
};

module.exports = { verifyToken, requireAdmin };
