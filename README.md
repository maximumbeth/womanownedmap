# womanownedmap.com

The Woman-Owned Map by [Wanderful](https://sheswanderful.com): a free directory of woman-owned places to visit.

Every city guide and every place has its own page, written out in plain HTML so Google and AI tools can read it. The interactive map loads on top of each page for visitors.

## How it updates

You don't edit anything here day to day. The site rebuilds itself from the **Woman-Owned Master Sheet**:

- **Every night** at about 3am Boston time.
- **Right away** if you want: open the **Actions** tab, pick "Build and publish womanownedmap.com", and click **Run workflow**.

Approve a listing in the master sheet, and it gets its own page on the next build. If the sheet ever comes back nearly empty, the build stops and the live site stays as it was.

## What's in here

| File | What it is |
| --- | --- |
| `build.py` | Reads the Public Feed and writes every page into `site/` |
| `site.json` | Domain, Google Analytics ID, trips link and "Add a place" form link |
| `app/` | The interactive map (the same code as the Squarespace version), its settings in `config.js`, styles and photos |
| `.github/workflows/build.yml` | The nightly build and publish |

## Common changes

- **Google Analytics:** put the Measurement ID (starts with `G-`) in `site.json`.
- **Map settings** such as form links, deal links or the membership pitch: edit `app/config.js`.
- **Test a build on your computer:** `python3 build.py`, then open `site/index.html` through a local web server.
