import { useState } from 'react';
import OperatorSidebar from './OperatorSidebar';
import OperatorTopNavBar from './OperatorTopNavBar';
import OperatorHome from './OperatorHome';
import OperatorInputLapbul from './OperatorInputLapbul';
import OperatorHistory from './OperatorHistory';

const OperatorDashboard = () => {
    // State to control which tab is active
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // State for edit mode - stores bulan/tahun to pre-fill in OperatorInputLapbul
    const [editTarget, setEditTarget] = useState<{ bulan: number; tahun: number } | null>(null);

    // Handler when user clicks "Edit" on a report in history
    const handleEditReport = (bulan: number, tahun: number) => {
        setEditTarget({ bulan, tahun });
        setActiveTab('input');
    };

    // Handler when navigating away from input (reset edit target)
    const handleSetActiveTab = (tab: string) => {
        if (tab !== 'input') {
            setEditTarget(null);
        }
        setActiveTab(tab);
    };

    // Render content based on selected tab
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <OperatorHome />;
            case 'input':
                return <OperatorInputLapbul editTarget={editTarget} onEditComplete={() => setEditTarget(null)} />;
            case 'history':
                return <OperatorHistory onEditReport={handleEditReport} />;
            default:
                return <OperatorHome />;
        }
    };

    return (
        <div className="text-on-background bg-background min-h-screen font-sans">
            {/* Operator Sidebar */}
            <OperatorSidebar activeTab={activeTab} setActiveTab={handleSetActiveTab} />
            
            {/* Operator Top Navigation Bar */}
            <OperatorTopNavBar />

            {/* Main Content Canvas */}
            <main className="ml-56 pt-14 min-h-screen p-lg">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default OperatorDashboard;
