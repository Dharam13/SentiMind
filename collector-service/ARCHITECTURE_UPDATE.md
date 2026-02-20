# Collector Service Architecture Update

## Summary of Changes

This update removes site-specific integrations (WordPress, Blogger) and replaces them with Google Custom Search API for global web mention monitoring. Also includes News API fallback improvements.

---

## ✅ Removed Integrations

### WordPress REST API
- **Removed**: `src/services/wordpressIngestionService.js`
- **Reason**: Site-specific, not suitable for global brand monitoring
- **Endpoint Removed**: `GET /api/collect/wordpress`

### Blogger API
- **Removed**: `src/services/bloggerIngestionService.js`
- **Reason**: Site-specific, requires blog ID, not scalable
- **Endpoint Removed**: `GET /api/collect/blogger`
- **Removed Env Var**: `BLOGGER_BLOG_ID`

---

## ✅ New Integration: Google Custom Search API

### New Service
- **File**: `src/services/googleSearchIngestionService.js`
- **Endpoint**: `GET /api/collect/web`
- **Platform**: `"web"` (updated in Mention model enum)

### Features

1. **Smart Query Building**:
   - `"keyword" blog` - Finds blog mentions
   - `"keyword" review` - Finds review mentions
   - `"keyword" site:blogspot.com OR site:wordpress.com` - Specific blog platforms

2. **Time Filtering**:
   - `dateRestrict=d1` - Last 24 hours
   - `dateRestrict=d7` - Last 7 days
   - `dateRestrict=m1` - Last month
   - Automatically maps hours parameter to appropriate dateRestrict value

3. **Language Filtering**:
   - Uses `lr=lang_en` parameter for English-only results

4. **Rate Limit Handling**:
   - 1 second delay between API calls
   - Respects Google's 100 requests/day free tier limit
   - Max 10 results per request (Google API limit)

5. **Caching**:
   - In-memory cache with 5-minute TTL
   - Reduces API usage for repeated queries
   - Cache key: `google_search_{keyword}_{hours}`

6. **Deduplication**:
   - Removes duplicate URLs before storing
   - Uses `Set` to track seen URLs

7. **Pagination**:
   - Handles multiple pages of results
   - Combines results from multiple query variations

### Environment Variables Required

```env
GOOGLE_API_KEY=your-google-api-key
GOOGLE_SEARCH_CX=your-google-search-engine-id
```

**How to get Search Engine ID (CX)**:
1. Go to https://programmablesearchengine.google.com/
2. Create a new search engine or use existing one
3. Configure it to search the entire web
4. Copy the Search Engine ID (CX) from settings

---

## ✅ News API Improvements

### Fallback Logic
- **Before**: Strict 24-hour filter, returns empty if no results
- **After**: Automatic fallback to 7 days if 24-hour search returns no results

### Implementation
- If `hours <= 24`: Tries 24h first, then 168h (7 days) if no results
- If `hours > 24`: Uses requested time window
- Never fails request if no articles found (returns empty array)

### Benefits
- More reliable results
- Better user experience
- Handles edge cases where recent news might be sparse

---

## 📝 Updated Files

### Services
- ✅ `src/services/googleSearchIngestionService.js` (NEW)
- ✅ `src/services/newsIngestionService.js` (UPDATED - fallback logic)
- ❌ `src/services/wordpressIngestionService.js` (DELETED)
- ❌ `src/services/bloggerIngestionService.js` (DELETED)

### Controllers
- ✅ `src/controllers/collectController.js` (UPDATED - removed WordPress/Blogger, added Web)

### Routes
- ✅ `src/routes/collectRoutes.js` (UPDATED - removed WordPress/Blogger, added Web)

### Models
- ✅ `src/models/Mention.js` (UPDATED - enum: removed "wordpress"/"blogger", added "web")

### Configuration
- ✅ `src/config/env.js` (UPDATED - removed bloggerBlogId, added googleSearchCx)
- ✅ `.env` (UPDATED - removed WORDPRESS/BLOGGER defaults, added WEB_DEFAULT_HOURS)
- ✅ `.env.example` (UPDATED - Google Custom Search config)

### Tests
- ✅ `test-endpoints.js` (UPDATED - removed WordPress/Blogger tests, added Web test)

---

## 🔄 Migration Notes

### Database
- Existing mentions with `platform: "wordpress"` or `platform: "blogger"` will remain in database
- New mentions will use `platform: "web"` for web search results
- No database migration required (enum validation only affects new documents)

### API Endpoints

**Removed**:
- `GET /api/collect/wordpress`
- `GET /api/collect/blogger`

**Added**:
- `GET /api/collect/web?keyword=tesla&projectId=1&limit=20&hours=24`

**Unchanged**:
- `GET /api/collect/reddit`
- `GET /api/collect/twitter`
- `GET /api/collect/youtube`
- `GET /api/collect/medium`
- `GET /api/collect/news`

---

## 🧪 Testing

### Test Web Endpoint
```bash
# Start service
npm run dev

# Test web endpoint
curl "http://localhost:8021/api/collect/web?keyword=tesla&projectId=1&limit=10&hours=24"
```

### Run All Tests
```bash
npm run test
```

---

## ⚙️ Configuration

### Required Environment Variables

```env
# Google Custom Search API
GOOGLE_API_KEY=your-google-api-key
GOOGLE_SEARCH_CX=your-search-engine-id

# Time windows
WEB_DEFAULT_HOURS=24
NEWS_DEFAULT_HOURS=24
```

### Optional Configuration

- `WEB_DEFAULT_HOURS` - Default time window for web searches (default: 24)
- `NEWS_DEFAULT_HOURS` - Default time window for news searches (default: 24)

---

## 📊 Rate Limits

### Google Custom Search API
- **Free Tier**: 100 requests/day
- **Results per request**: Max 10
- **Throttling**: 1 second delay between calls
- **Caching**: 5-minute TTL to reduce API usage

### News API
- **Free Tier**: 100 requests/day
- **Results per request**: Max 100
- **Fallback**: Automatic 24h → 7d fallback

---

## 🚀 Next Steps

1. **Get Google Custom Search Engine ID**:
   - Visit https://programmablesearchengine.google.com/
   - Create/configure search engine
   - Copy CX value to `.env`

2. **Update Environment Variables**:
   - Add `GOOGLE_SEARCH_CX` to `.env`
   - Remove `BLOGGER_BLOG_ID` (if present)

3. **Test New Endpoint**:
   ```bash
   npm run test
   ```

4. **Monitor API Usage**:
   - Google Custom Search: 100 requests/day limit
   - Use caching to minimize API calls
   - Consider upgrading if hitting limits

---

## ✅ Benefits

1. **Global Coverage**: Google Custom Search covers entire web, not just specific sites
2. **Better Results**: Multiple query variations increase result diversity
3. **Scalability**: No site-specific configuration needed
4. **Reliability**: News API fallback ensures results even with sparse recent news
5. **Cost Effective**: Free tier sufficient for development/testing
6. **Smart Caching**: Reduces API usage and improves response times
