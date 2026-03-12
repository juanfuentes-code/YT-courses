# Screenshots Guide

This document explains how to add actual screenshots to the README.

## File Locations

Screenshots should be placed in the `docs/screenshots/` directory:

```
docs/
└── screenshots/
    ├── 01-login.png           # Login page with Google OAuth button
    ├── 02-dashboard.png       # Dashboard with course grid
    ├── 03-course-detail.png   # Course detail in normal mode
    ├── 04-theater-mode.png    # Course detail in dark theater mode
    ├── 05-notes-feature.png   # Notes with timestamp chips
    └── 06-statistics.png      # Statistics/breakdown page
```

## How to Capture Screenshots

### 1. Login Page (`01-login.png`)
- Navigate to `http://localhost:3000`
- Take a screenshot of the entire login page
- Should show:
  - TubeCourse logo
  - "Master your skills via YouTube" tagline
  - "Welcome Back" heading
  - "Sign in with Google" button
  - Footer with Terms & Privacy links

### 2. Dashboard (`02-dashboard.png`)
- Log in with your Google account
- You'll be redirected to `/dashboard`
- Take a screenshot showing:
  - Top header with "Theater Mode" and profile buttons
  - Quick stats widget (Total Courses, Total Videos, Overall Progress)
  - Course grid with at least 2-3 course cards
  - Each card showing: thumbnail, title, progress bar, video count
  - Optional: "Continue Watching" section if you have watched videos

### 3. Course Detail - Normal Mode (`03-course-detail.png`)
- Click on any course card from the dashboard
- You'll see the course detail page
- Scroll so both the video player and sidebar are visible
- Take a screenshot showing:
  - Video player (left side, embedded YouTube)
  - Course sidebar (right side) with lesson list
  - Lesson 3-4 should be visible with progress indicators
  - Stats grid below the video (Total Videos, Completed %, Watched count)
  - Notes section below stats (may be collapsed)

### 4. Theater Mode (`04-theater-mode.png`)
- From the course detail page, click "Theater Mode" button
- The page will switch to dark theme (#211811 background)
- Take a screenshot showing:
  - Dark immersive header
  - Full-width video player in the center
  - Lesson sidebar on the left (if desktop)
  - "Normal view" button in header (to exit theater mode)
  - Notes panel visible below the video
  - Orange accent colors (#e77e23) on buttons and icons

### 5. Notes Feature (`05-notes-feature.png`)
- From theater mode or normal course detail, scroll to the Notes section
- Take a screenshot showing:
  - Empty notes textarea with "Timestamp" button
  - Sample note(s) if you've already created any
  - If you have notes, show:
    - Timestamp chip `[⏱ MM:SS]` in orange
    - Note text content
    - Edit and Delete buttons (visible on hover)
  - Multiple notes if possible (one with timestamp, one without)

**Optional:** Take an animated GIF showing:
1. Click "Timestamp" button while video plays
2. Type a note
3. Press ⌘Enter to save
4. Note appears with timestamp chip
5. Click the chip to see video seek to that moment

### 6. Statistics Page (`06-statistics.png`)
- Click "Statistics" in the sidebar (visible from dashboard or `/dashboard/stats`)
- Take a screenshot showing:
  - "Overall Progress" section at the top
  - Per-course breakdown with:
    - Course titles
    - Progress bars showing completion percentage
    - "X/Y videos watched" text
  - Multiple courses visible (3 is ideal)

## Screenshot Tips

### Best Practices
- **Resolution:** 1280x800 minimum (desktop), 375x812 for mobile
- **Zoom:** Set browser zoom to 100% (no zoom in/out)
- **Dark mode:** Use system light mode (not dark) unless capturing theater mode
- **Content:** Include meaningful data
  - Use the seeded test data (3 courses, 14 total videos)
  - Have some videos marked as watched, some not
  - Show progress bars with realistic percentages
- **Consistency:** All screenshots should have same browser zoom and resolution

### What to Avoid
- ❌ Private/sensitive information (email addresses, API keys, etc.)
- ❌ Browser devtools visible
- ❌ Error messages (unless demonstrating error handling)
- ❌ Network throttling or slow loading states
- ❌ Unnecessary UI elements (browser tabs, address bar)

## Image Format

- **Format:** PNG (lossless, crisp UI)
- **File size:** Keep under 500KB per image (compress if needed)
- **Dimensions:**
  - Desktop: 1280x800 recommended
  - Mobile: 375x812 recommended

### Compressing PNGs

If files are too large:
```bash
# Using ImageMagick
convert 01-login.png -quality 85 01-login.png

# Using pngquant (recommended for web)
pngquant --speed 1 --quality 75-90 01-login.png --force
```

## Workflow

1. **Prepare test data**
   ```bash
   npm run db:seed  # Populates with sample courses/videos
   ```

2. **Start dev server**
   ```bash
   npm run dev
   ```

3. **Log in** with your Google account

4. **Navigate** to each page and capture screenshots

5. **Save** to `docs/screenshots/` with names: `01-login.png`, `02-dashboard.png`, etc.

6. **Commit** to git:
   ```bash
   git add docs/screenshots/
   git commit -m "Add README screenshots"
   ```

## Markdown Syntax in README

Screenshots are embedded in README.md like this:

```markdown
### 1. Login Page
Description of the page...

**Add screenshot here:** `./docs/screenshots/01-login.png`

![Login Screenshot](./docs/screenshots/01-login.png)
```

Once you add the actual image files, the `![Login Screenshot](...)` line will display the image.

## Questions?

If you need help capturing or editing screenshots, feel free to reach out!
