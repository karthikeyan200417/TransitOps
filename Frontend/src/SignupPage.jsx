import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import './LoginPage.css';
import SoftAurora from './SoftAurora';
import RotatingText from './RotatingText';
import { authApi } from './services/api';

const ROLES = [
    { value: 'ADMIN',             label: 'Admin',             color: '#ef4444' },
    { value: 'FLEET_MANAGER',     label: 'Fleet Manager',     color: '#f97316' },
    { value: 'DISPATCHER',        label: 'Dispatcher',        color: '#a855f7' },
    { value: 'SAFETY_OFFICER',    label: 'Safety Officer',    color: '#22c55e' },
    { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst', color: '#3b82f6' },
];

export default function SignupPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ full_name: '', email: '', password: '', role: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.role) { setError('Please select a role.'); return; }
        setError('');
        setLoading(true);
        try {
            await authApi.register(form);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <SoftAurora
                speed={0.6} scale={1.5} brightness={1}
                color1="#f7f7f7" color2="#e100ff"
                noiseFrequency={2.5} noiseAmplitude={1}
                bandHeight={0.5} bandSpread={1} octaveDecay={0.1}
                layerOffset={0} colorSpeed={1}
                enableMouseInteraction mouseInfluence={0.25}
            />

            <motion.div layout className="top-left-quote">
                <motion.span layout>Every</motion.span>
                <RotatingText
                    texts={['Mile.', 'Vehicle.', 'Decision.']}
                    mainClassName="rotating-main purple-box"
                    staggerFrom="last"
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="rotating-split"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={3000} splitBy="characters"
                    animatePresenceMode="popLayout" auto loop
                />
            </motion.div>

            <div className="login-form-container">
                <h2 className="form-title">Create your account</h2>
                <p className="form-subtitle">Join TransitOps with your role</p>

                {success && (
                    <div style={{
                        background: 'rgba(34,197,94,0.12)', border: '1px solid #22c55e55',
                        borderRadius: '8px', padding: '10px 14px',
                        color: '#22c55e', fontSize: '13px', marginBottom: '12px'
                    }}>
                        Account created! Redirecting to sign in…
                    </div>
                )}

                {error && (
                    <div style={{
                        background: 'rgba(255,107,107,0.12)', border: '1px solid #FF6B6B55',
                        borderRadius: '8px', padding: '10px 14px',
                        color: '#FF6B6B', fontSize: '13px', marginBottom: '12px'
                    }}>
                        {error}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>FULL NAME</label>
                        <input
                            type="text" placeholder="Jane Smith"
                            value={form.full_name} onChange={set('full_name')} required
                        />
                    </div>

                    <div className="input-group">
                        <label>EMAIL</label>
                        <input
                            type="email" placeholder="jane@transitops.com"
                            value={form.email} onChange={set('email')} required
                        />
                    </div>

                    <div className="input-group">
                        <label>PASSWORD</label>
                        <input
                            type="password" placeholder="••••••••"
                            value={form.password} onChange={set('password')} required minLength={6}
                        />
                    </div>

                    <div className="input-group">
                        <label>ROLE</label>
                        <select value={form.role} onChange={set('role')} required>
                            <option value="">Select a role…</option>
                            {ROLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="button-group">
                        <button type="submit" className="submit-btn" disabled={loading || success}>
                            {loading ? 'Creating account…' : 'Create Account'}
                        </button>
                        <button type="button" className="secondary-btn" onClick={() => navigate('/login')}>
                            Sign In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
