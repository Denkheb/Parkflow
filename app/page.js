"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './lib/supabase';
import './styles/home.css';

export default function Home() {
  const [session, setSession] = useState(null);
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
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (data && data.role) {
      if (data.role === 'business') {
        router.push('/dashboard/business');
      } else if (data.role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/user');
      }
    }
  };

  return (
    <div className="homepage-wrapper">
      <header className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>The Smartest Way to <span>Park</span></h1>
            <p>Find, book, and navigate to the nearest parking spot in seconds. Stress-free parking for a faster life.</p>
            <div className="hero-btns">
              <button
                onClick={() => router.push('/register')}
                className="btn btn-primary"
              >
                Get Started
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-secondary"
              >
                How it Works
              </button>
            </div>
          </div>
          <div className="hero-image">
            <img src="/PARKFLOWLOGO.png" alt="Parkflow App" onError={(e) => e.target.style.display = 'none'} />
          </div>
        </div>
      </header>

      <section id="how-it-works" className="features">
        <div className="container">
          <h2 className="section-title">Why Choose <span>Parkflow?</span></h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="icon"><i className="fa-solid fa-map-location-dot"></i></div>
              <h3>Real-time Tracking</h3>
              <p>See exactly how many spots are left in your favorite parking lots before you even arrive.</p>
            </div>
            <div className="feature-card">
              <div className="icon"><i className="fa-solid fa-route"></i></div>
              <h3>Smart Navigation</h3>
              <p>Get the fastest route directly to the entrance of the parking lot using our built-in maps.</p>
            </div>
            <div className="feature-card">
              <div className="icon"><i className="fa-solid fa-receipt"></i></div>
              <h3>Digital Receipts</h3>
              <p>No more paper tickets. Manage your parking history and payments all in one place.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Parkflow. Smart Parking Management System.</p>
        </div>
      </footer>
    </div>
  );
}