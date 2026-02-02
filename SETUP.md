# Sentimind Setup Guide

## ✅ Project Structure Created

The basic project structure has been set up with:

### Frontend (Ready to Run)
- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS for styling
- ✅ Framer Motion for animations
- ✅ Light/Dark mode toggle
- ✅ Beautiful landing page with all content

### Environment Files
- ✅ `.env.example` files created for all services:
  - Frontend
  - API Gateway
  - Auth Service
  - Keyword Service
  - Scheduler Service
  - Collector Service
  - Sentiment Service
  - Analytics Service

## 🚀 Quick Start

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Run Frontend Development Server

```bash
npm run dev
```

The landing page will be available at: **http://localhost:3000**

## 📁 Project Structure

```
SentiMind/
├── frontend/                    # ✅ Ready
│   ├── app/
│   │   ├── layout.tsx          # Root layout with theme provider
│   │   ├── page.tsx            # Landing page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── ThemeProvider.tsx   # Theme context provider
│   │   └── ThemeToggle.tsx     # Dark/Light mode toggle
│   ├── .env.local              # Frontend environment variables
│   ├── .env.example            # Example env file
│   ├── package.json            # Dependencies
│   ├── tsconfig.json           # TypeScript config
│   ├── tailwind.config.ts      # Tailwind config
│   └── next.config.js          # Next.js config
│
├── api-gateway/
│   └── .env.example            # ⏳ To be implemented
├── auth-service/
│   └── .env.example            # ⏳ To be implemented
├── keyword-service/
│   └── .env.example            # ⏳ To be implemented
├── scheduler-service/
│   └── .env.example            # ⏳ To be implemented
├── collector-service/
│   └── .env.example            # ⏳ To be implemented
├── sentiment-service/
│   └── .env.example            # ⏳ To be implemented
├── analytics-service/
│   └── .env.example            # ⏳ To be implemented
│
├── README.md                    # Main project README
├── SETUP.md                     # This file
└── .gitignore                   # Git ignore rules
```

## 🎨 Landing Page Features

The landing page includes:

1. **Hero Section**
   - "What is Sentimind?" quote/question
   - Beautiful gradient text
   - Smooth animations
   - Scroll indicator

2. **Features Section**
   - Track Hashtags
   - Analyse Reach & Sentiment
   - Real-Time Alerts
   - Personalized Reports
   - AI Brand Assistant
   - Influencer Scoring

3. **Dark/Light Mode**
   - Toggle button in top-right corner
   - Smooth theme transitions
   - Persists user preference

4. **Modern UI**
   - Responsive design
   - Smooth scroll animations
   - Gradient backgrounds
   - Card-based layout

## 🔧 Environment Configuration

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Sentimind
```

### Other Services

Each service has a `.env.example` file with:
- Database configurations
- Service URLs
- API keys placeholders
- Port numbers
- Feature flags

**Note:** Copy `.env.example` to `.env` in each service directory when implementing.

## 📝 Next Steps

1. ✅ **Frontend Landing Page** - Complete
2. ⏳ **API Gateway** - To be implemented
3. ⏳ **Auth Service** - To be implemented
4. ⏳ **Keyword Service** - To be implemented
5. ⏳ **Scheduler Service** - To be implemented
6. ⏳ **Collector Service** - To be implemented
7. ⏳ **Sentiment Service** - To be implemented
8. ⏳ **Analytics Service** - To be implemented

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Kill the process or change port in package.json
PORT=3001 npm run dev
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Regenerate types
npm run build
```

## 📚 Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Theme:** Custom dark/light mode implementation
