import React from 'react';
import { vehicleStatus } from '../data/dashboardData';
import './VehicleStatusCard.css';

export default function VehicleStatusCard() {
    const total = vehicleStatus.reduce((s, v) => s + v.value, 0);

    return (
        <div className="card">
            <h3 className="card-title">Vehicle Status</h3>
            <div className="vs-list">
                {vehicleStatus.map(item => (
                    <div key={item.label} className="vs-row">
                        <span className="vs-label">{item.label}</span>
                        <div className="vs-bar-track">
                            <div
                                className="vs-bar-fill"
                                style={{
                                    width: `${(item.value / total) * 100}%`,
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
