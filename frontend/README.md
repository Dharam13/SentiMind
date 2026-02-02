# Sentimind Frontend

Next.js frontend application for the Sentimind brand sentiment analysis platform.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Features

- 🎨 Beautiful landing page with modern UI
- 🌓 Light/Dark mode toggle
- 📱 Fully responsive design
- ✨ Smooth animations with Framer Motion
- 🎯 SEO optimized

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Sentimind
```

## Project Structure

```
frontend/
├── app/              # Next.js App Router pages
│   ├── layout.tsx   # Root layout
│   ├── page.tsx     # Landing page
│   └── globals.css  # Global styles
├── components/       # React components
│   ├── ThemeProvider.tsx
│   └── ThemeToggle.tsx
└── public/          # Static assets
```
