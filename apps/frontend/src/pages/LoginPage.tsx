import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLock, FiMail, FiShield } from 'react-icons/fi'; // Icon premium

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');

    const [step, setStep] = useState<1 | 2>(1); // 1: Login, 2: OTP
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    // Fungsi saat tombol "Masuk" ditekan (Tahap 1)
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            // Panggil API Backend (Ganti port 5000 jika backend Anda beda port)
            const response = await axios.post('/api/auth/login', {
                email,
                password,
            });

            if (response.data.requireOtp) {
                setStep(2); // Lanjut ke layar OTP
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'Terjadi kesalahan pada server');
        } finally {
            setLoading(false);
        }
    };

    // Fungsi saat tombol "Verifikasi OTP" ditekan (Tahap 2)
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const response = await axios.post('/api/auth/verify-otp', {
                email,
                otp,
            });

            if (response.data.token) {
                // Simpan token ke Brankas (AuthContext)
                auth.login(response.data.token);
                // Pindah ke halaman Dashboard
                navigate('/dashboard');
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'Kode OTP salah / kedaluwarsa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            {/* Kotak Kaca (Glassmorphism) */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">

                {/* Logo/Icon Atas */}
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-500/20 p-4 rounded-full border border-blue-400/30">
                        {step === 1 ? <FiLock className="text-4xl text-blue-300" /> : <FiShield className="text-4xl text-green-300" />}
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-wide">
                    E-LAPBUL
                </h2>
                <p className="text-center text-blue-200/70 mb-8 text-sm">
                    {step === 1 ? 'Sistem Pelaporan Bulanan Bin Ops' : 'Verifikasi Keamanan 2 Langkah'}
                </p>

                {/* Pesan Error Merah */}
                {errorMsg && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm text-center animate-pulse">
                        {errorMsg}
                    </div>
                )}

                {/* ===================== FORM TAHAP 1: PASSWORD ===================== */}
                {step === 1 && (
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
                            <input
                                type="email"
                                placeholder="Alamat Email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-400 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-400 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg py-3 mt-4 transition-all shadow-[0_0_15px_rgba(37,99,235,0.5)] disabled:opacity-50"
                        >
                            {loading ? 'Memeriksa...' : 'Masuk Sistem'}
                        </button>
                    </form>
                )}

                {/* ===================== FORM TAHAP 2: OTP ===================== */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <p className="text-sm text-slate-300 text-center mb-4">
                            Kode OTP 6-digit telah dikirim ke<br /><strong className="text-white">{email}</strong>
                        </p>

                        <div className="relative">
                            <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-green-300" />
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="Masukkan 6 Angka OTP"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Hanya boleh diisi angka
                                className="w-full bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-400 rounded-lg pl-10 pr-4 py-3 text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg py-3 mt-4 transition-all shadow-[0_0_15px_rgba(22,163,74,0.5)] disabled:opacity-50"
                        >
                            {loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full text-blue-300 hover:text-white text-sm py-2 transition-colors"
                        >
                            ← Kembali ke awal
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
};

export default LoginPage;
