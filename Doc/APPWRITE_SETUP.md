# Appwrite Database & Security Setup Guide

This application uses a **hardened full-stack architecture**:
- **Frontend (`Appwrite Client SDK`)**: Uses only public identifiers (`VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, `VITE_APPWRITE_DATABASE_ID`) for authentication sessions, public catalog reads, and Realtime subscriptions.
- **Backend (`server.ts` Express API proxy on `/api/*`)**: Holds your privileged secrets (`APPWRITE_API_KEY` and `GEMINI_API_KEY`) strictly server-side, verifies Appwrite user JWTs, enforces Role-Based Access Control (`admin`, `manager`, `partner`, `user`), filters PII, and validates order totals.

---

## 1. Where to Add Your `APPWRITE_API_KEY` and `GEMINI_API_KEY`

Open `.env.local` in the project root (this file is gitignored via `*.local` and never shipped to the browser) and paste your keys on the **server-only** lines:

```env
APPWRITE_API_KEY=standard_your_appwrite_server_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

> **CRITICAL:** Never prefix `APPWRITE_API_KEY` or `GEMINI_API_KEY` with `VITE_`. Any variable starting with `VITE_` is bundled into public browser JavaScript.

### Recommended Scopes for `APPWRITE_API_KEY`
In Appwrite Console → **Overview → Integrations → API Keys → Create API Key**:
- `databases.read`, `databases.write`
- `collections.read`, `collections.write`
- `attributes.read`, `attributes.write`
- `indexes.read`, `indexes.write`
- `documents.read`, `documents.write`
- `users.read`, `users.write` (for admin user management)
- `buckets.read`, `buckets.write`, `files.read`, `files.write` (for the `media` Storage Bucket)

> **About S3:** Appwrite Storage already serves images and uploads natively via the Appwrite SDK (`appwriteStorage` / `media` bucket)—no S3 keys are needed in the app. Only fill the `S3_*` variables in **`.env.local`** (never commit secrets in `.env.example`) if you connect an external S3 CLI or sync tool.

---

## 2. Register Web Platforms (CORS & Session Cookies)
In Appwrite Console → **Overview → Integrations → Platforms → Add Platform → Web**, add your preview and localhost hostnames so browser Appwrite Auth sessions succeed.

---

## 3. Provision Collections with Document-Level Security
Once `APPWRITE_API_KEY` is in `.env.local`, run:

```bash
node scripts/setup-appwrite.mjs
```

If collections already exist with broad permissions, update these settings in **Appwrite Console → Databases → Collections → Settings / Permissions**:
- `users`: Enable **Document Security**. Remove broad `read("users")` / `update("users")` collection permissions so users can only read/update their own document (admin listing is handled via `/api/users` on the backend).
- `orders`: Enable **Document Security**. Allow `create("users")` and per-document `read(user:<id>)`; restrict status/location updates to server-side `/api/orders/*`.
- `partner_applications`: Enable **Document Security**. Keep collection read/update restricted so only the backend `/api/partner-applications` admin endpoint can inspect applicant emails and notes.
- `meals`, `meal_slot_configs`, `daily_menu_schedules`, `site_settings`, `testimonials`, `social_feed_items`: Allow `read("any")`, and remove `create/update/delete("users")` so catalog and site settings can only be modified through role-verified `/api/*` endpoints.

---

## 4. Create Your First Admin User
1. Sign up normally via the Login / Sign Up modal in the app.
2. In Appwrite Console → **Databases → `users`**, edit your user document and set:
   - `role` = `"admin"`
   - `isApprovedByAdmin` = `true`

---

## 5. Additional Console Hardening (Google Maps Key)
In Google Cloud Console → **APIs & Services → Credentials**, restrict the Google Maps Browser API key used in `index.html` by **HTTP Referrers (Web sites)** to your allowed domains and restrict its API scope strictly to **Maps JavaScript API**.
