import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import RecentTripsTable from '../components/RecentTripsTable';
import VehicleStatusCard from '../components/VehicleStatusCard';
import ChartsSection from '../components/ChartsSection';
import ActivityTimeline from '../components/ActivityTimeline';
import { dashboardApi, tripsApi, analyticsApi } from '../services/api';
import './Dashboard.css';

export default function Dashboard({ onNavigate }) {
    const [dash, setDash] = useState(null);
    const [trips, setTrips] = useState([]);
    const [tripAnalytics, setTripAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchAll() {
            try {
                const [d, t, ta] = await Promise.all([
                    dashboardApi.get(),
                    tripsApi.list(),
                    analyticsApi.trips().catch(() => null),
                ]);
                setDash(d);
                setTrips(t.slice(0, 6));
                setTripAnalytics(ta);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);

    const kpiData = dash ? [
        { id: 1, title: 'Total Vehicles',    value: String(dash.total_vehicles),    trend: '', trendUp: true,  icon: 'truck',     color: '#6D4AFF' },
        { id: 2, title: 'Available Vehicles', value: String(dash.available_vehicles), trend: '', trendUp: true,  icon: 'check-circle', color: '#00D2A0' },
        { id: 3, title: 'In Maintenance',    value: String(dash.pending_maintenance), trend: '', trendUp: false, icon: 'tool',      color: '#FF9F43' },
        { id: 4, title: 'Active Trips',      value: String(dash.active_trips),       trend: '', trendUp: true,  icon: 'map-pin',   color: '#6D4AFF' },
        { id: 5, title: 'Drivers On Trip',   value: String(dash.on_trip_drivers),    trend: '', trendUp: true,  icon: 'users',     color: '#4F8CFF' },
        { id: 6, title: 'Total Drivers',     value: String(dash.total_drivers),      trend: '', trendUp: true,  icon: 'users',     color: '#00D2A0' },
        { id: 7, title: 'Revenue (Month)',   value: `₹${Number(dash.revenue_this_month).toLocaleString()}`, trend: '', trendUp: true, icon: 'pie-chart', color: '#FF6B9D' },
    ] : [];

    const vehicleStatusData = dash ? [
        { label: 'Available', value: dash.available_vehicles, color: '#00D2A0' },
        { label: 'On Trip',   value: dash.on_trip_vehicles,   color: '#4F8CFF' },
        { label: 'In Shop',   value: dash.in_shop_vehicles,   color: '#FF9F43' },
        { label: 'Retired',   value: dash.total_vehicles - dash.available_vehicles - dash.on_trip_vehicles - dash.in_shop_vehicles, color: '#FF6B9D' },
    ] : [];

    const tripStatusPie = tripAnalytics ? tripAnalytics.breakdown.map(b => ({
        label: b.status.charAt(0) + b.status.slice(1).toLowerCase(),
        value: b.count,
        color: { COMPLETED: '#00D2A0', DISPATCHED: '#4F8CFF', DRAFT: '#888', CANCELLED: '#FF6B9D' }[b.status] || '#6D4AFF',
    })) : [];

    if (loading) return (
        <div className="dashboard-layout">
            <div className="dashboard-main">
                <Navbar onNavigate={onNavigate} />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#888' }}>
                    Loading dashboard…
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="dashboard-layout">
            <div className="dashboard-main">
                <Navbar onNavigate={onNavigate} />
                <div style={{ color: '#FF6B6B', padding: '40px', textAlign: 'center' }}>Error: {error}</div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <div className="dashboard-main">
                <Navbar onNavigate={onNavigate} />

                <div className="dashboard-content">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Dashboard</h1>
                        </div>
                    </div>

                    {/* KPI Cards Grid */}
                    <div className="kpi-grid">
                        {kpiData.map(card => (
                            <StatCard key={card.id} {...card} />
                        ))}
                    </div>

                    {/* Main content split */}
                    <div className="main-split">
                        <div className="split-left">
                            <RecentTripsTable trips={trips} />
                        </div>
                        <div className="split-right">
                            <VehicleStatusCard data={vehicleStatusData} />
                        </div>
                    </div>

                    {/* Charts Row */}
                    <ChartsSection tripStatusPie={tripStatusPie} dash={dash} />

                    {/* Activity Timeline */}
                    <div className="bottom-row">
                        <ActivityTimeline trips={trips} />
                    </div>
                </div>
            </div>
        </div>
    );
}
