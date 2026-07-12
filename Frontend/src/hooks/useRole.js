import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { rolePermissions } from '../config/permissions';

export function useRole() {
    const { user } = useContext(AuthContext);

    const hasPermission = (pageKey) => {
        if (!user) return false;
        const permissions = rolePermissions[user.role] || [];
        // Lowercase to avoid casing mismatches
        return permissions.includes(pageKey.toLowerCase());
    };

    return {
        user,
        role: user ? user.role : null,
        hasPermission
    };
}
