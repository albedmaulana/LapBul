import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

interface HistoryItem {
    id: number;
    bulan: number;
    tahun: number;
    status: string;
    isLocked: boolean;
    createdAt: string;
    updatedAt: string;
    submittedAt: string | null;
}

interface OperatorHistoryProps {
    onEditReport?: (bulan: number, tahun: number) => void;
}

const OperatorHistory = ({ onEditReport }: OperatorHistoryProps) => {
    const { token } = useContext(AuthContext);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL'); // 'ALL' | 'DRAFT' | 'TERKIRIM' | 'FINAL'
    const [selectedBulan, setSelectedBulan] = useState<number>(0); // 0 = Semua Bulan
    const [selectedTahun, setSelectedTahun] = useState<number>(0); // 0 = Semua Tahun

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get('/api/lapbul/history', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistory(res.data);
            } catch (error) {
                console.error('Gagal mengambil riwayat:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (token) fetchHistory();
    }, [token]);

    const getMonthName = (bulan: number) => {
        return new Date(2000, bulan - 1).toLocaleString('id-ID', { month: 'long' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', { 
            day: 'numeric', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        }) + ' WITA';
    };

    // Filtering logic
    const filteredHistory = history.filter(item => {
        const matchCategory = selectedCategory === 'ALL' || item.status === selectedCategory;
        const matchBulan = selectedBulan === 0 || item.bulan === selectedBulan;
        const matchTahun = selectedTahun === 0 || item.tahun === selectedTahun;
        return matchCategory && matchBulan && matchTahun;
    });

    return (
        <div className="flex flex-col gap-lg">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-md">
                <div>
                    <h3 className="font-display text-display text-on-surface">Riwayat Laporan</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                        Daftar laporan bulanan yang telah Anda simpan atau kirimkan ke Polda.
                    </p>
                </div>
            </div>

            {/* Category Tabs & Period Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant shadow-sm">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                    {[
                        { key: 'ALL', label: '✨ Semua Data', count: history.length },
                        { key: 'DRAFT', label: 'Draft', count: history.filter(h => h.status === 'DRAFT').length },
                        { key: 'TERKIRIM', label: 'Terkirim', count: history.filter(h => h.status === 'TERKIRIM').length },
                        { key: 'FINAL', label: 'Final', count: history.filter(h => h.status === 'FINAL').length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setSelectedCategory(tab.key)}
                            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                selectedCategory === tab.key 
                                    ? 'bg-primary text-white font-semibold shadow-sm' 
                                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                selectedCategory === tab.key ? 'bg-white/20 text-white' : 'bg-outline-variant/50 text-on-surface-variant'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Month & Year Selectors */}
                <div className="flex gap-2">
                    <div className="relative bg-surface border border-outline-variant rounded-lg shadow-sm">
                        <select 
                            value={selectedBulan}
                            onChange={(e) => setSelectedBulan(Number(e.target.value))}
                            className="appearance-none bg-transparent border-none text-on-surface text-[13px] font-semibold py-1.5 pl-3 pr-8 outline-none cursor-pointer"
                        >
                            <option value={0}>Semua Bulan</option>
                            {Array.from({length: 12}).map((_, i) => {
                                const m = i + 1;
                                const monthName = new Date(2000, i).toLocaleString('id-ID', { month: 'long' });
                                return <option key={m} value={m}>{monthName}</option>;
                            })}
                        </select>
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                    </div>

                    <div className="relative bg-surface border border-outline-variant rounded-lg shadow-sm">
                        <select 
                            value={selectedTahun}
                            onChange={(e) => setSelectedTahun(Number(e.target.value))}
                            className="appearance-none bg-transparent border-none text-on-surface text-[13px] font-semibold py-1.5 pl-3 pr-8 outline-none cursor-pointer"
                        >
                            <option value={0}>Semua Tahun</option>
                            {Array.from({length: new Date().getFullYear() - 2023 + 1}).map((_, i) => {
                                const y = 2023 + i;
                                return <option key={y} value={y}>{y}</option>;
                            })}
                        </select>
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-container-high">
                            <tr>
                                <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-16">No</th>
                                <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Bulan Laporan</th>
                                <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                                <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Dibuat Pada</th>
                                <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Terakhir Diubah</th>
                                <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <div className="flex justify-center items-center gap-3 text-on-surface-variant">
                                            <span className="material-symbols-outlined animate-spin">sync</span>
                                            <span className="font-body-md">Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-on-surface-variant font-body-md">
                                        Tidak ada data laporan pada kategori/periode ini.
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((item, idx) => {
                                    const isLocked = item.isLocked || item.status === 'TERKIRIM' || item.status === 'FINAL';
                                    return (
                                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                                            <td className="px-md py-md font-body-md text-body-md text-center">{idx + 1}</td>
                                            <td className="px-md py-md font-body-md text-body-md font-semibold text-on-surface">
                                                {getMonthName(item.bulan)} {item.tahun}
                                            </td>
                                            <td className="px-md py-md">
                                                {item.status === 'FINAL' ? (
                                                    <span className="px-sm py-[2px] bg-green-100 text-green-800 rounded-full text-label-sm font-bold tracking-wide">FINAL</span>
                                                ) : item.status === 'TERKIRIM' ? (
                                                    <span className="px-sm py-[2px] bg-blue-100 text-blue-800 rounded-full text-label-sm font-bold tracking-wide">TERKIRIM</span>
                                                ) : (
                                                    <span className="px-sm py-[2px] bg-yellow-100 text-yellow-800 rounded-full text-label-sm font-bold tracking-wide">DRAFT</span>
                                                )}
                                            </td>
                                            <td className="px-md py-md font-body-md text-body-md text-on-surface-variant">
                                                {formatDate(item.createdAt)}
                                            </td>
                                            <td className="px-md py-md font-body-md text-body-md text-on-surface-variant">
                                                {formatDate(item.updatedAt)}
                                            </td>
                                            <td className="px-md py-md text-center">
                                                {isLocked ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-label-sm font-semibold cursor-not-allowed" title="Laporan sudah dikunci oleh Admin">
                                                        <span className="material-symbols-outlined text-[16px]">lock</span>
                                                        Terkunci
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => onEditReport?.(item.bulan, item.tahun)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-label-sm font-semibold hover:bg-primary/20 active:scale-95 transition-all"
                                                        title="Edit laporan ini"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                        Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OperatorHistory;
