// Mock data for Trip Management
export const mockTrips = [
    {
        id: 'TRP-1001',
        vehicle: 'TRK-11',
        driver: 'Vikram Singh',
        source: 'Warehouse Alpha (Mumbai)',
        destination: 'Distribution Center (Delhi)',
        cargoWeight: 14500, // kg
        cargoType: 'Industrial Equipment',
        distance: 1420, // km
        eta: '2026-07-14 18:30',
        status: 'On Trip',
        startDate: '2026-07-12 06:00',
        estimatedArrival: '2026-07-14 18:00',
        priority: 'High',
        remarks: 'Time-critical shipment. Fragile load.',
        timeline: [
            { status: 'Created', time: '2026-07-11 15:30', desc: 'Trip logged and initial paperwork completed.' },
            { status: 'Dispatched', time: '2026-07-12 05:45', desc: 'Vehicle loaded and cleared exit gate.' },
            { status: 'On Trip', time: '2026-07-12 06:00', desc: 'Journey coordinates tracked online.' }
        ]
    },
    {
        id: 'TRP-1002',
        vehicle: 'VAN-09',
        driver: 'Gurpreet Singh',
        source: 'Hub 1 (Pune)',
        destination: 'Retail Depot (Mumbai)',
        cargoWeight: 1100, // kg
        cargoType: 'Consumables',
        distance: 150,
        eta: '2026-07-12 16:45',
        status: 'Dispatched',
        startDate: '2026-07-12 13:00',
        estimatedArrival: '2026-07-12 16:30',
        priority: 'Medium',
        remarks: 'Routine supply run.',
        timeline: [
            { status: 'Created', time: '2026-07-12 10:00', desc: 'Cargo check completed.' },
            { status: 'Dispatched', time: '2026-07-12 13:00', desc: 'Dispatched from Pune Hub.' }
        ]
    },
    {
        id: 'TRP-1003',
        vehicle: 'VAN-05',
        driver: 'Aarav Sharma',
        source: 'Central Stores (Gurgaon)',
        destination: 'Noida Hub Mall',
        cargoWeight: 800,
        cargoType: 'Electronics',
        distance: 55,
        eta: '2026-07-11 11:30',
        status: 'Completed',
        startDate: '2026-07-11 09:00',
        estimatedArrival: '2026-07-11 11:00',
        priority: 'High',
        remarks: 'Completed on schedule without incidents.',
        timeline: [
            { status: 'Created', time: '2026-07-10 16:00', desc: 'Trip initialized.' },
            { status: 'Dispatched', time: '2026-07-11 09:00', desc: 'Left warehouse.' },
            { status: 'Reached', time: '2026-07-11 10:45', desc: 'Arrived at destination zone.' },
            { status: 'Completed', time: '2026-07-11 11:15', desc: 'Goods unloaded and verified.' }
        ]
    },
    {
        id: 'TRP-1004',
        vehicle: 'BUS-01',
        driver: 'Kabir Mehta',
        source: 'Transit Terminus A',
        destination: 'Corporate Park B',
        cargoWeight: 0,
        cargoType: 'Passengers',
        distance: 40,
        eta: '2026-07-12 17:30',
        status: 'Draft',
        startDate: '2026-07-12 16:30',
        estimatedArrival: '2026-07-12 17:30',
        priority: 'Medium',
        remarks: 'Evening shuttle service run.',
        timeline: [
            { status: 'Created', time: '2026-07-12 14:00', desc: 'Trip template loaded.' }
        ]
    },
    {
        id: 'TRP-1005',
        vehicle: 'TRK-14',
        driver: 'Arjun Nair',
        source: 'Port Terminal 3 (Chennai)',
        destination: 'Factory Yard (Bangalore)',
        cargoWeight: 19800,
        cargoType: 'Auto Parts',
        distance: 350,
        eta: '—',
        status: 'Cancelled',
        startDate: '2026-07-10 08:00',
        estimatedArrival: '2026-07-10 18:00',
        priority: 'Low',
        remarks: 'Cancelled due to vehicle maintenance requirement.',
        timeline: [
            { status: 'Created', time: '2026-07-09 11:00', desc: 'Scheduled.' },
            { status: 'Cancelled', time: '2026-07-10 07:30', desc: 'Cancelled by Dispatcher.' }
        ]
    }
];

export const tripStatuses = ['All', 'Draft', 'Dispatched', 'On Trip', 'Completed', 'Cancelled'];
export const cargoTypes = ['Industrial Equipment', 'Consumables', 'Electronics', 'Chemicals', 'Passengers', 'Cold Chain'];
export const tripPriorities = ['Low', 'Medium', 'High', 'Critical'];
