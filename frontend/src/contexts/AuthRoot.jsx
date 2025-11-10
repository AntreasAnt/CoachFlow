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
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-dark">Verifying authentication...</p>
                </div>
            </div>
        );
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