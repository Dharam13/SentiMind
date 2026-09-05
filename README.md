# SentiMind 🧠⚡
> **Autonomous Real-Time Brand Sentiment Intelligence & Conversational Commerce Platform**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev)
[![Celery](https://img.shields.io/badge/Celery-Distributed_Tasks-37814A.svg)](https://docs.celeryq.dev)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Message_Broker-FF6600.svg)](https://www.rabbitmq.com)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment_Links_API-0C2340.svg)](https://razorpay.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4.svg)](https://deepmind.google/technologies/gemini/)

---

## 📌 What is SentiMind?

**SentiMind** is an enterprise-grade brand sentiment intelligence and autonomous commerce platform. It transforms passive social listening into **active, revenue-generating interventions**.

Instead of merely displaying charts that sentiment dropped, SentiMind continuously collects public brand mentions across **Twitter / X, Reddit, YouTube, Google News, LinkedIn, and Medium**, runs dual-model sentiment analysis asynchronously via **Celery & RabbitMQ**, and autonomously triggers a **4-Agent AI loop** powered by **Google Gemini** and **Razorpay** to:
1. **Prevent Customer Churn**: Deliver instant apology resolution vouchers with exclusive discounts to vocal unhappy buyers.
2. **Accelerate Conversions**: Detect high purchase intent on social media and generate 1-click Razorpay payment links.
3. **Measure Impact**: Close the loop with verified conversion tracking and post-campaign sentiment shifts.

📖 **For deep-dive business analysis, churn statistics, and full agent architecture, read [BUSINESS_LOGIC_AND_ARCHITECTURE.md](./BUSINESS_LOGIC_AND_ARCHITECTURE.md).**

---

## 🏗️ Architecture Overview

SentiMind operates as a clean, highly optimized **4-service architecture**:

```
                                  [ USER / MERCHANT ]
                                           │
                                           ▼
                                 ┌──────────────────┐
                                 │  React + Vite UI │ (Port 3000)
                                 └─────────┬────────┘
                                           │
                                           ▼
                                ┌─────────────────────┐
                                │   Unified Backend   │ (Port 8000)
                                └──────┬───────┬──────┘
                  ┌────────────────────┘       └────────────────────┐
                  ▼                                                 ▼
        ┌───────────────────┐                             ┌───────────────────┐
        │ Collector Service │ (Port 8021)                 │ Sentiment Service │ (Port 8030)
        │ Social Media APIs │                             │ Python + FastAPI  │
        └─────────┬─────────┘                             └─────────┬─────────┘
                  │                                                 │
                  ▼                                                 ▼
        ┌───────────────────┐                             ┌───────────────────┐
        │  MongoDB Atlas    │                             │ RabbitMQ & Celery │
        │ Mentions & Agents │                             │ Async NLP Queue   │
        └───────────────────┘                             └───────────────────┘
```

### Services Breakdown

| Service | Technology | Port | Responsibilities |
| :--- | :--- | :--- | :--- |
| **`backend/`** | Node.js, Express, Prisma, Mongoose | `8000` | Unified API for Auth, Projects (PostgreSQL), 4-Agent Orchestration (Gemini), Razorpay Commerce, and Downstream Proxy. |
| **`frontend/`** | React 18, Vite, Tailwind CSS, Recharts | `3000` | Modern, responsive dark-mode dashboard with real-time sentiment analytics, feed stream, influencer ranking, and agent orchestrator. |
| **`collector-service/`** | Node.js, Axios, RSS, Social APIs | `8021` | Real-time deduplicated ingestion from Twitter/X, Reddit, YouTube, Google News, LinkedIn, and Medium. |
| **`sentiment-service/`** | Python 3.11, FastAPI, Celery, Transformers | `8030` | Dual-engine NLP (DistilBERT contextual embeddings + VADER social slang analysis) running on a distributed RabbitMQ queue. |

---

## 🤖 The 4-Agent Autonomous Commerce Loop

```
  [Social Mention Stream]
             │
             ▼
  ┌─────────────────────────┐
  │ Agent 1: Signal Agent   │  ➔ Detects sentiment anomalies & volume spikes vs. historical baseline.
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Agent 2: Root Cause     │  ➔ Diagnoses exact friction/intent (Google Gemini 2.5 Flash).
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Agent 3: Campaign Agent │  ➔ Formulates customer recovery or growth offers from product catalog.
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Agent 4: Policy & Pay   │  ➔ Anti-abuse credibility checks + generates live Razorpay payment links.
  └──────────┬──────────────┘
             │
             ▼
  [Live 1-Click Razorpay Link: https://rzp.io/rzp/...]
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **PostgreSQL**: Running locally (port `5432`)
- **RabbitMQ**: Running locally (port `5672`) or via Docker

### 1. Install Dependencies
```bash
# Root
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Collector Service
cd collector-service && npm install && cd ..

# Sentiment Service
cd sentiment-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment Variables
Ensure `.env` files are configured in root, `backend/`, `collector-service/`, and `sentiment-service/` with your:
- `MONGODB_URI`
- `DATABASE_URL`
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`
- `GEMINI_API_KEY`
- Social API credentials (Twitter, Reddit, YouTube, NewsAPI)

### 3. Run Development Servers
You can launch individual services:
```bash
# Terminal 1: Unified Backend
npm run dev:backend

# Terminal 2: Collector Service
npm run dev:collector

# Terminal 3: Celery Sentiment Worker
npm run dev:celery

# Terminal 4: Frontend UI
npm run dev:frontend
```

Or run everything using **Docker Compose**:
```bash
docker-compose up --build
```

Access the UI at: **http://localhost:3000**

---

## 📚 Key Documentation

- **[Business Logic & Architecture Guide](./BUSINESS_LOGIC_AND_ARCHITECTURE.md)**: Market facts on customer churn, influencer scoring formula, 3 pipeline stages, and Razorpay scenarios.
- **[Setup & Deployment Guide](./SETUP.md)**: Detailed step-by-step developer setup, database migrations, and troubleshooting.
