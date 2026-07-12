import React, { useState } from 'react';
import { MdSearch } from 'react-icons/md';
import StaggeredMenu from './StaggeredMenu';
import './Navbar.css';

// Nav items with page keys for routing
const navItems = [
    { label: 'Dashboard', ariaLabel: 'Go to Dashboard', link: '#', 'data-page': 'dashboard' },
    { label: 'Fleet', ariaLabel: 'Go to Fleet', link: '#', 'data-page': 'fleet' },
    { label: 'Drivers', ariaLabel: 'Go to Drivers', link: '#' },
    { label: 'Trips', ariaLabel: 'Go to Trips', link: '#' },
    { label: 'Maintenance', ariaLabel: 'Go to Maintenance', link: '#' },
    { label: 'Fuel', ariaLabel: 'Go to Fuel & Expenses', link: '#' },
    { label: 'Analytics', ariaLabel: 'Go to Analytics', link: '#' },
    { label: 'Settings', ariaLabel: 'Go to Settings', link: '#' },
];

export default function Navbar({ onNavigate }) {
    return (
        <header className="navbar">
            <div className="navbar-left">
                <div className="staggered-nav-wrap">
                    <StaggeredMenu
                        position="left"
                        items={navItems}
                        displaySocials={false}
                        displayItemNumbering={true}
                        menuButtonColor="#aaa"
                        openMenuButtonColor="#a78bff"
                        changeMenuColorOnOpen={true}
                        colors={['#1a0f2e', '#6D4AFF']}
                        accentColor="#6D4AFF"
                        isFixed={true}
                        onNavigate={onNavigate}
                    />
                </div>
                <div className="search-bar">
                    <MdSearch className="search-icon" />
                    <input type="text" placeholder="Search vehicles, trips, drivers..." />
                </div>
            </div>

            <div className="navbar-right">
                <div className="user-section">
                    <div className="user-info">
                        <span className="user-name">Raven K.</span>
                        <span className="user-role">Dispatcher</span>
                    </div>
                    <div className="avatar">RK</div>
                </div>
            </div>
        </header>
    );
}
