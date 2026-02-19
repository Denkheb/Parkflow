"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from './lib/supabase';
import './styles/home.css';

export default function Home() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Fetch role from profiles or metadata
        // For now, assuming metadata has role if set during signup, 
        // or we fetch from public.profiles.
        // Let's try metadata first as it's faster if standard.
        // But our SQL schema puts role in public.profiles.
        // We'll fetch it.
        checkRole(session.user.id);
      }
    });
  }, []);

  const checkRole = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (data) setRole(data.role);
  };

  const findParkingLink = (session && role === 'user') ? '/dashboard/user' : '/register';

  return (
    <header className="hero">
      <div className="container">
        <h1>Find Parking in Seconds</h1>
        <p>The smartest way to park your vehicle. Locate nearby parking spots, check availability, and pay seamlessly.</p>

        <div className="cta-group" style={{ justifyContent: 'center', marginTop: '30px' }}>
          <Link href={findParkingLink} className="btn btn-primary btn-large">
            <i className="fa-solid fa-user-plus"></i> Join Parkflow
          </Link>
        </div>
      </div>
    </header>
  );
}