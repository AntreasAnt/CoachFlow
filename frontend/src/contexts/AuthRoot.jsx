// AuthRoot component that handles authorization and route protection
// children: components to render if authorization passes
// allowedPrivileges: array of privileges that can access this route, defaults to ['admin']

import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BACKEND_ROUTES_API } from "../config/config";

const AuthRoot = ({ children, allowedPrivileges = ['admin'], requireLogout = false }) => {
    const [userPrivilege, setUserPrivilege] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyPrivilege = async () => {
            try {
                const response = await fetch(
                    BACKEND_ROUTES_API + "VerifyPrivilage.php",
                    {
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json'
                        }
                    }
                );
                const data = await response.json();
                console.log('Response data:', data);
                setUserPrivilege(data.privileges);
            } catch (error) {
                console.error('Privilege verification failed:', error);
                setUserPrivilege(null);
            } finally {
                setLoading(false);
            }
        };
        verifyPrivilege();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    // For pages that require user to be logged out (like signup, login)
    if (requireLogout) {
        return userPrivilege === 'loggedout' ? children : <Navigate to="/" replace />;
    }

    // For protected pages (requiring login with specific privileges)
    if (!userPrivilege || !allowedPrivileges.includes(userPrivilege)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AuthRoot;