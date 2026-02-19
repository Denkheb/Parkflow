"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
    const [session, setSession] = useState(null);
    const [dashboardLink, setDashboardLink] = useState('/dashboard/user'); // Default fallback
    const router = useRouter();
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dashboard');

    useEffect(() => {
        const getRoleAndSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session) {
                // Try to get role from metadata first (faster)
                let role = session.user.user_metadata?.role;

                if (!role) {
                    // Fallback to fetching from profiles table
                    const { data } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();
                    role = data?.role;
                }

                if (role === 'business') {
                    setDashboardLink('/dashboard/business');
                } else if (role === 'admin') {
                    setDashboardLink('/dashboard/admin');
                } else {
                    setDashboardLink('/dashboard/user');
                }
            } else {
                // Check for hardcoded admin cookie
                if (typeof document !== 'undefined' && document.cookie.includes('parkflow_admin=')) {
                    setSession({ user: { user_metadata: { role: 'admin' } } });
                    setDashboardLink('/dashboard/admin');
                }
            }
        };

        getRoleAndSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            getRoleAndSession();
        });

        return () => subscription.unsubscribe();
    }, [pathname]);

    const handleLogout = async () => {
        // Clear hardcoded admin cookie
        if (typeof document !== 'undefined') {
            document.cookie = "parkflow_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        await supabase.auth.signOut();
        setSession(null);
        router.refresh();
        router.push('/login');
    };


    return (
        <nav className="navbar">
            <div className="container">
                {isDashboard ? ( // Disable link on dashboard
                    <span className="logo" style={{ textDecoration: 'none', cursor: 'default' }}>Park<span>flow</span></span>
                ) : (
                    <Link href="/" className="logo" style={{ textDecoration: 'none' }}>Park<span>flow</span></Link>
                )}
                <ul className="nav-links">
                    {session ? (
                        <>
                            <li>
                                <button onClick={handleLogout} className="btn" style={{ marginLeft: '10px' }}>
                                    <i className="fa-solid fa-right-from-bracket"></i> Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        <li>
                            <Link href="/login" className="btn">
                                <i className="fa-solid fa-right-to-bracket"></i> Login
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
}
