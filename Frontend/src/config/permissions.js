// Central site permissions configuration mapping user roles to page keys
export const rolePermissions = {
    'Fleet Manager': ['dashboard', 'fleet', 'maintenance'],
    'Dispatcher': ['dashboard', 'trips'],
    'Safety Officer': ['dashboard', 'drivers'],
    'Financial Analyst': ['dashboard', 'fuel', 'analytics']
};

export const defaultHomePages = {
    'Fleet Manager': 'dashboard',
    'Dispatcher': 'dashboard',
    'Safety Officer': 'dashboard',
    'Financial Analyst': 'dashboard'
};
