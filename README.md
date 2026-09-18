# StayGo — Property Discovery, Booking & Management System

**Find • Book • Stay**

A BCA Minor Project built with:
- **Frontend:** React + Vite, Axios, React Router, plain CSS
- **Backend:** PHP (procedural MySQLi)
- **Database:** MySQL

---

## 1. Prerequisites

- **WAMP Server** (or equivalent Apache + MySQL + PHP stack) — https://www.wampserver.com/
- **Node.js** (v18 or later) and npm — https://nodejs.org/
- A code editor (VS Code recommended)

---

## 2. Backend Setup (WAMP)

1. Start WAMP and make sure Apache + MySQL are running (the WAMP tray icon should be green).

2. Copy the entire `backend` folder into your WAMP `www` directory, for example:
   ```
   C:\wamp64\www\staygo\backend
   ```

3. **Create the database:**
   - Open `http://localhost/phpmyadmin` in your browser.
   - Click **Import**, choose the file `backend/database/staygo.sql`, and click **Go**.
   - This creates the `staygo_db` database with all tables and seed data (amenities + one admin account).

4. **Check the database connection settings** in `backend/config/db.php`. The defaults match a fresh WAMP install:
   ```php
   $db_host = "localhost";
   $db_user = "root";
   $db_pass = "";
   $db_name = "staygo_db";
   ```
   Change these only if your MySQL setup uses a different username/password.

5. **Test the backend** by visiting:
   ```
   http://localhost/staygo/backend/api/property/read.php
   ```
   You should see a JSON response like `{"status":"success", ...}`.

### Default admin login
- **Email:** `admin@staygo.com`
- **Password:** `Admin@123`

(This is only shown here in the setup docs — it is never displayed anywhere in the actual application UI, per the project's security requirements.)

---

## 3. Frontend Setup (React + Vite)

1. Open a terminal in the `frontend` folder:
   ```
   cd staygo/frontend
   ```

2. Install dependencies (this recreates the `node_modules` folder, which is not included in this package):
   ```
   npm install
   ```

3. **Check the backend URL** the frontend calls. It's set in `frontend/src/api/axios.js`:
   ```js
   baseURL: "http://localhost:8000/api"
   ```
   If your backend is served through WAMP's Apache at a different path (e.g. `http://localhost/staygo/backend/api`), update this line to match. If you're running PHP's built-in server for development (`php -S localhost:8000`) from inside the `backend` folder, the default value already works.

   Also update the `BACKEND_BASE` constant used for property image URLs in:
   - `frontend/src/components/PropertyCard.jsx`
   - `frontend/src/pages/PropertyDetails.jsx`
   - `frontend/src/pages/MyBookings.jsx`

4. Run the development server:
   ```
   npm run dev
   ```
   This starts the app at `http://localhost:5173`.

5. Make sure `backend/config/db.php` has the correct CORS origin for whichever URL your frontend runs on (it currently allows `http://localhost:5173`).

---

## 4. Folder Structure

```
staygo/
├── backend/
│   ├── config/db.php          -- database connection
│   ├── api/
│   │   ├── auth/               -- register, login, logout, session, password
│   │   ├── property/           -- CRUD, search, images
│   │   ├── booking/            -- create, read, details, update (cancel/pickup)
│   │   ├── wishlist/           -- toggle, read
│   │   ├── review/             -- create, read
│   │   ├── admin/              -- dashboard, users, hosts, properties, bookings,
│   │   │                          reviews, messages, logs
│   │   ├── dashboard/          -- customer.php, host.php summary endpoints
│   │   ├── profile.php
│   │   └── contact.php
│   ├── utils/helpers.php       -- shared response/session/logging helpers
│   ├── uploads/properties/     -- uploaded property images land here
│   └── database/staygo.sql     -- full schema + seed data
│
└── frontend/
    ├── src/
    │   ├── api/axios.js        -- Axios instance (backend base URL)
    │   ├── context/AuthContext.jsx
    │   ├── components/         -- Navbar, Footer, PropertyCard, DashboardLayout, etc.
    │   └── pages/               -- one file per page (32 pages total)
    ├── index.html
    └── package.json
```

---

## 5. Notes

- All passwords are hashed with PHP's `password_hash()` — never stored in plain text.
- All database queries use prepared statements (`mysqli_prepare` / `mysqli_stmt_bind_param`).
- Sessions are handled with native PHP sessions (`session_start()`), not tokens or LocalStorage.
- Payment is a **simulation only** — no real payment gateway is integrated, per project scope.
- Pickup/drop assistance is a simple data-entry feature — no live GPS or tracking.

For a full explanation of the database design, DFDs, and architecture, see the project report (if provided separately).
