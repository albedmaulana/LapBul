import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavBar from './TopNavBar';
import DashboardOverview from './DashboardOverview';
import LapbulMonitoring from './LapbulMonitoring';
import UserManagement from './UserManagement';
import DataRecap from './DataRecap';

const AdminDashboard = () => {
    // State untuk mengontrol tab mana yang sedang aktif
    const [activeTab, setActiveTab] = useState('dashboard');

    // Fungsi untuk merender konten sesuai tab yang dipilih
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardOverview />;
            case 'monitoring':
                return <LapbulMonitoring />;
            case 'users':
                return <UserManagement />;
            case 'recap':
                return <DataRecap />;
            default:
                return <DashboardOverview />;
        }
    };

    return (
        <div className="text-on-background bg-background min-h-screen">
            {/* Mengoper state activeTab ke Sidebar agar menu yang diklik menyala */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <TopNavBar />

            {/* Main Content Canvas */}
            <main className="ml-56 pt-16 min-h-screen p-lg">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
