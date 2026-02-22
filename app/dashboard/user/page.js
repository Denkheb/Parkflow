"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import '../../styles/dashboard.css';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapWithNoSSR = dynamic(() => import('../../components/Map'), {
    ssr: false,
    loading: () => <p>Loading Map...</p>
});

export default function UserDashboard() {
    const [loading, setLoading] = useState(true);
    const [parkings, setParkings] = useState([]);
    const [filteredParkings, setFilteredParkings] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [routingDestination, setRoutingDestination] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedParkingId, setSelectedParkingId] = useState(null);
    const [mapCenter, setMapCenter] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        fetchParkings();

        const subscription = supabase
            .channel('parking_assets_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_assets' }, () => {
                fetchParkings();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchParkings = async () => {
        const { data, error } = await supabase
            .from('parking_assets')
            .select('*')
            .eq('is_available', true);

        if (error) {
            console.error(error);
        } else {
            setParkings(data || []);
            setFilteredParkings(data || []);
        }
        setLoading(false);
    };

    const focusOnMap = (parking) => {
        if (!parking) return;
        setSelectedParkingId(parking.id);
        setMapCenter([parking.latitude, parking.longitude]);
    };

    const handleGetDirections = (parking) => {
        if (!userLocation) {
            handleFindNearby(() => {
                setRoutingDestination({ lat: parking.latitude, lng: parking.longitude });
                focusOnMap(parking);
            });
            return;
        }
        setRoutingDestination({ lat: parking.latitude, lng: parking.longitude });
        focusOnMap(parking);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const highlightParking = (parking) => {
        if (!parking) return;
        focusOnMap(parking);

        setTimeout(() => {
            const card = document.getElementById(`parking-card-${parking.id}`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handleSearch = (forcedQuery = null) => {
        const queryToUse = (forcedQuery !== null ? forcedQuery : searchQuery).trim().toLowerCase();
        setSuggestions([]);

        if (!queryToUse) {
            setFilteredParkings(parkings);
            setSelectedParkingId(null);
            return;
        }

        const matches = parkings.filter(p =>
            (p.address && p.address.toLowerCase().includes(queryToUse)) ||
            p.name.toLowerCase().includes(queryToUse)
        );

        const sortedWithMatchesFirst = [...parkings].sort((a, b) => {
            const aMatch = (a.address && a.address.toLowerCase().includes(queryToUse)) || a.name.toLowerCase().includes(queryToUse);
            const bMatch = (b.address && b.address.toLowerCase().includes(queryToUse)) || b.name.toLowerCase().includes(queryToUse);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });

        setFilteredParkings(sortedWithMatchesFirst);

        if (matches.length > 0) {
            const exactMatch = matches.find(p =>
                p.address?.toLowerCase() === queryToUse ||
                p.name.toLowerCase() === queryToUse
            );
            focusOnMap(exactMatch || matches[0]);
        }
    };

    const handleSearchInputChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        updateSuggestions(val);
    };

    const updateSuggestions = (val) => {
        let matches = parkings
            .filter(p => p.address)
            .map(p => p.address)
            .filter((v, i, a) => a.indexOf(v) === i);

        if (val.trim().length > 0) {
            matches = matches.filter(addr => addr.toLowerCase().includes(val.toLowerCase()));
        }

        setSuggestions(matches.slice(0, 5));
    };

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
    };

    const handleFindNearby = (callback = null) => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLoc = { lat: latitude, lng: longitude };
                setUserLocation(newLoc);

                const sorted = parkings.map(p => {
                    const dist = calculateDistance(latitude, longitude, p.latitude, p.longitude);
                    return { ...p, distance: dist };
                }).sort((a, b) => a.distance - b.distance);

                if (sorted.length > 0 && !callback) {
                    const nearest = sorted[0];
                    focusOnMap(nearest);
                    setRoutingDestination({ lat: nearest.latitude, lng: nearest.longitude });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }

                setFilteredParkings(sorted);
                setLoading(false);

                if (callback && typeof callback === 'function') {
                    callback(newLoc);
                }
            },
            (err) => {
                console.error("Geolocation Error:", err);
                alert("Unable to retrieve your location. Please allow location access.");
                setLoading(false);
            }
        );
    };

    return (
        <div className="container dashboard-container">

            <div className="search-area">
                <input
                    type="text"
                    id="searchInput"
                    className="form-control"
                    placeholder="Search by area or location..."
                    style={{ flex: 1 }}
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => {
                        updateSuggestions(searchQuery);
                        setShowSuggestions(true);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    autoComplete="off"
                />

                {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-list" onMouseLeave={() => setShowSuggestions(false)}>
                        {suggestions.map((s, idx) => (
                            <div
                                key={idx}
                                className="suggestion-item"
                                onClick={() => {
                                    setSearchQuery(s);
                                    handleSearch(s);
                                    setShowSuggestions(false);
                                }}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                )}

                <button className="btn btn-primary" onClick={() => handleSearch()}>Search</button>
                <button onClick={() => handleFindNearby()} className="btn" style={{ background: '#333', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-location-crosshairs"></i> Find Nearby
                </button>
            </div>

            <div id="map">
                <MapWithNoSSR
                    parkings={parkings}
                    userLocation={userLocation}
                    routingDestination={routingDestination}
                    selectedId={selectedParkingId}
                    center={mapCenter}
                />
            </div>

            <h2>Available Parking Lots</h2>
            <div className="parking-grid">
                {loading ? (
                    <p>Loading...</p>
                ) : filteredParkings.length === 0 ? (
                    <p>No parking lots found in this area.</p>
                ) : (
                    filteredParkings.map(parking => (
                        <div
                            key={parking.id}
                            id={`parking-card-${parking.id}`}
                            className={`parking-card ${selectedParkingId === parking.id ? 'selected' : ''}`}
                            onClick={() => highlightParking(parking)}
                            style={{
                                cursor: 'pointer',
                                border: selectedParkingId === parking.id ? '2px solid var(--primary-color)' : '1px solid #f0f0f0',
                                transform: selectedParkingId === parking.id ? 'scale(1.02)' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div className="grid-header">
                                <h3>{parking.name}</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    {parking.distance && (
                                        <span className="distance-badge">
                                            {parking.distance > 1 ? `${parking.distance.toFixed(1)} km` : `${(parking.distance * 1000).toFixed(0)} m`}
                                        </span>
                                    )}
                                    {parking.distance && parking.id === filteredParkings[0]?.id && (
                                        <span className="nearest-badge">Nearest</span>
                                    )}
                                </div>
                            </div>
                            <p className="price-tag">
                                NRS {parking.price_per_hour} <span style={{ fontSize: '0.8rem', color: '#666' }}>/hr</span>
                            </p>
                            <p style={{ margin: '15px 0', color: '#444', fontSize: '0.95rem' }}>
                                Car Available: <strong>{parking.available_slots_car}</strong> / {parking.total_slots_car} <br />
                                Bike Available: <strong>{parking.available_slots_bike}</strong> / {parking.total_slots_bike}
                            </p>
                            <p style={{ color: '#666', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '15px' }}>
                                <span>{parking.address || `Lat: ${parking.latitude?.toFixed(4)}, Lng: ${parking.longitude?.toFixed(4)}`}</span>
                            </p>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleGetDirections(parking);
                                }}
                            >
                                Get Directions
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
