# 🚀 Deployment Guide - Connect Converse

This guide will help you deploy the Connect Converse chat application to production.

## 📋 Prerequisites

1. **MongoDB Atlas Account** - For database hosting
2. **Cloudinary Account** - For media storage
3. **Vercel Account** - For frontend hosting
4. **Railway/Render Account** - For backend hosting

---

## 🗄️ Step 1: Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier available)
3. Create a database user with password
4. Whitelist all IP addresses (0.0.0.0/0) for production
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/connect-converse?retryWrites=true&w=majority
   ```

---

## ☁️ Step 2: Setup Cloudinary

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Get your credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret

---

## 🖥️ Step 3: Deploy Backend (Railway)

### Option A: Railway (Recommended)

1. Go to [Railway](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to: `connect-converse/server`
5. Add environment variables:
   ```
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-generated-jwt-secret
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   PORT=5000
   FRONTEND_URL=https://your-vercel-app.vercel.app
   NODE_ENV=production
   ```
6. Railway will auto-deploy
7. Copy your backend URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. Go to [Render](https://render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Root Directory: `connect-converse/server`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add environment variables (same as Railway)
6. Deploy
7. Copy your backend URL

---

## 🌐 Step 4: Deploy Frontend (Vercel)

1. Go to [Vercel](https://vercel.com/)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Root Directory: `connect-converse`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variables:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   VITE_SOCKET_URL=https://your-backend-url.railway.app
   ```
6. Deploy
7. Copy your frontend URL

---

## 🔄 Step 5: Update CORS Settings

After deployment, update your backend CORS settings:

1. Go to your Railway/Render dashboard
2. Update environment variable:
   ```
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
3. The server.js will automatically use this for CORS

---

## ✅ Step 6: Verify Deployment

1. Visit your Vercel URL
2. Try to register a new account
3. Test login
4. Send a message
5. Upload an image
6. Make a voice/video call
7. Check all features work

---

## 🔧 Troubleshooting

### Backend Issues

**Problem**: Server not starting
- Check Railway/Render logs
- Verify all environment variables are set
- Check MongoDB connection string

**Problem**: CORS errors
- Verify FRONTEND_URL matches your Vercel URL exactly
- Check browser console for exact error

### Frontend Issues

**Problem**: API calls failing
- Check VITE_API_URL is correct
- Verify backend is running
- Check browser network tab

**Problem**: Socket.IO not connecting
- Verify VITE_SOCKET_URL is correct
- Check backend Socket.IO configuration
- Ensure no firewall blocking WebSocket

### Database Issues

**Problem**: Can't connect to MongoDB
- Verify connection string is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

---

## 📝 Environment Variables Summary

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-128-char-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PORT=5000
FRONTEND_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.railway.app/api
VITE_SOCKET_URL=https://your-backend-url.railway.app
```

---

## 🔐 Security Checklist

- ✅ JWT secret is strong (128+ characters)
- ✅ MongoDB connection uses SSL
- ✅ Cloudinary credentials are secure
- ✅ CORS is configured correctly
- ✅ Environment variables are not committed to Git
- ✅ All API endpoints are protected with JWT
- ✅ Friend request system prevents unauthorized chats
- ✅ Socket.IO validates user authorization

---

## 🚀 Quick Deploy Commands

### Generate JWT Secret
```bash
cd connect-converse/server
npm run generate-secret
```

### Test Locally Before Deploy
```bash
# Terminal 1 - Backend
cd connect-converse/server
npm install
npm start

# Terminal 2 - Frontend
cd connect-converse
npm install
npm run dev
```

---

## 📞 Support

If you encounter issues:
1. Check the logs in Railway/Render dashboard
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB Atlas is accessible

---

## 🎉 Success!

Your Connect Converse app should now be live and accessible worldwide!

**Frontend**: https://your-app.vercel.app
**Backend**: https://your-app.railway.app
