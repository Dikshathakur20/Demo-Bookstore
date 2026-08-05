"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Leaflet needs `window`, so map + marker logic must be client-only
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });

type LatLng = { lat: number; lng: number };
type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

type Props = {
  onAddressSelect: (address: string) => void;
  onClose: () => void;
};

// Default center: New Delhi, India
const DEFAULT_CENTER: LatLng = { lat: 28.6139, lng: 77.209 };

export default function LocationPicker({ onAddressSelect, onClose }: Props) {
  const [position, setPosition] = useState<LatLng>(DEFAULT_CENTER);
  const [addressPreview, setAddressPreview] = useState("");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [locating, setLocating] = useState(false);
  const [leafletIcon, setLeafletIcon] = useState<any>(null);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  
  const mapRef = useRef<any>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fix default marker icon
  useEffect(() => {
    import("leaflet").then((L) => {
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      setLeafletIcon(icon);
    });
  }, []);

  useEffect(() => {
    reverseGeocode(position);
  }, []);

  // Search locations with debounce
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeout.current = setTimeout(() => {
      searchLocations(searchQuery);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  async function searchLocations(query: string) {
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`
      );
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }

  async function reverseGeocode(pos: LatLng) {
    setLoadingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`
      );
      const data = await res.json();
      setAddressPreview(data.display_name || "");
    } catch {
      setAddressPreview("");
    } finally {
      setLoadingAddress(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(newPos);
        mapRef.current?.flyTo(newPos, 15);
        reverseGeocode(newPos);
        setLocating(false);
        setShowSuggestions(false);
      },
      () => setLocating(false)
    );
  }

  function handleMapClick(e: any) {
    const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
    setPosition(newPos);
    reverseGeocode(newPos);
    setShowSuggestions(false);
  }

  function handleSuggestionClick(suggestion: Suggestion) {
    const newPos = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    };
    setPosition(newPos);
    setAddressPreview(suggestion.display_name);
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Fly to selected location
    mapRef.current?.flyTo(newPos, 15);
    reverseGeocode(newPos);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && searchQuery.length >= 3) {
      e.preventDefault();
      searchLocations(searchQuery);
    }
  }

  function MapClickHandler() {
    const { useMapEvents } = require("react-leaflet");
    useMapEvents({ click: handleMapClick });
    return null;
  }

  return (
    <div className="location-modal-backdrop" onClick={onClose}>
      <div className="location-modal" onClick={(e) => e.stopPropagation()}>
        <div className="location-modal-header">
          <h3 style={{ margin: 0 }}>Pick delivery location</h3>
          <button onClick={onClose} className="location-modal-close">✕</button>
        </div>

        {/* ✅ Search Bar */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="search-input"
            />
            {searching && <span className="search-spinner">⏳</span>}
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* ✅ Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="suggestion-icon">📍</span>
                  <span className="suggestion-text">{suggestion.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {showSuggestions && suggestions.length === 0 && searchQuery.length >= 3 && !searching && (
            <div className="suggestions-dropdown no-results">
              <p className="no-results-text">No locations found. Try a different search.</p>
            </div>
          )}
        </div>

        <button
          onClick={handleUseCurrentLocation}
          className="btn-secondary"
          disabled={locating}
          style={{ marginBottom: 12, width: "100%", justifyContent: "center" }}
        >
          {locating ? "Locating..." : "📍 Use my current location"}
        </button>

        <div style={{ height: 320, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {leafletIcon && (
              <Marker position={[position.lat, position.lng]} icon={leafletIcon} />
            )}
            <MapClickHandler />
          </MapContainer>
        </div>

        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          Tap anywhere on the map to move the pin or search above.
        </p>

        <div className="location-address-preview">
          {loadingAddress ? "Fetching address..." : addressPreview || "No address found"}
        </div>

        <button
          onClick={() => onAddressSelect(addressPreview)}
          disabled={!addressPreview || loadingAddress}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
        >
          Confirm this address
        </button>
      </div>
    </div>
  );
}