# Dr. Brinda's Dental & Aesthetic Center

Website for Dr. Brinda's Dental & Aesthetic Center, Rajajinagar, Bengaluru —
[brindasclinic.com](https://brindasclinic.com).

Static site: plain HTML, CSS and JavaScript, no build step. Served by GitHub
Pages from the `main` branch.

## Editing

All page content lives in `index.html`. Images live in `assets/` — replacing a
file with one of the same name updates the site with no code changes.

Pushing to `main` publishes the change within a minute or two.

## Google reviews

The reviews section reads `assets/reviews.json`, which a scheduled GitHub
Action (`.github/workflows/reviews.yml`) refreshes weekly from the Google
Places API. It needs a repository secret named `GOOGLE_MAPS_API_KEY`.

## Credits

3D molar scan: "[Mandibular First Molar](https://skfb.ly/HzvD)" by University
of Dundee, School of Dentistry, licensed
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
