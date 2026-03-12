# TubeCourse 🎓

> A modern YouTube-based learning tracker that helps you organize, track, and annotate your favorite educational content.

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-5.0%20beta-purple?style=flat-square)](https://next-auth.js.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003b57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)

## Overview

**TubeCourse** transforms your YouTube learning experience into a structured, trackable journey. Whether you're following Stanford's Machine Learning course or a Python tutorial, TubeCourse lets you:

- 📚 **Import and organize** YouTube playlists
- ✅ **Track progress** for each course with detailed per-video completion status
- 📝 **Take timestamped notes** with one-click navigation back to the moment
- 🎬 **Enjoy immersive viewing** with a theater mode for distraction-free learning
- 🔐 **Stay secure** with Google OAuth authentication
- 💾 **Persist everything** in a local SQLite database

---

## Screenshots & UI Tour 📸

### 1. Login Page
Clean, minimalist login with Google OAuth. One-click sign-in creates your account automatically.

**Add screenshot here:** `./docs/screenshots/01-login.png`

**Key Features:**
- Google OAuth integration
- Auto-account creation
- Responsive design

---

### 2. Dashboard
Grid layout showing all your imported courses with progress tracking and course management.

**Add screenshot here:** `./docs/screenshots/02-dashboard.png`

**Key Features:**
- Course grid with beautiful cards
- "Import Course" button to add playlists
- "Continue Watching" section
- Overall progress statistics
- Delete courses to clean up

---

### 3. Course Detail - Normal Mode
Split layout with video player on left, sidebar with lessons on right. Perfect for learning with context.

**Add screenshot here:** `./docs/screenshots/03-course-detail.png`

**Key Features:**
- Embedded YouTube player (16:9 aspect)
- Lesson sidebar with progress indicators
- Per-video watched status and timestamps
- Next/Previous lesson navigation
- Quick stats (total, watched, completion %)
- Notes panel below

---

### 4. Course Detail - Theater Mode
Full-width video with dark immersive theme (#211811). Minimal distractions, maximum focus.

**Add screenshot here:** `./docs/screenshots/04-theater-mode.png`

**Key Features:**
- Dark immersive theme
- Full-width video player
- Accessible lesson sidebar (left, hidden on mobile)
- Notes panel always visible below
- Toggle back to normal view anytime

---

### 5. Video Notes with Timestamps
Capture video timestamps and create linked notes. Click timestamps to jump to that moment.

**Add screenshot here:** `./docs/screenshots/05-notes-feature.png`

**Workflow:**
1. Click **"Timestamp"** while video plays → captures current time (e.g., `3:45`)
2. Write your note in the textarea
3. Press **⌘Enter** (Mac) or **Ctrl+Enter** (Windows) to save
4. Note appears with an orange **[⏱ 3:45]** chip
5. Click the chip anytime to **seek the video to that exact moment**
6. Edit or delete notes inline

---

### 6. Statistics Page
Detailed per-course breakdown with progress visualization and insights.

**Add screenshot here:** `./docs/screenshots/06-statistics.png`

**Key Features:**
- Overall progress across all courses
- Per-course breakdown with progress bars
- Watched/total video counts
- Completion percentages

---

## Features ✨

### 🔐 Authentication
- **Google OAuth** login (via NextAuth.js v5 beta)
- Auto-creates your account on first login
- Secure JWT sessions

### 🎯 Course Management
- **Import courses** by pasting YouTube playlist URLs
- **Fetch metadata** automatically via YouTube Data API v3
  - Playlist title, description, channel name, thumbnails
  - Video titles, durations, and metadata for each lesson
- **Manual course import** with custom details
- **Delete courses** and remove tracking data

### 📊 Progress Tracking
- **Per-video tracking**: Mark lessons as watched/unwatched
- **Dashboard statistics**: Overall progress % and watched/total counts
- **Per-course breakdown**: View detailed completion stats for each course
- **Continue watching**: Resume from your last video

### 📝 Video Notes with Timestamps
- **Capture timestamps**: Click "Timestamp" button while video is playing
- **Timestamped notes**: Link notes to specific moments in videos
- **Seek by timestamp**: Click any timestamp chip to jump to that moment
- **General notes**: Add course notes without timestamps
- **Edit & delete**: Manage your notes inline
- **Persist forever**: Notes are saved per video and reloaded on revisit

### 🎬 Video Player
- **Embedded YouTube IFrame API** with custom controls
- **Handles embedding restrictions** gracefully (fallback to YouTube link)
- **Queue-safe script loading** (prevents duplicate API injections)
- **Forward refs** expose `getCurrentTime()` and `seekTo()` to notes feature

### 🌙 Theater Mode
- **Dark immersive theme** (#211811 background)
- **Full-width video** with lesson sidebar
- **Optimized for focus** — minimal distractions
- **Notes panel** below the video for easy referencing
- **Toggle anytime** between normal and theater modes

### 🎨 Responsive Design
- **Mobile, tablet, and desktop** layouts
- **Tailwind CSS v4** with custom theming
- **Light and dark variants** for notes and UI
- **Smooth transitions** and interactive feedback

---

## Architecture 🏗️

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Auth** | NextAuth.js v5 beta, Google OAuth, JWT sessions |
| **Database** | Prisma v5 ORM, SQLite (dev), any Prisma-supported DB (prod) |
| **Styling** | Tailwind CSS v4, Material Symbols Icons |
| **External APIs** | YouTube Data API v3, YouTube IFrame Player API |

### Database Schema

```
User
  ├── accounts (NextAuth)
  ├── sessions (NextAuth)
  ├── courses (imported playlists)
  ├── notes (timestamped video annotations)
  └── videoProgress (per-video tracking)

Course
  ├── userId (owner)
  ├── playlistId (YouTube)
  ├── videoProgress[] (lessons in course)
  └── notes[] (course notes)

VideoProgress
  ├── courseId
  ├── videoId (YouTube)
  ├── title, thumbnail, duration
  ├── position (order in playlist)
  ├── watched (boolean)
  └── watchedAt (timestamp)

Note
  ├── userId
  ├── courseId
  ├── videoId
  ├── text (content)
  ├── timestamp (optional seconds)
  └── createdAt
```

### Key Components

#### `YouTubePlayer.tsx`
- **forwardRef** + **useImperativeHandle** pattern
- Exposes `getCurrentTime()` and `seekTo(seconds)` to parent
- Manages YouTube IFrame API with queue-based loading
- Handles embedding restrictions (error codes 101/150)
- Fallback UI for restricted videos

#### `VideoNotes.tsx`
- Timestamps captured via `getCurrentTime()`
- Notes sorted by timestamp, then creation date
- Clickable timestamp chips use `seekTo()` for navigation
- Inline edit/delete with optimistic UI updates
- Supports dark mode (theater) and light mode (normal)
- Auto-loads notes when video changes

#### `CourseDetailClient.tsx`
- Manages course state (current video, watched status, theater mode)
- Sidebar lesson list with progress visualization
- Next/Previous navigation
- Optimistic updates for watched toggle
- Integrates YouTubePlayer and VideoNotes

#### `DashboardClient.tsx`
- Grid of course cards with progress bars
- Import course modal with URL input
- "Continue Watching" section
- Quick stats (total videos, completion %)

---

## Getting Started 🚀

### Prerequisites

- **Node.js 18+** and npm
- **Google Cloud Project** (for OAuth credentials)
- **YouTube API v3 Key** (for fetching playlist metadata)

### Quick Setup

1. **Clone and install**
   ```bash
   git clone <repo>
   cd YT-courses
   npm install
   ```

2. **Create environment files**
   ```bash
   # .env (for Prisma CLI only)
   echo 'DATABASE_URL="file:./prisma/dev.db"' > .env

   # .env.local (for Next.js runtime)
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   npm run db:seed  # Optional: populate with test data
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local` with these values:

```env
# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# YouTube Data API v3 (from Google Cloud Console)
YOUTUBE_API_KEY=your_api_key_here

# NextAuth secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your_secret_here

# Database
DATABASE_URL="file:./prisma/dev.db"
```

> **📖 Detailed setup guide:** See [SETUP.md](./SETUP.md) for step-by-step Google Cloud Console instructions.

---

## Project Structure 📁

```
src/
├── app/
│   ├── page.tsx                      # Login page
│   ├── middleware.ts                 # Auth redirects (Edge Runtime)
│   ├── dashboard/
│   │   ├── page.tsx                  # Dashboard server component
│   │   ├── DashboardClient.tsx       # Dashboard interactive UI
│   │   └── stats/page.tsx            # Per-course breakdown
│   ├── course/
│   │   └── [id]/
│   │       ├── page.tsx              # Course detail server component
│   │       └── CourseDetailClient.tsx # Course interactive UI
│   └── api/
│       ├── courses/                  # Course CRUD
│       ├── progress/                 # Watch status toggle
│       └── notes/                    # Note CRUD with timestamps
├── components/
│   ├── course/
│   │   ├── YouTubePlayer.tsx         # YouTube IFrame player
│   │   └── VideoNotes.tsx            # Notes with timestamps
│   └── ui/
│       ├── CourseCard.tsx
│       ├── ImportModal.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── auth.ts                       # NextAuth full config (with Prisma)
│   ├── auth.config.ts                # Lightweight config (Edge-safe)
│   ├── db.ts                         # Prisma singleton
│   └── youtube.ts                    # YouTube API helpers
├── styles/
│   └── globals.css                   # Tailwind imports
└── middleware.ts                     # NextAuth middleware

prisma/
├── schema.prisma                     # Database schema
├── seed.ts                           # Test data seeding
└── dev.db                            # SQLite database

.env                                  # DATABASE_URL only (Prisma CLI)
.env.local                            # All secrets (Next.js runtime)
```

---

## How It Works 🔄

### 1️⃣ Login
- Click **"Sign in with Google"** on the home page
- NextAuth handles the OAuth flow with Google
- Your account is auto-created and sessions are stored

### 2️⃣ Import a Course
- Go to **Dashboard**
- Click **"Import Course"** button
- Paste a YouTube playlist URL
  ```
  https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
  ```
- Course metadata is fetched automatically via YouTube API
- Click **"Import"** — the course appears in your dashboard

### 3️⃣ Track Progress
- Click a **course card** to enter the course
- Scroll through lessons in the sidebar
- Click a lesson to load it in the player
- Video starts playing in the embedded player
- Click the **"Mark watched"** button or the lesson status icon
- Progress bar updates in real-time (optimistic UI)

### 4️⃣ Take Notes with Timestamps
- While video is playing, click **"Timestamp"** button
- The current video time (HH:MM:SS) is captured
- Type your note and press **⌘Enter** (or Ctrl+Enter)
- Note is saved with the timestamp attached
- Timestamp appears as an orange chip above the note text
- **Click the chip** to jump the video to that moment

### 5️⃣ Theater Mode
- Click **"Theater Mode"** button in the header
- Video expands to fill the width
- Sidebar moves to the left (hidden on mobile)
- Dark immersive theme activates
- Notes panel stays accessible below the video
- Toggle back anytime with **"Normal view"**

### 6️⃣ Manage Courses
- Dashboard shows all your imported courses
- Hover over a **course card** to see quick stats
- Click **"Statistics"** in the sidebar for detailed breakdowns
- Delete a course (removes all progress and notes)

---

## API Routes 🔌

All routes require authentication (NextAuth session).

### Courses
- `GET /api/courses` — List user's courses with progress %
- `POST /api/courses` — Import course by playlist URL
- `DELETE /api/courses/[id]` — Delete a course

### Progress
- `PATCH /api/progress` — Toggle watched status for a video
- `POST /api/progress` — Mark all videos in a course as watched

### Notes
- `GET /api/notes?courseId=&videoId=` — Fetch notes for a video
- `POST /api/notes` — Create a note (with optional timestamp)
- `PATCH /api/notes/[id]` — Edit note text
- `DELETE /api/notes/[id]` — Delete a note

---

## Keyboard Shortcuts ⌨️

| Shortcut | Action |
|----------|--------|
| `⌘Enter` / `Ctrl+Enter` | Save note in textarea |
| `Escape` | Cancel note edit |
| Click timestamp chip | Seek video to that moment |
| Click lesson in sidebar | Load lesson in player |

---

## Known Limitations ⚠️

- **YouTube embedding restrictions**: Some creators (Stanford Online, etc.) disable video embedding. TubeCourse shows a fallback "Watch on YouTube" button.
- **Offline support**: Requires internet connection (videos are streamed from YouTube)
- **Database**: SQLite for development; migrate to PostgreSQL/MySQL for production
- **YouTube Courses**: The "Courses" tab in youtube.com/feed/courses is not directly accessible via the YouTube API — manual URL paste required

---

## Troubleshooting 🔧

### "Video unavailable" in player
The channel has restricted embedding. Click "Watch on YouTube" to open it directly.

### Notes not saving
Check browser console for API errors. Ensure you're authenticated and the note text is not empty.

### Course import fails
Verify the playlist URL is public and the YouTube API key has quota remaining.

### Prisma errors on `db push`
Ensure `.env` exists in the project root with `DATABASE_URL="file:./prisma/dev.db"`.

---

## Development 👨‍💻

### Build and Production

```bash
# Type check
npx tsc --noEmit

# Build for production
npm run build

# Start production server
npm start
```

### Database Management

```bash
# View database in GUI
npm run db:studio

# Push schema changes
npm run db:push

# Generate Prisma client
npx prisma generate

# Seed test data
npm run db:seed
```

---

## Architecture Decisions 🎓

### Why Split NextAuth Config?
The middleware runs in Edge Runtime (can't use Prisma). We split:
- **`auth.config.ts`**: Lightweight, Edge-safe, used in middleware
- **`auth.ts`**: Full config with PrismaAdapter + JWT sessions for server actions

### Why JWT Sessions?
NextAuth can verify sessions from the JWT cookie in Edge Runtime without hitting the database. This allows the middleware to protect routes without Prisma.

### Why YouTube IFrame API?
Direct embeds are simpler but don't handle restrictions. The IFrame API exposes error events, allowing graceful fallbacks.

### Why forwardRef in YouTubePlayer?
Video notes need to call `getCurrentTime()` and `seekTo()` on the player. useImperativeHandle exposes these methods without prop drilling.

---

## Contributing 🤝

Contributions are welcome! Please feel free to submit issues and pull requests.

---

## License 📄

MIT License — see [LICENSE](./LICENSE) for details.

---

## Credits

- **Design inspiration**: Google Stitch mockups
- **Auth**: NextAuth.js team
- **APIs**: Google Cloud (YouTube Data API, OAuth)
- **Styling**: Tailwind CSS team
- **ORM**: Prisma team

---

## Questions or Feedback? 💬

Feel free to open an issue or reach out. Happy learning! 🎓
