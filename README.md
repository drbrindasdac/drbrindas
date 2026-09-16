# Dr. Brinda's Dental & Aesthetic Center

Static site. No build step, no dependencies. Deploys to GitHub Pages as-is.

## Deploy

```
git init && git add -A && git commit -m "Initial site"
git remote add origin git@github.com:<user>/<repo>.git
git push -u origin main
```

Then: repo **Settings → Pages → Source: Deploy from a branch → main / (root)**.

Custom domain: add `brindasclinic.com` in Settings → Pages (it writes a `CNAME`
file), then at the domain registrar set:

| Type  | Host | Value                |
|-------|------|----------------------|
| A     | @    | 185.199.108.153      |
| A     | @    | 185.199.109.153      |
| A     | @    | 185.199.110.153      |
| A     | @    | 185.199.111.153      |
| CNAME | www  | `<user>.github.io.`  |

Tick "Enforce HTTPS" after DNS propagates.

## Swap in real photos

Overwrite the files in `assets/` keeping the same filenames — no code changes needed.

| File | What it should be | Size |
|---|---|---|
| `dr-brinda.jpg` | Dr. Brinda headshot | 600×800 (portrait) |
| `dr-swaroop.jpg` | Dr. Swaroop headshot | 600×800 |
| `staff-1.jpg` | Third team member | 600×800 |
| `staff-2.jpg` | Fourth team member / clinical team | 600×800 |

Shoot the four portraits the same way — same wall, same distance, same light,
head and shoulders centred. Mismatched headshots are what makes a team section
look improvised.

Real clinic photos are already in place (`hero-clinic.jpg`, `clinic-1..3.jpg`,
`og-cover.jpg`), pulled from the old site.

Two team cards are placeholders — search `TODO` in `index.html` and replace the
name, role, bio and qualification chips.

Compress before committing (squoosh.app, ~200KB each).

## Booking (Cal.com)

1. Create a free account at cal.com.
2. Make an event type, e.g. "Consultation", 30 min.
3. Connect Google Calendar so her real availability blocks slots.
4. Set `CAL_LINK` at the top of `js/main.js` to `<username>/<event-slug>`.

Cal.com free tier allows multiple event types — make one per doctor or per
treatment if useful, and change `CAL_LINK` to a team/routing link.

## Editing content

Everything lives in `index.html`. Phone number appears in several places —
search for `8217317171` to change all of them.

## Google reviews (auto-refreshing)

`assets/reviews.json` feeds the reviews rail. It is refreshed every Monday by
`.github/workflows/reviews.yml`, which runs `scripts/fetch_reviews.py` against
the Google Places API. The API key lives in a repo secret, never in the browser.

**Setup:**

1. Google Cloud Console → new project → enable **Places API (New)**.
2. Enable billing (the $200/month free credit covers this many times over —
   two API calls per week costs effectively nothing).
3. Create an API key, restrict it to the Places API.
4. GitHub repo → Settings → Secrets and variables → Actions → new secret
   named `GOOGLE_MAPS_API_KEY`.
5. Actions tab → "Refresh Google reviews" → Run workflow, to test it.

**Knobs** (env vars, set them in the workflow if you want to change them):

| Var | Default | Meaning |
|---|---|---|
| `MIN_RATING` | `5` | Only show reviews at or above this. Drops to 4★ automatically if fewer than 3 five-star reviews come back. |
| `PLACE_QUERY` | the clinic's name + address | What to search for on Google. |

**Limits worth knowing:** the Places API returns a maximum of **5 reviews** per
place — there is no way to get all 107. The script also syncs the JSON-LD
`aggregateRating` in `index.html` to the live rating and review count, so the
Google rich card never shows numbers the page cannot back up.

Run it locally to test:

```
GOOGLE_MAPS_API_KEY=xxx python3 scripts/fetch_reviews.py
```
