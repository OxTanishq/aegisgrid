/**
 * AEGIS GRID — Real Interactive Geospatial Command Map
 * Powered by Google Maps Platform (@vis.gl/react-google-maps) & Three.js 3D Army Characters.
 * Features live location tracking, distance calculations, walking/driving routes,
 * marker clustering, 3D character animation states, and emergency SOS alerts.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useAegis } from '../../context/AegisContext';
import { Participant, MapMarker, CharacterAnimationState, UniformColor } from '../../types';
import { ArmyCharacter3D } from '../common/ArmyCharacter3D';
import {
  calculateHaversineDistanceM,
  formatDistance,
  estimateWalkingMinutes,
  estimateDrivingMinutes,
  calculateBearingDegrees,
} from '../../services/algorithms';
import {
  Compass,
  Layers,
  Search,
  Navigation,
  Crosshair,
  AlertTriangle,
  Radio,
  Battery,
  Signal,
  MapPin,
  Clock,
  User,
  Shield,
  Activity,
  CheckCircle2,
  X,
  Plus,
  Route as RouteIcon,
  Footprints,
  Car,
  Volume2,
  Trash2,
  Eye,
  Sliders,
} from 'lucide-react';

// Sub-component for Google Maps Routes & Direction Polyline
const TacticalRouteOverlay: React.FC<{
  userPos: { lat: number; lng: number } | null;
  targetPos: { lat: number; lng: number } | null;
  onRouteCalculated?: (distanceKm: number, durationMin: number) => void;
}> = ({ userPos, targetPos, onRouteCalculated }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !userPos || !targetPos) {
      if (polyline) polyline.setMap(null);
      return;
    }

    // Clean previous polyline
    if (polyline) polyline.setMap(null);

    const gMaps = (window as unknown as { google?: { maps?: any } }).google?.maps;
    if (!gMaps) return;

    // Attempt computeRoutes via Routes API if available
    if (gMaps.Route?.computeRoutes) {
      const request = {
        origin: userPos,
        destination: targetPos,
        travelMode: gMaps.TravelMode?.WALKING || 'WALKING',
        fields: ['polyline.encodedPolyline', 'distanceMeters', 'duration'],
      };

      gMaps.Route.computeRoutes(request)
        .then((response: any) => {
          const route = response?.routes?.[0];
          if (route?.polyline?.encodedPolyline && gMaps.geometry?.encoding) {
            const path = gMaps.geometry.encoding.decodePath(route.polyline.encodedPolyline);
            const line = new gMaps.Polyline({
              path,
              geodesic: true,
              strokeColor: '#48DDF2',
              strokeOpacity: 0.85,
              strokeWeight: 4,
              map,
            });
            setPolyline(line);

            if (route.distanceMeters && onRouteCalculated) {
              const distKm = route.distanceMeters / 1000;
              const durMin = Math.round((route.distanceMeters / 1000 / 4.5) * 60);
              onRouteCalculated(distKm, durMin);
            }
          } else {
            // Direct straight-line fallback line
            const line = new gMaps.Polyline({
              path: [userPos, targetPos],
              geodesic: true,
              strokeColor: '#9FE870',
              strokeOpacity: 0.7,
              strokeWeight: 3,
              map,
            });
            setPolyline(line);
          }
        })
        .catch(() => {
          // Fallback straight-line polyline if network or quota restricts routing API
          const line = new gMaps.Polyline({
            path: [userPos, targetPos],
            geodesic: true,
            strokeColor: '#9FE870',
            strokeOpacity: 0.7,
            strokeWeight: 3,
            map,
          });
          setPolyline(line);
        });
    } else {
      // Direct straight line polyline
      const line = new gMaps.Polyline({
        path: [userPos, targetPos],
        geodesic: true,
        strokeColor: '#9FE870',
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map,
      });
      setPolyline(line);
    }

    return () => {
      if (polyline) polyline.setMap(null);
    };
  }, [map, routesLib, userPos, targetPos]);

  return null;
};

// Map Viewport Controller to pan/recenter smoothly
const MapController: React.FC<{
  center: { lat: number; lng: number };
  zoom?: number;
}> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    if (zoom) map.setZoom(zoom);
  }, [map, center, zoom]);

  return null;
};

export const MapView: React.FC = () => {
  const {
    apiKey,
    participants,
    mapMarkers,
    liveUserPosition,
    isLiveSharing,
    startLocationSharing,
    pauseLocationSharing,
    userLocationConsent,
    setUserLocationConsent,
    mapCenter,
    setMapCenter,
    selectedTeammateId,
    setSelectedTeammateId,
    selectedMarkerId,
    setSelectedMarkerId,
    activeEmergency,
    triggerEmergencySOS,
    acknowledgeEmergency,
    participantCheckIn,
    updateParticipantAnimationState,
    updateParticipantUniformColor,
    addMapAnnotation,
    removeMapMarker,
    settings,
    updateSettings,
    addToast,
  } = useAegis();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>(settings.mapType || 'roadmap');
  const [selectedLayer, setSelectedLayer] = useState({
    teammates: true,
    resources: true,
    checkpoints: true,
    notes: true,
    routes: true,
  });

  // UI Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: '',
    category: 'Field Note',
    details: '',
    lat: mapCenter.lat,
    lng: mapCenter.lng,
  });

  // Calculated Road Route Details
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  // Active Selected Teammate
  const activeTeammate: Participant | undefined = useMemo(() => {
    return participants.find((p) => p.id === selectedTeammateId);
  }, [participants, selectedTeammateId]);

  // Active Selected Marker (Non-teammate)
  const activeMarker: MapMarker | undefined = useMemo(() => {
    return mapMarkers.find((m) => m.id === selectedMarkerId);
  }, [mapMarkers, selectedMarkerId]);

  // User position reference (use live GPS if available, else coordinator Marcus Vance)
  const currentUserPos = useMemo(() => {
    if (liveUserPosition) {
      return { lat: liveUserPosition.lat, lng: liveUserPosition.lng };
    }
    const lead = participants.find((p) => p.id === 'p-01');
    return lead ? { lat: lead.lat, lng: lead.lng } : { lat: 35.3314, lng: -120.6985 };
  }, [liveUserPosition, participants]);

  // Distance to selected teammate
  const distanceMetrics = useMemo(() => {
    if (!currentUserPos || !activeTeammate) return null;
    const straightLineM = calculateHaversineDistanceM(
      currentUserPos.lat,
      currentUserPos.lng,
      activeTeammate.lat,
      activeTeammate.lng
    );
    const bearing = calculateBearingDegrees(
      currentUserPos.lat,
      currentUserPos.lng,
      activeTeammate.lat,
      activeTeammate.lng
    );
    return {
      straightLineM,
      formatted: formatDistance(straightLineM),
      walkingMin: estimateWalkingMinutes(straightLineM),
      drivingMin: estimateDrivingMinutes(straightLineM),
      bearing,
    };
  }, [currentUserPos, activeTeammate]);

  // Center on User GPS
  const handleCenterOnUser = async () => {
    if (!liveUserPosition) {
      const success = await startLocationSharing();
      if (!success) return;
    }
    if (liveUserPosition) {
      setMapCenter({ lat: liveUserPosition.lat, lng: liveUserPosition.lng });
    }
  };

  // Search places or coordinates handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if input is "lat, lng" coordinates (e.g. 35.3314, -120.6985)
    const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      setMapCenter({ lat, lng });
      addToast('info', 'Coordinates Located', `Map centered at [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
      return;
    }

    // Match teammate callsign or name
    const matchedTeammate = participants.find(
      (p) =>
        p.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (matchedTeammate) {
      setSelectedTeammateId(matchedTeammate.id);
      setSelectedMarkerId(null);
      setMapCenter({ lat: matchedTeammate.lat, lng: matchedTeammate.lng });
      addToast('success', 'Teammate Located', `${matchedTeammate.callsign} (${matchedTeammate.name})`);
      return;
    }

    // Match map marker
    const matchedMarker = mapMarkers.find((m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (matchedMarker) {
      setSelectedMarkerId(matchedMarker.id);
      setSelectedTeammateId(null);
      setMapCenter({ lat: matchedMarker.lat, lng: matchedMarker.lng });
      addToast('info', 'Location Found', matchedMarker.title);
      return;
    }

    addToast('warning', 'Location Not Found', 'Search by callsign, place name, or "lat, lng" coordinates.');
  };

  // Handle Map Type Change
  const handleMapTypeToggle = (type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => {
    setMapType(type);
    updateSettings({ mapType: type });
  };

  // Handle Save Note Annotation
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title.trim()) return;

    await addMapAnnotation({
      type: 'annotation',
      title: noteForm.title.trim(),
      category: noteForm.category,
      lat: noteForm.lat,
      lng: noteForm.lng,
      status: 'nominal',
      details: noteForm.details.trim() || 'Field observation added by operator.',
    });

    setShowAddNoteModal(false);
    setNoteForm({
      title: '',
      category: 'Field Note',
      details: '',
      lat: mapCenter.lat,
      lng: mapCenter.lng,
    });
  };

  return (
    <div className="relative w-full h-[calc(100vh-7rem)] flex overflow-hidden bg-[#080D12]">
      {/* 1. Collapsible Left Tactical Drawer */}
      <div
        className={`absolute sm:relative z-20 h-full bg-[#111922] border-r border-[#17232D] transition-all duration-300 flex flex-col ${
          isSidebarOpen ? 'w-80 translate-x-0' : '-translate-x-full sm:translate-x-0 sm:w-0 sm:overflow-hidden'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#17232D] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#48DDF2] tracking-wider uppercase">
              <Compass className="w-3.5 h-3.5" />
              <span>GEOSPATIAL SITUATIONAL AWARENESS</span>
            </div>
            <h2 className="text-sm font-black font-display text-[#F3F7FA] mt-0.5">
              Tactical Roster & Layers
            </h2>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="sm:hidden text-[#8495A5] hover:text-[#F3F7FA] p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#17232D]">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-[#8495A5] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search callsign or coordinates..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-xs text-[#F3F7FA] outline-none placeholder:text-[#8495A5]/60"
            />
          </form>
        </div>

        {/* Layer Toggles & Map Types */}
        <div className="p-3 border-b border-[#17232D] space-y-2">
          <span className="text-[10px] font-mono text-[#8495A5] uppercase tracking-wider block">
            Map View Modes
          </span>
          <div className="grid grid-cols-4 gap-1">
            {(['roadmap', 'satellite', 'hybrid', 'terrain'] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleMapTypeToggle(m)}
                className={`py-1 text-[10px] font-mono font-bold uppercase rounded transition-colors ${
                  mapType === m
                    ? 'bg-[#48DDF2] text-[#080D12]'
                    : 'bg-[#080D12] text-[#8495A5] hover:text-[#F3F7FA]'
                }`}
              >
                {m === 'roadmap' ? 'Road' : m === 'satellite' ? 'Sat' : m === 'hybrid' ? 'Hyb' : 'Terr'}
              </button>
            ))}
          </div>

          {/* Visibility Layer Toggles */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <button
              onClick={() => setSelectedLayer((prev) => ({ ...prev, teammates: !prev.teammates }))}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                selectedLayer.teammates
                  ? 'bg-[#9FE870]/20 text-[#9FE870] border-[#9FE870]/40 font-bold'
                  : 'bg-[#080D12] text-[#8495A5] border-[#17232D]'
              }`}
            >
              Teammates ({participants.length})
            </button>
            <button
              onClick={() => setSelectedLayer((prev) => ({ ...prev, resources: !prev.resources }))}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                selectedLayer.resources
                  ? 'bg-[#48DDF2]/20 text-[#48DDF2] border-[#48DDF2]/40 font-bold'
                  : 'bg-[#080D12] text-[#8495A5] border-[#17232D]'
              }`}
            >
              Stations & Supplies
            </button>
            <button
              onClick={() => setSelectedLayer((prev) => ({ ...prev, notes: !prev.notes }))}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                selectedLayer.notes
                  ? 'bg-[#FFBF69]/20 text-[#FFBF69] border-[#FFBF69]/40 font-bold'
                  : 'bg-[#080D12] text-[#8495A5] border-[#17232D]'
              }`}
            >
              Field Notes
            </button>
          </div>
        </div>

        {/* Teammates List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] font-mono text-[#8495A5] uppercase tracking-wider">
              Connected Personnel ({participants.length})
            </span>
            <button
              onClick={() => setShowAddNoteModal(true)}
              className="text-[10px] font-mono text-[#48DDF2] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Map Note
            </button>
          </div>

          {participants.map((p) => {
            const isSelected = p.id === selectedTeammateId;
            const isEmergency = p.inEmergency || p.animationState === 'emergency';

            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedTeammateId(p.id);
                  setSelectedMarkerId(null);
                  setMapCenter({ lat: p.lat, lng: p.lng });
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isEmergency
                    ? 'bg-[#FF6464]/15 border-[#FF6464] animate-pulse'
                    : isSelected
                    ? 'bg-[#17232D] border-[#48DDF2] shadow-lg shadow-[#48DDF2]/10'
                    : 'bg-[#080D12] border-[#17232D] hover:border-[#48DDF2]/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Miniature 3D Avatar */}
                  <div className="w-9 h-11 flex-shrink-0 relative">
                    <ArmyCharacter3D
                      animationState={p.animationState || 'idle'}
                      uniformColor={p.uniformColor || 'camo_green'}
                      heading={p.heading ?? 0}
                      inEmergency={isEmergency}
                      size={40}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black font-display text-[#F3F7FA] truncate">
                        {p.callsign}
                      </span>
                      {isEmergency && (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono font-black bg-[#FF6464] text-[#080D12] rounded">
                          SOS
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#8495A5] truncate block">
                      {p.name} · {p.group}
                    </span>
                    <span className="text-[9px] font-mono text-[#48DDF2] block">
                      State: {(p.animationState || 'idle').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end flex-shrink-0">
                  <span className="text-[10px] font-mono font-bold text-[#9FE870] flex items-center gap-1">
                    <Battery className="w-3 h-3" />
                    {p.batteryPct}%
                  </span>
                  <span className="text-[9px] font-mono text-[#8495A5]">
                    {p.gpsAccuracyM}m GPS
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Location Sharing Consent Banner */}
        <div className="p-3 bg-[#080D12] border-t border-[#17232D] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#8495A5] uppercase">
              GPS Location Sharing
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                isLiveSharing
                  ? 'bg-[#9FE870]/20 text-[#9FE870]'
                  : 'bg-[#FFBF69]/20 text-[#FFBF69]'
              }`}
            >
              {isLiveSharing ? 'SHARING LIVE' : 'PAUSED'}
            </span>
          </div>

          <p className="text-[11px] text-[#8495A5] leading-relaxed">
            Shares GPS coordinates with authorized teammates for mission awareness. Fully revocable at any time.
          </p>

          <div className="flex items-center gap-2">
            {isLiveSharing ? (
              <button
                onClick={pauseLocationSharing}
                className="w-full py-1.5 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold font-display text-[#FFBF69] rounded-lg transition-colors border border-[#FFBF69]/30"
              >
                Pause Sharing
              </button>
            ) : (
              <button
                onClick={startLocationSharing}
                className="w-full py-1.5 bg-[#9FE870] hover:bg-[#9FE870]/90 text-[#080D12] font-black font-display text-xs rounded-lg transition-colors shadow-md"
              >
                Start Live Sharing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button for small viewports */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-3 top-3 z-30 p-2.5 bg-[#111922]/95 hover:bg-[#17232D] border border-[#17232D] text-[#48DDF2] rounded-xl shadow-xl backdrop-blur-sm"
          title="Open Roster & Layers"
        >
          <Layers className="w-5 h-5" />
        </button>
      )}

      {/* 2. Primary Google Maps Interactive Canvas */}
      <div className="flex-1 relative h-full w-full">
        <APIProvider apiKey={apiKey}>
          <Map
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            defaultCenter={{ lat: 35.3314, lng: -120.6985 }}
            defaultZoom={14}
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%' }}
          >
            <MapController center={mapCenter} />

            {/* Tactical Walking / Driving Route Overlay */}
            {selectedLayer.routes && activeTeammate && currentUserPos && (
              <TacticalRouteOverlay
                userPos={currentUserPos}
                targetPos={{ lat: activeTeammate.lat, lng: activeTeammate.lng }}
                onRouteCalculated={(distKm, durMin) => setRouteInfo({ distanceKm: distKm, durationMin: durMin })}
              />
            )}

            {/* Current Signed-In User Marker (GPS) */}
            {currentUserPos && (
              <AdvancedMarker position={currentUserPos}>
                <div className="relative flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-[#48DDF2] border-2 border-white shadow-lg animate-ping absolute" />
                  <div className="w-4 h-4 rounded-full bg-[#48DDF2] border-2 border-white shadow-lg relative z-10" />
                  <span className="text-[10px] font-mono font-bold text-[#48DDF2] bg-[#080D12]/90 px-1.5 py-0.5 rounded border border-[#48DDF2]/40 mt-1 shadow-md">
                    YOU (GPS {liveUserPosition?.accuracy || 5}m)
                  </span>
                </div>
              </AdvancedMarker>
            )}

            {/* Teammates 3D Character Markers */}
            {selectedLayer.teammates &&
              participants
                .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng))
                .map((p) => {
                  const isSelected = p.id === selectedTeammateId;
                  const isEmergency = Boolean(p.inEmergency || p.animationState === 'emergency');

                  return (
                    <AdvancedMarker
                      key={p.id}
                      position={{ lat: p.lat, lng: p.lng }}
                      onClick={() => {
                        setSelectedTeammateId(p.id);
                        setSelectedMarkerId(null);
                      }}
                    >
                      <div className="relative flex flex-col items-center group cursor-pointer">
                        {/* Name & Callsign Tag */}
                        <div
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-black flex items-center gap-1 shadow-md transition-transform group-hover:scale-110 mb-0.5 ${
                            isEmergency
                              ? 'bg-[#FF6464] text-[#080D12] animate-bounce'
                              : isSelected
                              ? 'bg-[#48DDF2] text-[#080D12]'
                              : 'bg-[#080D12]/90 text-[#F3F7FA] border border-[#17232D]'
                          }`}
                        >
                          <span>{p.callsign}</span>
                          {isEmergency && <span>🚨</span>}
                        </div>

                        {/* 3D Army Character Procedural Model */}
                        <div
                          className={`relative rounded-full transition-transform ${
                            isEmergency
                              ? 'ring-4 ring-[#FF6464] shadow-2xl shadow-[#FF6464]/80'
                              : isSelected
                              ? 'ring-2 ring-[#48DDF2] scale-110'
                              : 'hover:scale-105'
                          }`}
                        >
                          <ArmyCharacter3D
                            animationState={p.animationState || 'idle'}
                            uniformColor={p.uniformColor || 'camo_green'}
                            heading={p.heading ?? 0}
                            inEmergency={isEmergency}
                            size={isSelected ? 100 : 80}
                            interactive
                          />
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}

            {/* Logistics & Resource Markers */}
            {selectedLayer.resources &&
              mapMarkers
                .filter((m) => (m.type === 'resource' || m.type === 'waypoint') && typeof m.lat === 'number' && typeof m.lng === 'number' && !isNaN(m.lat) && !isNaN(m.lng))
                .map((m) => (
                  <AdvancedMarker
                    key={m.id}
                    position={{ lat: m.lat, lng: m.lng }}
                    onClick={() => {
                      setSelectedMarkerId(m.id);
                      setSelectedTeammateId(null);
                    }}
                  >
                    <div className="p-1.5 rounded-lg bg-[#080D12]/90 border border-[#48DDF2]/50 text-[#48DDF2] flex items-center gap-1 shadow-lg hover:scale-110 transition-transform cursor-pointer">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-bold text-[#F3F7FA]">
                        {m.title}
                      </span>
                    </div>
                  </AdvancedMarker>
                ))}

            {/* Field Notes & Annotations */}
            {selectedLayer.notes &&
              mapMarkers
                .filter((m) => m.type === 'annotation')
                .map((m) => (
                  <AdvancedMarker
                    key={m.id}
                    position={{ lat: m.lat, lng: m.lng }}
                    onClick={() => {
                      setSelectedMarkerId(m.id);
                      setSelectedTeammateId(null);
                    }}
                  >
                    <div className="p-1.5 rounded-lg bg-[#080D12]/90 border border-[#FFBF69]/50 text-[#FFBF69] flex items-center gap-1 shadow-lg hover:scale-110 transition-transform cursor-pointer">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-bold text-[#F3F7FA]">
                        {m.title}
                      </span>
                    </div>
                  </AdvancedMarker>
                ))}
          </Map>
        </APIProvider>

        {/* Floating Quick Action Overlay Buttons (Recenter GPS + SOS Button) */}
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2.5">
          {/* Prominent Emergency SOS Button */}
          <button
            onClick={() => triggerEmergencySOS()}
            className="flex items-center gap-2 px-5 py-3 bg-[#FF6464] hover:bg-[#ff4d4d] text-[#080D12] font-black font-display text-sm rounded-2xl shadow-2xl shadow-[#FF6464]/40 transition-all hover:scale-105 active:scale-95 border-2 border-white/30"
          >
            <AlertTriangle className="w-5 h-5 stroke-[3] animate-pulse" />
            <span>TRIGGER SOS EMERGENCY</span>
          </button>

          {/* Center on GPS */}
          <button
            onClick={handleCenterOnUser}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#111922]/90 hover:bg-[#17232D] border border-[#17232D] text-xs font-mono text-[#48DDF2] rounded-xl shadow-lg backdrop-blur-sm transition-all"
            title="Center on My GPS Location"
          >
            <Navigation className="w-4 h-4" />
            <span>My Position</span>
          </button>
        </div>

        {/* Active Emergency Banner Notification if active */}
        {activeEmergency && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-lg w-11/12 bg-[#FF6464] text-[#080D12] p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-6 h-6 stroke-[3] flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-black font-display uppercase tracking-wider block">
                  Active SOS: {activeEmergency.requesterCallsign} ({activeEmergency.requesterName})
                </span>
                <p className="text-[11px] font-semibold truncate leading-tight">
                  {activeEmergency.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setMapCenter({ lat: activeEmergency.lat, lng: activeEmergency.lng })}
                className="px-2.5 py-1 bg-[#080D12] text-[#F3F7FA] font-bold text-xs rounded-lg shadow"
              >
                Locate
              </button>
              <button
                onClick={() => acknowledgeEmergency(activeEmergency.id)}
                className="px-2.5 py-1 bg-white text-[#080D12] font-bold text-xs rounded-lg shadow"
              >
                Acknowledge
              </button>
            </div>
          </div>
        )}

        {/* 3. Floating Right-Side Teammate Information Panel */}
        {activeTeammate && (
          <div className="absolute right-4 bottom-12 z-20 w-88 max-w-[calc(100vw-2rem)] bg-[#111922]/95 backdrop-blur-md border border-[#17232D] rounded-2xl p-4 shadow-2xl space-y-3 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-2 border-b border-[#17232D]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 relative flex-shrink-0">
                  <ArmyCharacter3D
                    animationState={activeTeammate.animationState || 'idle'}
                    uniformColor={activeTeammate.uniformColor || 'camo_green'}
                    heading={activeTeammate.heading ?? 0}
                    inEmergency={Boolean(activeTeammate.inEmergency)}
                    size={48}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#48DDF2] tracking-wider uppercase block">
                    {activeTeammate.group} · {activeTeammate.role}
                  </span>
                  <h3 className="text-base font-black font-display text-[#F3F7FA]">
                    {activeTeammate.callsign} ({activeTeammate.name})
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeammateId(null)}
                className="text-[#8495A5] hover:text-[#F3F7FA] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Distance Calculations Strip */}
            {distanceMetrics && (
              <div className="p-3 rounded-xl bg-[#080D12] border border-[#17232D] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8495A5] flex items-center gap-1">
                    <RouteIcon className="w-3.5 h-3.5 text-[#48DDF2]" />
                    Straight-Line Distance:
                  </span>
                  <strong className="text-[#9FE870] font-black text-sm">
                    {distanceMetrics.formatted}
                  </strong>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-[#17232D]/80">
                  <div className="flex items-center gap-1.5 text-[#8495A5]">
                    <Footprints className="w-3.5 h-3.5 text-[#48DDF2]" />
                    <span>Walking: ~{routeInfo ? `${routeInfo.durationMin}m` : `${distanceMetrics.walkingMin}m`}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#8495A5]">
                    <Car className="w-3.5 h-3.5 text-[#FFBF69]" />
                    <span>Driving: ~{distanceMetrics.drivingMin}m</span>
                  </div>
                </div>
              </div>
            )}

            {/* Health & Telemetry */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#080D12] border border-[#17232D]">
                <span className="text-[10px] text-[#8495A5] block">BATTERY LEVEL</span>
                <span className="text-[#F3F7FA] font-bold flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-[#9FE870]" />
                  {activeTeammate.batteryPct}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080D12] border border-[#17232D]">
                <span className="text-[10px] text-[#8495A5] block">RADIO SIGNAL</span>
                <span className="text-[#F3F7FA] font-bold flex items-center gap-1">
                  <Signal className="w-3.5 h-3.5 text-[#48DDF2]" />
                  {activeTeammate.signalDbm} dBm
                </span>
              </div>
            </div>

            {/* 3D Character Customization (Uniform & Animation State) */}
            <div className="space-y-2 pt-1 border-t border-[#17232D]">
              <span className="text-[10px] font-mono font-bold text-[#8495A5] uppercase tracking-wider block">
                Character 3D Appearance & State
              </span>

              {/* Animation States */}
              <div className="grid grid-cols-3 gap-1">
                {(['idle', 'walking', 'running', 'resting', 'off_duty', 'helping'] as CharacterAnimationState[]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => updateParticipantAnimationState(activeTeammate.id, st)}
                      className={`py-1 text-[10px] font-mono capitalize rounded border transition-colors ${
                        activeTeammate.animationState === st
                          ? 'bg-[#48DDF2]/20 border-[#48DDF2] text-[#48DDF2] font-bold'
                          : 'bg-[#080D12] border-[#17232D] text-[#8495A5] hover:text-[#F3F7FA]'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>

              {/* Uniform Camo Color */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-[#8495A5]">Uniform:</span>
                {(
                  [
                    { key: 'camo_green', bg: '#4f6d48' },
                    { key: 'desert_tan', bg: '#c2a676' },
                    { key: 'urban_navy', bg: '#2b3e50' },
                    { key: 'stealth_black', bg: '#252a30' },
                    { key: 'medic_white', bg: '#ffffff' },
                  ] as { key: UniformColor; bg: string }[]
                ).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => updateParticipantUniformColor(activeTeammate.id, c.key)}
                    style={{ backgroundColor: c.bg }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      activeTeammate.uniformColor === c.key
                        ? 'border-[#48DDF2] scale-110'
                        : 'border-[#17232D] hover:scale-105'
                    }`}
                    title={c.key}
                  />
                ))}
              </div>
            </div>

            {/* Check-In Ping Action */}
            <div className="pt-2 border-t border-[#17232D]">
              <button
                onClick={() => participantCheckIn(activeTeammate.id)}
                className="w-full py-2 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold font-display text-[#9FE870] rounded-xl transition-all border border-[#9FE870]/30 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Send Check-In Ping</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Floating Right-Side Marker Information Panel */}
        {activeMarker && (
          <div className="absolute right-4 bottom-12 z-20 w-80 max-w-[calc(100vw-2rem)] bg-[#111922]/95 backdrop-blur-md border border-[#17232D] rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-start justify-between pb-2 border-b border-[#17232D]">
              <div>
                <span className="text-[10px] font-mono text-[#48DDF2] tracking-wider uppercase block">
                  {activeMarker.category}
                </span>
                <h3 className="text-base font-black font-display text-[#F3F7FA]">
                  {activeMarker.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMarkerId(null)}
                className="text-[#8495A5] hover:text-[#F3F7FA] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8495A5] leading-relaxed bg-[#080D12] p-3 rounded-xl border border-[#17232D]">
              {activeMarker.details}
            </p>

            <div className="text-[10px] font-mono text-[#8495A5] flex items-center justify-between">
              <span>Coordinates:</span>
              <span className="text-[#48DDF2]">
                {activeMarker.lat.toFixed(4)}, {activeMarker.lng.toFixed(4)}
              </span>
            </div>

            {activeMarker.isUserCreated && (
              <button
                onClick={() => {
                  removeMapMarker(activeMarker.id);
                  setSelectedMarkerId(null);
                }}
                className="w-full py-1.5 bg-[#FF6464]/15 hover:bg-[#FF6464]/25 text-[#FF6464] text-xs font-bold font-display rounded-lg border border-[#FF6464]/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Map Note
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. Add Map Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveNote}
            className="w-full max-w-md bg-[#111922] border border-[#17232D] rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#17232D]">
              <h4 className="text-sm font-black font-display text-[#F3F7FA] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#48DDF2]" />
                Add Geographic Field Note
              </h4>
              <button
                type="button"
                onClick={() => setShowAddNoteModal(false)}
                className="text-[#8495A5] hover:text-[#F3F7FA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#8495A5] block mb-1">Note Title</label>
                <input
                  type="text"
                  required
                  value={noteForm.title}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Washout on North Ridge / Water Point"
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-[#F3F7FA] outline-none"
                />
              </div>

              <div>
                <label className="text-[#8495A5] block mb-1">Category</label>
                <select
                  value={noteForm.category}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] text-[#F3F7FA] rounded-lg outline-none"
                >
                  <option value="Field Note">Field Note</option>
                  <option value="Terrain Hazard">Terrain Hazard</option>
                  <option value="Water Source">Water Source</option>
                  <option value="Meeting Point">Meeting Point</option>
                </select>
              </div>

              <div>
                <label className="text-[#8495A5] block mb-1">Observation Details</label>
                <textarea
                  rows={3}
                  value={noteForm.details}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, details: e.target.value }))}
                  placeholder="Additional safety or navigation details..."
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-[#F3F7FA] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#8495A5] p-2 bg-[#080D12] rounded-lg">
                <span>Lat: {noteForm.lat.toFixed(4)}</span>
                <span>Lng: {noteForm.lng.toFixed(4)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#17232D]">
              <button
                type="button"
                onClick={() => setShowAddNoteModal(false)}
                className="px-3 py-1.5 text-xs text-[#8495A5] hover:text-[#F3F7FA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#48DDF2] hover:bg-[#48DDF2]/90 text-[#080D12] font-black font-display text-xs rounded-lg transition-colors"
              >
                Place on Map
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
