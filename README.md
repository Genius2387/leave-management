# 🏢 LeaveFlow — Leave Management System

A full-featured Leave Management prototype built with **React JS (Class Components)**, **MobX + Context API**, **React Router v6**, and **json-server** as the mock backend.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the App](#running-the-app)
- [Running E2E Tests (Cypress)](#running-e2e-tests-cypress)
- [Project Structure](#project-structure)
- [Architecture Decisions](#architecture-decisions)
- [Assumptions & Limitations](#assumptions--limitations)
- [API Endpoints](#api-endpoints)

---

## ✅ Features

### Employee View
- **Apply Leave** — Form with auto-filled name, date range picker, reason text area
  - Validates start date against **server time** (`GET /server-time`) — past dates are rejected
  - End date must be ≥ start date
  - Leave balance deducted immediately on approval; balance shown in navbar
- **My Leaves** — Table of all personal leave applications with Pending / Approved / Rejected status badges and stats summary

### Manager View
- **Team Leaves** — Full table of all team leave requests
  - **Approve / Reject** buttons for Pending leaves (balance restored on rejection)
  - **URL-driven filters** by employee name and status — persist across page refresh and are shareable
  - Filters always trigger a fresh API call (no local filtering)

### Admin View
- **Dashboard** — 
  - Summary cards: Total / Approved / Pending / Rejected / Total Days
  - **Stacked SVG bar chart** showing leaves per employee (colour-coded by status)
  - Employee summary table with balance usage progress bars
  - Department breakdown table

### Global
- **Role Switcher** dropdown (Employee / Manager / Admin) simulates login
- Leave balance pill in navbar updates reactively via MobX
- Fully **mobile-responsive** using inline styles and CSS Grid/Flexbox
- Loading states, error messages and empty states throughout

---

## 🛠 Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| UI framework | React 18 (CRA) | Class components only |
| Routing | React Router v6 | `withRouter` HOC bridges class components |
| State management | MobX 6 + React Context | `makeObservable`, class store, `observer` HOC |
| HTTP client | Custom `got` wrapper | Mimics got API over `fetch` (see Assumptions) |
| Mock API | json-server 0.17 | Runs on port 3001 |
| Styling | Inline styles | No CSS frameworks |
| E2E testing | Cypress 13 | 10+ tests across 4 suites |

---

## 📦 Prerequisites

- **Node.js** ≥ 16.x
- **npm** ≥ 8.x

---

## 🚀 Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/leave-management.git
cd leave-management

# 2. Install all dependencies (React app + dev tools)
npm install
```

---

## ▶️ Running the App

You need **two processes** running simultaneously:

### Option A — Run both together (recommended)

```bash
npm run dev
```

This uses `concurrently` to start:
- `node server.js` — json-server on **http://localhost:3001**
- `react-scripts start` — CRA dev server on **http://localhost:3000**

### Option B — Run separately

```bash
# Terminal 1: start the mock API server
npm run server

# Terminal 2: start the React app
npm start
```

Then open **http://localhost:3000** in your browser.

---

## 🧪 Running E2E Tests (Cypress)

Make sure **both** the React app and json-server are running first:

```bash
# Start both servers (if not already running)
npm run dev
```

Then in a separate terminal:

```bash
# Interactive mode (Cypress Test Runner UI)
npm run cypress:open

# Headless / CI mode
npm run cypress:run
```

### What the tests cover

| Suite | Test |
|---|---|
| Apply Leave Validation | ❌ Rejects back-dated leave (uses `/server-time`) |
| Apply Leave Validation | ❌ Rejects when end date < start date |
| Apply Leave Validation | ❌ Rejects empty form submission |
| Apply Leave Validation | ✅ Accepts a valid future leave |
| URL-driven Filters | 🔄 Filters persist after hard page refresh |
| URL-driven Filters | 🔗 Pre-applied filters from a shared URL load correctly |
| URL-driven Filters | ✕ Clear filters button resets URL and dropdowns |
| Manager Actions | 👔 Approve/Reject buttons shown only for Pending leaves |
| Navigation | 🧭 Correct nav items rendered per role |
| Navigation | 💡 Leave balance visible only in Employee role |

---

## 📁 Project Structure

```
leave-management/
├── public/
│   └── index.html              # HTML shell
├── src/
│   ├── api/
│   │   ├── got.js              # Browser-compatible got wrapper (fetch-based)
│   │   └── leaveApi.js         # All API call functions
│   ├── components/
│   │   └── Navbar.js           # Nav + role switcher + balance pill
│   ├── context/
│   │   └── AppContext.js       # React Context carrying the MobX store
│   ├── pages/
│   │   ├── ApplyLeave.js       # Employee: apply leave form
│   │   ├── MyLeaves.js         # Employee: leave history
│   │   ├── TeamLeaves.js       # Manager: team leave management
│   │   └── Dashboard.js        # Admin: summary + charts
│   ├── store/
│   │   └── leaveStore.js       # MobX store (singleton)
│   ├── utils/
│   │   └── withRouter.js       # HOC that injects RR v6 props into class components
│   ├── App.js                  # Root component, Router, Providers
│   └── index.js                # ReactDOM entry point
├── cypress/
│   └── e2e/
│       └── leave.cy.js         # All Cypress E2E tests
├── cypress.config.js           # Cypress configuration
├── db.json                     # json-server seed data
├── server.js                   # Custom json-server with /server-time route
├── package.json
└── README.md
```

---

## 🏗 Architecture Decisions

### 1. `got` in the browser
The assignment specifies `got` (a Node.js HTTP library), but the application is a CRA browser bundle — `got` cannot run in a browser. **Decision:** Created `src/api/got.js`, a thin wrapper that replicates the `got` v12 API (`got.get(url, { searchParams })`, `res.json()`, etc.) using the browser's native `fetch`. All call-sites are fully API-compatible with real `got`.

### 2. React Router v6 + Class Components
RR v6 removed `withRouter` and class-component support. **Decision:** Created `src/utils/withRouter.js`, a functional HOC that uses `useLocation`, `useNavigate`, and `useParams` internally and passes them as props to the wrapped class component. This is the officially recommended migration pattern.

### 3. URL-driven filters without `useSearchParams`
Per requirements, `useSearchParams` hook is not used. **Decision:** Filters are parsed and written by directly manipulating `URLSearchParams` (the browser Web API) on `location.search` (injected via `withRouter`). The `navigate` function updates the URL; `componentDidUpdate` detects the change and re-fetches from the API.

### 4. MobX + Context
The MobX store singleton is passed through React Context so class components access it via `static contextType = AppContext`. The `Provider` from `mobx-react` is also included for `inject()` compatibility. All reactive class components are wrapped with `observer()`.

### 5. Styling
All styling is done via inline style objects co-located with each component. No CSS framework is used. Mobile responsiveness uses CSS Grid `auto-fit/minmax` and Flexbox `flex-wrap`.

---

## ⚠️ Assumptions & Limitations

1. **`got` compatibility:** As noted above, `got` is replaced by a fetch-based wrapper with an identical API. This is explicitly documented in `got.js`.

2. **Authentication is simulated:** The "role switcher" maps each role to a fixed employee ID (Employee → Alice Johnson, Manager → Bob Smith, Admin → Carol White). This is a prototype; real auth would issue tokens and look up the user.

3. **Leave year scope:** The system doesn't filter by calendar year. All historical leaves are shown regardless of year. A production system would scope to the current annual period.

4. **Concurrent state conflicts:** If two managers approve/reject the same leave simultaneously, the last write wins (json-server default). Optimistic locking is not implemented.

5. **Pending deducts balance:** Per the requirement ("Deduct leave balance when a new leave is applied"), a Pending application immediately reduces the balance. If rejected, the balance is restored. This mirrors how most leave systems work to prevent double-booking.

6. **json-server `_like` filters:** The employee name filter uses exact match (`?employeeName=Alice Johnson`), not a fuzzy search. This is sufficient for a prototype with a known employee list.

7. **Mobile layout:** The app is responsive but optimised primarily for desktop. Tables become horizontally scrollable on small screens.

---

## 🔌 API Endpoints

All served by `json-server` on `http://localhost:3001`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/server-time` | Returns current server ISO timestamp |
| `GET` | `/employees` | List all employees |
| `GET` | `/employees/:id` | Get single employee |
| `PATCH` | `/employees/:id` | Update employee (e.g., leaveBalance) |
| `GET` | `/leaves` | List all leaves (supports `?employeeId=&status=&employeeName=`) |
| `POST` | `/leaves` | Create a new leave request |
| `PATCH` | `/leaves/:id` | Update leave status |

---

## 👤 Default Seed Data

| Employee | Dept | Leave Balance |
|---|---|---|
| Alice Johnson (Employee role) | Engineering | 18 |
| Bob Smith (Manager role) | Marketing | 22 |
| Carol White (Admin role) | HR | 22 |
| David Brown | Engineering | 20 |

Seven pre-seeded leave records (mix of Approved / Pending / Rejected) are included to make the Dashboard and Team Leaves pages interesting on first load.
