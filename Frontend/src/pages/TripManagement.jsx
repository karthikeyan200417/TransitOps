import React, { useState, useMemo, useEffect } from 'react';
import {
    MdSearch, MdFilterList, MdRefresh, MdAdd, MdVisibility, MdEdit,
    MdPlayArrow, MdCheckCircle, MdCancel, MdClose, MdWarning,
    MdLocationOn, MdDirectionsBus, MdPerson, MdCalendarToday, MdScale, MdTimeline
} from 'react-icons/md';
import { tripsApi, vehiclesApi, driversApi } from '../services/api';
import Navbar from '../components/Navbar';
import './TripManagement.css';

const cargoTypes    = ['Consumables', 'Electronics', 'Machinery', 'Chemicals', 'Textiles', 'Perishables', 'Fragile', 'Other'];
const tripStatuses  = ['All', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];
const tripPriorities = ['Low', 'Medium', 'High', 'Critical'];

function toUI(t) {
    return {
        id: t.id,
        tripCode: t.trip_code,
        source: t.origin,
        destination: t.destination,
        vehicle: t.vehicle_id,
        vehicleReg: t.vehicle?.registration_number || t.vehicle_id,
        driver: t.driver_id,
        driverName: t.driver?.name || t.driver_id,
        cargoWeight: t.cargo_weight_kg,
        cargoType: t.cargo_type || 'General',
        distance: t.distance_km,
        startDate: t.start_time,
        estimatedArrival: t.estimated_arrival,
        eta: t.estimated_arrival,
        status: t.status.charAt(0) + t.status.slice(1).toLowerCase(),
        rawStatus: t.status,
        priority: 'Medium',
        remarks: t.notes || '',
        timeline: [],
    };
}

/* ─── Trip Status Badge ─── */
function StatusBadge({ status }) {
    const cfg = {
        Draft: { color: '#888888', bg: 'rgba(255, 255, 255, 0.05)' },
        Dispatched: { color: '#00D2A0', bg: 'rgba(0, 210, 160, 0.1)' },
        'On Trip': { color: '#a78bff', bg: 'rgba(167, 139, 255, 0.1)' },
        Completed: { color: '#4F8CFF', bg: 'rgba(79, 140, 255, 0.1)' },
        Cancelled: { color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.1)' },
    };
    const s = cfg[status] || cfg.Draft;
    return (
        <span className="status-badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}25` }}>
            {status}
        </span>
    );
}

/* ─── Route Card Widget ─── */
function RouteCard({ source, destination, distance, eta }) {
    return (
        <div className="route-card-box">
            <div className="route-point">
                <MdLocationOn className="pin-origin" />
                <div>
                    <div className="point-lbl">Origin</div>
                    <div className="point-val">{source}</div>
                </div>
            </div>
            <div className="route-divider-line">
                <span className="route-dist-badge">{distance} km</span>
            </div>
            <div className="route-point">
                <MdLocationOn className="pin-dest" />
                <div>
                    <div className="point-lbl">Destination</div>
                    <div className="point-val">{destination}</div>
                </div>
            </div>
            <div className="route-eta-footer">
                <MdCalendarToday /> Estimated Arrival / ETA: <span className="eta-highlight">{eta}</span>
            </div>
        </div>
    );
}

/* ─── Trip Event Timeline ─── */
function TripTimelineList({ timeline }) {
    return (
        <div className="timeline-container">
            <h3 className="timeline-title"><MdTimeline /> Transactional Log & Dispatch Timeline</h3>
            <div className="timeline-flow">
                {timeline.map((evt, idx) => (
                    <div className="timeline-event" key={idx}>
                        <div className="timeline-badge-point" />
                        <div className="timeline-content-card">
                            <div className="timeline-header-line">
                                <span className="timeline-event-status">{evt.status}</span>
                                <span className="timeline-event-time">{evt.time}</span>
                            </div>
                            <p className="timeline-event-desc">{evt.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── View Trip Details Modal ─── */
function ViewTripModal({ trip, onClose }) {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box modal-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Trip Details Overview</h2>
                        <p className="modal-sub">ID: {trip.id} — Status: <StatusBadge status={trip.status} /></p>
                    </div>
                    <button className="modal-close" onClick={onClose}><MdClose /></button>
                </div>

                <div className="trip-modal-grid">
                    <div className="trip-modal-left">
                        <RouteCard
                            source={trip.source}
                            destination={trip.destination}
                            distance={trip.distance}
                            eta={trip.eta}
                        />

                        <div className="driver-vehicle-details-card">
                            <div className="mini-detail-row">
                                <MdDirectionsBus /> <strong>Assigned HMV:</strong> <span>{trip.vehicle}</span>
                            </div>
                            <div className="mini-detail-row">
                                <MdPerson /> <strong>Assigned Driver:</strong> <span>{trip.driver}</span>
                            </div>
                            <div className="mini-detail-row">
                                <MdScale /> <strong>Cargo Weight:</strong> <span>{trip.cargoWeight} kg ({trip.cargoType})</span>
                            </div>
                            <div className="mini-detail-row">
                                <MdCalendarToday /> <strong>Priority Level:</strong> <span>{trip.priority}</span>
                            </div>
                        </div>
                        {trip.remarks && (
                            <div className="remarks-box-show">
                                <strong>Remarks:</strong>
                                <p>{trip.remarks}</p>
                            </div>
                        )}
                    </div>

                    <div className="trip-modal-right">
                        <TripTimelineList timeline={trip.timeline} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Add/Edit Trip Modal Form ─── */
const DEFAULT_TRIP = {
    source: '', destination: '', vehicle: '', driver: '',
    cargoWeight: '', distance: '', startDate: '', estimatedArrival: '',
    priority: 'Medium', cargoType: 'Consumables', remarks: '', status: 'Draft'
};

function AddEditTripModal({ initial, onSave, onClose, vehicles = [], drivers = [] }) {
    const [form, setForm] = useState(initial || DEFAULT_TRIP);
    const isEdit = !!initial;

    const setField = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const handleSubmit = (actionType) => {
        if (!form.source || !form.destination || !form.vehicle || !form.driver) {
            alert('Please fill out Source, Destination, Vehicle and Driver.');
            return;
        }
        const finalStatus = actionType === 'dispatch' ? 'Dispatched' : form.status;
        const rightNow = new Date().toISOString().replace('T', ' ').substring(0, 16);

        // Auto populate timeline
        let timeline = form.timeline || [
            { status: 'Created', time: rightNow, desc: 'Trip logged and initial paperwork completed.' }
        ];
        if (actionType === 'dispatch' && !form.timeline?.some(t => t.status === 'Dispatched')) {
            timeline = [
                ...timeline,
                { status: 'Dispatched', time: rightNow, desc: 'Vehicle loaded and cleared exit gate.' }
            ];
        }

        onSave({ ...form, status: finalStatus, timeline });
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box modal-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{isEdit ? 'Edit Operational Route' : 'Create Logistics Trip'}</h2>
                        <p className="modal-sub">Create routes and assign personnel to shipments.</p>
                    </div>
                    <button className="modal-close" onClick={onClose}><MdClose /></button>
                </div>

                <div className="form-grid">
                    <div className="form-field">
                        <label>Source Location *</label>
                        <input type="text" placeholder="e.g. Mumbai Port" value={form.source} onChange={e => setField('source', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Destination Location *</label>
                        <input type="text" placeholder="e.g. Delhi Depot" value={form.destination} onChange={e => setField('destination', e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Select Vehicle *</label>
                        <select value={form.vehicle} onChange={e => setField('vehicle', e.target.value)}>
                            <option value="">-- Choose Vehicle --</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.registration_number} ({v.name_model})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Select Driver *</label>
                        <select value={form.driver} onChange={e => setField('driver', e.target.value)}>
                            <option value="">-- Choose Driver --</option>
                            {drivers.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.license_number})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Cargo Weight (kg)</label>
                        <input type="number" value={form.cargoWeight} onChange={e => setField('cargoWeight', parseInt(e.target.value) || '')} />
                    </div>

                    <div className="form-field">
                        <label>Cargo Type</label>
                        <select value={form.cargoType} onChange={e => setField('cargoType', e.target.value)}>
                            {cargoTypes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Distance (km)</label>
                        <input type="number" value={form.distance} onChange={e => setField('distance', parseInt(e.target.value) || '')} />
                    </div>

                    <div className="form-field">
                        <label>Priority</label>
                        <select value={form.priority} onChange={e => setField('priority', e.target.value)}>
                            {tripPriorities.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Start Date / Time</label>
                        <input type="datetime-local" value={form.startDate ? form.startDate.replace(' ', 'T') : ''} onChange={e => setField('startDate', e.target.value.replace('T', ' '))} />
                    </div>

                    <div className="form-field">
                        <label>Estimated Arrival / ETA</label>
                        <input type="datetime-local" value={form.estimatedArrival ? form.estimatedArrival.replace(' ', 'T') : ''} onChange={e => setField('estimatedArrival', e.target.value.replace('T', ' '))} />
                    </div>

                    <div className="form-field form-full">
                        <label>Remarks & Internal Directives</label>
                        <textarea rows={2} value={form.remarks} onChange={e => setField('remarks', e.target.value)} />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn-secondary" onClick={() => handleSubmit('draft')}>Save as Draft</button>
                    <button className="btn-primary" onClick={() => handleSubmit('dispatch')}>Dispatch Row</button>
                </div>
            </div>
        </div>
    );
}

export default function TripManagement({ onNavigate }) {
    const [trips, setTrips]       = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]         = useState('');
    const [statusFilter, setStatusFilter]   = useState('All');
    const [vehicleFilter, setVehicleFilter] = useState('All');
    const [driverFilter, setDriverFilter]   = useState('All');

    const [viewTrip, setViewTrip]   = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTrip, setEditTrip]   = useState(null);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [t, v, d] = await Promise.all([
                tripsApi.list(),
                vehiclesApi.list(),
                driversApi.list(),
            ]);
            setTrips(t.map(toUI));
            setVehicles(v);
            setDrivers(d);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchAll(); }, []);

    const stats = useMemo(() => ({
        active:    trips.filter(t => t.rawStatus === 'DISPATCHED').length,
        completed: trips.filter(t => t.rawStatus === 'COMPLETED').length,
        pending:   trips.filter(t => t.rawStatus === 'DRAFT').length,
        cancelled: trips.filter(t => t.rawStatus === 'CANCELLED').length,
        total:     trips.length,
    }), [trips]);

    const handleDispatch = async (id) => {
        try {
            await tripsApi.update(id, { status: 'DISPATCHED' });
            fetchAll();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleComplete = async (id) => {
        try {
            await tripsApi.complete(id, { end_odometer: 0 });
            fetchAll();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleCancelTrip = async (id) => {
        try {
            await tripsApi.update(id, { status: 'CANCELLED' });
            fetchAll();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleCreate = async (data) => {
        try {
            await tripsApi.dispatch({
                origin: data.source,
                destination: data.destination,
                vehicle_id: data.vehicle,
                driver_id: data.driver,
                cargo_weight_kg: parseFloat(data.cargoWeight) || 0,
                cargo_type: data.cargoType,
                distance_km: parseFloat(data.distance) || 0,
                start_time: data.startDate,
                estimated_arrival: data.estimatedArrival,
                notes: data.remarks,
            });
            setModalOpen(false);
            fetchAll();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleEditSave = async (data) => {
        try {
            await tripsApi.update(editTrip.id, {
                origin: data.source,
                destination: data.destination,
                notes: data.remarks,
            });
            setEditTrip(null);
            fetchAll();
        } catch (e) { alert('Error: ' + e.message); }
    };



    const handleRefresh = () => {
        setSearch('');
        setStatusFilter('All');
        setVehicleFilter('All');
        setDriverFilter('All');
    };

    // Filter pipeline
    const filteredTrips = useMemo(() => {
        return trips.filter(t => {
            const matchSearch = t.id.toLowerCase().includes(search.toLowerCase()) ||
                t.source.toLowerCase().includes(search.toLowerCase()) ||
                t.destination.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === 'All' || t.status === statusFilter;
            const matchVehicle = vehicleFilter === 'All' || t.vehicle === vehicleFilter;
            const matchDriver = driverFilter === 'All' || t.driver === driverFilter;
            return matchSearch && matchStatus && matchVehicle && matchDriver;
        });
    }, [trips, search, statusFilter, vehicleFilter, driverFilter]);

    return (
        <div className="trip-page">
            <Navbar onNavigate={onNavigate} />

            <div className="trip-container">
                {/* Header */}
                <div className="trip-header">
                    <div>
                        <h1 className="trip-title">Trip Management</h1>
                        <p className="trip-sub">Create, dispatch, and track active transport operations on long-haul routes.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setModalOpen(true)}>
                        <MdAdd /> Create Trip
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="trip-stats-grid">
                    <div className="stat-box" style={{ '--accent-color': '#a78bff' }}>
                        <div className="stat-num">{stats.active}</div>
                        <div className="stat-title">Active / Dispatched</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#00D2A0' }}>
                        <div className="stat-num">{stats.completed}</div>
                        <div className="stat-title">Completed</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#888888' }}>
                        <div className="stat-num">{stats.pending}</div>
                        <div className="stat-title">Pending Drafts</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#FF6B6B' }}>
                        <div className="stat-num">{stats.cancelled}</div>
                        <div className="stat-title">Cancelled</div>
                    </div>
                    <div className="stat-box" style={{ '--accent-color': '#4F8CFF' }}>
                        <div className="stat-num">{stats.total}</div>
                        <div className="stat-title">Total Operations</div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="trip-toolbar">
                    <div className="toolbar-left">
                        <div className="search-wrap">
                            <MdSearch className="search-ic" />
                            <input
                                type="text"
                                placeholder="Search trip ID, source, route..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="filter-wrap">
                            <MdFilterList className="filter-ic" />
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="All">All statuses</option>
                                {tripStatuses.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="filter-wrap">
                            <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}>
                                <option value="All">All vehicles</option>
                                {Array.from(new Set(trips.map(t => t.vehicle))).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="filter-wrap">
                            <select value={driverFilter} onChange={e => setDriverFilter(e.target.value)}>
                                <option value="All">All drivers</option>
                                {Array.from(new Set(trips.map(t => t.driver))).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="toolbar-right">
                        <button className="btn-icon" title="Clear Filters" onClick={handleRefresh}><MdRefresh /></button>
                    </div>
                </div>

                {/* Main Content List / Table */}
                <div className="table-card">
                    {filteredTrips.length === 0 ? (
                        <div className="empty-state-card">
                            <h3>No dispatch paths match filters</h3>
                            <p>Try resetting filters or generate a fresh operational trip.</p>
                            <button className="btn-primary" onClick={() => setModalOpen(true)}>Create Trip</button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="trip-table-element">
                                <thead>
                                    <tr>
                                        <th>Trip ID</th>
                                        <th>Vehicle</th>
                                        <th>Driver Assigned</th>
                                        <th>Source Route</th>
                                        <th>Destination Route</th>
                                        <th>Cargo Weight</th>
                                        <th>Distance</th>
                                        <th>ETA</th>
                                        <th>Status</th>
                                        <th className="actions-header">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTrips.map(trip => (
                                        <tr key={trip.id} className="trip-tr">
                                            <td className="trip-id-cell">{trip.id}</td>
                                            <td>
                                                <span className="v-tag">{trip.vehicle}</span>
                                            </td>
                                            <td>
                                                <span className="d-tag"><MdPerson /> {trip.driver}</span>
                                            </td>
                                            <td>{trip.source}</td>
                                            <td>{trip.destination}</td>
                                            <td>{trip.cargoWeight} kg</td>
                                            <td>{trip.distance} km</td>
                                            <td>{trip.eta}</td>
                                            <td><StatusBadge status={trip.status} /></td>
                                            <td>
                                                <div className="actions-dropdown">
                                                    <button className="btn-action-round view" onClick={() => setViewTrip(trip)} title="View Summary"><MdVisibility /></button>
                                                    <button className="btn-action-round edit" onClick={() => setEditTrip(trip)} title="Edit Configuration"><MdEdit /></button>
                                                    {trip.status === 'Draft' && (
                                                        <button className="btn-action-round activate" onClick={() => handleDispatch(trip.id)} title="Dispatch Unit"><MdPlayArrow /></button>
                                                    )}
                                                    {trip.status === 'Dispatched' && (
                                                        <button className="btn-action-round activate" onClick={() => handleComplete(trip.id)} title="Complete Trip"><MdCheckCircle /></button>
                                                    )}
                                                    {trip.status !== 'Completed' && trip.status !== 'Cancelled' && (
                                                        <button className="btn-action-round delete" onClick={() => handleCancelTrip(trip.id)} title="Cancel Route"><MdCancel /></button>
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

            {/* Modals & timelines */}
            {viewTrip && <ViewTripModal trip={viewTrip} onClose={() => setViewTrip(null)} />}
            {(modalOpen || editTrip) && (
                <AddEditTripModal
                    initial={editTrip}
                    onSave={editTrip ? handleEditSave : handleCreate}
                    onClose={() => { setModalOpen(false); setEditTrip(null); }}
                    vehicles={vehicles}
                    drivers={drivers}
                />
            )}
        </div>
    );
}
