import React, { useState } from 'react';
import {
    MdTimeline, MdTrendingUp, MdLeaderboard, MdList, MdDownload,
    MdAttachMoney, MdDirectionsBus, MdPerson, MdLocalGasStation, MdBuild, MdTimer
} from 'react-icons/md';
import { mockAnalyticsData, documentReports } from '../data/reportsMockData';
import Navbar from '../components/Navbar';
import './ReportsPage.css';

/* ─── Custom Responsive SVG Pie/Donut Chart ─── */
function DonutChart({ data }) {
    const total = data.values.reduce((sum, v) => sum + v, 0);
    let accumulatedAngle = 0;

    return (
        <div className="donut-chart-wrap">
            <svg width="220" height="220" viewBox="0 0 220 220" className="donut-svg">
                <circle cx="110" cy="110" r="85" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="20" />
                {data.values.map((val, idx) => {
                    const percentage = val / total;
                    const strokeDash = percentage * 2 * Math.PI * 85;
                    const strokeOffset = accumulatedAngle * -2 * Math.PI * 85;
                    accumulatedAngle += percentage;
                    return (
                        <circle
                            key={idx}
                            cx="110"
                            cy="110"
                            r="85"
                            fill="none"
                            stroke={data.colors[idx]}
                            strokeWidth="20"
                            strokeDasharray={`${strokeDash} 999`}
                            strokeDashoffset={strokeOffset}
                            transform="rotate(-90 110 110)"
                            className="donut-segment"
                            title={`${data.labels[idx]}: ${val}%`}
                        />
                    );
                })}
                <circle cx="110" cy="110" r="70" fill="#15151D" />
                <text x="110" y="105" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">78%</text>
                <text x="110" y="125" textAnchor="middle" fill="#555" fontSize="11" fontWeight="600" letterSpacing="0.5">UTILIZATION</text>
            </svg>
            <div className="donut-legend">
                {data.labels.map((lbl, idx) => (
                    <div className="legend-item" key={lbl}>
                        <span className="legend-bullet" style={{ background: data.colors[idx] }} />
                        <span className="legend-lbl">{lbl} ({data.values[idx]}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Custom Responsive SVG Line/Area Chart ─── */
function LineAreaChart({ data }) {
    // Max fuel cost: 410,000
    const maxVal = 450000;
    const width = 500;
    const height = 180;
    const padding = 20;

    // Make point calculations
    const points = data.map((item, idx) => {
        const x = padding + (idx * (width - padding * 2)) / (data.length - 1);
        const y = height - padding - (item.fuelCost * (height - padding * 2)) / maxVal;
        return { x, y };
    });

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
        <div className="line-chart-container">
            <svg viewBox={`0 0 ${width} ${height}`} className="line-svg">
                {/* Grids */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                    <line
                        key={i}
                        x1={padding}
                        y1={padding + r * (height - padding * 2)}
                        x2={width - padding}
                        y2={padding + r * (height - padding * 2)}
                        stroke="rgba(255,255,255,0.03)"
                        strokeWidth="1"
                    />
                ))}

                {/* Area Fill */}
                <path d={areaD} fill="url(#purpleGrad)" opacity="0.12" />

                {/* Path Line */}
                <path d={pathD} fill="none" stroke="#6D4AFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Points */}
                {points.map((p, idx) => (
                    <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="5" fill="#15151D" stroke="#6D4AFF" strokeWidth="2" className="chart-dot" />
                        <text x={p.x} y={height - 2} textAnchor="middle" fill="#444" fontSize="10" fontWeight="600">{data[idx].month}</text>
                        <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#aaa" fontSize="9" fontWeight="700">₹{(data[idx].fuelCost / 1000)}k</text>
                    </g>
                ))}

                <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6D4AFF" />
                        <stop offset="100%" stopColor="#6D4AFF" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

/* ─── Custom Responsive SVG Bar Chart ─── */
function ExpensesBarChart({ data }) {
    const maxVal = 450000;
    const width = 500;
    const height = 180;
    const padding = 20;

    return (
        <div className="bar-chart-container">
            <svg viewBox={`0 0 ${width} ${height}`} className="bar-svg">
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                    <line
                        key={i}
                        x1={padding}
                        y1={padding + r * (height - padding * 2)}
                        x2={width - padding}
                        y2={padding + r * (height - padding * 2)}
                        stroke="rgba(255,255,255,0.03)"
                        strokeWidth="1"
                    />
                ))}

                {data.map((item, idx) => {
                    const colWidth = 36;
                    const totalCols = data.length;
                    const x = padding + (idx * (width - padding * 2)) / totalCols + (width - padding * 2) / (totalCols * 2) - colWidth / 2;
                    const barHeight = (item.amount * (height - padding * 2)) / maxVal;
                    const y = height - padding - barHeight;

                    return (
                        <g key={idx}>
                            <rect
                                x={x}
                                y={y}
                                width={colWidth}
                                height={barHeight}
                                rx="6"
                                fill={item.color}
                                opacity="0.8"
                                className="chart-bar"
                            />
                            <text x={x + colWidth / 2} y={height - 2} textAnchor="middle" fill="#444" fontSize="9" fontWeight="600">{item.category.split(' ')[0]}</text>
                            <text x={x + colWidth / 2} y={y - 8} textAnchor="middle" fill="#aaa" fontSize="9" fontWeight="700">₹{Math.round(item.amount / 1000)}k</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default function ReportsPage({ onNavigate }) {
    const [reports, setReports] = useState(documentReports);

    const triggerDownload = (report) => {
        alert(`Initiating secure local download interface:\nDocument: ${report.title}\nFormat: ${report.format}\nStatus: Verified Complete`);
    };

    const generatePDFExport = () => {
        alert("Compiling current screen metrics into standard ERP PDF Report format...");
    };

    const generateCSVExport = () => {
        alert("Consolidating core database entries. Exporting comprehensive report database file...");
    };

    return (
        <div className="reports-page">
            <Navbar onNavigate={onNavigate} />

            <div className="rep-container">
                {/* Header */}
                <div className="rep-header">
                    <div>
                        <h1 className="rep-title">Reports & Executive Analytics</h1>
                        <p className="rep-sub">Audit fleet deployment coefficients, spending parameters, and operations ledger audits.</p>
                    </div>
                    <div className="rep-header-buttons">
                        <button className="btn-ghost" onClick={generateCSVExport}>
                            <MdDownload /> Export CSV
                        </button>
                        <button className="btn-primary" onClick={generatePDFExport}>
                            <MdDownload /> Generate PDF Report
                        </button>
                    </div>
                </div>

                {/* Global Stats Grid */}
                <div className="rep-stats-grid">
                    <div className="stat-box" style={{ '--accent-color': '#00D2A0' }}>
                        <div className="stat-num">78.4%</div>
                        <div className="stat-title">Real Utilization Rate</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#a78bff' }}>
                        <div className="stat-num">₹14.2 L</div>
                        <div className="stat-title">Estimated Monthly Revenue</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#FF9F43' }}>
                        <div className="stat-num">₹3.8 L</div>
                        <div className="stat-title">Fuel Expenditures</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#4F8CFF' }}>
                        <div className="stat-num">₹89 k</div>
                        <div className="stat-title">Servicing Repair Expenses</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#FF6B6B' }}>
                        <div className="stat-num">91%</div>
                        <div className="stat-title">Driver Safety Quotient</div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="rep-charts-grid">
                    <div className="chart-card">
                        <h3><MdTrendingUp /> Fleet Utilization Breakdown</h3>
                        <p className="chart-sub">Share of operations time classified by vehicle usage categories.</p>
                        <DonutChart data={mockAnalyticsData.utilization} />
                    </div>

                    <div className="chart-card">
                        <h3><MdLocalGasStation /> Fuel Cost Trends (6 Months)</h3>
                        <p className="chart-sub">Development of aggregate invoice billing on fuel refills.</p>
                        <LineAreaChart data={mockAnalyticsData.fuelConsumption} />
                    </div>

                    <div className="chart-card">
                        <h3><MdAttachMoney /> Expenditures breakdown by category</h3>
                        <p className="chart-sub">Consolidated operational spending profiles for July 2026.</p>
                        <ExpensesBarChart data={mockAnalyticsData.monthlyExpenses} />
                    </div>
                </div>

                {/* Analytics Insights Leaderboards */}
                <div className="rep-leaderboard-grid">
                    <div className="leader-card">
                        <h3><MdPerson /> Drivers Leaderboard</h3>
                        <p className="chart-sub">Top operating personnel ranked by mileage safety metrics.</p>
                        <div className="leader-list">
                            {mockAnalyticsData.leaderboardDrivers.map(drv => (
                                <div className="leader-row" key={drv.rank}>
                                    <span className="lead-rank">#{drv.rank}</span>
                                    <div className="lead-name-block">
                                        <strong className="lead-main-lbl">{drv.name}</strong>
                                        <span className="lead-sub-lbl">{drv.trips} route runscompleted</span>
                                    </div>
                                    <span className="lead-metric-badge" style={{ color: drv.score >= 90 ? '#00D2A0' : '#4F8CFF' }}>
                                        {drv.score} Safety
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="leader-card">
                        <h3><MdDirectionsBus /> High-Utilization Vehicles</h3>
                        <p className="chart-sub">High mileage asset run hours compiled since service registration.</p>
                        <div className="leader-list">
                            {mockAnalyticsData.leaderboardVehicles.map(veh => (
                                <div className="leader-row" key={veh.rank}>
                                    <span className="lead-rank">#{veh.rank}</span>
                                    <div className="lead-name-block">
                                        <strong className="lead-main-lbl">{veh.regNumber}</strong>
                                        <span className="lead-sub-lbl">{veh.type} — {veh.distanceCovered} km logged</span>
                                    </div>
                                    <span className="lead-util-time"><MdTimer /> {veh.utilizationHrs} hrs</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Document Reports Archive */}
                <div className="reports-archive-card">
                    <div className="rac-header">
                        <h3><MdList /> Exportable Auditing Records</h3>
                        <p className="chart-sub">Compiled archive logs prepared and certified for financial consolidation.</p>
                    </div>
                    <div className="table-responsive">
                        <table className="rep-table-element">
                            <thead>
                                <tr>
                                    <th>Log ID</th>
                                    <th>Document Title</th>
                                    <th>Export Format</th>
                                    <th>Compiled Date</th>
                                    <th>Authorized Compiler</th>
                                    <th className="actions-header">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map(rep => (
                                    <tr key={rep.id} className="rep-row-tr">
                                        <td className="rep-id-col">{rep.id}</td>
                                        <td><strong className="rep-title-lbl">{rep.title}</strong></td>
                                        <td>
                                            <span className={`format-chip ${rep.format.toLowerCase()}`}>{rep.format}</span>
                                        </td>
                                        <td>{rep.date}</td>
                                        <td>{rep.author}</td>
                                        <td>
                                            <div className="actions-dropdown">
                                                <button className="btn-action-round view" onClick={() => triggerDownload(rep)} title="Download certified log file"><MdDownload /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
