---
name: daily-content
description: Research and write BikeHub motorcycle routes and articles, checked against trustworthy sources, and save them as drafts for the owner to review in Admin. Use when the user runs /daily-content or asks to add routes, articles, guides or SEO content to BikeHub.
---

# Daily content for BikeHub

The owner runs this most mornings, sometimes with a hint ("2 routes in Kerala", "monsoon article"). Without a hint, add **1 route + 1 article**. The owner is not a coder: report back in plain language.

Everything is saved as a **draft**. The owner reads each piece in Admin and publishes it. Never try to publish, edit or delete live content from here.

## 1. Pick topics

1. Run `npm run content -- list` to see every existing route and article (published and draft). Never repeat a route or cover a topic that's already well covered; a different angle is fine ("Spiti in winter" vs "Spiti in summer").
2. Prefer what Indian riders search for: famous routes (Ladakh, Spiti, Konkan coast, Western Ghats, Nilgiris, Northeast, Rajasthan), weekend rides near the 18 BikeHub cities (Delhi NCR, Mumbai, Pune, Bengaluru, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Chandigarh, Lucknow, Kochi, Indore, Dehradun), and practical ownership topics (servicing costs, chain care, tyres, monsoon, touring kit, permits, first long ride).
3. Match the season (today's date is in context): monsoon riding and Western Ghats in June–Sept, Ladakh/Spiti planning in March–June, Rajasthan and the south in winter.

## 2. Research: facts must be checked

Use WebSearch/WebFetch. For every fact that matters (distance, altitude, road condition, permits, season, fuel availability, costs, rules), find **at least two independent sources that agree**. If they disagree, use the more official one, or say it varies.

Trust order:
1. Official: state tourism departments, district administration, Border Roads Organisation, MoRTH / NHAI, Parivahan, Indian Meteorological Department, motorcycle manufacturers' owner manuals and official sites.
2. Reference: Wikipedia (for basics like altitude and route numbers, double-checked elsewhere), Google Maps distances.
3. Rider ground reports: Team-BHP, xBhp, BikeAdvice, recent ride logs. Good for road condition and fuel stops, but note they reflect one trip.

Never copy wording, structure or photos from any source. Read, take notes on the facts, then write fresh. Quote nothing longer than a few words. If something can't be verified (an exact permit fee this year, a road open date), say "check before you go" rather than guessing. Never invent facts, places, prices, people or quotes.

## 3. Write in BikeHub's own voice

- Indian English, practical, warm, from one rider to another. Short sentences. No hype ("breathtaking", "unforgettable journey of a lifetime"), no filler intros.
- Original structure: answer what a rider actually needs (how far, how hard, when, where to fuel/stay/service, what can go wrong).
- Safety-critical advice points to the manufacturer and qualified mechanics.
- Use `## ` sub-headings and `- ` bullet lists (each block separated by a blank line); the site renders them.

**Route** (fields for the JSON file):
- `name` – e.g. "Mumbai to Goa via the Konkan coast"
- `start_location`, `end_location`, `distance_km` (whole number, by the suggested road), `duration_text` ("2–3 days"), `difficulty` (Beginner / Intermediate / Advanced), `best_season` ("October to March")
- `summary` – 1–2 sentences, 40–300 characters; this is the Google snippet, so include the route name and what makes it worth riding
- `description` – 250+ words: ## The route (way-points in order), ## Road conditions, ## Fuel, food and stays, ## Highlights. Mention nearby BikeHub cities for servicing where true.
- `safety_notes` – 40+ words: permits, altitude, weather, network coverage, spares, documents
- `sources` – the pages the facts were checked against, as `{"label":"Himachal Tourism – Spiti","url":"https://…"}`; at least 2
- `hero_image_url` – see Photos

**Article**:
- `title` – 10–110 characters, natural phrasing riders would search ("How often should you clean and lube a motorcycle chain?")
- `category` – one of: Ride story, Touring, Maintenance, Riding tips, Expert advice, Community
- `excerpt` – 60–300 characters, the Google snippet
- `body` – 400+ words with ## sub-headings; end with a short practical checklist where it fits
- `is_expert_content` – true for maintenance, safety and how-to guides
- `author_name` – "BikeHub Editorial" (unless the owner names someone)
- `sources`, `hero_image_url` – as for routes

## 4. Photos

Only free-licence photos, never images from other sites:
- **Wikimedia Commons** (best for real places): search `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&format=json&srsearch=<place>`, then fetch the file page to get the `upload.wikimedia.org/wikipedia/commons/…` URL, the author and the licence. Use only CC0, CC BY or CC BY-SA. Add a source entry crediting it: `{"label":"Cover photo: <author>, <licence>, via Wikimedia Commons","url":"<file page URL>"}`.
- **Unsplash**: `https://images.unsplash.com/photo-…` URLs only (add `?w=1600&q=80`), and credit the photographer in a source entry.
- If nothing suitable is found, leave `hero_image_url` out (the site uses a default) and tell the owner they can upload one in Admin.

## 5. Save as drafts

1. Write the JSON to `content/drafts/<YYYY-MM-DD>.json` as `{"routes":[…],"articles":[…]}`.
2. Run `npm run content -- add content/drafts/<file>.json --dry`. Fix anything it reports.
3. Run `npm run content -- add content/drafts/<file>.json`.

## 6. Report to the owner

In plain language, short:
- what was added (titles), with its link (http://localhost:3000 or the live site + `/admin/routes/<id>` or `/admin/articles/<id>` from the script output)
- anything uncertain they should double-check before publishing (a permit rule, a seasonal closure)
- reminder: open it in Admin, read it, then turn on **Published** and click **Save changes**
