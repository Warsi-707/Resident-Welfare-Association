# 🏢 Resident Welfare Association (RWA) Management System

A full-stack, enterprise-grade Community & Billing Management web application built with **React.js (Frontend)**, **Node.js + Express (Backend)**, and **PostgreSQL Database** powered by **Prisma ORM**.

---

## 📑 Table of Contents
- [✨ Features](#-features)
- [🏗️ System Architecture](#️-system-architecture)
- [📂 Project Directory Structure](#-project-directory-structure)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start Guide](#-quick-start-guide)
  - [1. Prerequisites](#1-prerequisites)
  - [2. PostgreSQL Database Setup](#2-postgresql-database-setup)
  - [3. Environment Configuration (`.env`)](#3-environment-configuration-env)
  - [4. Install Dependencies](#4-install-dependencies)
  - [5. Run Database Migrations & Seed](#5-run-database-migrations--seed)
  - [6. Start the Server](#6-start-the-server)
- [🔑 Default Login Credentials](#-default-login-credentials)
- [📡 Backend API Endpoints](#-backend-api-endpoints)
- [🗄️ Database Schema (PostgreSQL)](#️-database-schema-postgresql)
- [📜 NPM Scripts Reference](#-npm-scripts-reference)

---

## ✨ Features

- 👤 **Role-Based Authentication**: Secure JWT-based authentication for Administrators and Collection Staff.
- 👥 **Resident & Member Management**: Complete directory with plot/house info, status tracking, arrears, and profile details.
- 🧾 **Automated Monthly Challan Generation**: Batch or individual generation with automatic prior balance calculation and due dates.
- 💳 **Payment Collection & Receipts**: Record payments (Cash, Bank Transfer, Online, Cheque), partial payments, printable thermal/A4 receipts.
- 🔄 **Reversals & Audit Trail**: Void mistakenly entered payments with mandatory audit reason and activity logging.
- 📊 **Financial Dashboard & Analytics**: Real-time KPI charts, monthly collection trends, payment status breakdowns (Recharts).
- 📑 **Comprehensive Reports**: Exportable reports for monthly collections, unpaid/partial dues, and staff collection performance.
- ⚙️ **Association Settings**: Configurable RWA organization info, custom currency, due day, and receipt footers.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["💻 Frontend (React 19 + Vite + Tailwind CSS)"]
    API["⚙️ Backend API (Node.js + Express + TypeScript)"]
    ORM["🔄 ORM (Prisma Client)"]
    DB[("🗄️ Database (PostgreSQL / psql)")]

    Client -->|HTTP / REST API (JSON + JWT)| API
    API -->|Prisma Query Engine| ORM
    ORM -->|TCP Connection Pool (5432)| DB
```

---

## 📂 Project Directory Structure

```text
resident-welfare-association/
├── prisma/
│   ├── schema.prisma         # PostgreSQL Prisma schema definition
│   └── seed.ts               # Database seeder (Admin, Staff, Settings)
├── server/
│   ├── db.ts                 # Prisma Client instance
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication & RBAC middleware
│   ├── routes/
│   │   ├── auth.ts           # Login, Register, Profile, Token verification
│   │   ├── members.ts        # Member CRUD & dues calculation
│   │   ├── staff.ts          # Staff CRUD & collection tracking
│   │   ├── challans.ts       # Monthly challan batch generation & status
│   │   ├── payments.ts       # Payment processing, receipts, voiding
│   │   ├── dashboard.ts      # KPI stats & chart datasets
│   │   ├── reports.ts        # Monthly & status financial reports
│   │   ├── settings.ts       # RWA organization preferences
│   │   ├── activity.ts       # Audit trail logs
│   │   └── reset.ts          # Safe sample data reset endpoint
│   └── utils/
│       └── helpers.ts        # Backend utilities & formatters
├── src/                      # React Frontend Application
│   ├── components/
│   │   ├── admin/            # Dashboard, Staff, Settings, Audit logs
│   │   ├── auth/             # Login and authentication forms
│   │   ├── challans/         # Challan list, generator, detail view
│   │   ├── common/           # Buttons, Modal, Toast notifications
│   │   ├── layout/           # Sidebar, Navbar, Page container
│   │   ├── members/          # Member list, Add/Edit modal, Detail view
│   │   ├── payments/         # Payment collection form, Receipts, Reversals
│   │   └── reports/          # Financial report tables and charts
│   ├── context/
│   │   └── AppContext.tsx    # Global state (User, Active Page, Notifications)
│   ├── services/
│   │   └── api.ts            # Client-side REST API wrapper functions
│   ├── types.ts              # TypeScript interfaces for models & API payloads
│   ├── App.tsx               # Main routing & application view switch
│   ├── index.css             # Tailwind & custom CSS variables
│   └── main.tsx              # React DOM mounting entry point
├── .env                      # Local environment variables
├── .env.example              # Environment variables template
├── package.json              # Project dependencies & npm scripts
├── server.ts                 # Main Express server entry point + Vite middleware
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite bundler configuration
```

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 19 + TypeScript | Component-based modern UI |
| **Styling** | Tailwind CSS v4 | Utility-first responsive styling |
| **Icons & Charts** | Lucide React + Recharts | High-performance icons & interactive charts |
| **Backend** | Node.js + Express.js | High-throughput REST API |
| **Language** | TypeScript | Full end-to-end type safety |
| **ORM** | Prisma ORM 6 | Type-safe PostgreSQL schema & queries |
| **Database** | PostgreSQL (psql) | ACID-compliant relational database |
| **Security** | BCrypt + JSONWebToken | Password hashing & JWT token verification |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher) - [Download Node.js](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download PostgreSQL](https://www.postgresql.org/download/)

---

### 2. PostgreSQL Database Setup

1. Open your **PostgreSQL Shell (`psql`)** or **pgAdmin**:
   ```bash
   psql -U postgres
   ```
2. Enter your PostgreSQL password when prompted.
3. Create a new database for the application:
   ```sql
   CREATE DATABASE rwa_db;
   ```
4. Verify the database is created:
   ```sql
   \l
   ```
5. Exit `psql`:
   ```sql
   \q
   ```

---

### 3. Environment Configuration (`.env`)

Create or update the `.env` file in the root directory:

```env
# PostgreSQL Database connection URL
# Format: postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?schema=public
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rwa_db?schema=public"

# JWT Secret for access token signing
JWT_SECRET="rwa-super-secret-jwt-key-2026-change-in-production"

# Application Port (Default: 3000)
PORT=3000

# Optional: Google Gemini API Key
GEMINI_API_KEY=""
```

> **Note**: Replace `postgres:postgres` with your actual PostgreSQL username and password if different.

---

### 4. Install Dependencies

Install all frontend and backend npm packages:

```bash
npm install
```

---

### 5. Run Database Migrations & Seed

Initialize the database tables and populate the default admin and staff accounts:

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Push Schema directly to PostgreSQL database
npm run db:push

# 3. Seed Initial Data (Admin user, Staff user, RWA Settings)
npm run db:seed
```

---

### 6. Start the Server

Start both the Express backend and React frontend with hot-reload enabled:

```bash
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🔑 Default Login Credentials

After running `npm run db:seed`, the following accounts are ready to use:

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Full access (All modules, settings, reversals) |
| **Collection Staff** | `staff` | `staff123` | Payment collection, Challan lookup, Receipts |

---

## 📡 Backend API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/login` - User login (returns JWT token & user info)
- `POST /api/auth/register` - Register a new user
- `GET /api/auth/me` - Get current logged-in user profile

### 👥 Members (`/api/members`)
- `GET /api/members` - List all members with filtering & pagination
- `GET /api/members/:id` - Get member details, challans & payment history
- `POST /api/members` - Create a new member record
- `PUT /api/members/:id` - Update member details
- `DELETE /api/members/:id` - Delete or deactivate a member

### 🧑‍💼 Staff (`/api/staff`)
- `GET /api/staff` - List all collection staff members
- `POST /api/staff` - Add new staff member
- `PUT /api/staff/:id` - Update staff details
- `DELETE /api/staff/:id` - Deactivate staff member

### 🧾 Challans (`/api/challans`)
- `GET /api/challans` - List challans (filter by month, status, member)
- `POST /api/challans/generate` - Generate monthly challan batch
- `GET /api/challans/:id` - Get detailed challan breakdown

### 💳 Payments & Receipts (`/api/payments`)
- `GET /api/payments` - List payment history with search & filter
- `POST /api/payments` - Record new payment & auto-allocate to challans
- `POST /api/payments/:id/void` - Void/reverse a payment (Admin only)
- `GET /api/payments/receipt/:receiptNumber` - Get printable receipt details

### 📊 Dashboard & Analytics (`/api/dashboard`)
- `GET /api/dashboard/stats` - Overall KPI metrics (Revenue, Pending, Paid Count)
- `GET /api/dashboard/charts` - 6-month collection trend data

### 📑 Reports (`/api/reports`)
- `GET /api/reports/monthly` - Monthly financial collection summary
- `GET /api/reports/status` - Paid, Partial, and Unpaid status report
- `GET /api/reports/staff` - Staff collection performance report

### ⚙️ Settings & Audit (`/api/settings`, `/api/activity`)
- `GET /api/settings` - Retrieve association profile & settings
- `PUT /api/settings` - Update association details
- `GET /api/activity` - Fetch system activity audit logs

---

## 🗄️ Database Schema (PostgreSQL)

```mermaid
erDiagram
    User {
        String id PK
        String username UK
        String passwordHash
        String fullName
        String role
        String status
        DateTime createdAt
    }

    Member {
        String id PK
        String memberCode UK
        String fullName
        String houseNumber
        String address
        String contactNumber
        Float monthlyDueAmount
        String status
    }

    Staff {
        String id PK
        String staffCode UK
        String fullName
        String contactNumber
        String roleTitle
        String status
    }

    Challan {
        String id PK
        String challanNumber UK
        String memberId FK
        String month
        String monthKey
        Int year
        Float baseAmount
        Float arrearsAmount
        Float totalAmount
        Float paidAmount
        Float balance
        String status
    }

    Payment {
        String id PK
        String paymentNumber UK
        String receiptNumber UK
        String memberId FK
        Float amount
        String paymentDate
        String paymentMethod
        Boolean isVoid
    }

    PaymentAllocation {
        String id PK
        String paymentId FK
        String challanId FK
        Float allocatedAmount
    }

    Receipt {
        String id PK
        String receiptNumber UK
        String paymentId FK
        String issuedTo
        String issuedBy
    }

    Member ||--o{ Challan : "has"
    Member ||--o{ Payment : "makes"
    Payment ||--o{ PaymentAllocation : "allocates"
    Challan ||--o{ PaymentAllocation : "receives"
    Payment ||--|| Receipt : "generates"
```

---

## 📜 NPM Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Starts development server with hot-reload (`http://localhost:3000`) |
| `npm run build` | Builds React frontend and bundles Express backend for production |
| `npm start` | Runs the compiled production server |
| `npm run db:push` | Synchronizes the Prisma schema directly with PostgreSQL database |
| `npm run db:migrate` | Creates and applies SQL migrations in development |
| `npm run db:seed` | Non-destructively seeds/updates default admin/staff accounts and settings (idempotent) |
| `npm run db:reset-demo` | Explicitly resets database to clean demo state (destructive) |
| `npm run db:studio` | Opens Prisma Studio (Web GUI for database records) |
| `npm run prisma:generate` | Generates the latest Prisma Client types |
| `npm run lint` | Runs TypeScript type checks |

---

## 🛡️ Production Deployment Checklist

1. Change `JWT_SECRET` in `.env` to a long, randomized key.
2. Set `NODE_ENV=production` in production environment.
3. Configure PostgreSQL database connection with SSL if hosting on Cloud (AWS RDS, Supabase, Neon, Railway).
4. Run `npm run build` followed by `npm start`.
