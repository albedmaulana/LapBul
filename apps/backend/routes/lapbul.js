const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth'); // Satpam JWT
const transporter = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// ROUTE 1: POST /api/lapbul/submit
// ============================================
// Fungsi: Menyimpan ketikan laporan (Jspreadsheet) ke database
router.post('/submit', verifyToken, async (req, res) => {
  try {
    // 1. Tangkap data yang dikirim dari Frontend
    const { bulan, tahun, matriksData, status } = req.body;
    
    // 2. Ambil ID user dari Token JWT yang diverifikasi oleh satpam
    const userId = req.user.userId;

    // 3. Validasi: Pastikan bulan dan tahun diisi
    if (!bulan || !tahun) {
      return res.status(400).json({ error: 'Bulan dan Tahun wajib diisi!' });
    }

    // 4. Proses Simpan/Update (Upsert)
    // Upsert = Jika laporan bulan tersebut belum ada, BUAT BARU.
    // Jika sudah ada (misal sebelumnya di-save sebagai DRAFT), UPDATE isinya.
    const submission = await prisma.lapbulSubmission.upsert({
      where: {
        // Cari berdasarkan kombinasi unik: userId_bulan_tahun
        userId_bulan_tahun: {
          userId: userId,
          bulan: bulan,
          tahun: tahun
        }
      },
      update: {
        matriksData: matriksData, // Update JSON matriksnya
        status: status || 'DRAFT', // Apakah DRAFT, TERKIRIM, atau FINAL
        submittedAt: (status === 'TERKIRIM' || status === 'FINAL') ? new Date() : null, // Catat jam
        isLocked: status === 'FINAL' // Kunci laporan jika sudah Final
      },
      create: {
        userId: userId,
        bulan: bulan,
        tahun: tahun,
        matriksData: matriksData,
        status: status || 'DRAFT',
        submittedAt: (status === 'TERKIRIM' || status === 'FINAL') ? new Date() : null,
        isLocked: status === 'FINAL'
      }
    });

    res.json({
      message: 'Laporan berhasil disimpan!',
      data: submission
    });

  } catch (error) {
    console.error('Error submit laporan:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan laporan' });
  }
});

// ============================================
// ROUTE 2: GET /api/lapbul/history
// ============================================
// Fungsi: Melihat riwayat laporan yang sudah dibuat
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.userId;
    let riwayat;

    // Jika yang meminta (request) adalah Admin Polda, tampilkan SEMUA laporan yang sudah dikirim (bukan DRAFT)
    if (userRole === 'ADMIN_POLDA') {
      riwayat = await prisma.lapbulSubmission.findMany({
        where: {
          status: {
            in: ['TERKIRIM', 'FINAL']
          }
        },
        include: {
          user: { select: { name: true } } // Tempelkan nama polres-nya juga
        },
        orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }] // Urutkan dari yang terbaru
      });
    } 
    // Jika yang meminta adalah Operator Polres, tampilkan HANYA laporan milik dia saja
    else {
      riwayat = await prisma.lapbulSubmission.findMany({
        where: { userId: userId },
        orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }]
      });
    }

    res.json(riwayat);

  } catch (error) {
    console.error('Error ambil riwayat:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil riwayat laporan' });
  }
});

// ============================================
// ROUTE 3: GET /api/lapbul/recap
// ============================================
// Fungsi: Mengagregasi (menjumlahkan) data laporan semua Polres pada bulan dan tahun tertentu
router.get('/recap', verifyToken, async (req, res) => {
  try {
    const bulan = req.query.bulan ? parseInt(req.query.bulan) : 0;
    const tahun = req.query.tahun ? parseInt(req.query.tahun) : 0;
    const userId = req.query.userId ? parseInt(req.query.userId) : 0;

    const whereCondition = {
      status: {
        in: ['TERKIRIM', 'FINAL']
      }
    };

    if (bulan > 0) {
      whereCondition.bulan = bulan;
    }
    if (tahun > 0) {
      whereCondition.tahun = tahun;
    }
    if (userId > 0) {
      whereCondition.userId = userId;
    }

    const submissions = await prisma.lapbulSubmission.findMany({
      where: whereCondition
    });

    // Struktur Data Agregasi (57 baris x 15 kolom)
    // Kolom: NO, TINDAK PIDANA, CT, P21, HL, SP3, RJL, RJS, CCAKT, T_P21, T_HL, T_SP3, T_RJL, T_RJS, CCTGK
    const aggregatedData = [];
    
    // Inisialisasi 57 baris kosong dengan nilai 0
    for (let i = 0; i < 57; i++) {
        aggregatedData.push([
            i + 1, // NO
            "",    // TINDAK PIDANA (akan diisi dari master atau submission pertama)
            0, 0, 0, 0, 0, 0, 0, // CT & CC AKT
            0, 0, 0, 0, 0, 0    // CC TUNGGAKAN
        ]);
    }

    let hasData = false;

    // Loop semua laporan dari Polres
    submissions.forEach(sub => {
      const matriks = sub.matriksData; // JSON array of arrays
      if (Array.isArray(matriks) && matriks.length >= 57) {
        hasData = true;
        for (let r = 0; r < 57; r++) {
          if (aggregatedData[r][1] === "") {
            aggregatedData[r][1] = matriks[r][1] || ""; // Ambil nama tindak pidana
          }
          // Sum numerical columns (index 2 to 14)
          for (let c = 2; c <= 14; c++) {
            const val = parseFloat(matriks[r][c]);
            if (!isNaN(val)) {
                aggregatedData[r][c] += val;
            }
          }
        }
      }
    });

    res.json({
      message: 'Agregasi berhasil',
      hasData: hasData,
      totalPolres: submissions.length,
      data: aggregatedData
    });

  } catch (error) {
    console.error('Error agregasi laporan:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengagregasi laporan' });
  }
});

// ============================================
// ROUTE 4: PUT /api/lapbul/:id/status
// ============================================
// Fungsi: Khusus Admin untuk mengubah status (Kunci/Buka Kunci)
router.put('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Update status laporan dan set isLocked
    const updated = await prisma.lapbulSubmission.update({
      where: { id: parseInt(id) },
      data: {
        status: status, // 'FINAL' atau 'DRAFT'
        isLocked: status === 'FINAL'
      }
    });

    res.json({ message: `Status berhasil diubah menjadi ${status}!`, data: updated });
  } catch (error) {
    console.error('Error mengubah status laporan:', error);
    res.status(500).json({ error: 'Gagal mengubah status laporan' });
  }
});

// ============================================
// ROUTE 5: POST /api/lapbul/remind
// ============================================
// Fungsi: Mengirim notifikasi dan email peringatan ke operator
router.post('/remind', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId, bulan, tahun } = req.body;
    
    // Cari data operator
    const operator = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator tidak ditemukan' });
    }

    const monthName = new Date(2000, bulan - 1).toLocaleString('id-ID', { month: 'long' });

    // 1. Simpan ke database Notifikasi
    await prisma.notification.create({
      data: {
        userId: operator.id,
        title: 'Teguran Pengiriman Laporan',
        message: `Admin Polda mengingatkan Anda untuk segera mengirimkan Laporan Bulanan (CC/CT) periode ${monthName} ${tahun}. Harap segera diselesaikan.`,
      }
    });

    // 2. Kirim Email (Opsional, tapi penting)
    const mailOptions = {
      from: `"Sistem E-Lapbul Ditreskrimum" <${process.env.EMAIL_USER}>`,
      to: operator.email,
      subject: `PENGINGAT: Laporan Bulanan ${monthName} ${tahun}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #f9f9f9;">
          <p>Yth. <strong>${operator.name}</strong>,</p>
          <p>Melalui email ini, kami dari Admin Ditreskrimum Polda Sulut mengingatkan Anda bahwa laporan bulan <strong>${monthName} ${tahun}</strong> belum dikirimkan.</p>
          <p>Mohon segera melengkapi dan mengirimkan laporan tersebut melalui sistem E-Lapbul.</p>
          <br/>
          <p>Terima kasih.</p>
        </div>
      `
    };

    // Tunggu email terkirim agar proses tidak terputus di lingkungan Serverless (Vercel)
    await transporter.sendMail(mailOptions);

    res.json({ message: `Pengingat berhasil dikirim ke ${operator.name}` });
  } catch (error) {
    console.error('Error mengirim pengingat:', error);
    res.status(500).json({ error: 'Gagal mengirim pengingat' });
  }
});

module.exports = router;
