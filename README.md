# Knox 3.0.3 — Nuvio TV / Fire TV build

Nuvio plugin repository for Android TV / Amazon Fire TV devices.

## What was fixed

- Transpiled providers that used `async`/`await` into Promise/generator-compatible JavaScript for the Nuvio sandbox.
- Kept the required `getStreams(tmdbId, mediaType, season, episode)` export on every provider.
- Disabled MovieBlast because it imports `crypto-js`, a dependency that is not included by this repository and is not safe to assume is available in the Nuvio sandbox.
- Preserved the existing provider logic and stream metadata.
- Updated the repository version to `3.0.3-firetv`.

## Fire TV / Firestick

This repository is a Nuvio plugin repository; it does not control the Fire TV user interface. Nuvio provides the TV/remote-friendly UI, while these plugins return streams.

Add the repository's `manifest.json` URL in Nuvio's **Plugins** section. Plugin support depends on the Nuvio build; some store-distributed builds do not support plugins.

## Validation

All provider files were syntax-checked after transpilation, and every provider was checked for a `getStreams` export. Live scraper/network availability is not guaranteed because third-party source domains can change or block requests.
\n## Fire TV MkvBase fix (3.0.6)\n- MkvBase is registered in manifest.json.\n- `hostResolver.js` is included.\n- Browser/FlareSolverr session startup is lazy to prevent plugin-load stalls.\n- Uses runtime fetch when available, avoiding a hard dependency on node-fetch.\n