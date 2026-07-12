import React from 'react';
import Navbar from '../components/Navbar';
import FilterBar from '../components/FilterBar';
import StatCard from '../components/StatCard';
import RecentTripsTable from '../components/RecentTripsTable';
import VehicleStatusCard from '../components/VehicleStatusCard';
import ChartsSection from '../components/ChartsSection';
import ActivityTimeline from '../components/ActivityTimeline';
import { kpiData } from '../data/dashboardData';
import './Dashboard.css';

export default function Dashboard() {
    return (
        <div className="dashboard-layout">
            <div className="dashboard-main">
                <Navbar />

                <div className="dashboard-content">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Dashboard</h1>
                            <p className="page-subtitle">Welcome back, Raven. Here's your fleet at a glance.</p>
                        </div>
                    </div>

                    <FilterBar />

                    {/* KPI Cards Grid */}
                    <div className="kpi-grid">
                        {kpiData.map(card => (
                            <StatCard key={card.id} {...card} />
                        ))}
                    </div>

                    {/* Main content split */}
                    <div className="main-split">
                        <div className="split-left">
                            <RecentTripsTable />
                        </div>
                        <div className="split-right">
                            <VehicleStatusCard />
                        </div>
                    </div>

                    {/* Charts Row */}
                    <ChartsSection />

                    {/* Activity Timeline */}
                    <div className="bottom-row">
                        <ActivityTimeline />
                    </div>
                </div>
            </div>
        </div>
    );
}
