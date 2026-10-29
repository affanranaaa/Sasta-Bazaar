<h1 align="center">
  <br>
  🛒 Sasta Bazaar
  <br>
</h1>

<p align="center">
  A full-stack e-commerce marketplace where users can list, browse, and purchase products — with real Stripe payments, JWT auth, coupon support, and a live cart.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Django-6.1-092E20?style=for-the-badge&logo=django&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

---

## 📖 Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Overview](#api-overview)
- [Useful Commands](#useful-commands)
- [Deployment Notes](#deployment-notes)

---

## 🧾 About the Project

**Sasta Bazaar** (meaning *Cheap Market* in Urdu/Hindi) is a two-sided marketplace built with a **Django REST Framework** backend and a **React + Vite** frontend. Users can sign up, list products for sale, shop other users' listings, manage their cart, apply discount coupons, and pay securely via Stripe — all within a seamless single-page app experience.

---

## ✨ Key Features

| Feature | Details |
|---|---|
| 🔐 **Authentication** | JWT-based login & registration with token refresh. Protected routes for authenticated users only. |
| 👤 **User Profiles** | Custom user model with display picture, phone number, address, and full profile management. |
| 📦 **Product Listings** | Create, edit, and delete your own listings with multiple image uploads. Auto-generated serial numbers (e.g. `PRD-3F9A2B1C`). |
| 🔍 **Full-Text Search** | PostgreSQL `pg_trgm` GIN indexes on product title and description for fast, fuzzy search. |
| 🛒 **Smart Cart** | Guest cart (session-based) merges seamlessly into the user cart upon login. Supports quantity adjustments and item removal. |
| 🎫 **Coupon System** | Admin-managed promo codes with percentage discounts and expiry dates, applied at checkout. |
| 💳 **Stripe Payments** | Stripe Checkout sessions with live webhook handling. Tracks full payment status history (`requires_payment → succeeded / failed / refunded`) via a `PaymentStatusLog` table. |
| 📋 **Order Management** | Full order lifecycle: pending → paid / failed / cancelled. Prices locked at time of purchase. 24-hour payment deadline with automated daily cleanup via Vercel Cron. |
| 💬 **Comments** | Users can comment on products (excluding their own). Full CRUD — only the author can edit or delete their comment. |
| 📸 **Media Storage** | Local filesystem in development; Supabase S3-compatible storage in staging/production. |
| 🛡️ **Security** | CSRF protection, CORS headers, HSTS, secure cookies, and granular DRF permission classes. |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI component library |
| **Vite** | 8 | Build tool & dev server |
| **React Router DOM** | 7 | Client-side routing |
| **Axios** | 1.x | HTTP API client |
| **Bootstrap** | 5.3 | CSS component framework |
| **Bootstrap Icons** | 1.13 | Icon set |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Python / Django** | 6.1 | Web framework |
| **Django REST Framework** | 3.18 | REST API layer |
| **Simple JWT** | 5.5 | JWT authentication |
| **django-cors-headers** | 4.9 | CORS handling |
| **Pillow** | 12 | Image processing |
| **WhiteNoise** | 6.12 | Static file serving |
| **Gunicorn** | 26 | WSGI production server |
| **python-decouple** | 3.8 | Environment variable management |

### Database & Storage

| Technology | Purpose |
|---|---|
| **PostgreSQL** | Primary database (`pg_trgm` extension enabled for product search) |
| **psycopg2-binary** | PostgreSQL adapter for Django |
| **Supabase Storage** (S3-compatible) | Media file storage in staging/production |
| **boto3 / django-storages** | AWS S3-compatible SDK for Supabase integration |

### Payments & Deployment

| Technology | Purpose |
|---|---|
| **Stripe** | Payment processing, Checkout Sessions, and Webhooks |
| **Vercel** | Frontend & backend hosting with serverless functions |
| **Vercel Cron Jobs** | Daily cleanup of expired pending orders |

---

## 📁 Project Structure

```text
Sasta-Bazaar/
├── backend/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py          # Shared settings
│   │   │   ├── development.py   # Local dev overrides
│   │   │   ├── staging.py       # Staging env (Supabase media)
│   │   │   └── production.py    # Production env (HTTPS, HSTS)
│   │   ├── urls.py              # Root URL configuration
│   │   └── wsgi.py / asgi.py
│   ├── Users/                   # Custom user model, auth views & JWT
│   ├── Products/                # Product & ProductImage models, search
│   ├── Cart/                    # Guest (session) + user cart logic
│   ├── Orders/                  # Order, OrderItem, Payment, PaymentStatusLog
│   ├── Comments/                # Product comment CRUD
│   ├── Coupons/                 # Promo code model & validation
│   ├── manage.py
│   ├── requirements.txt
│   └── vercel.json              # Backend Vercel config + cron job
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client & API helpers
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductGallery.jsx
│   │   │   ├── CommentsSection.jsx
│   │   │   ├── CartItem.jsx
│   │   │   ├── OrderCard.jsx
│   │   │   ├── OrderSummary.jsx
│   │   │   ├── PaymentCountdown.jsx
│   │   │   ├── ProductEditForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/             # React context providers (auth, cart state)
│   │   ├── pages/               # Page-level components
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── CheckoutSuccess.jsx
│   │   │   └── CheckoutCancel.jsx
│   │   └── utils/               # Shared utility functions
│   ├── api/
│   │   └── proxy.js             # Vercel serverless proxy for API requests
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── vercel.json              # Frontend Vercel config & rewrites
│
└── staticfiles/                 # Collected Django static files
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.11+
- **Node.js** 18+ and **npm**
- **PostgreSQL** 14+ (the database user needs permission to create the `pg_trgm` extension)

---

### Backend Setup

**1. Create and activate a virtual environment:**

```bash
cd backend
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

**2. Install dependencies:**

```bash
pip install -r requirements.txt
```

**3. Create `backend/.env`:**

```dotenv
SECRET_KEY=replace-with-a-long-random-secret

DB_NAME=sasta_bazaar
DB_USER=postgres
DB_PASSWORD=your-local-db-password
DB_HOST=127.0.0.1
DB_PORT=5432

FRONTEND_URL=http://localhost:5173
SITE_URL=http://localhost:8000

# Optional — only needed to test Stripe payment flows locally
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

> ⚠️ Never commit real secrets or production credentials.

**4. Apply migrations and start the server:**

```bash
python manage.py migrate
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

**5. (Optional) Create a superuser for the Django Admin panel:**

```bash
python manage.py createsuperuser
```

Then visit `http://localhost:8000/admin/` to manage coupons, users, orders, and more.

---

### Frontend Setup

**1. Install dependencies:**

```bash
cd frontend
npm install
```

**2. Create `frontend/.env`:**

```dotenv
VITE_API_URL=http://localhost:8000
```

**3. Start the development server:**

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. The Django backend is configured to accept requests from this origin via CORS/CSRF settings.

---

## 🔌 API Overview

All routes are served under `/api/`. Authentication uses **JWT Bearer tokens**; unsafe requests also require a **Django CSRF token**.

| Route | Description |
|---|---|
| `POST /api/auth/register/` | Register a new user |
| `POST /api/auth/login/` | Obtain JWT access & refresh tokens |
| `POST /api/auth/token/refresh/` | Refresh access token |
| `GET/PUT /api/auth/profile/` | Retrieve or update the current user's profile |
| `GET/POST /api/products/` | List all products / create a new listing |
| `GET/PUT/DELETE /api/products/<id>/` | Retrieve, update, or delete a product |
| `GET /api/search/` | Full-text product search |
| `GET/POST /api/products/<id>/comments/` | List or create comments on a product |
| `PUT/DELETE /api/comments/<id>/` | Edit or delete a comment |
| `GET/POST /api/cart/` | View cart / add item |
| `PUT/DELETE /api/cart/<item_id>/` | Update or remove a cart item |
| `POST /api/checkout/` | Create a Stripe Checkout session |
| `GET /api/orders/` | List all orders for the current user |
| `POST /api/orders/<id>/cancel/` | Cancel a pending order |
| `POST /api/webhook/stripe/` | Stripe payment event webhook |
| `POST /api/coupons/validate/` | Validate and apply a coupon code |
| `GET /api/csrf/` | Fetch CSRF token |

---

## 📟 Useful Commands

| Directory | Command | Purpose |
|---|---|---|
| `backend/` | `python manage.py test` | Run Django unit tests |
| `backend/` | `python manage.py makemigrations` | Create new migrations after model changes |
| `backend/` | `python manage.py migrate` | Apply pending migrations |
| `backend/` | `python manage.py createsuperuser` | Create a Django admin user |
| `frontend/` | `npm run dev` | Start Vite dev server |
| `frontend/` | `npm run build` | Build production bundle |
| `frontend/` | `npm run preview` | Preview production build locally |
| `frontend/` | `npm run lint` | Run ESLint |

---

## ☁️ Deployment Notes

The project uses **separate Vercel deployments** for the frontend and backend.

### Frontend (Vercel)
- The frontend includes a serverless proxy at `frontend/api/proxy.js` that forwards API calls to the backend, avoiding CORS issues in production.
- Set `BACKEND_URL` in your Vercel frontend environment to the deployed Django backend URL.
- Leave `VITE_API_URL` empty in production so browser requests go through the same-origin Vercel proxy.

### Backend (Vercel)
- Set all required environment variables in Vercel: `SECRET_KEY`, `DB_*`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `FRONTEND_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- A **daily Vercel Cron Job** defined in `backend/vercel.json` hits the order-expiry endpoint to clean up stale pending orders. Set `CRON_SECRET` to a private random string to secure this endpoint.

### Staging Media (Supabase)
- The staging environment uses **Supabase Storage** (S3-compatible) for user-uploaded media.
- Required variables: `SUPABASE_PROJECT_URL`, `SUPABASE_S3_ENDPOINT`, `SUPABASE_S3_REGION`, `SUPABASE_S3_ACCESS_KEY_ID`, `SUPABASE_S3_SECRET_ACCESS_KEY`.

### Security Hardening (Production)
The production settings automatically enable:
- `SECURE_SSL_REDIRECT = True`
- `SESSION_COOKIE_SECURE = True`
- `CSRF_COOKIE_SECURE = True`
- `SECURE_HSTS_SECONDS = 31536000` (1-year HSTS with subdomains)

---

<p align="center">Made with ❤️ — Sasta Bazaar</p>
