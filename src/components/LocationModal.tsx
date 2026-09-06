import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, X, Check, Globe, Trash2, ExternalLink } from 'lucide-react';
import { Dialog } from './Dialog';
import type { EntryLocation } from '../types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: EntryLocation | null;
  onSaveLocation: (loc: EntryLocation | null) => void;
}

const PRESET_PLACES = ['Home', 'Café', 'Park', 'Office', 'Library', 'Traveling'];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSaveLocation,
}) => {
  const [customName, setCustomName] = useState('');
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [locating, setLocating] = useState(false);
  const [approximating, setApproximating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomName(currentLocation?.name || '');
      setCoords({
        lat: currentLocation?.latitude,
        lng: currentLocation?.longitude,
      });
      setErrorMsg(null);
    }
  }, [isOpen, currentLocation]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setErrorMsg('GPS requires HTTPS in the deployed app. You can still enter a place name manually below.');
      return;
    }

    setLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        // Coordinates are already useful; reverse geocoding is only a convenience.
        setCustomName(`Lat ${latitude.toFixed(2)}, Lon ${longitude.toFixed(2)}`);

        // Attempt reverse geocoding via OpenStreetMap Nominatim
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`,
            {
              headers: {
                'Accept-Language': 'en',
              },
              signal: controller.signal,
            }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || addr.county;
            const country = addr.country;
            const placeLabel = [city, country].filter(Boolean).join(', ') || `Lat ${latitude.toFixed(2)}, Lon ${longitude.toFixed(2)}`;
            setCustomName(placeLabel);
          } else {
            setCustomName(`Lat ${latitude.toFixed(2)}, Lon ${longitude.toFixed(2)}`);
          }
        } catch {
          setCustomName(`Lat ${latitude.toFixed(2)}, Lon ${longitude.toFixed(2)}`);
        } finally {
          window.clearTimeout(timeout);
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg('Location permission was denied. You can enter a place name manually below.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg('Your device could not provide GPS coordinates. Try approximate location or enter a place name manually.');
        } else if (err.code === err.TIMEOUT) {
          setErrorMsg('GPS took too long to respond. Try approximate location or enter a place name manually.');
        } else {
          setErrorMsg('Could not detect location. Please enter your place name manually.');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const handleApproximateLocation = async () => {
    setApproximating(true);
    setErrorMsg(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      if (!res.ok) throw new Error('Approximate location lookup failed');
      const data = await res.json();
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') throw new Error('No coordinates returned');
      setCoords({ lat: data.latitude, lng: data.longitude });
      setCustomName([data.city, data.country_name].filter(Boolean).join(', ') || 'Approximate location');
    } catch {
      setErrorMsg('Approximate location is unavailable. Please enter a place name manually.');
    } finally {
      window.clearTimeout(timeout);
      setApproximating(false);
    }
  };

  const handleSave = () => {
    const trimmed = customName.trim();
    if (!trimmed) {
      onSaveLocation(null);
    } else {
      onSaveLocation({
        name: trimmed,
        latitude: coords.lat,
        longitude: coords.lng,
      });
    }
    onClose();
  };

  const handleClear = () => {
    onSaveLocation(null);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} label="Add Journal Location" className="max-w-md">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[.06] bg-[#141311] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#d6b889]/10 text-[#d6b889]">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif-editor text-base font-medium text-stone-100">Entry Location</h2>
            <p className="text-[11px] text-stone-400">Ground your reflection in place & environment</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded text-stone-400 hover:text-stone-200"
          aria-label="Close location modal"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-4 bg-[#141311] p-5">
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={locating}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-4 py-2.5 text-xs font-medium text-stone-200 transition hover:bg-white/[.08] hover:text-white disabled:opacity-50"
        >
          {locating ? (
            <>
              <div className="h-3.5 w-3.5 rounded-full border border-stone-300 border-t-transparent animate-spin" />
              <span>Detecting coordinates...</span>
            </>
          ) : (
            <>
              <Navigation className="h-3.5 w-3.5 text-[#d6b889]" />
              <span>Detect Current GPS Location</span>
            </>
          )}
        </button>
        <p className="text-[10px] leading-relaxed text-stone-500">
          GPS uses your browser permission. The approximate option uses your network-derived city only when you choose it.
        </p>

        {errorMsg && (
          <div className="space-y-2">
            <p className="text-[11px] text-amber-400/90 leading-relaxed">{errorMsg}</p>
            {(errorMsg.includes('GPS') || errorMsg.includes('position') || errorMsg.includes('detect')) && (
              <button
                type="button"
                onClick={handleApproximateLocation}
                disabled={approximating}
                className="rounded-md border border-[#d6b889]/25 bg-[#d6b889]/[.06] px-2.5 py-1.5 text-[11px] text-[#d6b889] hover:bg-[#d6b889]/[.12] disabled:opacity-50"
              >
                {approximating ? 'Finding approximate location...' : 'Use approximate location'}
              </button>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="location-name-input" className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">
            Place Name or City
          </label>
          <div className="relative flex items-center">
            <Globe className="absolute left-3 h-3.5 w-3.5 text-stone-500" />
            <input
              id="location-name-input"
              type="text"
              placeholder="e.g., Kyoto, Japan or Coffee Shop..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-xs text-stone-200 placeholder:text-stone-600 focus:border-[#d6b889]/60 focus:outline-none focus:ring-1 focus:ring-[#d6b889]/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">
            Quick Suggestions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PLACES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCustomName(p)}
                className="rounded border border-white/[.06] bg-white/[.02] px-2.5 py-1 text-[11px] text-stone-300 transition hover:bg-white/[.08] hover:text-white"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {typeof coords.lat === 'number' && typeof coords.lng === 'number' && (
          <div className="flex items-center justify-between rounded-lg border border-white/[.04] bg-white/[.02] p-2.5 text-[11px] text-stone-400">
            <span>Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}</span>
            <a
              href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#d6b889] hover:underline"
            >
              <span>View in Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-white/[.06] bg-[#11100f] px-5 py-3">
        {currentLocation ? (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-rose-400/80 hover:text-rose-300 transition"
          >
            <Trash2 className="h-3 w-3" />
            <span>Remove</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded bg-[#d6b889] px-3.5 py-1.5 text-xs font-medium text-black transition hover:bg-[#e4c99e]"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Attach Location</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
};
