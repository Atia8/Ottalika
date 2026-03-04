# Ottalika - Building Management System

## Overview
A comprehensive property management platform connecting managers, renters, and owners with real-time communication, automated payment tracking, and maintenance workflow.

---

## Features

### Manager Dashboard
- Renter management (add/edit/delete)
- Payment tracking with overdue indicators
- Lease renewal with business rules
- Maintenance request management
- Real-time chat with renters
- Payment verification system

### Renter Portal
- View payment history and dues
- Make online payments
- Submit maintenance requests
- Real-time chat with manager
- Track request status
- View lease details

### Owner Dashboard
- Revenue analytics across buildings
- Expense tracking
- Payment monitoring
- Complaint overview
- Building performance metrics

### Real-Time Chat
- Instant messaging between users
- Online/offline status indicators
- Read receipts (sent, delivered, read)
- Message history persistence
- No page refresh needed

---

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Socket.IO-client, Axios |
| Backend | Node.js, Express, PostgreSQL 17, Socket.IO, JWT, Bcrypt |
| Database | PostgreSQL with PL/pgSQL, Stored Procedures, Triggers |
| Tools | VS Code, Git, Postman, pgAdmin 4 |

---

## Database Schema

**15+ Tables:**
- users – Authentication and user roles
- renters, managers, owners – Role-specific profiles
- buildings, apartments – Property structure
- payments, payment_confirmations – Payment tracking
- maintenance_requests, complaints – Issue tracking
- messages – Real-time chat storage
- rent_history, audit_logs – Historical tracking

**Key Relationships:**
- owners 1 -∞ buildings
- buildings 1 -∞ apartments
- apartments 1 -1 renters
- renters 1 -∞ payments
- renters/managers 1 -∞ messages

---

## Advanced Database Features

### Stored Procedures
- renew_lease() – 15-step lease renewal with validation and payment generation
- resolve_maintenance_request() – Complaint resolution workflow

### Stored Functions
- get_renter_payment_status() – Returns payment status with display labels
- generate_renter_payments() – Auto-creates monthly payments for entire lease
- validate_renter_payment() – Ensures pay oldest first, no future payments

### Triggers (11+)
- Auto-generate payments when renter gets apartment
- Audit logging for all status changes
- Automatic timestamp updates
- Bill status updates based on due date

### Indexes (30+)
- Optimized queries for payments, messages, and user lookups

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL 17
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ottalika.git
cd ottalika
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
```

3. **Database Setup**
```bash
# Create database
createdb ottalika_db


4. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env
```

5. **Run the Application**
```bash
# Backend (from backend folder)
npm run dev

# Frontend (from frontend folder)
npm run dev
```

6. **Access the App**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@ottalika.com | demo123 |
| Renter | renter@ottalika.com | demo123 |
| Owner | owner@ottalika.com | demo123 |
| Renter (Overdue) | emily.wilson@example.com | demo123 |

---

## Project Structure

```
ottalika/
├── backend/
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── database/       # SQL migrations
│   │   ├── middleware/     # Auth, validation
│   │   └── socket/         # Socket.IO setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # Auth context
│   │   ├── hooks/          # Custom hooks (useSocket)
│   │   └── services/       # API services
│   └── package.json
└── README.md
```

---

## Project Stats

- 50+ apartments across 3 buildings
- 13+ active renters
- 200+ payment records
- 100+ chat messages
- 15+ database tables
- 30+ indexes for performance
- 11+ triggers for automation
- 4 stored functions
- 2 complex stored procedures

---

## Future Enhancements

- Mobile app with React Native
- Payment gateway integration (bKash, Nagad)
- Email/SMS notifications
- Advanced analytics dashboard
- Push notifications
- Document upload for renters
