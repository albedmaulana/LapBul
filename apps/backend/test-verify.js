// File ini mensimulasikan ketika pengguna memasukkan kode OTP ke dalam aplikasi
async function testVerifyOTP() {
  // 1. Ganti tulisan 'MASUKKAN_OTP_DI_SINI' dengan 6 angka yang Anda terima di email
  const KODE_DARI_EMAIL = '962886';

  if (KODE_DARI_EMAIL === 'MASUKKAN_OTP_DI_SINI') {
    console.log('⚠️ Harap edit file ini dulu dan masukkan 6 angka OTP dari email Anda!');
    return;
  }

  console.log(`🔄 Mengirim OTP [${KODE_DARI_EMAIL}] ke server untuk verifikasi...`);

  try {
    const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'muhammadalbedmaulana@gmail.com',
        otp: KODE_DARI_EMAIL
      })
    });

    const data = await response.json();

    console.log('\n✅ BALASAN DARI SERVER:');
    console.log(data);

    if (data.token) {
      console.log('\n🎉 SELAMAT! Verifikasi sukses.');
      console.log('Inilah bentuk KTP Digital (JWT) Anda:');
      console.log(data.token);
    }

  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message);
  }
}

testVerifyOTP();
