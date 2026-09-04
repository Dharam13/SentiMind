# SentiMind — Developer Setup & Run Guide

This guide provides step-by-step instructions to configure, run, and verify the SentiMind platform locally or via Docker.

---

## 📋 System Requirements

* **Operating System**: Windows, macOS, or Linux
* **Node.js**: v18.0.0 or higher
* **Python**: v3.10 or higher
* **PostgreSQL**: v14+ running on port `5432`
* **RabbitMQ**: Running on port `5672` (or via Docker)
* **MongoDB Atlas**: Free or paid cloud cluster URI

---

## 📁 Clean Repository Layout

```
SentiMind/
├── backend/            # Unified Node.js API (Auth, Projects, AI Agents, Razorpay & Proxy) [Port 8000]
├── frontend/           # React + Vite Single Page Application [Port 3000]
├── collector-service/  # Multi-platform social ingestion (Twitter, Reddit, YouTube, News) [Port 8021]
├── sentiment-service/  # Python FastAPI & Celery asynchronous worker with RabbitMQ [Port 8030]
├── docker-compose.yml  # Docker Compose configuration for 4 services + Postgres + RabbitMQ
└── package.json        # Root workspace scripts
```

---

## ⚙️ Environment Configuration

### 1. Unified Backend (`backend/.env`)
Create `backend/.env` with:
```ini
PORT=8000
NODE_ENV=development

# PostgreSQL (Prisma)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/brand_auth_db"

# MongoDB Atlas
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/sentimind_collector?appName=Cluster0"

# JWT Authentication
JWT_SECRET=your-secure-jwt-secret-key
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRY_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Downstream Microservices
COLLECTOR_SERVICE_URL=http://localhost:8021
SENTIMENT_SERVICE_URL=http://localhost:8030

# Razorpay Test Mode Credentials
RAZORPAY_KEY_ID=rzp_test_TXuHXybcwOqf4y
RAZORPAY_KEY_SECRET=pg4eo69N28h3uOjcYrb4J1dt
RAZORPAY_WEBHOOK_SECRET=webhook_secret_key_123

# Google Gemini API
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Agent Guardrails
MAX_AGENT_ACTIONS_PER_DAY=50
MAX_DISCOUNT_PERCENT=25
BASELINE_HOURS=168
WINDOW_HOURS=6
```

### 2. Collector Service (`collector-service/.env`)
```ini
PORT=8021
NODE_ENV=development
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/sentimind_collector?appName=Cluster0"

# Message Broker & Sentiment
RABBITMQ_URL=amqp://guest:guest@localhost:5672
SENTIMENT_SERVICE_URL=http://localhost:8030

# Social & News API Keys
TWITTER_API_KEY=YOUR_TWITTER_API_KEY
REDDIT_CLIENT_ID=YOUR_REDDIT_CLIENT_ID
REDDIT_CLIENT_SECRET=YOUR_REDDIT_CLIENT_SECRET
REDDIT_USER_AGENT=SentiMind/1.0
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
NEWSAPI_KEY=YOUR_NEWSAPI_KEY
GNEWS_API_KEY=YOUR_GNEWS_API_KEY
```

### 3. Sentiment Service (`sentiment-service/.env`)
```ini
PORT=8030
CELERY_BROKER_URL=amqp://guest:guest@localhost:5672//
CELERY_RESULT_BACKEND=rpc://
```

---

## 🔨 Step-by-Step Local Setup

### Step 1: Database Initialization (Prisma & PostgreSQL)
Ensure PostgreSQL is running, then generate and push the Prisma schema:
```bash
cd backend
npx prisma generate
npx prisma db push
cd ..
```

### Step 2: Install Dependencies
```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Collector Service
cd collector-service && npm install && cd ..

# Sentiment Service
cd sentiment-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

## 🏃 Running the Application

### Option A: Local Multi-Terminal (Recommended for Development)

Open 4 terminal windows from the root `SentiMind/` directory:

* **Terminal 1 (Backend)**:
  ```bash
  npm run dev:backend
  ```
  *Server starts on `http://localhost:8000`*

* **Terminal 2 (Collector Service)**:
  ```bash
  npm run dev:collector
  ```
  *Collector starts on `http://localhost:8021`*

* **Terminal 3 (Celery Sentiment Worker)**:
  ```bash
  npm run dev:celery
  ```
  *Celery worker connects to RabbitMQ queue `sentiment_tasks`*

* **Terminal 4 (Frontend UI)**:
  ```bash
  npm run dev:frontend
  ```
  *Vite dev server starts on `http://localhost:3000`*

---

### Option B: Docker Compose (Full Stack Containerized)

Ensure Docker Desktop is running, then run:
```bash
docker-compose up --build
```

This will automatically spin up:
1. `sentimind-postgres` (PostgreSQL 16 on port 5432)
2. `sentimind-rabbitmq` (RabbitMQ broker on port 5672 & management UI on 15672)
3. `sentimind-sentiment` (Sentiment FastAPI & Celery worker on port 8030)
4. `sentimind-collector` (Collector service on port 8021)
5. `sentimind-backend` (Unified backend on port 8000)
6. `sentimind-frontend` (React web app on port 3000)

---

## 🧪 Verification & Health Checks

Once running, verify each component:

* **Backend Health**: `http://localhost:8000/health` (should return `{"status": "ok"}`)
* **Collector Health**: `http://localhost:8021/health` (should return `{"status": "ok"}`)
* **Sentiment Service**: `http://localhost:8030/health` (should return `{"status": "ok"}`)
* **Frontend Web App**: Navigate to `http://localhost:3000`

---

## 🔍 Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **`RabbitMQ connection error`** | RabbitMQ broker is not running. | Start RabbitMQ service locally or run `docker run -d -p 5672:5672 rabbitmq:3-alpine`. |
| **`PrismaClientInitializationError`** | PostgreSQL credentials or port mismatch. | Verify `DATABASE_URL` in `backend/.env` matches your local PostgreSQL username and password. |
| **`Celery task pending`** | Celery worker terminal not running. | Ensure `npm run dev:celery` is active and consuming tasks from RabbitMQ. |
| **`Razorpay API Error: Authentication failed`** | Key or secret key invalid. | Verify `RAZORPAY_KEY_ID` starts with `rzp_test_` and secret is correct in `backend/.env`. |
