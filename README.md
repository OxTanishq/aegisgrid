# AEGIS GRID — Advanced Tactical Map Awareness & Emergency Response Platform

> **Theme**: Military & Armed Forces Defense Technology  
> **Tagline**: “Connected Intelligence. Resilient Coordination.”  
> **Classification**: Demonstration Platform · Synthetic Data Only · Non-Operational

AEGIS GRID is a professional, responsive, real-time team awareness and emergency response platform combining Google Maps geospatial awareness, animated Three.js 3D army character markers, live GPS location sharing, decentralized team communications with voice notes, emergency SOS broadcasting, on-device sound-event detection, and RFC 6238 two-factor authentication (2FA).

---

## 1. Safety Notice & Non-Operational Disclaimer
**IMPORTANT**: AEGIS GRID is an authorized-team awareness, emergency response exercise, safety coordination, and military-support demonstration system. It is **not** an officially certified military command network, does **not** connect to classified databases, and does **not** link to tactical weapon or live targeting systems. All coordinates, callsigns, and sample events are synthetic and fictional.

---

## 2. Core Upgraded Systems & Capabilities

### A. Real Interactive Google Maps Interface
- Powered by official `@vis.gl/react-google-maps` and Google Maps JavaScript API with custom Vector Map styling (`DEMO_MAP_ID`).
- **Map Types**: Toggle between Vector Road Map, High-Resolution Satellite, and Topographic Hybrid Terrain.
- **Geocoding & Place Search**: Search any global city, tactical base, coordinate, or landmark with automated viewport fly-to.
- **GPS Live Recenter & Accuracy**: One-click centering onto real device geolocation (`navigator.geolocation`) with GPS accuracy rings and live updates.
- **Tactical Routes & Distances**: Automatically computes both straight-line Haversine distance and walking/driving route polylines to teammates via the Google Maps Routes API.
- **Map Layer Controls**: Toggle Teammates, Waypoints, Logistics Nodes, Distance Calipers, and Emergency Beacon overlays.

### B. Procedural 3D Army Character Markers (Three.js)
- Smooth 60 FPS 3D stylized low-poly soldier meshes rendered procedurally in WebGL (zero external model asset download dependency).
- **Customizable Uniform Camouflage**: `camo_green`, `desert_tan`, `urban_navy`, `stealth_black`, and `medic_white`.
- **Dynamic Animation States**: `idle`, `walking`, `running`, `resting`, `off_duty`, `helping`, and high-visibility flashing red `emergency`.
- **Directional Compass & Heading**: Tactical ring base indicating heading bearing in degrees, operative callsign, and battery indicator.

### C. Live Location Sharing with Explicit User Consent
- Built-in GPS consent dialog informing operators of location broadcast status.
- Start, Pause, and Terminate controls with live accuracy (meters), speed (km/h), and timestamp freshness.
- Stale location warnings when GPS telemetry exceeds configured aging thresholds.

### D. Team Messaging & Audio Voice Notes
- **Channel Hierarchy**: Global broadcast channel, Squad rooms (`Alpha Recon`, `Bravo Logistics`, `Delta Medical`, `Echo Comms`), and direct 1-on-1 private messaging.
- **Audio Voice Notes**: Built-in Web Audio & `MediaRecorder` microphone recording with live duration timer and waveform playback directly in message threads.
- **Priority Classifications**: Routine, Priority, and Flash Emergency message flags with audible tactical alert chimes.
- **Offline Outgoing Queue**: Messages sent during degraded or offline conditions queue automatically in IndexedDB and sync upon link restoration.

### E. Prominent Emergency SOS System
- **Quick-Access SOS**: Red pulsing SOS trigger in the top tactical bar and sidebars.
- **Safety Interlock**: 5-second countdown with immediate cancel button to prevent accidental activations.
- **Acoustic Synthesizer**: Web Audio API oscillator synthesis generating high-urgency tactical siren sweeps and radio alert pings.
- **Active Emergency Log**: Real-time broadcast banner displaying coordinates, distressed operative callsign, timestamp, and resolution controls.

### F. Privacy-First On-Device Sound-Event Detection
- 100% on-device Web Audio API frequency and amplitude analyser. Audio is processed solely in local memory and is **never** transmitted or recorded to external servers.
- **Acoustic Spike Detection**: Detects sudden loud distress impulses, shouts, or percussive events exceeding configurable dB thresholds.
- **Operator Confirmation Interlock**: Triggers a 10-second verification prompt before any emergency broadcast escalates to the team.

### G. Real Two-Step Verification (RFC 6238 TOTP 2FA)
- Cryptographic HMAC-SHA1 Time-Based One-Time Password verification matching Google Authenticator, Microsoft Authenticator, and 1Password.
- Generates unique Base32 secrets and standard `otpauth://` URIs.
- SHA-256 hashed one-time backup recovery codes.
- Active device session registry with IP, browser fingerprint, and remote revocation controls.

---

## 3. Environment Configuration

Define the following environment variables in `.env` (refer to `.env.example`):

```bash
# Google Maps JavaScript API Key (provisioned via AI Studio Google Maps integration)
VITE_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"

# Optional Gemini API Key for server-side endpoints
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

---

## 4. Local Development & Build

```bash
# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Run TypeScript lint check
npm run lint

# Compile production bundle
npm run build
```

---

## 5. Browser Permissions & Hardware Access
- **Geolocation**: Prompted when clicking "My Location" or toggling "Share Live Position".
- **Microphone**: Prompted when recording audio voice notes or when enabling the Sound-Event Detection system in Settings.
- **Audio Output**: Allowed for synthetic tactical radio pings, siren alerts, and voice note playback.
- **IndexedDB**: Local browser database (`aegis_grid_db`) for offline persistence.
