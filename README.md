# Knox Nuvio Fire TV 3.0.7

Runtime-compatibility build for Nuvio/Fire TV.

## Fixes
- All manifest scrapers remain enabled.
- Provider entry points are kept lightweight at import time.
- MkvBase is transpiled to ES5/CommonJS for Hermes/QuickJS-style plugin runtimes.
- MkvBase no longer requires `fs`, `path`, or Node `crypto` during module load.
- MkvBase browser/FlareSolverr paths are lazy and safely return no result when Chromium is unavailable.
- Host resolver no longer crashes at import when Node `crypto` is unavailable.
- MovieBlast no longer crashes the repository at import when `crypto-js` is unavailable; it returns no MovieBlast streams instead.
- Existing `cheerio-without-node-native` provider dependencies are retained because Nuvio plugin runtimes commonly provide that module.

## Important
MkvBase's protected-site browser challenge cannot be bypassed by a Fire TV JavaScript sandbox alone. The plugin therefore fails fast instead of blocking the entire provider set when its browser/FlareSolverr resolver is unavailable.
