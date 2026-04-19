# Railway Deployment Guide for Pipeline Restoration

## Quick Deploy

### Option 1: Railway (Recommended - Free Tier Available)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd /root/.openclaw/workspace/projects/pipeline-restoration-backend
   railway init
   ```

4. **Set Environment Variables**
   ```bash
   railway variables
   ```
   Add these:
   - `PORT=3000`
   - `NODE_ENV=production`
   - `SESSION_SECRET=your-strong-secret-here`
   - `OPERATOR_EMAIL=admin@yourdomain.com`
   - `OPERATOR_PASSWORD=your-secure-password`
   - `REPORT_SENDER_INBOX=reyes@agentmail.to`
   - `USE_MOCK_DATA=false`
   - `HIGHLEVEL_API_KEY=` (add when you have a client)
   - `HIGHLEVEL_LOCATION_ID=` (add when you have a client)

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get Public URL**
   ```bash
   railway domain
   ```

Your app will be live at: `https://pipeline-restoration-production.up.railway.app`

---

### Option 2: Render (Free Tier)

1. **Create Render Account**
   - Go to render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Connect your GitHub repo (if pushed)
   - Or use "Deploy from directory"

3. **Configure Build**
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Set Environment Variables**
   Same as Railway above

5. **Deploy**
   Click "Create Web Service"

---

### Option 3: Self-Hosted (Your Current VPS)

If you want to expose your current VPS to the internet:

**Option A: Use a Reverse Proxy (Nginx)**
```bash
# Install nginx
sudo apt update
sudo apt install nginx

# Configure nginx to proxy to your app
sudo nano /etc/nginx/sites-available/pipeline-restoration
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/pipeline-restoration /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Option B: Use a Tunnel (Cloudflare Tunnel / Ngrok)**

For quick testing without domain setup:
```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3000
```

This gives you a public URL like `https://abc123.ngrok.io`

---

## Post-Deployment

Once deployed, you'll have a public URL like:
`https://pipeline-restoration-production.up.railway.app`

**Access your app:**
- Login page: `https://your-url/login`
- Operator dashboard: `https://your-url/operator`
- Replies: `https://your-url/replies`
- Dashboard: `https://your-url/dashboard`

---

## Security Notes

1. **Change default password** immediately after first login
2. **Use strong SESSION_SECRET** (random 32+ character string)
3. **Enable HTTPS** (Railway/Render do this automatically)
4. **Don't commit .env file** to git

---

## Troubleshooting

**App won't start:**
- Check logs: `railway logs`
- Verify all env vars are set

**Database issues:**
- SQLite is file-based, data persists on Railway/Render
- For production scale, consider PostgreSQL upgrade

**HighLevel API not connecting:**
- Verify API key and Location ID
- Check if key has proper permissions

---

**Recommendation:** Start with Railway (free tier) for quickest deployment.