# Content Broadcasting System

A backend system for managing and broadcasting educational content. Teachers upload subject-based content, principals approve it, and students access it through a public API that automatically rotates the active content based on time. Built with Node.js, Express, PostgreSQL, and Sequelize.

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js (v18+) | Runtime |
| Express.js | Web framework |
| PostgreSQL | Relational database |
| Sequelize | ORM with migrations |
| JWT (jsonwebtoken) | Authentication |
| bcrypt | Password hashing |
| Multer | File upload handling |
| express-validator | Request validation |
| express-rate-limit | Rate limiting |
| morgan | HTTP request logging |
| dotenv | Environment config |
| cors | Cross-Origin Resource Sharing |

## Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** v13 or higher
- **npm** v8 or higher

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd content-broadcasting-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and update values:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=content_broadcast
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=fba19d71514d879871f1122147d12b9a8bb462950cb42e6d9e4c1e5a93246761923b4ba1bd17c75b85ece1a0bffc1d871fd263af528e992fccd612b8c8a2e36c
JWT_EXPIRES_IN=24h
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Redis (optional — skip if no Redis instance)
REDIS_URL=redis://localhost:6379

# Cloudflare R2 (optional — leave blank to use local disk)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

### 4. Create Database

```bash
npm run db:create
```

### 5. Run Migrations

```bash
npm run db:migrate
```

### 6. Seed Database

```bash
npm run db:seed
```

### 7. Start the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The server will start at `http://localhost:3000`

---

## How to Test (Step-by-Step Flow)

You can use the provided `postman_collection.json` to easily test the entire flow. Import it into Postman and follow these steps:

1. **Login as Teacher**: Use `ravi@school.com` / `Teacher@123`. This saves the token and teacher ID.
2. **Upload Content**: Use the "Upload Content" request. It will use the saved token. You can provide an image.
3. **Login as Principal**: Use `principal@school.com` / `Admin@123`. This updates the token variable.
4. **Approve Content**: Fetch "Get Pending Content", grab the `id`, and use "Approve Content".
5. **View Live Broadcast**: Use the "Get Live Content" request. It will show the currently active content based on the rotation cycle. Try changing the duration and calling it multiple times to see it rotate!

---

## API Documentation

### Authentication

#### POST `/api/auth/register`

Register a new teacher account.

- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@school.com",
    "password": "Pass@123",
    "role": "teacher"
  }
  ```
- **Validation:**
  - `name`: required
  - `email`: required, valid email format
  - `password`: required, minimum 6 characters
  - `role`: optional (defaults to "teacher"), only "teacher" allowed for public registration
- **Success Response (201):**
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@school.com",
        "role": "teacher",
        "created_at": "2026-04-27T09:00:00.000Z"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

#### POST `/api/auth/login`

Login with credentials.

- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "principal@school.com",
    "password": "Admin@123"
  }
  ```
- **Validation:**
  - `email`: required, valid email
  - `password`: required
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "user": { "id": "uuid", "name": "Principal Admin", "email": "principal@school.com", "role": "principal" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

---

### Content Management

#### POST `/api/content/upload`

Upload new content with file.

- **Auth Required:** Yes (Bearer token)
- **Role:** Teacher only
- **Content-Type:** `multipart/form-data`
- **Fields:**

  | Field | Type | Required | Description |
  |---|---|---|---|
  | title | string | Yes | Minimum 3 characters |
  | subject | string | Yes | e.g., "maths", "science" |
  | description | string | No | Optional description |
  | start_time | ISO datetime | Yes | Visibility window start |
  | end_time | ISO datetime | Yes | Visibility window end |
  | rotation_duration | integer | No | Minutes (1-60, default 5) |
  | file | file | Yes | Image: jpg, png, gif (max 10MB) |

- **Success Response (201):**
  ```json
  {
    "success": true,
    "message": "Content uploaded successfully.",
    "data": {
      "id": "uuid",
      "title": "Algebra Basics",
      "subject": "maths",
      "file_url": "/uploads/1714200000000-image.jpg",
      "status": "pending",
      "schedule": {
        "rotation_order": 1,
        "duration": 5,
        "slot": { "id": "uuid", "subject": "maths" }
      }
    }
  }
  ```

#### GET `/api/content/my`

Get logged-in teacher's content.

- **Auth Required:** Yes
- **Role:** Teacher only
- **Query Params:** `?subject=maths&status=approved&page=1&limit=10`
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Content retrieved successfully.",
    "data": {
      "data": [...],
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
  ```

#### GET `/api/content/all`

Get all content from all teachers.

- **Auth Required:** Yes
- **Role:** Principal only
- **Query Params:** `?status=pending&subject=science&teacher_id=uuid&page=1&limit=10`

---

### Approval Workflow

#### GET `/api/approval/pending`

Get all pending content awaiting approval.

- **Auth Required:** Yes
- **Role:** Principal only
- **Query Params:** `?page=1&limit=10`

#### PATCH `/api/approval/:contentId/approve`

Approve a pending content item.

- **Auth Required:** Yes
- **Role:** Principal only
- **URL Params:** `contentId` (UUID)
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Content approved successfully.",
    "data": {
      "id": "uuid",
      "status": "approved",
      "approved_by": "principal-uuid",
      "approved_at": "2026-04-27T09:00:00.000Z"
    }
  }
  ```

#### PATCH `/api/approval/:contentId/reject`

Reject a pending content item.

- **Auth Required:** Yes
- **Role:** Principal only
- **Request Body:**
  ```json
  {
    "reason": "Content quality does not meet standards. Please re-upload with better resolution."
  }
  ```
- **Validation:** `reason` is required, minimum 10 characters

---

### Public Broadcasting (Live Content)

#### GET `/api/content/live/:teacherId`

Get currently active content for a teacher based on rotation scheduling.

- **Auth Required:** No (public endpoint)
- **Rate Limited:** 100 requests per 15 minutes per IP
- **URL Params:** `teacherId` (UUID)
- **Query Params:** `?subject=maths` (optional, filter by subject)
- **Success Response (200) — Content Available:**
  ```json
  {
    "success": true,
    "message": "Currently active content.",
    "data": {
      "maths": {
        "id": "uuid",
        "title": "Algebra Basics",
        "subject": "maths",
        "file_url": "/uploads/1714200000000-image.jpg",
        "status": "approved"
      },
      "science": {
        "id": "uuid",
        "title": "Newton's Laws",
        "subject": "science",
        "file_url": "/uploads/1714200000001-physics.png",
        "status": "approved"
      }
    }
  }
  ```
- **Response — No Content Available:**
  ```json
  {
    "success": true,
    "message": "No content available.",
    "data": null
  }
  ```

---

### Analytics (Bonus)

#### GET `/api/analytics/subjects`

Subject-wise content analytics.

- **Auth Required:** Yes
- **Role:** Principal only
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Subject analytics retrieved successfully.",
    "data": [
      {
        "subject": "maths",
        "total_content": 15,
        "approved_count": 10,
        "active_now_count": 3
      },
      {
        "subject": "science",
        "total_content": 8,
        "approved_count": 5,
        "active_now_count": 2
      }
    ]
  }
  ```

---

### Health Check

#### GET `/api/health`

- **Auth Required:** No
- **Response:** Server uptime and timestamp

---

## Seeded Test Accounts

| Role | Name | Email | Password |
|---|---|---|---|
| Principal | Principal Admin | principal@school.com | Admin@123 |
| Teacher | Ravi Kumar | ravi@school.com | Teacher@123 |
| Teacher | Priya Sharma | priya@school.com | Teacher@123 |

## File Upload Notes

- **Allowed types:** JPEG (.jpg), PNG (.png), GIF (.gif)
- **Maximum file size:** 10MB
- **Storage:** Cloudflare R2 (S3-compatible cloud) if R2 env vars are set, otherwise local `./uploads/` directory
- **Cloud access:** Files served via public R2 CDN URL configured in `R2_PUBLIC_URL`
- **Local access:** Files accessible at `http://localhost:3000/uploads/<filename>`
- **Naming:** Files are renamed to `<timestamp>-<sanitized_original_name>`
- **Auto-detection:** Server logs `📁 File storage: Cloudflare R2 (cloud)` or `📁 File storage: Local disk` on startup

## Scheduling Logic

**Simple explanation:**
Each approved content item has a duration (e.g. 5 minutes). When a student hits the live endpoint, the system checks the current time and calculates which content should be showing right now — like a TV schedule. It loops continuously without any background jobs.

**How it works step by step:**
1. Approved content for a subject is sorted by `rotation_order`
2. All durations are added together to get the total cycle length
3. `elapsed time since start` is divided by the cycle length using modulo (`%`)
4. The remainder tells us exactly which content slot is active right now
5. This repeats every request — no state is stored, no cron jobs needed

**Example:** Content A (5 min) → Content B (5 min) → Content C (5 min) = 15-min cycle.
At t=16 min → loops back to Content A.

## Edge Cases Handled

- **No content available:** Returns `{ data: null, message: "No content available" }`
- **Invalid teacher ID:** Returns empty response (not 500)
- **Teacher with no approved content:** Empty response
- **Expired time window:** Content outside its start_time–end_time is excluded
- **Single content item:** Always returned (no rotation needed)
- **All durations = 0:** Defaults to 5-minute duration per item
- **Future epoch:** Returns null (rotation hasn't started)
- **Duplicate email registration:** Returns 409 Conflict
- **Wrong file type:** Returns 400 with descriptive error
- **File too large:** Returns 400 with size limit message
- **Already approved/rejected content:** Returns 400 (cannot re-process)
- **Missing rejection reason:** Returns 400 with validation error
- **Expired JWT:** Returns 401 with "Token expired" message
- **Wrong role accessing endpoint:** Returns 403 with role mismatch
- **Unknown routes:** Returns 404

## Assumptions Made

1. Teachers self-register via the public API; principal accounts are pre-seeded
2. Content status is one-way: `pending → approved` or `pending → rejected`
3. Content is only visible within its `start_time` and `end_time` window, even if approved
4. All timestamps are in UTC (ISO 8601 format)
5. The live broadcast endpoint requires no authentication — it is intentionally public for students

## Architecture Overview

### Authentication & RBAC
Every protected route requires a JWT `Bearer` token in the `Authorization` header. The token contains the user's `id`, `email`, and `role`. A `requireRole()` middleware then checks if the role matches — teachers can only upload and view their own content, principals can only approve/reject. The two roles are completely isolated.

### Database Design
- **Users** — stores both teachers and principals, differentiated by `role`
- **Content** — each upload is a content record linked to the uploader
- **ContentSlot** — groups content by `(subject, teacher_id)`. Each teacher has one slot per subject
- **ContentSchedule** — links content to its slot with a `rotation_order` and `duration`. This is what the scheduling algorithm reads

This separation keeps the slot (structural) and the schedule (operational) concerns clean and independently queryable.

### Key Design Decisions
- UUIDs for all primary keys — no guessable sequential IDs
- Content approval is a one-way state machine: `pending → approved/rejected`
- The live broadcast endpoint is completely stateless — any request at any time computes the same result from current time + DB metadata alone
- See `architecture-notes.txt` for the full deep-dive on all decisions

---

## Bonus Features Implemented

> These are supplementary features added on top of the core requirements.

| # | Feature | Details |
|---|---|---|
| 1 | **Rate Limiting** | `/api/content/live/:teacherId` limited to 100 req/15 min/IP (429 on exceed) |
| 2 | **Pagination & Filters** | All list endpoints support `?page=1&limit=10`, `?subject=`, `?status=`, `?teacher_id=` |
| 3 | **Subject-Wise Analytics** | `GET /api/analytics/subjects` returns per-subject counts including active-now count |
| 4 | **Redis Caching** | Live content endpoint cached via Upstash Redis with 15s TTL. Cache Miss → DB, Cache Hit → instant |
| 5 | **Cloudflare R2 Upload** | Files uploaded directly to R2 (S3-compatible cloud). Falls back to local disk if R2 env vars are absent |

## Available Scripts

| Script | Command | Description |
|---|---|---|
| Start (prod) | `npm start` | Run with node |
| Start (dev) | `npm run dev` | Run with nodemon (auto-reload) |
| Create DB | `npm run db:create` | Create PostgreSQL database |
| Migrate | `npm run db:migrate` | Run all migrations |
| Undo Migrate | `npm run db:migrate:undo` | Undo all migrations |
| Seed | `npm run db:seed` | Run all seeders |
| Undo Seed | `npm run db:seed:undo` | Undo all seeders |
| Reset DB | `npm run db:reset` | Undo migrations, re-migrate, re-seed |

## Project Structure

```
root/
├── src/
│   ├── config/
│   │   ├── database.js          # Sequelize connection
│   │   ├── multer.js            # Multer — auto-selects R2 or local disk
│   │   ├── r2.js                # Cloudflare R2 S3 client
│   │   └── redis.js             # ioredis client (Upstash)
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── content.controller.js  # Includes Redis cache logic
│   │   ├── approval.controller.js
│   │   └── broadcast.controller.js  # Subject analytics
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── content.routes.js
│   │   ├── approval.routes.js
│   │   └── broadcast.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── content.service.js     # buildFileUrl for R2/local
│   │   ├── approval.service.js
│   │   └── scheduling.service.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── upload.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── models/
│   │   ├── index.js
│   │   ├── User.model.js
│   │   ├── Content.model.js
│   │   ├── ContentSlot.model.js
│   │   └── ContentSchedule.model.js
│   └── utils/
│       ├── response.util.js
│       └── scheduler.util.js
├── migrations/
├── seeders/
├── uploads/              # Local fallback only
├── architecture-notes.txt
├── .env.example
├── .env
├── app.js
├── server.js
└── README.md
```
