"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DebugEnv() {
    const [envKeys, setEnvKeys] = useState([]);

    useEffect(() => {
        // Find all keys starting with NEXT_PUBLIC_
        const keys = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'));
        setEnvKeys(keys);
    }, []);

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
            <h1>Environment Variable Debugger</h1>
            <p>This page lists all public environment variables detected by the browser.</p>

            <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
                <h3>Detected Keys (NEXT_PUBLIC_*):</h3>
                {envKeys.length === 0 ? (
                    <p style={{ color: 'red' }}><strong>No NEXT_PUBLIC_ variables found!</strong></p>
                ) : (
                    <ul>
                        {envKeys.map(key => (
                            <li key={key}><code>{key}</code>: {process.env[key] ? '✅ Value Present' : '❌ Empty Value'}</li>
                        ))}
                    </ul>
                )}
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
