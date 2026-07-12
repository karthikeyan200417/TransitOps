import React, { useState, useMemo, useEffect } from 'react';
import {
    MdSearch, MdFilterList, MdRefresh, MdAdd, MdVisibility, MdEdit,
    MdCheckCircle, MdClose, MdWarning, MdBuild, MdAttachMoney,
    MdPerson, MdHomeRepairService, MdCalendarToday
} from 'react-icons/md';
import { maintenanceApi, vehiclesApi } from '../services/api';
import Navbar from '../components/Navbar';
import './MaintenancePage.css';

const maintenanceTypes      = ['All', 'PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'EMERGENCY'];
const maintenanceStatuses   = ['All', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const maintenancePriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const mechanicsList         = ['All'];
const garagesList           = [];

function toUI(r) {
    return {
        id: r.id,
        vehicle: r.vehicle_id,
        vehicleReg: r.vehicle?.registration_number || r.vehicle_id,
        maintenanceType: r.maintenance_type,
        status: r.status.charAt(0) + r.status.slice(1).toLowerCase().replace('_', ' '),
        rawStatus: r.status,
        description: r.description,
        mechanic: r.technician_name || 'N/A',
        garage: r.service_center || 'N/A',
        scheduledDate: r.scheduled_date,
        completedDate: r.completion_date,
        estimatedCost: parseFloat(r.estimated_cost) || 0,
        actualCost: parseFloat(r.actual_cost) || 0,
        priority: r.priority,
        parts: r.parts_used || '',
        notes: r.notes || '',
    };
}


/* ─── Maintenance Status Badge ─── */
function StatusBadge({ status }) {
    const cfg = {
        Scheduled: { color: '#FF9F43', bg: 'rgba(255, 159, 67, 0.1)' },
        'In Progress': { color: '#a78bff', bg: 'rgba(167, 139, 255, 0.1)' },
        Completed: { color: '#00D2A0', bg: 'rgba(0, 210, 160, 0.1)' },
        Cancelled: { color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.1)' },
    };
    const s = cfg[status] || cfg.Scheduled;
    return (
        <span className="status-badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}25` }}>
            {status}
        </span>
    );
}

/* ─── Mnt Priority Tag ─── */
function PriorityTag({ priority }) {
    const colors = {
        Critical: '#FF6B6B',
        High: '#FF9F43',
        Medium: '#4F8CFF',
        Low: '#888'
    };
    const color = colors[priority] || '#fff';
    return (
        <span className="mnt-priority-indicator" style={{ borderColor: color, color }}>
            {priority}
        </span>
    );
}

/* ─── View Modal Details ─── */
function ViewMaintenanceModal({ record, onClose }) {
    const details = [
        { label: 'Vehicle ID', value: record.vehicle },
        { label: 'Type', value: record.maintenanceType },
        { label: 'Priority', value: record.priority },
        { label: 'Assigned Mechanic', value: record.mechanic },
        { label: 'Garage Workshop', value: record.garage },
        { label: 'Estimated cost', value: `₹${record.estimatedCost.toLocaleString()}` },
        { label: 'Actual cost', value: record.actualCost > 0 ? `₹${record.actualCost.toLocaleString()}` : '—' },
        { label: 'Start Date', value: record.startDate },
        { label: 'Expected Completion', value: record.expectedCompletion },
        { label: 'End Date / Completion', value: record.endDate || 'Not completed yet' },
    ];

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Maintenance Log Details</h2>
                        <p className="modal-sub">ID: {record.id} — Status: <StatusBadge status={record.status} /></p>
                    </div>
                    <button className="modal-close" onClick={onClose}><MdClose /></button>
                </div>
                <div className="driver-detail-grid">
                    {details.map((d, i) => (
                        <div className="detail-item" key={i}>
                            <span className="detail-label">{d.label}</span>
                            <span className="detail-value">{d.value}</span>
                        </div>
                    ))}
                    <div className="detail-item form-full">
                        <span className="detail-label">Service Description / Concern</span>
                        <span className="detail-value">{record.description}</span>
                    </div>
                    {record.notes && (
                        <div className="detail-item form-full">
                            <span className="detail-label">Closing Notes / Technician Feed</span>
                            <span className="detail-value italic-notes">{record.notes}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Add/Edit Maintenance Record Form Modal ─── */
const DEFAULT_LOG = {
    vehicle: '', maintenanceType: 'Preventive Servicing', priority: 'Medium',
    description: '', mechanic: '', garage: '', estimatedCost: '',
    actualCost: '', startDate: '', expectedCompletion: '', endDate: '',
    status: 'Scheduled', notes: ''
};

function AddEditMntModal({ initial, onSave, onClose }) {
    const [form, setForm] = useState(initial || DEFAULT_LOG);
    const isEdit = !!initial;

    const setField = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.vehicle || !form.mechanic || !form.garage) {
            alert('Please fill out Vehicle, Mechanic and Garage Workshop details.');
            return;
        }
        onSave(form);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box modal-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{isEdit ? 'Edit Maintenance Record' : 'Schedule New Maintenance Service'}</h2>
                        <p className="modal-sub">Log repairs, diagnostics, and routine inspections.</p>
                    </div>
                    <button className="modal-close" onClick={onClose}><MdClose /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Select Vehicle HMV *</label>
                            <select value={form.vehicle} onChange={e => setField('vehicle', e.target.value)}>
                                <option value="">-- Choose HMV --</option>
                                {mockVehicles.map(v => (
                                    <option key={v.id} value={v.regNumber}>{v.regNumber} ({v.model})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Maintenance Type</label>
                            <select value={form.maintenanceType} onChange={e => setField('maintenanceType', e.target.value)}>
                                {maintenanceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Service Priority</label>
                            <select value={form.priority} onChange={e => setField('priority', e.target.value)}>
                                {maintenancePriorities.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Assigned Mechanic *</label>
                            <select value={form.mechanic} onChange={e => setField('mechanic', e.target.value)}>
                                <option value="">-- Choose Mechanic --</option>
                                {mechanicsList.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="form-field form-full">
                            <label>Garage Workshop / Repair Site *</label>
                            <select value={form.garage} onChange={e => setField('garage', e.target.value)}>
                                <option value="">-- Choose Workshop --</option>
                                {garagesList.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Estimated Cost (INR)</label>
                            <input type="number" value={form.estimatedCost} onChange={e => setField('estimatedCost', parseInt(e.target.value) || 0)} required />
                        </div>
                        {isEdit && (
                            <div className="form-field">
                                <label>Actual Cost (INR)</label>
                                <input type="number" value={form.actualCost} onChange={e => setField('actualCost', parseInt(e.target.value) || 0)} />
                            </div>
                        )}
                        <div className="form-field">
                            <label>Scheduled / Start Date</label>
                            <input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Expected Completion</label>
                            <input type="date" value={form.expectedCompletion} onChange={e => setField('expectedCompletion', e.target.value)} />
                        </div>
                        {isEdit && (
                            <div className="form-field">
                                <label>Service Status</label>
                                <select value={form.status} onChange={e => setField('status', e.target.value)}>
                                    {maintenanceStatuses.slice(1).map(st => <option key={st} value={st}>{st}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="form-field form-full">
                            <label>Problem Description / Service Instructions</label>
                            <textarea rows={2} value={form.description} onChange={e => setField('description', e.target.value)} />
                        </div>
                        <div className="form-field form-full">
                            <label>Operational Notes & Remarks</label>
                            <textarea rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Service Log</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Close Maintenance Repair Modal ─── */
function CloseRepairModal({ record, onConfirm, onCancel }) {
    const [cost, setCost] = useState(record.estimatedCost || '');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!cost) {
            alert('Please clarify the actual service charges.');
            return;
        }
        const rightNow = new Date().toISOString().substring(0, 10);
        onConfirm({
            ...record,
            actualCost: parseInt(cost) || 0,
            notes: notes || 'Service closed successfully.',
            status: 'Completed',
            endDate: rightNow
        });
    };

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                    <div>
                        <h2>Close Servicing Record</h2>
                        <p className="modal-sub">Finalize billing for vehicle: {record.vehicle}</p>
                    </div>
                    <button className="modal-close" onClick={onCancel}><MdClose /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="form-field">
                            <label>Actual Invoiced Cost (₹) *</label>
                            <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="e.g. 15400" required />
                        </div>
                        <div className="form-field">
                            <label>Service Resolution Notes</label>
                            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="State what repairs were performed and current parts status..." />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn-primary">Finalize & Mark Done</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function MaintenancePage({ onNavigate }) {
    const [records, setRecords]   = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]         = useState('');
    const [typeFilter, setTypeFilter]     = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [mechanicFilter, setMechanicFilter] = useState('All');

    const [viewRecord, setViewRecord]   = useState(null);
    const [addOpen, setAddOpen]         = useState(false);
    const [editRecord, setEditRecord]   = useState(null);
    const [closeRecord, setCloseRecord] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [m, v] = await Promise.all([maintenanceApi.list(), vehiclesApi.list()]);
            setRecords(m.map(toUI));
            setVehicles(v);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    const stats = useMemo(() => ({
        active:    records.filter(r => r.rawStatus === 'IN_PROGRESS').length,
        scheduled: records.filter(r => r.rawStatus === 'SCHEDULED').length,
        completed: records.filter(r => r.rawStatus === 'COMPLETED').length,
        totalCost: records.reduce((s, r) => s + (r.actualCost || r.estimatedCost || 0), 0),
    }), [records]);

    const handleAddNew = async (data) => {
        try {
            await maintenanceApi.create({
                vehicle_id: data.vehicle,
                maintenance_type: data.maintenanceType,
                description: data.description,
                scheduled_date: data.scheduledDate,
                estimated_cost: parseFloat(data.estimatedCost) || 0,
                priority: data.priority || 'MEDIUM',
                technician_name: data.mechanic,
                service_center: data.garage,
                notes: data.notes,
                status: 'SCHEDULED',
            });
            setAddOpen(false);
            fetchData();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleEditSave = async (data) => {
        try {
            await maintenanceApi.update(editRecord.id, {
                description: data.description,
                estimated_cost: parseFloat(data.estimatedCost),
                actual_cost: parseFloat(data.actualCost),
                technician_name: data.mechanic,
                service_center: data.garage,
                notes: data.notes,
                status: data.rawStatus || data.status.toUpperCase().replace(' ', '_'),
            });
            setEditRecord(null);
            fetchData();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleCloseResolve = async (closedData) => {
        try {
            await maintenanceApi.update(closedData.id, {
                status: 'COMPLETED',
                actual_cost: parseFloat(closedData.actualCost),
                completion_date: new Date().toISOString().split('T')[0],
            });
            setCloseRecord(null);
            fetchData();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const resetFilters = () => {
        setSearch(''); setTypeFilter('All'); setStatusFilter('All'); setMechanicFilter('All');
    };

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchVehicle  = r.vehicleReg?.toLowerCase().includes(search.toLowerCase()) ||
                String(r.id).toLowerCase().includes(search.toLowerCase());
            const matchType     = typeFilter === 'All' || r.maintenanceType === typeFilter;
            const matchStatus   = statusFilter === 'All' || r.rawStatus === statusFilter;
            const matchMechanic = mechanicFilter === 'All' || r.mechanic === mechanicFilter;
            return matchVehicle && matchType && matchStatus && matchMechanic;
        });
    }, [records, search, typeFilter, statusFilter, mechanicFilter]);



    return (
        <div className="maintenance-page">
            <Navbar onNavigate={onNavigate} />

            <div className="mnt-container">
                {/* Header */}
                <div className="mnt-header">
                    <div>
                        <h1 className="mnt-title">Maintenance & Servicing</h1>
                        <p className="mnt-sub">Manage routine fleet care, emergency breakdowns, mechanic assignments, and repair budgets.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setAddOpen(true)}>
                        <MdAdd /> Schedule Service
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="mnt-stats-grid">
                    <div className="stat-box" style={{ '--accent-color': '#a78bff' }}>
                        <div className="stat-num">{stats.active}</div>
                        <div className="stat-title">In Shop (In Progress)</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#FF9F43' }}>
                        <div className="stat-num">{stats.scheduled}</div>
                        <div className="stat-title">Scheduled Jobs</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#00D2A0' }}>
                        <div className="stat-num">{stats.completed}</div>
                        <div className="stat-title">Completed Care</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#4F8CFF' }}>
                        <div className="stat-num">₹{stats.totalCost.toLocaleString()}</div>
                        <div className="stat-title">Operational Cost Expended</div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="mnt-toolbar">
                    <div className="toolbar-left">
                        <div className="search-wrap">
                            <MdSearch className="search-ic" />
                            <input
                                type="text"
                                placeholder="Search vehicle HMV, job ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="filter-wrap">
                            <MdFilterList className="filter-ic" />
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                                <option value="All">All Types</option>
                                {maintenanceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="filter-wrap">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="All">All statuses</option>
                                {maintenanceStatuses.slice(1).map(st => <option key={st} value={st}>{st}</option>)}
                            </select>
                        </div>
                        <div className="filter-wrap">
                            <select value={mechanicFilter} onChange={e => setMechanicFilter(e.target.value)}>
                                <option value="All">All mechanics</option>
                                {mechanicsList.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="toolbar-right">
                        <button className="btn-icon" title="Clear Filters" onClick={resetFilters}><MdRefresh /></button>
                    </div>
                </div>

                {/* Main Records Table */}
                <div className="table-card">
                    {filteredRecords.length === 0 ? (
                        <div className="empty-state-card">
                            <h3>No maintenance records match criteria</h3>
                            <p>Try refining filters or add a new scheduled repair.</p>
                            <button className="btn-primary" onClick={() => setAddOpen(true)}>Schedule Service</button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="mnt-table-element">
                                <thead>
                                    <tr>
                                        <th>Job ID</th>
                                        <th>Vehicle</th>
                                        <th>Maintenance Type</th>
                                        <th>Technician</th>
                                        <th>Estimated Budget (₹)</th>
                                        <th>Actual Spent (₹)</th>
                                        <th>Start Date</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                        <th className="actions-header">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map(rec => (
                                        <tr key={rec.id} className="mnt-tr">
                                            <td className="mnt-id">{rec.id}</td>
                                            <td>
                                                <span className="v-assign-bubble">{rec.vehicle}</span>
                                            </td>
                                            <td>
                                                <div className="type-prio-cell">
                                                    <span className="mnt-type">{rec.maintenanceType}</span>
                                                    <PriorityTag priority={rec.priority} />
                                                </div>
                                            </td>
                                            <td>
                                                <span className="mech-tag"><MdPerson /> {rec.mechanic}</span>
                                            </td>
                                            <td>₹{rec.estimatedCost.toLocaleString()}</td>
                                            <td>{rec.actualCost > 0 ? `₹${rec.actualCost.toLocaleString()}` : '—'}</td>
                                            <td>{rec.startDate}</td>
                                            <td>{rec.expectedCompletion}</td>
                                            <td><StatusBadge status={rec.status} /></td>
                                            <td>
                                                <div className="actions-dropdown">
                                                    <button className="btn-action-round view" onClick={() => setViewRecord(rec)} title="View Job Details"><MdVisibility /></button>
                                                    <button className="btn-action-round edit" onClick={() => setEditRecord(rec)} title="Edit Configuration"><MdEdit /></button>
                                                    {rec.status !== 'Completed' && rec.status !== 'Cancelled' && (
                                                        <button className="btn-action-round activate" onClick={() => setCloseRecord(rec)} title="Complete & Close Job"><MdCheckCircle /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {viewRecord && <ViewMaintenanceModal record={viewRecord} onClose={() => setViewRecord(null)} />}
            {(addOpen || editRecord) && (
                <AddEditMntModal
                    initial={editRecord}
                    onSave={editRecord ? handleEditSave : handleAddNew}
                    onClose={() => { setAddOpen(false); setEditRecord(null); }}
                />
            )}
            {closeRecord && (
                <CloseRepairModal
                    record={closeRecord}
                    onConfirm={handleCloseResolve}
                    onCancel={() => setCloseRecord(null)}
                />
            )}
        </div>
    );
}
