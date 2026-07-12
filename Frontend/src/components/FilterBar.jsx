import React, { useState } from 'react';
import { MdFilterList } from 'react-icons/md';
import './FilterBar.css';

const filterOptions = {
    vehicleType: ['All', 'Van', 'Truck', 'Bus', 'Mini', 'Heavy'],
    status:      ['All', 'Available', 'On Trip', 'In Shop', 'Retired'],
    region:      ['All', 'North', 'South', 'East', 'West'],
};


export default function FilterBar() {
    const [vehicleType, setVehicleType] = useState('All');
    const [status, setStatus] = useState('All');
    const [region, setRegion] = useState('All');

    return (
        <div className="filter-bar">
            <div className="filter-label">
                <MdFilterList />
                <span>Filters</span>
            </div>
            <div className="filter-controls">
                <div className="filter-select-wrap">
                    <label>Vehicle Type</label>
                    <select value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                        {filterOptions.vehicleType.map(o => <option key={o}>{o}</option>)}
                    </select>
                </div>
                <div className="filter-select-wrap">
                    <label>Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)}>
                        {filterOptions.status.map(o => <option key={o}>{o}</option>)}
                    </select>
                </div>
                <div className="filter-select-wrap">
                    <label>Region</label>
                    <select value={region} onChange={e => setRegion(e.target.value)}>
                        {filterOptions.region.map(o => <option key={o}>{o}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}
