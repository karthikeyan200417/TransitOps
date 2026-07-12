import React, { useState, useContext } from 'react';
import {
    MdPerson, MdLock, MdInfo, MdSave, MdVisibility, MdVisibilityOff, MdLogout
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const ROLE_COLORS = {
    ADMIN:            '#FF6B9D',
    FLEET_MANAGER:    '#6D4AFF',
    DISPATCHER:       '#4F8CFF',
    SAFETY_OFFICER:   '#FF9F43',
    FINANCIAL_ANALYST:'#00D2A0',
};

const ROLE_PERMISSIONS = {
    ADMIN:             ['Dashboard', 'Fleet', 'Drivers', 'Trips', 'Maintenance', 'Fuel & Expenses', 'Analytics', 'Settings'],
    FLEET_MANAGER:     ['Dashboard', 'Fleet', 'Drivers', 'Trips', 'Maintenance', 'Fuel & Expenses', 'Analytics', 'Settings'],
    DISPATCHER:        ['Dashboard', 'Fleet', 'Drivers', 'Trips', 'Maintenance', 'Fuel & Expenses', 'Settings'],
    SAFETY_OFFICER:    ['Dashboard', 'Fleet', 'Drivers', 'Trips', 'Maintenance', 'Analytics', 'Settings'],
    FINANCIAL_ANALYST: ['Dashboard', 'Trips', 'Fuel & Expenses', 'Analytics', 'Settings'],
};

function Section({ title, icon, children }) {
    return (
        <div style={{
            background: '#15151D', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: 24, marginBottom: 20,
        }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                {icon} {title}
            </h3>
            {children}
        </div>
    );
}

function Field({ label, value, editable, type = 'text', onChange }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                {label}
            </label>
            {editable ? (
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, padding: '10px 14px', color: '#e0e0e0', fontSize: 14,
                        outline: 'none', boxSizing: 'border-box',
                    }}
                />
            ) : (
                <div style={{
                    padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8,
                    color: '#888', fontSize: 14,
                }}>
                    {value}
                </div>
            )}
        </div>
    );
}

export default function SettingsPage({ onNavigate }) {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [pwForm, setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
    const [showPw, setShowPw]   = useState({ current: false, newPw: false, confirm: false });
    const [pwMsg, setPwMsg]     = useState(null);
    const [saving, setSaving]   = useState(false);

    const roleColor = ROLE_COLORS[user?.role] || '#6D4AFF';
    const permissions = ROLE_PERMISSIONS[user?.role] || [];

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
            setPwMsg({ type: 'error', text: 'All fields are required.' }); return;
        }
        if (pwForm.newPw !== pwForm.confirm) {
            setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return;
        }
        if (pwForm.newPw.length < 6) {
            setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return;
        }
        // Backend doesn't have a change-password endpoint yet — show info
        setPwMsg({ type: 'info', text: 'Password change endpoint not yet available on the backend.' });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleShow = (field) => setShowPw(p => ({ ...p, [field]: !p[field] }));

    const inputStyle = {
        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '10px 14px', color: '#e0e0e0', fontSize: 14,
        outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div style={{ background: 'transparent', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' }}>
            <Navbar onNavigate={onNavigate} />
            <div style={{ padding: '28px 36px 60px', maxWidth: 860, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0 }}>Settings</h1>
                    <p style={{ fontSize: 13, color: '#555', margin: '5px 0 0' }}>Manage your account, profile and preferences.</p>
                </div>

                {/* Profile Info */}
                <Section title="Profile Information" icon={<MdPerson />}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                        <Field label="Full Name"  value={user?.name  || '—'} editable={false} />
                        <Field label="Email"      value={user?.email || '—'} editable={false} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${roleColor}44, ${roleColor}22)`,
                            border: `2px solid ${roleColor}55`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, fontWeight: 700, color: roleColor,
                        }}>
                            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{user?.name}</div>
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                                background: `${roleColor}22`, color: roleColor, border: `1px solid ${roleColor}44`,
                            }}>
                                {user?.roleDisplay || user?.role}
                            </span>
                        </div>
                    </div>
                </Section>

                {/* Role & Permissions */}
                <Section title="Role & Access Permissions" icon={<MdInfo />}>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>
                            Your Role
                        </div>
                        <span style={{
                            fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
                            background: `${roleColor}22`, color: roleColor, border: `1px solid ${roleColor}44`,
                        }}>
                            {user?.role}
                        </span>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>
                            Pages You Can Access
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {permissions.map(p => (
                                <span key={p} style={{
                                    fontSize: 12, padding: '4px 12px', borderRadius: 6,
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#aaa',
                                }}>
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* Change Password */}
                <Section title="Change Password" icon={<MdLock />}>
                    <form onSubmit={handleChangePassword}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>
                            {[
                                { key: 'current', label: 'Current Password' },
                                { key: 'newPw',   label: 'New Password' },
                                { key: 'confirm', label: 'Confirm New Password' },
                            ].map(({ key, label }) => (
                                <div key={key} style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                                        {label}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPw[key] ? 'text' : 'password'}
                                            value={pwForm[key]}
                                            onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                                            style={{ ...inputStyle, paddingRight: 40 }}
                                        />
                                        <button type="button" onClick={() => toggleShow(key)} style={{
                                            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 0,
                                        }}>
                                            {showPw[key] ? <MdVisibilityOff /> : <MdVisibility />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {pwMsg && (
                            <div style={{
                                padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
                                background: pwMsg.type === 'error' ? 'rgba(255,107,107,0.1)' : pwMsg.type === 'success' ? 'rgba(0,210,160,0.1)' : 'rgba(79,140,255,0.1)',
                                border: `1px solid ${pwMsg.type === 'error' ? '#FF6B6B44' : pwMsg.type === 'success' ? '#00D2A044' : '#4F8CFF44'}`,
                                color: pwMsg.type === 'error' ? '#FF6B6B' : pwMsg.type === 'success' ? '#00D2A0' : '#4F8CFF',
                            }}>
                                {pwMsg.text}
                            </div>
                        )}

                        <button type="submit" disabled={saving} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: '#6D4AFF', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', opacity: saving ? 0.6 : 1,
                        }}>
                            <MdSave /> {saving ? 'Saving…' : 'Update Password'}
                        </button>
                    </form>
                </Section>

                {/* Account Actions */}
                <Section title="Account" icon={<MdLogout />}>
                    <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                        Sign out of your current session. Your token will be invalidated.
                    </p>
                    <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(255,107,107,0.1)', color: '#FF6B6B',
                        border: '1px solid rgba(255,107,107,0.25)',
                        borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>
                        <MdLogout /> Sign Out
                    </button>
                </Section>

            </div>
        </div>
    );
}
