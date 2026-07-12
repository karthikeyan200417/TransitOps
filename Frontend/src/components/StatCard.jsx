import React from 'react';
import {
    MdDirectionsBus, MdCheckCircle, MdBuild, MdMap,
    MdAccessTime, MdPeople, MdPieChart, MdTrendingUp, MdTrendingDown
} from 'react-icons/md';
import './StatCard.css';

const iconMap = {
    'truck': MdDirectionsBus,
    'check-circle': MdCheckCircle,
    'tool': MdBuild,
    'map-pin': MdMap,
    'clock': MdAccessTime,
    'users': MdPeople,
    'pie-chart': MdPieChart,
};

export default function StatCard({ title, value, trend, trendUp, icon, color }) {
    const Icon = iconMap[icon] || MdDirectionsBus;

    return (
        <div className="stat-card" style={{ '--accent': color }}>
            <div className="stat-card-top">
                <div className="stat-icon" style={{ background: `${color}22`, color }}>
                    <Icon />
                </div>
                <div className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
                    {trendUp ? <MdTrendingUp /> : <MdTrendingDown />}
                    <span>{trend}</span>
                </div>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-title">{title}</div>
        </div>
    );
}
