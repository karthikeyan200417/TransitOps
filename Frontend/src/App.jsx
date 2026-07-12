import React, { useState } from 'react';
import LoginPage from './LoginPage';
import Dashboard from './pages/Dashboard';
import FleetPage from './pages/FleetPage';
import DriverManagement from './pages/DriverManagement';
import TripManagement from './pages/TripManagement';
import MaintenancePage from './pages/MaintenancePage';
import FuelExpenses from './pages/FuelExpenses';
import ReportsPage from './pages/ReportsPage';

function App() {
    // Navigation states: 'login' | 'dashboard' | 'fleet' | 'drivers' | 'trips' | 'maintenance' | 'fuel' | 'analytics'
    const [page, setPage] = useState('login');

    if (page === 'login') {
        return <LoginPage onLogin={() => setPage('dashboard')} />;
    }

    // Router switchboard
    switch (page) {
        case 'fleet':
            return <FleetPage onNavigate={setPage} />;
        case 'drivers':
            return <DriverManagement onNavigate={setPage} />;
        case 'trips':
            return <TripManagement onNavigate={setPage} />;
        case 'maintenance':
            return <MaintenancePage onNavigate={setPage} />;
        case 'fuel':
            return <FuelExpenses onNavigate={setPage} />;
        case 'analytics':
            return <ReportsPage onNavigate={setPage} />;
        case 'dashboard':
        default:
            return <Dashboard onNavigate={setPage} />;
    }
}

export default App;
