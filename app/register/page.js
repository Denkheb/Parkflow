"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import dynamic from 'next/dynamic';
import '../styles/auth.css';

const MapPicker = dynamic(() => import('../components/MapPicker'), {
    ssr: false,
    loading: () => <p>Loading Map Picker...</p>
});

export default function Register() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('user');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [proofFile, setProofFile] = useState(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        businessName: '',
        licenseId: '',
        latitude: null,
        longitude: null,
        address: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationSelect = async (lat, lng) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`);
            const data = await res.json();
            if (data && data.display_name) {
                const addressParts = data.display_name.split(', ');
                const area = addressParts[0] || '';
                const city = addressParts[1] || '';
                const shortAddr = area + (city ? ', ' + city : '');
                setFormData(prev => ({ ...prev, address: shortAddr }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (activeTab === 'business' && !formData.latitude && !formData.longitude) {
                throw new Error("Please select your business location on the map.");
            }

            let proofUrl = null;

            if (activeTab === 'business') {
                if (!proofFile) {
                    throw new Error("Please upload a proof document (Business License/ID).");
                }

                const fileExt = proofFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `proofs/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, proofFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath);

                proofUrl = publicUrl;
            }

            const { data, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: activeTab,
                        business_name: activeTab === 'business' ? formData.businessName : null,
                        license_id: activeTab === 'business' ? formData.licenseId : null,
                        latitude: activeTab === 'business' ? formData.latitude : null,
                        longitude: activeTab === 'business' ? formData.longitude : null,
                        address: activeTab === 'business' ? formData.address : null,
                        proof_doc_url: proofUrl,
                        status: activeTab === 'business' ? 'pending' : 'approved'
                    }
                }
            });

            if (authError) throw authError;
            if (!data.user) throw new Error("User creation failed.");

            await supabase.auth.signOut();
            router.push('/login?registered=true');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`auth-container ${activeTab === 'business' ? 'register' : ''}`}>
            <div className="tabs">
                <div
                    className={`tab ${activeTab === 'user' ? 'active' : ''}`}
                    onClick={() => setActiveTab('user')}
                >
                    User Account
                </div>
                <div
                    className={`tab ${activeTab === 'business' ? 'active' : ''}`}
                    onClick={() => setActiveTab('business')}
                >
                    Business Owner
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            className="form-control"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            placeholder="Minimum 6 characters"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="6"
                        />
                    </div>

                    {activeTab === 'business' && (
                        <>
                            <div className="form-group">
                                <label>Business Name</label>
                                <input
                                    type="text"
                                    name="businessName"
                                    className="form-control"
                                    placeholder="e.g. City Center Parking"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Business License ID</label>
                                <input
                                    type="text"
                                    name="licenseId"
                                    className="form-control"
                                    placeholder="License or Registration No."
                                    value={formData.licenseId}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Select Location on Map</label>
                                <div style={{ marginBottom: '10px' }}>
                                    <MapPicker onLocationSelect={handleLocationSelect} />
                                </div>
                                <input
                                    type="text"
                                    name="address"
                                    className="form-control"
                                    placeholder="Calculated area/address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                />
                                {formData.latitude && (
                                    <small style={{ color: 'green' }}>
                                        Location pinpointed: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                                    </small>
                                )}
                            </div>

                            <div className="form-group full-width">
                                <label>Verification Document (License/ID)</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    required
                                />
                                <small>Please upload a clear photo of your business license or identity document for verification.</small>
                            </div>
                        </>
                    )}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
                    <i className="fa-solid fa-user-plus"></i> {loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

            {activeTab === 'user' && (
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                </div>
            )}

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <p className="mt-2 text-center" style={{ fontSize: '0.9rem' }}>Already have an account? <Link href="/login" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Login</Link></p>
                <p className="text-center" style={{ marginTop: '10px', fontSize: '0.9rem' }}><Link href="/" style={{ color: '#666' }}>← Back to Home</Link></p>
            </div>
        </div>
    );
}
