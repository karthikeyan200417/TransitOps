import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import Dashboard from './pages/Dashboard';
import FleetPage from './pages/FleetPage';
import DriverManagement from './pages/DriverManagement';
import TripManagement from './pages/TripManagement';
import MaintenancePage from './pages/MaintenancePage';
import FuelExpenses from './pages/FuelExpenses';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import SoftAurora from './SoftAurora';

function AppContent() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [toastMessage, setToastMessage] = useState(null);

    const triggerToast = (msg) => {
        setToastMessage(msg);
    };

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    // Handle navigation callback from the Navbar/StaggeredMenu
    const handleNavigate = (pageKey) => {
        navigate(`/${pageKey}`);
    };

    const handleLoginSuccess = () => {
        navigate('/dashboard');
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', background: '#0B0B0F', overflow: 'hidden' }}>
            <SoftAurora
                speed={0.3}
                scale={1.5}
                brightness={0.8}
                color1="#1a0f2e"
                color2="#6D4AFF"
                noiseFrequency={2.5}
                noiseAmplitude={0.8}
                bandHeight={0.4}
                bandSpread={0.9}
                octaveDecay={0.1}
                layerOffset={0}
                colorSpeed={0.8}
                enableMouseInteraction={false}
            />

            {toastMessage && (
                <div className="toast-notification">
                    <div className="toast-content">
                        {toastMessage}
                    </div>
                </div>
            )}

            <Routes>
                <Route
                    path="/login"
                    element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLoginSuccess} />}
                />
                <Route
                    path="/signup"
                    element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />}
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute pageKey="dashboard" triggerToast={triggerToast}>
                            <Dashboard onNavigate={handleNavigate} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/fleet"
                    element={
                        <ProtectedRoute pageKey="fleet" triggerToast={triggerToast}>
                            <FleetPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/drivers"
                    element={
                        <ProtectedRoute pageKey="drivers" triggerToast={triggerToast}>
                            <DriverManagement onNavigate={handleNavigate} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/trips"
                    element={
                        <ProtectedRoute pageKey="trips" triggerToast={triggerToast}>
                            <TripManagement onNavigate={handleNavigate} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/maintenance"
                    element={
                        <ProtectedRoute pageKey="maintenance" triggerToast={triggerToast}>
                            <MaintenancePage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/fuel"
                    element={
                        <ProtectedRoute pageKey="fuel" triggerToast={triggerToast}>
                            <FuelExpenses onNavigate={handleNavigate} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute pageKey="analytics" triggerToast={triggerToast}>
                            <ReportsPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute pageKey="settings" triggerToast={triggerToast}>
                            <SettingsPage onNavigate={handleNavigate} />
                        </ProtectedRoute>
                    }
                />

                {/* Redirects */}
                <Route
                    path="/"
                    element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
                />
                <Route
                    path="*"
                    element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
                />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
