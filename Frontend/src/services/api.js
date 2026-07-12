/**
 * api.js — Central API client for TransitOps
 * All requests go through the Vite proxy to http://localhost:8000
 */

const BASE = '/api/v1';

// ── Token helpers ────────────────────────────────────────────────────────────
export const getToken  = () => localStorage.getItem('transitops_token');
const setToken  = (t) => localStorage.setItem('transitops_token', t);
export const clearToken = () => localStorage.removeItem('transitops_token');

// ── Core fetch wrapper ───────────────────────────────────────────────────────
async function request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);

    if (res.status === 401) {
        clearToken();
        localStorage.removeItem('transitops_user');
        window.location.href = '/login';
        return;
    }

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || `Error ${res.status}`);
    }
    return data;
}

const get    = (path)         => request('GET',    path);
const post   = (path, body)   => request('POST',   path, body);
const put    = (path, body)   => request('PUT',    path, body);
const del    = (path)         => request('DELETE', path);

// ── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
    login:   (email, password) => post('/auth/login', { email, password }),
    logout:  ()                => post('/auth/logout'),
    profile: ()                => get('/auth/profile'),
};

// ── VEHICLES ──────────────────────────────────────────────────────────────────
export const vehiclesApi = {
    list:   (status)   => get(`/vehicles${status ? `?status=${status}` : ''}`),
    get:    (id)       => get(`/vehicles/${id}`),
    create: (data)     => post('/vehicles', data),
    update: (id, data) => put(`/vehicles/${id}`, data),
    delete: (id)       => del(`/vehicles/${id}`),
};

// ── DRIVERS ───────────────────────────────────────────────────────────────────
export const driversApi = {
    list:   (status)   => get(`/drivers${status ? `?status=${status}` : ''}`),
    get:    (id)       => get(`/drivers/${id}`),
    create: (data)     => post('/drivers', data),
    update: (id, data) => put(`/drivers/${id}`, data),
    delete: (id)       => del(`/drivers/${id}`),
};

// ── TRIPS ─────────────────────────────────────────────────────────────────────
export const tripsApi = {
    list:     (status)   => get(`/trips${status ? `?status=${status}` : ''}`),
    get:      (id)       => get(`/trips/${id}`),
    dispatch: (data)     => post('/trips/dispatch', data),
    update:   (id, data) => put(`/trips/${id}`, data),
    complete: (id, data) => post(`/trips/${id}/complete`, data),
};

// ── MAINTENANCE ───────────────────────────────────────────────────────────────
export const maintenanceApi = {
    list:   (vehicleId) => get(`/maintenance${vehicleId ? `?vehicle_id=${vehicleId}` : ''}`),
    get:    (id)        => get(`/maintenance/${id}`),
    create: (data)      => post('/maintenance', data),
    update: (id, data)  => put(`/maintenance/${id}`, data),
};

// ── FUEL LOGS ─────────────────────────────────────────────────────────────────
export const fuelApi = {
    list:   (vehicleId) => get(`/fuel${vehicleId ? `?vehicle_id=${vehicleId}` : ''}`),
    get:    (id)        => get(`/fuel/${id}`),
    create: (data)      => post('/fuel', data),
};

// ── EXPENSES ──────────────────────────────────────────────────────────────────
export const expensesApi = {
    list:   (vehicleId, tripId) => {
        const params = new URLSearchParams();
        if (vehicleId) params.append('vehicle_id', vehicleId);
        if (tripId)    params.append('trip_id', tripId);
        const q = params.toString();
        return get(`/expenses${q ? `?${q}` : ''}`);
    },
    get:    (id)       => get(`/expenses/${id}`),
    create: (data)     => post('/expenses', data),
    update: (id, data) => put(`/expenses/${id}`, data),
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
    get: () => get('/dashboard'),
};

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
    fleetUtilization: () => get('/analytics/fleet-utilization'),
    fuelEfficiency:   () => get('/analytics/fuel-efficiency'),
    expenses:         () => get('/analytics/expenses'),
    maintenance:      () => get('/analytics/maintenance'),
    trips:            () => get('/analytics/trips'),
};

// ── AUDIT ─────────────────────────────────────────────────────────────────────
export const auditApi = {
    list: (tableName, action, limit = 100) => {
        const params = new URLSearchParams({ limit });
        if (tableName) params.append('table_name', tableName);
        if (action)    params.append('action', action);
        return get(`/audit?${params.toString()}`);
    },
};
