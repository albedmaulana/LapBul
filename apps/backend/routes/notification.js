const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Ambil notifikasi milik user yang login
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20 // Ambil maksimal 20 notifikasi terbaru
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Gagal mengambil notifikasi' });
  }
});

// Tandai notifikasi sebagai dibaca
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    await prisma.notification.updateMany({
      where: { userId: userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'Semua notifikasi ditandai dibaca' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ error: 'Gagal update notifikasi' });
  }
});

module.exports = router;
