# CoachFlow AI - Complete Setup Guide

This guide takes you from zero to live SaaS in 15 minutes.

## What You're Building

A multi-coach, multi-client fitness analysis platform with:
- Google login (OAuth)
- Coach dashboard to manage 10-15 clients each
- Client detail pages with analysis history
- Feedback tracking (accurate/needs work + notes)
- Mock AI logic (ready to swap for real API later)
- Real-time data sync via Firebase

## Cost Breakdown

- Vercel hosting: **Free** (unlimited coaches)
- Firebase: **$0–20/month** depending on traffic
- Domain name: Optional, ~$12/year
- **Total to launch: $0**

---

## Step 1: Create Firebase Project (3 minutes)

### 1.1 Create Project

1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Name it: `coachflow-ai`
4. Accept terms, click "Continue"
5. Disable Google Analytics (not needed), click "Create project"
6. Wait for it to build (30 seconds)

### 1.2 Enable Google Authentication

1. In left sidebar, click "Authentication"
2. Click "Get Started"
3. Find "Google" in the list, click it
4. Click "Enable"
5. Set Project Support Email (can be your Gmail)
6. Click "Save"

### 1.3 Create Firestore Database

1. In left sidebar, click "Firestore Database"
2. Click "Create Database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select region closest to you (us-central1 is fine)
5. Click "Create"

### 1.4 Get Your Firebase Config

1. Click the gear icon (⚙️) in top left
2. Click "Project Settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Name it: `coachflow-dashboard`
6. Check "Also set up Firebase Hosting" (optional, we'll use Vercel)
7. Click "Register app"
8. You'll see a config like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "coachflow-ai.firebaseapp.com",
  projectId: "coachflow-ai",
  storageBucket: "coachflow-ai.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123...:web:abc..."
};
```

**Copy these 6 values. You need them in Step 3.**

### 1.5 Set Firestore Security Rules

In Firestore, go to "Rules" tab and replace with:

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Coaches can only see their own clients and analyses
    match /clients/{document=**} {
      allow create, read, update, delete: if request.auth.uid == resource.data.coachId || request.auth.uid == request.resource.data.coachId;
    }
    match /analyses/{document=**} {
      allow create, read, update, delete: if request.auth.uid == resource.data.coachId || request.auth.uid == request.resource.data.coachId;
    }
  }
}
```

Click "Publish".

---

## Step 2: Set Up Project Locally (2 minutes)

### 2.1 Install Node.js

If you don't have Node.js, download from https://nodejs.org (get LTS version).

Open terminal/command prompt and verify:

```bash
node --version
npm --version
```

### 2.2 Create React App

```bash
npx create-react-app coachflow-dashboard
cd coachflow-dashboard
```

### 2.3 Install Firebase

```bash
npm install firebase
```

### 2.4 Add the Code

1. Open `src/App.jsx` (or create it)
2. Replace everything with the code from `coachflow-dashboard.jsx`

### 2.5 Create .env File

In the root of your project (next to package.json), create a file called `.env`:

```
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=coachflow-ai.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=coachflow-ai
REACT_APP_FIREBASE_STORAGE_BUCKET=coachflow-ai.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123...
REACT_APP_FIREBASE_APP_ID=1:123...:web:abc...
```

Use the values you copied in Step 1.4.

### 2.6 Test Locally

```bash
npm start
```

Your browser should open http://localhost:3000. You should see the "CoachFlow AI" login screen.

Try logging in with your Google account. If it works, you're ready for Step 3.

---

## Step 3: Deploy to Vercel (5 minutes)

### 3.1 Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub" (easiest)
4. Authorize Vercel

### 3.2 Push Code to GitHub

1. Create a GitHub account if you don't have one: https://github.com
2. Create a new repository called `coachflow-dashboard`
3. In terminal, in your project folder:

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/coachflow-dashboard.git
git push -u origin main
```

(Replace YOUR_USERNAME with your actual GitHub username)

### 3.3 Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select "coachflow-dashboard"
4. Click "Import"
5. Under "Environment Variables," add all 6 Firebase values:

   - `REACT_APP_FIREBASE_API_KEY` = `AIzaSy...`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN` = `coachflow-ai.firebaseapp.com`
   - etc.

6. Click "Deploy"
7. Wait 2–3 minutes
8. You'll get a URL like `coachflow-dashboard-abc123.vercel.app`

### 3.4 Configure Firebase Google OAuth

Google login won't work until you add your Vercel domain to Firebase:

1. Go back to Firebase Console
2. Click "Authentication" → "Settings" tab
3. Under "Authorized Domains," click "Add Domain"
4. Add your Vercel URL: `coachflow-dashboard-abc123.vercel.app`
5. Also add `localhost:3000` for local testing
6. Click "Save"

### 3.5 Test Live

Go to your Vercel URL and try logging in with Google. If it works, you're live.

---

## Step 4: Invite Your First Coaches (2 minutes)

1. Send them the link: `https://coachflow-dashboard-abc123.vercel.app`
2. They sign in with Google
3. They click "Add Client"
4. They fill in client name, age, goal
5. They click client card to go to detail page
6. They click "New Analysis" and fill in weekly data
7. Output cards appear with:
   - Calorie recommendation
   - Hidden bottleneck analysis
   - 30-second coach script
8. They can click "Add Feedback" to mark outputs as accurate or needs work

---

## Step 5: Iterate Based on Feedback

### What to Ask Your Coaches

After they use it for 1–2 weeks:

1. **"Which inputs did you find most useful?"** (Keep those, drop the rest)
2. **"What data are we missing?"** (Water? Steps? Appetite? Energy?)
3. **"Did the bottleneck diagnosis surprise you?"** (Means the mock logic is working)
4. **"Would you pay $29/month for this?"** (If yes, you have product-market fit)

### What to Track

In Firebase Console → Firestore, you can see:

- How many coaches signed up
- How many clients created
- How many analyses run
- What feedback they're marking as inaccurate

Use this to refine the mock logic.

---

## Step 6: Next: Scale (Optional)

Once coaches confirm it's useful:

### Option A: Charge Money (Keep Mock Logic)

- Add Stripe: https://stripe.com
- Gate the tool behind a paywall
- Aim for 86 coaches × $29/month = $2,500/month

### Option B: Upgrade to Real AI (Add Backend)

- Integrate OpenAI or Anthropic API
- Costs ~$0.01–0.05 per analysis
- Keep the coaching logic, but generate outputs with real LLM
- Deploy backend on Render or Railway (~$7/month)

### Option C: Hybrid (Recommended)

- Keep mock logic for free tier
- Real AI for paid tier
- Coaches see which tier they're on and can upgrade

---

## Troubleshooting

### "Google login not working"

→ Did you add your Vercel domain to Firebase Authorized Domains?

### "Error: Firebase not initialized"

→ Check your .env file has all 6 variables and they're spelled correctly (REACT_APP_ prefix required)

### "Firestore returns empty"

→ Check Firestore security rules. You pasted them in Step 1.5, right?

### "localhost:3000 shows blank page"

→ Run `npm start` again. Check console for errors (F12 in browser).

---

## File Structure (What You Have)

```
coachflow-dashboard/
├── public/
├── src/
│   ├── App.jsx (← your main component)
│   └── index.js
├── .env (← your Firebase config)
├── package.json
└── package-lock.json
```

---

## Firebase Data Structure (What Gets Stored)

```
Firestore Collections:

/clients
  ├── coachId (who owns this client)
  ├── name
  ├── age
  ├── goal
  ├── createdAt
  └── notes

/analyses
  ├── clientId (which client)
  ├── coachId (which coach)
  ├── inputs { dailyCalories, weightChange, sleep, stress, adherence, comments }
  ├── calorieRecommendation
  ├── macros { protein, carbs, fat }
  ├── bottleneckAnalysis
  ├── priorityAction
  ├── coachScript
  ├── createdAt
  └── feedback { accurate: true/false, notes: "..." }
```

---

## What's Next

After coaches use it for 1–2 weeks and give feedback:

1. Update the mock logic based on their corrections
2. Add missing inputs (water intake, steps, energy levels, etc.)
3. Refine the bottleneck diagnosis
4. Consider charging money OR integrate real AI

---

## Support / Questions

If you get stuck:

- Firebase docs: https://firebase.google.com/docs/firestore
- Vercel docs: https://vercel.com/docs
- React docs: https://react.dev
- This code uses React Hooks (useState, useEffect, etc.)

---

**You're now live.** Coaches can sign up, add clients, run analyses, and give feedback. Everything syncs in real-time.

Good luck.
