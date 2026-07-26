import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

interface HistoryItem {
    id: number;
    bulan: number;
    tahun: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    submittedAt: string | null;
    user?: { name: string };
}

const DashboardOverview = () => {
    const { token } = useContext(AuthContext);
    const [activities, setActivities] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get('/api/lapbul/history', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Take the latest 10 entries
                setActivities(res.data.slice(0, 10));
            } catch (error) {
                console.error('Gagal mengambil riwayat:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (token) fetchHistory();
    }, [token]);

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays === 1) return 'Kemarin';
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getMonthName = (bulan: number) => {
        return new Date(2000, bulan - 1).toLocaleString('id-ID', { month: 'long' });
    };

    const getStatusConfig = (status: string) => {
        if (status === 'FINAL') {
            return {
                icon: 'verified',
                bgColor: 'bg-green-100',
                iconColor: 'text-green-700',
                label: 'mengirimkan laporan final'
            };
        }
        return {
            icon: 'edit_document',
            bgColor: 'bg-yellow-100',
            iconColor: 'text-yellow-700',
            label: 'menyimpan draf laporan'
        };
    };

    return (
        <div className="space-y-lg">
            <div className="bg-primary text-white p-xl rounded-2xl shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/20 to-transparent pointer-events-none"></div>
                <h2 className="font-display text-[32px] font-bold mb-2">Selamat Datang, Admin!</h2>
                <p className="font-body-lg text-primary-container max-w-2xl">
                    Ini adalah pusat kendali utama E-Lapbul Ditreskrimum Polda Sulut. Gunakan menu di sebelah kiri untuk memantau status pengiriman laporan dari seluruh jajaran Polres.
                </p>
            </div>

            {/* Aktivitas Terbaru - Full Width */}
            <div className="bg-surface p-lg rounded-xl border border-outline-variant shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-2">
                    <h3 className="font-headline-md text-on-surface font-semibold">Aktivitas Terbaru</h3>
                    <span className="text-label-sm text-on-surface-variant">
                        {activities.length > 0 ? `${activities.length} laporan terakhir` : ''}
                    </span>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12 gap-3">
                        <span className="material-symbols-outlined animate-spin text-on-surface-variant">sync</span>
                        <span className="font-body-md text-on-surface-variant">Memuat aktivitas...</span>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-40 mb-3">inbox</span>
                        <p className="font-body-md text-on-surface-variant">Belum ada aktivitas laporan tercatat.</p>
                    </div>
                ) : (
                    <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                        {activities.map((item) => {
                            const config = getStatusConfig(item.status);
                            const displayDate = item.updatedAt || item.createdAt;
                            return (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                        <span className={`material-symbols-outlined ${config.iconColor} text-[16px]`}>{config.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-body-md text-on-surface">
                                            <strong>{item.user?.name || 'Operator'}</strong> {config.label} bulan <strong>{getMonthName(item.bulan)} {item.tahun}</strong>.
                                        </p>
                                        <span className="text-[12px] text-on-surface-variant">{formatRelativeTime(displayDate)}</span>
                                    </div>
                                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        item.status === 'FINAL' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {item.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardOverview;
