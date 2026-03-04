# Situation Room

A real-time global situational awareness dashboard built with **React + Vite + react-globe.gl**.

It combines free/public data sources across:
- Aviation (live aircraft states)
- Maritime (buoy + tides)
- Space (active satellites)
- Seismic/geological events
- Weather and weather alerts
- Geospatial infrastructure overlays

The app visualizes these feeds on a 3D globe with layer toggles, alerting, globe spin controls, and timeline playback support.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Directory Layout](#directory-layout)
- [Data Sources & API Usage](#data-sources--api-usage)
- [Run Locally](#run-locally)
- [Configuration](#configuration)
- [How Live + Playback Modes Work](#how-live--playback-modes-work)
- [UI Controls](#ui-controls)
- [Known Limits](#known-limits)
- [Development Commands](#development-commands)
- [Troubleshooting](#troubleshooting)
- [Agent / Repository Instruction Files](#agent--repository-instruction-files)

---

## Features

- **Live global feeds** rendered on a 3D globe.
- **Layer controls** to show/hide flights, maritime, satellites, weather, geology, and infrastructure.
- **Animated movement interpolation** for flights, ships, and satellites between API polling intervals.
- **Geosynchronous orbit highlighting** with animated path overlays.
- **Timeline playback** with play/pause, step, seek, and live mode switch.
- **Alert panel** for significant events (e.g., larger earthquakes, NOAA alert overlays).
- **Globe spin toggle** to pause/resume auto-rotation during analysis.
- **High-detail imagery tiles** when zooming in.

---

## Architecture

High-level flow:

1. `App.tsx` orchestrates polling, timeline snapshots, and UI state.
2. `dataService.ts` fetches/normalizes data from external public APIs.
3. `GlobeView.tsx` renders points, rings, and orbit paths on `react-globe.gl`.
4. Sidebars/topbar/timeline provide operator controls and event summaries.

Detailed architecture notes are in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Directory Layout

```text
.
├── docs/
│   ├── APIs.md
│   └── ARCHITECTURE.md
├── src/
│   ├── components/
│   │   ├── BottomTimeline.tsx
│   │   ├── GlobeView.tsx
│   │   ├── SidebarLeft.tsx
│   │   ├── SidebarRight.tsx
│   │   └── TopBar.tsx
│   ├── services/
│   │   └── dataService.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Data Sources & API Usage

This repository uses free/public API tiers where possible. A full endpoint-by-endpoint reference is documented in [`docs/APIs.md`](docs/APIs.md).

Current integrations in code include:

- **USGS Earthquake API** (recent + target-time window queries)
- **OpenSky Network** (live aircraft states)
- **CelesTrak** (active TLE set for satellites)
- **NOAA NDBC** (latest buoy observations)
- **NOAA Tides & Currents** (water level snapshots)
- **Open-Meteo** (current + archive weather)
- **NOAA Weather.gov** (active weather alerts)
- **GeoNames + airport CSV** (geospatial enrichment)

---

## Run Locally

### Prerequisites
- Node.js 18+
- npm 9+

### Install + start

```bash
npm install
npm run dev
```

Then open: `http://localhost:3000`

### Production build

```bash
npm run build
npm run preview
```

---

## Configuration

- `.env.example` is included as a template.
- At present, all integrated data sources in `dataService.ts` are public endpoints and do not require keys for baseline behavior.
- If you add key-based providers (e.g., Mapbox, Stormglass, AviationStack), document new env vars in `.env.example` and `docs/APIs.md`.

---

## How Live + Playback Modes Work

- **Live mode** polls feeds on an interval and keeps the newest snapshot selected.
- **Playback mode** freezes live selection and lets the user inspect snapshots in the in-memory history buffer.
- Timeline controls:
  - Play/Pause playback animation
  - Step backward/forward
  - Seek via range input
  - Toggle Live ↔ Playback

---

## UI Controls

- **Top bar**: key metrics + globe spin toggle.
- **Left sidebar**: layer visibility switches.
- **Right sidebar**: event alert feed.
- **Bottom timeline**: live/playback controls and selected timestamp display.

---

## Known Limits

- Several providers enforce rate limits and occasionally return partial data.
- Some feeds have sparse metadata (e.g., maritime speed/heading quality differs by station).
- Satellite motion is propagated from feed metadata (mean motion/inclination) and is an operational visualization, not a mission-grade orbital propagator.
- Historical playback currently replays captured snapshots (not full per-provider historical backfills for every entity).

---

## Development Commands

```bash
npm run dev      # local dev server
npm run lint     # type-check via tsc --noEmit
npm run build    # production build
npm run preview  # preview built app
npm run clean    # remove dist/
```

---

## Troubleshooting

- If globe tiles fail to load, verify outbound network access and CORS allowances in your environment.
- If a data layer appears empty, check browser console for endpoint failures or API throttling.
- If build size warnings appear, consider dynamic imports/manual chunking in Vite/Rollup.

---

## Agent / Repository Instruction Files

At the time of writing, no repository-local `AGENTS.md` file is present inside this repo tree.
If you add one later, ensure instructions match your code style, testing, and PR workflow requirements.

