// Mock data for Maintenance Module
export const mockMaintenances = [
    {
        id: 'MNT-401',
        vehicle: 'TRK-11',
        maintenanceType: 'Preventive Servicing',
        priority: 'Medium',
        description: 'Scheduled multi-point inspection, coolant flush, and transmission fluid replacement.',
        mechanic: 'Rajinder Kumar',
        garage: 'Metro Fleet Workshop (New Delhi)',
        estimatedCost: 15400, // INR
        actualCost: 15400,
        startDate: '2026-07-10',
        expectedCompletion: '2026-07-12',
        endDate: '2026-07-12',
        status: 'Completed',
        notes: 'Everything is in perfect working order. Next service scheduled in 10,000 km.'
    },
    {
        id: 'MNT-402',
        vehicle: 'VAN-05',
        maintenanceType: 'Brake Overhaul',
        priority: 'High',
        description: 'Front brake pad replacement, rotor turning, and brake lines inspection.',
        mechanic: 'Amit Gowda',
        garage: 'Bangalore East Garage',
        estimatedCost: 8500,
        actualCost: 0,
        startDate: '2026-07-12',
        expectedCompletion: '2026-07-13',
        endDate: '',
        status: 'In Progress',
        notes: 'Parts ordered. Pads replacement currently hanging on delivery.'
    },
    {
        id: 'MNT-403',
        vehicle: 'MINI-03',
        maintenanceType: 'Engine Tuning',
        priority: 'Critical',
        description: 'Engine misfire inspection and spark plugs replacement.',
        mechanic: 'Vijay Deshmukh',
        garage: 'Pune Auto Hub',
        estimatedCost: 12000,
        actualCost: 0,
        startDate: '2026-07-14',
        expectedCompletion: '2026-07-15',
        endDate: '',
        status: 'Scheduled',
        notes: 'Scheduled for Tuesday morning slot.'
    },
    {
        id: 'MNT-404',
        vehicle: 'TRK-09',
        maintenanceType: 'Tire Replacement',
        priority: 'Low',
        description: 'Rotating all wheels and replacing two rear tires.',
        mechanic: 'Amit Gowda',
        garage: 'Bangalore East Garage',
        estimatedCost: 28000,
        actualCost: 29500,
        startDate: '2026-07-08',
        expectedCompletion: '2026-07-09',
        endDate: '2026-07-09',
        status: 'Completed',
        notes: 'Rear tires replaced. Minor wheel alignment correction added.'
    },
    {
        id: 'MNT-405',
        vehicle: 'VAN-09',
        maintenanceType: 'Electrical Repair',
        priority: 'High',
        description: 'Alternator replacement and wiring diagnostic due to battery drain issues.',
        mechanic: 'Vijay Deshmukh',
        garage: 'Pune Auto Hub',
        estimatedCost: 6500,
        actualCost: 0,
        startDate: '2026-07-11',
        expectedCompletion: '2026-07-13',
        endDate: '',
        status: 'In Progress',
        notes: 'Alternator removed. Testing replacement unit.'
    }
];

export const maintenanceTypes = ['Preventive Servicing', 'Brake Overhaul', 'Engine Tuning', 'Tire Replacement', 'Electrical Repair', 'Suspension Work'];
export const maintenanceStatuses = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];
export const maintenancePriorities = ['Low', 'Medium', 'High', 'Critical'];
export const mechanicsList = ['Rajinder Kumar', 'Amit Gowda', 'Vijay Deshmukh', 'Karan Johar'];
export const garagesList = ['Metro Fleet Workshop (New Delhi)', 'Bangalore East Garage', 'Pune Auto Hub', 'Mumbai Fleet Yard'];
