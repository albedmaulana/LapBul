import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const TopNavBar = () => {
    const { token } = useContext(AuthContext);
    
    // States for dropdowns
    const [showNotif, setShowNotif] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Refs for outside click detection
    const notifRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    // Get User Info from Token
    let userRole = 'Operator';
    let userName = 'User';
    if (token) {
        try {
            const payload = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            userRole = decodedPayload.role === 'ADMIN_POLDA' ? 'Admin Polda' : 'Operator Polres';
            userName = decodedPayload.name || (decodedPayload.role === 'ADMIN_POLDA' ? 'Ditreskrimum' : 'Polres Jajaran');
        } catch (e) {
            console.error("Gagal membaca token", e);
        }
    }

    useEffect(() => {
        // Handle outside click to close dropdowns
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotif(false);
            if (historyRef.current && !historyRef.current.contains(event.target as Node)) setShowHistory(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);

    useEffect(() => {
        const fetchHistoryData = async () => {
            if (!token) return;
            try {
                const notifResponse = await axios.get('/api/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const notifs = notifResponse.data.map((item: any) => {
                    const timeStr = new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    });
                    
                    return {
                        id: item.id,
                        title: item.title,
                        desc: item.message,
                        time: timeStr,
                        unread: !item.isRead
                    };
                });
                setNotifications(notifs);
                
                // Format history logs differently
                const response = await axios.get('/api/lapbul/history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const historyData = response.data;
                const logs = historyData.map((item: any) => {
                    const timeStr = new Date(item.updatedAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    });
                    const polresName = item.user?.name ? item.user.name : (userRole === 'Operator Polda' ? 'Anda' : 'Polres');
                    
                    return {
                        id: item.id,
                        action: `Menyimpan Laporan Bulan ${item.bulan}/${item.tahun} (${item.status})`,
                        actor: polresName,
                        time: timeStr
                    };
                });
                setHistoryLogs(logs);
            } catch (error) {
                console.error("Gagal mengambil data riwayat", error);
            }
        };

        if (showNotif || showHistory) {
            fetchHistoryData();
        }
    }, [showNotif, showHistory, token, userRole]);

    return (
        <header className="flex justify-between items-center h-14 ml-56 px-6 w-[calc(100%-14rem)] fixed top-0 bg-surface/90 backdrop-blur-md border-b border-outline-variant z-40">
            {/* Left Side: Title & Date */}
            <div className="flex items-center gap-3">
                <h2 className="text-[15px] font-bold text-on-surface tracking-tight">Bin Ops Ditreskrimum</h2>
                <span className="text-outline-variant text-sm">/</span>
                <span className="text-[13px] text-on-surface-variant font-medium bg-surface-container px-3 py-1 rounded-md border border-outline-variant/50">
                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
            </div>

            {/* Right Side: Actions & Profile */}
            <div className="flex items-center gap-1">
                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => setShowNotif(!showNotif)}
                        className={`w-9 h-9 flex items-center justify-center transition-all active:scale-95 rounded-lg relative ${showNotif ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        {notifications.some(n => n.unread) && (
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-[1.5px] border-surface animate-pulse"></div>
                        )}
                    </button>

                    {showNotif && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-outline-variant rounded-xl shadow-xl overflow-hidden animate-[fadeIn_0.2s_ease-in-out]">
                            <div className="p-md border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
                                <h4 className="font-headline-md text-[16px] font-bold text-on-surface">Notifikasi</h4>
                                <button 
                                    onClick={async () => {
                                        try {
                                            await axios.put('/api/notifications/read-all', {}, {
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                                        } catch(e) {
                                            console.error(e);
                                        }
                                    }}
                                    className="font-label-sm text-primary hover:underline"
                                >
                                    Tandai dibaca
                                </button>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div 
                                        key={n.id} 
                                        onClick={() => {
                                            const updated = notifications.map(item => item.id === n.id ? { ...item, unread: false } : item);
                                            setNotifications(updated);
                                        }}
                                        className={`p-md border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors cursor-pointer ${n.unread ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h5 className={`font-label-md ${n.unread ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>{n.title}</h5>
                                            <span className="font-label-sm text-on-surface-variant text-[10px] whitespace-nowrap ml-2">{n.time}</span>
                                        </div>
                                        <p className="font-body-md text-[13px] text-on-surface-variant leading-tight">{n.desc}</p>
                                    </div>
                                )) : (
                                    <div className="p-4 text-center text-on-surface-variant text-sm">Tidak ada notifikasi</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* History Dropdown */}
                <div className="relative" ref={historyRef}>
                    <button 
                        onClick={() => setShowHistory(!showHistory)}
                        className={`w-9 h-9 flex items-center justify-center transition-all active:scale-95 rounded-lg ${showHistory ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">history</span>
                    </button>

                    {showHistory && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-outline-variant rounded-xl shadow-xl overflow-hidden animate-[fadeIn_0.2s_ease-in-out]">
                            <div className="p-md border-b border-outline-variant bg-surface-container-lowest">
                                <h4 className="font-headline-md text-[16px] font-bold text-on-surface">Riwayat Pelaporan</h4>
                            </div>
                            <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
                                {historyLogs.length > 0 ? historyLogs.map(log => (
                                    <div key={log.id} className="p-2 hover:bg-surface-container-low rounded-lg transition-colors flex items-start gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-primary/70"></div>
                                        <div>
                                            <p className="font-body-md text-[13px] text-on-surface">{log.actor} <span className="text-on-surface-variant">{log.action}</span></p>
                                            <p className="font-label-sm text-on-surface-variant text-[10px] mt-0.5">{log.time}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-4 text-center text-on-surface-variant text-sm">Tidak ada riwayat aktivitas</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-7 w-[1px] bg-outline-variant/60 mx-2"></div>
                
                {/* Profile Display */}
                <div className="flex items-center gap-2.5">
                    <div className="text-right hidden md:block">
                        <p className="text-[13px] font-semibold text-on-surface leading-tight">{userRole}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium leading-tight">{userName}</p>
                    </div>
                    <img 
                        className="w-8 h-8 rounded-lg border border-outline-variant/60 object-contain bg-white p-0.5 shadow-sm" 
                        alt="User Profile" 
                        src="/logoreskrim.png" 
                    />
                </div>
            </div>
        </header>
    );
};

export default TopNavBar;
