import React, { useState, useMemo } from 'react';
import {
    MdSearch, MdFilterList, MdSort, MdRefresh, MdDownload, MdAdd,
    MdVisibility, MdEdit, MdDelete, MdBlock, MdCheckCircle, MdClose,
    MdWarning, MdPhone, MdEmail, MdBadge, MdCreditCard
} from 'react-icons/md';
import { mockDrivers, licenseCategories, driverStatuses, bloodGroups } from '../data/driversMockData';
import Navbar from '../components/Navbar';
import './DriverManagement.css';

/* ─── Safety Score Bar ─── */
function SafetyScoreBar({ score }) {
    const getScoreColor = (num) => {
        if (num >= 90) return '#00D2A0'; // green
        if (num >= 80) return '#4F8CFF'; // blue
        if (num >= 70) return '#FF9F43'; // orange
        return '#FF6B6B'; // red
    };
    const color = getScoreColor(score);
    return (
        <div className="safety-score-container" title={`Safety Score: ${score}/100`}>
            <div className="safety-score-bar-bg">
                <div className="safety-score-bar-fill" style={{ width: `${score}%`, backgroundColor: color }} />
            </div>
            <span className="safety-score-text" style={{ color }}>{score}</span>
        </div>
    );
}

/* ─── Driver Status Badge ─── */
function StatusBadge({ status }) {
    const cfg = {
        Available: { color: '#4F8CFF', bg: 'rgba(79, 140, 255, 0.1)' },
        'On Trip': { color: '#a78bff', bg: 'rgba(167, 139, 255, 0.1)' },
        Suspended: { color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.1)' },
        'Off Duty': { color: '#888888', bg: 'rgba(255, 255, 255, 0.05)' }
    };
    const s = cfg[status] || cfg.Available;
    return (
        <span className="status-badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}25` }}>
            {status}
        </span>
    );
}

/* ─── Driver Details Modal ─── */
function ViewDriverModal({ driver, onClose }) {
    const details = [
        { label: 'Employee ID', value: driver.empId },
        { label: 'License Number', value: driver.licenseNumber },
        { label: 'License Category', value: driver.licenseCategory },
        { label: 'License Expiry', value: driver.licenseExpiry },
        { label: 'Phone', value: driver.phone },
        { label: 'Email', value: driver.email },
        { label: 'Emergency Contact', value: driver.emergencyContact },
        { label: 'Blood Group', value: driver.bloodGroup },
        { label: 'Experience', value: driver.experience },
        { label: 'Joining Date', value: driver.joiningDate },
        { label: 'Assigned Vehicle', value: driver.assignedVehicle || 'None' },
        { label: 'Safety Score', value: `${driver.safetyScore}/100` },
    ];

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="driver-modal-header-profile">
                        <img src={driver.photo || 'https://via.placeholder.com/150'} alt={driver.name} className="driver-modal-avatar" />
                        <div>
                            <h2>{driver.name}</h2>
                            <div className="driver-modal-badges">
                                <StatusBadge status={driver.status} />
                                <span className="driver-modal-exp">{driver.experience} Exp</span>
                            </div>
                        </div>
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
                        <span className="detail-label">Address</span>
                        <span className="detail-value">{driver.address}</span>
                    </div>
                    <div className="detail-item form-full">
                        <span className="detail-label">Notes</span>
                        <span className="detail-value italic-notes">{driver.notes || 'No extra notes provided.'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Add or Edit Form Modal ─── */
const DEFAULT_DRIVER = {
    name: '', empId: '', licenseNumber: '', licenseCategory: 'Light (LMV)',
    phone: '', email: '', address: '', licenseExpiry: '', joiningDate: '',
    emergencyContact: '', bloodGroup: 'O+', experience: '', safetyScore: 90,
    status: 'Available', notes: '', photo: ''
};

function AddEditDriverModal({ initial, onSave, onClose }) {
    const [form, setForm] = useState(initial || DEFAULT_DRIVER);
    const isEdit = !!initial;

    const setField = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name || !form.empId || !form.licenseNumber) {
            alert('Please fill in Name, Employee ID and License Number.');
            return;
        }
        onSave(form);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box modal-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{isEdit ? 'Edit Driver' : 'Add New Driver'}</h2>
                        <p className="modal-sub">{isEdit ? `Updating details for ${initial.name}` : 'Fill out driver details'}</p>
                    </div>
                    <button className="modal-close" onClick={onClose}><MdClose /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Full Name *</label>
                            <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} required />
                        </div>
                        <div className="form-field">
                            <label>Employee ID *</label>
                            <input type="text" value={form.empId} onChange={e => setField('empId', e.target.value)} required />
                        </div>
                        <div className="form-field">
                            <label>License Number *</label>
                            <input type="text" value={form.licenseNumber} onChange={e => setField('licenseNumber', e.target.value)} required />
                        </div>
                        <div className="form-field">
                            <label>License Category</label>
                            <select value={form.licenseCategory} onChange={e => setField('licenseCategory', e.target.value)}>
                                {licenseCategories.slice(1).map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>License Expiry</label>
                            <input type="date" value={form.licenseExpiry} onChange={e => setField('licenseExpiry', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Phone</label>
                            <input type="text" value={form.phone} onChange={e => setField('phone', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Email</label>
                            <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Photo URL</label>
                            <input type="text" placeholder="https://..." value={form.photo} onChange={e => setField('photo', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Emergency Contact</label>
                            <input type="text" placeholder="Name (Relation) - Phone" value={form.emergencyContact} onChange={e => setField('emergencyContact', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Blood Group</label>
                            <select value={form.bloodGroup} onChange={e => setField('bloodGroup', e.target.value)}>
                                {bloodGroups.map(bg => <option key={bg}>{bg}</option>)}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Experience (Years)</label>
                            <input type="text" placeholder="e.g. 5 Years" value={form.experience} onChange={e => setField('experience', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Safety Score (0 - 100)</label>
                            <input type="number" min="0" max="100" value={form.safetyScore} onChange={e => setField('safetyScore', parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="form-field">
                            <label>Joining Date</label>
                            <input type="date" value={form.joiningDate} onChange={e => setField('joiningDate', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Status</label>
                            <select value={form.status} onChange={e => setField('status', e.target.value)}>
                                {driverStatuses.slice(1).map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-field form-full">
                            <label>Address</label>
                            <input type="text" value={form.address} onChange={e => setField('address', e.target.value)} />
                        </div>
                        <div className="form-field form-full">
                            <label>Notes</label>
                            <textarea rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Driver</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Delete Driver Dialog ─── */
function DeleteConfirmModal({ driver, onConfirm, onCancel }) {
    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="delete-dialog" onClick={e => e.stopPropagation()}>
                <div className="dd-icon"><MdWarning /></div>
                <h3>Delete Driver</h3>
                <p>Are you sure you want to remove <strong>{driver.name} ({driver.empId})</strong>? This action will delete their profile from local state.</p>
                <div className="dd-actions">
                    <button className="btn-ghost" onClick={onCancel}>Cancel</button>
                    <button className="btn-danger" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    );
}

const PAGE_SIZE = 5;

export default function DriverManagement({ onNavigate }) {
    const [drivers, setDrivers] = useState(mockDrivers);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [licenseFilter, setLicenseFilter] = useState('All');
    const [sortBy, setSortBy] = useState('name');
    const [page, setPage] = useState(1);

    // Modals state
    const [viewDriver, setViewDriver] = useState(null);
    const [addOpen, setAddOpen] = useState(false);
    const [editDriver, setEditDriver] = useState(null);
    const [deleteDriver, setDeleteDriver] = useState(null);

    // Statistics counts
    const stats = useMemo(() => {
        const total = drivers.length;
        const available = drivers.filter(d => d.status === 'Available').length;
        const onTrip = drivers.filter(d => d.status === 'On Trip').length;
        const suspended = drivers.filter(d => d.status === 'Suspended').length;

        // License expiring in next 60 days
        const expiringSoon = drivers.filter(d => {
            if (!d.licenseExpiry) return false;
            const days = (new Date(d.licenseExpiry) - new Date()) / (1000 * 60 * 60 * 24);
            return days >= 0 && days <= 60;
        }).length;

        return { total, available, onTrip, suspended, expiringSoon };
    }, [drivers]);

    // Handle suspended status toggling directly
    const toggleSuspension = (id) => {
        setDrivers(prev => prev.map(drv => {
            if (drv.id === id) {
                const newStatus = drv.status === 'Suspended' ? 'Available' : 'Suspended';
                return { ...drv, status: newStatus };
            }
            return drv;
        }));
    };

    // Filter & Sort
    const filteredDrivers = useMemo(() => {
        let list = drivers.filter(d => {
            const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
                d.empId.toLowerCase().includes(search.toLowerCase()) ||
                d.phone.includes(search);
            const matchStatus = statusFilter === 'All' || d.status === statusFilter;
            const matchLicense = licenseFilter === 'All' || d.licenseCategory === licenseFilter;
            return matchSearch && matchStatus && matchLicense;
        });

        if (sortBy === 'name') {
            list.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'score') {
            list.sort((a, b) => b.safetyScore - a.safetyScore);
        } else if (sortBy === 'expiry') {
            list.sort((a, b) => new Date(a.licenseExpiry) - new Date(b.licenseExpiry));
        }
        return list;
    }, [drivers, search, statusFilter, licenseFilter, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / PAGE_SIZE));
    const paginated = filteredDrivers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // CRUD handlers
    const handleAddNew = (newDrv) => {
        const fresh = { ...newDrv, id: Date.now() };
        setDrivers(prev => [fresh, ...prev]);
        setAddOpen(false);
    };

    const handleEditSave = (updated) => {
        setDrivers(prev => prev.map(d => d.id === editDriver.id ? updated : d));
        setEditDriver(null);
    };

    const handleDeleteConfirm = () => {
        setDrivers(prev => prev.filter(d => d.id !== deleteDriver.id));
        setDeleteDriver(null);
        if (paginated.length === 1 && page > 1) {
            setPage(p => p - 1);
        }
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('All');
        setLicenseFilter('All');
        setSortBy('name');
        setPage(1);
    };

    const exportCSV = () => {
        const headers = ['Name', 'Employee ID', 'License Number', 'License Category', 'License Expiry', 'Phone', 'Safety Score', 'Status', 'Assigned Vehicle'];
        const rows = filteredDrivers.map(d => [d.name, d.empId, d.licenseNumber, d.licenseCategory, d.licenseExpiry, d.phone, d.safetyScore, d.status, d.assignedVehicle]);
        const csvContent = [headers, ...rows].map(row => row.map(value => `"${value}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'transitops_drivers.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="driver-page">
            <Navbar onNavigate={onNavigate} />

            <div className="driver-container">
                {/* Header */}
                <div className="driver-header">
                    <div>
                        <h1 className="driver-title">Driver Management</h1>
                        <p className="driver-sub">Manage driver information, photo catalogs, safety metrics, and operational availability.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setAddOpen(true)}>
                        <MdAdd /> Add Driver
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="driver-stats-grid">
                    <div className="stat-box" style={{ '--accent-color': '#6D4AFF' }}>
                        <div className="stat-num">{stats.total}</div>
                        <div className="stat-title">Total Drivers</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#00D2A0' }}>
                        <div className="stat-num">{stats.available}</div>
                        <div className="stat-title">Available</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#4F8CFF' }}>
                        <div className="stat-num">{stats.onTrip}</div>
                        <div className="stat-title">On Trip</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#FF6B6B' }}>
                        <div className="stat-num">{stats.suspended}</div>
                        <div className="stat-title">Suspended</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#FF9F43' }}>
                        <div className="stat-num">{stats.expiringSoon}</div>
                        <div className="stat-title">License Expiring Soon</div>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="driver-toolbar">
                    <div className="toolbar-left">
                        <div className="search-wrap">
                            <MdSearch className="search-ic" />
                            <input
                                type="text"
                                placeholder="Search name, phone, emp ID..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <div className="filter-wrap">
                            <MdFilterList className="filter-ic" />
                            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                                <option value="All">All Statuses</option>
                                {driverStatuses.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="filter-wrap">
                            <select value={licenseFilter} onChange={e => { setLicenseFilter(e.target.value); setPage(1); }}>
                                <option value="All">All License Types</option>
                                {licenseCategories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="filter-wrap">
                            <MdSort className="filter-ic" />
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="name">Sort by Name</option>
                                <option value="score">Sort by Safety Score</option>
                                <option value="expiry">Sort by License Expiry</option>
                            </select>
                        </div>
                    </div>
                    <div className="toolbar-right">
                        <button className="btn-icon" title="Refresh" onClick={resetFilters}><MdRefresh /></button>
                        <button className="btn-icon" title="Export CSV" onClick={exportCSV}><MdDownload /></button>
                    </div>
                </div>

                {/* Content Table */}
                <div className="table-card">
                    {paginated.length === 0 ? (
                        <div className="empty-state-card">
                            <h3>No drivers found matches criteria</h3>
                            <p>Try resetting filters or adding a new driver to your registry.</p>
                            <button className="btn-primary" onClick={() => setAddOpen(true)}>Add Driver</button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="driver-table-element">
                                <thead>
                                    <tr>
                                        <th>Photo</th>
                                        <th>Driver Name</th>
                                        <th>Emp ID</th>
                                        <th>License Details</th>
                                        <th>Phone</th>
                                        <th>Safety Score</th>
                                        <th>Expiry Date</th>
                                        <th>Status</th>
                                        <th>Assigned HMV</th>
                                        <th className="actions-header">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(driver => (
                                        <tr key={driver.id} className="driver-tr">
                                            <td>
                                                <img src={driver.photo || 'https://via.placeholder.com/40'} alt={driver.name} className="driver-table-img" />
                                            </td>
                                            <td>
                                                <div className="driver-name-cell">
                                                    <span className="main-name">{driver.name}</span>
                                                    <span className="sub-tag">{driver.email}</span>
                                                </div>
                                            </td>
                                            <td>{driver.empId}</td>
                                            <td>
                                                <div className="license-cell">
                                                    <span className="lic-no">{driver.licenseNumber}</span>
                                                    <span className="lic-cat">{driver.licenseCategory}</span>
                                                </div>
                                            </td>
                                            <td>{driver.phone}</td>
                                            <td>
                                                <SafetyScoreBar score={driver.safetyScore} />
                                            </td>
                                            <td>{driver.licenseExpiry}</td>
                                            <td><StatusBadge status={driver.status} /></td>
                                            <td>
                                                <span className="vehicle-assign-tag">
                                                    {driver.assignedVehicle !== 'None' ? driver.assignedVehicle : 'Unassigned'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actions-dropdown">
                                                    <button className="btn-action-round view" onClick={() => setViewDriver(driver)} title="View Driver"><MdVisibility /></button>
                                                    <button className="btn-action-round edit" onClick={() => setEditDriver(driver)} title="Edit Driver"><MdEdit /></button>
                                                    {driver.status === 'Suspended' ? (
                                                        <button className="btn-action-round activate" onClick={() => toggleSuspension(driver.id)} title="Activate Driver"><MdCheckCircle /></button>
                                                    ) : (
                                                        <button className="btn-action-round suspend" onClick={() => toggleSuspension(driver.id)} title="Suspend Driver"><MdBlock /></button>
                                                    )}
                                                    <button className="btn-action-round delete" onClick={() => setDeleteDriver(driver)} title="Delete Driver"><MdDelete /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="driver-pagination-wrap">
                        <button className="btn-icon" onClick={() => setPage(page - 1)} disabled={page === 1}>{"<"}</button>
                        <span className="page-lbl">Page {page} of {totalPages}</span>
                        <button className="btn-icon" onClick={() => setPage(page + 1)} disabled={page === totalPages}>{">"}</button>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {viewDriver && <ViewDriverModal driver={viewDriver} onClose={() => setViewDriver(null)} />}
            {(addOpen || editDriver) && (
                <AddEditDriverModal
                    initial={editDriver}
                    onSave={editDriver ? handleEditSave : handleAddNew}
                    onClose={() => { setAddOpen(false); setEditDriver(null); }}
                />
            )}
            {deleteDriver && (
                <DeleteConfirmModal
                    driver={deleteDriver}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteDriver(null)}
                />
            )}
        </div>
    );
}
