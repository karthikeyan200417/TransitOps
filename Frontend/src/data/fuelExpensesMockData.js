// Mock data for Fuel Logs and operational expenses
export const mockFuelLogs = [
    {
        id: 'FL-601',
        vehicle: 'TRK-11',
        driver: 'Vikram Singh',
        fuelStation: 'Indian Oil (Highway Ext)',
        litres: 120,
        cost: 11400, // INR
        odometer: 48500, // km
        date: '2026-07-10',
        notes: 'Full tank refuel. Average fuel consumption satisfactory.'
    },
    {
        id: 'FL-602',
        vehicle: 'VAN-05',
        driver: 'Aarav Sharma',
        fuelStation: 'HP Petrol Pump (Noida)',
        litres: 45,
        cost: 4275,
        odometer: 32150,
        date: '2026-07-11',
        notes: 'Half tank top-up.'
    },
    {
        id: 'FL-603',
        vehicle: 'MINI-03',
        driver: 'Arjun Nair',
        fuelStation: 'Shell Outlet (Pune Route)',
        litres: 55,
        cost: 5775,
        odometer: 18940,
        date: '2026-07-12',
        notes: 'Premium diesel fuel.'
    }
];

export const mockExpenses = [
    {
        id: 'EXP-801',
        expenseType: 'Toll Charges',
        vehicle: 'TRK-11',
        amount: 1450, // INR
        date: '2026-07-10',
        approvedBy: 'Raven K. (Dispatcher)',
        status: 'Approved',
        description: 'NH44 Interstate highway automated toll plaza debit.',
        receiptUrl: 'toll_receipt_mumbai_delhi.pdf'
    },
    {
        id: 'EXP-802',
        expenseType: 'Insurance Premium',
        vehicle: 'VAN-09',
        amount: 45000,
        date: '2026-07-05',
        approvedBy: 'Devendra P. (Fleet Lead)',
        status: 'Approved',
        description: 'Annual comprehensive vehicle asset insurance renewal.',
        receiptUrl: 'insurance_policy_van09.pdf'
    },
    {
        id: 'EXP-803',
        expenseType: 'Miscellaneous',
        vehicle: 'MINI-03',
        amount: 850,
        date: '2026-07-11',
        approvedBy: 'Pending Decision',
        status: 'Pending',
        description: 'Emergency flat tire puncture repair charges at local vendor.',
        receiptUrl: ''
    }
];

export const expenseCategories = ['Toll Charges', 'Insurance Premium', 'Driver Allowance', 'Fines / Violations', 'Miscellaneous'];
export const expenseStatuses = ['All', 'Approved', 'Pending', 'Rejected'];
export const fuelStationsList = ['Indian Oil (Highway Ext)', 'HP Petrol Pump (Noida)', 'Shell Outlet (Pune Route)', 'BPCL Depot (Mumbai)'];
export const expenseApprovedList = ['Raven K. (Dispatcher)', 'Devendra P. (Fleet Lead)', 'Arpit S. (Finance Manager)'];
export const tabOptions = ['Fuel Logs', 'Expenses'];
