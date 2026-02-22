# 🌸 LotUs

**LotUs** is a full-stack event management and team-matching platform built for students and organizers. Participants can discover events, register, and find complementary teammates. Organizers can create events, manage registrations, and surface hidden talent.

---

## ✨ Features

- **Role-based access** — Participant, Organizer, and Super Admin roles with distinct dashboards
- **Event management** — Create, manage, and track events with capacity, deadlines, and payment links
- **LotUs Match** — Complementary skill-matching algorithm that pairs participants based on domain diversity, not overlap
- **Hidden Gems** — Surfaces underutilized participants who are strong but haven't been invited to teams
- **Real-time notifications** — Admins get notified when participants register for their events
- **Team system** — Invite participants, accept/decline team requests, manage connections
- **Announcements** — Broadcast updates to all users
- **Profile system** — Skills, interests, bio, photo, phone, gender — different fields for participants vs organizers

---

## 🛠 Tech Stack

- **Frontend** — React + TypeScript + Vite
- **Styling** — Tailwind CSS
- **Auth & Database** — Firebase (Authentication + Firestore)
- **Animations** — Framer Motion
- **Icons** — Lucide React

---

## 🚀 Run Locally

**Prerequisites:** Node.js, a Firebase project

1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/lotus-app.git
   cd lotus-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase — create a `.env.local` file in the root:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

---

## 📦 Deploy to Vercel

1. Push to GitHub (private repo):
   ```bash
   git init
   git remote add origin https://github.com/your-username/lotus-app.git
   git add .
   git commit -m "initial commit"
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo

3. Set environment variables in Vercel dashboard (same keys as `.env.local`)

4. Click **Deploy** — Vercel auto-detects Vite ✅

---

## 🔒 Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /teams/{teamId} {
      allow read, write: if request.auth != null;
    }
    match /notifications/{notifId} {
      allow read, write: if request.auth != null;
    }
    match /announcements/{announcementId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📁 Project Structure

```
src/
├── components/       # UI components, Layout, NotificationBell
├── context/          # AuthContext
├── pages/            # All route pages
├── services/         # Firebase services (auth, events, notifications, match)
├── types/            # TypeScript types and enums
└── firebase.ts       # Firebase config
```

---

Built with 🌸 by the LotUs team.