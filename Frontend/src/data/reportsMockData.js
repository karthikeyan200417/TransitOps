// Mock data for Executive Reports & Analytics Module
export const mockAnalyticsData = {
    utilization: {
        labels: ['Active Dispatch', 'Available / Standby', 'In Maintenance', 'Suspended'],
        values: [55, 30, 10, 5],
        colors: ['#6D4AFF', '#00D2A0', '#FF9F43', '#FF6B6B']
    },
    fuelConsumption: [
        { month: 'Jan', fuelCost: 280000, mileage: 8.2 },
        { month: 'Feb', fuelCost: 310000, mileage: 8.5 },
        { month: 'Mar', fuelCost: 290000, mileage: 8.4 },
        { month: 'Apr', fuelCost: 340000, mileage: 8.7 },
        { month: 'May', fuelCost: 380000, mileage: 8.6 },
        { month: 'Jun', fuelCost: 410000, mileage: 8.9 }
    ],
    monthlyExpenses: [
        { category: 'Fuel Refills', amount: 410000, color: '#6D4AFF' },
        { category: 'Maintenance Repair', amount: 89000, color: '#FF9F43' },
        { category: 'Toll debits', amount: 34000, color: '#4F8CFF' },
        { category: 'Asset Insurance', amount: 45000, color: '#00D2A0' },
        { category: 'Driver Allowances', amount: 72000, color: '#a78bff' }
    ],
    mileages: [
        { vehicle: 'VAN-05', mileage: 12.4 },
        { vehicle: 'MINI-03', mileage: 9.8 },
        { vehicle: 'VAN-09', mileage: 8.9 },
        { vehicle: 'TRK-11', mileage: 6.5 },
        { vehicle: 'TRK-09', mileage: 5.7 }
    ],
    leaderboardDrivers: [
        { rank: 1, name: 'Rohan Deshmukh', score: 95, trips: 42, activeDays: 28 },
        { rank: 2, name: 'Aarav Sharma', score: 92, trips: 38, activeDays: 27 },
        { rank: 3, name: 'Gurpreet Singh', score: 91, trips: 45, activeDays: 29 },
        { rank: 4, name: 'Vikram Singh', score: 88, trips: 35, activeDays: 26 },
        { rank: 5, name: 'Arjun Nair', score: 82, trips: 22, activeDays: 14 }
    ],
    leaderboardVehicles: [
        { rank: 1, regNumber: 'VAN-05', type: 'Van', utilizationHrs: 280, distanceCovered: 4200 },
        { rank: 2, regNumber: 'TRK-11', type: 'Truck', utilizationHrs: 260, distanceCovered: 9800 },
        { rank: 3, regNumber: 'MINI-03', type: 'Minivan', utilizationHrs: 220, distanceCovered: 3100 },
        { rank: 4, regNumber: 'TRK-09', type: 'Truck', utilizationHrs: 190, distanceCovered: 6400 }
    ]
};

export const documentReports = [
    { id: 'REP-01', title: 'Monthly Fleet Utilization Summary', format: 'PDF', date: '2026-07-01', author: 'Raven K.' },
    { id: 'REP-02', title: 'Operational Expenditure & Fuel Report', format: 'CSV', date: '2026-07-02', author: 'Arpit S.' },
    { id: 'REP-03', title: 'Driver Behavior & Safety Metrics Ledger', format: 'PDF', date: '2026-07-05', author: 'Devendra P.' },
    { id: 'REP-04', title: 'Preventive Maintenance Cycle Analysis', format: 'PDF', date: '2026-07-08', author: 'Raven K.' }
];
