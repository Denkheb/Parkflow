"use client";
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

const redIcon = typeof window !== 'undefined' ? L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
}) : null;

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

function RoutingControl({ userLocation, destination }) {
    const map = useMap();
    const routingControlRef = useRef(null);
    const isMountedRef = useRef(false);

    useEffect(() => {
        if (!map) return;
        isMountedRef.current = true;

        const originalRemoveLayer = map.removeLayer.bind(map);
        map.removeLayer = (layer) => {
            if (!isMountedRef.current) return map;
            try { return originalRemoveLayer(layer); } catch (e) { }
            return map;
        };

        routingControlRef.current = L.Routing.control({
            waypoints: [
                L.latLng(userLocation.lat, userLocation.lng),
                L.latLng(destination.lat, destination.lng)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: false,
            show: false,
            createMarker: () => null
        }).addTo(map);

        return () => {
            isMountedRef.current = false;
            try { map.removeLayer = originalRemoveLayer; } catch (_) { }

            if (routingControlRef.current) {
                try {
                    const controlToRemove = routingControlRef.current;
                    routingControlRef.current = null;
                    try { controlToRemove.setWaypoints([]); } catch (_) { }
                    if (map) {
                        map.removeControl(controlToRemove);
                    }
                } catch (e) { }
            }
        };
    }, [map]);

    useEffect(() => {
        if (!isMountedRef.current || !routingControlRef.current) return;
        try {
            routingControlRef.current.setWaypoints([
                L.latLng(userLocation.lat, userLocation.lng),
                L.latLng(destination.lat, destination.lng)
            ]);
        } catch (e) { }
    }, [userLocation, destination]);

    return null;
}

function MapController({ center, selectedId, parkings }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, { duration: 1.5 });
            const p = parkings.find(pk => pk.id === selectedId);
            if (p) {
                L.popup()
                    .setLatLng([p.latitude, p.longitude])
                    .setContent(`<strong>${p.name}</strong><br/>${p.address || ''}`)
                    .openOn(map);
            }
        }
    }, [center, selectedId, map]);
    return null;
}

export default function Map({ parkings, userLocation, routingDestination, selectedId, center }) {
    const defaultCenter = [27.7172, 85.3240];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '400px', width: '100%', borderRadius: '12px', border: '1px solid #ddd', zIndex: 1 }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {parkings.map(parking => (
                <Marker
                    key={parking.id}
                    position={[parking.latitude, parking.longitude]}
                >
                    <Popup>
                        <strong>{parking.name}</strong> <br />
                        Price: NRS {parking.price_per_hour} / hr
                    </Popup>
                </Marker>
            ))}

            {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={redIcon}>
                    <Popup>Your Location</Popup>
                </Marker>
            )}

            {userLocation && routingDestination && (
                <RoutingControl
                    userLocation={userLocation}
                    destination={routingDestination}
                />
            )}

            <MapController center={center} selectedId={selectedId} parkings={parkings} />
        </MapContainer>
    );
}
