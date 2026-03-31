#  LeaveFlow — Leave Management System

A full-featured Leave Management prototype built with **React JS (Class Components)**, **MobX + Context API**, **React Router v6**, and **json-server** as the mock backend.

---

##  Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the App](#running-the-app)
- [Running E2E Tests (Cypress)](#running-e2e-tests-cypress)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)

---

##  Features

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

##  Prerequisites

- **Node.js** ≥ 16.x
- **npm** ≥ 8.x

---

##  Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/Genius2387/leave-management.git
cd leave-management

# 2. Install all dependencies
npm install
```

---

##  Running the App

You need **two processes** running simultaneously:

### Option A — Run both together

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

##  Running E2E Tests (Cypress)

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
| Apply Leave Validation |  Rejects back-dated leave (uses `/server-time`) |
| Apply Leave Validation |  Rejects when end date < start date |
| Apply Leave Validation |  Rejects empty form submission |
| Apply Leave Validation |  Accepts a valid future leave |
| URL-driven Filters |  Filters persist after hard page refresh |
| URL-driven Filters |  Pre-applied filters from a shared URL load correctly |
| URL-driven Filters |  Clear filters button resets URL and dropdowns |
| Manager Actions |  Approve/Reject buttons shown only for Pending leaves |
| Navigation |  Correct nav items rendered per role |
| Navigation |  Leave balance visible only in Employee role |

---

##  Project Structure

```
leave-management/
├── public/
│   └── index.html              # HTML shell
├── src/
│   ├── api/
│   │   ├── got.js              # Browser-compatible got wrapper
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
├── db.json                     # json-server data
├── server.js                   # Custom json-server with /server-time route
├── package.json
└── README.md
```
---

##  API Endpoints

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


