<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Mijn Beauty Afspraken

<!-- Deploy trigger: 2026-01-16 12:00 UTC -->

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/BartMimo/mijnbeauty-afspraken)

The complete beauty salon booking platform. Manage appointments, handle client bookings, and grow your beauty business.

## 🚀 Deployment

### Live Site
- **Vercel:** https://mijnbeauty-afspraken.vercel.app/

### Deploy Your Own
1. Fork or clone this repository
2. Connect to Vercel via GitHub integration
3. Add environment variables (see [Environment Setup](#environment-setup) below)
4. Deploy

## ⚙️ Environment Setup

### Local Development
Create a `.env.local` file with:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Production (Vercel)
Add these environment variables in **Vercel → Project Settings → Environment Variables**:
- `VITE_SUPABASE_URL` (Production & Preview)
- `VITE_SUPABASE_ANON_KEY` (Production & Preview)

**Note:** Only use the **anon key** for client-side environments. Server-side functions should use `SUPABASE_SERVICE_ROLE_KEY` (store securely, not as VITE_*).

## 🏃 Run Locally

**Prerequisites:** Node.js 16+

1. Clone and install:
   ```bash
   npm install
   ```

2. Set environment variables in `.env.local`

3. Run dev server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## 📦 Build

```bash
npm run build
```

Output is generated in `dist/` for deployment.

## 🔒 Security Checklist

- [ ] Rotate Supabase keys after initial setup
- [ ] Use anon key (not service role) for client-side
- [ ] Never commit `.env.local` (listed in `.gitignore`)
- [ ] Enable Row-Level Security (RLS) on Supabase tables
- [ ] Keep dependencies updated: `npm audit fix`

## 📋 Features

- **Salon Profiles:** Create and manage your salon presence
- **Online Booking:** Clients book appointments 24/7
- **Dashboard:** Track appointments and revenue
- **Deals System:** Create last-minute offers to fill your schedule
- **Reviews:** Showcase client testimonials

## 📖 Scripts

- `npm run dev` — Start dev server (Vite)
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run import-all` — Import data from CSV/JSON (requires SUPABASE_SERVICE_ROLE_KEY)

## 🗄️ Database

Uses Supabase (PostgreSQL). See `supabase/` folder for:
- Migration files (`migrations/0001_init.sql`)
- Initial schema setup (`init-schema.sql`)
- Schema documentation (`README.md`)
