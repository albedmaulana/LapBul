const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth'); // Panggil Satpam JWT

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// ROUTE: GET /api/master/tindak-pidana
// ============================================
// Fungsi: Mengambil 57 daftar kejahatan dari database.
// Keamanan: verifyToken (Hanya user yang punya KTP/Token JWT yang boleh akses)
router.get('/tindak-pidana', verifyToken, async (req, res) => {
  try {
    // Ambil semua data dari tabel master_tindak_pidana
    // Urutkan (orderBy) berdasarkan kolom 'noUrut' dari terkecil (asc) ke terbesar
    const data = await prisma.masterTindakPidana.findMany({
      orderBy: {
        noUrut: 'asc'
      }
    });

    // Kirim datanya ke Frontend dalam format JSON
    res.json(data);

  } catch (error) {
    console.error('Error ambil master data:', error);
    res.status(500).json({ error: 'Gagal mengambil data master tindak pidana' });
  }
});

module.exports = router;
