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
| `hero-clinic.jpg` | Best treatment-room / clinic shot | 800×1000 (portrait) |
| `dr-brinda.jpg` | Dr. Brinda headshot | 600×800 |
| `dr-swaroop.jpg` | Dr. Swaroop headshot | 600×800 |
| `before.jpg` / `after.jpg` | Same case, same angle + lighting | 1200×800 |
| `clinic-1..6.jpg` | Reception, chair, sterilization, imaging, consult, lounge | ~700×560 |
| `og-cover.jpg` | Social share image | 1200×630 |

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
