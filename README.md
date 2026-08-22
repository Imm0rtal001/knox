# Knox Fire TV Providers — 3.6.2

Compatibility fix for Nuvio TV / Fire TV plugin runtime.

## Fixes in this build
- Transpiled all provider files to remove runtime `async/await` syntax that can fail in Nuvio's dynamically loaded JavaScript environment.
- Preserved every scraper as enabled; no scraper was disabled.
- Fixed MkvBase so numeric TMDB IDs are resolved to the movie/series title before searching.
- Kept provider failures isolated so one provider returning an error does not prevent the remaining providers from running.

## Important
This package only fixes the plugin/runtime integration. Third-party source sites can still change, block requests, require authentication, or return no usable source.
