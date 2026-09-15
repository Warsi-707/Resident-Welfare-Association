# Resident Welfare Association - Deployment Guide

This project is organized into two clean, standalone folders:
1. **`backend/`**: Express + Prisma REST API (deploy as Backend on Vercel)
2. **`frontend/`**: Vite + React Single Page Application (deploy as Frontend on Vercel)

---

## 1. Deploy Backend to Vercel

1. Open [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." ➡️ "Project"**.
2. Select your GitHub repository: `Resident-Welfare-Association`.
3. In the project setup screen:
   - **Project Name**: e.g., `resident-welfare-backend`
   - **Framework Preset**: Select **Other**
   - **Root Directory**: Click **Edit** and select **`backend`**
4. Open the **Environment Variables** section and add:
   - `DATABASE_URL` = Your Neon PostgreSQL connection string (e.g. `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`)
   - `JWT_SECRET` = `rwa-super-secret-jwt-key-2026-change-in-production`
5. Click **Deploy**.
6. Once deployed, copy your backend URL (e.g., `https://resident-welfare-backend.vercel.app`).
   - You can test it by visiting: `https://resident-welfare-backend.vercel.app/api/health` ➡️ returns `{"status":"ok"}`.

---

## 2. Deploy Frontend to Vercel

1. In [Vercel Dashboard](https://vercel.com/dashboard), click **"Add New..." ➡️ "Project"**.
2. Select the same GitHub repository: `Resident-Welfare-Association`.
3. In the project setup screen:
   - **Project Name**: e.g., `resident-welfare-frontend` (or your existing `resident-welfare-association-rwa`)
   - **Framework Preset**: Select **Vite**
   - **Root Directory**: Click **Edit** and select **`frontend`**
4. Open the **Environment Variables** section and add:
   - `VITE_API_URL` = `https://resident-welfare-backend.vercel.app` (The URL you copied in Step 1)
5. Click **Deploy**.

---

## 3. Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

The backend automatically initializes the default admin user if the database is newly created.
