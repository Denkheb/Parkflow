"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
    const pathname = usePathname();
    const isActive = (path) => pathname === path;

    return (
        <div style={{
            background: 'rgba(51, 51, 51, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            padding: '15px 0',
            marginBottom: '30px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
            }}>
                <strong style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>ADMIN</strong>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <Link href="/dashboard/admin" style={{
                        color: isActive('/dashboard/admin') ? 'var(--primary-color)' : '#bbb',
                        textDecoration: 'none',
                        fontWeight: isActive('/dashboard/admin') ? '600' : '400',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease'
                    }}>
                        Businesses
                    </Link>
                    <Link href="/dashboard/admin/vehicles" style={{
                        color: isActive('/dashboard/admin/vehicles') ? 'var(--primary-color)' : '#bbb',
                        textDecoration: 'none',
                        fontWeight: isActive('/dashboard/admin/vehicles') ? '600' : '400',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease'
                    }}>
                        Vehicles
                    </Link>
                </div>
            </div>
        </div >
    );
}
