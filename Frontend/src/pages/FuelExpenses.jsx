import React, { useState, useMemo, useEffect } from 'react';
import {
    MdSearch, MdFilterList, MdRefresh, MdAdd, MdClose, MdLocalGasStation,
    MdAttachMoney, MdPerson, MdReceipt, MdDelete
} from 'react-icons/md';
import { fuelApi, expensesApi, vehiclesApi } from '../services/api';
import Navbar from '../components/Navbar';
import './FuelExpenses.css';

const expenseTypes = ['FUEL', 'MAINTENANCE', 'TOLL', 'PARKING', 'OTHER'];

function fuelToUI(f) {
    return {
        id: f.id,
        vehicleId: f.vehicle_id,
        vehicle: f.vehicle_id,
        liters: parseFloat(f.liters),
        cost: parseFloat(f.cost),
        odometer: parseFloat(f.odometer),
        date: f.date,
    };
}

function expenseToUI(e) {
    return {
        id: e.id,
        vehicleId: e.vehicle_id,
        vehicle: e.vehicle_id,
        tripId: e.trip_id,
        amount: parseFloat(e.amount),
        type: e.type,
        date: e.date,
    };
}

/* ─── Add Fuel Log Modal ─── */
function AddFuelModal({ vehicles, onSave, onClose }) {
    const [form, setForm] = useState({
        vehicle_id: '', date: '', liters: '', cost: '', odometer: ''
    });
    const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.vehicle_id || !form.liters || !form.cost || !form.date) {
            alert('Please fill Vehicle, Date, Litres and Cost.');
            return;
        }
        onSave(form);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Log Fuel Refilling</h2>
                        <p className="modal-sub">Record litres, cost and odometer reading.</p>
                    </div>
                    <button className="modal-close" onClick={onClose}><MdClose /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="form-field">
                            <label>Vehicle *</label>
                            <select value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)} required>
                                <option value="">-- Choose Vehicle --</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.registration_number} ({v.name_model})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Date *</label>
                            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
                        </div>
                        <div className="form-field">
                            <label>Litres *</label>
                            <input type="number" step="0.01" value={form.liters} onChange={e => set('liters', e.target.value)} required />
                        </div>
                        <div className="form-field">
                            <label>Cost (₹) *</label>
                            <input type="number" step="0.01" value={form.cost} onChange={e => set('cost', e.target.value)} required />
                        </div>
                        <div className="form-field">
                            <label>Odometer (km)</label>
                            <input type="number" step="0.01" value={form.odometer} onChange={e => set('odometer', e.target.value)} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Fuel Entry</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Add Expense Modal ─── */
function AddExpenseModal({ vehicles, onSave, onClose }) {
    const [form, setForm] = useState({
        vehicle_id: '', trip_id: '', amount: '', type: 'TOLL', date: ''
    });
    const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.vehicle_id || !form.amount || !form.date) {
            alert('Please fill Vehicle, Amount and Date.');
            return;
        }
        onSave(form);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Log Fleet Expense</h2>
                        <p className="modal-sub">Record tolls, maintenance, parking and other costs.</p>
                    </div>
                    <button className="modal-close" onClick={onClose}><MdClose /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="form-field">
                            <label>Vehicle *</label>
                            <select value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)} required>
                                <option value="">-- Choose Vehicle --</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.registration_number} ({v.name_model})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Expense Type</label>
                            <select value={form.type} onChange={e => set('type', e.target.value)}>
                                {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Amount (₹) *</label>
                            <input type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} required />
                        </div>
                        <div className="form-field">
                            <label>Date *</label>
                            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Expense</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function FuelExpenses({ onNavigate }) {
    const [activeTab, setActiveTab] = useState('Fuel Logs');
    const [fuelLogs, setFuelLogs]   = useState([]);
    const [expenses, setExpenses]   = useState([]);
    const [vehicles, setVehicles]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [fuelModalOpen, setFuelModalOpen]       = useState(false);
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [fl, ex, vl] = await Promise.all([fuelApi.list(), expensesApi.list(), vehiclesApi.list()]);
            setFuelLogs(fl.map(fuelToUI));
            setExpenses(ex.map(expenseToUI));
            setVehicles(vl);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    // Build vehicle lookup map for display
    const vehicleMap = useMemo(() => {
        const m = {};
        vehicles.forEach(v => { m[v.id] = v.registration_number; });
        return m;
    }, [vehicles]);

    const fuelStats = useMemo(() => ({
        totalLiters: fuelLogs.reduce((s, f) => s + f.liters, 0).toFixed(1),
        totalCost:   fuelLogs.reduce((s, f) => s + f.cost, 0),
        avgCost:     fuelLogs.length > 0
            ? (fuelLogs.reduce((s, f) => s + f.cost, 0) / fuelLogs.reduce((s, f) => s + f.liters, 0)).toFixed(2)
            : 0,
        count: fuelLogs.length,
    }), [fuelLogs]);

    const expenseStats = useMemo(() => ({
        total: expenses.reduce((s, e) => s + e.amount, 0),
        toll:  expenses.filter(e => e.type === 'TOLL').reduce((s, e) => s + e.amount, 0),
        maint: expenses.filter(e => e.type === 'MAINTENANCE').reduce((s, e) => s + e.amount, 0),
        count: expenses.length,
    }), [expenses]);

    const handleAddFuel = async (form) => {
        try {
            await fuelApi.create({
                vehicle_id: form.vehicle_id,
                date: form.date,
                liters: parseFloat(form.liters),
                cost: parseFloat(form.cost),
                odometer: parseFloat(form.odometer) || 0,
            });
            setFuelModalOpen(false);
            fetchData();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleAddExpense = async (form) => {
        try {
            await expensesApi.create({
                vehicle_id: form.vehicle_id,
                trip_id: form.trip_id || null,
                amount: parseFloat(form.amount),
                type: form.type,
                date: form.date,
            });
            setExpenseModalOpen(false);
            fetchData();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleRefresh = () => { fetchData(); setSearch(''); setTypeFilter('All'); };

    const filteredFuel = useMemo(() =>
        fuelLogs.filter(f => (vehicleMap[f.vehicleId] || '').toLowerCase().includes(search.toLowerCase())),
        [fuelLogs, search, vehicleMap]
    );

    const filteredExpenses = useMemo(() =>
        expenses.filter(e => {
            const matchSearch = (vehicleMap[e.vehicleId] || '').toLowerCase().includes(search.toLowerCase());
            const matchType   = typeFilter === 'All' || e.type === typeFilter;
            return matchSearch && matchType;
        }),
        [expenses, search, typeFilter, vehicleMap]
    );

    return (
        <div className="fuel-expenses-page">
            <Navbar onNavigate={onNavigate} />
            <div className="fe-container">
                <div className="fe-header">
                    <div>
                        <h1 className="fe-title">Fuel & Expense Management</h1>
                        <p className="fe-sub">Oversee operational overheads, refilling records, and expenses.</p>
                    </div>
                    <button className="btn-primary" onClick={() => activeTab === 'Fuel Logs' ? setFuelModalOpen(true) : setExpenseModalOpen(true)}>
                        <MdAdd /> {activeTab === 'Fuel Logs' ? 'Add Fuel Log' : 'Add Expense'}
                    </button>
                </div>

                <div className="tab-bar">
                    <button className={`tab-btn ${activeTab === 'Fuel Logs' ? 'active' : ''}`} onClick={() => setActiveTab('Fuel Logs')}>
                        <MdLocalGasStation /> Fuel Logs
                    </button>
                    <button className={`tab-btn ${activeTab === 'Expenses' ? 'active' : ''}`} onClick={() => setActiveTab('Expenses')}>
                        <MdAttachMoney /> Expenses
                    </button>
                </div>

                {activeTab === 'Fuel Logs' ? (
                    <div className="fe-stats-grid">
                        <div className="stat-box" style={{ '--accent-color': '#00D2A0' }}>
                            <div className="stat-num">{fuelStats.totalLiters} L</div>
                            <div className="stat-title">Total Litres</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#a78bff' }}>
                            <div className="stat-num">₹{fuelStats.totalCost.toLocaleString()}</div>
                            <div className="stat-title">Total Fuel Cost</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#4F8CFF' }}>
                            <div className="stat-num">₹{fuelStats.avgCost} / L</div>
                            <div className="stat-title">Avg Cost / Litre</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#FF9F43' }}>
                            <div className="stat-num">{fuelStats.count}</div>
                            <div className="stat-title">Total Logs</div>
                        </div>
                    </div>
                ) : (
                    <div className="fe-stats-grid">
                        <div className="stat-box" style={{ '--accent-color': '#ff6b6b' }}>
                            <div className="stat-num">₹{expenseStats.total.toLocaleString()}</div>
                            <div className="stat-title">Total Expenses</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#4F8CFF' }}>
                            <div className="stat-num">₹{expenseStats.toll.toLocaleString()}</div>
                            <div className="stat-title">Toll</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#00D2A0' }}>
                            <div className="stat-num">₹{expenseStats.maint.toLocaleString()}</div>
                            <div className="stat-title">Maintenance</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#FF9F43' }}>
                            <div className="stat-num">{expenseStats.count}</div>
                            <div className="stat-title">Total Records</div>
                        </div>
                    </div>
                )}

                <div className="fe-toolbar">
                    <div className="toolbar-left">
                        <div className="search-wrap">
                            <MdSearch className="search-ic" />
                            <input
                                type="text"
                                placeholder="Search by vehicle..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        {activeTab === 'Expenses' && (
                            <div className="filter-wrap">
                                <MdFilterList className="filter-ic" />
                                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                                    <option value="All">All Types</option>
                                    {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="toolbar-right">
                        <button className="btn-icon" onClick={handleRefresh}><MdRefresh /></button>
                    </div>
                </div>

                <div className="table-card">
                    {activeTab === 'Fuel Logs' ? (
                        filteredFuel.length === 0 ? (
                            <div className="empty-state-card">
                                <h3>No fuel logs found</h3>
                                <button className="btn-primary" onClick={() => setFuelModalOpen(true)}>Add Fuel Log</button>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="fe-table-element">
                                    <thead>
                                        <tr>
                                            <th>Vehicle</th>
                                            <th>Date</th>
                                            <th>Litres</th>
                                            <th>Cost (₹)</th>
                                            <th>Odometer (km)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFuel.map(log => (
                                            <tr key={log.id} className="fe-tr">
                                                <td>{vehicleMap[log.vehicleId] || log.vehicleId}</td>
                                                <td>{log.date}</td>
                                                <td>{log.liters} L</td>
                                                <td>₹{log.cost.toLocaleString()}</td>
                                                <td>{log.odometer ? `${log.odometer.toLocaleString()} km` : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        filteredExpenses.length === 0 ? (
                            <div className="empty-state-card">
                                <h3>No expenses found</h3>
                                <button className="btn-primary" onClick={() => setExpenseModalOpen(true)}>Add Expense</button>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="fe-table-element">
                                    <thead>
                                        <tr>
                                            <th>Vehicle</th>
                                            <th>Type</th>
                                            <th>Amount (₹)</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.map(exp => (
                                            <tr key={exp.id} className="fe-tr">
                                                <td>{vehicleMap[exp.vehicleId] || exp.vehicleId}</td>
                                                <td><strong>{exp.type}</strong></td>
                                                <td>₹{exp.amount.toLocaleString()}</td>
                                                <td>{exp.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            </div>

            {fuelModalOpen && <AddFuelModal vehicles={vehicles} onSave={handleAddFuel} onClose={() => setFuelModalOpen(false)} />}
            {expenseModalOpen && <AddExpenseModal vehicles={vehicles} onSave={handleAddExpense} onClose={() => setExpenseModalOpen(false)} />}
        </div>
    );
}
