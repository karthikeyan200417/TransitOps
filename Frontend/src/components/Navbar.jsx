import React, { useState } from 'react';
import { MdSearch, MdNotifications } from 'react-icons/md';
import StaggeredMenu from './StaggeredMenu';
import './Navbar.css';

const navItems = [
    { label: 'Dashboard', ariaLabel: 'Go to Dashboard', link: '#dashboard' },
    { label: 'Fleet', ariaLabel: 'Go to Fleet', link: '#fleet' },
    { label: 'Drivers', ariaLabel: 'Go to Drivers', link: '#drivers' },
    { label: 'Trips', ariaLabel: 'Go to Trips', link: '#trips' },
    { label: 'Maintenance', ariaLabel: 'Go to Maintenance', link: '#maintenance' },
    { label: 'Fuel', ariaLabel: 'Go to Fuel & Expenses', link: '#fuel' },
    { label: 'Analytics', ariaLabel: 'Go to Analytics', link: '#analytics' },
    { label: 'Settings', ariaLabel: 'Go to Settings', link: '#settings' },
];

export default function Navbar({ onMenuToggle }) {
    const [notifCount] = useState(3);

    return (
        <header className="navbar">
            <div className="navbar-left">
                {/* StaggeredMenu replaces the old hamburger */}
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
                    />
                </div>
                <div className="search-bar">
                    <MdSearch className="search-icon" />
                    <input type="text" placeholder="Search vehicles, trips, drivers..." />
                </div>
            </div>

            <div className="navbar-right">
                <div className="notif-btn">
                    <MdNotifications />
                    {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
                </div>

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
