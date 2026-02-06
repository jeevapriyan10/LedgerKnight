import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Landing from './components/Landing';
import Auth from './components/Auth';
import AuditorDashboard from './components/AuditorDashboard';
import AssociateDashboard from './components/AssociateDashboard';
import MessageBanner from './components/MessageBanner';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function App() {
    const [view, setView] = useState(() => localStorage.getItem('view') || 'landing');
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [message, setMessage] = useState(null);

    // Set axios default header when token changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Update view when user logs in
    useEffect(() => {
        if (user && user.role) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('view', user.role);
            setView(user.role);
        }
    }, [user]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleLogin = async (institutionId, password, userType, associateId = '') => {
        try {
            let res;
            if (userType === 'auditor') {
                res = await axios.post(`${BACKEND}/auth/login-auditor`, { institutionId, password });
            } else {
                res = await axios.post(`${BACKEND}/auth/login-associate`, {
                    institutionId,
                    empId: associateId,
                    password,
                });
            }

            const { token: tkn, user: userData } = res.data;
            setToken(tkn);
            setUser(userData);
            localStorage.setItem('token', tkn);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('view', userData.role);
            setView(userData.role);
            showMessage('success', `Logged in as ${userData.role}`);
        } catch (err) {
            showMessage('error', err.response?.data?.error || 'Login failed');
            throw err;
        }
    };

    const handleCreateAssociate = async (associatePassword, auditorPassword) => {
        try {
            const res = await axios.post(`${BACKEND}/auth/create-associate`, {
                associatePassword,
                auditorPassword,
                institutionId: user.institutionId,
            });
            showMessage('success', `✅ Associate created: ${res.data.empId}`);
            return res.data;
        } catch (err) {
            showMessage('error', err.response?.data?.error || 'Failed to create associate');
            throw err;
        }
    };

    const handleDeleteAssociate = async (empId, auditorPassword) => {
        try {
            await axios.delete(`${BACKEND}/auth/delete-associate`, {
                data: { institutionId: user.institutionId, empId, auditorPassword },
            });
            showMessage('success', `✅ Associate ${empId} deleted`);
        } catch (err) {
            showMessage('error', err.response?.data?.error || 'Failed to delete associate');
            throw err;
        }
    };

    const handleCreateTransaction = async (transactionData) => {
        try {
            const res = await axios.post(`${BACKEND}/transactions`, transactionData);
            showMessage('success', `✅ Transaction created: ${res.data.txId}`);
            return res.data;
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to create transaction';
            // Check for insufficient balance specifically
            if (errorMsg.toLowerCase().includes('insufficient')) {
                showMessage('error', `❌ ${errorMsg}\n\nPlease fund your wallet with Sepolia testnet ETH first.`);
            } else {
                showMessage('error', `❌ ${errorMsg}`);
            }
            throw err;
        }
    };

    const handleReviewTransaction = async (txId, decision, comment = '', auditorPassword) => {
        try {
            await axios.post(`${BACKEND}/transactions/${txId}/review`, {
                decision,
                auditorComment: comment,
                auditorPassword,
            });
            showMessage('success', `✅ Transaction ${decision.toLowerCase()}`);
        } catch (err) {
            showMessage('error', err.response?.data?.error || 'Failed to review transaction');
            throw err;
        }
    };

    const handleLogout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('view');
        setView('landing');
        showMessage('info', 'Logged out successfully');
    };

    const renderView = () => {
        if (view === 'landing') return <Landing onGetStarted={() => setView('auth')} />;
        if (view === 'auth') return <Auth onLogin={handleLogin} setMessage={setMessage} />;

        const commonProps = { user, onLogout: handleLogout };

        if (view === 'auditor') {
            return (
                <>
                    {message && <MessageBanner message={message} onClose={() => setMessage(null)} />}
                    <AuditorDashboard
                        {...commonProps}
                        onCreateAssociate={handleCreateAssociate}
                        onDeleteAssociate={handleDeleteAssociate}
                        onReviewTransaction={handleReviewTransaction}
                    />
                </>
            );
        }

        if (view === 'associate') {
            return (
                <>
                    {message && <MessageBanner message={message} onClose={() => setMessage(null)} />}
                    <AssociateDashboard {...commonProps} onCreateTransaction={handleCreateTransaction} />
                </>
            );
        }

        return null;
    };

    return (
        <>
            {['auditor', 'associate'].includes(view) ? null : (
                message && <MessageBanner message={message} onClose={() => setMessage(null)} />
            )}
            {renderView()}
        </>
    );
}

export default App;
