// Central site permissions — maps BACKEND role names to accessible page keys
export const rolePermissions = {
    'ADMIN':             ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel', 'analytics', 'settings'],
    'FLEET_MANAGER':     ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel', 'analytics', 'settings'],
    'DISPATCHER':        ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel', 'settings'],
    'SAFETY_OFFICER':    ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'analytics', 'settings'],
    'FINANCIAL_ANALYST': ['dashboard', 'trips', 'fuel', 'analytics', 'settings'],
};

export const defaultHomePages = {
    'ADMIN':             'dashboard',
    'FLEET_MANAGER':     'dashboard',
    'DISPATCHER':        'dashboard',
    'SAFETY_OFFICER':    'dashboard',
    'FINANCIAL_ANALYST': 'dashboard',
};
