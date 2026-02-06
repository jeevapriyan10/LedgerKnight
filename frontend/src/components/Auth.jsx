import React, { useState } from 'react';
import axios from 'axios';
import { Building2, User, Lock, LogIn } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default function Auth({ onLogin, setMessage }) {
    const [mode, setMode] = useState('login');
    const [userType, setUserType] = useState('auditor');

    const [institutionId, setInstitutionId] = useState('');
    const [password, setPassword] = useState('');
    const [associateId, setAssociateId] = useState('');

    const [name, setName] = useState('');
    const [location, setLocation] = useState('');

    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(`${BACKEND}/auth/register`, {
                name,
                location,
                auditorPassword: password,
            });

            // Show wallet address prominently
            setMessage?.({
                type: 'success',
                text: `✅ Institution Registered Successfully!\n\n📋 Institution ID: ${res.data.institutionId}\n\n💳 Wallet Address:\n${res.data.walletAddress}\n\n⚠️ IMPORTANT: Save these details! Fund your wallet with Sepolia testnet ETH from https://sepoliafaucet.com/`,
            });

            setInstitutionId(res.data.institutionId);
            setMode('login');
            setName('');
            setLocation('');
        } catch (err) {
            console.error('Registration Error:', err); // Log full error for debugging
            let errorMsg = 'Registration failed';

            if (err.response?.data?.error) {
                if (typeof err.response.data.error === 'string') {
                    errorMsg = err.response.data.error;
                } else {
                    errorMsg = JSON.stringify(err.response.data.error);
                }
            } else if (err.message) {
                errorMsg = err.message;
            }

            setMessage?.({
                type: 'error',
                text: errorMsg,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onLogin(institutionId, password, userType, associateId);
        } catch (err) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '2rem 0', background: 'var(--surface)' }}>
            <div className="container">
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                    <div className="card">
                        <div className="flex items-center justify-between mb-lg">
                            <h2>{mode === 'login' ? 'Sign In' : 'Register Institution'}</h2>
                            <button
                                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                className="btn btn-secondary"
                                style={{ padding: '0.5rem 1rem' }}
                            >
                                {mode === 'login' ? 'Register' : 'Login'}
                            </button>
                        </div>

                        {mode === 'login' && (
                            <div className="flex gap-sm mb-lg">
                                <button
                                    onClick={() => setUserType('auditor')}
                                    className={`btn ${userType === 'auditor' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                >
                                    Auditor
                                </button>
                                <button
                                    onClick={() => setUserType('associate')}
                                    className={`btn ${userType === 'associate' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                >
                                    Associate
                                </button>
                            </div>
                        )}

                        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
                            {mode === 'register' ? (
                                <>
                                    <div className="form-group">
                                        <label><Building2 size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />Institution Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., ABC University"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Location</label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="e.g., Mumbai, India"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label><Lock size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />Auditor Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter secure password"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Institution ID</label>
                                        <input
                                            type="text"
                                            value={institutionId}
                                            onChange={(e) => setInstitutionId(e.target.value)}
                                            placeholder="e.g., INS1234"
                                            required
                                        />
                                    </div>

                                    {userType === 'associate' && (
                                        <div className="form-group">
                                            <label><User size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />Employee ID</label>
                                            <input
                                                type="text"
                                                value={associateId}
                                                onChange={(e) => setAssociateId(e.target.value)}
                                                placeholder="e.g., EMP5678"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label><Lock size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{ width: '100%', marginTop: '1rem' }}
                            >
                                {loading ? (
                                    <div className="spinner" />
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        {mode === 'login' ? 'Sign In' : 'Register'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
