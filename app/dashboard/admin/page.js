"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import '../../styles/dashboard.css';
import AdminNav from './components/AdminNav';

export default function AdminDashboard() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBusinesses();
    }, [filter]);

    const fetchBusinesses = async () => {
        setLoading(true);

        let query = supabase
            .from('business_profiles')
            .select(`
                *,
                profiles!inner (id, email, full_name, role, status)
            `)
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('profiles.status', filter);
        }

        const { data, error } = await query;
        if (error) {
            console.error("Admin Fetch Error:", error);
            setError("Failed to fetch businesses: " + error.message);
        }
        setBusinesses(data || []);
        setLoading(false);
    };

    const updateStatus = async (userId, status) => {
        await supabase
            .from('profiles')
            .update({ status })
            .eq('id', userId);

        fetchBusinesses();
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: { bg: '#fff3cd', color: '#856404' },
            approved: { bg: '#d4edda', color: '#155724' },
            rejected: { bg: '#f8d7da', color: '#721c24' },
            banned: { bg: '#333', color: '#fff' }
        };
        const style = colors[status] || colors.pending;
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '4px',
                background: style.bg,
                color: style.color,
                fontSize: '0.85rem',
                fontWeight: '500',
                textTransform: 'capitalize'
            }}>
                {status || 'pending'}
            </span>
        );
    };

    const stats = {
        total: businesses.length,
        pending: businesses.filter(b => b.profiles?.status === 'pending').length,
        approved: businesses.filter(b => b.profiles?.status === 'approved').length
    };

    return (
        <div className="dashboard-wrapper">
            <AdminNav />
            <div className="container dashboard-container">
                <div className="stats-grid" style={{ marginBottom: '30px' }}>
                    <div className="stat-card">
                        <h3>{stats.total}</h3>
                        <p>Total Biz</p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ color: 'var(--primary-color)' }}>{stats.pending}</h3>
                        <p>Pending</p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ color: 'var(--success)' }}>{stats.approved}</h3>
                        <p>Active</p>
                    </div>
                </div>

                <div className="grid-header" style={{ marginBottom: '20px' }}>
                    <h2>Management</h2>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setFilter('all')}
                            className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
                            style={{ padding: '8px 16px', background: filter === 'all' ? '' : '#eee', fontSize: '0.95rem' }}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`btn ${filter === 'pending' ? 'btn-primary' : ''}`}
                            style={{ padding: '8px 16px', background: filter === 'pending' ? '' : '#eee', fontSize: '0.95rem' }}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setFilter('approved')}
                            className={`btn ${filter === 'approved' ? 'btn-primary' : ''}`}
                            style={{ padding: '8px 16px', background: filter === 'approved' ? '' : '#eee', fontSize: '0.95rem' }}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilter('rejected')}
                            className={`btn ${filter === 'rejected' ? 'btn-primary' : ''}`}
                            style={{ padding: '8px 16px', background: filter === 'rejected' ? '' : '#eee', fontSize: '0.95rem' }}
                        >
                            Rejected
                        </button>
                    </div>
                </div>

                <div className="panel">
                    {loading ? <p>Loading...</p> : (
                        <div className="vehicle-list">
                            <table>
                                <thead>
                                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Business Name</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Owner</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>License ID</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Proof</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {businesses.map(biz => (
                                        <tr key={biz.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td data-label="Business" style={{ padding: '12px' }}>
                                                <strong>{biz.business_name}</strong>
                                            </td>
                                            <td data-label="Owner" style={{ padding: '12px' }}>
                                                {biz.profiles?.full_name || 'N/A'}
                                            </td>
                                            <td data-label="Email" style={{ padding: '12px' }}>
                                                {biz.profiles?.email}
                                            </td>
                                            <td data-label="License" style={{ padding: '12px' }}>
                                                {biz.license_id}
                                            </td>
                                            <td data-label="Proof" style={{ padding: '12px' }}>
                                                {biz.proof_doc_url ? (
                                                    <a
                                                        href={biz.proof_doc_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Click to enlarge"
                                                    >
                                                        <img
                                                            src={biz.proof_doc_url}
                                                            alt="Proof"
                                                            style={{
                                                                width: '60px',
                                                                height: '40px',
                                                                objectFit: 'cover',
                                                                borderRadius: '4px',
                                                                border: '1px solid #ddd',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                            }}
                                                        />
                                                    </a>
                                                ) : (
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        color: '#dc3545',
                                                        background: '#fff2f2',
                                                        padding: '2px 6px',
                                                        borderRadius: '3px',
                                                        border: '1px solid #ffcccc'
                                                    }}>
                                                        No Proof
                                                    </span>
                                                )}
                                            </td>
                                            <td data-label="Status" style={{ padding: '12px' }}>
                                                {getStatusBadge(biz.profiles.status)}
                                            </td>
                                            <td data-label="Action" style={{ padding: '12px' }}>
                                                {biz.profiles.status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <button
                                                            onClick={() => updateStatus(biz.profiles.id, 'approved')}
                                                            className="btn"
                                                            style={{
                                                                background: '#ffd700',
                                                                color: '#000',
                                                                padding: '6px 12px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: '600',
                                                                border: 'none',
                                                                borderRadius: '4px'
                                                            }}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(biz.profiles.id, 'rejected')}
                                                            className="btn"
                                                            style={{
                                                                background: '#dc3545',
                                                                color: '#fff',
                                                                padding: '6px 12px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: '600',
                                                                border: 'none',
                                                                borderRadius: '4px'
                                                            }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {biz.profiles.status === 'approved' && (
                                                    <button
                                                        onClick={() => updateStatus(biz.profiles.id, 'banned')}
                                                        className="btn"
                                                        style={{
                                                            background: '#dc3545',
                                                            color: '#fff',
                                                            padding: '6px 12px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            border: 'none',
                                                            borderRadius: '4px'
                                                        }}
                                                    >
                                                        Ban
                                                    </button>
                                                )}
                                                {(biz.profiles.status === 'rejected' || biz.profiles.status === 'banned') && (
                                                    <span style={{ color: '#666', fontSize: '0.8rem' }}>
                                                        {biz.profiles.status.charAt(0).toUpperCase() + biz.profiles.status.slice(1)}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {businesses.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                                No businesses found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
