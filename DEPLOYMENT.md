# 🚀 UniQuery AI - Deployment Guide

## Quick Deployment Steps

### Step 1: Deploy Backend to Render (15 minutes)

#### 1.1 Push to GitHub (if not already done)
```bash
cd f:\Uni-Query-AI
git add .
git commit -m "Add deployment configurations"
git push origin main
```

#### 1.2 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

#### 1.3 Deploy Backend
1. Click **"New +"** → **"Blueprint"**
2. Connect your `uni-query-ai` repository
3. Render will detect `render.yaml` automatically
4. Click **"Apply"** to start deployment

#### 1.4 Configure Environment Variables
In Render Dashboard → Environment section, add:

```env
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION_NAME=uniquery
GROQ_API_KEY=your-groq-api-key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

> **Note**: Copy values from your local `.env` file

#### 1.5 Wait for Build
- Initial build takes ~5-10 minutes
- Watch the logs in Render dashboard
- Wait for status: **"Live"** ✅

#### 1.6 Test Backend
Visit: `https://your-app-name.onrender.com/health`

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "qdrant": {
      "status": "healthy"
    }
  }
}
```

**🎯 Copy your Render URL** - you'll need it for frontend deployment!

---

### Step 2: Deploy Frontend to Vercel (5 minutes)

#### 2.1 Install Vercel CLI
```bash
npm install -g vercel
```

#### 2.2 Login to Vercel
```bash
vercel login
```

#### 2.3 Deploy Frontend
```bash
cd f:\Uni-Query-AI
vercel
```

**Interactive Prompts:**
- Set up and deploy: **Yes**
- Which scope: **Your account**
- Link to existing project: **No**
- Project name: **uni-query-ai** (or your choice)
- In which directory is your code located: **`frontend`** ← IMPORTANT!
- Want to modify settings: **Yes**
  - Build Command: **`npm run build`**
  - Output Directory: **`dist`**
  - Development Command: **`npm run dev`**

#### 2.4 Configure Environment Variables

Vercel will ask about environment variables. Add these:

```env
VITE_API_URL=https://your-app-name.onrender.com
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

> **Note**: Replace `VITE_API_URL` with your **Render backend URL** from Step 1.6

Or set them via dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all variables above

#### 2.5 Deploy to Production
```bash
vercel --prod
```

#### 2.6 Update Backend CORS
1. Open Render dashboard
2. Go to your backend service
3. Environment → Edit
4. Update `main.py` CORS to include your Vercel URL:
   - Replace `https://uni-query-ai.vercel.app` with your actual Vercel URL
5. Save and redeploy

Or update locally and push:
```python
# In backend/app/main.py, line 69
"https://your-actual-app.vercel.app",  # Your production Vercel domain
```

---

### Step 3: Verify Deployment ✅

#### 3.1 Open Frontend
Visit your Vercel URL (provided at end of deployment)

#### 3.2 Test Checklist
- [ ] Frontend loads without errors
- [ ] Firebase authentication works
- [ ] Student login successful
- [ ] Admin login successful
- [ ] Submit a test query
- [ ] Verify response with citations
- [ ] Check document management (admin)
- [ ] Check analytics dashboard
- [ ] No CORS errors in console

#### 3.3 Check Browser Console
Press `F12` → Console tab
- Should see no red errors
- If CORS errors appear, verify backend CORS includes your Vercel domain

---

## Alternative: Manual Vercel Dashboard Deployment

If CLI doesn't work, use Vercel dashboard:

1. Go to https://vercel.com/new
2. Import Git Repository
3. Select your `uni-query-ai` repo
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables (same as Step 2.4)
6. Click **Deploy**

---

## Troubleshooting

### Frontend Issues

**"Failed to fetch" errors:**
- Check `VITE_API_URL` is set correctly
- Verify backend is running (visit `/health` endpoint)
- Check CORS configuration in backend

**Build fails on Vercel:**
- Check build logs in Vercel dashboard
- Ensure all dependencies in `package.json`
- Try local build: `cd frontend && npm run build`

**Environment variables not working:**
- Must start with `VITE_` prefix
- Set in Vercel dashboard AND redeploy
- Clear browser cache

### Backend Issues

**Render build fails:**
- Check `requirements.txt` is valid
- Review build logs in Render dashboard
- Verify Python version (3.11)

**"Unhealthy" status:**
- Check environment variables are set
- Verify Qdrant credentials
- Check Render logs for errors

**Cold start delays:**
- Render free tier spins down after 15 min inactivity
- First request takes 30-60 seconds
- Consider upgrading to paid tier ($7/month)

---

## Post-Deployment

### Update Documentation
Add deployment URLs to README.md:

```markdown
## Live Deployments

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-app.onrender.com
- **API Docs**: https://your-app.onrender.com/docs
```

### Enable Continuous Deployment

**Vercel** (auto-enabled):
- Push to `main` branch → auto-deploys to production
- Push to other branches → creates preview deployments

**Render** (auto-enabled):
- Push to `main` branch → auto-deploys backend
- Configure in Settings → Build & Deploy

### Monitor Performance

**Vercel Analytics:**
- Vercel dashboard → Your project → Analytics
- Monitor page load times and Web Vitals

**Render Logs:**
- Render dashboard → Your service → Logs
- Monitor API errors and performance

---

## Quick Reference

| Platform | URL | Purpose |
|----------|-----|---------|
| Vercel Dashboard | https://vercel.com/dashboard | Manage frontend |
| Render Dashboard | https://render.com/dashboard | Manage backend |
| Frontend (Your URL) | https://your-app.vercel.app | Live app |
| Backend (Your URL) | https://your-app.onrender.com | API |
| API Docs | https://your-app.onrender.com/docs | Swagger docs |

---

## Need Help?

- Check implementation plan: `implementation_plan.md`
- Review deployment configurations: `vercel.json`, `render.yaml`
- Vercel docs: https://vercel.com/docs
- Render docs: https://render.com/docs
