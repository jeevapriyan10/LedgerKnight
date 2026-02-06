import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Plus, Send, AlertCircle, Wallet, Key, RefreshCw, Edit2, Copy } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default function AssociateDashboard({ user, onLogout, onCreateTransaction }) {
    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState('0');
    const [walletAddress, setWalletAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingTx, setEditingTx] = useState(null);
    const [toast, setToast] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('');
    const [purpose, setPurpose] = useState('');
    const [comment, setComment] = useState('');
    const [priority, setPriority] = useState('medium');
    const [deadline, setDeadline] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            await Promise.all([fetchTransactions(), fetchBalance(), fetchWalletAddress()]);
        } catch (err) {
            console.error('Refresh failed:', err);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await axios.get(`${BACKEND}/transactions`);
            setTransactions(res.data.transactions || []);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        }
    };

    const fetchBalance = async () => {
        try {
            const res = await axios.get(`${BACKEND}/institutions/${user.institutionId}/balance`);
            setBalance(res.data.balance);
        } catch (err) {
            console.error('Failed to fetch balance:', err);
        }
    };

    const fetchWalletAddress = async () => {
        try {
            const res = await axios.get(`${BACKEND}/institutions/${user.institutionId}`);
            setWalletAddress(res.data.institution.walletAddress);
        } catch (err) {
            console.error('Failed to fetch wallet address:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onCreateTransaction({
                receiver,
                amountEther: amount,
                purpose,
                comment,
                priority,
                deadline: deadline || undefined,
                originalTxId: editingTx?.id || null, // Pass original TX ID for resubmissions
            });

            resetForm();
            setShowForm(false);
            setEditingTx(null);
            await fetchTransactions();
        } catch (err) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setReceiver('');
        setAmount('');
        setPurpose('');
        setComment('');
        setPriority('medium');
        setDeadline('');
    };

    const handleEdit = (tx) => {
        setReceiver(tx.receiver);
        setAmount(tx.amount.replace(' ETH', ''));
        setPurpose(tx.purpose);
        setComment(tx.comment || '');
        setPriority(tx.priority);
        setDeadline(tx.deadline ? new Date(tx.deadline).toISOString().split('T')[0] : '');
        setEditingTx(tx);
        setShowForm(true);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match!', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${BACKEND}/password/change-password/associate`, {
                currentPassword,
                newPassword
            });
            showToast('Password changed successfully!');
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast('Copied!');
    };

    const myTransactions = transactions.filter(t => t.creatorId === user.id);
    const needsReview = myTransactions.filter(t => t.status === 3);
    const pending = myTransactions.filter(t => t.status === 0);
    const approved = myTransactions.filter(t => t.status === 1);

    const statusLabels = {
        0: { text: 'Pending Review', class: 'badge-pending' },
        1: { text: 'Approved', class: 'badge-approved' },
        2: { text: 'Declined', class: 'badge-declined' },
        3: { text: 'Needs Changes', class: 'badge-review' },
        4: { text: 'Modified', class: 'text-secondary' },
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            <div className="header">
                <div className="container">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3>Associate Dashboard</h3>
                            <p className="text-secondary text-sm">{user.id} • {user.institutionId}</p>
                        </div>
                        <div className="flex items-center gap-md">
                            <button onClick={() => setShowPasswordModal(true)} className="btn btn-secondary">
                                <Key size={18} /> Change Password
                            </button>
                            <button onClick={onLogout} className="btn btn-secondary">
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                {/* Wallet Info & Alert */}
                {needsReview.length > 0 && (
                    <div className="alert alert-info mb-lg">
                        <div className="flex items-center gap-md">
                            <AlertCircle size={24} />
                            <div>
                                <strong>Action Required</strong>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                                    You have {needsReview.length} transaction(s) that need modifications. Review feedback and resubmit below.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card mb-lg">
                    <h4 className="mb-md">Institution Wallet</h4>
                    <div className="grid grid-2">
                        <div>
                            <p className="text-secondary text-sm mb-xs">Wallet Address</p>
                            <div className="wallet-address mb-sm">
                                {walletAddress || 'Loading...'}
                            </div>
                            <button onClick={() => copyToClipboard(walletAddress)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                                <Copy size={14} /> Copy Address
                            </button>
                        </div>
                        <div>
                            <p className="text-secondary text-sm mb-xs">Current Balance</p>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
                                {parseFloat(balance).toFixed(4)} ETH
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-4 mb-lg">
                    <div className="stat-card">
                        <div className="stat-value">{myTransactions.length}</div>
                        <div className="stat-label">Total Transactions</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
                        <div className="stat-value" style={{ color: 'var(--warning)' }}>{pending.length}</div>
                        <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
                        <div className="stat-value" style={{ color: 'var(--success)' }}>{approved.length}</div>
                        <div className="stat-label">Approved</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
                        <div className="stat-value" style={{ color: 'var(--primary)' }}>{needsReview.length}</div>
                        <div className="stat-label">Needs Changes</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mb-lg">
                    <h4>My Transactions</h4>
                    <div className="flex gap-md">
                        <button onClick={fetchTransactions} className="btn btn-secondary">
                            <RefreshCw size={18} /> Refresh
                        </button>
                        <button onClick={() => { resetForm(); setShowForm(!showForm); setEditingTx(null); }} className="btn btn-primary">
                            <Plus size={18} /> New Transaction
                        </button>
                    </div>
                </div>

                {/* Transaction Form */}
                {showForm && (
                    <div className="card mb-lg">
                        <h4 className="mb-md">{editingTx ? 'Edit & Resubmit Transaction' : 'Create Transaction'}</h4>
                        {editingTx?.auditorComment && (
                            <div className="alert alert-info mb-md">
                                <strong className="text-sm">Auditor Feedback:</strong>
                                <p className="text-sm" style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{editingTx.auditorComment}</p>
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label>Receiver Address</label>
                                    <input type="text" value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="0x..." pattern="^0x[a-fA-F0-9]{40}$" required />
                                </div>
                                <div className="form-group">
                                    <label>Amount (ETH)</label>
                                    <input type="number" step="0.0001" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.01" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Purpose</label>
                                <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g., Student scholarship payment" required />
                            </div>
                            <div className="form-group">
                                <label>Comment (Optional)</label>
                                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Additional notes..." />
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Deadline (Optional)</label>
                                    <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-md">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? <div className="spinner" /> : <><Send size={18} /> {editingTx ? 'Resubmit' : 'Submit'}</>}
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); setEditingTx(null); resetForm(); }} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Transactions List */}
                <div className="card">
                    {myTransactions.length === 0 ? (
                        <div className="text-center" style={{ padding: '3rem' }}>
                            <AlertCircle size={48} color="var(--text-light)" style={{ margin: '0 auto 1rem' }} />
                            <p className="text-secondary">No transactions yet. Create your first transaction above.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Purpose</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myTransactions.map(tx => (
                                    <tr key={tx.id} style={{ background: tx.status === 3 ? 'rgba(30, 64, 175, 0.05)' : 'transparent' }}>
                                        <td><code className="text-xs">{tx.id}</code></td>
                                        <td>
                                            <div>{tx.purpose}</div>
                                            {tx.auditorComment && (
                                                <div className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>
                                                    💬 {tx.auditorComment}
                                                </div>
                                            )}
                                        </td>
                                        <td className="font-semibold">{tx.amount}</td>
                                        <td>
                                            <span className={`badge ${statusLabels[tx.status]?.class}`}>
                                                {statusLabels[tx.status]?.text}
                                            </span>
                                        </td>
                                        <td className="text-sm text-secondary">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {tx.status === 3 && (
                                                <button onClick={() => handleEdit(tx)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                                                    <Edit2 size={14} /> Edit & Resubmit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Create Transaction Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
                    <div className="modal">
                        <div className="flex justify-between items-center mb-lg">
                            <h3>New Transaction</h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTransaction}>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label>Receiver Address</label>
                                    <input type="text" value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="0x..." pattern="^0x[a-fA-F0-9]{40}$" required />
                                </div>
                                <div className="form-group">
                                    <label>Amount (ETH)</label>
                                    <input type="number" step="0.0001" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.01" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Purpose</label>
                                <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g., Student scholarship payment" required />
                            </div>
                            <div className="form-group">
                                <label>Comment (Optional)</label>
                                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Additional notes..." />
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Deadline (Optional)</label>
                                    <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-md">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? <div className="spinner" /> : <><Send size={18} /> Submit</>}
                                </button>
                                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}>
                    <div className="modal">
                        <div className="flex justify-between items-center mb-lg">
                            <h3>Change Password</h3>
                            <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            </div>
                            <div className="flex gap-md">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? <div className="spinner" /> : <><Key size={18} /> Change Password</>}
                                </button>
                                <button type="button" onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3 className="mb-lg">Change Password</h3>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            </div>
                            <div className="flex gap-md">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? <div className="spinner" /> : <><Key size={18} /> Change Password</>}
                                </button>
                                <button type="button" onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: toast.type === 'error' ? 'var(--error)' : 'var(--success)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '6px',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1001,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
