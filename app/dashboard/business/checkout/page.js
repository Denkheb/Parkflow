"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import '../../../styles/dashboard.css';

export default function CheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const [profile, setProfile] = useState(null);
    const [calculation, setCalculation] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    useEffect(() => {
        if (bookingId) {
            fetchBookingDetails();
        }
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: bookingData } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        const { data: profileData } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (bookingData && profileData) {
            setBooking(bookingData);
            setProfile(profileData);

            const calc = calculateCost(
                bookingData.entry_time,
                new Date().toISOString(),
                profileData.price_per_hour,
                profileData.max_duration,
                profileData.fine_amount
            );
            setCalculation(calc);
        }

        setLoading(false);
    };

    const calculateCost = (entryTime, exitTime, pricePerHour, maxDuration, fineAmount) => {
        const entry = new Date(entryTime);
        const exit = new Date(exitTime);

        const durationMs = exit - entry;
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        const durationHours = durationMs / (1000 * 60 * 60);

        const pricePerMinute = pricePerHour / 60;
        let cost = durationMinutes * pricePerMinute;

        if (durationHours > maxDuration) {
            cost += fineAmount;
        }

        return {
            minutes: durationMinutes,
            hours: durationHours.toFixed(2),
            cost: cost.toFixed(2),
            exceeded: durationHours > maxDuration
        };
    };

    const handleConfirmPayment = async () => {
        const exitTime = new Date().toISOString();

        await supabase
            .from('bookings')
            .update({
                exit_time: exitTime,
                status: 'completed',
                total_amount: parseFloat(calculation.cost)
            })
            .eq('id', bookingId);

        // Print receipt
        window.print();

        // Redirect after print
        setTimeout(() => {
            router.push('/dashboard/business');
        }, 500);
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!booking || !calculation) return <div className="container">Booking not found</div>;

    const hours = Math.floor(calculation.minutes / 60);
    const minutes = calculation.minutes % 60;

    return (
        <>
            <style jsx global>{`
                @media print {
                    .no-print, .navbar, .admin-nav, nav { display: none !important; }
                    body { 
                        background: white;
                        margin: 0;
                        padding: 0;
                    }
                    .receipt-container { 
                        box-shadow: none !important; 
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 20px !important;
                        border: 2px solid #000 !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                    }
                    .receipt-header {
                        text-align: center;
                        border-bottom: 2px dashed #000;
                        padding-bottom: 15px;
                        margin-bottom: 15px;
                    }
                    .receipt-row {
                        border-bottom: 1px dotted #999 !important;
                    }
                    .receipt-total {
                        border-top: 2px solid #000 !important;
                        border-bottom: 2px solid #000 !important;
                    }
                    .receipt-footer {
                        text-align: center;
                        margin-top: 20px;
                        padding-top: 15px;
                        border-top: 2px dashed #000;
                        font-size: 0.9rem;
                    }
                }
            `}</style>

            <div className="container" style={{ maxWidth: '600px', margin: '50px auto' }}>
                <div className="receipt-container" style={{
                    padding: '30px',
                    background: '#fff',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    borderRadius: '8px'
                }}>
                    <div className="receipt-header">
                        <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem', fontWeight: 'bold' }}>PARKFLOW</h1>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>{profile.business_name}</h2>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Parking Receipt</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#999' }}>
                            {new Date().toLocaleString()}
                        </p>
                    </div>

                    <div className="receipt-row" style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Vehicle Number:</span>
                        <strong style={{ fontSize: '1.1rem' }}>{booking.vehicle_number}</strong>
                    </div>

                    {booking.owner_name && (
                        <div className="receipt-row" style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Owner Name:</span>
                            <span>{booking.owner_name}</span>
                        </div>
                    )}

                    <div className="receipt-row" style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Vehicle Type:</span>
                        <span style={{ textTransform: 'capitalize' }}>{booking.vehicle_type}</span>
                    </div>

                    <div className="receipt-row" style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Entry Time:</span>
                        <span>{new Date(booking.entry_time).toLocaleString()}</span>
                    </div>

                    <div className="receipt-row" style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Exit Time:</span>
                        <span>{new Date().toLocaleString()}</span>
                    </div>

                    <div className="receipt-row" style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Duration:</span>
                        <strong>{hours}h {minutes}m</strong>
                    </div>

                    <div className="receipt-row" style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Rate:</span>
                        <span>NRS {profile.price_per_hour} / hour</span>
                    </div>

                    {calculation.exceeded && (
                        <div className="receipt-row" style={{
                            borderBottom: '1px solid #eee',
                            padding: '10px 0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: '#dc3545'
                        }}>
                            <span>⚠️ Fine (Exceeded {profile.max_duration}h):</span>
                            <span>NRS {profile.fine_amount}</span>
                        </div>
                    )}

                    <div className="receipt-total" style={{
                        borderTop: '2px solid #000',
                        borderBottom: '2px solid #000',
                        padding: '15px 0',
                        margin: '15px 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                    }}>
                        <span>TOTAL AMOUNT:</span>
                        <span>NRS {calculation.cost}</span>
                    </div>

                    <div className="no-print" style={{ marginTop: '30px' }}>
                        <div className="form-group">
                            <label>Payment Method</label>
                            <select
                                className="form-control"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <option value="cash">Cash</option>
                                <option value="online">Online Payment</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={() => router.push('/dashboard/business')}
                                className="btn btn-danger"
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                Confirm & Print Receipt
                            </button>
                        </div>
                    </div>

                    <div className="receipt-footer">
                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Thank you for parking with us!</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#999' }}>
                            Parkflow - Smart Parking Management System
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
