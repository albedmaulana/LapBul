import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
// @ts-ignore
import * as XLSX from 'xlsx-js-style';
import { AuthContext } from '../context/AuthContext';

const DataRecap = () => {
    const { token } = useContext(AuthContext);
    const [downloading, setDownloading] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [, setShowMonthDropdown] = useState(false);
    const [crimes, setCrimes] = useState<any[]>([]);

    // Default initial filter: 0 = Semua Bulan & Semua Tahun
    const [bulan, setBulan] = useState(0);
    const [tahun, setTahun] = useState(0);
    const [operatorId, setOperatorId] = useState(0);
    const [operators, setOperators] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPolres, setTotalPolres] = useState(0);

    const fetchOperators = async () => {
        try {
            const resUsers = await axios.get('/api/auth/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const ops = resUsers.data.filter((u: any) => u.role === 'OPERATOR_POLRES');
            setOperators(ops);
        } catch (error) {
            console.error("Gagal mengambil data operator", error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchOperators();
        }
    }, [token]);

    const fetchRecapData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/lapbul/recap?bulan=${bulan}&tahun=${tahun}&userId=${operatorId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const aggregated = response.data.data;
            setTotalPolres(response.data.totalPolres);

            const formatted = aggregated.map((row: any) => ({
                name: row[1],
                ct: row[2] || 0,
                p21: row[3] || 0,
                hl: row[4] || 0,
                sp3: row[5] || 0,
                rjL: row[6] || 0,
                rjS: row[7] || 0,
                ccAkt: row[8] || 0,
                t_p21: row[9] || 0,
                t_hl: row[10] || 0,
                t_sp3: row[11] || 0,
                t_rjL: row[12] || 0,
                t_rjS: row[13] || 0,
                ccTgk: row[14] || 0
            }));

            // Fix empty names using fallback if first time
            const crimeTypesList = [
                "TERHADAP KETERTIBAN UMUM", "MEMBAHAYAKAN KEAMANAN UMUM BG ORG/BRG", "SENGAJA MENIMBULKAN KEBAKARAN/BANJIR (PEMBAKARAN)",
                "KARENA ALPA MENIMBULKAN KEBAKARAN/MELETUS", "MEMBERI SUAP", "PEMALSUAN", "SUMPAH PALSU / KETERANGAN PALSU",
                "PEMALSUAN MATERAI", "PEMALSUAN TANDA TANGAN", "PEMALSUAN SURAT", "PERMAINAN JUDI / PERJUDIAN", "FITNAH",
                "PENCEMARAN NAMA BAIK", "PENGHINAAN", "PENGADUAN PALSU", "PENGANCAMAN", "PENCULIKAN", "PERBUATAN TIDAK MENYENANGKAN",
                "KEJAHATAN TERHADAP JIWA ORANG / PEMBUNUHAN", "PENGANIAYAAN BERAT", "PENGANIAYAAN BIASA / RINGAN",
                "KELALAIAN MENGAKIBATKAN ORANG MATI", "KELALAIAN MENGAKIBATKAN ORANG LUKA", "PERCOBAAN PENCURIAN",
                "PENCURIAN BIASA", "PENCURIAN DENGAN PEMBERATAN", "PENCURIAN RINGAN", "PENCURIAN DALAM KELUARGA",
                "PENCURIAN DENGAN KEKERASAN", "CURANMOR", "PENCURIAN TERNAK", "PERAMPASAN", "PERAMPASAN/PENARIKAN KENDARAAN",
                "PENGRUSAKAN", "PENGRUSAKAN RINGAN", "PEMERASAN", "PEMERASAN & PENGANCAMAN", "PENGGELAPAN", "PENGGELAPAN DLM JABATAN",
                "PENIPUAN / PERBUATAN CURANG", "MENGHANCURKAN ATAU MERUSAK BARANG", "MENERIMA SUAP", "PENADAHAN",
                "MEMASUKI PEKARANGAN TANPA IZIN", "PENYEROBOTAN", "PENGEROYOKAN", "TEMU MAYAT", "KEJAHATAN LAINNYA",
                "UU POKOK AGRARIA (MSLH AGRARIA)", "PENGUASAAN LAHAN TANPA HAK", "PENEMPATAN DAN PERLINDUNGAN TKI DI LUAR NEGERI",
                "PERLINDUNGAN SAKSI DAN KORBAN", "PENYELENGGARAAN PEMILU", "PEMERINTAH DAERAH", "KEIMIGRASIAN", "EKSTRADISI",
                "PENYALAHGUNAAN SENJATA API / BAHAN PELEDAK / SAJAM"
            ];

            for (let i = 0; i < 57; i++) {
                if (!formatted[i].name) formatted[i].name = crimeTypesList[i];
            }

            setCrimes(formatted);
        } catch (error) {
            console.error("Gagal mengambil agregasi", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchRecapData();
        }
    }, [bulan, tahun, operatorId, token]);

    const totals = crimes.reduce((acc, curr) => {
        acc.ct += curr.ct;
        acc.p21 += curr.p21;
        acc.hl += curr.hl;
        acc.sp3 += curr.sp3;
        acc.rjL += curr.rjL;
        acc.rjS += curr.rjS;
        acc.ccAkt += curr.ccAkt;
        acc.t_p21 += curr.t_p21;
        acc.t_hl += curr.t_hl;
        acc.t_sp3 += curr.t_sp3;
        acc.t_rjL += curr.t_rjL;
        acc.t_rjS += curr.t_rjS;
        acc.ccTgk += curr.ccTgk;
        return acc;
    }, {
        ct: 0, p21: 0, hl: 0, sp3: 0, rjL: 0, rjS: 0, ccAkt: 0,
        t_p21: 0, t_hl: 0, t_sp3: 0, t_rjL: 0, t_rjS: 0, ccTgk: 0
    });

    const totalAllCc = totals.ccAkt + totals.ccTgk;
    const clearanceRate = totals.ct > 0 ? ((totalAllCc / totals.ct) * 100).toFixed(1) : "0.0";

    const handleDownload = () => {
        if (downloading || downloadSuccess || crimes.length === 0) return;
        setDownloading(true);
        setTimeout(() => {
            try {
                const monthName = new Date(tahun, bulan - 1).toLocaleString('id-ID', { month: 'long' }).toUpperCase();

                // Build Array of Arrays for the sheet
                const wsData = [
                    // Row 1 (Kop Surat 1)
                    ["KEPOLISIAN NEGARA REPUBLIK INDONESIA"],
                    // Row 2 (Kop Surat 2)
                    ["DAERAH SULAWESI UTARA"],
                    // Row 3 (Kop Surat 3)
                    ["DIREKTORAT RESERSE KRIMINAL UMUM"],
                    // Row 4 (Spacer)
                    [],
                    // Row 5 (Title)
                    ["DATA LAPBUL CC CT POLDA SULUT & JAJARAN"],
                    // Row 6 (Subtitle)
                    [`BULAN ${monthName} TAHUN ${tahun}`],
                    // Row 7 (Spacer)
                    [],
                    // Row 8
                    ["NO", "TINDAK PIDANA", "CT", "CC AKT ( LP THN BERJALAN )", "", "", "", "", "CC AKT", "CC TUNGGAKAN", "", "", "", "", "CC TGK"],
                    // Row 9
                    ["", "", "", "P21", "HENTI LIDIK", "SP3", "RJ", "", "", "P21", "HENTI LIDIK", "SP3", "RJ", "", ""],
                    // Row 10
                    ["", "", "", "", "", "", "LIDIK", "SIDIK", "", "", "", "", "LIDIK", "SIDIK", ""]
                ];

                // Add Data Rows
                crimes.forEach((c, idx) => {
                    wsData.push([
                        idx + 1,
                        c.name,
                        c.ct,
                        c.p21, c.hl, c.sp3, c.rjL, c.rjS,
                        c.ccAkt,
                        c.t_p21, c.t_hl, c.t_sp3, c.t_rjL, c.t_rjS,
                        c.ccTgk
                    ]);
                });

                // Add Totals Row
                wsData.push([
                    "",
                    "JUMLAH",
                    totals.ct,
                    totals.p21, totals.hl, totals.sp3, totals.rjL, totals.rjS,
                    totals.ccAkt,
                    totals.t_p21, totals.t_hl, totals.t_sp3, totals.t_rjL, totals.t_rjS,
                    totals.ccTgk
                ]);

                // Create worksheet
                const ws = XLSX.utils.aoa_to_sheet(wsData);

                // Add borders and styling
                const range = XLSX.utils.decode_range(ws['!ref'] as string);
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws[cellAddress]) {
                            ws[cellAddress] = { t: 's', v: '' }; // create empty cell if not exists for merged regions
                        }

                        const isKopSurat = R <= 2; // Row 0, 1, 2
                        const isMainHeader = R === 4 || R === 5; // Row 4 and Row 5
                        const isSpacer = R === 3 || R === 6; // Row 3 and Row 6
                        const isTableHeader = R >= 7 && R <= 9; // Row 7, 8, 9
                        const isFooter = R === range.e.r;

                        if (isSpacer) continue; // No styling on spacer row

                        // Kop Surat styling
                        if (isKopSurat) {
                            if (C <= 1) { // Only style the first cell of the merged row
                                ws[cellAddress].s = {
                                    font: { bold: false, name: 'Arial', sz: 10 },
                                    alignment: { vertical: 'center', horizontal: 'center' }
                                };
                            }
                            continue;
                        }

                        // Main Title styling
                        if (isMainHeader) {
                            if (C === 0) { // Only style the first cell of the merged row
                                ws[cellAddress].s = {
                                    font: { bold: true, name: 'Arial', sz: 11 },
                                    alignment: { vertical: 'center', horizontal: 'center' }
                                };
                            }
                            continue;
                        }

                        ws[cellAddress].s = {
                            border: {
                                top: { style: 'thin', color: { rgb: '000000' } },
                                bottom: { style: 'thin', color: { rgb: '000000' } },
                                left: { style: 'thin', color: { rgb: '000000' } },
                                right: { style: 'thin', color: { rgb: '000000' } }
                            },
                            font: {
                                bold: isTableHeader || isFooter,
                                name: 'Arial',
                                sz: 10
                            },
                            alignment: {
                                vertical: 'center',
                                horizontal: (C === 1 && !isTableHeader && !isFooter) ? 'left' : 'center',
                                wrapText: true
                            }
                        };
                    }
                }

                // Note: cell merges (colspans/rowspans)
                ws['!merges'] = [
                    // Kop Surat merges (A-B)
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
                    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
                    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },

                    // Title merges (A-O)
                    { s: { r: 4, c: 0 }, e: { r: 4, c: 14 } },
                    { s: { r: 5, c: 0 }, e: { r: 5, c: 14 } },

                    // NO (7,0 to 9,0)
                    { s: { r: 7, c: 0 }, e: { r: 9, c: 0 } },
                    // TINDAK PIDANA (7,1 to 9,1)
                    { s: { r: 7, c: 1 }, e: { r: 9, c: 1 } },
                    // CT (7,2 to 9,2)
                    { s: { r: 7, c: 2 }, e: { r: 9, c: 2 } },
                    // CC AKT Header (7,3 to 7,7)
                    { s: { r: 7, c: 3 }, e: { r: 7, c: 7 } },
                    // CC AKT Total Header (7,8 to 9,8)
                    { s: { r: 7, c: 8 }, e: { r: 9, c: 8 } },
                    // CC TUNGGAKAN Header (7,9 to 7,13)
                    { s: { r: 7, c: 9 }, e: { r: 7, c: 13 } },
                    // CC TGK Total Header (7,14 to 9,14)
                    { s: { r: 7, c: 14 }, e: { r: 9, c: 14 } },

                    // Row 8 merges for P21, HL, SP3
                    // P21 Akt (8,3 to 9,3)
                    { s: { r: 8, c: 3 }, e: { r: 9, c: 3 } },
                    // HENTI LIDIK Akt (8,4 to 9,4)
                    { s: { r: 8, c: 4 }, e: { r: 9, c: 4 } },
                    // SP3 Akt (8,5 to 9,5)
                    { s: { r: 8, c: 5 }, e: { r: 9, c: 5 } },
                    // RJ Akt Header (8,6 to 8,7)
                    { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } },

                    // P21 Tgk (8,9 to 9,9)
                    { s: { r: 8, c: 9 }, e: { r: 9, c: 9 } },
                    // HENTI LIDIK Tgk (8,10 to 9,10)
                    { s: { r: 8, c: 10 }, e: { r: 9, c: 10 } },
                    // SP3 Tgk (8,11 to 9,11)
                    { s: { r: 8, c: 11 }, e: { r: 9, c: 11 } },
                    // RJ Tgk Header (8,12 to 8,13)
                    { s: { r: 8, c: 12 }, e: { r: 8, c: 13 } }
                ];

                // Auto width for columns
                ws['!cols'] = [
                    { wch: 5 }, // NO
                    { wch: 40 }, // TINDAK PIDANA
                    { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, // Akt
                    { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 } // Tgk
                ];

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Rekap Data");

                XLSX.writeFile(wb, `Rekap_Lapbul_Bulan_${bulan}_Tahun_${tahun}.xlsx`);

                setDownloading(false);
                setDownloadSuccess(true);
                setTimeout(() => {
                    setDownloadSuccess(false);
                }, 2000);
            } catch (error) {
                console.error("Download Excel gagal", error);
                setDownloading(false);
            }
        }, 500);
    };

    return (
        <div className="flex flex-col gap-lg animate-[fadeIn_0.3s_ease-in-out]">
            {/* Page Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-lg">
                <div>
                    <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Data Lapbul CC CT</h2>
                    <p className="text-on-surface-variant font-body-md text-body-md">Data Summary Polda Sulut & Jajaran (Bulan Berjalan & Tunggakan)</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-2 flex-wrap">
                        <div className="relative bg-surface border border-outline-variant rounded-md shadow-sm">
                            <select
                                value={operatorId}
                                onChange={(e) => { setOperatorId(Number(e.target.value)); }}
                                className="appearance-none bg-transparent border-none text-on-surface font-label-md py-1.5 pl-3 pr-8 outline-none cursor-pointer font-semibold max-w-[150px] truncate"
                            >
                                <option value={0}>Semua Polres</option>
                                {operators.map((op) => (
                                    <option key={op.id} value={op.id}>{op.name}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                        </div>
                        <div className="relative bg-surface border border-outline-variant rounded-md shadow-sm">
                            <select
                                value={bulan}
                                onChange={(e) => { setBulan(Number(e.target.value)); setShowMonthDropdown(false); }}
                                className="appearance-none bg-transparent border-none text-on-surface font-label-md py-1.5 pl-3 pr-8 outline-none cursor-pointer font-semibold"
                            >
                                <option value={0}>Semua</option>
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const m = i + 1;
                                    const monthName = new Date(2000, i).toLocaleString('id-ID', { month: 'long' });
                                    return <option key={m} value={m}>{monthName}</option>;
                                })}
                            </select>
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                        </div>
                        <div className="relative bg-surface border border-outline-variant rounded-md shadow-sm">
                            <select
                                value={tahun}
                                onChange={(e) => { setTahun(Number(e.target.value)); }}
                                className="appearance-none bg-transparent border-none text-on-surface font-label-md py-1.5 pl-3 pr-8 outline-none cursor-pointer font-semibold"
                            >
                                <option value={0}>Semua</option>
                                {Array.from({ length: new Date().getFullYear() - 2023 + 1 }).map((_, i) => {
                                    const y = 2023 + i;
                                    return <option key={y} value={y}>{y}</option>;
                                })}
                            </select>
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                        </div>
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={downloading || downloadSuccess}
                        className={`flex items-center gap-2 ${downloadSuccess ? 'bg-blue-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-md py-2 rounded-lg font-label-md text-label-md transition-all shadow-sm active:scale-95 disabled:opacity-80`}
                    >
                        {downloading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">sync</span>
                                <span>Processing...</span>
                            </>
                        ) : downloadSuccess ? (
                            <>
                                <span className="material-symbols-outlined">check_circle</span>
                                <span>Downloaded</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">download</span>
                                <span>Download Rekap (.xlsx)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Dashboard Summary KPI Mini-cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-lg">
                <div className="bg-surface border border-outline-variant p-md rounded-lg border-l-4 border-l-blue-500 shadow-sm">
                    <div className="text-label-sm font-label-sm text-on-surface-variant uppercase mb-xs tracking-wider">Crime Total (CT)</div>
                    <div className="text-headline-md font-headline-md font-bold text-on-surface">{totals.ct.toLocaleString()}</div>
                </div>
                <div className="bg-surface border border-outline-variant p-md rounded-lg border-l-4 border-l-green-500 shadow-sm">
                    <div className="text-label-sm font-label-sm text-on-surface-variant uppercase mb-xs tracking-wider">Total CC (AKT + TGK)</div>
                    <div className="text-headline-md font-headline-md font-bold text-on-surface">{isLoading ? '...' : totalAllCc.toLocaleString()}</div>
                </div>
                <div className="bg-surface border border-outline-variant p-md rounded-lg border-l-4 border-l-amber-500 shadow-sm relative">
                    {totalPolres > 0 && <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-full">{totalPolres} Polres melapor</span>}
                    <div className="text-label-sm font-label-sm text-on-surface-variant uppercase mb-xs tracking-wider">Clearance Rate</div>
                    <div className="text-headline-md font-headline-md font-bold text-on-surface">{clearanceRate}%</div>
                </div>
                <div className="bg-surface border border-outline-variant p-md rounded-lg border-l-4 border-l-red-500 shadow-sm">
                    <div className="text-label-sm font-label-sm text-on-surface-variant uppercase mb-xs tracking-wider">Total Tunggakan</div>
                    <div className="text-headline-md font-headline-md font-bold text-on-surface">{totals.ccTgk.toLocaleString()}</div>
                </div>
            </div>

            {/* Spreadsheet Matrix Container */}
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm relative z-0">
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                        height: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #94a3b8;
                    }
                    .sticky-col {
                        position: sticky;
                        background: #ffffff;
                        z-index: 10;
                    }
                    .sticky-col-no {
                        left: 0;
                    }
                    .sticky-col-tp {
                        left: 48px;
                        border-right: 2px solid #cbd5e1 !important;
                    }
                    .sticky-header {
                        position: sticky;
                        top: 0;
                        z-index: 20;
                    }
                    .matrix-table th {
                        border: 1px solid #e2e8f0;
                        padding: 8px;
                        background-color: #f8fafc;
                        font-size: 11px;
                        text-align: center;
                    }
                    .matrix-table td {
                        border: 1px solid #e2e8f0;
                        padding: 6px 8px;
                        text-align: center;
                        font-size: 13px;
                    }
                `}</style>
                <div className="overflow-auto custom-scrollbar max-h-[calc(100vh-320px)] relative">
                    <table className="matrix-table w-full border-collapse">
                        <thead className="sticky-header shadow-sm">
                            {/* Top Tier Header */}
                            <tr>
                                <th className="sticky-col sticky-col-no w-12 font-bold z-30" rowSpan={3}>NO</th>
                                <th className="sticky-col sticky-col-tp min-w-[260px] font-bold text-left z-30" rowSpan={3}>TINDAK PIDANA</th>
                                <th className="w-16 font-bold text-blue-800" rowSpan={3}>CT</th>
                                <th className="font-bold text-green-800 border-b border-green-200" colSpan={5}>CC AKT ( LP THN BERJALAN )</th>
                                <th className="w-20 font-bold bg-green-50 text-green-900" rowSpan={3}>CC AKT</th>
                                <th className="font-bold text-amber-800 border-b border-amber-200" colSpan={5}>CC TUNGGAKAN</th>
                                <th className="w-20 font-bold bg-amber-50 text-amber-900" rowSpan={3}>CC TGK</th>
                            </tr>
                            {/* Second Tier Header */}
                            <tr>
                                <th className="w-14" rowSpan={2}>P21</th>
                                <th className="w-14" rowSpan={2}>HENTI<br />LIDIK</th>
                                <th className="w-14" rowSpan={2}>SP3</th>
                                <th className="border-b border-outline-variant" colSpan={2}>RJ</th>
                                <th className="w-14" rowSpan={2}>P21</th>
                                <th className="w-14" rowSpan={2}>HENTI<br />LIDIK</th>
                                <th className="w-14" rowSpan={2}>SP3</th>
                                <th className="border-b border-outline-variant" colSpan={2}>RJ</th>
                            </tr>
                            {/* Third Tier Header */}
                            <tr>
                                <th className="w-14">LIDIK</th>
                                <th className="w-14">SIDIK</th>
                                <th className="w-14">LIDIK</th>
                                <th className="w-14">SIDIK</th>
                            </tr>
                        </thead>
                        <tbody>
                            {crimes.map((crime, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="sticky-col sticky-col-no bg-white font-medium text-slate-500">{index + 1}</td>
                                    <td className="sticky-col sticky-col-tp text-left font-medium bg-white whitespace-nowrap overflow-hidden text-ellipsis">{crime.name}</td>
                                    <td className="font-bold text-blue-600 bg-blue-50/20">{crime.ct}</td>
                                    {/* CC AKT cols */}
                                    <td>{crime.p21}</td>
                                    <td>{crime.hl}</td>
                                    <td>{crime.sp3}</td>
                                    <td>{crime.rjL}</td>
                                    <td>{crime.rjS}</td>
                                    <td className="bg-green-50/50 font-bold text-green-700">{crime.ccAkt}</td>
                                    {/* CC TUNGGAKAN cols */}
                                    <td>{crime.t_p21}</td>
                                    <td>{crime.t_hl}</td>
                                    <td>{crime.t_sp3}</td>
                                    <td>{crime.t_rjL}</td>
                                    <td>{crime.t_rjS}</td>
                                    <td className="bg-amber-50/50 font-bold text-amber-700">{crime.ccTgk}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] bg-slate-100">
                            <tr className="font-bold">
                                <td className="sticky-col sticky-col-no bg-slate-100"></td>
                                <td className="sticky-col sticky-col-tp text-left bg-slate-100 text-on-surface">JUMLAH</td>
                                <td className="text-blue-800 bg-blue-100/50">{totals.ct.toLocaleString()}</td>
                                <td>{totals.p21.toLocaleString()}</td>
                                <td>{totals.hl.toLocaleString()}</td>
                                <td>{totals.sp3.toLocaleString()}</td>
                                <td>{totals.rjL.toLocaleString()}</td>
                                <td>{totals.rjS.toLocaleString()}</td>
                                <td className="bg-green-100/80 text-green-800">{totals.ccAkt.toLocaleString()}</td>
                                <td>{totals.t_p21.toLocaleString()}</td>
                                <td>{totals.t_hl.toLocaleString()}</td>
                                <td>{totals.t_sp3.toLocaleString()}</td>
                                <td>{totals.t_rjL.toLocaleString()}</td>
                                <td>{totals.t_rjS.toLocaleString()}</td>
                                <td className="bg-amber-100/80 text-amber-900">{totals.ccTgk.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Information Footer */}
            <div className="mt-md flex flex-col sm:flex-row justify-between items-center text-label-sm font-label-sm text-on-surface-variant bg-surface-container-low p-sm rounded-lg border border-outline-variant shadow-sm gap-2">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> CT: Crime Total</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full"></span> CC AKT: LP Thn Berjalan</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-full"></span> CC TGK: CC Tunggakan</span>
                </div>
                <div className="italic">1. LAPBUL PALING LAMBAT DIKIRIM SETIAP AKHIR BULAN</div>
            </div>
        </div>
    );
};

export default DataRecap;
