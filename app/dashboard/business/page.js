"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import '../../styles/dashboard.css';

export default function BusinessDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [settingsSuccess, setSettingsSuccess] = useState(false);
    const [activeVehicles, setActiveVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [settings, setSettings] = useState({
        price_per_hour: 0,
        total_slots_car: 0,
        total_slots_bike: 0,
        max_duration: 24,
        fine_amount: 0
    });
    const [vehicleForm, setVehicleForm] = useState({
        vehicle_number: '',
        vehicle_type: 'car',
        owner_name: ''
    });

    useEffect(() => {
        fetchData();

        const subscription = supabase
            .channel('bookings_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: businessProfile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (businessProfile) {
            setProfile(businessProfile);
            setSettings({
                price_per_hour: businessProfile.price_per_hour,
                total_slots_car: businessProfile.total_slots_car,
                total_slots_bike: businessProfile.total_slots_bike,
                max_duration: businessProfile.max_duration,
                fine_amount: businessProfile.fine_amount
            });
        }

        const { data: parkingAsset } = await supabase
            .from('parking_assets')
            .select('id')
            .eq('owner_id', session.user.id)
            .single();

        if (parkingAsset) {
            const { data: vehicles } = await supabase
                .from('bookings')
                .select('*')
                .eq('parking_id', parkingAsset.id)
                .eq('status', 'active')
                .order('entry_time', { ascending: false });

            setActiveVehicles(vehicles || []);
        }

        setLoading(false);
    };

    const calculateCost = (entryTime, exitTime, pricePerHour, maxDuration, fineAmount) => {
        const entry = new Date(entryTime);
        const exit = new Date(exitTime);

        const durationMs = exit - entry;
        const durationHours = durationMs / (1000 * 60 * 60);

        let cost = Math.ceil(durationHours) * pricePerHour;

        if (durationHours > maxDuration) {
            cost += fineAmount;
        }

        return {
            duration: durationHours.toFixed(2),
            cost: cost.toFixed(2),
            exceeded: durationHours > maxDuration
        };
    };

    const handleVehicleEntry = async (e) => {
        e.preventDefault();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: parkingAsset } = await supabase
            .from('parking_assets')
            .select('id')
            .eq('owner_id', session.user.id)
            .single();

        if (!parkingAsset) {
            alert('Parking asset not found. Please contact support.');
            return;
        }

        const { data: existing } = await supabase
            .from('bookings')
            .select('id')
            .eq('vehicle_number', vehicleForm.vehicle_number.toUpperCase())
            .eq('status', 'active')
            .single();

        if (existing) {
            setVehicleForm({ ...vehicleForm, vehicle_number: '' });
            await fetchData();
            return;
        }

        const { error } = await supabase
            .from('bookings')
            .insert({
                parking_id: parkingAsset.id,
                vehicle_number: vehicleForm.vehicle_number.toUpperCase(),
                vehicle_type: vehicleForm.vehicle_type,
                owner_name: vehicleForm.owner_name || null,
                status: 'active',
                entry_time: new Date().toISOString()
            });

        if (!error) {
            setVehicleForm({ vehicle_number: '', vehicle_type: 'car', owner_name: '' });
            await fetchData();
        } else {
            console.error("Entry Error:", error);
            alert("Entry failed: " + error.message);
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        if (!profile) return;

        const updates = {
            price_per_hour: parseFloat(settings.price_per_hour),
            total_slots_car: parseInt(settings.total_slots_car),
            total_slots_bike: parseInt(settings.total_slots_bike),
            max_duration: parseInt(settings.max_duration),
            fine_amount: parseFloat(settings.fine_amount)
        };

        const { error } = await supabase
            .from('business_profiles')
            .update(updates)
            .eq('id', profile.id);

        if (error) {
            console.error("Update Settings Error:", error);
            alert("Update failed: " + error.message);
            return;
        }

        const { error: syncError } = await supabase
            .from('parking_assets')
            .update({
                price_per_hour: updates.price_per_hour,
                total_slots_car: updates.total_slots_car,
                total_slots_bike: updates.total_slots_bike
            })
            .eq('owner_id', profile.user_id);

        if (syncError) console.error("Sync Error:", syncError);

        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
        await fetchData();
    };

    const handleExit = (booking) => {
        router.push(`/dashboard/business/checkout?id=${booking.id}`);
    };

    if (loading) return <div className="container">Loading Dashboard...</div>;

    const occupiedCar = activeVehicles.filter(v => v.vehicle_type === 'car').length;
    const occupiedBike = activeVehicles.filter(v => v.vehicle_type === 'bike').length;

    const filteredVehicles = activeVehicles.filter(v =>
        v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container dashboard-container">

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>{occupiedCar} / {profile?.total_slots_car || 0}</h3>
                    <p>Car Slots Occupied</p>
                </div>
                <div className="stat-card">
                    <h3>{occupiedBike} / {profile?.total_slots_bike || 0}</h3>
                    <p>Bike Slots Occupied</p>
                </div>
                <div className="stat-card">
                    <h3>NRS {profile?.price_per_hour || 0}</h3>
                    <p>Price / Hour</p>
                </div>
            </div>

            <div className="main-grid">
                <div>
                    <div className="panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>Active Vehicles</h3>
                            <div className="search-group" style={{ position: 'relative', width: '250px' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search Plate No..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ paddingLeft: '35px', borderRadius: '20px' }}
                                />
                                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}></i>
                            </div>
                        </div>
                        <div className="vehicle-list">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Plate No.</th>
                                        <th>Type</th>
                                        <th>Entry Time</th>
                                        <th>Duration</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVehicles.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center">{searchTerm ? "No vehicles matching search." : "No active vehicles."}</td></tr>
                                    ) : (
                                        filteredVehicles.map(v => {
                                            const duration = ((new Date() - new Date(v.entry_time)) / (1000 * 60 * 60)).toFixed(1);
                                            return (
                                                <tr key={v.id}>
                                                    <td>{v.vehicle_number}</td>
                                                    <td style={{ textTransform: 'capitalize' }}>{v.vehicle_type}</td>
                                                    <td>{new Date(v.entry_time).toLocaleTimeString()}</td>
                                                    <td>{duration}h</td>
                                                    <td>
                                                        <button
                                                            onClick={() => handleExit(v)}
                                                            className="btn btn-primary action-btn"
                                                        >
                                                            Exit / Pay
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="panel">
                        <h3>New Vehicle Entry</h3>
                        <form onSubmit={handleVehicleEntry}>
                            <div className="form-group">
                                <label>Vehicle Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. BA 1 PA 1234"
                                    value={vehicleForm.vehicle_number}
                                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_number: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Vehicle Type</label>
                                <select
                                    className="form-control"
                                    value={vehicleForm.vehicle_type}
                                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}
                                >
                                    <option value="car">Car</option>
                                    <option value="bike">Bike</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Owner Name (Optional)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. John Doe"
                                    value={vehicleForm.owner_name}
                                    onChange={(e) => setVehicleForm({ ...vehicleForm, owner_name: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Mark Entry</button>
                        </form>
                    </div>

                    <div className="panel">
                        <h3>Settings</h3>
                        {settingsSuccess && <div className="alert alert-success" style={{ marginBottom: '10px' }}>Settings updated successfully!</div>}
                        <form onSubmit={handleUpdateSettings}>
                            <div className="form-group">
                                <label>Price Per Hour (NRS)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    value={settings.price_per_hour}
                                    onChange={(e) => setSettings({ ...settings, price_per_hour: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Total Car Slots</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={settings.total_slots_car}
                                    onChange={(e) => setSettings({ ...settings, total_slots_car: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Total Bike Slots</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={settings.total_slots_bike}
                                    onChange={(e) => setSettings({ ...settings, total_slots_bike: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Max Duration (Hours)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={settings.max_duration}
                                    onChange={(e) => setSettings({ ...settings, max_duration: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fine Amount (NRS)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    value={settings.fine_amount}
                                    onChange={(e) => setSettings({ ...settings, fine_amount: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Settings</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
