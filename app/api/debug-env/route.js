import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        server_side_check: {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing',
            // Check without prefix just in case as a secret
            SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Present' : '❌ Missing',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'
        },
        node_env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
}
