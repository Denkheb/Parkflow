"use client";
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Fix for default Leaflet icon not loading in Next.js
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

// Helper component to center and zoom map
function MapController({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom || 16, { animate: true });
        }
    }, [center, zoom, map]);
    return null;
}

// Sub-component for Marker to handle reactive popups
function SmartMarker({ parking, selectedId }) {
    const markerRef = useRef(null);

    useEffect(() => {
        if (selectedId === parking.id && markerRef.current) {
            markerRef.current.openPopup();
        }
    }, [selectedId, parking.id]);

    return (
        <Marker
            ref={markerRef}
            position={[parking.latitude, parking.longitude]}
        >
            <Popup>
                <div style={{ minWidth: '150px' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{parking.name}</strong><br />
                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>NRS {parking.price_per_hour}/hr</span><br />
                    <div style={{ marginTop: '5px', fontSize: '0.85rem', color: '#555' }}>
                        🚗 Available: {parking.available_slots_car}<br />
                        🏍️ Available: {parking.available_slots_bike}
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}

export default function Map({ parkings = [], selectedId = null, center = null }) {
    const defaultCenter = [27.7172, 85.3240];

    return (
        <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <MapController center={center} zoom={16} />

            {parkings.map(parking => (
                parking.latitude && parking.longitude && (
                    <SmartMarker
                        key={parking.id}
                        parking={parking}
                        selectedId={selectedId}
                    />
                )
            ))}
        </MapContainer>
    );
}
