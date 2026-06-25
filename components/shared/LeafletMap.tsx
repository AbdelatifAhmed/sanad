"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon path issues in Next.js
const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LeafletMapProps {
  center: [number, number]; // [latitude, longitude]
  zoom?: number;
  readOnly?: boolean;
  onChange?: (coords: [number, number]) => void; // returns [latitude, longitude]
  className?: string;
}

export default function LeafletMap({
  center,
  zoom = 13,
  readOnly = false,
  onChange,
  className = "w-full h-full",
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: !readOnly,
      doubleClickZoom: !readOnly,
      boxZoom: !readOnly,
      keyboard: !readOnly,
      dragging: !readOnly,
      zoomControl: !readOnly,
    });

    mapRef.current = map;

    // Add Tile Layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add Marker
    const marker = L.marker(center, {
      icon: customIcon,
      draggable: !readOnly,
    }).addTo(map);

    markerRef.current = marker;

    // Force Leaflet to recalculate container size to prevent grey block loading issues
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Listen to dragend events on the marker
    if (!readOnly && onChange) {
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        onChange([position.lat, position.lng]);
      });

      // Also allow clicking map to reposition marker
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChange([lat, lng]);
      });
    }

    // Cleanup map instance on unmount
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [readOnly, zoom]);

  // Handle updates to center programmatically (e.g. from location detection)
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom());
      markerRef.current.setLatLng(center);
    }
  }, [center]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
      <div ref={mapContainerRef} className={className} style={{ minHeight: "100%", width: "100%" }} />
    </div>
  );
}
