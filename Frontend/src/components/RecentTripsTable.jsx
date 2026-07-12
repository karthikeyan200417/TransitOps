import React from 'react';
import { recentTrips } from '../data/dashboardData';
import './RecentTripsTable.css';

const statusConfig = {
    'Draft': { color: '#888', bg: 'rgba(136,136,136,0.12)' },
    'Dispatched': { color: '#4F8CFF', bg: 'rgba(79,140,255,0.12)' },
    'On Trip': { color: '#a78bff', bg: 'rgba(109,74,255,0.18)' },
    'Completed': { color: '#00D2A0', bg: 'rgba(0,210,160,0.12)' },
    'Cancelled': { color: '#FF6B9D', bg: 'rgba(255,107,157,0.12)' },
};

export default function RecentTripsTable() {
    return (
        <div className="card">
            <h3 className="card-title">Recent Trips</h3>
            <div className="table-wrapper">
                <table className="trips-table">
                    <thead>
                        <tr>
                            <th>Trip ID</th>
                            <th>Vehicle</th>
                            <th>Driver</th>
                            <th>Status</th>
                            <th>ETA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentTrips.map(trip => {
                            const s = statusConfig[trip.status] || statusConfig['Draft'];
                            return (
                                <tr key={trip.id} className="trip-row">
                                    <td className="trip-id">{trip.id}</td>
                                    <td>{trip.vehicle}</td>
                                    <td>{trip.driver}</td>
                                    <td>
                                        <span className="status-pill" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}44` }}>
                                            {trip.status}
                                        </span>
                                    </td>
                                    <td className="eta">{trip.eta}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
