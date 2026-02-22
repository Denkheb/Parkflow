"use client";
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

// Red icon for user location
const redIcon = typeof window !== 'undefined' ? L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
}) : null;

function MapController({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom || 16, { animate: true });
        }
    }, [center, zoom, map]);
    return null;
}

function RoutingControl({ userLocation, destination }) {
    const map = useMap();
    const routingControlRef = useRef(null);
    const isMountedRef = useRef(true);

    // Initial creation of the routing control instance
    useEffect(() => {
        if (!map) return;
        isMountedRef.current = true;

        // Monkey-patch removeLayer on the map to swallow errors from stale async callbacks
        const originalRemoveLayer = map.removeLayer.bind(map);
        map.removeLayer = (layer) => {
            if (!isMountedRef.current) return map;
            try { return originalRemoveLayer(layer); } catch (e) { /* stale async callback – ignore */ }
            return map;
        };

        try {
            const control = L.Routing.control({
                waypoints: [],
                routeWhileDragging: false,
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: false,
                showAlternatives: false,
                lineOptions: {
                    styles: [{ color: '#3388ff', weight: 6 }]
                },
                createMarker: () => null
            }).addTo(map);

            routingControlRef.current = control;
        } catch (e) {
            console.error("Failed to initialize routing control:", e);
        }

        return () => {
            isMountedRef.current = false;
            // Restore original removeLayer
            try { map.removeLayer = originalRemoveLayer; } catch (_) { }

            if (routingControlRef.current) {
                try {
                    const controlToRemove = routingControlRef.current;
                    routingControlRef.current = null;
                    // Clear waypoints first so LRM doesn't try to re-route on removal
                    try { controlToRemove.setWaypoints([]); } catch (_) { }
                    if (map) {
                        map.removeControl(controlToRemove);
                    }
                } catch (e) {
                    console.log("Safe routing cleanup handled:", e.message);
                }
            }
        };
    }, [map]);

    // Dynamic waypoint updates
    useEffect(() => {
        if (!isMountedRef.current || !routingControlRef.current) return;
        try {
            if (userLocation && destination) {
                routingControlRef.current.setWaypoints([
                    L.latLng(userLocation.lat, userLocation.lng),
                    L.latLng(destination.lat, destination.lng)
                ]);
            } else {
                routingControlRef.current.setWaypoints([]);
            }
        } catch (e) {
            console.warn("Waypoint update handled safely:", e.message);
        }
    }, [userLocation, destination]);

    return null;
}

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
                        Car Available: {parking.available_slots_car}<br />
                        Bike Available: {parking.available_slots_bike}
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}

export default function Map({ parkings = [], selectedId = null, center = null, userLocation = null, routingDestination = null }) {
    const defaultCenter = [27.7172, 85.3240];

    return (
        <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <MapController center={center} zoom={16} />

            {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={redIcon}>
                    <Popup>You are here</Popup>
                </Marker>
            )}

            {userLocation && (
                <RoutingControl userLocation={userLocation} destination={routingDestination} />
            )}

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
