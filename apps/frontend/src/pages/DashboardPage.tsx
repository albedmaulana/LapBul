import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

import AdminDashboard from '../components/AdminDashboard';
import OperatorDashboard from '../components/OperatorDashboard';

const DashboardPage = () => {
    // 1. Ambil token dari "Brankas" yang sudah kita buat tadi
    const { token } = useContext(AuthContext);

    // 2. Jika tidak ada token (belum login), tendang kembali ke halaman depan
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 3. Membaca isi KTP Digital (Token JWT)
    // Token JWT terdiri dari 3 bagian yang dipisah tanda titik (.).
    // Bagian tengah (index ke-1) berisi data user. Kita bongkar isinya menggunakan 'atob'.
    let userRole: string;
    try {
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        userRole = decodedPayload.role; // Mendapatkan tulisan 'ADMIN_POLDA' atau 'OPERATOR_POLRES'
    } catch (error) {
        console.error("Gagal membaca token", error);
        return <Navigate to="/login" replace />;
    }

    // 4. Percabangan Cerdas (Pintu Kemana Saja)
    // Jika role-nya ADMIN_POLDA, tampilkan komponen AdminDashboard.
    // Jika bukan, tampilkan komponen OperatorDashboard.
    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            {userRole === 'ADMIN_POLDA' ? <AdminDashboard /> : <OperatorDashboard />}
        </div>
    );
};

export default DashboardPage;
