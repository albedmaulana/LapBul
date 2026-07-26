// File ini hanya untuk mengetes apakah API Login kita bekerja dengan baik
async function testLogin() {
  console.log('🔄 Mengirim request login ke API...');

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // Mengirim email admin dan password default dari seed.js
      body: JSON.stringify({
        email: 'muhammadalbedmaulana@gmail.com',
        password: 'albayt007'
      })
    });

    const data = await response.json();

    console.log('\n✅ BALASAN DARI SERVER:');
    console.log(data);

    if (data.requireOtp) {
      console.log('\n📧 SUCCESS! Coba cek email Anda (email pengirim yang ada di .env) sekarang.');
      console.log('Anda harusnya melihat email masuk berisi 6 digit kode dari Sistem E-Lapbul!');
    }

  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message);
  }
}

testLogin();
