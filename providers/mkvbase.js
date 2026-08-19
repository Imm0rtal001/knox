/**
 * MkvBase - Nuvio Provider / Fire TV Responsive Edition
 *
 * Converted from the supplied mkvbase.js.
 *
 * Runtime goals:
 * - No fs/path/node-fetch/puppeteer dependencies.
 * - No startup browser/FlareSolverr work.
 * - No background timers.
 * - Short, bounded network requests.
 * - In-memory caching only.
 * - Uses the Nuvio provider contract: module.exports.getStreams(...)
 *
 * Note:
 * MkvBase may require Cloudflare clearance/session cookies. This provider
 * does not start Chromium or FlareSolverr inside Nuvio. If MkvBase does not
 * expose a usable session to the provider runtime, it returns [] quickly
 * rather than blocking the whole Nuvio request.
 */

const PROVIDER = "MkvBase";
const BASE_URL = "https://mkvbase.site";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = "307b7b8ef035c6aa336900aef4e203bd";
const UA = "Mozilla/5.0 (Linux; Android 11; AFTSSS) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36";

const REQUEST_TIMEOUT = 7000;
const TOTAL_TIMEOUT = 12000;
const SESSION_TTL = 30 * 60 * 1000;
const STREAM_CACHE_TTL = 20 * 60 * 1000;
const TMDB_CACHE_TTL = 60 * 60 * 1000;
const MAX_RESULTS = 8;

const streamCache = new Map();
const tmdbCache = new Map();
let session = null;

function now() {
  return Date.now();
}

function getCache(map, key, ttl) {
  const item = map.get(key);
  if (!item) return null;
  if (now() - item.ts > ttl) {
    map.delete(key);
    return null;
  }
  return item.value;
}

function putCache(map, key, value, max = 200) {
  map.set(key, { value, ts: now() });
  if (map.size > max) {
    const first = map.keys().next().value;
    if (first !== undefined) map.delete(first);
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
  ]);
}

async function fetchSafe(url, options = {}, timeout = REQUEST_TIMEOUT) {
  try {
    return await withTimeout(fetch(url, {
      ...options,
      headers: {
        "User-Agent": UA,
        "Accept": "application/json, text/plain, */*",
        ...(options.headers || {})
      }
    }), timeout);
  } catch (_) {
    return null;
  }
}

function parseCookies(value) {
  const out = {};
  String(value || "").split(";").forEach(part => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return out;
}

function cookieString(cookies) {
  return Object.keys(cookies).map(k => `${k}=${cookies[k]}`).join("; ");
}

function extractSetCookies(res) {
  try {
    if (res.headers && typeof res.headers.getSetCookie === "function") {
      return res.headers.getSetCookie();
    }
    const v = res.headers && res.headers.get ? res.headers.get("set-cookie") : "";
    return v ? [v] : [];
  } catch (_) {
    return [];
  }
}

function updateSessionFromResponse(res, fallbackUserAgent = UA) {
  const parts = extractSetCookies(res);
  if (!parts.length) return session;

  const cookies = parseCookies(session ? session.cookieHeader : "");
  for (const part of parts) {
    const first = String(part).split(";")[0];
    const i = first.indexOf("=");
    if (i > 0) cookies[first.slice(0, i).trim()] = first.slice(i + 1).trim();
  }

  const challenge = decodeURIComponent(cookies.mkv_challenge || "");
  const clientKey = cookies.mkv_client_key || "";
  const seq = cookies.mkv_seq || "1";

  if (challenge && clientKey) {
    session = {
      cookieHeader: cookieString(cookies),
      challenge,
      clientKey,
      seq,
      userAgent: fallbackUserAgent,
      ts: now()
    };
  }
  return session;
}

function usableSession() {
  if (!session) return false;
  if (now() - session.ts > SESSION_TTL) {
    session = null;
    return false;
  }
  return !!(session.cookieHeader && session.challenge && session.clientKey);
}

async function bootstrapSession() {
  if (usableSession()) return session;

  // One fast request only. No browser, no FlareSolverr, no retries.
  const res = await fetchSafe(BASE_URL + "/", {
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  }, 4500);

  if (res) updateSessionFromResponse(res);
  return usableSession() ? session : null;
}

function encodeQuery(query, timestamp) {
  const key = timestamp % 256;
  let encoded = "";
  for (let i = 0; i < query.length; i++) {
    encoded += (query.charCodeAt(i) ^ key).toString(16).padStart(2, "0");
  }
  return encoded;
}

/*
 * Web Crypto is available in modern JavaScript runtimes used by Nuvio.
 * Keeping crypto async avoids a large synchronous crypto dependency and
 * prevents Fire TV's JS thread from being blocked at startup.
 */
async function digestHex(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(x => x.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(keyText, text) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyText),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(sig))
    .map(x => x.toString(16).padStart(2, "0")).join("");
}

async function solvePow(prefix, difficulty, encodedQuery, deadline) {
  const zeros = "0".repeat(Math.max(0, Math.min(4, difficulty || 2)));

  for (let nonce = 0; nonce <= 50000; nonce++) {
    if (Date.now() > deadline) return null;

    const h1 = await digestHex(prefix + ":" + nonce);
    const finalHash = await digestHex(h1 + ":" + encodedQuery);

    if (finalHash.startsWith(zeros)) return nonce;
  }
  return null;
}

async function buildApiUrl(query, sess, deadline) {
  if (!sess) return null;

  const parts = String(sess.challenge).split(":");
  const prefix = parts[0];
  const difficulty = parseInt(parts[1] || "2", 10);

  if (!prefix || !sess.clientKey) return null;

  const timestamp = Date.now();
  const encodedQ = encodeQuery(query, timestamp);
  const nonce = await solvePow(prefix, difficulty, encodedQ, deadline);
  if (nonce === null) return null;

  const seq = sess.seq || "1";
  const ent = 10;
  const payload = `${encodedQ}:${timestamp}:${seq}:${nonce}:${ent}`;
  const sig = await hmacHex(sess.clientKey, payload);

  return `${BASE_URL}/api/links?q=${encodeURIComponent(encodedQ)}&t=${timestamp}&seq=${seq}&pow=${nonce}&ent=${ent}&sig=${sig}`;
}

async function fetchMkvBaseApi(query, deadline) {
  const sess = await bootstrapSession();
  if (!sess) return [];

  const url = await buildApiUrl(query, sess, deadline);
  if (!url) return [];

  const res = await fetchSafe(url, {
    headers: {
      "Cookie": sess.cookieHeader,
      "X-Requested-With": "XMLHttpRequest",
      "Referer": BASE_URL + "/"
    }
  }, Math.min(REQUEST_TIMEOUT, Math.max(1000, deadline - now())));

  if (!res || !res.ok) {
    if (res && (res.status === 401 || res.status === 403)) session = null;
    return [];
  }

  updateSessionFromResponse(res, sess.userAgent);

  try {
    const json = await res.json();
    return Array.isArray(json && json.results)
      ? json.results
          .map(x => ({ title: String(x.title || ""), url: String(x.url || "") }))
          .filter(x => x.url)
      : [];
  } catch (_) {
    return [];
  }
}

async function fetchTitleInfo(id, mediaType) {
  const cleanId = String(id || "").replace(/^tmdb:/, "");
  const key = `${mediaType}:${cleanId}`;
  const cached = getCache(tmdbCache, key, TMDB_CACHE_TTL);
  if (cached) return cached;

  const type = (mediaType === "tv" || mediaType === "series") ? "series" : "movie";

  // Fast Cinemeta lookup for IMDb IDs.
  if (/^tt\d+$/i.test(cleanId)) {
    const cine = await fetchSafe(
      `https://v3-cinemeta.strem.io/meta/${type}/${cleanId}.json`,
      {},
      2500
    );
    if (cine && cine.ok) {
      try {
        const data = await cine.json();
        if (data && data.meta && data.meta.name) {
          const info = {
            title: data.meta.name,
            year: String(data.meta.year || "").slice(0, 4),
            imdbId: data.meta.imdb_id || cleanId
          };
          putCache(tmdbCache, key, info);
          return info;
        }
      } catch (_) {}
    }
  }

  const endpoint = type === "series" ? "tv" : "movie";
  const res = await fetchSafe(
    `${TMDB_BASE}/${endpoint}/${encodeURIComponent(cleanId)}?api_key=${TMDB_KEY}&append_to_response=external_ids`,
    {},
    3500
  );

  if (!res || !res.ok) return null;

  try {
    const data = await res.json();
    const info = {
      title: type === "series" ? data.name : data.title,
      year: String(type === "series" ? data.first_air_date : data.release_date || "").slice(0, 4),
      imdbId: (data.external_ids && data.external_ids.imdb_id) || (/^tt\d+$/i.test(cleanId) ? cleanId : null)
    };
    if (info.title) putCache(tmdbCache, key, info);
    return info;
  } catch (_) {
    return null;
  }
}

function cleanTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/\bpart\s+(one|two|three)\b/gi, m => {
      const n = { one: "1", two: "2", three: "3" };
      return "part " + n[m.split(/\s+/)[1].toLowerCase()];
    })
    .replace(/[:\-(]/g, " ")
    .replace(/['"&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function yearsIn(text) {
  const out = new Set();
  const m = String(text || "").match(/\b(19\d{2}|20\d{2})\b/g) || [];
  m.forEach(x => out.add(x));
  return out;
}

function quality(text) {
  const s = String(text || "").toLowerCase();
  if (/(2160p|4k|uhd)/.test(s)) return "2160p";
  if (/(1440p|2k)/.test(s)) return "1440p";
  if (/1080p/.test(s)) return "1080p";
  if (/720p/.test(s)) return "720p";
  if (/480p/.test(s)) return "480p";
  return "HD";
}

function qualityWeight(q) {
  return ({ "2160p": 5, "1440p": 4, "1080p": 3, "720p": 2, "480p": 1, "HD": 1 })[q] || 0;
}

function is1080Plus(title) {
  return qualityWeight(quality(title)) >= 3;
}

function movieMatch(itemTitle, targetTitle, year) {
  const a = cleanTitle(itemTitle);
  const b = cleanTitle(targetTitle);

  if (!a || !b) return false;

  const targetTokens = b.split(" ").filter(x => x.length > 1);
  const matches = targetTokens.filter(x => a.includes(x)).length;
  const enough = matches >= Math.max(1, Math.ceil(targetTokens.length * 0.6));
  if (!enough) return false;

  if (year) {
    const ys = yearsIn(itemTitle);
    if (ys.size && !ys.has(year)) return false;
  }

  return true;
}

function dedupe(items) {
  const seen = new Set();
  return items.filter(x => {
    if (!x || !x.url || seen.has(x.url)) return false;
    seen.add(x.url);
    return true;
  });
}

function streamFromItem(item, info) {
  const q = quality(item.title);
  if (qualityWeight(q) < 3) return null;

  const raw = String(item.title || info.title || "MkvBase Release")
    .replace(/\s+/g, " ").trim();

  return {
    name: `[MkvBase] ${q}`,
    title: raw,
    url: item.url,
    quality: q,
    behaviorHints: {
      notWebReady: true
    }
  };
}

async function getStreams(tmdbId, mediaType, season, episode) {
  const started = Date.now();
  const cacheKey = `${mediaType}:${tmdbId}:${season || 0}:${episode || 0}`;

  const cached = getCache(streamCache, cacheKey, STREAM_CACHE_TTL);
  if (cached) return cached;

  const hardDeadline = started + TOTAL_TIMEOUT;
  const info = await fetchTitleInfo(tmdbId, mediaType);
  if (!info || !info.title || Date.now() >= hardDeadline) return [];

  const isTv = mediaType === "tv" || mediaType === "series";
  const baseTitle = cleanTitle(info.title);
  const queries = [];

  if (isTv && season && episode) {
    const s = String(season).padStart(2, "0");
    const e = String(episode).padStart(2, "0");
    queries.push(`${baseTitle} s${s}e${e}`, `${baseTitle} ${season}x${e}`);
  } else {
    if (info.year) queries.push(`${baseTitle} ${info.year}`);
    queries.push(baseTitle);
  }

  let matches = [];

  for (const q of queries) {
    if (Date.now() >= hardDeadline) break;

    const items = await fetchMkvBaseApi(q, hardDeadline);
    if (!items.length) continue;

    if (isTv && season && episode) {
      const token = `s${String(season).padStart(2, "0")}e${String(episode).padStart(2, "0")}`;
      matches = items.filter(x => {
        const t = String(x.title || "").toLowerCase();
        return t.includes(token) || t.includes(`${season}x${String(episode).padStart(2, "0")}`);
      });
    } else {
      matches = items.filter(x => movieMatch(x.title, info.title, info.year));
    }

    if (matches.length) break;
  }

  if (!matches.length) return [];

  const hd = matches.filter(x => is1080Plus(x.title));
  if (hd.length) matches = hd;

  matches = dedupe(matches).slice(0, MAX_RESULTS);

  const streams = [];
  for (const item of matches) {
    if (Date.now() >= hardDeadline) break;

    const stream = streamFromItem(item, info);
    if (stream) streams.push(stream);
  }

  streams.sort((a, b) => qualityWeight(b.quality) - qualityWeight(a.quality));
  putCache(streamCache, cacheKey, streams);

  return streams;
}

module.exports = {
  lookupIdType: "imdb",
  getStreams
};

/* Knox runtime safety wrapper: preserve provider behavior, bound failures, and
   clear the timeout after completion so Fire TV does not accumulate timers. */
(function () {
  try {
    if (typeof module === "undefined" || !module.exports ||
        typeof module.exports.getStreams !== "function") return;
    var originalGetStreams = module.exports.getStreams;
    var MAX_MS = 12000;
    module.exports.getStreams = function () {
      var args = arguments;
      var timer = null;
      var finished = false;
      var timeout = new Promise(function (resolve) {
        timer = setTimeout(function () {
          if (!finished) resolve([]);
        }, MAX_MS);
      });
      var call;
      try {
        call = Promise.resolve(originalGetStreams.apply(this, args));
      } catch (e) {
        if (timer) clearTimeout(timer);
        return Promise.resolve([]);
      }
      return Promise.race([call, timeout])
        .then(function (value) {
          finished = true;
          if (timer) clearTimeout(timer);
          return Array.isArray(value) ? value : [];
        })
        .catch(function () {
          finished = true;
          if (timer) clearTimeout(timer);
          return [];
        });
    };
  } catch (e) {}
})();
