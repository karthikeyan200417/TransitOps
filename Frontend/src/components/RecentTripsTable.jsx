import React from 'react';
import './RecentTripsTable.css';

const statusConfig = {
    'Draft':      { color: '#888',     bg: 'rgba(136,136,136,0.12)' },
    'Dispatched': { color: '#4F8CFF',  bg: 'rgba(79,140,255,0.12)' },
    'On Trip':    { color: '#a78bff',  bg: 'rgba(109,74,255,0.18)' },
    'Completed':  { color: '#00D2A0',  bg: 'rgba(0,210,160,0.12)' },
    'Cancelled':  { color: '#FF6B9D',  bg: 'rgba(255,107,157,0.12)' },
};

export default function RecentTripsTable({ trips = [] }) {
    return (
        <div className="card">
            <h3 className="card-title">Recent Trips</h3>
            <div className="table-wrapper">
                {trips.length === 0 ? (
                    <div style={{ color: '#666', padding: '20px', textAlign: 'center', fontSize: '13px' }}>
                        No trip data yet.
                    </div>
                ) : (
                    <table className="trips-table">
                        <thead>
                            <tr>
                                <th>Trip Code</th>
                                <th>Origin → Dest</th>
                                <th>Status</th>
                                <th>ETA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trips.map(trip => {
                                const label = trip.status || trip.rawStatus || 'Draft';
                                const s = statusConfig[label] || statusConfig['Draft'];
                                const code = trip.tripCode || trip.id;
                                const route = trip.source && trip.destination
                                    ? `${trip.source} → ${trip.destination}`
                                    : '—';
                                const eta = trip.eta
                                    ? new Date(trip.eta).toLocaleDateString()
                                    : '—';
                                return (
                                    <tr key={trip.id} className="trip-row">
                                        <td className="trip-id">{code}</td>
                                        <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{route}</td>
                                        <td>
                                            <span className="status-pill" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}44` }}>
                                                {label}
                                            </span>
                                        </td>
                                        <td className="eta">{eta}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
