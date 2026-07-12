import React, { useState, useEffect, useContext } from 'react';
import {
    MdTrendingUp, MdDirectionsBus, MdLocalGasStation,
    MdBuild, MdAttachMoney, MdCheckCircle, MdTimer, MdRefresh
} from 'react-icons/md';
import { analyticsApi } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './ReportsPage.css';

/* ─── Donut Chart ─── */
function DonutChart({ data, centerLabel, centerValue }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    let accumulated = 0;
    const r = 85;
    const cx = 110, cy = 110;
    const circumference = 2 * Math.PI * r;

    return (
        <div className="donut-chart-wrap">
            <svg width="220" height="220" viewBox="0 0 220 220" className="donut-svg">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="20" />
                {data.map((d, i) => {
                    const pct = total > 0 ? d.value / total : 0;
                    const dash = pct * circumference;
                    const offset = -accumulated * circumference;
                    accumulated += pct;
                    return (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                            stroke={d.color} strokeWidth="20"
                            strokeDasharray={`${dash} 999`}
                            strokeDashoffset={offset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                            className="donut-segment"
                        />
                    );
                })}
                <circle cx={cx} cy={cy} r="70" fill="#15151D" />
                <text x={cx} y={cy - 8} textAnchor="middle" fill="#fff" fontSize="20" fontWeight="700">{centerValue}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="#555" fontSize="10" fontWeight="600" letterSpacing="0.5">{centerLabel}</text>
            </svg>
            <div className="donut-legend">
                {data.map((d, i) => (
                    <div className="legend-item" key={i}>
                        <span className="legend-bullet" style={{ background: d.color }} />
                        <span className="legend-lbl">{d.label}: {d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Bar Chart ─── */
function BarChart({ data, maxVal }) {
    const width = 500, height = 180, padding = 20;
    const max = maxVal || Math.max(...data.map(d => d.value), 1);
    return (
        <div className="bar-chart-container">
            <svg viewBox={`0 0 ${width} ${height}`} className="bar-svg">
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                    <line key={i} x1={padding} y1={padding + r * (height - padding * 2)}
                        x2={width - padding} y2={padding + r * (height - padding * 2)}
                        stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                {data.map((d, i) => {
                    const colW = Math.min(40, (width - padding * 2) / data.length - 8);
                    const x = padding + (i * (width - padding * 2)) / data.length + (width - padding * 2) / (data.length * 2) - colW / 2;
                    const barH = (d.value / max) * (height - padding * 2);
                    const y = height - padding - barH;
                    return (
                        <g key={i}>
                            <rect x={x} y={y} width={colW} height={barH} rx="5" fill={d.color} opacity="0.85" className="chart-bar" />
                            <text x={x + colW / 2} y={height - 3} textAnchor="middle" fill="#555" fontSize="9" fontWeight="600">{d.label}</text>
                            <text x={x + colW / 2} y={y - 6} textAnchor="middle" fill="#aaa" fontSize="9" fontWeight="700">{d.displayValue}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

/* ─── Horizontal Bar ─── */
function HorizontalBar({ label, value, max, color }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa', marginBottom: 4 }}>
                <span>{label}</span><span style={{ color }}>{value}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 6 }}>
                <div style={{ width: `${pct}%`, background: color, borderRadius: 4, height: '100%', transition: 'width 0.6s ease' }} />
            </div>
        </div>
    );
}

/* ─── Stat Card ─── */
function StatCard({ title, value, sub, color, icon }) {
    return (
        <div className="stat-box" style={{ '--accent-color': color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div className="stat-num">{value}</div>
                    <div className="stat-title">{title}</div>
                    {sub && <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{sub}</div>}
                </div>
                <div style={{ color, opacity: 0.6, fontSize: 24 }}>{icon}</div>
            </div>
        </div>
    );
}

const COLORS = ['#6D4AFF', '#4F8CFF', '#00D2A0', '#FF9F43', '#FF6B9D'];

// Tabs visible per role
const ROLE_TABS = {
    ADMIN:             ['overview', 'fleet', 'trips', 'fuel', 'expenses', 'maintenance'],
    FLEET_MANAGER:     ['overview', 'fleet', 'trips', 'fuel', 'expenses', 'maintenance'],
    SAFETY_OFFICER:    ['overview', 'fleet', 'trips', 'maintenance'],
    FINANCIAL_ANALYST: ['overview', 'trips', 'fuel', 'expenses'],
};

export default function ReportsPage({ onNavigate }) {
    const { user } = useContext(AuthContext);
    const allowedTabs = ROLE_TABS[user?.role] || ROLE_TABS.ADMIN;
    const [fleet, setFleet]       = useState(null);
    const [fuel, setFuel]         = useState(null);
    const [expenses, setExpenses] = useState(null);
    const [maint, setMaint]       = useState(null);
    const [trips, setTrips]       = useState(null);
    const [loading, setLoading]   = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const load = async () => {
        setLoading(true);
        try {
            const canFleet    = allowedTabs.includes('fleet');
            const canFuel     = allowedTabs.includes('fuel');
            const canExpenses = allowedTabs.includes('expenses');
            const canMaint    = allowedTabs.includes('maintenance');
            const [f, fu, ex, m, t] = await Promise.all([
                canFleet    ? analyticsApi.fleetUtilization().catch(() => null) : Promise.resolve(null),
                canFuel     ? analyticsApi.fuelEfficiency().catch(() => null)   : Promise.resolve(null),
                canExpenses ? analyticsApi.expenses().catch(() => null)         : Promise.resolve(null),
                canMaint    ? analyticsApi.maintenance().catch(() => null)      : Promise.resolve(null),
                analyticsApi.trips().catch(() => null),
            ]);
            setFleet(f); setFuel(fu); setExpenses(ex); setMaint(m); setTrips(t);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    // Keep activeTab valid when role changes
    useEffect(() => {
        if (!allowedTabs.includes(activeTab)) setActiveTab(allowedTabs[0]);
    }, [allowedTabs]);

    if (loading) return (
        <div className="reports-page">
            <Navbar onNavigate={onNavigate} />
            <div className="rep-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#555' }}>
                Loading analytics…
            </div>
        </div>
    );

    // ── Derived data ──────────────────────────────────────────────
    const fleetDonut = fleet ? [
        { label: 'Available', value: fleet.items.filter(v => v.status === 'AVAILABLE').length, color: '#00D2A0' },
        { label: 'On Trip',   value: fleet.items.filter(v => v.status === 'ON_TRIP').length,   color: '#4F8CFF' },
        { label: 'In Shop',   value: fleet.items.filter(v => v.status === 'IN_SHOP').length,   color: '#FF9F43' },
        { label: 'Retired',   value: fleet.items.filter(v => v.status === 'RETIRED').length,   color: '#FF6B9D' },
    ] : [];

    const tripDonut = trips ? trips.breakdown.map((b, i) => ({
        label: b.status.charAt(0) + b.status.slice(1).toLowerCase(),
        value: b.count,
        color: { COMPLETED: '#00D2A0', DISPATCHED: '#4F8CFF', DRAFT: '#888', CANCELLED: '#FF6B9D' }[b.status] || COLORS[i],
    })) : [];

    const expenseBar = expenses ? expenses.breakdown.map((b, i) => ({
        label: b.type,
        value: parseFloat(b.total_amount),
        displayValue: `₹${Math.round(parseFloat(b.total_amount) / 1000)}k`,
        color: COLORS[i % COLORS.length],
    })) : [];

    const topFuelVehicles = fuel ? [...fuel.items]
        .filter(v => parseFloat(v.total_liters) > 0)
        .sort((a, b) => parseFloat(b.total_fuel_cost) - parseFloat(a.total_fuel_cost))
        .slice(0, 8) : [];

    const maxFuelCost = topFuelVehicles.length > 0 ? parseFloat(topFuelVehicles[0].total_fuel_cost) : 1;

    const topMaintVehicles = maint ? [...maint.items]
        .filter(v => parseFloat(v.total_maintenance_cost) > 0)
        .sort((a, b) => parseFloat(b.total_maintenance_cost) - parseFloat(a.total_maintenance_cost))
        .slice(0, 8) : [];

    const maxMaintCost = topMaintVehicles.length > 0 ? parseFloat(topMaintVehicles[0].total_maintenance_cost) : 1;

    const topTripVehicles = fleet ? [...fleet.items]
        .sort((a, b) => b.total_trips - a.total_trips)
        .slice(0, 8) : [];

    const maxTrips = topTripVehicles.length > 0 ? topTripVehicles[0].total_trips : 1;

    return (
        <div className="reports-page">
            <Navbar onNavigate={onNavigate} />
            <div className="rep-container">

                {/* Header */}
                <div className="rep-header">
                    <div>
                        <h1 className="rep-title">Analytics & Reports</h1>
                        <p className="rep-sub">Live data from all fleet operations — fleet, trips, fuel, expenses and maintenance.</p>
                    </div>
                    <button className="btn-icon" title="Refresh" onClick={load}><MdRefresh /></button>
                </div>

                {/* Tabs */}
                <div className="tab-bar" style={{ marginBottom: 24 }}>
                    {allowedTabs.map(t => (
                        <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                    <>
                        <div className="rep-stats-grid">
                            <StatCard title="Total Vehicles"     value={fleet?.total_vehicles ?? '—'}                                          color="#6D4AFF" icon={<MdDirectionsBus />} />
                            <StatCard title="Fleet Utilization"  value={fleet ? `${fleet.utilization_rate_pct}%` : '—'}                        color="#00D2A0" icon={<MdTrendingUp />} />
                            <StatCard title="Total Trips"        value={trips?.total_trips ?? '—'}                                             color="#4F8CFF" icon={<MdTimer />} />
                            <StatCard title="Completion Rate"    value={trips ? `${trips.completion_rate_pct}%` : '—'}                         color="#00D2A0" icon={<MdCheckCircle />} />
                            <StatCard title="Total Revenue"      value={trips ? `₹${Number(trips.total_revenue).toLocaleString()}` : '—'}      color="#FF6B9D" icon={<MdAttachMoney />} />
                            <StatCard title="Total Expenses"     value={expenses ? `₹${Number(expenses.total_expenses).toLocaleString()}` : '—'} color="#FF9F43" icon={<MdAttachMoney />} />
                            <StatCard title="Fleet Avg km/L"     value={fuel ? `${fuel.fleet_avg_km_per_liter} km/L` : '—'}                    color="#4F8CFF" icon={<MdLocalGasStation />} />
                            <StatCard title="In Maintenance"     value={maint?.vehicles_in_maintenance ?? '—'}                                 color="#FF9F43" icon={<MdBuild />} />
                        </div>

                        <div className="rep-charts-grid">
                            <div className="chart-card">
                                <h3><MdDirectionsBus /> Fleet Status</h3>
                                <p className="chart-sub">Vehicle distribution by current status.</p>
                                {fleetDonut.length > 0
                                    ? <DonutChart data={fleetDonut} centerValue={`${fleet.utilization_rate_pct}%`} centerLabel="ON TRIP" />
                                    : <p style={{ color: '#555' }}>No data</p>}
                            </div>
                            <div className="chart-card">
                                <h3><MdTimer /> Trip Status Breakdown</h3>
                                <p className="chart-sub">Distribution of trips by current status.</p>
                                {tripDonut.length > 0
                                    ? <DonutChart data={tripDonut} centerValue={trips?.completion_rate_pct + '%'} centerLabel="COMPLETED" />
                                    : <p style={{ color: '#555' }}>No data</p>}
                            </div>
                            <div className="chart-card">
                                <h3><MdAttachMoney /> Expenses by Type</h3>
                                <p className="chart-sub">Total spending breakdown per expense category.</p>
                                {expenseBar.length > 0
                                    ? <BarChart data={expenseBar} />
                                    : <p style={{ color: '#555' }}>No data</p>}
                            </div>
                        </div>
                    </>
                )}

                {/* ── FLEET ── */}
                {activeTab === 'fleet' && fleet && (
                    <div className="chart-card">
                        <h3><MdDirectionsBus /> Fleet Utilization — All Vehicles</h3>
                        <p className="chart-sub">Trips completed and revenue generated per vehicle.</p>
                        <div style={{ overflowX: 'auto', marginTop: 12 }}>
                            <table className="rep-table-element">
                                <thead>
                                    <tr>
                                        <th>Reg #</th><th>Model</th><th>Status</th>
                                        <th>Total Trips</th><th>Distance (km)</th><th>Revenue (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fleet.items.map(v => (
                                        <tr key={v.vehicle_id} className="rep-row-tr">
                                            <td style={{ color: '#a78bff', fontWeight: 700 }}>{v.registration_number}</td>
                                            <td>{v.name_model}</td>
                                            <td><span style={{ color: { AVAILABLE: '#00D2A0', ON_TRIP: '#4F8CFF', IN_SHOP: '#FF9F43', RETIRED: '#FF6B9D' }[v.status] || '#888', fontSize: 12, fontWeight: 600 }}>{v.status}</span></td>
                                            <td>{v.total_trips}</td>
                                            <td>{Number(v.total_distance_km).toLocaleString()}</td>
                                            <td>₹{Number(v.total_revenue).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── TRIPS ── */}
                {activeTab === 'trips' && trips && (
                    <>
                        <div className="rep-stats-grid">
                            <StatCard title="Total Trips"     value={trips.total_trips}                                          color="#4F8CFF" icon={<MdTimer />} />
                            <StatCard title="Completion Rate" value={`${trips.completion_rate_pct}%`}                            color="#00D2A0" icon={<MdCheckCircle />} />
                            <StatCard title="Total Revenue"   value={`₹${Number(trips.total_revenue).toLocaleString()}`}         color="#FF6B9D" icon={<MdAttachMoney />} />
                        </div>
                        <div className="rep-charts-grid">
                            <div className="chart-card">
                                <h3><MdTimer /> Trip Status Distribution</h3>
                                <p className="chart-sub">Count of trips per status.</p>
                                <DonutChart data={tripDonut} centerValue={`${trips.completion_rate_pct}%`} centerLabel="COMPLETED" />
                            </div>
                            <div className="chart-card">
                                <h3><MdAttachMoney /> Revenue by Status</h3>
                                <p className="chart-sub">Revenue generated per trip status.</p>
                                <BarChart data={trips.breakdown.map((b, i) => ({
                                    label: b.status.slice(0, 4),
                                    value: parseFloat(b.total_revenue),
                                    displayValue: `₹${Math.round(parseFloat(b.total_revenue) / 1000)}k`,
                                    color: COLORS[i % COLORS.length],
                                }))} />
                            </div>
                        </div>
                        <div className="chart-card" style={{ marginTop: 0 }}>
                            <h3>Trip Breakdown Detail</h3>
                            <div style={{ overflowX: 'auto', marginTop: 12 }}>
                                <table className="rep-table-element">
                                    <thead><tr><th>Status</th><th>Count</th><th>Revenue (₹)</th><th>Distance (km)</th></tr></thead>
                                    <tbody>
                                        {trips.breakdown.map(b => (
                                            <tr key={b.status} className="rep-row-tr">
                                                <td style={{ fontWeight: 600, color: { COMPLETED: '#00D2A0', DISPATCHED: '#4F8CFF', DRAFT: '#888', CANCELLED: '#FF6B9D' }[b.status] || '#aaa' }}>{b.status}</td>
                                                <td>{b.count}</td>
                                                <td>₹{Number(b.total_revenue).toLocaleString()}</td>
                                                <td>{Number(b.total_distance_km).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ── FUEL ── */}
                {activeTab === 'fuel' && fuel && (
                    <>
                        <div className="rep-stats-grid">
                            <StatCard title="Fleet Avg km/L" value={`${fuel.fleet_avg_km_per_liter} km/L`} color="#4F8CFF" icon={<MdLocalGasStation />} />
                        </div>
                        <div className="rep-leaderboard-grid">
                            <div className="leader-card">
                                <h3><MdLocalGasStation /> Top Fuel Cost — Vehicles</h3>
                                <p className="chart-sub">Vehicles with highest fuel expenditure.</p>
                                <div className="leader-list" style={{ marginTop: 16 }}>
                                    {topFuelVehicles.map(v => (
                                        <HorizontalBar key={v.vehicle_id}
                                            label={`${v.registration_number} (${v.name_model})`}
                                            value={`₹${Number(v.total_fuel_cost).toLocaleString()}`}
                                            max={maxFuelCost}
                                            color="#4F8CFF"
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="leader-card">
                                <h3><MdTrendingUp /> Fuel Efficiency — km/L</h3>
                                <p className="chart-sub">Best performing vehicles by km per litre.</p>
                                <div className="leader-list" style={{ marginTop: 16 }}>
                                    {[...fuel.items].filter(v => parseFloat(v.km_per_liter) > 0)
                                        .sort((a, b) => parseFloat(b.km_per_liter) - parseFloat(a.km_per_liter))
                                        .slice(0, 8)
                                        .map(v => (
                                            <HorizontalBar key={v.vehicle_id}
                                                label={`${v.registration_number} (${v.name_model})`}
                                                value={`${v.km_per_liter} km/L`}
                                                max={Math.max(...fuel.items.map(x => parseFloat(x.km_per_liter)))}
                                                color="#00D2A0"
                                            />
                                        ))}
                                </div>
                            </div>
                        </div>
                        <div className="chart-card">
                            <h3>Full Fuel Efficiency Table</h3>
                            <div style={{ overflowX: 'auto', marginTop: 12 }}>
                                <table className="rep-table-element">
                                    <thead><tr><th>Reg #</th><th>Model</th><th>Liters</th><th>Fuel Cost (₹)</th><th>Distance (km)</th><th>km/L</th></tr></thead>
                                    <tbody>
                                        {[...fuel.items].sort((a, b) => parseFloat(b.km_per_liter) - parseFloat(a.km_per_liter)).map(v => (
                                            <tr key={v.vehicle_id} className="rep-row-tr">
                                                <td style={{ color: '#a78bff', fontWeight: 700 }}>{v.registration_number}</td>
                                                <td>{v.name_model}</td>
                                                <td>{Number(v.total_liters).toLocaleString()}</td>
                                                <td>₹{Number(v.total_fuel_cost).toLocaleString()}</td>
                                                <td>{Number(v.total_distance_km).toLocaleString()}</td>
                                                <td style={{ color: parseFloat(v.km_per_liter) > parseFloat(fuel.fleet_avg_km_per_liter) ? '#00D2A0' : '#FF9F43', fontWeight: 700 }}>{v.km_per_liter}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ── EXPENSES ── */}
                {activeTab === 'expenses' && expenses && (
                    <>
                        <div className="rep-stats-grid">
                            <StatCard title="Total Expenses" value={`₹${Number(expenses.total_expenses).toLocaleString()}`} color="#FF9F43" icon={<MdAttachMoney />} />
                            {expenses.breakdown.map((b, i) => (
                                <StatCard key={b.type} title={b.type} value={`₹${Number(b.total_amount).toLocaleString()}`} sub={`${b.count} records`} color={COLORS[i % COLORS.length]} icon={<MdAttachMoney />} />
                            ))}
                        </div>
                        <div className="chart-card">
                            <h3><MdAttachMoney /> Expenses by Category</h3>
                            <p className="chart-sub">Total amount and count per expense type.</p>
                            <BarChart data={expenseBar} />
                            <div style={{ overflowX: 'auto', marginTop: 20 }}>
                                <table className="rep-table-element">
                                    <thead><tr><th>Type</th><th>Count</th><th>Total Amount (₹)</th></tr></thead>
                                    <tbody>
                                        {expenses.breakdown.map((b, i) => (
                                            <tr key={b.type} className="rep-row-tr">
                                                <td style={{ color: COLORS[i % COLORS.length], fontWeight: 700 }}>{b.type}</td>
                                                <td>{b.count}</td>
                                                <td>₹{Number(b.total_amount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ── MAINTENANCE ── */}
                {activeTab === 'maintenance' && maint && (
                    <>
                        <div className="rep-stats-grid">
                            <StatCard title="Total Maint. Cost"   value={`₹${Number(maint.total_maintenance_cost).toLocaleString()}`} color="#FF9F43" icon={<MdBuild />} />
                            <StatCard title="Vehicles in Maint."  value={maint.vehicles_in_maintenance}                               color="#FF6B9D" icon={<MdBuild />} />
                        </div>
                        <div className="rep-leaderboard-grid">
                            <div className="leader-card">
                                <h3><MdBuild /> Highest Maintenance Cost</h3>
                                <p className="chart-sub">Vehicles with most maintenance spending.</p>
                                <div className="leader-list" style={{ marginTop: 16 }}>
                                    {topMaintVehicles.map(v => (
                                        <HorizontalBar key={v.vehicle_id}
                                            label={`${v.registration_number} (${v.name_model})`}
                                            value={`₹${Number(v.total_maintenance_cost).toLocaleString()}`}
                                            max={maxMaintCost}
                                            color="#FF9F43"
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="leader-card">
                                <h3><MdDirectionsBus /> Most Trips Completed</h3>
                                <p className="chart-sub">Vehicles ranked by completed trips.</p>
                                <div className="leader-list" style={{ marginTop: 16 }}>
                                    {topTripVehicles.map(v => (
                                        <HorizontalBar key={v.vehicle_id}
                                            label={`${v.registration_number} (${v.name_model})`}
                                            value={`${v.total_trips} trips`}
                                            max={maxTrips}
                                            color="#6D4AFF"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="chart-card">
                            <h3>Full Maintenance Table</h3>
                            <div style={{ overflowX: 'auto', marginTop: 12 }}>
                                <table className="rep-table-element">
                                    <thead><tr><th>Reg #</th><th>Model</th><th>Total Cost (₹)</th><th>Active</th><th>Completed</th></tr></thead>
                                    <tbody>
                                        {[...maint.items].sort((a, b) => parseFloat(b.total_maintenance_cost) - parseFloat(a.total_maintenance_cost)).map(v => (
                                            <tr key={v.vehicle_id} className="rep-row-tr">
                                                <td style={{ color: '#a78bff', fontWeight: 700 }}>{v.registration_number}</td>
                                                <td>{v.name_model}</td>
                                                <td>₹{Number(v.total_maintenance_cost).toLocaleString()}</td>
                                                <td style={{ color: v.active_maintenance_count > 0 ? '#FF9F43' : '#555' }}>{v.active_maintenance_count}</td>
                                                <td style={{ color: '#00D2A0' }}>{v.completed_maintenance_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
