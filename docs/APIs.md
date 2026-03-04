# API Reference and Usage Guide

This document explains the external APIs used by Situation Room, how each endpoint is called, what is extracted, and important operational notes.

## 1) USGS Earthquake API

- **Purpose:** Global seismic events.
- **Endpoint pattern:**
  - `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=...&endtime=...&minmagnitude=2.5`
- **Usage in app:** `fetchEarthquakes(targetTimeMs)`
- **Mapped fields:**
  - `id`, `geometry.coordinates[1] -> lat`, `geometry.coordinates[0] -> lng`
  - `properties.mag`, `properties.title`, `properties.time`
- **Notes:**
  - Time-window query supports playback mode.
  - Magnitude threshold currently fixed at 2.5.

## 2) OpenSky Network

- **Purpose:** Live aircraft state vectors.
- **Endpoint:** `https://opensky-network.org/api/states/all`
- **Usage in app:** `fetchFlights()`
- **Mapped fields:**
  - `id`, `callsign`, `lng`, `lat`, `alt`, `velocity`, `heading`
- **Operational behavior:**
  - Dataset is sliced to a capped number of aircraft for rendering performance.
  - `fetchedAt` timestamp is attached for interpolation.

## 3) CelesTrak (Active Satellites)

- **Purpose:** Satellite tracking based on live TLE-derived metadata.
- **Endpoint:** `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json`
- **Usage in app:** `fetchSatellites()`
- **Mapped/derived fields:**
  - Source identifiers and name
  - Derived position estimate (lat/lng)
  - `meanMotion`, `inclination`, `orbitClass`, `fetchedAt`
- **Operational behavior:**
  - `orbitClass` distinguishes approximate GEO vs LEO/MEO.
  - Globe renderer advances satellite positions between polls.

## 4) NOAA NDBC (Buoy Observations)

- **Purpose:** Maritime/ocean observations from buoy network.
- **Endpoint:** `https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt`
- **Usage in app:** `fetchMaritime()`
- **Mapped fields:**
  - station id, lat/lng, wind-derived heading/speed proxies, wave height
- **Operational behavior:**
  - Parsed from fixed-width/text-column format.
  - Merged with NOAA tides data and deduped by id.

## 5) NOAA Tides & Currents

- **Purpose:** Water level at selected stations.
- **Endpoint pattern:**
  - `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?...&station=<id>&...`
- **Usage in app:** `fetchNoaaTides(fetchedAt)` (internal to `fetchMaritime`)
- **Mapped fields:**
  - station lat/lng + latest water level as `waveHeight` proxy display

## 6) Open-Meteo

- **Purpose:** Current and historical weather samples.
- **Endpoint patterns:**
  - Current: `https://api.open-meteo.com/v1/forecast?...&current=temperature_2m,wind_speed_10m,weather_code`
  - Archive: `https://archive-api.open-meteo.com/v1/archive?...&hourly=temperature_2m,wind_speed_10m,weather_code`
- **Usage in app:** `fetchWeather(targetTimeMs)`
- **Mapped fields:**
  - temperature, wind speed, weather code, label, observation timestamp

## 7) NOAA Weather.gov Alerts

- **Purpose:** Overlay active weather alerts.
- **Endpoint:** `https://api.weather.gov/alerts/active?status=actual&message_type=alert`
- **Usage in app:** merged in `fetchWeather()`
- **Mapped fields:**
  - alert ID, label, fallback geolocation extraction, sent timestamp

## 8) GeoNames + Airport Dataset

- **Purpose:** Infrastructure / geospatial enrichment points.
- **Endpoints:**
  - Airport CSV: `https://raw.githubusercontent.com/ip2location/ip2location-iata-icao/master/iata-icao.csv`
  - GeoNames earthquakes (demo user):
    `https://secure.geonames.org/earthquakesJSON?north=90&south=-90&east=180&west=-180&username=demo`
- **Usage in app:** `fetchGeoEvents()`

---

## Data Hygiene / Validation

- Coordinate validity filter ensures `lat/lng` remain in valid world bounds.
- Deduplication helper removes repeated IDs after merging multi-source datasets.
- Most source fetches have fallback-to-empty behavior to avoid app-wide crash on provider failure.

---

## Adding More APIs Safely

When integrating a new provider:
1. Add strongly typed fields in `src/types.ts`.
2. Create a dedicated fetch function in `src/services/dataService.ts`.
3. Normalize and validate coordinates.
4. Attach `source` and timestamps for traceability.
5. Merge into app state in `App.tsx`.
6. Update this document and `README.md`.

