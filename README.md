# BikeHub Platform

A Vercel-ready Next.js foundation for BikeHub: an open, location-led service, routes and rider-knowledge platform for India’s premium motorcycle community.

## Important product rule

The rider-facing website is public. Visitors do not need to register or sign in to search service centres, read profiles, explore routes or read community content. Authentication is reserved for service-centre partners and administrators.

## Included

- Premium responsive homepage based on the supplied mockup
- Public service-centre discovery and profile pages
- Public route listing and detail pages
- Public community and expert-content pages
- Enquiry UI with no rider account requirement
- Partner information, login surface and dashboard
- Administrator dashboard foundation
- Supabase schema, RLS policies and demonstration seed data
- Fifteen optimized project-local images

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add your Supabase project URL and publishable key (`sb_publishable_...`). Older projects may use the legacy anon key as a fallback.
5. Run `npm run dev` and open `http://localhost:3000`.

The public pages render with a safe local fallback when Supabase is unavailable. With Supabase configured, service-centre discovery reads live rows and centre enquiries are inserted into the database.

After deploying with the Supabase environment variables, open `/api/health/supabase`. A successful connection returns JSON containing `"connected": true` and the number of service-centre rows visible through RLS.

## Supabase setup

Create a new Supabase project, open SQL Editor and run these files in order:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_seed.sql`
4. `supabase/migrations/004_launch_content.sql`
5. `supabase/migrations/005_api_grants.sql`
6. `supabase/migrations/006_listings_live.sql`

## Importing listings (free, OpenStreetMap)

Service centres, repair shops and riding-gear shops are imported from OpenStreetMap for 18 cities (Delhi NCR, Mumbai, Pune, Bengaluru, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Chandigarh, Lucknow, Kochi, Indore, Dehradun). It needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env.local`.

```bash
npm run import:osm              # all cities
npm run import:osm -- pune      # one city
npm run import:osm -- --dry     # fetch and classify without writing
```

Re-running updates existing rows in place (matched on the OSM id) and never overwrites listings a partner has claimed. OSM data must be credited, and the listing pages already do this. OSM covers far fewer shops than Google Maps. `service_centres.google_place_id` is reserved for a later Google Places API enrichment. Google's terms only allow storing the place id, so other Google fields should be fetched live or cached for no more than 30 days.

## Partners and admins

Create users in Supabase → Authentication. To link a partner to their listing, set `service_centres.owner_id` to the user's id. To make someone an administrator, set `profiles.role = 'admin'`. Partners can then edit their listing and manage enquiries at `/partner/dashboard`. Admins can verify or hide listings and read enquiries and contact messages at `/admin`.

Set partner and administrator roles by updating `public.profiles.role` from a secure administrator process. Never expose the service-role key in browser code.

## Vercel deployment

1. Create a new Vercel project and import/upload this project folder.
2. Keep Framework Preset set to Next.js.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in Project Settings → Environment Variables. Add `SUPABASE_SECRET_KEY` only after a server-only feature genuinely requires it; never expose it with a `NEXT_PUBLIC_` prefix.
4. Use `npm run build` as the build command.
5. Deploy.

For continued development, connecting a Git repository to Vercel is more reliable than repeatedly uploading folders.

## Production checklist

- Replace demonstration centre details with verified partner data.
- Replace demonstration telephone numbers.
- Add Supabase Storage buckets for partner-uploaded centre images.
- Configure partner password reset and email templates.
- Protect `/partner/dashboard` and `/admin` with server-side role checks before production use.
- Add a geocoding/maps provider if interactive maps are required.
- Complete legal, privacy, moderation and emergency-advice policies.

## Image use

Images in `public/images` were created for the BikeHub concept and optimized for this project. Each primary visible card uses a distinct image. Alt text and stable image containers are included to prevent layout shift.
