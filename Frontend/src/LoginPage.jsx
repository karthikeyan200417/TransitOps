import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import './LoginPage.css';
import SoftAurora from './SoftAurora';
import RotatingText from './RotatingText';
import { AuthContext } from './context/AuthContext';

const ROLES = [
    { label: 'Admin',             email: 'admin@transitops.com',      password: 'admin123',      color: '#ef4444' },
    { label: 'Fleet Manager',     email: 'fleet@transitops.com',       password: 'fleet123',      color: '#f97316' },
    { label: 'Dispatcher',        email: 'dispatcher@transitops.com',  password: 'dispatcher123', color: '#a855f7' },
    { label: 'Safety Officer',    email: 'safety@transitops.com',      password: 'safety123',     color: '#22c55e' },
    { label: 'Financial Analyst', email: 'finance@transitops.com',     password: 'finance123',    color: '#3b82f6' },
];

export default function LoginPage({ onLogin }) {
    const { login, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState('');

    const pickRole = (role) => {
        setSelected(role.label);
        setEmail(role.email);
        setPassword(role.password);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            if (onLogin) onLogin();
        } catch (err) {
            setError(err.message || 'Invalid email or password.');
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

            <div className="bottom-right-quote">
                "Manage fleets with precision,<br />
                dispatch with confidence,<br />
                and keep every journey on track."
            </div>

            <div className="login-form-container">
                <h2 className="form-title">Sign in to your account</h2>
                <p className="form-subtitle">Select your role to continue</p>

                {/* Role selector */}
                <div className="role-grid">
                    {ROLES.map(role => (
                        <button
                            key={role.label}
                            type="button"
                            className={`role-card${selected === role.label ? ' role-card--active' : ''}`}
                            style={{ '--role-color': role.color }}
                            onClick={() => pickRole(role)}
                        >
                            <span className="role-dot" style={{ background: role.color }} />
                            {role.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(255,107,107,0.12)',
                        border: '1px solid #FF6B6B55',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#FF6B6B',
                        fontSize: '13px',
                        marginBottom: '12px'
                    }}>
                        {error}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>EMAIL</label>
                        <input
                            type="email"
                            placeholder="Select a role above…"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setSelected(null); }}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>PASSWORD</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setSelected(null); }}
                            required
                        />
                    </div>

                    <div className="button-group">
                        <button type="submit" className="submit-btn" disabled={loading || !email}>
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                        <button type="button" className="secondary-btn" onClick={() => navigate('/signup')}>
                            Create Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
