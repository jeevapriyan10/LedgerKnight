import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Plus, Trash2, Check, X, AlertCircle, Wallet, Key, RefreshCw, Copy, ExternalLink } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default function AuditorDashboard({ user, onLogout, onCreateAssociate, onDeleteAssociate, onReviewTransaction }) {
    const [activeTab, setActiveTab] = useState('transactions');
    const [transactions, setTransactions] = useState([]);
    const [associates, setAssociates] = useState([]);
    const [balance, setBalance] = useState('0');
    const [walletAddress, setWalletAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showTxDetails, setShowTxDetails] = useState(false);
    const [selectedTxDetails, setSelectedTxDetails] = useState(null);

    // Modals
    const [showCreateAssociate, setShowCreateAssociate] = useState(false);
    const [showDeleteAssociate, setShowDeleteAssociate] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [selectedTx, setSelectedTx] = useState(null);
    const [selectedAssociate, setSelectedAssociate] = useState(null);

    // Forms
    const [associatePassword, setAssociatePassword] = useState('');
    const [auditorPassword, setAuditorPassword] = useState('');
    const [reviewComment, setReviewComment] = useState('');
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
        setRefreshing(true);
        try {
            await Promise.all([fetchTransactions(), fetchBalance(), fetchWalletAddress(), fetchAssociates()]);
        } catch (err) {
            console.error('Refresh failed:', err);
        } finally {
            setTimeout(() => setRefreshing(false), 500);
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

    const fetchAssociates = async () => {
        try {
            const res = await axios.get(`${BACKEND}/auth/associates/${user.institutionId}`);
            setAssociates(res.data.associates || []);
        } catch (err) {
            console.error('Failed to fetch associates:', err);
        }
    };

    const handleCreateAssociate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onCreateAssociate(associatePassword, auditorPassword);
            await fetchAssociates();
            setShowCreateAssociate(false);
            setAssociatePassword('');
            setAuditorPassword('');
        } catch (err) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAssociate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onDeleteAssociate(selectedAssociate, auditorPassword);
            await fetchAssociates();
            setShowDeleteAssociate(false);
            setSelectedAssociate(null);
            setAuditorPassword('');
        } catch (err) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (decision) => {
        setLoading(true);
        try {
            await onReviewTransaction(selectedTx.id, decision, reviewComment, auditorPassword);
            await fetchTransactions();
            setShowReviewModal(false);
            setSelectedTx(null);
            setReviewComment('');
            setAuditorPassword('');
        } catch (err) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
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
            await axios.post(`${BACKEND}/password/change-password/auditor`, {
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

    const exportToCSV = () => {
        const headers = ['ID', 'Purpose', 'Amount (ETH)', 'Receiver', 'Creator', 'Priority', 'Status', 'Created', 'Reviewed', 'Tx Hash', 'Auditor Comment'];
        const statusMap = { 0: 'Pending', 1: 'Approved', 2: 'Declined', 3: 'Needs Review', 4: 'Modified' };

        const rows = transactions.map(tx => [
            tx.id,
            `"${tx.purpose}"`,
            tx.amount,
            tx.receiver,
            tx.creatorId,
            tx.priority,
            statusMap[tx.status] || tx.status,
            new Date(tx.createdAt).toLocaleString(),
            tx.reviewedAt ? new Date(tx.reviewedAt).toLocaleString() : 'N/A',
            tx.txHash || 'N/A',
            `"${tx.auditorComment || 'N/A'}"`,
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ledger-knight-transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV exported successfully!');
    };

    const showTxDetail = (tx) => {
        setSelectedTxDetails(tx);
        setShowTxDetails(true);
    };

    const pending = transactions.filter(t => t.status === 0);
    const approved = transactions.filter(t => t.status === 1);
    const declined = transactions.filter(t => t.status === 2);
    const needsReview = transactions.filter(t => t.status === 3);
    const allHistory = [...approved, ...declined].sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt));

    const stats = {
        total: transactions.length,
        pending: pending.length,
        approved: approved.length,
        declined: declined.length,
        needsReview: needsReview.length,
        totalApproved: approved.reduce((sum, t) => sum + parseFloat(t.amount.replace(' ETH', '')), 0),
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            <div className="header">
                <div className="container">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3>Auditor Dashboard</h3>
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
                {/* Wallet Info */}
                <div className="card mb-lg">
                    <div className="grid grid-2">
                        <div>
                            <h4 className="mb-sm">Institution Wallet</h4>
                            <div className="wallet-address mb-md">
                                {walletAddress || 'Loading...'}
                            </div>
                            <div className="flex gap-sm">
                                <button onClick={() => copyToClipboard(walletAddress)} className="btn btn-secondary btn-sm">
                                    <Copy size={16} /> Copy
                                </button>
                                <a
                                    href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <ExternalLink size={16} /> View on Explorer
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="mb-sm">Current Balance</h4>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                {parseFloat(balance).toFixed(4)} ETH
                            </div>
                            <p className="text-secondary text-sm">
                                Need more ETH? Get testnet ETH from <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Sepolia Faucet</a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-4 mb-lg">
                    <div className="stat-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Transactions</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
                        <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
                        <div className="stat-label">Pending Review</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
                        <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.approved}</div>
                        <div className="stat-label">Approved</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '3px solid var(--error)' }}>
                        <div className="stat-value" style={{ color: 'var(--error)' }}>{stats.declined}</div>
                        <div className="stat-label">Declined</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button className={`tab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
                        Transactions {pending.length > 0 && <span className="badge badge-pending" style={{ marginLeft: '0.5rem' }}>{pending.length}</span>}
                    </button>
                    <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                        History ({allHistory.length})
                    </button>
                    <button className={`tab ${activeTab === 'associates' ? 'active' : ''}`} onClick={() => setActiveTab('associates')}>
                        Associates ({associates.length})
                    </button>
                    <button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                        Analytics
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'transactions' && (
                    <div className="card">
                        <div className="flex justify-between items-center mb-lg">
                            <h4>Pending Transactions</h4>
                            <div className="flex gap-md">
                                <button onClick={fetchData} className="btn btn-secondary" disabled={refreshing}>
                                    <RefreshCw size={18} className={refreshing ? 'spinning' : ''} /> Refresh
                                </button>
                            </div>
                        </div>
                        {pending.length === 0 ? (
                            <div className="text-center" style={{ padding: '3rem' }}>
                                <Check size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                                <p className="text-secondary">No pending transactions</p>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Purpose</th>
                                        <th>Amount</th>
                                        <th>Creator</th>
                                        <th>Priority</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pending.map(tx => (
                                        <tr key={tx.id}>
                                            <td>
                                                <code
                                                    className="text-xs"
                                                    style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                                                    onClick={() => showTxDetail(tx)}
                                                >
                                                    {tx.id}
                                                </code>
                                            </td>
                                            <td>{tx.purpose}</td>
                                            <td className="font-semibold">{tx.amount}</td>
                                            <td className="text-sm text-secondary">{tx.creatorId}</td>
                                            <td>
                                                <span className={`badge ${tx.priority === 'high' ? 'badge-declined' : tx.priority === 'medium' ? 'badge-pending' : ''}`}>
                                                    {tx.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <button onClick={() => { setSelectedTx(tx); setShowReviewModal(true); }} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="card">
                        <div className="flex justify-between items-center mb-lg">
                            <h4>Transaction History</h4>
                            <div className="flex gap-md">
                                <button onClick={exportToCSV} className="btn btn-secondary">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Export CSV
                                </button>
                                <button onClick={fetchData} className="btn btn-secondary" disabled={refreshing}>
                                    <RefreshCw size={18} className={refreshing ? 'spinning' : ''} /> Refresh
                                </button>
                            </div>
                        </div>
                        {allHistory.length === 0 ? (
                            <div className="text-center" style={{ padding: '3rem' }}>
                                <AlertCircle size={48} color="var(--text-light)" style={{ margin: '0 auto 1rem' }} />
                                <p className="text-secondary">No transaction history yet</p>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Purpose</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Reviewed</th>
                                        <th>Tx Hash</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allHistory.map(tx => (
                                        <tr key={tx.id}>
                                            <td>
                                                <code
                                                    className="text-xs"
                                                    style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                                                    onClick={() => showTxDetail(tx)}
                                                >
                                                    {tx.id}
                                                </code>
                                            </td>
                                            <td>{tx.purpose}</td>
                                            <td className="font-semibold">{tx.amount}</td>
                                            <td>
                                                <span className={`badge ${tx.status === 1 ? 'badge-approved' : 'badge-declined'}`}>
                                                    {tx.status === 1 ? 'Approved' : 'Declined'}
                                                </span>
                                            </td>
                                            <td className="text-sm text-secondary">{new Date(tx.reviewedAt).toLocaleDateString()}</td>
                                            <td>
                                                {tx.txHash ? (
                                                    <a
                                                        href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs"
                                                        style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                                                    >
                                                        View
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-secondary">N/A</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'associates' && (
                    <div className="card">
                        <div className="flex justify-between items-center mb-lg">
                            <h4>Team Members</h4>
                            <button onClick={() => setShowCreateAssociate(true)} className="btn btn-primary">
                                <Plus size={18} /> Create Associate
                            </button>
                        </div>
                        {associates.length === 0 ? (
                            <div className="text-center" style={{ padding: '3rem' }}>
                                <p className="text-secondary">No associates yet. Create one to get started.</p>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {associates.map(assoc => (
                                        <tr key={assoc._id}>
                                            <td className="font-semibold">{assoc._id}</td>
                                            <td className="text-secondary text-sm">{new Date(assoc.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button onClick={() => { setSelectedAssociate(assoc._id); setShowDeleteAssociate(true); }} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="grid gap-lg">
                        <div className="card">
                            <h4 className="mb-lg">Financial Summary</h4>
                            <div className="grid grid-3">
                                <div>
                                    <p className="text-secondary text-sm mb-xs">Total Approved</p>
                                    <p className="font-bold text-lg" style={{ color: 'var(--success)' }}>{stats.totalApproved.toFixed(4)} ETH</p>
                                </div>
                                <div>
                                    <p className="text-secondary text-sm mb-xs">Average Transaction</p>
                                    <p className="font-bold text-lg">{stats.approved > 0 ? (stats.totalApproved / stats.approved).toFixed(4) : '0.0000'} ETH</p>
                                </div>
                                <div>
                                    <p className="text-secondary text-sm mb-xs">Current Balance</p>
                                    <p className="font-bold text-lg" style={{ color: 'var(--primary)' }}>{parseFloat(balance).toFixed(4)} ETH</p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h4 className="mb-lg">Transaction Breakdown</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Count</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><span className="badge badge-pending">Pending</span></td>
                                        <td className="font-semibold">{stats.pending}</td>
                                        <td>{stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : 0}%</td>
                                    </tr>
                                    <tr>
                                        <td><span className="badge badge-approved">Approved</span></td>
                                        <td className="font-semibold">{stats.approved}</td>
                                        <td>{stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}%</td>
                                    </tr>
                                    <tr>
                                        <td><span className="badge badge-review">Needs Review</span></td>
                                        <td className="font-semibold">{stats.needsReview}</td>
                                        <td>{stats.total > 0 ? ((stats.needsReview / stats.total) * 100).toFixed(1) : 0}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateAssociate && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateAssociate(false); }}>
                    <div className="modal">
                        <h3 className="mb-lg">Create Associate</h3>
                        <form onSubmit={handleCreateAssociate}>
                            <div className="form-group">
                                <label>Associate Password</label>
                                <input type="password" value={associatePassword} onChange={(e) => setAssociatePassword(e.target.value)} required minLength={6} placeholder="Enter password for new associate" />
                            </div>
                            <div className="form-group">
                                <label>Your Auditor Password</label>
                                <input type="password" value={auditorPassword} onChange={(e) => setAuditorPassword(e.target.value)} required placeholder="Confirm with your password" />
                            </div>
                            <div className="flex gap-md">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? <div className="spinner" /> : <><Plus size={18} /> Create</>}
                                </button>
                                <button type="button" onClick={() => { setShowCreateAssociate(false); setAssociatePassword(''); setAuditorPassword(''); }} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteAssociate && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteAssociate(false); }}>
                    <div className="modal">
                        <h3 className="mb-lg">Delete Associate</h3>
                        <p className="text-secondary mb-lg">Are you sure you want to delete associate <strong>{selectedAssociate}</strong>?</p>
                        <form onSubmit={handleDeleteAssociate}>
                            <div className="form-group">
                                <label>Your Auditor Password</label>
                                <input type="password" value={auditorPassword} onChange={(e) => setAuditorPassword(e.target.value)} required placeholder="Confirm with your password" />
                            </div>
                            <div className="flex gap-md">
                                <button type="submit" className="btn btn-danger" disabled={loading}>
                                    {loading ? <div className="spinner" /> : <><Trash2 size={18} /> Delete</>}
                                </button>
                                <button type="button" onClick={() => { setShowDeleteAssociate(false); setSelectedAssociate(null); setAuditorPassword(''); }} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showReviewModal && selectedTx && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowReviewModal(false); }}>
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <h3 className="mb-lg">Review Transaction</h3>
                        <div className="info-box mb-lg">
                            <p className="text-sm"><strong>ID:</strong> {selectedTx.id}</p>
                            <p className="text-sm"><strong>Purpose:</strong> {selectedTx.purpose}</p>
                            <p className="text-sm"><strong>Amount:</strong> {selectedTx.amount}</p>
                            <p className="text-sm"><strong>Receiver:</strong> {selectedTx.receiver}</p>
                        </div>
                        <div className="form-group">
                            <label>Feedback (Optional)</label>
                            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Add comments or request changes..." />
                        </div>
                        <div className="form-group">
                            <label>Your Auditor Password (Required for Approval)</label>
                            <input type="password" value={auditorPassword} onChange={(e) => setAuditorPassword(e.target.value)} placeholder="Enter your password" />
                        </div>
                        <div className="flex gap-md">
                            <button onClick={() => handleReview('APPROVED')} className="btn btn-success" disabled={loading || !auditorPassword}>
                                <Check size={18} /> Approve
                            </button>
                            <button onClick={() => handleReview('REVIEW')} className="btn btn-secondary" disabled={loading}>
                                <AlertCircle size={18} /> Send Back
                            </button>
                            <button onClick={() => handleReview('DECLINED')} className="btn btn-danger" disabled={loading}>
                                <X size={18} /> Decline
                            </button>
                            <button onClick={() => { setShowReviewModal(false); setSelectedTx(null); setReviewComment(''); setAuditorPassword(''); }} className="btn btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Transaction Details Modal */}
            {showTxDetails && selectedTxDetails && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTxDetails(false); }}>
                    <div className="modal" style={{ maxWidth: '700px' }}>
                        <div className="flex justify-between items-start mb-lg">
                            <h3>Transaction Details</h3>
                            <button onClick={() => { setShowTxDetails(false); setSelectedTxDetails(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="info-box mb-lg">
                            <div className="grid grid-2" style={{ gap: '1rem' }}>
                                <div>
                                    <p className="text-sm text-secondary mb-xs">Transaction ID</p>
                                    <p className="font-semibold text-sm">{selectedTxDetails.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary mb-xs">Status</p>
                                    <span className={`badge ${selectedTxDetails.status === 0 ? 'badge-pending' :
                                        selectedTxDetails.status === 1 ? 'badge-approved' :
                                            selectedTxDetails.status === 2 ? 'badge-declined' :
                                                selectedTxDetails.status === 3 ? 'badge-review' : ''
                                        }`}>
                                        {selectedTxDetails.status === 0 ? 'Pending' :
                                            selectedTxDetails.status === 1 ? 'Approved' :
                                                selectedTxDetails.status === 2 ? 'Declined' :
                                                    selectedTxDetails.status === 3 ? 'Needs Review' : 'Modified'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary mb-xs">Purpose</p>
                                    <p className="font-semibold text-sm">{selectedTxDetails.purpose}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary mb-xs">Amount</p>
                                    <p className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>{selectedTxDetails.amount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary mb-xs">Receiver Address</p>
                                    <code className="text-xs" style={{ wordBreak: 'break-all' }}>{selectedTxDetails.receiver}</code>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary mb-xs">Creator</p>
                                    <p className="font-semibold text-sm">{selectedTxDetails.creatorId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary mb-xs">Priority</p>
                                    <span className={`badge ${selectedTxDetails.priority === 'high' ? 'badge-declined' : selectedTxDetails.priority === 'medium' ? 'badge-pending' : ''}`}>
                                        {selectedTxDetails.priority}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary mb-xs">Created</p>
                                    <p className="text-sm">{new Date(selectedTxDetails.createdAt).toLocaleString()}</p>
                                </div>
                                {selectedTxDetails.reviewedAt && (
                                    <div>
                                        <p className="text-sm text-secondary mb-xs">Reviewed</p>
                                        <p className="text-sm">{new Date(selectedTxDetails.reviewedAt).toLocaleString()}</p>
                                    </div>
                                )}
                                {selectedTxDetails.deadline && (
                                    <div>
                                        <p className="text-sm text-secondary mb-xs">Deadline</p>
                                        <p className="text-sm">{new Date(selectedTxDetails.deadline).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                            {selectedTxDetails.auditorComment && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                    <p className="text-sm text-secondary mb-xs">Auditor Feedback</p>
                                    <p className="text-sm">{selectedTxDetails.auditorComment}</p>
                                </div>
                            )}
                            {selectedTxDetails.comment && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                    <p className="text-sm text-secondary mb-xs">Comment</p>
                                    <p className="text-sm">{selectedTxDetails.comment}</p>
                                </div>
                            )}
                        </div>
                        {selectedTxDetails.txHash && (
                            <div className="mb-lg">
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${selectedTxDetails.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <ExternalLink size={18} />
                                    View on Etherscan
                                </a>
                            </div>
                        )}
                        <button onClick={() => { setShowTxDetails(false); setSelectedTxDetails(null); }} className="btn btn-secondary">
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {
                toast && (
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
                )
            }
        </div >
    );
}
