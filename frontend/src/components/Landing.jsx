import React from 'react';
import { Shield, Check, TrendingUp, Users, Lock, ArrowRight } from 'lucide-react';

export default function Landing({ onGetStarted }) {
    return (
        <div>
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h1 className="mb-lg">
                            Institutional Financial Management
                            <br />
                            <span className="text-primary">Built on Ethereum</span>
                        </h1>
                        <p style={{ fontSize: '1.125rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                            Secure, transparent, and efficient financial operations powered by blockchain technology.
                            Role-based access control and real-time transaction tracking.
                        </p>
                        <div className="flex justify-center gap-md">
                            <button onClick={onGetStarted} className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                                Get Started <ArrowRight size={20} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section style={{ background: 'var(--surface)', padding: '3rem 0', borderTop: '1px solid var(--border)' }}>
                <div className="container">
                    <div className="grid grid-4">
                        <div className="stat-card">
                            <div className="stat-value">100%</div>
                            <div className="stat-label">Secure</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">Ethereum</div>
                            <div className="stat-label">Blockchain</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">Real-time</div>
                            <div className="stat-label">Analytics</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">24/7</div>
                            <div className="stat-label">Available</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '4rem 0' }}>
                <div className="container">
                    <div className="text-center mb-xl">
                        <h2 className="mb-md">Core Features</h2>
                        <p className="text-secondary">Everything you need for modern institutional finance</p>
                    </div>

                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <Shield size={24} />
                            </div>
                            <h4 className="mb-sm">Role-Based Access</h4>
                            <p className="text-secondary text-sm">
                                Secure authentication with distinct permissions for auditors and associates
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Lock size={24} />
                            </div>
                            <h4 className="mb-sm">Approval Workflow</h4>
                            <p className="text-secondary text-sm">
                                Multi-step transaction approval process with audit trails
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <TrendingUp size={24} />
                            </div>
                            <h4 className="mb-sm">Real-Time Analytics</h4>
                            <p className="text-secondary text-sm">
                                Comprehensive dashboards with transaction insights and summaries
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Users size={24} />
                            </div>
                            <h4 className="mb-sm">Team Management</h4>
                            <p className="text-secondary text-sm">
                                Create and manage associate accounts with granular permissions
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section style={{ background: 'var(--surface)', padding: '4rem 0', borderTop: '1px solid var(--border)' }}>
                <div className="container">
                    <div className="text-center mb-xl">
                        <h2 className="mb-md">How It Works</h2>
                        <p className="text-secondary">Simple, secure, and transparent</p>
                    </div>

                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <div className="grid gap-lg">
                            {[
                                { num: '01', title: 'Register Institution', desc: 'Create your institution account with automated Ethereum wallet generation', icon: Shield },
                                { num: '02', title: 'Setup Team', desc: 'Auditors create associate accounts and assign permissions', icon: Users },
                                { num: '03', title: 'Create Transactions', desc: 'Associates submit transactions for auditor review and approval', icon: TrendingUp },
                                { num: '04', title: 'Execute On-Chain', desc: 'Approved transactions execute on Ethereum blockchain', icon: Check },
                            ].map(step => (
                                <div key={step.num} className="card">
                                    <div className="flex gap-lg">
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem',
                                            fontWeight: 'bold',
                                            flexShrink: 0
                                        }}>
                                            {step.num}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 className="mb-sm">{step.title}</h4>
                                            <p className="text-secondary text-sm">{step.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '4rem 0' }}>
                <div className="container">
                    <div className="card text-center" style={{ maxWidth: '700px', margin: '0 auto', background: 'var(--surface)' }}>
                        <h2 className="mb-md">Ready to get started?</h2>
                        <p className="text-secondary mb-xl" style={{ fontSize: '1.125rem' }}>
                            Transform your institutional financial management with blockchain technology
                        </p>
                        <button onClick={onGetStarted} className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                            Create Account <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '2rem 0', textAlign: 'center' }}>
                <div className="container">
                    <div className="flex items-center justify-center gap-sm mb-sm">
                        <Shield size={20} color="var(--primary)" />
                        <span className="font-semibold">Ledger Knight</span>
                    </div>
                    <p className="text-secondary text-sm">
                        © 2026 Ledger Knight. Institutional financial management on Ethereum.
                    </p>
                </div>
            </footer>
        </div>
    );
}
