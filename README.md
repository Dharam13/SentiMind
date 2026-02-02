# Sentimind - Real-Time Brand Sentiment Analysis Platform

Sentimind is a scalable, microservices-based sentiment analysis platform that tracks and analyzes public opinion about brands across news, social media, and blog sources.

## Architecture

This project follows a microservices architecture with the following services:

- **Frontend** - React/Next.js dashboard
- **API Gateway** - Node.js entry point
- **Auth Service** - User authentication & authorization
- **Keyword Service** - Keyword tracking management
- **Scheduler Service** - Periodic job scheduling
- **Collector Service** - Data collection from various sources
- **Sentiment Service** - NLP-based sentiment analysis
- **Analytics Service** - Aggregated analytics and insights
- **Queue** - Amazon SQS for async processing

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
SentiMind/
├── frontend/          # Next.js frontend application
├── api-gateway/       # API Gateway service
├── auth-service/      # Authentication service
├── keyword-service/   # Keyword management service
├── scheduler-service/ # Job scheduler service
├── collector-service/ # Data collection service
├── sentiment-service/ # Sentiment analysis service
├── analytics-service/ # Analytics aggregation service
└── queue/            # Queue configuration
```
