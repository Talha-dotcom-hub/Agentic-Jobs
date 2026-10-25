# Agentic Jobs — Supabase Backend & Database Setup Guide

This directory contains the database schema migrations, Row Level Security (RLS) policies, and storage configuration for **Agentic Jobs**.

---

## 1. Environment Setup

Configure your local or production environment variables in `.env` (or project settings in AI Studio):

```bash
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

> **CRITICAL SECURITY REQUIREMENT**: Never paste `SUPABASE_SERVICE_ROLE_KEY` into client bundles or public source repositories.

---

## 2. Applying SQL Migrations

1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Open `supabase/migrations/001_initial_schema.sql`.
3. Paste and execute the entire migration script.

This creates the normalized tables:
- `profiles` (User profile & preference settings)
- `jobs` (Shared normalized job catalog)
- `user_jobs` (Per-user saved jobs and Gemini match cache)
- `applications` (Manual tracking with follow-up alerts)
- `resumes` (Private resume metadata & text)
- `scan_schedules` (User search frequency)
- `notifications` (User notification log)
- `user_api_keys` (Server-side proxy API tokens)

---

## 3. Storage Bucket Configuration

The migration script creates a private storage bucket named `resumes`.

- **Bucket Name**: `resumes`
- **Public Access**: `Disabled` (Private bucket)
- **RLS Policy**: Authenticated users can only read, insert, or delete objects inside `resumes/{user_id}/*`.
- **Signed URLs**: Downloads generate temporary signed URLs with 15-minute expiry.

---

## 4. Authentication & Redirect URLs

In **Supabase Dashboard** -> **Authentication** -> **URL Configuration**:
- **Site URL**: `https://your-applet-url`
- **Redirect URLs**:
  - `https://your-applet-url/*`
  - `http://localhost:3000/*`

---

## 5. Running Test Suite

Run the automated test suite using Node.js built-in runner:

```bash
node --test tests/supabase.test.ts
```
