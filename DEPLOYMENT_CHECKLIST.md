# CoachFlow AI - Deployment Checklist

You have everything you need locally. Here's what to upload to GitHub:

## Files to Upload

From your `C:\Users\Coolbet\coachflow-dashboard` folder, upload these to GitHub:

```
coachflow-dashboard/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.js (← your main app file)
│   ├── index.js
│   ├── index.css
│   └── App.css
├── .env (← your Firebase config)
├── package.json
├── package-lock.json
└── .gitignore
```

## Fastest Deployment Path (No Git)

**Option 1: Use Vercel CLI (Easiest)**

In PowerShell:

```powershell
npm install -g vercel
cd C:\Users\Coolbet\coachflow-dashboard
vercel
```

Follow the prompts. Vercel will deploy your app instantly.

---

**Option 2: Manual GitHub Upload**

1. Go to https://github.com and log in
2. Click **+** (top right) → **New repository**
3. Name: `coachflow-dashboard`
4. Click **Create repository**
5. Click **Add file** → **Upload files**
6. Drag your entire `coachflow-dashboard` folder
7. Commit

Then go to https://vercel.com/new and import the GitHub repo.

---

**Option 3: Install Git (then use git commands)**

Download from https://git-scm.com/download/win and install.

Then in PowerShell:

```powershell
cd C:\Users\Coolbet\coachflow-dashboard
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/coachflow-dashboard.git
git push -u origin main
```

---

## What You Need Ready

- GitHub account (free): https://github.com
- Vercel account (free): https://vercel.com
- Your 6 Firebase environment variables (already in your `.env` file)

## After Deployment

1. Vercel gives you a live URL like: `coachflow-dashboard-abc123.vercel.app`
2. Go to Firebase Console
3. Add that URL to **Authorized Domains** in Authentication Settings
4. Share the URL with your 5 coaches
5. They sign in with Google and can start using it

## Expected Deploy Time

- **Option 1 (Vercel CLI):** 3 minutes
- **Option 2 (GitHub + Vercel):** 5 minutes
- **Option 3 (Git CLI):** 10 minutes (if Git installs)

I recommend **Option 1** — it's the fastest.

---

## Your Current App Status

✅ React app built and working
✅ Firebase configured
✅ Google Auth integrated
✅ Firestore ready
✅ All code in `src/App.js`
✅ `.env` file with Firebase keys

You're ready to deploy. Pick one option above and let me know which one you choose.
