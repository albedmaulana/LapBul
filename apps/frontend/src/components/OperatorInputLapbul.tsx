import { useEffect, useRef, useState, useContext } from 'react';
import jspreadsheet from 'jspreadsheet-ce';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import 'jsuites/dist/jsuites.css';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

// Master data of 57 crimes
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

const initialData = crimeTypesList.map((crime, i) => {
    const r = i + 1;
    return [
        r, crime, 
        "", "", "", "", "", "", `=SUM(D${r}:H${r})`, // CT, P21, HL, SP3, RJL, RJS, CCAKT (col I)
        "", "", "", "", "", `=SUM(J${r}:N${r})`      // T_P21, T_HL, T_SP3, T_RJL, T_RJS, CCTGK (col O)
    ];
});

// Add summary row at the bottom (Row 58)
initialData.push([
    "", "JUMLAH",
    `=SUM(C1:C57)`, `=SUM(D1:D57)`, `=SUM(E1:E57)`, `=SUM(F1:F57)`, `=SUM(G1:G57)`, `=SUM(H1:H57)`, `=SUM(I1:I57)`,
    `=SUM(J1:J57)`, `=SUM(K1:K57)`, `=SUM(L1:L57)`, `=SUM(M1:M57)`, `=SUM(N1:N57)`, `=SUM(O1:O57)`
]);

interface OperatorInputLapbulProps {
    editTarget?: { bulan: number; tahun: number } | null;
    onEditComplete?: () => void;
}

const OperatorInputLapbul = ({ editTarget, onEditComplete }: OperatorInputLapbulProps) => {
    const jRef = useRef<HTMLDivElement>(null);
    const jSheet = useRef<any>(null);
    const { token } = useContext(AuthContext);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    
    // Set initial date to current month/year
    const [bulan, setBulan] = useState(new Date().getMonth() + 1);
    const [tahun, setTahun] = useState(new Date().getFullYear());

    // Apply editTarget values when provided
    useEffect(() => {
        if (editTarget) {
            setBulan(editTarget.bulan);
            setTahun(editTarget.tahun);
            setIsEditing(true);
        }
    }, [editTarget]);

    // Initialize jspreadsheet
    useEffect(() => {
        if (!jSheet.current && jRef.current) {
            // Force clear the container to prevent duplicate tables
            jRef.current.innerHTML = ''; 
            
            jSheet.current = jspreadsheet(jRef.current, {
                worksheets: [{
                    data: JSON.parse(JSON.stringify(initialData)),
                    columns: [
                        { type: 'text', title: 'NO', width: 40, readOnly: true },
                        { type: 'text', title: 'TINDAK PIDANA', width: 300, readOnly: true },
                        { type: 'numeric', title: 'CT', width: 60 },
                        { type: 'numeric', title: 'P21', width: 60 },
                        { type: 'numeric', title: 'HENTI LIDIK', width: 70 },
                        { type: 'numeric', title: 'SP3', width: 60 },
                        { type: 'numeric', title: 'RJ LIDIK', width: 70 },
                        { type: 'numeric', title: 'RJ SIDIK', width: 70 },
                        // CC AKT (Formula: sum of 3 to 7)
                        { type: 'numeric', title: 'TOTAL CC AKT', width: 100, readOnly: true },
                        { type: 'numeric', title: 'P21', width: 60 },
                        { type: 'numeric', title: 'HENTI LIDIK', width: 70 },
                        { type: 'numeric', title: 'SP3', width: 60 },
                        { type: 'numeric', title: 'RJ LIDIK', width: 70 },
                        { type: 'numeric', title: 'RJ SIDIK', width: 70 },
                        // CC TGK (Formula: sum of 9 to 13)
                        { type: 'numeric', title: 'TOTAL CC TGK', width: 100, readOnly: true },
                    ],
                    nestedHeaders: [
                        [
                            { title: '', colspan: 3 },
                            { title: 'CC AKT (LP THN BERJALAN)', colspan: 5 },
                            { title: '', colspan: 1 },
                            { title: 'CC TUNGGAKAN', colspan: 5 },
                            { title: '', colspan: 1 }
                        ]
                    ]
                }]
            });
        }
        return () => {
            if (jSheet.current) {
                try {
                    jspreadsheet.destroy(jRef.current as any);
                } catch(e) {
                    console.error("Cleanup error", e);
                }
                jSheet.current = null;
                if (jRef.current) {
                    jRef.current.innerHTML = ''; // Ensure DOM is clean for next mount
                    jRef.current.className = 'w-full overflow-x-auto jspreadsheet-theme-modern'; // Reset class
                }
            }
        };
    }, []);

    // Load existing data when editTarget is set and jspreadsheet is ready
    useEffect(() => {
        const loadExistingData = async () => {
            if (!editTarget || !token || !jSheet.current || !jSheet.current[0]) return;
            
            try {
                const res = await axios.get('/api/lapbul/history', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const match = res.data.find((item: any) => item.bulan === editTarget.bulan && item.tahun === editTarget.tahun);
                
                if (match && match.matriksData && Array.isArray(match.matriksData)) {
                    const ws = jSheet.current[0];
                    // Set each cell value from existing data
                    for (let row = 0; row < match.matriksData.length; row++) {
                        for (let col = 2; col < match.matriksData[row].length; col++) {
                            // Skip formula columns (index 8 = CC AKT, index 14 = CC TGK)
                            if (col === 8 || col === 14) continue;
                            const val = match.matriksData[row][col];
                            if (val !== '' && val !== null && val !== undefined) {
                                ws.setValue(ws.getCell(col, row), val, false);
                            }
                        }
                    }
                    setMessage('Data laporan sebelumnya berhasil dimuat. Silakan edit dan simpan kembali.');
                    setTimeout(() => setMessage(''), 4000);
                }
            } catch (error) {
                console.error('Gagal memuat data untuk diedit:', error);
            }
        };

        // Small delay to ensure jspreadsheet is fully initialized
        const timer = setTimeout(loadExistingData, 300);
        return () => clearTimeout(timer);
    }, [editTarget, token]);

    const handleSubmit = async (submitStatus = 'DRAFT') => {
        if (!jSheet.current || !jSheet.current[0]) return;
        
        if (submitStatus === 'TERKIRIM') {
            const confirm = window.confirm("Apakah Anda yakin ingin mengirim laporan ini? Data tidak akan bisa diedit lagi kecuali Admin menolaknya.");
            if (!confirm) return;
        }

        const ws = jSheet.current[0];
        const rawData = ws.getData();
        
        // Resolve formula cells manually to ensure 100% accuracy (excluding the JUMLAH row)
        const resolvedData = rawData.map((row: any[], rowIdx: number) => {
            const r = [...row]; // copy array
            // Skip the manual calculation for the JUMLAH row (index 57)
            if (rowIdx < 57) {
                // CC AKT = P21(3) + HL(4) + SP3(5) + RJL(6) + RJS(7)
                r[8] = (Number(r[3]) || 0) + (Number(r[4]) || 0) + (Number(r[5]) || 0) + (Number(r[6]) || 0) + (Number(r[7]) || 0);
                
                // CC TGK = T_P21(9) + T_HL(10) + T_SP3(11) + T_RJL(12) + T_RJS(13)
                r[14] = (Number(r[9]) || 0) + (Number(r[10]) || 0) + (Number(r[11]) || 0) + (Number(r[12]) || 0) + (Number(r[13]) || 0);
            }
            return r;
        });

        setIsSubmitting(true);
        setMessage('');

        try {
            await axios.post('/api/lapbul/submit', {
                bulan,
                tahun,
                matriksData: resolvedData,
                status: submitStatus
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage('Laporan DRAFT berhasil disimpan!');
            if (onEditComplete) onEditComplete();
        } catch (error) {
            setMessage('Gagal menyimpan laporan.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="flex flex-col gap-lg">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="font-display text-display font-bold text-on-surface">
                        {isEditing ? 'Edit Lapbul CC CT' : 'Input Lapbul CC CT'}
                    </h1>
                    <p className="font-body-md text-on-surface-variant mt-1">
                        {isEditing 
                            ? `Anda sedang mengedit laporan bulan ${new Date(2000, bulan - 1).toLocaleString('id-ID', { month: 'long' })} ${tahun}.`
                            : 'Masukkan data laporan bulanan. Data akan tersimpan otomatis sebagai DRAFT.'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex gap-2">
                        <div className="relative bg-surface border border-outline-variant rounded-lg shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                            <select 
                                value={bulan}
                                onChange={(e) => setBulan(Number(e.target.value))}
                                className="appearance-none bg-transparent border-none text-on-surface font-label-md py-2 pl-3 pr-8 outline-none cursor-pointer"
                            >
                                {Array.from({length: 12}).map((_, i) => {
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
                                className="appearance-none bg-transparent border-none text-on-surface font-label-md py-2 pl-3 pr-8 outline-none cursor-pointer"
                            >
                                {Array.from({length: new Date().getFullYear() - 2023 + 1}).map((_, i) => {
                                    const y = 2023 + i;
                                    return <option key={y} value={y}>{y}</option>;
                                })}
                            </select>
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleSubmit('DRAFT')}
                            disabled={isSubmitting}
                            className="bg-surface hover:bg-surface-container-low text-primary border border-primary px-4 py-2 rounded-lg font-label-md transition shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                            Simpan DRAFT
                        </button>
                        <button 
                            onClick={() => handleSubmit('TERKIRIM')}
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-2 rounded-lg font-label-md transition shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                            Kirim
                        </button>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl font-body-md shadow-sm border ${message.includes('berhasil') ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'} flex items-center gap-3`}>
                    <span className="material-symbols-outlined">{message.includes('berhasil') ? 'check_circle' : 'error'}</span>
                    {message}
                </div>
            )}

            <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden p-0">
                {/* Jspreadsheet Container */}
                <div ref={jRef} className="w-full overflow-x-auto jspreadsheet-theme-modern" />
            </div>
            
            <div className="text-[12px] text-on-surface-variant flex items-center gap-2 bg-surface-container-low p-3 rounded-lg border border-outline-variant border-dashed">
                <span className="material-symbols-outlined text-[16px] text-tertiary">info</span>
                Setelah mengklik <b>Kirim (FINAL)</b>, laporan akan terkunci dan tidak bisa diedit kembali kecuali dibuka oleh Admin Polda.
            </div>
        </div>
    );
};

export default OperatorInputLapbul;
