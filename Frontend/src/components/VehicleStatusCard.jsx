import React from 'react';
import './VehicleStatusCard.css';

export default function VehicleStatusCard({ data = [] }) {
    const total = data.reduce((s, v) => s + (v.value || 0), 0);

    return (
        <div className="card">
            <h3 className="card-title">Vehicle Status</h3>
            <div className="vs-list">
                {data.length === 0 ? (
                    <div style={{ color: '#666', padding: '16px', fontSize: '13px' }}>No vehicle data.</div>
                ) : data.map(item => (
                    <div key={item.label} className="vs-row">
                        <span className="vs-label">{item.label}</span>
                        <div className="vs-bar-track">
                            <div
                                className="vs-bar-fill"
                                style={{
                                    width: total > 0 ? `${(item.value / total) * 100}%` : '0%',
                                    background: item.color,
                                    boxShadow: `0 0 8px ${item.color}88`
                                }}
                            />
                        </div>
                        <span className="vs-count" style={{ color: item.color }}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
