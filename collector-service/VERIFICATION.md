# Collector Service Verification Report

## ✅ Configuration Check (.env)

### Fixed Issues:
1. **MongoDB URI** - Added database name `sentimind_collector` to connection string
   - Before: `mongodb+srv://.../?appName=Cluster0`
   - After: `mongodb+srv://.../sentimind_collector?appName=Cluster0`

### Verified Configuration:
- ✅ PORT=8021
- ✅ NODE_ENV=development
- ✅ MONGODB_URI (with database name)
- ✅ All time window defaults (24 hours)
- ✅ All API keys present:
  - TWITTER_BEARER_TOKEN ✅
  - YOUTUBE_API_KEY ✅
  - NEWSAPI_KEY ✅
  - GOOGLE_API_KEY ✅
  - BLOGGER_BLOG_ID ✅
  - TUMBLR_API_KEY ✅

## ✅ Code Structure Verification

### Files Verified:
1. **src/config/env.js** - ✅ Correctly reads all env vars
2. **src/db/mongo.js** - ✅ Enhanced with error handling and logging
3. **src/app.js** - ✅ Enhanced startup logging
4. **src/routes/collectRoutes.js** - ✅ All 7 endpoints registered
5. **src/controllers/collectController.js** - ✅ Proper error handling
6. **src/models/Mention.js** - ✅ Schema matches requirements
7. **All ingestion services** - ✅ Proper structure

### Endpoints Available:
- `GET /health` - Health check
- `GET /api/collect/reddit` - Reddit mentions
- `GET /api/collect/twitter` - Twitter/X mentions
- `GET /api/collect/youtube` - YouTube mentions
- `GET /api/collect/wordpress` - WordPress mentions
- `GET /api/collect/blogger` - Blogger mentions
- `GET /api/collect/tumblr` - Tumblr mentions
- `GET /api/collect/news` - NewsAPI mentions

## 🧪 Testing Instructions

### 1. Start the Service

```bash
cd collector-service
npm install  # if not done already
npm run dev
```

Expected output:
```
✅ MongoDB connected successfully
   Database: sentimind_collector
🚀 Collector Service listening on port 8021
   Health check: http://localhost:8021/health
   Endpoints: http://localhost:8021/api/collect/{platform}
```

### 2. Test Health Endpoint

**Postman/curl:**
```
GET http://localhost:8021/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "sentimind-collector"
}
```

### 3. Test Collection Endpoints

**Example - Reddit (no API key needed):**
```
GET http://localhost:8021/api/collect/reddit?keyword=tesla&projectId=1&limit=5&hours=24
```

**Example - Twitter (requires API key):**
```
GET http://localhost:8021/api/collect/twitter?keyword=tesla&projectId=1&limit=5&hours=24
```

**Example - YouTube:**
```
GET http://localhost:8021/api/collect/youtube?keyword=tesla&projectId=1&limit=5&hours=12
```

**Example - News:**
```
GET http://localhost:8021/api/collect/news?keyword=tesla&projectId=1&limit=10
```

### 4. Run Automated Test Script

```bash
node test-endpoints.js
```

This will test all endpoints sequentially and show results.

### 5. Verify MongoDB Storage

After running collection endpoints, check MongoDB:

```javascript
// In MongoDB shell or Compass
use sentimind_collector
db.mentions.find().pretty()
```

You should see documents with:
- projectId
- keyword
- platform
- content
- author
- sourceUrl
- publishedAt
- collectedAt
- timeWindowUsed
- metadata (platform-specific)
- rawJson (full API response)

## ⚠️ Common Issues & Solutions

### MongoDB Connection Failed
- Check if MongoDB Atlas IP whitelist includes your IP
- Verify credentials in MONGODB_URI
- Check network connectivity

### API Key Errors
- Twitter: Verify bearer token is valid and not expired
- YouTube: Check API key quota/restrictions
- NewsAPI: Free tier has rate limits
- Blogger: Verify blog ID exists and API key has access

### Empty Results
- Normal if no recent mentions found
- Try different keywords
- Adjust `hours` parameter (try 48 or 72)
- Check if platform APIs are accessible

### Rate Limiting
- Some APIs (Twitter, NewsAPI) have rate limits
- Wait between requests
- Use smaller `limit` values

## 📋 Endpoint Parameters

All `/api/collect/{platform}` endpoints accept:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `keyword` | string | ✅ Yes | - | Search keyword |
| `projectId` | number | ✅ Yes | - | Project ID from PostgreSQL |
| `limit` | number | ❌ No | 20 | Max results (capped per platform) |
| `hours` | number | ❌ No | 24 | Time window in hours |

## ✅ Verification Checklist

- [x] .env file configured correctly
- [x] MongoDB URI includes database name
- [x] All API keys present
- [x] Code structure verified
- [x] Error handling in place
- [x] MongoDB connection with logging
- [x] All 7 platform endpoints registered
- [x] Test script created

## 🚀 Next Steps

1. Start the service: `npm run dev`
2. Test health endpoint
3. Test each platform endpoint individually
4. Verify data in MongoDB
5. Check logs for any errors
