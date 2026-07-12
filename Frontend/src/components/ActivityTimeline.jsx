import React from 'react';
import { activityTimeline } from '../data/dashboardData';
import {
    MdDirectionsBus, MdMap, MdBuild, MdLocalGasStation, MdPersonAddAlt
} from 'react-icons/md';
import './ActivityTimeline.css';

const iconMap = {
    'truck': MdDirectionsBus,
    'map-pin': MdMap,
    'tool': MdBuild,
    'droplet': MdLocalGasStation,
    'user-check': MdPersonAddAlt,
};

export default function ActivityTimeline() {
    return (
        <div className="card">
            <h3 className="card-title">Recent Activity</h3>
            <div className="timeline">
                {activityTimeline.map((item, i) => {
                    const Icon = iconMap[item.icon] || MdDirectionsBus;
                    return (
                        <div key={item.id} className="timeline-item">
                            <div className="timeline-icon-wrap">
                                <div className="timeline-icon" style={{ background: `${item.color}22`, color: item.color }}>
                                    <Icon />
                                </div>
                                {i < activityTimeline.length - 1 && <div className="timeline-line" />}
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
