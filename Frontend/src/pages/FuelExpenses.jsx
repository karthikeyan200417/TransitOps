import React, { useState, useMemo } from 'react';
import {
    MdSearch, MdFilterList, MdRefresh, MdAdd, MdClose, MdLocalGasStation,
    MdAttachMoney, MdDirectionsBus, MdPerson, MdCalendarToday, MdShield,
    MdConfirmationNumber, MdReceipt, MdDelete
} from 'react-icons/md';
import {
    mockFuelLogs, mockExpenses, expenseCategories,
    expenseStatuses, fuelStationsList, expenseApprovedList
} from '../data/fuelExpensesMockData';
import { mockVehicles } from '../data/fleetMockData';
import { mockDrivers } from '../data/driversMockData';
import Navbar from '../components/Navbar';
import './FuelExpenses.css';

/* ─── Expense Status Badge ─── */
function StatusBadge({ status }) {
    const cfg = {
        Approved: { color: '#00D2A0', bg: 'rgba(0, 210, 160, 0.1)' },
        Pending: { color: '#FF9F43', bg: 'rgba(255, 159, 67, 0.1)' },
        Rejected: { color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.1)' }
    };
    const s = cfg[status] || cfg.Pending;
    return (
        <span className="status-badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}25` }}>
            {status}
        </span>
    );
}

/* ─── Add Fuel Log Modal Form ─── */
const DEFAULT_FUEL = {
    vehicle: '', driver: '', fuelStation: 'Indian Oil (Highway Ext)',
    litres: '', cost: '', odometer: '', date: '', notes: ''
};

function AddFuelModal({ onSave, onClose }) {
    const [form, setForm] = useState(DEFAULT_FUEL);

    const setField = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.vehicle || !form.driver || !form.litres || !form.cost) {
            alert('Please fill out Vehicle, Driver, Litres refueled and total Cost.');
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
                        <p className="modal-sub">Log litres, odometer metrics, and station invoices.</p>
                    </div>
                    <button className="modal-close" onClick={onClose}><MdClose /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="form-field">
                            <label>Select Vehicle HMV *</label>
                            <select value={form.vehicle} onChange={e => setField('vehicle', e.target.value)} required>
                                <option value="">-- Choose HMV --</option>
                                {mockVehicles.map(v => (
                                    <option key={v.id} value={v.regNumber}>{v.regNumber}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Select Driver *</label>
                            <select value={form.driver} onChange={e => setField('driver', e.target.value)} required>
                                <option value="">-- Choose Operator --</option>
                                {mockDrivers.map(d => (
                                    <option key={d.id} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Litres Refuelled *</label>
                            <input type="number" step="0.01" value={form.litres} onChange={e => setField('litres', parseFloat(e.target.value) || '')} required />
                        </div>
                        <div className="form-field">
                            <label>Cost Incurred (INR) *</label>
                            <input type="number" value={form.cost} onChange={e => setField('cost', parseInt(e.target.value) || '')} required />
                        </div>
                        <div className="form-field">
                            <label>Odometer Reading (km)</label>
                            <input type="number" value={form.odometer} onChange={e => setField('odometer', parseInt(e.target.value) || '')} />
                        </div>
                        <div className="form-field">
                            <label>Fuel Station</label>
                            <select value={form.fuelStation} onChange={e => setField('fuelStation', e.target.value)}>
                                {fuelStationsList.map(station => <option key={station} value={station}>{station}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Refuel Date</label>
                            <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
                        </div>
                        <div className="form-field form-full">
                            <label>Notes / Receipt Invoice Number</label>
                            <input type="text" value={form.notes} onChange={e => setField('notes', e.target.value)} />
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

/* ─── Add Expense Modal Form ─── */
const DEFAULT_EXPENSE = {
    expenseType: 'Toll Charges', vehicle: '', amount: '', date: '',
    approvedBy: 'Raven K. (Dispatcher)', status: 'Pending', description: '', receiptUrl: ''
};

function AddExpenseModal({ onSave, onClose }) {
    const [form, setForm] = useState(DEFAULT_EXPENSE);

    const setField = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.vehicle || !form.amount || !form.description) {
            alert('Please fill out Vehicle, Expense Amount and description of cost.');
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
                        <p className="modal-sub">Record tolls, insurance, driver allowances, and parts invoices.</p>
                    </div>
                    <button className="modal-close" onClick={onClose}><MdClose /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="form-field">
                            <label>Expense Category *</label>
                            <select value={form.expenseType} onChange={e => setField('expenseType', e.target.value)}>
                                {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Select Vehicle HMV *</label>
                            <select value={form.vehicle} onChange={e => setField('vehicle', e.target.value)} required>
                                <option value="">-- Choose HMV --</option>
                                {mockVehicles.map(v => (
                                    <option key={v.id} value={v.regNumber}>{v.regNumber}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Amount Spent (INR) *</label>
                            <input type="number" value={form.amount} onChange={e => setField('amount', parseInt(e.target.value) || '')} required />
                        </div>
                        <div className="form-field">
                            <label>Authorizing Personnel</label>
                            <select value={form.approvedBy} onChange={e => setField('approvedBy', e.target.value)}>
                                {expenseApprovedList.map(app => <option key={app} value={app}>{app}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Expense Date</label>
                            <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Receipt Attachment Mockup</label>
                            <input type="text" placeholder="e.g. invoice_scan_78.pdf" value={form.receiptUrl} onChange={e => setField('receiptUrl', e.target.value)} />
                        </div>
                        <div className="form-field form-full">
                            <label>Expense Description / Justification *</label>
                            <textarea rows={2} value={form.description} onChange={e => setField('description', e.target.value)} required />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Expense Log</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function FuelExpenses({ onNavigate }) {
    const [activeTab, setActiveTab] = useState('Fuel Logs');

    // States
    const [fuelLogs, setFuelLogs] = useState(mockFuelLogs);
    const [expenses, setExpenses] = useState(mockExpenses);

    const [search, setSearch] = useState('');
    const [stationFilter, setStationFilter] = useState('All');
    const [expenseTypeFilter, setExpenseTypeFilter] = useState('All');

    // Modal displays
    const [fuelModalOpen, setFuelModalOpen] = useState(false);
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);

    // Compute stat widgets
    const fuelStats = useMemo(() => {
        const totalLitres = fuelLogs.reduce((sum, f) => sum + f.litres, 0);
        const totalCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
        const avgCostPerLitre = totalLitres > 0 ? (totalCost / totalLitres).toFixed(2) : 0;
        const refuelsCount = fuelLogs.length;

        return { totalLitres, totalCost, avgCostPerLitre, refuelsCount };
    }, [fuelLogs]);

    const expenseStats = useMemo(() => {
        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const approved = expenses.filter(e => e.status === 'Approved').length;
        const pending = expenses.filter(e => e.status === 'Pending').length;

        // Toll and Insurance specific sums
        const toll = expenses.filter(e => e.expenseType === 'Toll Charges').reduce((s, e) => s + e.amount, 0);
        const insurance = expenses.filter(e => e.expenseType === 'Insurance Premium').reduce((s, e) => s + e.amount, 0);

        return { totalSpent, approved, pending, toll, insurance };
    }, [expenses]);

    // Actions
    const handleAddFuel = (entry) => {
        const fresh = { ...entry, id: `FL-${Date.now().toString().slice(-3)}` };
        setFuelLogs(prev => [fresh, ...prev]);
        setFuelModalOpen(false);
    };

    const handleAddExpense = (entry) => {
        const fresh = { ...entry, id: `EXP-${Date.now().toString().slice(-3)}` };
        setExpenses(prev => [fresh, ...prev]);
        setExpenseModalOpen(false);
    };

    const toggleExpenseApproval = (id) => {
        setExpenses(prev => prev.map(e => {
            if (e.id === id) {
                const nextStatus = e.status === 'Pending' ? 'Approved' : 'Pending';
                return { ...e, status: nextStatus };
            }
            return e;
        }));
    };

    const deleteFuelLog = (id) => {
        setFuelLogs(prev => prev.filter(f => f.id !== id));
    };

    const deleteExpense = (id) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    const handleRefresh = () => {
        setSearch('');
        setStationFilter('All');
        setExpenseTypeFilter('All');
    };

    // Filter fuel logs
    const filteredFuelLogs = useMemo(() => {
        return fuelLogs.filter(f => {
            const matchSearch = f.vehicle.toLowerCase().includes(search.toLowerCase()) ||
                f.driver.toLowerCase().includes(search.toLowerCase());
            const matchStation = stationFilter === 'All' || f.fuelStation === stationFilter;
            return matchSearch && matchStation;
        });
    }, [fuelLogs, search, stationFilter]);

    // Filter expenses
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const matchSearch = e.vehicle.toLowerCase().includes(search.toLowerCase()) ||
                e.description.toLowerCase().includes(search.toLowerCase());
            const matchCategory = expenseTypeFilter === 'All' || e.expenseType === expenseTypeFilter;
            return matchSearch && matchCategory;
        });
    }, [expenses, search, expenseTypeFilter]);

    return (
        <div className="fuel-expenses-page">
            <Navbar onNavigate={onNavigate} />

            <div className="fe-container">
                {/* Header */}
                <div className="fe-header">
                    <div>
                        <h1 className="fe-title">Fuel & Expense Management</h1>
                        <p className="fe-sub">Oversee operational overheads, refilling records, and toll road expenses.</p>
                    </div>
                    <div className="fe-header-buttons">
                        <button className="btn-primary" onClick={() => {
                            if (activeTab === 'Fuel Logs') setFuelModalOpen(true);
                            else setExpenseModalOpen(true);
                        }}>
                            <MdAdd /> {activeTab === 'Fuel Logs' ? 'Add Fuel Log' : 'Add Expense Entry'}
                        </button>
                    </div>
                </div>

                {/* Dynamic tabs */}
                <div className="tab-bar">
                    <button className={`tab-btn ${activeTab === 'Fuel Logs' ? 'active' : ''}`} onClick={() => { setActiveTab('Fuel Logs'); handleRefresh(); }}>
                        <MdLocalGasStation /> Fuel Refuel Logs
                    </button>
                    <button className={`tab-btn ${activeTab === 'Expenses' ? 'active' : ''}`} onClick={() => { setActiveTab('Expenses'); handleRefresh(); }}>
                        <MdAttachMoney /> Operating Expenses
                    </button>
                </div>

                {/* Statistics conditional based on Tab */}
                {activeTab === 'Fuel Logs' ? (
                    <div className="fe-stats-grid">
                        <div className="stat-box" style={{ '--accent-color': '#00D2A0' }}>
                            <div className="stat-num">{fuelStats.totalLitres} L</div>
                            <div className="stat-title">Total Litres Refueled</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#a78bff' }}>
                            <div className="stat-num">₹{fuelStats.totalCost.toLocaleString()}</div>
                            <div className="stat-title">Total Fuel Cost</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#4F8CFF' }}>
                            <div className="stat-num">₹{fuelStats.avgCostPerLitre} / L</div>
                            <div className="stat-title">Average Cost / Litre</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#FF9F43' }}>
                            <div className="stat-num">{fuelStats.refuelsCount}</div>
                            <div className="stat-title">Logged Fuel Receipts</div>
                        </div>
                    </div>
                ) : (
                    <div className="fe-stats-grid">
                        <div className="stat-box" style={{ '--accent-color': '#ff6b6b' }}>
                            <div className="stat-num">₹{expenseStats.totalSpent.toLocaleString()}</div>
                            <div className="stat-title">Total Expenses Booked</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#4F8CFF' }}>
                            <div className="stat-num">₹{expenseStats.toll.toLocaleString()}</div>
                            <div className="stat-title font-small">Toll Gate Audits</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#00D2A0' }}>
                            <div className="stat-num">₹{expenseStats.insurance.toLocaleString()}</div>
                            <div className="stat-title font-small">Assets Insurance</div>
                        </div>
                        <div className="stat-box" style={{ '--accent-color': '#FF9F43' }}>
                            <div className="stat-num">{expenseStats.pending} Records</div>
                            <div className="stat-title">Awaiting Approval</div>
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="fe-toolbar">
                    <div className="toolbar-left">
                        <div className="search-wrap">
                            <MdSearch className="search-ic" />
                            <input
                                type="text"
                                placeholder={activeTab === 'Fuel Logs' ? 'Search vehicle or driver...' : 'Search description, vehicle...'}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        {activeTab === 'Fuel Logs' ? (
                            <div className="filter-wrap">
                                <select value={stationFilter} onChange={e => setStationFilter(e.target.value)}>
                                    <option value="All">All Fuel Stations</option>
                                    {fuelStationsList.map(st => <option key={st} value={st}>{st}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="filter-wrap">
                                <select value={expenseTypeFilter} onChange={e => setExpenseTypeFilter(e.target.value)}>
                                    <option value="All">All Expense Types</option>
                                    {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="toolbar-right">
                        <button className="btn-icon" title="Clear Filters" onClick={handleRefresh}><MdRefresh /></button>
                    </div>
                </div>

                {/* Tab content listings */}
                <div className="table-card">
                    {activeTab === 'Fuel Logs' ? (
                        filteredFuelLogs.length === 0 ? (
                            <div className="empty-state-card">
                                <h3>No refilling invoices found</h3>
                                <p>Add a new diesel top-up log to see it list here.</p>
                                <button className="btn-primary" onClick={() => setFuelModalOpen(true)}>Add Fuel Log</button>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="fe-table-element">
                                    <thead>
                                        <tr>
                                            <th>Invoice ID</th>
                                            <th>Vehicle Unit</th>
                                            <th>Refueling Operator</th>
                                            <th>Fuel Station Station</th>
                                            <th>Litres Refueled (L)</th>
                                            <th>Total Cost Billing</th>
                                            <th>Odometer Record</th>
                                            <th>Fuel Refuel Date</th>
                                            <th className="actions-header">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFuelLogs.map(log => (
                                            <tr key={log.id} className="fe-tr">
                                                <td className="fe-log-id">{log.id}</td>
                                                <td>
                                                    <span className="fe-v-lbl">{log.vehicle}</span>
                                                </td>
                                                <td>
                                                    <span className="fe-driver-tag"><MdPerson /> {log.driver}</span>
                                                </td>
                                                <td>{log.fuelStation}</td>
                                                <td>{log.litres} L</td>
                                                <td>₹{log.cost.toLocaleString()}</td>
                                                <td>{log.odometer ? `${log.odometer.toLocaleString()} km` : '—'}</td>
                                                <td>{log.date}</td>
                                                <td>
                                                    <div className="actions-dropdown">
                                                        <button className="btn-action-round delete" onClick={() => deleteFuelLog(log.id)} title="Delete Fuel Entry"><MdDelete /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        filteredExpenses.length === 0 ? (
                            <div className="empty-state-card">
                                <h3>No operational expenses booked</h3>
                                <p>Register a toll or insurance invoice to compile reports.</p>
                                <button className="btn-primary" onClick={() => setExpenseModalOpen(true)}>Add Expense Entry</button>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="fe-table-element">
                                    <thead>
                                        <tr>
                                            <th>Expense ID</th>
                                            <th>Expense Category</th>
                                            <th>Vehicle HMV</th>
                                            <th>Invoiced Amount</th>
                                            <th>Audit Date</th>
                                            <th>Assigned Auditor</th>
                                            <th>Description</th>
                                            <th>Invoice Scan File</th>
                                            <th>Approve Status</th>
                                            <th className="actions-header">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.map(exp => (
                                            <tr key={exp.id} className="fe-tr">
                                                <td className="fe-log-id">{exp.id}</td>
                                                <td>
                                                    <strong className="fe-exp-cat-lbl">{exp.expenseType}</strong>
                                                </td>
                                                <td>
                                                    <span className="fe-v-lbl">{exp.vehicle}</span>
                                                </td>
                                                <td>₹{exp.amount.toLocaleString()}</td>
                                                <td>{exp.date}</td>
                                                <td>{exp.approvedBy}</td>
                                                <td>{exp.description}</td>
                                                <td>
                                                    {exp.receiptUrl ? (
                                                        <span className="fe-receipt-attachment"><MdReceipt /> {exp.receiptUrl}</span>
                                                    ) : (
                                                        <span className="fe-receipt-empty">No upload</span>
                                                    )}
                                                </td>
                                                <td><StatusBadge status={exp.status} /></td>
                                                <td>
                                                    <div className="actions-dropdown">
                                                        <button className="btn-action-round view" onClick={() => toggleExpenseApproval(exp.id)} title="Toggle Approval Status">
                                                            {exp.status === 'Pending' ? 'Approve' : 'Hold'}
                                                        </button>
                                                        <button className="btn-action-round delete" onClick={() => deleteExpense(exp.id)} title="Remove expense entry"><MdDelete /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Fuel Log Modal */}
            {fuelModalOpen && <AddFuelModal onSave={handleAddFuel} onClose={() => setFuelModalOpen(false)} />}

            {/* Expense Modal */}
            {expenseModalOpen && <AddExpenseModal onSave={handleAddExpense} onClose={() => setExpenseModalOpen(false)} />}
        </div>
    );
}
