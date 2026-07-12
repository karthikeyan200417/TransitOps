import React, { useState } from 'react';
import {
    MdDashboard, MdDirectionsBus, MdPeople, MdMap,
    MdBuild, MdLocalGasStation, MdBarChart, MdSettings,
    MdChevronLeft, MdChevronRight, MdMenu
} from 'react-icons/md';
import './Sidebar.css';

const navItems = [
    { icon: MdDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: MdDirectionsBus, label: 'Fleet', id: 'fleet' },
    { icon: MdPeople, label: 'Drivers', id: 'drivers' },
    { icon: MdMap, label: 'Trips', id: 'trips' },
    { icon: MdBuild, label: 'Maintenance', id: 'maintenance' },
    { icon: MdLocalGasStation, label: 'Fuel & Expenses', id: 'fuel' },
    { icon: MdBarChart, label: 'Analytics', id: 'analytics' },
    { icon: MdSettings, label: 'Settings', id: 'settings' },
];

export default function Sidebar({ collapsed, setCollapsed, activeItem, setActiveItem }) {
    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <span className="logo-icon">T</span>
                    {!collapsed && <span className="logo-text">TransitOps</span>}
                </div>
                <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(({ icon: Icon, label, id }) => (
                    <button
                        key={id}
                        className={`nav-item ${activeItem === id ? 'active' : ''}`}
                        onClick={() => setActiveItem(id)}
                    >
                        <Icon className="nav-icon" />
                        {!collapsed && <span className="nav-label">{label}</span>}
                        {collapsed && <span className="nav-tooltip">{label}</span>}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                {!collapsed && <p className="version-text">v1.0.0 — TransitOps</p>}
            </div>
        </aside>
    );
}
