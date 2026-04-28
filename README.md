# Order Management System

A full-stack order management application built to learn modern web development from database to UI.

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14 + TypeScript | UI, form handling, auth state |
| Backend | FastAPI (Python) | REST API, business logic, auth |
| Database | PostgreSQL 16 | Persistent data storage |
| ORM | SQLAlchemy 2 | Python ↔ SQL mapping |
| Auth | JWT + bcrypt | Stateless authentication, password hashing |
| Containers | Docker + Docker Compose | Run everything with one command |

## Architecture

```
[Browser: Next.js :3000] ──HTTP/JSON──► [FastAPI :8000] ──SQL──► [PostgreSQL :5432]
```

All three services run as Docker containers and communicate over a private Docker network.

## Features

- **User auth** → register, login, JWT tokens (24h expiry), bcrypt password hashing
- **Place orders** → customer name, item, quantity, price
- **List orders** → paginated table (5 per page) with who placed each order
- **Update status** → `pending → processing → shipped → delivered → cancelled`
- **API docs** → auto-generated Swagger UI at `/docs`

## Project Structure

```
oms/
├── docker-compose.yml        # Orchestrates all 3 services
├── .env                      # Environment variables (secrets)
│
├── backend/
│   ├── main.py               # API routes (auth + orders)
│   ├── models.py             # SQLAlchemy DB models (User, Order)
│   ├── schemas.py            # Pydantic request/response shapes
│   ├── auth.py               # JWT creation/verification, password hashing
│   ├── database.py           # DB engine + session management
│   ├── requirements.txt
│   └── Dockerfile
│
└── frontend/
    ├── app/
    │   ├── page.tsx           # Orders page (protected)
    │   ├── login/page.tsx     # Login + register page
    │   ├── lib/api.ts         # Fetch utility + token management
    │   ├── layout.tsx
    │   └── globals.css
    ├── package.json
    └── Dockerfile
```

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Run

```bash
git clone <repo-url>
cd oms
docker compose up --build
```

First run takes 2–3 minutes (pulling images, installing dependencies). Subsequent runs are fast.

| URL | What |
|---|---|
| http://localhost:3000 | Frontend (order form + table) |
| http://localhost:8000/docs | FastAPI interactive API docs |
| http://localhost:8000/orders | Raw JSON API |

### Stop

```bash
docker compose down          # Stop containers
docker compose down -v       # Stop and wipe the database
```

## API Endpoints

### Auth

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Create account |
| `POST` | `/auth/login` | No | Get JWT token |
| `GET` | `/auth/me` | Yes | Get current user |

### Orders

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| `POST` | `/orders` | Yes | Place a new order |
| `GET` | `/orders?page=1&limit=5` | Yes | List orders (paginated) |
| `GET` | `/orders/{id}` | Yes | Get single order |
| `PATCH` | `/orders/{id}/status` | Yes | Update order status |

## Database Schema

```sql
users
  id              SERIAL PRIMARY KEY
  name            VARCHAR(100)
  email           VARCHAR(255) UNIQUE
  hashed_password VARCHAR(255)
  created_at      TIMESTAMPTZ DEFAULT now()

orders
  id              SERIAL PRIMARY KEY
  customer_name   VARCHAR(100)
  item            VARCHAR(200)
  quantity        INTEGER
  price           NUMERIC(10, 2)
  status          VARCHAR(50) DEFAULT 'pending'
  created_at      TIMESTAMPTZ DEFAULT now()
  created_by_id   INTEGER REFERENCES users(id)
```

## How Authentication Works

```
1. User registers → password is bcrypt hashed → stored in DB
2. User logs in   → password verified → JWT token returned (24h)
3. Frontend stores token in localStorage
4. Every API request sends: Authorization: Bearer <token>
5. FastAPI verifies token → identifies user → allows/rejects request
6. Token expires → user redirected to login
```

## Connect to the Database Directly

```bash
docker compose exec postgres psql -U oms_user -d oms_db
```

Useful queries:

```sql
SELECT * FROM users;
SELECT * FROM orders ORDER BY created_at DESC;
SELECT o.id, o.item, u.name FROM orders o JOIN users u ON u.id = o.created_by_id;
```

## Environment Variables

Defined in `.env` (never commit this file):

| Variable | Description |
|---|---|
| `POSTGRES_USER` | DB username |
| `POSTGRES_PASSWORD` | DB password |
| `POSTGRES_DB` | DB name |
| `DATABASE_URL` | Full connection string for SQLAlchemy |
| `SECRET_KEY` | Secret used to sign JWT tokens |
| `NEXT_PUBLIC_API_URL` | Backend URL used by the browser |

## What You Learn Building This

- Containerisation with Docker Compose
- Relational database design and foreign keys
- REST API design with proper HTTP status codes
- ORM → mapping Python classes to database tables
- Schema validation → rejecting bad data before it hits the DB
- Stateless authentication with JWT
- Secure password storage with bcrypt
- React state management and `useEffect`
- How a browser, API, and database communicate end to end
