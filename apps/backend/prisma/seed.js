// ============================================
// SEED.JS — Memasukkan Data Awal ke Database
// ============================================
// File ini dijalankan SEKALI saja untuk mengisi database dengan:
// 1. Akun Admin Polda (agar bisa login pertama kali)
// 2. Daftar 57 jenis tindak pidana (baris-baris di laporan)

// Import library yang dibutuhkan
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') }); // Muat file .env
const { PrismaClient } = require('@prisma/client');  // Client database
const bcrypt = require('bcryptjs');                   // Enkripsi password

// Buat instance koneksi database
// PrismaClient otomatis membaca DATABASE_URL dari environment (.env)
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding database...\n');

  // ==========================================
  // 1. BUAT AKUN ADMIN POLDA
  // ==========================================
  // bcrypt.hashSync('password', 10) artinya:
  // - Ambil teks 'password'
  // - Enkripsi 10 kali putaran (semakin tinggi = semakin aman, tapi lebih lambat)
  // - Hasilnya berupa teks acak yang tidak bisa dibaca manusia
  const hashedPassword = bcrypt.hashSync('albayt007', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'muhammadalbedmaulana@gmail.com' },  // Cari user dengan email ini
    update: {},                                  // Jika sudah ada, jangan ubah apa-apa
    create: {                                    // Jika belum ada, buat baru:
      name: 'Admin',
      email: 'muhammadalbedmaulana@gmail.com',
      password: hashedPassword,
      role: 'ADMIN_POLDA',
    },
  });
  console.log('✅ Admin dibuat:', admin.email);

  // ==========================================
  // 2. MASUKKAN 57 JENIS TINDAK PIDANA
  // ==========================================
  // Array ini berisi pasangan [nomor_urut, nama_kejahatan]
  const tindakPidana = [
    [1, 'Pembunuhan (338, 340 KUHP)'],
    [2, 'Penganiayaan Berat (354 KUHP)'],
    [3, 'Penganiayaan Ringan (352 KUHP)'],
    [4, 'Penculikan (328-332 KUHP)'],
    [5, 'Pencurian dgn Kekerasan/Begal (365 KUHP)'],
    [6, 'Pencurian dgn Pemberatan (363 KUHP)'],
    [7, 'Pencurian Kendaraan Bermotor R2'],
    [8, 'Pencurian Kendaraan Bermotor R4'],
    [9, 'Pencurian Biasa'],
    [10, 'Penipuan (378 KUHP)'],
    [11, 'Penggelapan (372 KUHP)'],
    [12, 'Pemalsuan Surat (263 KUHP)'],
    [13, 'Pemalsuan Uang'],
    [14, 'Pemerasan (368 KUHP)'],
    [15, 'Perjudian (303 KUHP)'],
    [16, 'Pembakaran (187 KUHP)'],
    [17, 'Kejahatan thd Ketertiban Umum'],
    [18, 'Penadahan (480 KUHP)'],
    [19, 'Perkosaan (285 KUHP)'],
    [20, 'Pencabulan (289 KUHP)'],
    [21, 'Persetubuhan (286, 287 KUHP)'],
    [22, 'KDRT (UU 23/2004)'],
    [23, 'Perlindungan Anak (UU 35/2014)'],
    [24, 'Narkotika (UU 35/2009)'],
    [25, 'Psikotropika'],
    [26, 'Korupsi (UU 31/1999)'],
    [27, 'Pencucian Uang (UU 8/2010)'],
    [28, 'Illegal Logging'],
    [29, 'Illegal Mining'],
    [30, 'Illegal Fishing'],
    [31, 'Traficking (UU 21/2007)'],
    [32, 'Perlindungan Konsumen'],
    [33, 'Lingkungan Hidup (UU 32/2009)'],
    [34, 'Kepabeanan (UU 17/2006)'],
    [35, 'Keimigrasian (UU 6/2011)'],
    [36, 'Terorisme (UU 5/2018)'],
    [37, 'Siber / ITE (UU 11/2008)'],
    [38, 'Perdagangan Orang'],
    [39, 'TPPO'],
    [40, 'Fidusia'],
    [41, 'Pangan'],
    [42, 'Perikanan'],
    [43, 'Kehutanan (UU 18/2013)'],
    [44, 'HAKI'],
    [45, 'Ketenagakerjaan'],
    [46, 'Pertanahan'],
    [47, 'Perbankan'],
    [48, 'Pasar Modal'],
    [49, 'Perpajakan'],
    [50, 'Perasuransian'],
    [51, 'Kesehatan'],
    [52, 'Farmasi'],
    [53, 'Pemilu / Pilkada'],
    [54, 'Senjata Api / Bahan Peledak'],
    [55, 'Kekerasan dlm Masyarakat'],
    [56, 'Pengrusakan (406 KUHP)'],
    [57, 'Tindak Pidana Lainnya'],
  ];

  // Loop: Untuk setiap item di array, masukkan ke database
  for (const [noUrut, nama] of tindakPidana) {
    await prisma.masterTindakPidana.upsert({
      where: { noUrut: noUrut },          // Cari berdasarkan nomor urut
      update: {},                           // Jika sudah ada, skip
      create: {                             // Jika belum ada, buat baru
        noUrut: noUrut,
        namaTindakPidana: nama,
      },
    });
  }
  console.log('✅ 57 jenis tindak pidana berhasil dimasukkan');

  console.log('\n🎉 Seeding selesai!');
}

// Jalankan fungsi main, lalu tutup koneksi database
main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
