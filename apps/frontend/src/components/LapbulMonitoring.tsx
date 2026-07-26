import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
// @ts-ignore
import * as XLSX from 'xlsx-js-style';

const LapbulMonitoring = () => {
    const { token } = useContext(AuthContext);
    const [riwayat, setRiwayat] = useState<any[]>([]);
    const [operators, setOperators] = useState<any[]>([]);
    const [totalJajaran, setTotalJajaran] = useState(0);

    // Filter states (Default: 0 = Semua)
    const [bulan, setBulan] = useState(0);
    const [tahun, setTahun] = useState(0);
    const [statusFilter, setStatusFilter] = useState('SEMUA'); // 'SEMUA' | 'SUDAH' | 'BELUM'

    // Modal state
    const [viewItem, setViewItem] = useState<any>(null);

    const fetchData = async () => {
        if (!token) return;
        try {
            // Fetch history
            const resHistory = await axios.get('/api/lapbul/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRiwayat(resHistory.data);

            // Fetch total operators
            const resUsers = await axios.get('/api/auth/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const ops = resUsers.data.filter((u: any) => u.role === 'OPERATOR_POLRES');
            setOperators(ops);
            setTotalJajaran(ops.length);
        } catch (error) {
            console.error("Gagal mengambil data monitoring", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleLock = async (id: number, targetStatus: string) => {
        let confirmMsg = "";
        if (targetStatus === 'FINAL') {
            confirmMsg = "Apakah Anda yakin ingin mengunci laporan ini? Laporan akan disahkan (FINAL).";
        } else if (targetStatus === 'DRAFT') {
            confirmMsg = "Apakah Anda yakin ingin membuka kunci (tolak) laporan ini? Laporan akan dikembalikan ke operator sebagai DRAFT.";
        }

        const confirm = window.confirm(confirmMsg);
        if (!confirm) return;

        try {
            await axios.put(`/api/lapbul/${id}/status`, { status: targetStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error("Gagal mengubah status laporan", error);
            alert("Gagal mengubah status laporan");
        }
    };

    const sendReminder = async (userId: number, polresName: string) => {
        try {
            await axios.post(`/api/lapbul/remind`, {
                userId,
                bulan,
                tahun
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Notifikasi pengingat berhasil dikirim ke ${polresName} via Lonceng dan Email!`);
        } catch (error) {
            console.error("Gagal mengirim pengingat", error);
            alert("Gagal mengirim pengingat. Pastikan koneksi dan pengaturan email benar.");
        }
    };

    const downloadExcel = (item: any) => {
        const polresName = item.user?.name || 'POLRES_UNKNOWN';
        const monthName = new Date(2000, item.bulan - 1).toLocaleString('id-ID', { month: 'long' });
        const fileName = `LAPBUL_CC_CT_${polresName.toUpperCase().replace(/\s+/g, '_')}_${monthName.toUpperCase()}_${item.tahun}.xlsx`;

        // Siapkan header array
        const wsData = [
            ["DAFTAR KASUS CRIME CLEARENCE (CC) DAN CRIME TOTAL (CT)"],
            [`${polresName.toUpperCase()}`],
            [`BULAN ${monthName.toUpperCase()} TAHUN ${item.tahun}`],
            [],
            ["NO", "TINDAK PIDANA", "CC AKT (LP THN BERJALAN)", "", "", "", "", "CC TUNGGAKAN", "", "", "", ""],
            ["", "", "CT", "P21", "HENTI LIDIK", "SP3", "RJ LIDIK", "RJ SIDIK", "TOTAL CC AKT", "P21", "HENTI LIDIK", "SP3", "RJ LIDIK", "RJ SIDIK", "TOTAL CC TGK"]
        ];

        let totalSums = new Array(13).fill(0);

        if (item.matriksData && Array.isArray(item.matriksData)) {
            for (let r = 0; r < 57; r++) {
                if (item.matriksData[r]) {
                    const rowData = [...item.matriksData[r]];
                    // Pastikan panjang rowData pas untuk Excel
                    wsData.push(rowData);

                    // Sum column 2 to 14
                    for (let c = 2; c <= 14; c++) {
                        totalSums[c - 2] += (Number(rowData[c]) || 0);
                    }
                }
            }
        }

        // Add JUMLAH row
        wsData.push([
            "", "JUMLAH",
            ...totalSums
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Styling
        const headerStyle = {
            font: { bold: true, sz: 12 },
            alignment: { horizontal: "center", vertical: "center" }
        };
        const titleStyle = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: "center" }
        };

        ws["A1"].s = titleStyle;
        ws["A2"].s = titleStyle;
        ws["A3"].s = titleStyle;

        // Merge cells
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 14 } },
            // NO
            { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
            // TINDAK PIDANA
            { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
            // CC AKT
            { s: { r: 4, c: 2 }, e: { r: 4, c: 8 } },
            // CC TUNGGAKAN
            { s: { r: 4, c: 9 }, e: { r: 4, c: 14 } }
        ];

        // Apply styles to headers
        for (let R = 4; R <= 5; ++R) {
            for (let C = 0; C <= 14; ++C) {
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
                ws[cellRef].s = {
                    ...headerStyle,
                    fill: { fgColor: { rgb: "EAEAEA" } },
                    border: {
                        top: { style: "thin", color: { auto: 1 } },
                        bottom: { style: "thin", color: { auto: 1 } },
                        left: { style: "thin", color: { auto: 1 } },
                        right: { style: "thin", color: { auto: 1 } }
                    }
                };
            }
        }

        // Apply borders to all data cells
        for (let R = 6; R < wsData.length; R++) {
            for (let C = 0; C <= 14; C++) {
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
                ws[cellRef].s = {
                    border: {
                        top: { style: "thin", color: { auto: 1 } },
                        bottom: { style: "thin", color: { auto: 1 } },
                        left: { style: "thin", color: { auto: 1 } },
                        right: { style: "thin", color: { auto: 1 } }
                    }
                };
            }
        }

        ws['!cols'] = [
            { wch: 5 }, { wch: 45 },
            { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
            { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan_CC_CT");
        XLSX.writeFile(wb, fileName);
    };

    // 1. Tentukan range Tahun dan Bulan yang akan di-generate
    const currentSystemYear = new Date().getFullYear();
    const currentSystemMonth = new Date().getMonth() + 1;
    
    const dbYears = riwayat.map(r => r.tahun);
    const minDbYear = dbYears.length > 0 ? Math.min(...dbYears) : 2023;
    const maxDbYear = dbYears.length > 0 ? Math.max(...dbYears) : currentSystemYear;
    
    const startYear = Math.min(minDbYear, 2023);
    const endYear = Math.max(maxDbYear, currentSystemYear);
    
    const uniqueYears = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => endYear - i
    );

    const targetYears = tahun === 0 ? uniqueYears : [tahun];

    // 2. Generate matrix utuh: Operator x Tahun x Bulan
    const combinedData: any[] = [];
    
    operators.forEach(op => {
        targetYears.forEach(y => {
            // Constraint logis: Jangan generate bulan-bulan di masa depan jika kita sedang berada di tahun berjalan
            let maxMonth = 12;
            if (bulan === 0 && y === currentSystemYear) {
                maxMonth = currentSystemMonth;
            } else if (bulan === 0 && y > currentSystemYear) {
                maxMonth = 0; // Tahun di masa depan tidak perlu digenerate otomatis
            }

            const activeMonths = bulan === 0 
                ? Array.from({ length: maxMonth }, (_, i) => i + 1) 
                : [bulan];

            activeMonths.forEach(m => {
                const submission = riwayat.find((item: any) => item.userId === op.id && item.bulan === m && item.tahun === y);
                combinedData.push({
                    operator: op,
                    submission: submission || null,
                    periode: `${new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })} ${y}`,
                    sortKey: y * 100 + m
                });
            });
        });
    });

    // 3. Urutkan berdasarkan Tahun (desc), Bulan (desc), dan Nama Polres
    combinedData.sort((a, b) => {
        if (b.sortKey !== a.sortKey) return b.sortKey - a.sortKey;
        return (a.operator.name || '').localeCompare(b.operator.name || '');
    });

    const sudahSubmit = combinedData.filter(item => item.submission !== null && item.submission.status !== 'DRAFT').length;
    const belumMengisi = bulan !== 0 ? Math.max(0, totalJajaran - sudahSubmit) : 0;
    const persentase = totalJajaran > 0 ? Math.round((sudahSubmit / totalJajaran) * 100) : 0;

    const finalData = combinedData.filter(item => {
        const status = item.submission ? item.submission.status : 'BELUM_MENGIRIM';
        const isSudah = status === 'TERKIRIM' || status === 'FINAL';
        if (statusFilter === 'SUDAH') return isSudah;
        if (statusFilter === 'BELUM') return !isSudah;
        return true;
    });

    return (
        <div className="space-y-lg relative">
            {/* Filter Section */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-outline-variant shadow-sm flex-wrap">
                <span className="font-label-md text-on-surface-variant font-medium uppercase tracking-wider">Periode Pemantauan:</span>
                <div className="flex gap-2 flex-wrap">
                    <div className="relative bg-surface border border-outline-variant rounded-lg shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <select
                            value={bulan}
                            onChange={(e) => setBulan(Number(e.target.value))}
                            className="appearance-none bg-transparent border-none text-on-surface font-label-md py-2 pl-3 pr-8 outline-none cursor-pointer font-semibold"
                        >
                            <option value={0}>Semua</option>
                            {Array.from({ length: 12 }).map((_, i) => {
                                const m = i + 1;
                                const monthName = new Date(2000, i).toLocaleString('id-ID', { month: 'long' });
                                return <option key={m} value={m}>{monthName}</option>;
                            })}
                        </select>
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                    </div>
                    <div className="relative bg-surface border border-outline-variant rounded-lg shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <select
                            value={tahun}
                            onChange={(e) => setTahun(Number(e.target.value))}
                            className="appearance-none bg-transparent border-none text-on-surface font-label-md py-2 pl-3 pr-8 outline-none cursor-pointer font-semibold"
                        >
                            <option value={0}>Semua</option>
                            {Array.from({ length: new Date().getFullYear() - 2023 + 1 }).map((_, i) => {
                                const y = 2023 + i;
                                return <option key={y} value={y}>{y}</option>;
                            })}
                        </select>
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                    </div>
                    <div className="relative bg-surface border border-outline-variant rounded-lg shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none bg-transparent border-none text-on-surface font-label-md py-2 pl-3 pr-8 outline-none cursor-pointer font-semibold"
                        >
                            <option value="SEMUA">Semua Status</option>
                            <option value="SUDAH">Sudah Mengirim</option>
                            <option value="BELUM">Belum Mengirim</option>
                        </select>
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                    </div>
                </div>
            </div>

            {/* KPI Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                <div className="bg-white p-lg rounded-xl border border-outline-variant flex items-center gap-lg shadow-sm relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-on-secondary-fixed-variant"></div>
                    <div className="w-14 h-14 rounded-full bg-secondary-fixed/30 flex items-center justify-center text-on-secondary-fixed">
                        <span className="material-symbols-outlined text-[32px]">account_balance</span>
                    </div>
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Jajaran</p>
                        <h3 className="font-display text-display text-primary mt-1">{totalJajaran} <span className="text-headline-md font-medium text-on-surface-variant">Polres</span></h3>
                    </div>
                </div>

                <div className="bg-white p-lg rounded-xl border border-outline-variant flex items-center gap-lg shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600"></div>
                    <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <span className="material-symbols-outlined text-[32px]">check_circle</span>
                    </div>
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Sudah Submit</p>
                        <h3 className="font-display text-display text-primary mt-1">{sudahSubmit} <span className="text-headline-md font-medium text-on-surface-variant">Wilayah</span></h3>
                    </div>
                    <div className="ml-auto">
                        <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-[12px] font-bold">{persentase}%</div>
                    </div>
                </div>

                <div className="bg-white p-lg rounded-xl border border-outline-variant flex items-center gap-lg shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
                    <div className="w-14 h-14 rounded-full bg-error-container/30 flex items-center justify-center text-error">
                        <span className="material-symbols-outlined text-[32px]">pending_actions</span>
                    </div>
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Belum Mengisi</p>
                        <h3 className="font-display text-display text-primary mt-1">{belumMengisi} <span className="text-headline-md font-medium text-on-surface-variant">Wilayah</span></h3>
                    </div>
                </div>
            </section>

            {/* Monitoring Table Section */}
            <section className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">analytics</span>
                        <h4 className="font-headline-md text-headline-md text-on-surface">Live Status Monitoring</h4>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low border-b border-outline-variant">
                                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase">No</th>
                                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase">Nama Polres</th>
                                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase">Periode</th>
                                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase">Tanggal Kirim</th>
                                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase">Status</th>
                                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {finalData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-on-surface-variant">Data Laporan Kosong Pada Periode Ini</td>
                                </tr>
                            ) : (
                                finalData.map((item, idx) => {
                                    const polresName = item.operator.name || 'Polres Tidak Diketahui';
                                    const initial = polresName.substring(0, 2).toUpperCase();
                                    const submission = item.submission;
                                    const status = submission ? submission.status : 'BELUM_MENGIRIM';

                                    return (
                                        <tr key={`${item.operator.id}-${item.periode}`} className="hover:bg-surface-container-low/50 transition-colors">
                                            <td className="px-lg py-4 font-body-md text-on-surface">{(idx + 1).toString().padStart(2, '0')}</td>
                                            <td className="px-lg py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center text-primary font-bold text-[10px]">{initial}</div>
                                                    <span className="font-body-md font-semibold text-on-surface">{polresName}</span>
                                                </div>
                                            </td>
                                            <td className="px-lg py-4 font-body-md font-medium text-on-surface-variant">
                                                {item.periode}
                                            </td>
                                            <td className="px-lg py-4 font-body-md text-on-surface-variant">
                                                {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </td>
                                            <td className="px-lg py-4">
                                                {status === 'FINAL' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-[12px] font-semibold border border-green-200">
                                                        <span className="w-2 h-2 rounded-full bg-green-600"></span> Final (Terkunci)
                                                    </span>
                                                ) : status === 'TERKIRIM' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[12px] font-semibold border border-blue-200">
                                                        <span className="w-2 h-2 rounded-full bg-blue-600"></span> Menunggu Review
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-[12px] font-semibold border border-yellow-200">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-600"></span> Belum Mengirim
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-lg py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {submission && status !== 'DRAFT' ? (
                                                        <>
                                                            <button
                                                                onClick={() => setViewItem(submission)}
                                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 font-label-md text-label-md rounded-lg hover:bg-blue-100 active:scale-95 transition-all border border-blue-200"
                                                                title="Lihat & Download Data"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">visibility</span> Lihat
                                                            </button>
                                                            {status === 'TERKIRIM' && (
                                                                <button
                                                                    onClick={() => handleLock(submission.id, 'FINAL')}
                                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container active:scale-95 transition-all border border-outline-variant"
                                                                    title="Kunci Laporan menjadi FINAL"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">lock</span> Kunci
                                                                </button>
                                                            )}
                                                            {status === 'FINAL' && (
                                                                <button
                                                                    onClick={() => handleLock(submission.id, 'DRAFT')}
                                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 font-label-md text-label-md rounded-lg hover:bg-red-100 active:scale-95 transition-all border border-red-200"
                                                                    title="Buka Kunci & Kembalikan ke Draf"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">lock_open</span> Buka Kunci
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => sendReminder(item.operator.id, polresName)}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 font-label-md text-label-md rounded-lg hover:bg-orange-100 active:scale-95 transition-all border border-orange-200"
                                                            title="Kirim peringatan ke operator"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">notifications_active</span> Ingatkan
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Modal Lihat Data */}
            {viewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                            <div>
                                <h2 className="font-display text-title-large text-on-surface font-bold">Data Laporan: {viewItem.user?.name}</h2>
                                <p className="font-body-sm text-on-surface-variant">Bulan {new Date(2000, viewItem.bulan - 1).toLocaleString('id-ID', { month: 'long' })} Tahun {viewItem.tahun}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => downloadExcel(viewItem)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-label-md rounded-lg transition-colors shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">download</span> Download Excel
                                </button>
                                <button
                                    onClick={() => setViewItem(null)}
                                    className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body (Table) */}
                        <div className="flex-1 overflow-auto p-6 bg-surface">
                            <div className="overflow-x-auto border border-outline-variant rounded-xl shadow-sm">
                                <table className="w-full text-left border-collapse text-[13px]">
                                    <thead className="bg-surface-container-high sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th rowSpan={2} className="p-3 border-b border-r border-outline-variant font-semibold text-center w-12">No</th>
                                            <th rowSpan={2} className="p-3 border-b border-r border-outline-variant font-semibold w-64">Tindak Pidana</th>
                                            <th colSpan={7} className="p-2 border-b border-r border-outline-variant font-semibold text-center">CC AKT (LP THN BERJALAN)</th>
                                            <th colSpan={6} className="p-2 border-b border-outline-variant font-semibold text-center">CC TUNGGAKAN</th>
                                        </tr>
                                        <tr>
                                            {/* CC AKT Sub-headers */}
                                            <th className="p-2 border-b border-r border-outline-variant font-medium text-center">CT</th>
                                            <th className="p-2 border-b border-r border-outline-variant font-medium text-center">P21</th>
                                            <th className="p-2 border-b border-r border-outline-variant font-medium text-center">HL</th>
                                            <th className="p-2 border-b border-r border-outline-variant font-medium text-center">SP3</th>
                                            <th className="p-2 border-b border-r border-outline-variant font-medium text-center">RJ L</th>
                                            <th className="p-2 border-b border-r border-outline-variant font-medium text-center">RJ S</th>
                                            <th className="p-2 border-b border-r border-outline-variant font-bold text-center bg-blue-50/50">TOT CC AKT</th>

                                            {/* CC TGK Sub-headers */}
                                            <th className="p-2 border-b border-r border-outline-variant font-medium text-center">P21</th>
                                            <th className="p-2 border-b border-r border-outline-variant font-medium text-center">HL</th>
                                            <th className="p-2 border-b border-r border-outline-variant font-medium text-center">SP3</th>
                                            <th className="p-2 border-b border-r border-outline-variant font-medium text-center">RJ L</th>
                                            <th className="p-2 border-b border-r border-outline-variant font-medium text-center">RJ S</th>
                                            <th className="p-2 border-b border-outline-variant font-bold text-center bg-blue-50/50">TOT CC TGK</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant">
                                        {viewItem.matriksData && Array.isArray(viewItem.matriksData) ? (
                                            viewItem.matriksData.slice(0, 57).map((row: any, rIdx: number) => (
                                                <tr key={rIdx} className="hover:bg-surface-container-low transition-colors">
                                                    <td className="p-2 border-r border-outline-variant text-center text-on-surface-variant">{row[0]}</td>
                                                    <td className="p-2 border-r border-outline-variant font-medium text-on-surface whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]" title={row[1]}>{row[1]}</td>
                                                    {/* Values */}
                                                    <td className="p-2 border-r border-outline-variant text-center">{row[2] || '-'}</td>
                                                    <td className="p-2 border-r border-outline-variant text-center">{row[3] || '-'}</td>
                                                    <td className="p-2 border-r border-outline-variant text-center">{row[4] || '-'}</td>
                                                    <td className="p-2 border-r border-outline-variant text-center">{row[5] || '-'}</td>
                                                    <td className="p-2 border-r border-outline-variant text-center">{row[6] || '-'}</td>
                                                    <td className="p-2 border-r border-outline-variant text-center">{row[7] || '-'}</td>
                                                    <td className="p-2 border-r border-outline-variant text-center font-bold bg-blue-50/30 text-blue-900">{row[8] || '-'}</td>

                                                    <td className="p-2 border-r border-outline-variant text-center">{row[9] || '-'}</td>
                                                    <td className="p-2 border-r border-outline-variant text-center">{row[10] || '-'}</td>
                                                    <td className="p-2 border-r border-outline-variant text-center">{row[11] || '-'}</td>
                                                    <td className="p-2 border-r border-outline-variant text-center">{row[12] || '-'}</td>
                                                    <td className="p-2 border-r border-outline-variant text-center">{row[13] || '-'}</td>
                                                    <td className="p-2 text-center font-bold bg-blue-50/30 text-blue-900">{row[14] || '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={15} className="text-center p-8">Data tidak valid</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LapbulMonitoring;
