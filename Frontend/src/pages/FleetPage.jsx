import React, { useState, useMemo, useEffect } from 'react';
import {
    MdDirectionsBus, MdLocalShipping, MdAirportShuttle, MdLocalTaxi,
    MdAdd, MdRefresh, MdDownload, MdSearch, MdEdit, MdDelete, MdVisibility,
    MdClose, MdCheckCircle, MdWarning, MdBuild, MdBlock,
    MdArrowBack, MdArrowForward, MdFilterList, MdSort
} from 'react-icons/md';
import { vehiclesApi } from '../services/api';
import Navbar from '../components/Navbar';
import './FleetPage.css';

const vehicleTypes  = ['All', 'Van', 'Truck', 'Bus', 'Mini', 'Heavy', 'Tanker', 'Pickup'];
const statusOptions = ['All', 'AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
const fuelTypes     = ['Diesel', 'Petrol', 'CNG', 'Electric', 'Hybrid'];
const sortOptions   = [
    { value: 'newest',   label: 'Newest First' },
    { value: 'oldest',   label: 'Oldest First' },
    { value: 'capacity', label: 'By Capacity' },
    { value: 'status',   label: 'By Status' },
];

function toUI(v) {
    return {
        id: v.id,
        regNumber: v.registration_number,
        vehicleName: v.name_model,
        model: v.name_model,
        vehicleType: v.type,
        capacity: parseFloat(v.capacity_kg),
        odometer: parseFloat(v.odometer),
        acquisitionCost: parseFloat(v.acquisition_cost),
        status: v.status,
        fuelType: 'Diesel',
        purchaseDate: '', color: '', insuranceNumber: '',
        insuranceExpiry: '', registrationExpiry: '', notes: '',
    };
}

function toDisplay(status) {
    return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
}

/* ─── Status Badge ─── */
function StatusBadge({ status }) {
    const display = toDisplay(status);
    const cfg = {
        AVAILABLE: { color: '#00D2A0', bg: 'rgba(0,210,160,0.1)', icon: <MdCheckCircle /> },
        ON_TRIP:   { color: '#4F8CFF', bg: 'rgba(79,140,255,0.1)', icon: <MdLocalShipping /> },
        IN_SHOP:   { color: '#FF9F43', bg: 'rgba(255,159,67,0.1)', icon: <MdBuild /> },
        RETIRED:   { color: '#FF6B9D', bg: 'rgba(255,107,157,0.1)', icon: <MdBlock /> },
    };
    const s = cfg[status] || cfg.AVAILABLE;
    return (
        <span className="status-badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}33` }}>
            {s.icon} {display}
        </span>
    );
}

/* ─── Stat Cards ─── */
function StatCards({ vehicles }) {
    const counts = {
        total:     vehicles.length,
        available: vehicles.filter(v => v.status === 'AVAILABLE').length,
        onTrip:    vehicles.filter(v => v.status === 'ON_TRIP').length,
        inShop:    vehicles.filter(v => v.status === 'IN_SHOP').length,
    };
    const cards = [
        { label: 'Total Vehicles', value: counts.total,     color: '#6D4AFF', icon: <MdLocalShipping /> },
        { label: 'Available',      value: counts.available, color: '#00D2A0', icon: <MdCheckCircle /> },
        { label: 'On Trip',        value: counts.onTrip,    color: '#4F8CFF', icon: <MdDirectionsBus /> },
        { label: 'In Maintenance', value: counts.inShop,    color: '#FF9F43', icon: <MdBuild /> },
    ];
    return (
        <div className="fleet-stat-cards">
            {cards.map(c => (
                <div className="fleet-stat-card" key={c.label} style={{ '--accent': c.color }}>
                    <div className="fsc-icon" style={{ background: `${c.color}22`, color: c.color }}>{c.icon}</div>
                    <div>
                        <div className="fsc-value">{c.value}</div>
                        <div className="fsc-label">{c.label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── Empty State ─── */
function EmptyState({ onAdd }) {
    return (
        <div className="empty-state">
            <div className="empty-icon"><MdLocalShipping /></div>
            <h3>No vehicles found</h3>
            <p>Adjust filters or add a new vehicle to your fleet.</p>
            <button className="btn-primary" onClick={onAdd}><MdAdd /> Add First Vehicle</button>
        </div>
    );
}

/* ─── Delete Dialog ─── */
function DeleteDialog({ vehicle, onConfirm, onCancel }) {
    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="delete-dialog" onClick={e => e.stopPropagation()}>
                <div className="dd-icon"><MdWarning /></div>
                <h3>Delete Vehicle</h3>
                <p>Are you sure you want to remove <strong>{vehicle.regNumber} — {vehicle.vehicleName}</strong> from your fleet? This action cannot be undone.</p>
                <div className="dd-actions">
                    <button className="btn-ghost" onClick={onCancel}>Cancel</button>
                    <button className="btn-danger" onClick={onConfirm}>Delete Vehicle</button>
                </div>
            </div>
        </div>
    );
}

/* ─── View Details Modal ─── */
function ViewModal({ vehicle, onClose }) {
    const fields = [
        ['Registration #', vehicle.regNumber],
        ['Vehicle Name', vehicle.vehicleName],
        ['Model', vehicle.model],
        ['Type', vehicle.vehicleType],
        ['Max Capacity', `${vehicle.capacity.toLocaleString()} kg`],
        ['Odometer', `${vehicle.odometer.toLocaleString()} km`],
        ['Acquisition Cost', `₹${vehicle.acquisitionCost.toLocaleString()}`],
        ['Status', vehicle.status],
        ['Notes', vehicle.notes || '—'],
    ];
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Vehicle Details</h2>
                        <p className="modal-sub">{vehicle.regNumber} — {vehicle.vehicleName}</p>
                    </div>
                    <button className="modal-close" onClick={onClose}><MdClose /></button>
                </div>
                <div className="detail-grid">
                    {fields.map(([label, val]) => (
                        <div className="detail-item" key={label}>
                            <span className="detail-label">{label}</span>
                            <span className="detail-value">{label === 'Status' ? <StatusBadge status={val} /> : val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Add / Edit Modal ─── */
const EMPTY_FORM = {
    regNumber: '', vehicleName: '', model: '', vehicleType: 'Van',
    capacity: '', odometer: '', acquisitionCost: '', purchaseDate: '',
    color: '', fuelType: 'Diesel', insuranceNumber: '', insuranceExpiry: '',
    registrationExpiry: '', status: 'AVAILABLE', notes: '',
};

function VehicleField({ label, field, type, opts, value, onChange }) {
    return (
        <div className="form-field">
            <label>{label}</label>
            {opts ? (
                <select value={value} onChange={e => onChange(field, e.target.value)}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                </select>
            ) : (
                <input type={type || 'text'} value={value} onChange={e => onChange(field, e.target.value)} />
            )}
        </div>
    );
}

function VehicleModal({ initial, onSave, onClose }) {
    const [form, setForm] = useState(initial || EMPTY_FORM);
    const isEdit = !!initial;

    const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const handleSave = () => {
        if (!form.regNumber.trim() || !form.vehicleName.trim()) return;
        onSave(form);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box modal-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
                        <p className="modal-sub">{isEdit ? `Editing ${initial.regNumber}` : 'Fill in the details below'}</p>
                    </div>
                    <button className="modal-close" onClick={onClose}><MdClose /></button>
                </div>
                <div className="form-grid">
                    <VehicleField label="Registration Number *" field="regNumber" value={form.regNumber} onChange={set} />
                    <VehicleField label="Vehicle Name *" field="vehicleName" value={form.vehicleName} onChange={set} />
                    <VehicleField label="Vehicle Model" field="model" value={form.model} onChange={set} />
                    <VehicleField label="Vehicle Type" field="vehicleType" opts={vehicleTypes.slice(1)} value={form.vehicleType} onChange={set} />
                    <VehicleField label="Max Load Capacity (kg)" field="capacity" type="number" value={form.capacity} onChange={set} />
                    <VehicleField label="Current Odometer (km)" field="odometer" type="number" value={form.odometer} onChange={set} />
                    <VehicleField label="Acquisition Cost (₹)" field="acquisitionCost" type="number" value={form.acquisitionCost} onChange={set} />
                    <VehicleField label="Purchase Date" field="purchaseDate" type="date" value={form.purchaseDate} onChange={set} />
                    <VehicleField label="Vehicle Color" field="color" value={form.color} onChange={set} />
                    <VehicleField label="Fuel Type" field="fuelType" opts={fuelTypes} value={form.fuelType} onChange={set} />
                    <VehicleField label="Insurance Number" field="insuranceNumber" value={form.insuranceNumber} onChange={set} />
                    <VehicleField label="Insurance Expiry" field="insuranceExpiry" type="date" value={form.insuranceExpiry} onChange={set} />
                    <VehicleField label="Registration Expiry" field="registrationExpiry" type="date" value={form.registrationExpiry} onChange={set} />
                    <VehicleField label="Current Status" field="status" opts={statusOptions.slice(1)} value={form.status} onChange={set} />
                    <div className="form-field form-full">
                        <label>Notes</label>
                        <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Save Vehicle'}</button>
                </div>
            </div>
        </div>
    );
}

/* ─── Pagination ─── */
function Pagination({ page, totalPages, onPrev, onNext }) {
    return (
        <div className="pagination">
            <button className="page-btn" onClick={onPrev} disabled={page === 1}><MdArrowBack /></button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button className="page-btn" onClick={onNext} disabled={page === totalPages}><MdArrowForward /></button>
        </div>
    );
}

/* ─── Main Fleet Page ─── */
const PAGE_SIZE = 8;

export default function FleetPage() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [apiError, setApiError] = useState(null);
    const [search, setSearch]             = useState('');
    const [typeFilter, setTypeFilter]     = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage]     = useState(1);

    const [showAdd, setShowAdd]             = useState(false);
    const [editVehicle, setEditVehicle]     = useState(null);
    const [viewVehicle, setViewVehicle]     = useState(null);
    const [deleteVehicle, setDeleteVehicle] = useState(null);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const data = await vehiclesApi.list();
            setVehicles(data.map(toUI));
        } catch (e) { setApiError(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchVehicles(); }, []);

    const filtered = useMemo(() => {
        let list = vehicles.filter(v => {
            const matchSearch = !search || v.regNumber.toLowerCase().includes(search.toLowerCase()) || v.vehicleName.toLowerCase().includes(search.toLowerCase());
            const matchType   = typeFilter === 'All' || v.vehicleType === typeFilter;
            const matchStatus = statusFilter === 'All' || v.status === statusFilter;
            return matchSearch && matchType && matchStatus;
        });
        switch (sortBy) {
            case 'oldest':   list = [...list].sort((a, b) => a.regNumber.localeCompare(b.regNumber)); break;
            case 'newest':   list = [...list].sort((a, b) => b.regNumber.localeCompare(a.regNumber)); break;
            case 'capacity': list = [...list].sort((a, b) => b.capacity - a.capacity); break;
            case 'status':   list = [...list].sort((a, b) => a.status.localeCompare(b.status)); break;
            default: break;
        }
        return list;
    }, [vehicles, search, typeFilter, statusFilter, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleAdd = async (form) => {
        try {
            await vehiclesApi.create({
                registration_number: form.regNumber,
                name_model: form.vehicleName,
                type: form.vehicleType,
                capacity_kg: parseFloat(form.capacity),
                odometer: parseFloat(form.odometer) || 0,
                acquisition_cost: parseFloat(form.acquisitionCost),
                status: form.status || 'AVAILABLE',
            });
            setShowAdd(false); setPage(1);
            fetchVehicles();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleEdit = async (form) => {
        try {
            await vehiclesApi.update(editVehicle.id, {
                name_model: form.vehicleName,
                type: form.vehicleType,
                capacity_kg: parseFloat(form.capacity),
                odometer: parseFloat(form.odometer),
                acquisition_cost: parseFloat(form.acquisitionCost),
                status: form.status,
            });
            setEditVehicle(null);
            fetchVehicles();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleDelete = async () => {
        try {
            await vehiclesApi.delete(deleteVehicle.id);
            setDeleteVehicle(null);
            if (paginated.length === 1 && page > 1) setPage(p => p - 1);
            fetchVehicles();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleRefresh = () => { fetchVehicles(); setSearch(''); setTypeFilter('All'); setStatusFilter('All'); setSortBy('newest'); setPage(1); };

    const handleExport = () => {
        const headers = ['Reg#', 'Name', 'Type', 'Capacity', 'Odometer', 'Cost', 'Status'];
        const rows = filtered.map(v => [v.regNumber, v.vehicleName, v.vehicleType, v.capacity, v.odometer, v.acquisitionCost, v.status]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'fleet_export.csv'; a.click();
    };

    const typeIcon = t => ({ Van: <MdAirportShuttle />, Truck: <MdLocalShipping />, Bus: <MdDirectionsBus />, Mini: <MdLocalTaxi /> })[t] || <MdLocalShipping />;

    return (
        <div className="fleet-page" style={{ background: '#0b0b0f', minHeight: '100vh' }}>
            <Navbar />
            <div className="fleet-content">

                <div className="fleet-header">
                    <div>
                        <h1 className="fleet-title">Fleet Management</h1>
                        <p className="fleet-sub">Manage vehicle registration, availability, maintenance status and fleet information.</p>
                    </div>
                    <button className="btn-primary btn-add" onClick={() => setShowAdd(true)}>
                        <MdAdd /> Add Vehicle
                    </button>
                </div>

                <StatCards vehicles={vehicles} />

                <div className="fleet-toolbar">
                    <div className="toolbar-left">
                        <div className="search-wrap">
                            <MdSearch className="search-ic" />
                            <input
                                type="text"
                                placeholder="Search by reg # or name..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <div className="filter-wrap">
                            <MdFilterList className="filter-ic" />
                            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                                {vehicleTypes.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="filter-wrap">
                            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                                {statusOptions.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="filter-wrap">
                            <MdSort className="filter-ic" />
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                {sortOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="toolbar-right">
                        <button className="btn-icon" title="Refresh" onClick={handleRefresh}><MdRefresh /></button>
                        <button className="btn-icon" title="Export CSV" onClick={handleExport}><MdDownload /></button>
                    </div>
                </div>

                {paginated.length === 0 ? (
                    <EmptyState onAdd={() => setShowAdd(true)} />
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="vehicle-table">
                                <thead>
                                    <tr>
                                        <th>Reg #</th>
                                        <th>Vehicle Name</th>
                                        <th>Type</th>
                                        <th>Capacity</th>
                                        <th>Odometer</th>
                                        <th>Cost</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(v => (
                                        <tr key={v.id} className="vehicle-row">
                                            <td className="reg-cell">{v.regNumber}</td>
                                            <td>
                                                <div className="vname-cell">
                                                    <span className="vtype-icon">{typeIcon(v.vehicleType)}</span>
                                                    <div>
                                                        <span className="vname">{v.vehicleName}</span>
                                                        <span className="vmodel">{v.model}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="type-chip">{v.vehicleType}</span></td>
                                            <td>{v.capacity.toLocaleString()} kg</td>
                                            <td>{v.odometer.toLocaleString()} km</td>
                                            <td>₹{(v.acquisitionCost / 100000).toFixed(1)}L</td>
                                            <td><StatusBadge status={v.status} /></td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="action-btn view" title="View Details" onClick={() => setViewVehicle(v)}><MdVisibility /></button>
                                                    <button className="action-btn edit" title="Edit Vehicle" onClick={() => setEditVehicle(v)}><MdEdit /></button>
                                                    <button className="action-btn del" title="Delete Vehicle" onClick={() => setDeleteVehicle(v)}><MdDelete /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPrev={() => setPage(p => Math.max(1, p - 1))}
                            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
                        />
                    </>
                )}
            </div>

            {showAdd && <VehicleModal onSave={handleAdd} onClose={() => setShowAdd(false)} />}
            {editVehicle && <VehicleModal initial={editVehicle} onSave={handleEdit} onClose={() => setEditVehicle(null)} />}
            {viewVehicle && <ViewModal vehicle={viewVehicle} onClose={() => setViewVehicle(null)} />}
            {deleteVehicle && <DeleteDialog vehicle={deleteVehicle} onConfirm={handleDelete} onCancel={() => setDeleteVehicle(null)} />}
        </div>
    );
}
