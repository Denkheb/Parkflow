"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DebugEnv() {
    const [debugInfo, setDebugInfo] = useState({});

    useEffect(() => {
        setDebugInfo({
            'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing',
        });
    }, []);

    const keys = Object.keys(debugInfo);

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
            <h1>Environment Variable Debugger (v2)</h1>
            <p>This page checks if the specific keys are found in your browser.</p>

            <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
                <h3>Supabase Keys:</h3>
                <ul>
                    {keys.map(key => (
                        <li key={key}><code>{key}</code>: {debugInfo[key]}</li>
                    ))}
                </ul>
            </div>

            <div style={{ marginTop: '20px' }}>
                <Link href="/login" style={{ color: 'blue' }}>← Back to Login</Link>
            </div>

            <div style={{ marginTop: '40px', fontSize: '0.8rem', color: '#666' }}>
                <p><strong>Note:</strong> If the keys are missing, they were either not added to Vercel correctly or the project was not redeployed after adding them.</p>
            </div>
        </div>
    );
}
