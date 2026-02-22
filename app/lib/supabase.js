import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

if (typeof window !== 'undefined') {
    if (supabaseUrl.includes('placeholder')) {
        console.warn("⚠️ Parkflow: Using placeholder Supabase URL. Authentication will fail. Check Vercel Env Vars!");
    } else {
        console.log("✅ Parkflow: Supabase initialized with URL:", supabaseUrl.substring(0, 10) + "...");
    }
}

export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        cookieOptions: {
            maxAge: 7200,
        }
    }
)
