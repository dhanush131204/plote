# Plot Listing Web App

Create and share interactive plot maps with customer lead capture and CRM webhooks.

## Setup

```bash
npm install
```

Create `.env` (see [`.env.example`](.env.example)):

- `PORT` — API server port (default 3002)
- `JWT_SECRET` — Secret for JWT auth
- `FRONTEND_URL` — Frontend origin for CORS
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — On first server start, creates an **admin** user if no admin exists yet
- `ALLOW_PUBLIC_SIGNUP` — Set to `true` only for development if you need open registration (disabled by default)

## Development

**Recommended (one terminal):** `npm run dev` — Express serves **API + Vite** on `PORT` (default **3002**). Open `http://localhost:3002/`.

**Split (two terminals):** `npm run dev:server` then `npm run dev:client` — Vite on **5173** proxies `/api` and `/uploads` to **`http://127.0.0.1:${PORT}`** from your `.env` (same default **3002** as the API). If you still see **502 Bad Gateway**, `PORT` in `.env` must match the API process, or set **`VITE_DEV_API_PROXY=http://127.0.0.1:YOUR_PORT`**. Set `FRONTEND_URL=http://localhost:5173` for CORS when using the Vite origin.

**Troubleshooting `404` on `/api/...`**

1. Prefer **`npm run dev`** so UI and API share one origin.
2. If port **3002** is already used by another app, set **`PORT=3003`** (or any free port) in `.env` and open that URL.
3. **Do not set `VITE_API_URL` to the Vite-only URL** when using the proxy. Leave `VITE_API_URL` empty so the browser calls `/api/...` on the same host as the page. If you need a full URL, use the API origin only, e.g. `http://localhost:3002`.
3. **`npm run preview`** — the preview server also proxies `/api` to `localhost:3002`; the API process must still be running unless you point `VITE_API_URL` at a real API.
4. **`Unchecked runtime.lastError: The message port closed`** — usually from a **browser extension** (e.g. ad blockers), not from this app. Try a private window or disable extensions for `localhost`.
5. **“Download the React DevTools”** — informational only; safe to ignore.

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` so the first launch creates an admin account, or run:

```bash
set ADMIN_EMAIL=you@company.com
set ADMIN_PASSWORD=your-secure-password
node server/scripts/create-admin.js
```

## Production

```bash
npm run build
npm run start
```

`npm run start` sets `NODE_ENV=production` and serves the **built** frontend plus API from one process (port **3002** unless `PORT` overrides).

**Development:** `npm run dev` runs Vite in middleware mode behind Express (no `dist` mount). Production (`npm run start`) serves `dist/` plus API.

## Flow

1. **Log in** at `/` — accounts are created by an **admin** (no public sign-up unless `ALLOW_PUBLIC_SIGNUP=true`).
2. **Dashboard** — List layouts, create new, copy shareable link. Admins see an **Admin** button.
3. **Admin** (`/admin`) — Create company users, toggle **auto webhook on interest submit** per user, view leads, **push leads to webhook** manually, browse anonymous **activity** events from public map sessions.
4. **Create layout** — **Plot layout** (`/create`): upload site-plan image, calibrate plots, **Settings**. **Apartment / building layout** (`/create/building`): (1) **Facade** — upload a building hero image and calibrate **one polygon per floor** on that image. (2) **Floor plans** — per-floor 2D images. (3) **2 BHK / 3 BHK media** — for each floor, upload image and optional video per configuration (stored under `uploads/Apartment/{layoutId}/`). (4) **Calibrate units** — polygon outlines on each floor plan. Optional **embed URL** (Matterport, Sketchfab, etc.) and **Settings** same as plots.
5. **Public view** — `/v/:slug` — **Plot** layouts: 2D map, filters, plot details. **Building** layouts: if the facade is set and calibrated, buyers **pick a floor on the facade** (or use the floor list), then **choose 2 BHK or 3 BHK** (images + video), then **select a unit** on the floor plan. Otherwise the flow starts at the floor-plan step. Floor stack + optional tour embed + lightweight **3D floor stack** (WebGL) appear above the map on the unit step. Inventory rows must set **`beds`** (2 or 3) to match 2 BHK / 3 BHK filtering. Webhook fires **only if** the layout owner has **auto webhook** enabled **and** a webhook URL is set; otherwise push from **Admin → Leads**.
6. **Activity** — Browser session id (`localStorage`) + events (`page_view`, `plot_select` or `unit_select`, `filter_change`) posted to `/api/activity` (rate-limited).

### Apartment / building assets (what to use when)

| You have | Recommended in this app |
|----------|-------------------------|
| Building elevation / render | Upload as **facade** image; calibrate horizontal bands per floor (`overlayConfig.facadeByFloor`). |
| 2D floor plans per floor | Upload each floor image; mark **unit** polygons (`overlayConfig.byFloor`). |
| 2 BHK / 3 BHK marketing | Upload **image** and **video** per floor per configuration via the builder; files live under `uploads/Apartment/{layoutId}/` (served as `/uploads/Apartment/{layoutId}/...`). |
| GLB / game-ready 3D | Not required here; optional **embed URL** for Sketchfab or similar, or extend the viewer later. |
| Matterport / 3DVista | Paste the **embed URL** in building **Settings**; pair with floor plans for filtering and booking. |

### Building layout API (uploads)

- `PUT /api/layouts/:id/facade-image` — multipart field `image` → `{layoutId}/facade.png`; sets `building.facadeImagePath`.
- `PUT /api/layouts/:id/apartment-media` — multipart field `file`, query `floorId`, `configId` (e.g. `2bhk`, `3bhk`), `kind` = `image` or `video` → `Apartment/{layoutId}/f-{floorId}-{configId}.ext`.

### Webhook payload

On auto or manual push, the CRM URL receives JSON with `lead` (name, phone, email, `plotId`; for building layouts also `unitId`, `floor`, `tower` when applicable), `plot` (inventory record — same array for plots and units), optional `unit` (only for `layoutKind: building`), and `layout` (id, name, slug, `layoutKind`).

### Public layout contact (optional)

In **Settings**, set **Contact phone** and **WhatsApp** (stored in `phaseInfo`). These power Call / WhatsApp on the public plot panel.

Example `phaseInfo`: `{ "layoutName": "Phase I", "phone": "9876543210", "whatsapp": "919876543210" }`
