#!/usr/bin/env python3
"""Builds womanownedmap.com from the Woman-Owned Public Feed.

Every page is plain HTML that search engines and AI tools can read, with the
interactive map loaded on top for visitors. Run by GitHub Actions every night.

  python3 build.py            fetch the live feeds and build into ./site
  python3 build.py --local D  use D/listings.csv and D/cities.csv instead (for testing)
"""
import csv, hashlib, io, json, os, re, shutil, sys, urllib.request
from datetime import date
from html import escape

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(ROOT, "site")
S = json.load(open(os.path.join(ROOT, "site.json")))
DOMAIN = S["domain"].rstrip("/")
TODAY = date.today().isoformat()


def e(x):
    return escape(str(x or ""), quote=True)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "womanownedmap-build"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def rows_from(text):
    return [{k.strip(): (v or "").strip() for k, v in r.items() if k} for r in csv.DictReader(io.StringIO(text))]


def load():
    if "--local" in sys.argv:
        d = sys.argv[sys.argv.index("--local") + 1]
        return rows_from(open(os.path.join(d, "listings.csv")).read()), rows_from(open(os.path.join(d, "cities.csv")).read())
    cfg = open(os.path.join(ROOT, "app", "config.js")).read()
    lu = re.search(r'listingsCsvUrl:\s*"([^"]+)"', cfg).group(1)
    cu = re.search(r'citiesCsvUrl:\s*"([^"]+)"', cfg).group(1)
    listings = rows_from(fetch(lu))
    if len(listings) < 100:
        sys.exit("The listings feed came back with only %d rows. Not publishing, so the live site stays as it was." % len(listings))
    return listings, rows_from(fetch(cu))


# ---------- categories (match the app) ----------
CATS = [
    ("Food and drink", "food", "Eat and drink", "Restaurant"),
    ("Shops", "shops", "Shops", "Store"),
    ("Stays", "stays", "Stays", "LodgingBusiness"),
    ("Things to do", "todo", "Things to do", "TouristAttraction"),
    ("Wellness and beauty", "well", "Wellness and beauty", "HealthAndBeautyBusiness"),
    ("Tours and activities", "tours", "Tours and activities", "TouristTrip"),
]


NOUN = {"food": "place to eat and drink", "shops": "shop", "stays": "place to stay", "todo": "thing to do",
        "well": "wellness and beauty spot", "tours": "tour company"}


def noun_of(r):
    cid, label, _ = cat_of(r)
    return NOUN.get(cid) or label.lower()


def cat_of(r):
    c = r.get("category", "")
    for name, cid, label, schema in CATS:
        if c == name:
            return cid, label, schema
    if r.get("listing_type") == "Online":
        return "online", c or "Brands and services", "Organization"
    if r.get("listing_type") == "Tour":
        return "tours", c or "Tours and activities", "TouristTrip"
    return "other", c or "Places", "LocalBusiness"


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return s or "place"


def url_fix(u):
    u = (u or "").strip()
    if not u:
        return ""
    return u if re.match(r"https?://", u) else "https://" + u


def ig_url(h):
    h = (h or "").strip().lstrip("@")
    if not h:
        return ""
    return h if h.startswith("http") else "https://www.instagram.com/" + h


def plural(n, one, many=None):
    return "{:,} {}".format(n, one if n == 1 else (many or one + "s"))


# ---------- page shell ----------
def ga():
    gid = S.get("google_analytics_id", "")
    if not gid:
        return ""
    return ('<script async src="https://www.googletagmanager.com/gtag/js?id=%s"></script>\n'
            '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","%s");</script>\n') % (gid, gid)


NAV = [("/", "Home"), ("/#browse", "Browse"), ("/#map", "Map"), ("/cities/", "Cities"), ("/#deals", "Deals"),
       (S["trips_url"], "Trips"), ("/#saved", "My list"), ("/about/", "About")]


def page(path, title, desc, body, jsonld=None, app_attrs="", noapp=False):
    canon = DOMAIN + path
    ld = "".join('<script type="application/ld+json">%s</script>\n' % json.dumps(x, ensure_ascii=False) for x in (jsonld or []))
    nav = "".join('<a href="%s">%s</a>' % (e(h), e(t)) for h, t in NAV)
    app = "" if noapp else (
        '<script src="/assets/config.js"></script>\n<script src="/assets/photos.js"></script>\n'
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>\n'
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js"></script>\n'
        '<script src="/assets/app.js"></script>\n')
    return """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>%(title)s</title>
<meta name="description" content="%(desc)s">
<link rel="canonical" href="%(canon)s">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Woman-Owned Map by Wanderful">
<meta property="og:title" content="%(title)s">
<meta property="og:description" content="%(desc)s">
<meta property="og:url" content="%(canon)s">
<meta property="og:image" content="%(domain)s/assets/share.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&family=Young+Serif&display=swap">
<link rel="stylesheet" href="/assets/vendor.css">
<link rel="stylesheet" href="/assets/app.css">
<link rel="stylesheet" href="/assets/site.css">
%(ga)s%(ld)s</head>
<body>
<div id="wo-app" %(attrs)s>
<div class="wo-static">
<header class="st-head"><a class="st-brand" href="/"><img src="/assets/logo.png" alt="" width="34" height="34"><span><b>Woman-Owned</b><small>by Wanderful</small></span></a><nav aria-label="Main">%(nav)s</nav></header>
<main>
%(body)s
</main>
</div>
</div>
<footer class="st-foot"><p><a href="/"><b>Woman-Owned Map</b></a> is a free directory of woman-owned places to visit, powered by <a href="https://sheswanderful.com">Wanderful</a>, the global community for women who travel.</p>
<p><a href="%(news)s"><b>Get our newsletter</b></a> · <a href="/about/">About the map</a> · <a href="/cities/">All city guides</a> · <a href="%(trips)s">Woman-owned trips</a> · <a href="%(submit)s">Add a place</a> · <a href="https://sheswanderful.com/join">Become a member</a> · <a href="https://sheswanderful.com/collaborate">Partner with us</a></p></footer>
%(app)s</body>
</html>
""" % dict(title=e(title), desc=e(desc), canon=e(canon), domain=DOMAIN, ga=ga(), ld=ld, attrs=app_attrs, nav=nav, body=body,
           app=app, trips=e(S["trips_url"]), submit=e(S["submit_url"]), news=e(S.get("newsletter_url", "https://sheswanderful.beehiiv.com/subscribe")))


def write(path, html):
    fp = os.path.join(SITE, path.lstrip("/"))
    if path.endswith("/"):
        fp = os.path.join(fp, "index.html")
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, "w").write(html)
    HASHES[path] = hashlib.sha1(html.encode("utf-8")).hexdigest()[:16]


HASHES = {}


def moved(old_path, new_path):
    """A tiny page that sends old map.sheswanderful.com links to their new home."""
    to = DOMAIN + new_path
    html = ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Moved</title>'
            '<meta name="robots" content="noindex"><link rel="canonical" href="%s">'
            '<meta http-equiv="refresh" content="0; url=%s"><script>location.replace(%s)</script></head>'
            '<body><p>This page moved to <a href="%s">%s</a>.</p></body></html>') % (e(to), e(to), json.dumps(to), e(to), e(to))
    fp = os.path.join(SITE, old_path.strip("/"), "index.html")
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, "w").write(html)


def short_link(path, to):
    """womanownedmap.com/<path> forwards to a form or signup page (easy to say and type)."""
    html = ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Woman-Owned Map</title>'
            '<meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=%s"><script>location.replace(%s)</script></head>'
            '<body><p><a href="%s">Continue</a></p></body></html>') % (e(to), json.dumps(to), e(to))
    fp = os.path.join(SITE, path.strip("/"), "index.html")
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, "w").write(html)


def page_dates(urls):
    """Keep each page's last-changed date between builds, and list the pages that changed (for IndexNow)."""
    old = {}
    try:
        with urllib.request.urlopen(DOMAIN + "/manifest.json", timeout=20) as f:
            old = json.loads(f.read().decode("utf-8"))
    except Exception:
        pass
    new, changed = {}, []
    for u in urls:
        h = HASHES.get(u, "")
        o = old.get(u) or {}
        if o.get("h") == h:
            new[u] = o
        else:
            new[u] = {"h": h, "d": TODAY}
            changed.append(DOMAIN + u)
    gone = [DOMAIN + u for u in old if u not in new]
    json.dump(new, open(os.path.join(SITE, "manifest.json"), "w"), separators=(",", ":"))
    open(os.path.join(SITE, "indexnow.txt"), "w").write("\n".join((changed + gone)[:10000]) + "\n")
    if S.get("indexnow_key"):
        open(os.path.join(SITE, S["indexnow_key"] + ".txt"), "w").write(S["indexnow_key"])
    return new


# ---------- content blocks ----------
def place_url(r):
    return "/places/%s/" % slugify(r["listing_id"])


def owner_line(r):
    return ('<p class="st-owner">Owned by <b>%s</b></p>' % e(r["founder"])) if r.get("founder") else ""


def place_item(r):
    cid, label, _ = cat_of(r)
    where = ", ".join(x for x in [r.get("city"), r.get("region")] if x)
    deal = ('<p class="st-deal">Member deal: %s</p>' % e(r["member_deal"])) if r.get("member_deal") else ""
    return ('<li class="st-item"><h3><a href="%s">%s</a></h3><p class="st-meta">%s%s</p>%s%s%s</li>'
            % (place_url(r), e(r["name"]), e(label), (" · " + e(where)) if where else "",
               ('<p>%s</p>' % e(r["short_description"])) if r.get("short_description") else "", owner_line(r), deal))


def biz_ld(r, cid_schema=None):
    cid, label, schema = cat_of(r)
    d = {"@context": "https://schema.org", "@type": cid_schema or schema, "name": r["name"], "url": DOMAIN + place_url(r)}
    if r.get("short_description"):
        d["description"] = r["short_description"]
    if r.get("address") or r.get("city"):
        d["address"] = {"@type": "PostalAddress", "streetAddress": r.get("address", ""), "addressLocality": r.get("city", ""),
                        "addressRegion": r.get("region", ""), "addressCountry": r.get("country", "")}
    if r.get("lat") and r.get("lng"):
        try:
            d["geo"] = {"@type": "GeoCoordinates", "latitude": float(r["lat"]), "longitude": float(r["lng"])}
        except ValueError:
            pass
    if r.get("founder"):
        d["founder"] = {"@type": "Person", "name": r["founder"]}
    same = [x for x in [url_fix(r.get("website")), ig_url(r.get("instagram"))] if x]
    if same:
        d["sameAs"] = same
    if r.get("photo_url"):
        d["image"] = r["photo_url"]
    d["keywords"] = "woman-owned, women-owned business, " + label
    return d


def crumbs(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": DOMAIN + u} for i, (n, u) in enumerate(items)]}


# ---------- build ----------
def main():
    listings, cities = load()
    rows = [r for r in listings if r.get("name") and r.get("listing_id") and r.get("approval", "Approved").startswith("Approved")]
    city_info = {c.get("city_guide"): c for c in cities if c.get("city_guide")}
    places = [r for r in rows if r.get("listing_type") == "Place"]
    others = [r for r in rows if r.get("listing_type") != "Place"]
    by_city = {}
    for r in places:
        if r.get("city_guide"):
            by_city.setdefault(r["city_guide"], []).append(r)
    guides = {g: rs for g, rs in by_city.items() if len(rs) >= 2}

    def cname(g):
        c = city_info.get(g, {})
        if c.get("display_name"):
            return c["display_name"]
        rs = by_city.get(g) or []
        return rs[0]["city"] if rs and rs[0].get("city") else g.replace("-", " ").title()

    def cregion(g):
        rs = by_city.get(g) or []
        regs = [r.get("region") for r in rs if r.get("region")]
        return max(set(regs), key=regs.count) if regs else ""

    if os.path.isdir(SITE):
        shutil.rmtree(SITE)
    os.makedirs(SITE)
    shutil.copytree(os.path.join(ROOT, "app"), os.path.join(SITE, "assets"))
    open(os.path.join(SITE, "CNAME"), "w").write(DOMAIN.split("//")[1] + "\n")
    urls = []

    countries = len(set(r.get("country") for r in places if r.get("country")))
    order = sorted(guides, key=lambda g: (-len(guides[g]), cname(g)))

    # --- home ---
    top = order[:12]
    body = ['<section class="st-hero"><h1>Go where women own the place</h1>'
            '<p class="st-lede">The Woman-Owned Map is a free directory of %s woman-owned places to visit in %d countries: restaurants, cafes, bookstores, hotels, shops and walking tours, plus %d woman-owned tour companies, trip companies and travel brands. Search a city, save the places you love, and turn your list into a walking route.</p>'
            '<p class="st-lede">Every listing is at least 50%% owned by a woman. The map is built by <a href="https://sheswanderful.com">Wanderful</a>, a community of women who travel, and anyone can add a place.</p></section>'
            % ("{:,}".format(len(places)), countries, len(others))]
    body.append('<section><h2>City guides</h2><ul class="st-cities">%s</ul><p><a href="/cities/">See all %d city guides</a></p></section>'
                % ("".join('<li><a href="/%s/">Woman-owned %s</a> <span>%s</span></li>' % (g, e(cname(g)), plural(len(guides[g]), "place")) for g in top), len(guides)))
    by_type = {}
    for r in others:
        by_type.setdefault(cat_of(r)[1], []).append(r)
    body.append('<section><h2>Woman-owned tours, trip companies and travel brands</h2>%s</section>' % "".join(
        '<h3>%s</h3><ul class="st-links">%s</ul>' % (e(t), "".join('<li><a href="%s">%s</a></li>' % (place_url(r), e(r["name"])) for r in sorted(rs, key=lambda x: x["name"].lower())))
        for t, rs in sorted(by_type.items())))
    home_ld = [{"@context": "https://schema.org", "@type": "WebSite", "name": "Woman-Owned Map", "url": DOMAIN + "/",
                "publisher": {"@type": "Organization", "name": "Wanderful", "url": "https://sheswanderful.com", "logo": DOMAIN + "/assets/logo.png",
                              "sameAs": ["https://www.instagram.com/womanownedmap", "https://sheswanderful.com"]}}]
    write("/", page("/", "Woman-Owned Map: woman-owned places to visit, by city | Wanderful",
                    "A free directory of %s woman-owned restaurants, cafes, shops, hotels and tours in %d countries, with city guides and walking routes. By Wanderful." % ("{:,}".format(len(places)), countries),
                    "\n".join(body), home_ld))
    urls.append("/")

    # --- all cities ---
    groups = {}
    for g in order:
        rs = guides[g]
        cs = [r.get("country") for r in rs if r.get("country")]
        groups.setdefault(max(set(cs), key=cs.count) if cs else "", []).append(g)
    body = ['<section class="st-hero"><h1>Woman-owned city guides</h1><p class="st-lede">%d city guides to woman-owned restaurants, shops, stays and things to do. Each guide has a map, the owners\' names, and a walking route you can build as you go.</p></section>' % len(guides)]
    for country in sorted(groups, key=lambda c: (c != "US", c)):
        body.append('<section><h2>%s</h2><ul class="st-cities">%s</ul></section>' % (e({"US": "United States", "": "More places"}.get(country, country)),
                    "".join('<li><a href="/%s/">%s</a> <span>%s</span></li>' % (g, e(cname(g)), plural(len(guides[g]), "place")) for g in sorted(groups[country], key=cname))))
    write("/cities/", page("/cities/", "Woman-owned city guides | Woman-Owned Map",
                           "Browse %d city guides to woman-owned restaurants, shops, hotels and things to do." % len(guides), "\n".join(body),
                           [crumbs([("Woman-Owned Map", "/"), ("City guides", "/cities/")])], 'data-view="cities"'))
    urls.append("/cities/")

    # --- city guides ---
    for g in order:
        rs = sorted(guides[g], key=lambda r: (not r.get("photo_url"), r["name"].lower()))
        c = city_info.get(g, {})
        name, region = cname(g), cregion(g)
        place_name = name + (", " + region if region and region != name else "")
        counts = {}
        for r in rs:
            counts.setdefault(cat_of(r)[1], []).append(r)
        summary = ", ".join("%d %s" % (len(v), k.lower()) for k, v in sorted(counts.items(), key=lambda kv: -len(kv[1])))
        highlights = [r["name"] + (" (owned by %s)" % r["founder"] if r.get("founder") else "") for r in rs[:4]]
        answer = ("The Woman-Owned Map lists %s in %s: %s. Places to start include %s."
                  % (plural(len(rs), "woman-owned place"), place_name, summary, ", ".join(highlights[:-1]) + " and " + highlights[-1] if len(highlights) > 1 else highlights[0]))
        body = ['<nav class="st-crumbs"><a href="/">Woman-Owned Map</a> › <a href="/cities/">City guides</a> › %s</nav>' % e(name),
                '<section class="st-hero"><h1>Woman-owned %s</h1><p class="st-answer">%s</p>%s</section>'
                % (e(place_name), e(answer), ('<p class="st-lede">%s</p>' % e(c["intro"])) if c.get("intro") else "")]
        for label, items in sorted(counts.items(), key=lambda kv: -len(kv[1])):
            body.append('<section><h2>%s in %s</h2><ul class="st-list">%s</ul></section>' % (e(label), e(name), "".join(place_item(r) for r in items)))
        extra = []
        for key, lab in [("getting_there", "Getting there"), ("getting_around", "Getting around"), ("good_to_know", "Good to know")]:
            if c.get(key):
                extra.append('<h3>%s</h3><p>%s</p>' % (lab, e(c[key])))
        if extra:
            body.append('<section><h2>Know before you go</h2>%s</section>' % "".join(extra))
        if c.get("local_hub_url"):
            body.append('<section><h2>Meet women who travel in %s</h2><p>%s</p><p><a href="%s">Join the %s</a></p></section>'
                        % (e(name), e(c.get("hub_about") or "Wanderful's local hub hosts meetups at places in this guide and shares local tips."),
                           e(c["local_hub_url"]), e(c.get("local_hub_name") or "Wanderful local hub")))
        body.append('<section><h2>Know a woman-owned place in %s we\'re missing?</h2><p><a href="%s">Add it to the map</a>. It takes about two minutes.</p></section>' % (e(name), e(S["submit_url"])))
        ld = [crumbs([("Woman-Owned Map", "/"), ("City guides", "/cities/"), (name, "/%s/" % g)]),
              {"@context": "https://schema.org", "@type": "ItemList", "name": "Woman-owned places in " + place_name, "numberOfItems": len(rs),
               "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": DOMAIN + place_url(r), "name": r["name"]} for i, r in enumerate(rs)]}]
        desc = "%s in %s, with owners' names, a map and walking routes. %s." % (plural(len(rs), "woman-owned place"), place_name, summary[0].upper() + summary[1:])
        write("/%s/" % g, page("/%s/" % g, ("Woman-owned %s: %s to visit" % (name, plural(len(rs), "place"))) + (" | Woman-Owned Map" if len(name) < 18 else ""), desc[:300], "\n".join(body), ld, 'data-city="%s"' % e(g)))
        urls.append("/%s/" % g)

    # --- place pages ---
    seen = set()
    for r in rows:
        u = place_url(r)
        if u in seen:
            continue
        seen.add(u)
        cid, label, schema = cat_of(r)
        g = r.get("city_guide") if r.get("city_guide") in guides else ""
        where = ", ".join(x for x in [r.get("city"), r.get("region"), r.get("country")] if x)
        lead = "%s is a woman-owned %s%s." % (r["name"], noun_of(r), (" in " + where) if where and r.get("listing_type") == "Place" else "")
        facts = []
        if r.get("founder"):
            facts.append(("Owned by", e(r["founder"])))
        if r.get("address"):
            facts.append(("Address", e(", ".join(x for x in [r["address"], r.get("city"), r.get("region")] if x))))
        if r.get("ownership_badges"):
            facts.append(("Also", e(r["ownership_badges"])))
        if r.get("accessibility"):
            facts.append(("Accessibility", e(r["accessibility"])))
        if r.get("member_deal"):
            facts.append(("Wanderful member deal", e(r["member_deal"]) + ' (<a href="https://sheswanderful.com/join">members get the code</a>)'))
        links = []
        if url_fix(r.get("website")):
            links.append('<a href="%s" rel="noopener">Website</a>' % e(url_fix(r["website"])))
        if ig_url(r.get("instagram")):
            links.append('<a href="%s" rel="noopener">Instagram</a>' % e(ig_url(r["instagram"])))
        if r.get("google_maps_link"):
            links.append('<a href="%s" rel="noopener">Google Maps</a>' % e(r["google_maps_link"]))
        elif r.get("google_place_id"):
            links.append('<a href="https://www.google.com/maps/search/?api=1&query=%s&query_place_id=%s" rel="noopener">Google Maps</a>' % (e(r["name"]), e(r["google_place_id"])))
        more = ""
        if g:
            near = [x for x in guides[g] if x is not r][:6]
            more = '<section><h2>More woman-owned places in %s</h2><ul class="st-links">%s</ul><p><a href="/%s/">See the full %s guide</a></p></section>' % (
                e(cname(g)), "".join('<li><a href="%s">%s</a></li>' % (place_url(x), e(x["name"])) for x in near), g, e(cname(g)))
        qa = [("Is %s woman-owned?" % r["name"],
               "Yes. %s is at least 50%% owned by women%s. It is listed on the Woman-Owned Map by Wanderful, a free directory of woman-owned places to visit." % (r["name"], (", and is owned by " + r["founder"]) if r.get("founder") else ""))]
        if r.get("listing_type") == "Place" and where:
            qa.append(("Where is %s?" % r["name"], "%s is in %s%s." % (r["name"], where, (", at " + r["address"]) if r.get("address") else "")))
        if g:
            qa.append(("What other woman-owned places are in %s?" % cname(g), "The Woman-Owned Map lists %d woman-owned places in %s, including %s." % (len(guides[g]), cname(g), ", ".join([x["name"] for x in guides[g] if x is not r][:3]))))
        more = '<section class="st-qa"><h2>Quick answers</h2>%s</section>' % "".join("<h3>%s</h3><p>%s</p>" % (e(q), e(a)) for q, a in qa) + more
        trail = [("Woman-Owned Map", "/")] + ([("City guides", "/cities/"), (cname(g), "/%s/" % g)] if g else []) + [(r["name"], u)]
        body = ('<nav class="st-crumbs">%s</nav><article class="st-place"><p class="st-meta">%s</p><h1>%s</h1><p class="st-answer">%s</p>%s%s<dl class="st-facts">%s</dl>%s</article>%s'
                % (" › ".join('<a href="%s">%s</a>' % (x[1], e(x[0])) for x in trail[:-1]) + " › " + e(r["name"]),
                   e(label), e(r["name"]), e(lead),
                   ('<p>%s</p>' % e(r["short_description"])) if r.get("short_description") else "",
                   ('<p><b>Don\'t miss:</b> %s</p>' % e(r["why_visit"])) if r.get("why_visit") else "",
                   "".join("<dt>%s</dt><dd>%s</dd>" % f for f in facts),
                   ('<p class="st-links2">%s</p>' % " · ".join(links)) if links else "", more))
        desc = (r.get("short_description") or lead)
        if len(desc) < 90:
            desc += " See it on the Woman-Owned Map%s." % ((", with %d more woman-owned places in %s" % (len(guides[g]) - 1, cname(g))) if g else "")
        if r.get("founder"):
            desc = "Woman-owned, by %s. %s" % (r["founder"], desc)
        attrs = ('data-city="%s" ' % e(g) if g else 'data-view="browse" ') + 'data-place="%s"' % e(r["listing_id"])
        title = "%s, %s: woman-owned %s" % (r["name"], r["city"], noun_of(r)) if r.get("city") and r.get("listing_type") == "Place" else "%s: woman-owned %s" % (r["name"], noun_of(r))
        if len(title) + 18 <= 65:
            title += " | Woman-Owned Map"
        faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qa]}
        write(u, page(u, title, desc[:300], body, [crumbs(trail), biz_ld(r), faq], attrs))
        old = (r.get("old_seeker_slug") or "").strip().strip("/")
        if old and re.fullmatch(r"[A-Za-z0-9_\-]+/[A-Za-z0-9_\-.,%]+", old):
            moved("/place/%s/" % old, u)
        urls.append(u)

    # --- about ---
    ABOUT_FAQ = [
        ("What is the Woman-Owned Map?", "A free directory of woman-owned places to visit: hotels, cafes, restaurants, shops, bookstores, breweries, wellness spaces and walking tours, plus woman-founded trip companies, planners and travel brands. Search a city, save the places you love, and turn your list into a walking route."),
        ("What counts as woman-owned?", "A business is listed when it is at least 50% owned by one or more women, including businesses co-owned equally with a partner. Founded by a woman isn't enough on its own. Places on the map need a location travelers can visit."),
        ("Who adds the listings?", "Owners list their own businesses, travelers recommend places they love, and the Wanderful team reviews every submission before it goes live. Listing is always free."),
        ("What do the badges mean?", "Owner verified means the owner submitted or confirmed the listing herself. Certified woman-owned means the business holds a woman-owned certification or is marked women-owned on Google. Badges like Black-owned or LGBTQ+-owned come from owners or the people who nominated them. Member deal means the owner offers something special to Wanderful members."),
        ("How do member deals work?", "Anyone can see which businesses offer a deal. Wanderful members get the codes and redemption details inside the member community."),
        ("Something is wrong or a place closed. What do I do?", "Open the place and tap Report a problem, or use the update form. Our team checks every report and updates the listing, usually within a few days."),
        ("I own a business. How do I update my listing or add a deal?", "Use the update form to change your details, add photos or offer a deal for Wanderful members. Entrepreneur members can also get a Member Host listing with their photo and story."),
        ("Does it cost anything?", "No. The map is free to use and free to be listed on."),
    ]
    # DRAFT COPY: Beth to rewrite in her own words.
    def fig(src, cap, cls=""):
        return '<figure class="ab-fig %s"><img src="/assets/photos/%s" alt="%s" loading="lazy"><figcaption>%s</figcaption></figure>' % (cls, src, e(cap), e(cap))
    def card(h, t, links):
        return '<li class="ab-card"><h3>%s</h3><p>%s</p><p class="ab-links">%s</p></li>' % (h, t, "".join('<a class="ab-btn" href="%s">%s</a>' % (e(u), e(l)) for l, u in links))
    news = S.get("newsletter_url", "https://sheswanderful.beehiiv.com/subscribe")
    body = ['<div class="ab">',
            '<section class="ab-hero"><div><span class="ab-eyebrow">About the map</span><h1>Every trip is a chance to put money in the hands of women</h1>'
            '<p class="ab-lede">The Woman-Owned Map is a free directory of %s woman-owned restaurants, cafes, shops, stays and things to do in %d countries, plus %d woman-owned tour companies, trip planners and travel brands. It\'s free to use and free to be listed.</p>'
            '<p class="ab-links"><a class="ab-btn ab-pri" href="/#browse">Explore the map</a><a class="ab-btn" href="%s">Get our newsletter</a></p></div>'
            % ("{:,}".format(len(places)), countries, len(others), e(news))
            + fig("about-margin-notes.webp", "Sarah Miller of Margin Notes Bookbar in El Paso, TX") + '</section>',
            '<section class="ab-split">' + fig("corazon.webp", "Wanderful creators with Dulcinea Herrera of Cafe Corazon in Kansas City, MO") +
            '<div><h2>Why we built it</h2>'
            '<p>Women own a huge share of the small businesses that make a place worth visiting, but they\'re still harder to find and harder to fund. We wanted one place where you could plan a trip around the women who run a city: who to eat with, where to stay, what to bring home. Every listing names the woman behind it, so you know who you\'re supporting.</p>'
            '<h2>How a place gets on the map</h2>'
            '<p>A business has to be at least 50%% owned by a woman (founded isn\'t enough). Owners can add themselves, and anyone can add a place they love using the same form. Owners who confirm their listing get an <b>Owner verified</b> badge, and businesses with a woman-owned certification, or marked women-owned on Google, get a <b>Certified woman-owned</b> badge. Some owners also offer a deal for Wanderful members.</p>'
            '<p class="ab-links"><a class="ab-btn" href="%s">Add a place</a></p></div></section>'
            % e(S["submit_url"]),
            '<section class="ab-who"><h2>Who we are</h2>'
            '<p class="ab-lede">The map is made by <a href="https://sheswanderful.com/about/">Wanderful</a>, a global community for women who travel. Beth Santos started Wanderful as a travel blog in 2009, and it has grown into a membership community with local hubs around the world, small-group trips, the Women in Travel Summit (WITS) for travel creators, and Siren, our home for reported stories about the women shaping travel. Beth is also the author of <i>Wander Woman</i> and the host of the <i>Wander Woman</i> travel series.</p>'
            '<div class="ab-strip">' + fig("about-wits.webp", "Creators at WITS 2025") + fig("about-peru.webp", "A Wanderful trip to Peru") + fig("about-wits-party.webp", "The WITS opening party") + '</div></section>',
            '<section class="ab-news"><div><h2>Get the map in your inbox</h2><p>New woman-owned places, member deals, trips and stories from the Wanderful community. Free, and you can unsubscribe any time.</p></div>'
            '<p class="ab-links"><a class="ab-btn ab-pri" href="%s">Subscribe free</a></p></section>' % e(news),
            '<section class="ab-join"><h2>Ways to join in</h2><ul class="ab-cards">%s</ul></section>' % "".join([
                card("Become a Wanderful member", "Member deals from the businesses on this map, local hubs and meetups, virtual events and a community of women who travel.", [("Join Wanderful", "https://sheswanderful.com/join")]),
                card("Get our newsletter", "New woman-owned places, member deals, trips and stories from the community, in your inbox.", [("Subscribe free", news)]),
                card("Travel with us", "Small-group trips with Wanderful, plus trips hosted by women-owned companies and our members.", [("Wanderful trips", "https://sheswanderful.com/trips"), ("Woman-owned trips", S["trips_url"])]),
                card("List your business, bigger", "Entrepreneur members get a Member Host listing with their photo and story, top placement and a spot in our newsletter.", [("Entrepreneur membership", "https://sheswanderful.com/join-smb")]),
                card("Read Siren", "New stories every Monday about the women shaping travel, from the people who know them best.", [("Subscribe to Siren", "https://sirenbywanderful.substack.com")]),
                card("Come to WITS", "The Women in Travel Summit brings together travel creators, brands and destinations every year.", [("Women in Travel Summit", "https://witsummit.com/")]),
                card("Wander Woman", "Beth\'s book about the history and future of women who travel, and the travel series that brings it to the screen.", [("Read the book", "https://sheswanderful.com/wanderwomanbook"), ("Follow the show", "https://www.instagram.com/wanderwomanshow")]),
                card("Follow the map", "New places, recent member deals and the women behind them.", [("@womanownedmap", "https://www.instagram.com/womanownedmap"), ("@sheswanderful", "https://www.instagram.com/sheswanderful")]),
                card("Partner with us", "Destinations and brands work with Wanderful to spotlight the women behind their hotels, restaurants, shops and tours.", [("Work with Wanderful", "https://sheswanderful.com/collaborate")]),
            ]),
            '<section class="ab-faq" id="faq"><h2>Questions</h2>%s</section>' % "".join('<details><summary>%s</summary><p>%s</p></details>' % (e(q), e(a)) for q, a in ABOUT_FAQ),
            '</div>']
    write("/about/", page("/about/", "About the Woman-Owned Map | Wanderful",
                          "Why we built a free map of woman-owned places to visit, how businesses get listed, who Wanderful is and how to join in.",
                          "\n".join(body), [crumbs([("Woman-Owned Map", "/"), ("About", "/about/")]),
                          {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in ABOUT_FAQ]},
                          {"@context": "https://schema.org", "@type": "AboutPage", "name": "About the Woman-Owned Map", "url": DOMAIN + "/about/",
                           "publisher": {"@type": "Organization", "name": "Wanderful", "url": "https://sheswanderful.com", "foundingDate": "2009", "founder": {"@type": "Person", "name": "Beth Santos"}}}],
                          noapp=True))
    urls.append("/about/")

    # --- short links ---
    for path, to in S.get("short_links", {}).items():
        short_link(path, to)

    # --- 404, sitemap, robots, llms.txt ---
    write("/404.html", page("/404.html", "Page not found | Woman-Owned Map", "This page isn't on the map.",
                            '<script>if(/^\\/place\\//.test(location.pathname))location.replace("/");</script><section class="st-hero"><h1>That page isn\'t on the map</h1><p><a href="/">Go to the Woman-Owned Map</a> or <a href="/cities/">browse city guides</a>.</p></section>', noapp=True).replace('<link rel="canonical" href="%s/404.html">' % DOMAIN, ""))
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    dates = page_dates(urls)
    sm += ["<url><loc>%s%s</loc><lastmod>%s</lastmod></url>" % (DOMAIN, u, dates[u]["d"]) for u in urls]
    sm.append("</urlset>")
    open(os.path.join(SITE, "sitemap.xml"), "w").write("\n".join(sm) + "\n")
    open(os.path.join(SITE, "robots.txt"), "w").write("User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % DOMAIN)
    llms = ["# Woman-Owned Map", "",
            "> A free directory of %s woman-owned places to visit (restaurants, cafes, shops, hotels, things to do) in %d countries, plus %d woman-owned tour companies, trip companies and travel brands. Every listing is at least 50%% woman-owned. Built by Wanderful (sheswanderful.com), a community of women who travel." % ("{:,}".format(len(places)), countries, len(others)),
            "", "Each city guide lists places with their owner's name, category, neighborhood and a short description. Each place has its own page.", "",
            "## City guides", ""]
    llms += ["- [Woman-owned %s](%s/%s/): %s" % (cname(g), DOMAIN, g, plural(len(guides[g]), "place")) for g in order]
    llms += ["", "## More", "", "- [About the map and Wanderful](%s/about/)" % DOMAIN, "- [All city guides](%s/cities/)" % DOMAIN, "- [Woman-owned trips](%s)" % S["trips_url"], "- [Add a place](%s)" % S["submit_url"], "- [Wanderful](https://sheswanderful.com)"]
    open(os.path.join(SITE, "llms.txt"), "w").write("\n".join(llms) + "\n")
    print("Built %d pages: %d city guides, %d places and listings." % (len(urls), len(guides), len(seen)))


if __name__ == "__main__":
    main()
