import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
    const { logout } = useContext(AuthContext);

    const getMenuClass = (tabName: string) => {
        if (activeTab === tabName) {
            return "flex items-center gap-3 px-md py-3 bg-secondary-container text-on-secondary-container font-semibold rounded-lg cursor-pointer";
        }
        return "flex items-center gap-3 px-md py-3 text-on-surface-variant font-body-md hover:bg-surface-container-high transition-colors rounded-lg group cursor-pointer";
    };

    const getIconStyle = (tabName: string) => {
        return activeTab === tabName ? { fontVariationSettings: "'FILL' 1" } : {};
    };

    return (
        <aside className="w-56 h-full fixed left-0 top-0 bg-surface border-r border-outline-variant flex flex-col py-md px-sm z-50">
            <div className="flex items-center gap-3 px-md mb-xl">
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <img src="/logoreskrim.png" alt="Logo Reskrim" className="w-full h-full object-contain drop-shadow-sm" />
                </div>
                <div>
                    <h1 className="font-headline-lg text-headline-lg font-bold text-primary leading-tight">Bin Ops</h1>
                    <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-widest">Ditreskrimum Polda Sulut</p>
                </div>
            </div>
            <nav className="flex-1 space-y-1">
                <div onClick={() => setActiveTab('dashboard')} className={getMenuClass('dashboard')}>
                    <span className="material-symbols-outlined group-hover:text-primary" style={getIconStyle('dashboard')}>dashboard</span>
                    <span>Dashboard</span>
                </div>
                <div onClick={() => setActiveTab('monitoring')} className={getMenuClass('monitoring')}>
                    <span className="material-symbols-outlined group-hover:text-primary" style={getIconStyle('monitoring')}>monitoring</span>
                    <span>Lapbul Monitoring</span>
                </div>
                <div onClick={() => setActiveTab('recap')} className={getMenuClass('recap')}>
                    <span className="material-symbols-outlined group-hover:text-primary" style={getIconStyle('recap')}>analytics</span>
                    <span>Data Recap</span>
                </div>
                <div onClick={() => setActiveTab('users')} className={getMenuClass('users')}>
                    <span className="material-symbols-outlined group-hover:text-primary" style={getIconStyle('users')}>manage_accounts</span>
                    <span>User Monitoring</span>
                </div>
            </nav>
            <div className="mt-auto pt-md border-t border-outline-variant space-y-1">
                <button onClick={logout} className="w-full flex items-center gap-3 px-md py-3 text-error font-body-md hover:bg-error-container transition-colors rounded-lg group">
                    <span className="material-symbols-outlined group-hover:text-error">logout</span>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
