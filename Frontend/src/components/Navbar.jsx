import React, { useState, useContext } from 'react';
import { MdSearch } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import StaggeredMenu from './StaggeredMenu';
import './Navbar.css';
import { AuthContext } from '../context/AuthContext';
import { rolePermissions } from '../config/permissions';

// Nav items with page keys for routing
const allNavItems = [
    { label: 'Dashboard', ariaLabel: 'Go to Dashboard', link: '#', key: 'dashboard' },
    { label: 'Fleet', ariaLabel: 'Go to Fleet', link: '#', key: 'fleet' },
    { label: 'Drivers', ariaLabel: 'Go to Drivers', link: '#', key: 'drivers' },
    { label: 'Trips', ariaLabel: 'Go to Trips', link: '#', key: 'trips' },
    { label: 'Maintenance', ariaLabel: 'Go to Maintenance', link: '#', key: 'maintenance' },
    { label: 'Fuel', ariaLabel: 'Go to Fuel & Expenses', link: '#', key: 'fuel' },
    { label: 'Analytics', ariaLabel: 'Go to Analytics', link: '#', key: 'analytics' },
    { label: 'Settings', ariaLabel: 'Go to Settings', link: '#', key: 'settings' },
];

export default function Navbar({ onNavigate }) {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    const currentRole = user ? user.role : 'Dispatcher';
    const currentName = user ? user.name : 'Raven K.';
    const permissions = rolePermissions[currentRole] || [];

    // Filter which nav items are allowed. Keep settings open or based on role:
    const filteredNavItems = allNavItems.filter(item => {
        if (item.key === 'settings') return true; // Settings is general
        return permissions.includes(item.key.toLowerCase());
    });

    // Make avatar initials
    const initials = currentName
        .split(' ')
        .map(n => n.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handleLogout = (e) => {
        e.stopPropagation();
        logout();
        navigate('/login');
    };

    return (
        <header className="navbar">
            <div className="navbar-left">
                <div className="staggered-nav-wrap">
                    <StaggeredMenu
                        position="left"
                        items={filteredNavItems}
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
                <div className="user-section" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                    <div className="user-info">
                        <span className="user-name">{currentName}</span>
                        <span className="user-role">{currentRole}</span>
                    </div>
                    <div className="avatar">{initials}</div>

                    {profileDropdownOpen && (
                        <div className="profile-dropdown">
                            <button className="dropdown-item logout-btn" onClick={handleLogout}>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
