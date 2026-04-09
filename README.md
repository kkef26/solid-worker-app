# Solid Worker App

PWA for Solid Anadomisi field workers. Built with Next.js 14 App Router, Supabase, AWS S3.

## Features
- Phone + PIN login (Greek UI)
- GPS check-in for job sites
- Camera photo uploads to S3 with manager approval workflow
- Material request tracking
- Manager dashboard: worker status, job assignment, photo approvals

## Stack
- **Framework:** Next.js 14 App Router
- **DB:** Supabase (ynxcbvfhrwuenjnvsceq) — 7 worker_* tables
- **Storage:** AWS S3 (anadomisi-documents bucket, photos/ prefix)
- **Deploy:** Netlify (solid-worker-app.netlify.app)
- **Auth:** Phone + bcrypt PIN, 30-day session tokens

## Manager Seed
- Phone: +306900000001 / PIN: 1234 / display: Νίκος

## Environment Variables
Set these in Netlify:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SOLID_AWS_ACCESS_KEY_ID` (note: AWS_* names reserved by Netlify)
- `SOLID_AWS_SECRET_ACCESS_KEY`
- `SOLID_AWS_REGION` (default: eu-west-1)
- `S3_BUCKET` (default: anadomisi-documents)

## URL
https://solid-worker-app.netlify.app
