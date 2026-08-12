# 🛡️ Military Asset Management System (M.A.M.S.)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Production_Ready-success.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-informational)

A complete, production-quality full-stack logistics platform designed to manage military assets such as vehicles, weaponry, and bulk ammunition across a distributed network of military installations. 

Built with an unapologetic focus on data integrity, real-time sync, and strict Role-Based Access Control (RBAC).

---

## ✨ Enterprise Features

- **Real-Time Logistics Tracking**: WebSockets (`socket.io`) fully implemented. See live, on-screen updates of incoming asset convoys and `IN_TRANSIT` status changes without refreshing the dashboard.
- **Dynamic Ledger-based Inventory**: Strictly calculated financial/logistical metrics *(Opening + Purchases + Transfers In - Transfers Out = Net Movement - Assigned - Expended = Closing Balance)*.
- **Atomic Database Transactions**: Strict Prisma-enforced transfers across base borders to prevent data inconsistency, duplication, and inventory anomalies.
- **Multi-Factor Authentication (2FA)**: Fully wired Time-Based One-Time Password (TOTP) infrastructure secured by `speakeasy`, enforcing mandatory 2FA enrollment upon login.
- **Role-Based Access Control (RBAC)**: `ADMIN`, `BASE_COMMANDER`, and `LOGISTICS_OFFICER` roles with rigorous route and database-level query blocking. Logistics Officers are confined to their specific bases and heavily restricted. 
- **Approval Workflow Pipelines**: Lower-tier commands (Logistics Officers) cannot finalize major shipments or purchases. Requests are placed into a `PENDING` queue and generate real-time notifications to Base Commanders/Admins for review and execution.
- **On-the-Fly Serialization**: Includes advanced barcode logic allowing users to pull un-serialized assets dynamically from "Bulk" pools and physically assign them unique Serial Numbers on checkout/assignment.
- **Audit Logging**: Comprehensive, non-editable `AuditLog` trail for every critical operational action.

---

## 🏗️ Architecture & Tech Stack

### Backend
- **Framework:** Node.js, Express.js (REST JSON API)
- **Database:** PostgreSQL tracking relational infrastructure
- **ORM:** Prisma V7 (Full typings, cascading relations, and interactive transactions)
- **Security:** JWT (JSON Web Tokens), `bcryptjs` (password hashing), `speakeasy` (2FA), `cors`, `helmet`
- **Real-Time:** Socket.io server

### Frontend
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS (Custom dark/slate military tactical theme)
- **Networking:** Axios API Interceptor (Contextually injected Authorization headers), Socket.io-client
- **UI Components:** Lucide React (Icons), Recharts (Dynamic Charting)

---

## 🚀 Database Setup & Installation

### 1. Database Configuration
Create a PostgreSQL instance (you can use local pgAdmin, Docker, or Neon.tech).
Copy `.env.example` to `.env` in the `/backend` directory and configure your Database URL:

```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/mams_db"
JWT_SECRET="your_highly_secure_super_secret_jwt_key_here"
```

### 2. Backend Startup

```bash
cd backend
npm install

# Push schema directly to your SQL database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed the initial mock data (Users, Bases, Equipment)
node seed.js

# Start server
npm run dev
```

### 3. Frontend Startup

```bash
cd frontend
npm install
npm run dev
```
*(By default, the Vite frontend runs on `http://localhost:5173` pointing to API `http://localhost:5000`)* 

---

## 🔐 Initial Test Credentials

The database is pre-seeded with these hierarchy accounts. All passwords are configured to `password123`.

1. **Admin** (Superuser)
   - Username: `Admin` 
2. **Base Commander Alpha** (Can approve reqs for Fort Alpha)
   - Username: `Base Commander Alpha`
3. **Logistics Officer** (Restricted workflows)
   - Username: `Logistics Officer`

*Note: Upon successful login, navigate to the `Settings > Security` tab to pair the account with your mobile Google Authenticator app for 2FA.*

---

## 📡 Core API Modules

Authentication requests flow through JWT Bearer tokens interceptors.

| Module | Route | Access | Description |
|---|---|---|---|
| **Auth** | `/api/auth/*` | Public / All | Login, Verification, 2FA Setup |
| **Bases** | `/api/bases` | `ADMIN` / `BASE_COMMANDER` | Base orchestration and regional data |
| **Purchases** | `/api/purchases` | `ALL` (Pending RBAC) | Procurement of new bulk or serialized equipment |
| **Transfers** | `/api/transfers` | `ALL` (Pending RBAC) | Moving assets (IN_TRANSIT) between locations |
| **Assignments** | `/api/assignments` | `ALL` | Allocating internal inventory to Service IDs |
| **Expenditures**| `/api/expenditures`| `ALL` | Consuming generic resources safely (ammo/fuel) |
| **Dashboard** | `/api/dashboard/metrics`| `ALL` | Calculates and feeds macro charting ledgers |
| **Alerts** | `/api/notifications` | `ALL` | Websocket-driven Approval and UX alerts |

---

## 📈 Logistics Walkthrough

1. Check your real-time **Dashboard** alerts for incoming threats or low supplies.
2. Formally receive inbound crates from central command via **Purchases**.
3. Physically shuffle stock to front-line positions using **Transfers**. (Transfers get held in `IN-TRANSIT` until the destination team formally clicks "Receive").
4. Outpost requested gear directly to specific personnel Service IDs using **Assignments** (Type in a unique physical serial number to magically rip one unit out of bulk and permanently serialize it!).
5. Report consumed ammunition or destroyed gear using **Expenditures** to permanently reconcile the overall ledger.

---
*Maintained and architected for precision logistics tracking.*
