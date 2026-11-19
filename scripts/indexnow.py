"""After a deploy, tell Bing (and other IndexNow search engines) which pages changed.
Reads the list the build published at /indexnow.txt. Safe to run when nothing changed."""
import json, os, sys, time, urllib.error, urllib.request

S = json.load(open("site.json"))
DOMAIN, KEY = S["domain"].rstrip("/"), S.get("indexnow_key")


BUST = "?v=" + os.environ.get("GITHUB_SHA", str(int(time.time())))   # skip stale cached copies


def done(msg):
    print(msg)
    sys.exit(0)       # nothing to send is not a failure


def get(url):
    with urllib.request.urlopen(url + BUST, timeout=30) as f:
        return f.read().decode("utf-8")


if not KEY:
    done("No indexnow_key in site.json; skipping.")
urls = []
for attempt in range(6):          # give GitHub Pages a moment to serve the new files
    try:
        if get("%s/%s.txt" % (DOMAIN, KEY)).strip() == KEY:
            urls = [u for u in get(DOMAIN + "/indexnow.txt").split() if u.startswith(DOMAIN)]
            break
    except Exception:
        pass
    time.sleep(30)
if not urls:
    done("Nothing changed (or the new files aren't live yet); nothing sent.")
body = json.dumps({"host": DOMAIN.split("//")[1], "key": KEY, "keyLocation": "%s/%s.txt" % (DOMAIN, KEY), "urlList": urls[:10000]}).encode()
req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, headers={"Content-Type": "application/json; charset=utf-8"})
try:
    with urllib.request.urlopen(req, timeout=60) as f:
        print("IndexNow: sent %d changed pages (HTTP %s)" % (len(urls), f.status))
except urllib.error.HTTPError as err:
    print("IndexNow answered HTTP %s: %s" % (err.code, err.read()[:300]))
