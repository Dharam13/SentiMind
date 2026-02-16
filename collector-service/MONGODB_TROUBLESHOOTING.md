# MongoDB Connection Troubleshooting

## Current Issue: Connection Timeout

The service is unable to connect to MongoDB Atlas. Here's how to fix it:

## Step 1: Test MongoDB Connection

Run the test script:
```bash
npm run test:db
```

This will show detailed connection information and error messages.

## Step 2: Fix MongoDB Atlas IP Whitelist

**This is the most common issue!**

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Select your cluster
3. Click **"Network Access"** in the left sidebar
4. Click **"Add IP Address"**
5. Choose one of:
   - **"Add Current IP Address"** (recommended for development)
   - **"Allow Access from Anywhere"** (`0.0.0.0/0`) - for testing only, less secure
6. Click **"Confirm"**
7. Wait 1-2 minutes for changes to propagate

## Step 3: Verify Connection String

Your current connection string:
```
mongodb+srv://dharamhpatel2005_db_user:dharam123@cluster0.x4gjggk.mongodb.net/sentimind_collector?appName=Cluster0
```

Verify:
- ✅ Username: `dharamhpatel2005_db_user`
- ✅ Password: `dharam123`
- ✅ Cluster: `cluster0.x4gjggk.mongodb.net`
- ✅ Database: `sentimind_collector`

## Step 4: Check Database User Permissions

1. Go to MongoDB Atlas → **Database Access**
2. Find user `dharamhpatel2005_db_user`
3. Ensure user has **"Read and write to any database"** or at least access to `sentimind_collector`

## Step 5: Verify Cluster Status

1. Go to MongoDB Atlas → **Clusters**
2. Ensure cluster status is **"Running"** (green)
3. If paused, click **"Resume"**

## Step 6: Test Again

After fixing IP whitelist:
```bash
npm run test:db
```

Then start the service:
```bash
npm run dev
```

## Alternative: Use Local MongoDB

If Atlas continues to have issues, you can use local MongoDB:

1. Install MongoDB locally
2. Update `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/sentimind_collector
   ```

## Common Error Messages

### "Server selection timed out"
- **Cause**: IP not whitelisted or network issue
- **Fix**: Add IP to MongoDB Atlas Network Access

### "Authentication failed"
- **Cause**: Wrong username/password
- **Fix**: Verify credentials in connection string

### "ENOTFOUND" or "getaddrinfo"
- **Cause**: DNS resolution failed or wrong cluster URL
- **Fix**: Check internet connection and cluster URL

## Still Having Issues?

1. Check MongoDB Atlas status page
2. Verify your internet connection
3. Try connecting from MongoDB Compass with the same connection string
4. Check firewall/antivirus settings
