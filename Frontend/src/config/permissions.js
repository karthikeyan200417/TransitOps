// Central site permissions — maps BACKEND role names to accessible page keys
export const rolePermissions = {
    'ADMIN':             ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel', 'analytics'],
    'FLEET_MANAGER':     ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel', 'analytics'],
    'DISPATCHER':        ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel'],
    'SAFETY_OFFICER':    ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'analytics'],
    'FINANCIAL_ANALYST': ['dashboard', 'trips', 'fuel', 'analytics'],
};

export const defaultHomePages = {
    'ADMIN':             'dashboard',
    'FLEET_MANAGER':     'dashboard',
    'DISPATCHER':        'dashboard',
    'SAFETY_OFFICER':    'dashboard',
    'FINANCIAL_ANALYST': 'dashboard',
};
