"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminNav from '../components/AdminNav';
import '../../../styles/dashboard.css';

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVehicles = async () => {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    parking:parking_id (
                        name
                    )
                `)
                .order('entry_time', { ascending: false });

            if (error) console.error(error);
            else setVehicles(data || []);
            setLoading(false);
        };

        fetchVehicles();
    }, []);

    return (
        <div className="dashboard-wrapper">
            <AdminNav />
            <div className="container dashboard-container">
                <div className="grid-header">
                    <h2>All Vehicle Records</h2>
                </div>

                <div className="panel">
                    {loading ? <p>Loading...</p> : (
                        <div className="vehicle-list">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Business</th>
                                        <th>Owner</th>
                                        <th>Vehicle No</th>
                                        <th>Type</th>
                                        <th>Entry</th>
                                        <th>Exit</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehicles.map(v => (
                                        <tr key={v.id}>
                                            <td>{v.parking?.name || 'N/A'}</td>
                                            <td>{v.owner_name || v.owner_email || '-'}</td>
                                            <td><strong>{v.vehicle_number}</strong></td>
                                            <td style={{ textTransform: 'capitalize' }}>{v.vehicle_type}</td>
                                            <td>{new Date(v.entry_time).toLocaleString()}</td>
                                            <td>{v.exit_time ? new Date(v.exit_time).toLocaleString() : '-'}</td>
                                            <td>
                                                <span className="badge" style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    background: v.status === 'active' ? '#e1f5fe' : '#e8f5e9',
                                                    color: v.status === 'active' ? '#01579b' : '#1b5e20',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {v.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {vehicles.length === 0 && (
                                        <tr className="text-center">
                                            <td colSpan="6">No records found.</td>
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
