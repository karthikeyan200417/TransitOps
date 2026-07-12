// Dummy data for the TransitOps dashboard

export const kpiData = [
    { id: 1, title: 'Active Vehicles', value: '53', trend: '+12%', trendUp: true, icon: 'truck', color: '#6D4AFF' },
    { id: 2, title: 'Available Vehicles', value: '42', trend: '+5%', trendUp: true, icon: 'check-circle', color: '#4F8CFF' },
    { id: 3, title: 'In Maintenance', value: '05', trend: '-2%', trendUp: false, icon: 'tool', color: '#FF9F43' },
    { id: 4, title: 'Active Trips', value: '18', trend: '+8%', trendUp: true, icon: 'map-pin', color: '#6D4AFF' },
    { id: 5, title: 'Pending Trips', value: '09', trend: '-3%', trendUp: false, icon: 'clock', color: '#4F8CFF' },
    { id: 6, title: 'Drivers On Duty', value: '26', trend: '+4%', trendUp: true, icon: 'users', color: '#00D2A0' },
    { id: 7, title: 'Fleet Utilization', value: '81%', trend: '+6%', trendUp: true, icon: 'pie-chart', color: '#FF6B9D' },
];

export const recentTrips = [
    { id: 'TR001', vehicle: 'VAN-05', driver: 'Alex R.', status: 'On Trip', eta: '45 min' },
    { id: 'TR002', vehicle: 'TRK-12', driver: 'John M.', status: 'Completed', eta: '—' },
    { id: 'TR003', vehicle: 'MINI-08', driver: 'Priya S.', status: 'Dispatched', eta: 'In 10m' },
    { id: 'TR004', vehicle: '—', driver: '—', status: 'Draft', eta: 'Awaiting vehicle' },
    { id: 'TR005', vehicle: 'BUS-03', driver: 'Karan T.', status: 'On Trip', eta: '1h 20m' },
    { id: 'TR006', vehicle: 'VAN-11', driver: 'Meera N.', status: 'Cancelled', eta: '—' },
];

export const vehicleStatus = [
    { label: 'Available', value: 70, color: '#00D2A0' },
    { label: 'On Trip', value: 30, color: '#4F8CFF' },
    { label: 'In Shop', value: 10, color: '#FF9F43' },
    { label: 'Retired', value: 5, color: '#FF6B9D' },
];

export const activityTimeline = [
    { id: 1, icon: 'truck', text: 'Vehicle VAN-05 added to fleet', time: '2 min ago', color: '#6D4AFF' },
    { id: 2, icon: 'map-pin', text: 'Trip TR003 dispatched to Priya S.', time: '15 min ago', color: '#4F8CFF' },
    { id: 3, icon: 'tool', text: 'Maintenance completed on TRK-09', time: '1 hr ago', color: '#FF9F43' },
    { id: 4, icon: 'droplet', text: 'Fuel log updated — BUS-03 refueled', time: '2 hrs ago', color: '#00D2A0' },
    { id: 5, icon: 'user-check', text: 'Driver Meera N. clocked in', time: '3 hrs ago', color: '#FF6B9D' },
];

export const fuelChartData = [
    { month: 'Jan', liters: 3200 },
    { month: 'Feb', liters: 2800 },
    { month: 'Mar', liters: 3600 },
    { month: 'Apr', liters: 3100 },
    { month: 'May', liters: 4100 },
    { month: 'Jun', liters: 3800 },
    { month: 'Jul', liters: 4400 },
];

export const tripStatusPie = [
    { label: 'Completed', value: 45, color: '#00D2A0' },
    { label: 'On Trip', value: 25, color: '#6D4AFF' },
    { label: 'Dispatched', value: 15, color: '#4F8CFF' },
    { label: 'Cancelled', value: 10, color: '#FF6B9D' },
    { label: 'Draft', value: 5, color: '#888' },
];

export const filterOptions = {
    vehicleType: ['All', 'Van', 'Truck', 'Bus', 'Mini'],
    status: ['All', 'Active', 'Inactive', 'In Maintenance'],
    region: ['All', 'North', 'South', 'East', 'West'],
};
