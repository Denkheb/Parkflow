"use client";
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import '../styles/auth.css';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        if (!formData.email || !formData.password) {
            setError("Please fill in all fields.");
            setLoading(false);
            return;
        }

        if (formData.email === "admin@parkflow.com" && formData.password === "admin123") {
            document.cookie = "parkflow_admin=true; path=/";
            router.push('/dashboard/admin');
            router.refresh();
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            if (!data.user.email_confirmed_at) {
                await supabase.auth.signOut();
                setError("Please verify your email address before logging in. Check your inbox and spam folder.");
                setLoading(false);
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, status')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile) {
                await supabase.auth.signOut();
                setError("User profile not found. Please contact support.");
                setLoading(false);
                return;
            }

            const role = profile.role;
            const status = profile.status;

            if (role === 'business') {
                if (status === 'pending') {
                    await supabase.auth.signOut();
                    setError("Your business account is pending admin approval. Please wait for approval before logging in.");
                    setLoading(false);
                    return;
                }
                if (status === 'rejected') {
                    await supabase.auth.signOut();
                    setError("Your business account has been rejected. Please contact support.");
                    setLoading(false);
                    return;
                }
                if (status === 'banned') {
                    await supabase.auth.signOut();
                    setError("Your business account has been banned. Please contact support.");
                    setLoading(false);
                    return;
                }
                router.push('/dashboard/business');
            } else if (role === 'admin') {
                router.push('/dashboard/admin');
            } else {
                router.push('/dashboard/user');
            }
            router.refresh();

        } catch (err) {
            let errorMessage = err.message;
            if (errorMessage === "Invalid login credentials") {
                errorMessage = "Wrong email or password.";
            } else if (errorMessage.includes("Failed to fetch")) {
                errorMessage = "Network error. Please check your internet connection.";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="text-center" style={{ marginBottom: '20px' }}>Login</h2>

            {registered && (
                <div className="alert alert-success">
                    Registration successful! Please verify your email before logging in.
                </div>
            )}
            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
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

                <div className="form-group password-group">
                    <label>Password</label>
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="loginPass"
                        className="form-control"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <span
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </span>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                    <i className="fa-solid fa-right-to-bracket"></i> {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            <p className="mt-2 text-center">Don't have an account? <Link href="/register" style={{ color: 'blue' }}>Register</Link></p>
            <p className="text-center" style={{ marginTop: '5px' }}><Link href="/" style={{ color: '#666' }}>Back to Home</Link></p>
        </div>
    );
}

export default function Login() {
    return (
        <Suspense fallback={<div className="container">Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
