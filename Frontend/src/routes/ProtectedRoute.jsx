import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

export default function ProtectedRoute({ children, pageKey, triggerToast }) {
    const { user, hasPermission } = useRole();
    const location = useLocation();

    useEffect(() => {
        if (user && !hasPermission(pageKey)) {
            triggerToast("You do not have permission to access this page.");
        }
    }, [user, pageKey, hasPermission, triggerToast]);

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!hasPermission(pageKey)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
