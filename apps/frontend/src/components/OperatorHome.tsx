import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const OperatorHome = () => {
    const { token } = useContext(AuthContext);

    // Get User Info from Token
    let userName = 'Polres';
    if (token) {
        try {
            const payload = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            userName = decodedPayload.name || 'Polres';
        } catch (e) {
            console.error("Gagal membaca token", e);
        }
    }

    return (
        <div className="space-y-lg">
            {/* Welcome Banner */}
            <div className="bg-primary text-white p-xl rounded-2xl shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/20 to-transparent pointer-events-none"></div>
                <h2 className="font-display text-[32px] font-bold mb-2">Selamat Datang, {userName}!</h2>
                <p className="font-body-lg text-primary-container max-w-2xl">
                    Silakan gunakan menu "Input Lapbul" untuk mengisi laporan bulanan CC CT. Anda juga dapat melihat laporan yang pernah dikirim melalui menu "Riwayat Laporan".
                </p>
            </div>

            {/* Quick Stats / Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mt-6">
                <div className="bg-surface p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col justify-center items-center py-12">
                    <span className="material-symbols-outlined text-[64px] text-primary/30 mb-4">edit_document</span>
                    <h3 className="font-headline-md text-on-surface font-semibold">Input Data Tersimpan Otomatis</h3>
                    <p className="font-body-md text-on-surface-variant text-center mt-2 max-w-sm">
                        Data yang Anda masukkan pada halaman Input Lapbul akan otomatis tersimpan sebagai DRAFT saat Anda menekan tombol Simpan.
                    </p>
                </div>
                
                <div className="bg-surface p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col justify-center items-center py-12">
                    <span className="material-symbols-outlined text-[64px] text-green-600/30 mb-4">verified</span>
                    <h3 className="font-headline-md text-on-surface font-semibold">Validasi Laporan</h3>
                    <p className="font-body-md text-on-surface-variant text-center mt-2 max-w-sm">
                        Pastikan seluruh angka rekapan sudah benar dan seimbang sebelum admin menguncinya pada akhir periode pelaporan.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OperatorHome;
