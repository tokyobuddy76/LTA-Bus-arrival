# Project Prompts & Conversation History

This document collates all prompts issued during the development of the **SG Bus Arrival & Real-Time Tracker** application.

---

### Prompt 1: Initial Frontend Development
> **Date**: 2026-10-14  
> **Request**:
```text
build a Singapore based bus arrival time application that tracks real time bus locations and provides accurate wait time predictions for all LTA bus stops. Build just the front end for now, I will include the backend connection later.
```

**Key Deliverables**:
- Singapore bus stop directory with authentic 5-digit LTA codes (e.g. `08057` Orchard Stn, `03509` MBS, `41009` Jurong East, `84009` Tampines, etc.).
- Real-time predictive arrival cards (NextBus, 2nd Bus, 3rd Bus) with dynamic countdowns.
- LTA crowding status badges (`SEA` Seats Available, `SDA` Standing Available, `LSD` Limited Standing).
- Bus vehicle types (`SD` Single Deck, `DD` Double Deck, `BD` Bendy) and `WAB` wheelchair accessible indicators.
- Interactive Leaflet map with moving active buses, route polylines, and user location pin.
- Route inspector timeline modal with stop sequences and live fleet positions.
- Synthesized audio chime and 2-minute arrival reminder alarm.

---

### Prompt 2: GitHub Repository Push
> **Date**: 2026-10-14  
> **Request**:
```text
git push https://<GITHUB_PAT>@github.com/tokyobuddy76/LTA-Bus-arrival.git
```
*(Token redacted for security)*

**Key Deliverables**:
- Initialized local git repository on branch `main`.
- Committed all initial codebase files.
- Pushed upstream to `https://github.com/tokyobuddy76/LTA-Bus-arrival.git`.
- Sanitized credentials from local git remote configuration.

---

### Prompt 3: Serverless LTA DataMall Endpoints
> **Date**: 2026-10-15  
> **Request**:
```text
add a serverless connection that pulls live data from LTA Datamall using the following endpoints: 
-store this in /api folder (project root level) not the src folder 
-include /health.ts and /busarrival.ts within that subfolder
-do not hardcode any key, I will include them later

GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
# AccountKey: <LTA_ACCOUNT_KEY>
# accept: application/json
```

**Key Deliverables**:
- Created `/api/health.ts` for service health checks and environment key status reporting.
- Created `/api/busarrival.ts` proxying `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival`.
- Added support for query parameters (`BusStopCode`, `ServiceNo`), defaulting to `83139`.
- Ensured zero hardcoded secrets: reads dynamically from `process.env.LTA_ACCOUNT_KEY` or `AccountKey` request headers.
- Full CORS support and dual compatibility for Node/Vercel serverless and standard Web `Request`/`Response` runtimes.
- Added bus stop `83139` ("Opp Laguna Park") to Singapore stops dataset.
- Added Vite dev server middleware to support local testing against `/api/*`.
- Committed and pushed changes to GitHub.

---

### Prompt 4: Collate Prompts
> **Date**: 2026-10-15  
> **Request**:
```text
collate all the prompts so far and store them in a prompt.md file
```

**Key Deliverables**:
- Generated `/prompt.md` documenting all project requirements, prompt inputs, and associated implementation deliverables.
