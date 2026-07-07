# Microtuff Solutions — Client Portal

A production-ready, full-stack client document-submission portal built with
**Next.js 15 (App Router) + TypeScript + Tailwind CSS + Prisma + SQLite**.

Clients log in with their **phone number** (matched against the client database —
no OTP / no SMS). They can upload documents, photos, and videos into their
**own isolated project folder**. An in-site chat lets clients text or send voice
notes to Microtuff without needing any external app.

## Features

- **Phone-number login** — validated against seeded client records, JWT in an
  http-only cookie, login rate-limited (5 tries / 10 min per IP).
- **Per-client folders** — every client's files live in `uploads/<phone>/`.
  Clients can only ever see/download/delete **their own** files.
- **Uploads** — drag & drop or browse, multi-file, progress bar, category +
  description metadata, server-side type/size validation.
  - Documents: PDF, DOC, DOCX (10 MB)
  - Images: JPG, JPEG, PNG, GIF, WEBP (10 MB)
  - Videos: MP4, MOV, AVI (100 MB)
- **Gallery + preview** — thumbnails, list/grid, search, category filter,
  modal preview (image zoom / HTML5 video / document open), download, delete.
- **In-site chat** — clients send text or voice notes (no Telegram/app needed).
  Microtuff replies from the admin dashboard. New messages notify the operator.
- **Admin dashboard** (protected) — view all clients + all uploads, read/unread
  client messages with reply, add new clients (auto-creates their folder).
- **AI operator** (`ai-operator.py`) — background service that watches client
  folders, auto-logs new uploads into the DB with a summary, and can notify
  Microtuff so follow-ups happen from one place.
- Fully responsive (mobile-first), toast notifications, loading/error states.

## Tech Stack

| Layer      | Choice                                            |
|------------|---------------------------------------------------|
| Frontend   | Next.js 15 App Router, TypeScript, Tailwind CSS   |
| UI         | shadcn/ui-style primitives (Button, Card, Input…) |
| Backend    | Next.js API routes (Route Handlers)               |
| Database   | Prisma + SQLite (`prisma/dev.db`)                 |
| Auth       | JWT in http-only cookie, bcrypt-ready             |
| Storage    | Local `uploads/<phone>/` (swap to S3/Cloudinary)  |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set a strong JWT_SECRET

# 3. Create the database + seed the client log
npx prisma db push
npm run db:seed

# 4. Run in development
npm run dev
# open http://localhost:3000
```

The seed (`prisma/seed.js`) is the **client database**. Edit `CLIENT_DATABASE`
to add real clients (phone + name). Each client automatically gets an isolated
`uploads/<phone>/` folder. After editing, re-run `npm run db:seed`.

### Sample logins (from seed)
```
+18768851041  Nash Tech        (client — can upload to own folder)
+15559876543  Natoya Daley     (client)
+18765551234  Garlands Wholesale (client)
```
In the login form type your own client phone (10 digits) and it auto-prepends +1.
Admin access is granted to the phone set in `ADMIN_PHONE` in `.env`.

## Project Structure

```
microtuff-client-portal/
├── prisma/
│   ├── schema.prisma        # User, Upload, Message models
│   └── seed.js              # CLIENT_DATABASE (the client log)
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout + toasts
│   │   ├── page.tsx          # Redirect to login/dashboard
│   │   ├── login/            # Phone login page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx    # Auth guard + header/footer
│   │   │   ├── dashboard/    # Client dashboard (upload + gallery)
│   │   │   ├── chat/         # In-site chat (text + voice)
│   │   │   └── admin/        # Admin dashboard
│   │   └── api/
│   │       ├── auth/         # login, logout, me
│   │       ├── uploads/      # upload, download, delete
│   │       └── chat/         # messages + media + admin reply
│   ├── components/ui/        # shadcn-style primitives
│   └── lib/                  # prisma, auth, rateLimit, files
├── uploads/                  # per-client folders (gitignored)
├── ai-operator.py            # background AI watcher (optional)
└── .env.example
```

## Adding a sample user to the database

Edit `prisma/seed.js` → add to `CLIENT_DATABASE`, then `npm run db:seed`.
Or use the admin dashboard "Add Client" form (also creates the folder).

## Deployment

- **Node host (Vercel / Railway / Fly):** set `JWT_SECRET` + `UPLOAD_DIR` env,
  run `prisma db push` + `npm run db:seed` once, then `npm run build && npm start`.
- **File storage:** `uploads/` is local. For production use object storage
  (S3/Cloudinary) by editing `src/lib/files.js` `clientDirFor()` + the upload route.
- **Persistence:** SQLite file (`prisma/dev.db`) must persist across deploys —
  mount a volume, or migrate to Postgres (change `datasource` in schema.prisma).

## Security notes

- JWT in http-only, sameSite=lax cookie (secure in production).
- Server-side validation of file type + size; filenames sanitized.
- Files stored outside `public/` and served only via authenticated routes that
  enforce ownership.
- Login rate-limited per IP.
- Secrets via environment variables (`.env`, never committed).
