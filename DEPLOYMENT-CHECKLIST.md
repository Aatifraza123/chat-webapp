# 📋 Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## ✅ Pre-Deployment Checklist

### 1. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account
- [ ] Create a new cluster
- [ ] Create database user with password
- [ ] Whitelist all IPs (0.0.0.0/0)
- [ ] Get connection string
- [ ] Test connection locally

### 2. Cloudinary Setup
- [ ] Create Cloudinary account
- [ ] Get Cloud Name from dashboard
- [ ] Get API Key from dashboard
- [ ] Get API Secret from dashboard
- [ ] Test upload locally

### 3. Generate JWT Secret
- [ ] Run: `cd server && npm run generate-secret`
- [ ] Copy the generated 128-character secret
- [ ] Save it securely (you'll need it for deployment)

### 4. Test Locally
- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] Can register new user
- [ ] Can login
- [ ] Can send messages
- [ ] Can upload images
- [ ] Can make voice/video calls
- [ ] Friend requests work

## 🚀 Backend Deployment (Railway)

### Railway Setup
- [ ] Go to https://railway.app/
- [ ] Sign up/Login with GitHub
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose your repository
- [ ] Set root directory: `connect-converse/server`

### Environment Variables
Add these in Railway dashboard:

- [ ] `MONGODB_URI` = Your MongoDB Atlas connection string
- [ ] `JWT_SECRET` = Your generated 128-char secret
- [ ] `CLOUDINARY_CLOUD_NAME` = Your Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` = Your Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` = Your Cloudinary API secret
- [ ] `PORT` = 5000
- [ ] `FRONTEND_URL` = (Leave empty for now, will update after Vercel)
- [ ] `NODE_ENV` = production

### Deploy
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Copy your Railway URL (e.g., `https://your-app.railway.app`)
- [ ] Test backend: Visit `https://your-app.railway.app/api/auth/me`

## 🌐 Frontend Deployment (Vercel)

### Vercel Setup
- [ ] Go to https://vercel.com/
- [ ] Sign up/Login with GitHub
- [ ] Click "New Project"
- [ ] Import your GitHub repository
- [ ] Set root directory: `connect-converse`
- [ ] Framework Preset: Vite

### Environment Variables
Add these in Vercel dashboard:

- [ ] `VITE_API_URL` = `https://your-railway-url.railway.app/api`
- [ ] `VITE_SOCKET_URL` = `https://your-railway-url.railway.app`

### Deploy
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

## 🔄 Update Backend CORS

### Update Railway Environment
- [ ] Go back to Railway dashboard
- [ ] Update `FRONTEND_URL` = Your Vercel URL
- [ ] Railway will auto-redeploy
- [ ] Wait for redeployment

## ✅ Post-Deployment Testing

### Test All Features
- [ ] Visit your Vercel URL
- [ ] Register a new account
- [ ] Login works
- [ ] Can search users by username
- [ ] Can send friend request
- [ ] Can accept friend request
- [ ] Can send text messages
- [ ] Can upload and send images
- [ ] Can upload and send videos
- [ ] Can upload and send documents
- [ ] Can download files
- [ ] Can open files in new tab
- [ ] Typing indicators work
- [ ] Read receipts work (✓, ✓✓, ✓✓ blue)
- [ ] Online/offline status works
- [ ] Can change theme
- [ ] Can set chat wallpaper
- [ ] Can update profile picture
- [ ] Can update bio
- [ ] Can make voice call
- [ ] Can make video call
- [ ] Call controls work (mute, video toggle)
- [ ] Mobile responsive works

### Test on Multiple Devices
- [ ] Desktop browser
- [ ] Mobile browser
- [ ] Tablet browser
- [ ] Different browsers (Chrome, Firefox, Safari, Edge)

## 🔒 Security Verification

- [ ] Email addresses are NOT visible in UI
- [ ] Can only search by username
- [ ] Cannot chat without friend approval
- [ ] JWT tokens are secure
- [ ] CORS is properly configured
- [ ] Environment variables are not exposed
- [ ] HTTPS is enabled (automatic on Vercel/Railway)

## 📊 Monitoring

### Railway Monitoring
- [ ] Check deployment logs for errors
- [ ] Monitor resource usage
- [ ] Set up alerts (optional)

### Vercel Monitoring
- [ ] Check deployment logs
- [ ] Monitor build times
- [ ] Check analytics (optional)

## 🎉 Launch

- [ ] Share your app URL with users
- [ ] Create demo accounts for testing
- [ ] Monitor for any issues
- [ ] Collect user feedback

## 📝 URLs to Save

Write down your deployment URLs:

```
Frontend URL: https://_____________________.vercel.app
Backend URL:  https://_____________________.railway.app
MongoDB:      mongodb+srv://___________________
Cloudinary:   https://cloudinary.com/console
```

## 🆘 Troubleshooting

If something doesn't work:

1. **Check Railway Logs**
   - Go to Railway dashboard
   - Click on your project
   - View logs for errors

2. **Check Vercel Logs**
   - Go to Vercel dashboard
   - Click on your project
   - View deployment logs

3. **Check Browser Console**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

4. **Common Issues**
   - CORS errors → Check FRONTEND_URL in Railway
   - Socket.IO not connecting → Check VITE_SOCKET_URL
   - API calls failing → Check VITE_API_URL
   - Database errors → Check MongoDB connection string
   - Upload errors → Check Cloudinary credentials

## 🔄 Redeployment

To deploy updates:

1. Make changes locally
2. Test locally
3. Commit and push to GitHub
4. Vercel and Railway will auto-deploy
5. Monitor deployment logs

---

## ✅ Deployment Complete!

Once all checkboxes are checked, your app is live! 🎉

**Next Steps:**
- Share with friends
- Gather feedback
- Plan new features
- Monitor performance
- Scale as needed

---

Need help? Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.
