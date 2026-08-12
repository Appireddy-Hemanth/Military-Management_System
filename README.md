# Military Asset Management System (M.A.M.S.)

A complete, production-quality full-stack application for managing military assets such as vehicles, weapons, and ammunition across multiple military bases.

## Features
- **Dynamic Ledger-based Inventory**: Strictly calculated metrics (Opening + Purchases + Transfers In - Transfers Out = Net Movement - Assigned - Expended = Closing Balance).
- **Atomic Transactions**: Strict Prisma-enforced transfers across base borders to prevent data inconsistency and inventory anomalies.
- **Role-Based Access Control**: `ADMIN`, `BASE_COMMANDER`, and `LOGISTICS_OFFICER` with rigorous query restrictions at the database query level.
- **Audit Logging**: Comprehensive non-editable trail for every critical action.
- **Enterprise UI**: Dynamic Recharts implementations wrapped inside a strict military slate/navy Tailwind theme.

## Architecture & Tech Stack
### Backend
- **Node.js, Express.js** Core REST service
- **PostgreSQL** Primary database
- **Prisma V7** Full typings and interactive migrations/transactions
- **JWT & bcryptjs** Authentication layer

### Frontend
- **React 18 & Vite**
- **Tailwind CSS**
- **React Router & Axios** Contextually injected Authorization headers
- **Lucide React & Recharts**

## Database Setup & Installation

1. Create a PostgreSQL instance (A fast fallback `docker-compose.yml` is provided).
2. Configure `.env` inside `/backend` directory.

### Backend Startup

```bash
cd backend
npm install
# Push schema config
npx prisma db push
npx prisma generate
# Seed the initial mock data
node seed.js
# Start server
npm run dev
```

### Frontend Startup

```bash
cd frontend
npm install
npm run dev
```
*(By default frontend runs on `http://localhost:5173` pointing to `http://localhost:5000`)* 

## API Documentation Snapshot

### Authentication
`POST /api/auth/login`
`GET /api/auth/me`

### Secured Modules
- `GET/POST /api/bases` (Admin only)
- `GET/POST /api/purchases`
- `GET/POST /api/transfers` (Transaction-safe)
- `GET/POST /api/assignments`
- `GET/POST /api/expenditures`
- `GET /api/dashboard/metrics` (Calculates active ledger)

## Initial Test Credentials

The database is pre-seeded with these passwords configured to `password123`.

1. **Admin**
   - Username: `Admin` 
2. **Base Commander Alpha**
   - Username: `Base Commander Alpha`
3. **Logistics Officer**
   - Username: `Logistics Officer`

## Future Improvements
- Granular serial-number-level barcode assignment mapping (currently handles bulk quantities for agnostic integration).
- Real-time WebSockets integration for `In_Transit` live updates.
- 2FA Authorization hooks.
