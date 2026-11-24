# CityLens — MERN civic issue reporting platform

CityLens is a Bengaluru-focused civic issue reporting and visibility platform. Citizens can submit geotagged reports with photos, browse an interactive issue map, filter reports, follow status history, comment on issues, and see an explainable severity score. Administrators can review reports and update workflow status.

## Architecture

- **MongoDB Atlas / MongoDB** — users, reports, comments and status history.
- **Express + Node.js** — REST API, authentication, authorization, image handling and severity calculations.
- **React + JavaScript + Vite** — responsive user interface. The frontend is JavaScript/JSX; TypeScript is not used.
- **Leaflet + OpenStreetMap** — interactive issue map and report location picker.
- **Mongoose** — MongoDB models, validation and geospatial index.
- **JWT + bcryptjs** — signed sessions and password hashing.

```text
Citizen / Admin browser
        │
        ▼
React + Vite frontend (http://localhost:5173)
        │ REST API + optional JWT
        ▼
Node.js + Express backend (http://localhost:5000)
        │ Mongoose
        ▼
MongoDB (local or MongoDB Atlas)
```

## Requirements

- Node.js 20 or newer (Node 22 recommended)
- npm
- MongoDB Community Server running locally **or** a MongoDB Atlas database/cluster

## Run locally

### 1. Configure MongoDB and environment files

From the project root:

**Windows PowerShell**

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

**macOS / Linux**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/citylens
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_characters
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string, for example:

```text
mongodb+srv://<database-user>:<database-password>@<cluster-host>/citylens?retryWrites=true&w=majority
```

Create a database user in Atlas and allow your development IP in **Network Access**. Replace the placeholders with your own values. Do not commit `.env` files or share your database password/JWT secret.

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Install dependencies

From the project root:

```bash
npm run install:all
```

### 3. Seed the sample Bengaluru reports

Make sure MongoDB is running and the backend `.env` is configured, then run:

```bash
npm run seed
```

The seed command inserts the ten original CityLens sample reports (CL-1008 through CL-1042) and their sample images. It is safe to run more than once: existing records with those reference IDs are not overwritten.

### 4. Start frontend and backend

From the project root:

```bash
npm run dev
```

Open:

- Frontend: <http://localhost:5173>
- API health: <http://localhost:5000/api/health>

You can also run each part independently:

```bash
npm --prefix backend run dev
npm --prefix frontend run dev
```

### 5. Create an administrator account

Public registration always creates a `citizen` account. It cannot set or request an admin role. Create an administrator from the backend command line after configuring MongoDB:

```bash
npm run create-admin -- admin@citylens.local "Use-A-Long-Unique-Password" "CityLens Admin"
```

Use the email and password you supplied to sign in at `/login`. Admin status is stored in MongoDB and checked by backend middleware; the frontend cannot grant itself admin access.

## Features

### Citizen experience

- Public home page with live database statistics and recent reports.
- Issue explorer with list + interactive map, marker popups, search and filters for category, status and severity.
- Issue detail page with location map, photo evidence, status history, severity breakdown and comments.
- Report submission with category, title, description, up to three photos, street/landmark, locality and map pin.
- Optional browser geolocation in the report form; manual map pin placement is also supported.
- Citizen registration/login and a personal reports page.

### Administrator experience

- Admin dashboard with total, in-progress, resolved and high/critical-open counts.
- Review reports and update status to Reported, In progress, Resolved or Rejected.
- Add status-change remarks; every status change is recorded in status history.
- Admin privileges are assigned only through the backend CLI script.

### Automatic severity score (0–100)

The backend calculates a weighted triage score from five factors:

| Factor | Weight | Source |
|---|---:|---|
| Immediate impact / danger | 30% | Reporter selects Low, Moderate, High or Critical |
| People affected | 20% | Reporter selects an estimated affected-population band |
| Critical location | 20% | Reporter identifies school, transit hub, hospital, etc. |
| Nearby report density | 15% | Backend counts other reports within 500 metres from the last 30 days |
| Time unresolved | 15% | Backend calculates age of an unresolved report |

Each factor is normalized to a 0–5 scale and weighted to produce a 0–100 score. Score bands are:

- 0–24: Low
- 25–49: Moderate
- 50–74: High
- 75–100: Critical

The score explanation is returned with the report so users can see each factor and its contribution. Duration is recalculated when a report is read. The score is a **triage aid**, not a validated engineering risk assessment or emergency-response guarantee. The weights and thresholds are configurable in `backend/src/services/severity.js` and should be reviewed with civic/domain experts before operational use.

### Location and map

- Report coordinates are stored as GeoJSON `[longitude, latitude]` points in MongoDB.
- A `2dsphere` index supports geospatial queries.
- The map uses Leaflet and OpenStreetMap tiles. Internet access is required for the basemap.
- Clicking the report form map sets a pin; browser geolocation is optional and permission-based.
- The issue explorer shows report markers and lets users open issue details.

### Images

For local development, uploads are saved under `backend/uploads` and served by the API. To use persistent cloud image storage, configure the optional Cloudinary variables in `backend/.env`. When all three Cloudinary credentials are present, new uploads are sent to Cloudinary and the returned URL is saved in MongoDB. MongoDB stores image URLs, not image binary data.

> Local uploads are suitable for development. Render's local filesystem may be ephemeral; use Cloudinary or another persistent object store for deployed uploads.

## API overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register citizen |
| POST | `/api/auth/login` | Public | Sign in |
| GET | `/api/auth/me` | Signed in | Current user |
| GET | `/api/reports` | Public | Search/filter/list reports |
| GET | `/api/reports/stats` | Public | Dashboard statistics |
| POST | `/api/reports` | Public, optional auth | Submit report with photos |
| GET | `/api/reports/mine` | Signed in | Current user's reports |
| GET | `/api/reports/:id` | Public | Report, comments and history |
| POST | `/api/reports/:id/comments` | Public, optional auth | Add comment |
| PUT | `/api/reports/:id` | Owner or admin | Edit title/description |
| DELETE | `/api/reports/:id` | Owner or admin | Delete report |
| PATCH | `/api/reports/:id/status` | Admin | Change status and log history |
| GET | `/api/admin/dashboard` | Admin | Admin statistics |
| GET | `/api/admin/reports` | Admin | Admin report list |

## Build checks

```bash
npm --prefix backend run start
npm --prefix frontend run build
```

The backend requires a reachable MongoDB instance to start. The frontend build does not require a database connection.

## Deploying

### Backend on Render

1. Create a Render Web Service using this repository.
2. Set the root directory to `backend`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add environment variables: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `NODE_ENV=production`, and Cloudinary credentials if using persistent uploads.
6. Set `CLIENT_URL` to your deployed frontend origin. For multiple allowed origins, separate exact origins with commas.

### Frontend on GitHub Pages

1. Add the GitHub repository secret `VITE_API_URL` containing the deployed backend API URL, e.g. `https://your-citylens-api.onrender.com/api`.
2. In repository **Settings → Pages**, set the build/deployment source to **GitHub Actions**.
3. Push to `main`. The included `.github/workflows/deploy.yml` builds the Vite frontend and deploys `frontend/dist`.
4. Set the backend `CLIENT_URL` to your GitHub Pages origin, e.g. `https://<username>.github.io`.

GitHub Pages hosts only the frontend. The Express backend and MongoDB must remain deployed separately. Never put MongoDB connection strings or JWT signing secrets in frontend environment variables.

## Project structure

```text
CityLens/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/       # Original CityLens imagery
│   │   ├── components/   # Map, header, issue cards
│   │   ├── context/      # Authentication state
│   │   ├── lib/          # API and formatting helpers
│   │   └── pages/        # Home, explore, report, detail, admin
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/       # MongoDB and image uploads
│   │   ├── controllers/  # API logic
│   │   ├── middleware/   # JWT and role checks
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # REST endpoints
│   │   ├── scripts/      # Seed and create-admin commands
│   │   └── services/     # Severity scoring engine
│   ├── uploads/          # Local uploaded/demo images
│   └── .env.example
├── scripts/dev.js
└── README.md
```
