# Pulse — Partner Fitness Tracker

A modern, mobile-first workout tracking application built for workout partners (**Krish** & **Theju**), featuring liquid glass aesthetics, side-by-side superset tracking, exercise form guides, and live program customization.

---

## 🏛️ Architecture: Cloudflare Full-Stack

Pulse is built as a **single, unified full-stack application on Cloudflare**:
- **Frontend**: Vite + React 19 + TypeScript + Motion + Tailwind CSS.
- **Backend APIs**: **Cloudflare Pages Functions** located in [`functions/api/`](functions/api/), executing at the edge.
- **Database**: **Cloudflare D1** (serverless SQLite at the edge) queried with **Drizzle ORM**.
- **No standalone backend**: Frontend, edge API functions, and SQLite database are deployed and managed together.

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Platform                      │
├──────────────────────────────┬──────────────────────────────┤
│ Frontend (Cloudflare Pages)  │ Backend & Storage            │
│ • Vite React 19 SPA (src/)   │ • Pages Functions (/api/*)   │
│ • Liquid Glass Design System │ • Cloudflare D1 (SQLite)     │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 🚀 Quick Start: Running Locally

Local development uses **Wrangler** (Cloudflare's CLI). Wrangler runs Miniflare, which automatically creates and manages a **local SQLite database** under `.wrangler/state/` to mirror production Cloudflare D1.

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Local SQLite D1 Database
Apply the database migrations to create the local SQLite database tables:
```bash
npm run db:migrate:local
```
> **Note**: This creates a local SQLite database in `.wrangler/state/v3/d1/` with the tables: `profiles`, `workout_splits`, `exercises`, `set_logs`, and `user_streaks`.

### 3. Start the Full-Stack Local Environment
Builds the bundle and runs the local Cloudflare Pages server with local D1 SQLite binding:
```bash
npm run pages:dev
```
Open [http://localhost:8788](http://localhost:8788) in your browser. All `/api/*` routes are executed by Cloudflare Pages Functions and read/write to your local D1 SQLite database.

---

### Alternative: Pure Frontend Offline Mode
If you want to run only the Vite client with browser `localStorage` fallback (without Wrangler):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). If D1 is not running, the application gracefully stores logs in local storage.

---

## 🛠️ Database Management (Drizzle ORM & D1)

| Command | Description |
|---|---|
| `npm run db:migrate:local` | Applies SQL migrations to the **local SQLite D1** database. |
| `npm run db:migrate:remote` | Applies SQL migrations to the **production Cloudflare D1** database. |
| `npm run db:studio` | Launches Drizzle Studio in browser for visual database exploration. |
| `npm run db:generate` | Generates new SQL migration files from [`src/db/schema.ts`](src/db/schema.ts). |

---

## ☁️ Deploying to Cloudflare Pages & D1

### Step 1: Create Remote D1 Database
```bash
npx wrangler d1 create fitness-db
```
Wrangler will output a `database_id`. Copy it.

### Step 2: Configure `wrangler.toml`
Open [`wrangler.toml`](wrangler.toml) and update `database_id`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "fitness-db"
database_id = "<YOUR_D1_DATABASE_ID>"
migrations_dir = "migrations"
```

### Step 3: Run Remote Migrations
```bash
npm run db:migrate:remote
```

### Step 4: Deploy to Cloudflare Pages
1. Push your code to your GitHub repository.
2. In the **Cloudflare Dashboard**, navigate to **Workers & Pages** &rarr; **Create application** &rarr; **Pages** &rarr; **Connect to Git**.
3. Select your repository and configure the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Once created, go to **Settings** &rarr; **Functions** &rarr; **D1 database bindings**:
   - **Variable name**: `DB`
   - **D1 database**: Select `fitness-db`
5. Trigger a deployment. Your full-stack app is now live!

---

## 📱 Features

- **Side-by-Side Pair View**: View and log both partners' exercises (Krish in Azure `#0284C7`, Theju in Rose `#E11D48`) simultaneously with station equipment synergy indicators.
- **Form Video Technique Drawer**: Quick access to exercise technique videos and form cues.
- **Live Workout Plan Editor**: Customize sets, reps, target RPE, coach cues, and add/remove exercises across all 5 training days.
- **Synchronized Rest Timer**: Shared rest countdown with `+15s`, `-15s`, and quick skip controls.
- **Dual Offline & Edge Sync**: Seamlessly falls back to browser storage when offline, and syncs to SQLite D1 when connected.

---

## 📂 Project Structure

```
├── docs/ui/                  # Comprehensive UI architecture & design documentation
├── functions/api/            # Cloudflare Pages Functions (Serverless Edge APIs)
│   ├── exercises.ts          # Exercise listing & creation
│   ├── exercises/[id].ts     # Exercise updates & deletion
│   ├── exercises/reset.ts    # Workout plan reset to templates
│   ├── sync.ts               # Working set logs & streaks sync
│   └── db/status.ts          # D1 SQLite connectivity & health
├── migrations/               # D1 SQL migration files
├── src/
│   ├── components/mobile/    # UI views (Pair View, List View, Plan Editor, etc.)
│   ├── data/                 # Initial 5-day partner split templates
│   ├── db/schema.ts          # Drizzle ORM schema definitions for D1
│   ├── hooks/                # Custom React hooks (useRestTimer, etc.)
│   ├── services/             # Client API and fallback storage services
│   └── types/                # TypeScript models
├── public/
│   ├── favicon.svg           # Custom SVG favicon
│   └── assets/               # Brand logo & high-res covers
└── wrangler.toml             # Cloudflare Pages & D1 binding configuration
```

---

## 📖 UI Documentation & Antigravity Skills

- **[UI Architecture Overview](docs/ui/README.md)**: Mobile-first architecture, component trees, and navigation hierarchy.
- **[Porcelain & Slate Design System](docs/ui/design-system.md)**: Color tokens, partner styling (Krish Azure vs Theju Rose), liquid glass specular reflections, and safe-area guidelines.
- **[Component Catalog](docs/ui/components.md)**: Deep dive into `PairWorkoutView`, `FullWorkoutListView`, `PlanEditorView`, and navigation elements.
- **[State & Data Flow](docs/ui/state-and-data-flow.md)**: Dual offline localStorage and Cloudflare D1 edge sync, audio and haptics pipelines.
- **[Antigravity Skills](.agent/skills/)**:
  - **[`work-packages`](.agent/skills/work-packages/SKILL.md)**: Reusable, project-agnostic task decomposition, technical inference dialogues, and mandatory user verification protocol.
  - **[`ui-ux-pro-max`](.agent/skills/ui-ux-pro-max/SKILL.md)**: UI/UX design intelligence for multi-stack web and mobile apps.
  - **[`animejs-animation`](.agent/skills/animejs-animation/SKILL.md)**: Advanced JavaScript animation techniques.
  - **[`seo`](.agent/skills/seo/SKILL.md)**: Search engine optimization strategies.