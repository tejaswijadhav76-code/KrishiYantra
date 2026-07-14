/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Machine, Booking } from '../types';
import { api } from '../api';

interface GpsTrackerProps {
  userRole: 'farmer' | 'owner';
  activeBooking?: Booking | null;
  activeMachine?: Machine | null;
  allMachines: Machine[];
  allBookings: Booking[];
  onBack: () => void;
}

interface GpsDeviceState {
  lat: number;
  lng: number;
  speed: number;
  battery: number;
  satellites: number;
  signalStrength: 'excellent' | 'good' | 'poor' | 'searching';
  engineStatus: 'running' | 'idle' | 'locked';
  geofenceActive: boolean;
  geofenceBreached: boolean;
}

export default function GpsTracker({
  userRole,
  activeBooking,
  activeMachine,
  allMachines,
  allBookings,
  onBack
}: GpsTrackerProps) {
  // Select which machine to track
  const trackableMachines = allMachines;
  const [selectedMachine, setSelectedMachine] = useState<Machine>(() => {
    if (activeMachine) return activeMachine;
    if (activeBooking) {
      const match = allMachines.find(m => m.id === activeBooking.machineId);
      if (match) return match;
    }
    return allMachines[0];
  });

  // Simulator path points (Indore outer fields to Farm area)
  // Maps percentage (0-100) to actual locations on our custom SVG
  const pathPoints = [
    { x: 50, y: 350, lat: 22.7196, lng: 75.8577, label: 'Dealer Warehouse (Indore)' },
    { x: 120, y: 300, lat: 22.7352, lng: 75.8694, label: 'NH-52 Transit Junction' },
    { x: 220, y: 240, lat: 22.7591, lng: 75.8912, label: 'Dewas Naka Crossing' },
    { x: 310, y: 190, lat: 22.7834, lng: 75.9185, label: 'Kalyanpura Field Checkpoint' },
    { x: 420, y: 140, lat: 22.8123, lng: 75.9421, label: 'Rural Road Sector 4' },
    { x: 530, y: 120, lat: 22.8456, lng: 75.9754, label: 'Farmer Crop Land (Destination)' }
  ];

  // Tracker State
  const [progress, setProgress] = useState<number>(35); // Start at 35% along the transit
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [mapLayer, setMapLayer] = useState<'vector' | 'satellite' | 'hybrid'>('vector');
  const [gpsLogs, setGpsLogs] = useState<string[]>([]);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // GPS Device Hardware State
  const [device, setDevice] = useState<GpsDeviceState>({
    lat: 22.7591,
    lng: 75.8912,
    speed: 12, // km/h
    battery: 89, // %
    satellites: 9,
    signalStrength: 'excellent',
    engineStatus: 'running',
    geofenceActive: true,
    geofenceBreached: false
  });

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Calculate position along pathPoints based on progress percentage
  const getPositionOnPath = (pct: number) => {
    const totalPoints = pathPoints.length;
    const segmentWidth = 100 / (totalPoints - 1);
    const index = Math.min(Math.floor(pct / segmentWidth), totalPoints - 2);
    const segmentPct = (pct % segmentWidth) / segmentWidth;

    const start = pathPoints[index];
    const end = pathPoints[index + 1];

    const x = start.x + (end.x - start.x) * segmentPct;
    const y = start.y + (end.y - start.y) * segmentPct;
    const lat = start.lat + (end.lat - start.lat) * segmentPct;
    const lng = start.lng + (end.lng - start.lng) * segmentPct;

    return { x, y, lat, lng, checkpoint: end.label };
  };

  const currentPos = getPositionOnPath(progress);

  // Simulate Tracker Updates
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSimulating && device.engineStatus !== 'locked') {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1;
          if (next >= 100) {
            setAlertMsg(`Machinery ${selectedMachine.name} has arrived at the destination farm!`);
            return 100;
          }
          return next;
        });

        // Add telemetry fluctuations
        setDevice((prev) => {
          const newSpeed = prev.engineStatus === 'idle' ? 0 : Math.max(5, Math.min(22, prev.speed + (Math.random() * 4 - 2)));
          const newBattery = Math.max(10, prev.battery - (Math.random() > 0.8 ? 1 : 0));
          const newSatellites = Math.max(4, Math.min(12, prev.satellites + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)));
          const testPos = getPositionOnPath(progress + 1);

          // Geofence check: if progress is beyond 80% and geofence is active, mock a breach alert if it's outside designated sector
          const isBreached = prev.geofenceActive && progress > 75;

          return {
            ...prev,
            lat: Number(testPos.lat.toFixed(5)),
            lng: Number(testPos.lng.toFixed(5)),
            speed: Number(newSpeed.toFixed(1)),
            battery: newBattery,
            satellites: newSatellites,
            geofenceBreached: isBreached
          };
        });

        // Generate NMEA or GPRMC style realistic logger lines
        const timeStr = new Date().toLocaleTimeString();
        const sentences = [
          `[$GPRMC] UTC:${timeStr} | Lat:${currentPos.lat.toFixed(4)}°N | Lng:${currentPos.lng.toFixed(4)}°E | Spd:${device.speed} km/h`,
          `[SAT] Connected to ${device.satellites} GPS birds. DOP: 1.2`,
          `[TELEMETRY] Fuel: 82% | Temp: 74°C | Alt: 540m | GPS Battery: ${device.battery}%`,
          `[ROUTE] Current segment heading: ${currentPos.checkpoint}`
        ];
        
        setGpsLogs((prev) => [...prev, sentences[Math.floor(Math.random() * sentences.length)]].slice(-40));
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [isSimulating, progress, device.engineStatus, selectedMachine]);

  // Scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gpsLogs]);

  // Trigger immediate location ping
  const handleRefreshPing = () => {
    api.getGps(selectedMachine.id).then((telemetry) => {
      setGpsLogs((prev) => [
        ...prev,
        `[PING] Force location sync requested...`,
        `[PING] SUCCESS: Connected to Krishi GPS Module ID: ${selectedMachine.id.toUpperCase()}-X`,
        `[PING] Telemetry Sync: Speed: ${telemetry.speed} km/h | GPS Sats: ${telemetry.satellites} | Battery: ${telemetry.battery}%`,
        `[PING] Coordinates: ${telemetry.lat.toFixed(6)}° N, ${telemetry.lng.toFixed(6)}° E`
      ]);
      setDevice((prev) => ({
        ...prev,
        ...telemetry,
        // keep engineStatus and geofence settings, updates coordinates
        lat: Number(telemetry.lat.toFixed(5)),
        lng: Number(telemetry.lng.toFixed(5))
      }));
    }).catch((err) => {
      setGpsLogs((prev) => [
        ...prev,
        `[PING] GPS sync failed: ${err.message}`
      ]);
    });
  };

  const handleToggleEngine = () => {
    setDevice(prev => {
      const nextStatus = prev.engineStatus === 'locked' ? 'running' : 'locked';
      const logMsg = nextStatus === 'locked' 
        ? `[ALERT] REMOTE IGNITION KILL COMMAND RECEIVED. Engine Immobilized safely.`
        : `[ALERT] REMOTE UNLOCK GRANTED. Engine relay active. Ready to start.`;
      setGpsLogs(l => [...l, logMsg]);
      return { ...prev, engineStatus: nextStatus };
    });
  };

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto w-full pb-12 space-y-6">
      
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-outline-variant/15 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer text-primary"
          >
            <span className="material-symbols-outlined font-bold">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary font-bold">satellite_alt</span>
              <h1 className="text-xl font-extrabold text-on-surface">Precision GPS Tracking Hub</h1>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Simulated real-time telematics via KrishiYantra Satellite Grid
            </p>
          </div>
        </div>

        {/* Machine Switcher dropdown (especially for Owners or Farmers with multiple machines) */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Device:</span>
          <select
            value={selectedMachine.id}
            onChange={(e) => {
              const match = allMachines.find(m => m.id === e.target.value);
              if (match) {
                setSelectedMachine(match);
                setProgress(25 + Math.floor(Math.random() * 40)); // Randomize progress for demo
                setGpsLogs([]);
                setDevice(prev => ({ ...prev, engineStatus: 'running', geofenceBreached: false }));
              }
            }}
            className="bg-surface-container border border-outline-variant/35 rounded-xl px-4 py-2 text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {trackableMachines.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.owner})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Arrival Alert Banner */}
      {alertMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex justify-between items-center animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600 font-bold text-2xl">local_shipping</span>
            <div>
              <p className="text-sm font-bold text-emerald-800">{alertMsg}</p>
              <p className="text-xs text-emerald-600">The GPS tracking beacon is now static at your farm location.</p>
            </div>
          </div>
          <button 
            onClick={() => setAlertMsg(null)} 
            className="text-xs font-bold text-emerald-800 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Fleet telemetry metrics at a glance */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <span className="material-symbols-outlined font-bold">speed</span>
          </div>
          <div>
            <span className="text-[10px] text-on-surface-variant font-extrabold uppercase tracking-wide block">Current Speed</span>
            <span className="text-lg font-extrabold text-on-surface">{device.speed} <span className="text-xs font-medium text-on-surface-variant">km/h</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <span className="material-symbols-outlined font-bold">battery_charging_full</span>
          </div>
          <div>
            <span className="text-[10px] text-on-surface-variant font-extrabold uppercase tracking-wide block">GPS Unit Battery</span>
            <span className="text-lg font-extrabold text-on-surface">{device.battery}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <span className="material-symbols-outlined font-bold">cell_tower</span>
          </div>
          <div>
            <span className="text-[10px] text-on-surface-variant font-extrabold uppercase tracking-wide block">Sat Connection</span>
            <span className="text-lg font-extrabold text-on-surface">{device.satellites} <span className="text-xs font-medium text-on-surface-variant">Birds</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-sm flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${device.engineStatus === 'locked' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
            <span className="material-symbols-outlined font-bold">
              {device.engineStatus === 'locked' ? 'lock_open' : 'power_settings_new'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-on-surface-variant font-extrabold uppercase tracking-wide block">Engine Status</span>
            <span className={`text-sm font-extrabold uppercase ${device.engineStatus === 'locked' ? 'text-error' : 'text-emerald-600'}`}>
              {device.engineStatus === 'locked' ? 'IMMOBILIZED' : 'IGNITION ACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Map + Side Controls grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Column */}
        <div className="lg:col-span-2 bg-slate-950 rounded-[32px] overflow-hidden shadow-lg border border-slate-800/80 relative min-h-[420px] md:min-h-[500px] flex flex-col justify-between">
          
          {/* Map Layer Switcher Ribbon */}
          <div className="absolute top-4 left-4 z-20 bg-slate-900/90 text-white p-1 rounded-xl border border-slate-700/50 backdrop-blur-md flex gap-1">
            <button
              onClick={() => setMapLayer('vector')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${mapLayer === 'vector' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Vector Grid
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${mapLayer === 'satellite' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Satellite (Field)
            </button>
          </div>

          {/* Quick Refresh Coordinates HUD */}
          <div className="absolute top-4 right-4 z-20 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-slate-700/50 backdrop-blur-md text-[10px] font-mono flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LAT: {currentPos.lat.toFixed(5)}°N | LNG: {currentPos.lng.toFixed(5)}°E</span>
          </div>

          {/* Map Content - Beautiful Styled SVG */}
          <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
            {mapLayer === 'vector' ? (
              /* Vector Grid Layer */
              <svg 
                className="absolute inset-0 w-full h-full" 
                viewBox="0 0 600 400" 
                preserveAspectRatio="xMidYMid slice"
                style={{ background: '#0b1329' }}
              >
                {/* Cyber grid lines */}
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Simulated Geofence boundary circle */}
                {device.geofenceActive && (
                  <>
                    <circle 
                      cx="530" 
                      cy="120" 
                      r="100" 
                      fill="none" 
                      stroke={device.geofenceBreached ? '#ef4444' : '#10b981'} 
                      strokeWidth="1.5" 
                      strokeDasharray="4 4" 
                      className={device.geofenceBreached ? 'animate-pulse' : ''}
                    />
                    <text 
                      x="440" 
                      y="50" 
                      fill={device.geofenceBreached ? '#ef4444' : '#10b981'} 
                      fontSize="9" 
                      fontWeight="bold"
                      className="font-mono tracking-widest"
                    >
                      {device.geofenceBreached ? 'GEOFENCE VIOLATION OUTSIDE FARMLAND' : 'SAFE-ZONE GEOFENCE'}
                    </text>
                  </>
                )}

                {/* Styled Roads NH-52 */}
                <path 
                  d="M 50,350 Q 150,320 220,240 T 420,140 T 530,120" 
                  fill="none" 
                  stroke="#334155" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                />
                <path 
                  d="M 50,350 Q 150,320 220,240 T 420,140 T 530,120" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="1" 
                  strokeLinecap="round" 
                  strokeDasharray="5 5" 
                />

                {/* Side Farm plots */}
                <polygon points="80,100 160,110 140,180 70,170" fill="#064e3b" opacity="0.3" stroke="#059669" strokeWidth="1" />
                <text x="90" y="140" fill="#34d399" fontSize="9" fontWeight="bold">Field plot 12B</text>

                <polygon points="350,220 440,200 420,280 340,290" fill="#064e3b" opacity="0.3" stroke="#059669" strokeWidth="1" />
                <text x="360" y="250" fill="#34d399" fontSize="9" fontWeight="bold">Agri-Hub Central</text>

                {/* Farmer crop land plot */}
                <polygon points="480,70 570,80 560,160 470,150" fill="#1e3a8a" opacity="0.4" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="495" y="115" fill="#60a5fa" fontSize="9" fontWeight="bold">Ramrao Farm Land</text>

                {/* Transit Path Line (Completed & Remaining) */}
                <path 
                  d={`M 50,350 Q 150,320 220,240 T 420,140 T 530,120`} 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  strokeDasharray="600"
                  strokeDashoffset={600 - (600 * (progress / 100))}
                  style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />

                {/* Destination Farm Pin */}
                <g transform="translate(530, 120)">
                  <circle cx="0" cy="0" r="16" fill="#3b82f6" fillOpacity="0.2" className="animate-ping" />
                  <circle cx="0" cy="0" r="6" fill="#3b82f6" />
                  <path d="M 0,0 L 0,-15" stroke="#3b82f6" strokeWidth="2" />
                  <text x="12" y="4" fill="#60a5fa" fontSize="10" fontWeight="extrabold">DESTINATION</text>
                </g>

                {/* Dealer Starting Pin */}
                <g transform="translate(50, 350)">
                  <circle cx="0" cy="0" r="5" fill="#94a3b8" />
                  <text x="10" y="4" fill="#94a3b8" fontSize="9">Dealer Yard</text>
                </g>

                {/* Live Tracking Dot (Machine Position) */}
                <g transform={`translate(${currentPos.x}, ${currentPos.y})`} style={{ transition: 'transform 0.5s ease-out' }}>
                  <circle cx="0" cy="0" r="22" fill="#3b82f6" fillOpacity="0.15" className="animate-pulse" />
                  <circle cx="0" cy="0" r="12" fill={device.engineStatus === 'locked' ? '#ef4444' : '#f59e0b'} fillOpacity="0.4" />
                  <circle cx="0" cy="0" r="6" fill={device.engineStatus === 'locked' ? '#ef4444' : '#f59e0b'} />
                  
                  {/* Styled Directional arrow or status tag */}
                  <g transform="translate(0, -22)">
                    <rect x="-35" y="-14" width="70" height="15" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    <text x="0" y="-3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {selectedMachine.name.split(' ')[0]} {device.speed} km/h
                    </text>
                  </g>
                </g>
              </svg>
            ) : (
              /* Satellite Hybrid View Layer */
              <div className="absolute inset-0 w-full h-full relative" style={{ background: '#111827' }}>
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrS84LqeS0h9ab2dvPy_2_OO-vNOhOm_IVai0EuSOKm-KEpsr6cBUs2OdbDVf80S62UrB7j-x2n9_4kTS3xH2chRjczjQchkmVKiRdbm5KyQZmr2__4tzjrJ2x9KXVmt8tAU_rG6AbY_TIQ7CRNz_BnwmiegvWuqR4mrAEAw7u80d53Ibxnc5k2ucSmib0QNQe8v3ScFTwhcTApqIOjANf70Nt03do3VKMMwl_r6bBd-1bjFyXiOYtEfaEmG8CuJ8EGaJzPa_cG1y9" 
                  alt="Satellite Farm Map" 
                  className="w-full h-full object-cover opacity-35"
                />
                
                {/* Overlay radar sweeping scanner */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
                
                {/* Overlay SVG graphics on satellite background */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
                  {/* Interactive tracking trail */}
                  <path 
                    d="M 50,350 Q 150,320 220,240 T 420,140 T 530,120" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />
                  
                  {/* Glowing Tracker node */}
                  <g transform={`translate(${currentPos.x}, ${currentPos.y})`} style={{ transition: 'transform 0.5s ease-out' }}>
                    <circle cx="0" cy="0" r="25" fill="#10b981" fillOpacity="0.2" className="animate-ping" />
                    <circle cx="0" cy="0" r="10" fill="#10b981" />
                    <circle cx="0" cy="0" r="4" fill="#ffffff" />
                  </g>

                  {/* Destination */}
                  <g transform="translate(530, 120)">
                    <circle cx="0" cy="0" r="6" fill="#10b981" />
                    <text x="10" y="4" fill="#10b981" fontSize="10" fontWeight="bold">DESTINATION PLOT</text>
                  </g>
                </svg>
                
                <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white p-3 rounded-xl border border-slate-700/50 text-[10px]">
                  <span className="font-bold text-amber-400 block">SATELLITE HIGH-RESOLUTION FEED</span>
                  <span>Sensor latency: ~0.4s | Satellite Link: Telemetry Grid A4</span>
                </div>
              </div>
            )}

            {/* Quick Map Controls HUD inside map overlay */}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
              <button
                onClick={handleRefreshPing}
                className="w-10 h-10 bg-slate-900/90 text-white hover:bg-slate-800 rounded-full border border-slate-700/50 flex items-center justify-center cursor-pointer transition-all shadow-md"
                title="Sync GPS Telemetry"
              >
                <span className="material-symbols-outlined text-sm">sync</span>
              </button>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className="w-10 h-10 bg-slate-900/90 text-white hover:bg-slate-800 rounded-full border border-slate-700/50 flex items-center justify-center cursor-pointer transition-all shadow-md"
                title={isSimulating ? 'Pause Simulation' : 'Start Simulation'}
              >
                <span className="material-symbols-outlined text-sm">
                  {isSimulating ? 'pause' : 'play_arrow'}
                </span>
              </button>
            </div>
          </div>

          {/* Map Progress Slider */}
          <div className="bg-slate-900 px-6 py-4 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span>TRANSIT PROGRESS</span>
                <span className="text-primary-container text-amber-400">{progress}% Completed</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full bg-slate-800 h-1 rounded-full accent-primary appearance-none cursor-pointer"
              />
            </div>
            
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimated Arrival</span>
              <span className="text-xs font-mono font-bold text-white">
                {progress >= 100 ? 'Arrived Safely' : `${Math.ceil((100 - progress) * 0.4)} Minutes Remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Side Panel: System Logs & Telematics Control */}
        <div className="space-y-6">
          
          {/* Machine Info / Security Box */}
          <div className="bg-white p-5 rounded-3xl border border-outline-variant/15 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <img src={selectedMachine.image} alt={selectedMachine.name} className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/20 shadow-inner" />
              <div>
                <h3 className="font-extrabold text-base text-on-surface">{selectedMachine.name}</h3>
                <p className="text-xs text-on-surface-variant font-bold flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm text-primary">person</span>
                  <span>Owner: {selectedMachine.owner}</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/10 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-surface-container/40 p-2.5 rounded-xl">
                <span className="text-on-surface-variant font-semibold block text-[10px]">CURRENT BEACON</span>
                <span className="font-extrabold text-on-surface font-mono">KY-GPS-{selectedMachine.id.slice(0, 5).toUpperCase()}</span>
              </div>
              <div className="bg-surface-container/40 p-2.5 rounded-xl">
                <span className="text-on-surface-variant font-semibold block text-[10px]">GEOLOCK STATUS</span>
                <span className={`font-extrabold ${device.geofenceBreached ? 'text-error' : 'text-emerald-600'}`}>
                  {device.geofenceBreached ? 'OUTSIDE' : 'BOUNDED'}
                </span>
              </div>
            </div>

            {/* Owner specific remote control actions */}
            {userRole === 'owner' ? (
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-3">
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined font-bold text-sm">lock_person</span>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">Owner Remote Safety Commands</h4>
                </div>
                <p className="text-[11px] leading-relaxed text-on-surface-variant">
                  As the shop owner, you can remotely immobilize the engine starter block via satellite in case of unpaid dues, contract violations, or geofence escape.
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleToggleEngine}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      device.engineStatus === 'locked' 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-error text-white hover:bg-error/95'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {device.engineStatus === 'locked' ? 'lock_open' : 'lock'}
                    </span>
                    <span>{device.engineStatus === 'locked' ? 'Unlock Ignition' : 'Remote Kill Engine'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-on-surface-variant font-bold">Auto-Geofence Alert:</span>
                  <button
                    onClick={() => {
                      setDevice(prev => {
                        const nextVal = !prev.geofenceActive;
                        setGpsLogs(l => [...l, `[CONFIG] Geofence monitoring changed: ${nextVal ? 'ACTIVE' : 'DEACTIVATED'}`]);
                        return { ...prev, geofenceActive: nextVal, geofenceBreached: false };
                      });
                    }}
                    className={`px-3 py-1 rounded-lg font-bold text-[10px] ${
                      device.geofenceActive 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {device.geofenceActive ? 'Enabled (10km)' : 'Disabled'}
                  </button>
                </div>
              </div>
            ) : (
              /* Farmer view assistance content */
              <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <span className="material-symbols-outlined font-bold text-sm">verified_user</span>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">Farmer Security Verified</h4>
                </div>
                <p className="text-[11px] leading-relaxed text-on-surface-variant">
                  This machine is fitted with anti-theft GPS hardware linked to KrishiYantra. If you need transit assistance or if the driver has changed route, call the owner immediately.
                </p>
                <div className="flex gap-2">
                  <a
                    href={`tel:${selectedMachine.ownerPhone}`}
                    className="flex-1 py-2 bg-amber-600 text-white text-center rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                  >
                    Call Dealer Shop
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Real-time NMEA Telemetry Stream Console */}
          <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800/80 shadow-inner flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                SATELLITE RAW NMEA FEED
              </span>
              <button
                onClick={() => setGpsLogs([])}
                className="text-[9px] font-mono font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wide cursor-pointer"
              >
                Clear Log
              </button>
            </div>

            {/* Scrolling console box */}
            <div 
              ref={logContainerRef}
              className="bg-slate-900 border border-slate-800/50 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[9px] leading-relaxed text-slate-300 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800"
            >
              {gpsLogs.length === 0 ? (
                <div className="text-slate-500 h-full flex items-center justify-center text-center p-4">
                  <span>Waiting for GPS satellites to sync with KY-GPS-{selectedMachine.id.slice(0, 5).toUpperCase()}...</span>
                </div>
              ) : (
                gpsLogs.map((log, idx) => (
                  <div key={idx} className="border-l-2 border-primary/40 pl-1.5 break-all">
                    {log}
                  </div>
                ))
              )}
            </div>
            
            <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 mt-2">
              <span>Baud: 9600 bps | Link: 100% stable</span>
              <span>MP-09-DEALER-GEO</span>
            </div>
          </div>

        </div>

      </div>
      
    </div>
  );
}
