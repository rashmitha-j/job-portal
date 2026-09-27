# Job Portal

A full-stack **MERN job portal** where recruiters post jobs and manage applicants, and candidates search jobs, build a profile, upload a resume and track their applications.

Built with **MongoDB, Express, React and Node.js**, with JWT authentication, role-based access control, private resume storage in MongoDB GridFS, and a responsive UI written in plain CSS.

## Live Demo

| | URL |
|---|---|
| Frontend (Vercel) | https://job-portal-zeta-indol.vercel.app |
| Backend API (Render) | https://job-portal-gyt9.onrender.com ([health check](https://job-portal-gyt9.onrender.com/api/health)) |

> **Note:** The backend runs on Render's free plan, which sleeps after about 15 minutes without traffic. The first request after that can take **up to a minute** while it wakes up; after that the app responds normally.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Security Notes](#security-notes)
- [Future Improvements](#future-improvements)

---

## Features

### Roles

| Role | How it is created | What it can do |
|---|---|---|
| **Candidate** | Self-registration | Build a profile, upload a resume, save jobs, apply and track applications |
| **Recruiter** | Self-registration | Create a company profile, post and manage jobs, review applicants and update their status |
| **Admin** | Promoted manually in the database (cannot self-register) | Read access to any job's applicants, applications and resumes through the API (no admin UI yet) |

### Authentication & Authorization

- Registration and login with **JWT** (HS256) and **bcrypt**-hashed passwords (cost factor 12, minimum 8 characters).
- Password hashes are never returned by the API.
- Every protected request is checked against the database: the user must still exist, and their **role comes from the database**, not from the client.
- Role guards on both sides: API routes use `authenticate` + `requireRole(...)` middleware; the React app uses protected routes that redirect logged-out users to login and users with the wrong role back to the jobs page.
- Ownership is enforced server-side: recruiters can only edit/delete their own jobs, update their own company, and manage applicants for jobs they posted. Candidates can only read and change their own data.
- Expired or invalid tokens log the user out automatically.

### Job Search & Filtering (public)

- Browse all jobs without logging in.
- **Keyword search** across title, description and skills (MongoDB text index; whole words with stemming, e.g. "developers" matches "developer").
- Filters: **location** (partial, case-insensitive), **job type** (full-time, part-time, contract, internship, freelance), **work mode** (on-site, remote, hybrid) and **experience** (shows jobs whose required range fits the candidate's years).
- Pagination, with loading, error and empty states.
- Filters are stored in the URL, so results can be shared and the back button works.
- Job cards show title, company, location, work mode, job type, experience, salary and skills; the details page adds the full description and company information.

### Recruiter Features

- **Company profile** (one per recruiter): name, description, website, location and logo URL. Jobs are always posted under the recruiter's own company.
- **Create, edit and delete jobs** with validated fields: title, description, location, salary range and currency (optional, shown as "Not disclosed" when empty), experience range, skills, job type and work mode.
- **My Jobs** page listing the recruiter's jobs with applicant counts.
- **Applicants page** per job:
  - applicant name, email, skills and application date
  - expandable candidate profile (bio, experience, education, LinkedIn/GitHub)
  - open the resume submitted with the application
  - filter by status with live counts
  - update the application status (see workflow below)
- Deleting a job also removes its applications, saved-job entries and any resume files nothing else uses.

### Candidate Features

- **Dashboard**: profile completion percentage and missing fields, application and saved-job counts, recent applications with status, and quick links.
- **Profile**: phone, location, bio, skills, education history, work experience, LinkedIn and GitHub URLs, all validated (URL hosts, phone format, lengths, year ranges).
- **Resume upload**: PDF only, up to 5 MB; upload or replace at any time.
- **Saved jobs**: save/unsave from the job details page and manage the list on a dedicated page.
- **Apply** to a job in one click (a resume is required first). Each candidate can apply to a job only once; this is enforced in the UI, in the API and by a unique database index.
- **My Applications**: job title, company, applied date and a colour-coded status badge, filterable by status.

### Application Status Workflow

```
Applied ──► Shortlisted ──► Interview ──► Selected
   │             │              │
   └─────────────┴──────────────┴──► Rejected
```

- Every application starts as **Applied**.
- Recruiters move applications forward one stage at a time; an application can be **Rejected** from any open stage.
- **Selected** and **Rejected** are final.
- Transitions are enforced by the API. Candidates can never change a status, and recruiters can only change applications for their own jobs.
- Candidates see status updates on their dashboard, on My Applications and on the job details page.

### Private Resume Storage

- Resumes are **private**. They are never served as public static files and are only available through an authenticated endpoint (`GET /api/resumes/:key`).
- Access is allowed only for:
  - the candidate who owns the resume,
  - recruiters who received it with an application to one of **their** jobs,
  - admins.
  Everyone else receives `404`, so resume keys cannot be probed.
- Uploads are validated three ways: `.pdf` extension, `application/pdf` type **and** the file's actual PDF signature. Size limit is 5 MB.
- Files are stored under random, server-generated keys; the original file name is kept only for display.
- **Each application keeps a snapshot** of the resume it was submitted with, so replacing a profile resume later does not change what recruiters already received. Old files are deleted only when nothing references them.
- **Pluggable storage** (`RESUME_STORAGE`):
  - `local`: files on disk (`backend/uploads/`), for local development.
  - `gridfs`: files in **MongoDB GridFS** (`resumes.files` / `resumes.chunks` collections) in the same database. Recommended for production: it persists across redeploys and needs no extra service or account.

### Responsive Frontend

- Layouts adapt to desktop, tablet and mobile, with a collapsible navigation menu on small screens.
- Plain CSS with design tokens; no UI framework.
- Consistent loading, error, empty and success states throughout.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Axios, plain CSS |
| Backend | Node.js (20.19+), Express 5 |
| Database | MongoDB with Mongoose 9; GridFS for resume files |
| Auth | JSON Web Tokens (`jsonwebtoken`), `bcrypt` |
| File uploads | `multer` (in-memory, validated before storage) |
| Tooling | `oxlint`, `nodemon` |

---

## Project Structure

```
job-portal/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # MongoDB connection
│   │   ├── controllers/               # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── job.controller.js
│   │   │   ├── company.controller.js
│   │   │   ├── candidate.controller.js
│   │   │   ├── savedJob.controller.js
│   │   │   ├── application.controller.js
│   │   │   └── resume.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # JWT verification → req.user
│   │   │   ├── role.middleware.js     # requireRole(...)
│   │   │   ├── upload.middleware.js   # PDF upload validation
│   │   │   ├── validateObjectId.js
│   │   │   └── error.middleware.js    # 404 + central error handler
│   │   ├── models/                    # User, Company, Job, Application,
│   │   │                              # SavedJob, CandidateProfile, constants
│   │   ├── routes/                    # One router per resource
│   │   ├── services/
│   │   │   ├── resumeStorage.js       # Storage interface (selects a driver)
│   │   │   ├── resumeService.js       # Resume access rules and cleanup
│   │   │   └── storage/
│   │   │       ├── localDiskDriver.js
│   │   │       └── gridfsDriver.js
│   │   ├── utils/                     # AppError, JWT, pagination/query, responses
│   │   ├── app.js                     # Express app: CORS, JSON, routes
│   │   └── server.js                  # Config checks, DB connect, start server
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                       # Axios client + one service per resource
│   │   ├── components/                # Navbar, JobCard, JobForm, ApplicantCard,
│   │   │   └── profile/               # route guards, profile form/view, resume upload
│   │   ├── constants/                 # Job options, application statuses
│   │   ├── context/                   # Auth context and provider
│   │   ├── hooks/                     # useAuth, useFetch
│   │   ├── pages/
│   │   │   ├── candidate/             # Dashboard, Profile, Saved Jobs, Applications
│   │   │   ├── recruiter/             # My Jobs, Create/Edit Job, Company, Applicants
│   │   │   └── ...                    # Jobs, Job Details, Login, Register, 404
│   │   ├── utils/                     # Formatting and form helpers
│   │   ├── App.jsx                    # Routes
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## API Overview

All responses use a consistent envelope: `{ "success": true, "message": "...", "data": ... }` on success and `{ "success": false, "message": "..." }` on error.

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/health` | Public |
| POST | `/api/auth/register` | Public (candidate or recruiter only) |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/jobs?search=&location=&jobType=&workMode=&experience=&page=&limit=` | Public |
| GET | `/api/jobs/:id` | Public |
| POST | `/api/jobs` | Recruiter |
| PUT / DELETE | `/api/jobs/:id` | Recruiter (owner) |
| GET | `/api/jobs/recruiter/my-jobs` | Recruiter |
| POST | `/api/companies` | Recruiter |
| GET | `/api/companies/my-company` | Recruiter |
| GET | `/api/companies/:id` | Public |
| PUT | `/api/companies/:id` | Recruiter (owner) |
| GET / PUT | `/api/candidate/profile` | Candidate (own) |
| POST | `/api/candidate/profile/resume` | Candidate (multipart field `resume`) |
| GET | `/api/candidate/dashboard` | Candidate |
| GET | `/api/saved-jobs` | Candidate |
| GET / POST / DELETE | `/api/saved-jobs/:jobId` | Candidate |
| POST | `/api/applications/jobs/:jobId` | Candidate (apply) |
| GET | `/api/applications/me` | Candidate |
| GET | `/api/applications/me/jobs/:jobId` | Candidate |
| GET | `/api/applications/jobs/:jobId` | Recruiter (job owner) or Admin |
| GET | `/api/applications/:id` | Candidate (own), Recruiter (job owner) or Admin |
| PATCH | `/api/applications/:id/status` | Recruiter (job owner) |
| GET | `/api/resumes/:key` | Owner candidate, receiving recruiter or Admin |

---

## Environment Variables

Copy the example files and fill in your own values. **Never commit `.env` files**; they are ignored by Git.

### Backend (`backend/.env`)

| Variable | Required | Example (local) | Description |
|---|---|---|---|
| `MONGODB_URI` | Yes | `mongodb://127.0.0.1:27017/job-portal` | MongoDB connection string, including the database name. |
| `JWT_SECRET` | Yes | *(long random string)* | Secret used to sign tokens. Generate one with the command below. |
| `JWT_EXPIRES_IN` | No (default `1d`) | `1d` | Token lifetime. **Must include a unit**, such as `1d`, `12h` or `3600s`; a bare number is rejected at startup. |
| `CLIENT_URL` | Yes in production | `http://localhost:5173` | The frontend's exact origin, used for CORS. A trailing slash is ignored. |
| `RESUME_STORAGE` | No (default `local`) | `local` | `local` stores resumes on disk (development); `gridfs` stores them in MongoDB (production). |
| `PORT` | No (default `5000`) | `5000` | Port the API listens on. **On Render, do not set it**; Render provides `PORT` automatically. |
| `UPLOAD_DIR` | No | `./uploads` | Folder for the `local` storage driver only (default `backend/uploads`). |

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

The server validates its configuration at startup and exits with a clear message if `JWT_SECRET` is missing, `JWT_EXPIRES_IN` is invalid, `RESUME_STORAGE` is unknown, or MongoDB cannot be reached.

### Frontend (`frontend/.env`)

| Variable | Required | Example (local) | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes in production | `http://localhost:5000/api` | Base URL of the backend API, **including `/api`**. Vite embeds it at **build time**, so rebuild/redeploy after changing it. |

---

## Local Development

### Prerequisites

- **Node.js 20.19 or newer** (required by Mongoose 9 and Vite 8) and npm
- MongoDB: a local installation, or a free MongoDB Atlas cluster

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
# Edit .env: set MONGODB_URI and a generated JWT_SECRET
npm run dev                 # nodemon, auto-restarts on changes (or: npm start)
```

The API runs at http://localhost:5000; check http://localhost:5000/api/health.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

The app runs at http://localhost:5173.

### 3. Create an admin (optional)

Admins cannot self-register. Register a normal account, then promote it in MongoDB (e.g. with `mongosh` or Atlas Data Explorer):

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

Log in again to receive a token with the new role.

---

## Testing

The repository currently includes static checks and a production build. There is no committed automated test suite yet (see [Future Improvements](#future-improvements)).

```bash
cd frontend
npm run lint      # oxlint
npm run build     # production build into frontend/dist
```

Backend smoke check (with the server running):

```bash
curl http://localhost:5000/api/health
```

Suggested manual end-to-end check:

1. Browse, search and filter jobs while logged out.
2. Register as a **recruiter** → create the company profile → post a job.
3. Register as a **candidate** → complete the profile → upload a PDF resume → save and apply to the job.
4. Log in as the recruiter → **My Jobs → Applicants** → open the resume → move the status Shortlisted → Interview → Selected.
5. Log in as the candidate → confirm the new status on **My Applications** and the dashboard.
6. Confirm a candidate cannot open recruiter pages and a second recruiter cannot see the first recruiter's applicants.

---

## Production Deployment

The recommended setup is **MongoDB Atlas** (database and resume files), **Render** (backend) and **Vercel** (frontend). Deploy in this order, because each service needs the previous one's URL.

### 1. MongoDB Atlas

1. Create a cluster (the free tier works).
2. **Database Access**: create a database user with a strong password.
3. **Network Access**: add `0.0.0.0/0`. Render's free tier has no fixed outbound IP addresses, so without this the backend cannot connect.
4. Copy the connection string and add the database name, e.g.
   `mongodb+srv://<user>:<password>@<cluster-host>/job-portal?retryWrites=true&w=majority`
   URL-encode special characters in the password.

With `RESUME_STORAGE=gridfs`, resumes are stored in this database and count toward its storage quota (the free tier has 512 MB; resumes are at most 5 MB each).

### 2. Backend on Render

Create a **Web Service** from the GitHub repository:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Environment variables:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | A long random value (Render's **Generate** button works) |
| `JWT_EXPIRES_IN` | e.g. `1d` |
| `CLIENT_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app`. Set a placeholder first and update it after step 3. |
| `RESUME_STORAGE` | `gridfs` |
| `PORT` | **Do not set**; Render provides it |

Node 20.19+ is selected automatically from `engines` in `backend/package.json`. On the free tier the service sleeps when idle, so the first request after a pause can take up to a minute.

### 3. Frontend on Vercel

Import the same repository:

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variable | `VITE_API_URL` = `https://<your-render-service>.onrender.com/api` |

`VITE_API_URL` is embedded at build time; redeploy the frontend after changing it.

#### SPA routing rewrite (required)

The app uses client-side routing, so URLs like `/jobs/123` or `/candidate/dashboard` do not exist as files. Without a rewrite, refreshing or opening such a link returns **404** on Vercel. Add `frontend/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

(Other static hosts need the equivalent. Netlify, for example, uses a `_redirects` file containing `/* /index.html 200`.)

### 4. Connect the two

1. Set `CLIENT_URL` on Render to the exact Vercel production URL (Render restarts automatically).
2. Open the Vercel URL and run the manual check from [Testing](#testing).

CORS allows exactly one origin (`CLIENT_URL`), so Vercel **preview** deployments with different URLs will be blocked; test against the production URL.

---

## Security Notes

- **No secrets in the repository.** `.env` files, `node_modules/`, build output and `backend/uploads/` are git-ignored; only `.env.example` templates with placeholder values are committed. In production, set secrets in the Render/Vercel dashboards.
- **JWT secret:** use a long random value. Changing it invalidates all existing sessions.
- **Passwords** are hashed with bcrypt and never returned by the API.
- **Server-side authorization:** user identity and role come from the verified token and the database, never from IDs or roles sent by the client. Ownership (jobs, company, applications) is checked against database relationships.
- **Resumes are private**: authenticated access only, restricted to the owner, recruiters who received the application, and admins. Other users get `404`. Uploads must be genuine PDFs up to 5 MB, stored under random keys.
- **CORS** is restricted to the single configured frontend origin.
- **Input validation** runs on every write (Mongoose validators plus request checks), ObjectIds are validated, user input used in regex filters is escaped, and errors never expose stack traces.
- **Token storage:** the frontend keeps the JWT in `localStorage`, which is simple but readable by any script on the page. Keep dependencies up to date and avoid injecting untrusted HTML.
- **Rate limiting is not yet implemented**; consider adding it before real-world use (see below).

---

## Future Improvements

These are **not implemented** yet; they are ideas for further development:

- Automated test suite committed to the repo (API tests with Jest/Supertest, browser tests with Playwright) and CI on every push
- Admin dashboard UI (user management, platform statistics)
- Rate limiting on authentication endpoints and security headers (e.g. `helmet`)
- Refresh tokens / httpOnly cookie sessions
- Email verification, password reset, and email notifications when an application's status changes
- S3 or Cloudinary resume storage driver (the storage interface already supports adding drivers)
- Support for multiple CORS origins (e.g. preview deployments)
- Job closing/expiry dates and application deadlines
- Recruiter notes on applicants and interview scheduling
- Social login (Google/GitHub OAuth)
