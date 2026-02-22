"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from './lib/supabase';
import './styles/home.css';

export default function Home() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRole = async (userId) => {
    if (!supabase) return;
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