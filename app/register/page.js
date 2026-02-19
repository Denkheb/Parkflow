

"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import '../styles/auth.css';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('../components/MapPicker'), {
    ssr: false,
    loading: () => <p>Loading Map...</p>
});

export default function Register() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('user');
    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        business_name: '', license_id: '',
        address: '',
        latitude: null, longitude: null
    });
    const [proofFile, setProofFile] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLocationSelect = async (lat, lng) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

        // Use Nominatim for reverse geocoding to keep address in sync with map (Force English)
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`);
            const data = await res.json();
            if (data && data.display_name) {
                // Shorten the address for the search bar (Area, City)
                const addressParts = data.display_name.split(', ');
                const area = addressParts[0] || '';
                const city = addressParts[1] || '';
                const shortened = area + (city ? `, ${city}` : '');

                setFormData(prev => ({ ...prev, address: shortened }));
            }
        } catch (err) {
            console.error("Geocoding failed:", err);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Validation
            if (activeTab === 'business' && !formData.latitude && !formData.longitude) {
                throw new Error("Please select your business location on the map.");
            }

            let proofUrl = null;

            // 1. If business, upload proof document BEFORE signUp
            if (activeTab === 'business') {
                if (!proofFile) {
                    throw new Error("Please upload a proof document (Business License/ID).");
                }

                const fileExt = proofFile.name.split('.').pop();
                const fileName = `proof_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, proofFile);

                if (uploadError) {
                    console.error("Upload Error:", uploadError);
                    throw new Error("Failed to upload proof document: " + uploadError.message);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName);
                proofUrl = publicUrl;
            }

            // 2. Sign up user with ALL metadata
            // This metadata will be picked up by the DB Trigger 'handle_new_user'
            const { data, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        role: activeTab,
                        business_name: formData.business_name,
                        license_id: formData.license_id,
                        address: formData.address,
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                        proof_doc_url: proofUrl
                    }
                }
            });

            if (authError) throw authError;
            if (!data.user) throw new Error("User creation failed.");

            // 3. Success - The DB Trigger handles all table insertions
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
            {/* Simplified Header - Removing 'Create an Account' h2 as requested implies cleaner look, maybe just tabs take prominence */}

            <div className="tabs">
                <div
                    className={`tab ${activeTab === 'user' ? 'active' : ''}`}
                    onClick={() => setActiveTab('user')}
                >
                    User
                </div>
                <div
                    className={`tab ${activeTab === 'business' ? 'active' : ''}`}
                    onClick={() => setActiveTab('business')}
                >
                    Business
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleRegister}>
                <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" name="name" className="form-control" required value={formData.name} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" className="form-control" required value={formData.email} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className="form-control"
                            required
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <span
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666' }}
                        >
                            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </span>
                    </div>
                </div>

                {activeTab === 'business' && (
                    <>
                        <div className="form-group">
                            <label>Business Name</label>
                            <input type="text" name="business_name" className="form-control" required value={formData.business_name} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>License ID</label>
                            <input type="text" name="license_id" className="form-control" required value={formData.license_id} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Business Address (Auto-synced with Map)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    name="address"
                                    className="form-control"
                                    placeholder="Click map to detect address..."
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                                {formData.address && formData.latitude && (
                                    <span style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        fontSize: '0.7rem',
                                        color: '#28a745'
                                    }}>
                                        <i className="fa-solid fa-circle-check"></i> Verified
                                    </span>
                                )}
                            </div>
                            <small style={{ color: '#666' }}>You can refine this address after clicking the map.</small>
                        </div>
                        <div className="form-group">
                            <label>Proof Document (Image) <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="form-control"
                                required={activeTab === 'business'}
                            />
                            <small style={{ color: '#666' }}>Upload your business license or ID for verification.</small>
                        </div>
                        <div className="form-group">
                            <label>Business Location (Click on Map)</label>
                            <MapPicker onLocationSelect={handleLocationSelect} />
                            {formData.latitude && <p style={{ fontSize: '0.8rem', color: 'green', marginTop: '5px' }}>Location Selected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</p>}
                        </div>
                    </>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>

            {activeTab === 'user' && (
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    {/* Google Sign Up Removed */}
                </div>
            )}

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <p className="mt-2 text-center" style={{ fontSize: '0.9rem' }}>Already have an account? <Link href="/login" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Login</Link></p>
                <p className="text-center" style={{ marginTop: '10px', fontSize: '0.9rem' }}><Link href="/" style={{ color: '#666' }}>← Back to Home</Link></p>
            </div>

        </div>
    );
}
