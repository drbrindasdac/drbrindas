#!/usr/bin/env python3
"""Pull Google reviews into assets/reviews.json.

Runs in CI (see .github/workflows/reviews.yml) so the API key never ships
to the browser. Google's Places API returns at most 5 reviews per place.

  GOOGLE_MAPS_API_KEY=... python3 scripts/fetch_reviews.py
"""
import json, os, re, sys, urllib.request

KEY = os.environ.get("GOOGLE_MAPS_API_KEY")
QUERY = os.environ.get(
    "PLACE_QUERY",
    "Dr Brinda's Dental and Aesthetic Care, Milk Colony, Rajajinagar, Bengaluru",
)
MIN_RATING = int(os.environ.get("MIN_RATING", "5"))
OUT = "assets/reviews.json"
INDEX = "index.html"


def api(url, body=None, headers=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode() if body else None,
        headers={"Content-Type": "application/json", "X-Goog-Api-Key": KEY, **(headers or {})},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def main():
    if not KEY:
        sys.exit("GOOGLE_MAPS_API_KEY is not set")

    found = api(
        "https://places.googleapis.com/v1/places:searchText",
        {"textQuery": QUERY, "maxResultCount": 1},
        {"X-Goog-FieldMask": "places.id,places.displayName"},
    ).get("places") or []
    if not found:
        sys.exit(f"No place matched: {QUERY}")
    place_id = found[0]["id"]
    print(f"matched {found[0]['displayName']['text']} ({place_id})")

    d = api(
        f"https://places.googleapis.com/v1/places/{place_id}",
        headers={
            "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
            "Content-Type": "application/json",
        },
    )

    def clean(r):
        a = r.get("authorAttribution", {})
        return {
            "rating": r.get("rating", 0),
            "text": (r.get("originalText") or r.get("text") or {}).get("text", "").strip(),
            "author": a.get("displayName", "Google user"),
            "photo": a.get("photoUri", ""),
            "when": r.get("relativePublishTimeDescription", ""),
            "url": r.get("googleMapsUri", ""),
        }

    all_reviews = [clean(r) for r in d.get("reviews", [])]
    all_reviews = [r for r in all_reviews if r["text"]]
    picked = [r for r in all_reviews if r["rating"] >= MIN_RATING]
    # never ship an empty rail just because the top rating bucket was thin
    if len(picked) < 3:
        picked = [r for r in all_reviews if r["rating"] >= MIN_RATING - 1]

    # a name search misses this listing (Google has it as "Care", the site says
    # "Center"), so pin the link to the place's CID
    PLACE_URL = "https://www.google.com/maps?cid=12660524401894847045"
    out = {
        "rating": d.get("rating", 5),
        "count": d.get("userRatingCount", 0),
        "url": PLACE_URL,
        "reviews": picked,
    }
    os.makedirs("assets", exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"wrote {len(picked)}/{len(all_reviews)} reviews (>= {MIN_RATING}★) to {OUT}")

    # keep the JSON-LD aggregateRating honest - it feeds the Google rich card
    if out["count"]:
        html = open(INDEX).read()
        html = re.sub(r'("ratingValue":")[^"]*(")', rf'\g<1>{out["rating"]}\g<2>', html, count=1)
        html = re.sub(r'("reviewCount":")[^"]*(")', rf'\g<1>{out["count"]}\g<2>', html, count=1)
        open(INDEX, "w").write(html)
        print(f"synced JSON-LD to {out['rating']}★ / {out['count']} ratings")


if __name__ == "__main__":
    main()
