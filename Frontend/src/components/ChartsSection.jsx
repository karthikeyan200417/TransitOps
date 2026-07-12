import React from 'react';
import './ChartsSection.css';

// Simple SVG bar chart for fuel consumption
function FuelBarChart({ data = [] }) {
    if (!data || data.length === 0) return (
        <div className="chart-card">
            <h4 className="chart-title">Fuel Consumption (L)</h4>
            <div style={{ color: '#666', padding: '30px', textAlign: 'center', fontSize: '13px' }}>No fuel data yet.</div>
        </div>
    );
    const max = Math.max(...data.map(d => d.liters || d.litres || 0), 1);
    const h = 100;
    return (
        <div className="chart-card">
            <h4 className="chart-title">Fuel Consumption (L)</h4>
            <div className="bar-chart">
                {data.map((d, i) => (
                    <div key={i} className="bar-col">
                        <div className="bar-wrap">
                            <div
                                className="bar-fill"
                                style={{ height: `${((d.liters || d.litres || 0) / max) * h}%` }}
                            />
                        </div>
                        <span className="bar-label">{d.month}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Simple SVG donut chart for trip status
function TripStatusDonut({ data = [] }) {
    const total = data.reduce((s, d) => s + (d.value || 0), 0);
    const r = 40;
    const cx = 60, cy = 60;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    const slices = data.map(d => {
        const dash = total > 0 ? (d.value / total) * circumference : 0;
        const gap = circumference - dash;
        const slice = { ...d, dash, gap, offset };
        offset += dash;
        return slice;
    });

    return (
        <div className="chart-card">
            <h4 className="chart-title">Trip Status</h4>
            <div className="donut-wrap">
                <svg width="120" height="120" viewBox="0 0 120 120">
                    {slices.map((s, i) => (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={s.color}
                            strokeWidth="16"
                            strokeDasharray={`${s.dash} ${s.gap}`}
                            strokeDashoffset={-s.offset + circumference * 0.25}
                            style={{ transition: 'all 0.6s ease' }}
                        />
                    ))}
                    <circle cx={cx} cy={cy} r={28} fill="#0b0b0f" />
                    <text x={cx} y={cy + 5} textAnchor="middle" fill="#fff" fontSize="14" fontFamily="Inter" fontWeight="700">{total}</text>
                </svg>
                <div className="donut-legend">
                    {data.map(d => (
                        <div key={d.label} className="legend-item">
                            <span className="legend-dot" style={{ background: d.color }} />
                            <span className="legend-label">{d.label}</span>
                            <span className="legend-val">{d.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Fleet utilization simple gauge
function FleetUtilGauge({ dash }) {
    const pct = dash ? Math.round((dash.available_vehicles / dash.total_vehicles) * 100) : 0;

    return (
        <div className="chart-card">
            <h4 className="chart-title">Fleet Utilization</h4>
            <div className="gauge-wrap">
                <svg width="140" height="80" viewBox="0 0 140 80">
                    <path
                        d="M 10 75 A 60 60 0 0 1 130 75"
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="14"
                        strokeLinecap="round"
                    />
                    <path
                        d="M 10 75 A 60 60 0 0 1 130 75"
                        fill="none"
                        stroke="url(#gaugeGrad)"
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={`${(pct / 100) * 188} 188`}
                    />
                    <defs>
                        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4F8CFF" />
                            <stop offset="100%" stopColor="#6D4AFF" />
                        </linearGradient>
                    </defs>
                    <text x="70" y="68" textAnchor="middle" fill="#fff" fontSize="20" fontFamily="Inter" fontWeight="700">{pct}%</text>
                </svg>
                <p className="gauge-sub">available vehicles in fleet</p>
            </div>
        </div>
    );
}

export default function ChartsSection({ tripStatusPie = [], dash = null, fuelData = [] }) {
    return (
        <div className="charts-section">
            <FleetUtilGauge dash={dash} />
            <TripStatusDonut data={tripStatusPie} />
            <FuelBarChart data={fuelData} />
        </div>
    );
}
