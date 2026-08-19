# Knox 3.1 Fire TV Fully Fixed

Nuvio provider repository optimized for Fire TV.

## Changes
- Standardized MkvBase manifest registration.
- Preserved all providers as enabled.
- Added a 12-second per-provider safety boundary.
- Clears safety timers after completion to avoid accumulating timers.
- Provider exceptions resolve to an empty stream list instead of crashing the whole plugin.
- Removed MovieBlast's hard `crypto-js` module-load dependency.
- MkvBase remains lazy/no-browser at startup.

External scraper websites can still change or block requests; this repository cannot guarantee third-party uptime.
