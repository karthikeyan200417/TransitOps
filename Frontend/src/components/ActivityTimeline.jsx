import React from 'react';
import {
    MdDirectionsBus, MdMap, MdBuild, MdLocalGasStation, MdPersonAddAlt
} from 'react-icons/md';
import './ActivityTimeline.css';

export default function ActivityTimeline({ trips = [] }) {
    // Build activity items from recent trips data
    const items = trips.slice(0, 5).map((trip, i) => {
        const colors = ['#6D4AFF', '#4F8CFF', '#00D2A0', '#FF9F43', '#FF6B9D'];
        const icons  = [MdDirectionsBus, MdMap, MdBuild, MdLocalGasStation, MdPersonAddAlt];
        const Icon   = icons[i % icons.length];
        const color  = colors[i % colors.length];
        const status = trip.status || trip.rawStatus || '';
        return { id: trip.id, Icon, color, text: `Trip ${trip.tripCode || trip.id} — ${status} · ${trip.source || ''} → ${trip.destination || ''}`, time: trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '—' };
    });

    return (
        <div className="card">
            <h3 className="card-title">Recent Activity</h3>
            <div className="timeline">
                {items.length === 0 ? (
                    <div style={{ color: '#666', padding: '16px', fontSize: '13px' }}>No recent activity.</div>
                ) : items.map((item, i) => {
                    const { Icon } = item;
                    return (
                        <div key={item.id} className="timeline-item">
                            <div className="timeline-icon-wrap">
                                <div className="timeline-icon" style={{ background: `${item.color}22`, color: item.color }}>
                                    <Icon />
                                </div>
                                {i < items.length - 1 && <div className="timeline-line" />}
                            </div>
                            <div className="timeline-content">
                                <p className="timeline-text">{item.text}</p>
                                <span className="timeline-time">{item.time}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
