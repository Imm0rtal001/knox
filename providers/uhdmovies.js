/* UHDMovies Nuvio provider - single-file bundle.
 * Configure TMDB_API_KEY below before use.
 * Runtime dependency: cheerio-without-node-native.
 * VideoSeed links are unwrapped via their public redirect Location where available.
 */
const cheerio = require("cheerio-without-node-native");


// ===== Inlined from http.js =====
// Minimal fetch-based replacement for the axios calls in the original code.
const BASE_URL = "https://uhdmovies.ceo";
const TMDB_API = "https://api.themoviedb.org/3";
const TMDB_API_KEY = "2315c44fee9ad6b8cd02933ac6393a60"; // Add your own TMDB v3 API key here

const commonHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// Turn a raw "set-cookie" header string into ["a=1", "b=2"]
function parseSetCookie(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/,(?=\s*[^;,\s]+=)/)
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean);
}

async function request(method, url, opts = {}) {
  const { headers = {}, body, signal, maxRedirects, validateStatus } = opts;
  const res = await fetch(url, {
    method,
    headers,
    body,
    signal,
    redirect: maxRedirects === 0 ? "manual" : "follow",
  });

  const outHeaders = {};
  if (res.headers && res.headers.forEach) {
    res.headers.forEach((v, k) => {
      outHeaders[k.toLowerCase()] = v;
    });
  }

  const okStatus = validateStatus ? validateStatus(res.status) : res.ok;
  if (!okStatus) throw new Error("HTTP " + res.status + " for " + url);

  const text = await res.text().catch(() => "");
  return { status: res.status, headers: outHeaders, data: text, url: res.url || url };
}

const get = (url, opts) => request("GET", url, opts);
const post = (url, body, opts = {}) => request("POST", url, { ...opts, body });


// ===== Inlined from bypass.js =====
// Ported from bypassThenaukriadda in the original stream.ts
async function bypassThenaukriadda(initialUrl, signal) {
  const headers = { ...commonHeaders, Referer: BASE_URL + "/" };

  // Step 1
  const res1 = await get(initialUrl, { headers, signal });
  const html1 = res1.data;

  const redirect1 = html1.match(/location\.replace\(["']([^"']+)["']\)/);
  if (redirect1 && !redirect1[1].includes("thenaukriadda")) {
    return redirect1[1].replace(/\\/g, "");
  }

  const c1 = parseSetCookie(res1.headers["set-cookie"]);
  let cookies = c1.length ? c1.join("; ") : "lp_ck_test=1";

  const $1 = cheerio.load(html1);
  const form1 = $1("form");
  const action1 = form1.attr("action") || initialUrl.split("?")[0];
  const input1 =
    form1.find("input[name='_lp_http']").val() ||
    form1.find("input[name='_wp_http']").val() ||
    form1.find("input").val() ||
    initialUrl.split("sid=")[1];

  if (!input1) return initialUrl;

  // Step 2
  const inputName1 = form1.find("input[name='_lp_http']").length ? "_lp_http" : "_wp_http";
  const params1 = new URLSearchParams();
  params1.append(inputName1, String(input1));

  const res2 = await post(action1, params1.toString(), {
    headers: {
      ...headers,
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: initialUrl,
      Cookie: cookies,
      Origin: new URL(action1).origin,
    },
    signal,
  });
  const c2 = parseSetCookie(res2.headers["set-cookie"]);
  if (c2.length) cookies += "; " + c2.join("; ");

  const $2 = cheerio.load(res2.data);
  const form2 = $2("#lp-s1-form, form[id*='lp-'], form[id*='wp-']").first();
  const action2 = form2.attr("action");

  if (!action2) {
    const directMatch = res2.data.match(/setAttribute\("href",\s*"(.*?)"/);
    return directMatch ? directMatch[1] : initialUrl;
  }

  // Step 3
  const params2 = new URLSearchParams();
  form2.find("input").each((_, el) => {
    const name = $2(el).attr("name");
    const val = $2(el).val();
    if (name) params2.append(name, val || "");
  });

  const res3 = await post(action2, params2.toString(), {
    headers: {
      ...headers,
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: action1,
      Cookie: cookies,
      Origin: new URL(action2).origin,
    },
    signal,
  });
  const c3 = parseSetCookie(res3.headers["set-cookie"]);
  if (c3.length) cookies += "; " + c3.join("; ");

  // Step 4
  const html3 = res3.data;
  const scMatch = html3.match(/sc\(["']([^"']+)["'],\s*["']([^"']+)["']/);
  if (!scMatch) {
    const directGo = html3.match(/href=["'](https?:\/\/[^"']+\?lp_go=[^"']+)["']/);
    if (directGo) return directGo[1];
    const directMatch = html3.match(/location\.replace\(["']([^"']+)["']\)/);
    if (directMatch) return directMatch[1].replace(/\\/g, "");
    return action2;
  }

  const tokenName = scMatch[1];
  const tokenVal = scMatch[2];
  const lpGoUrl = new URL(action2).origin + "/?lp_go=" + tokenName;
  cookies += "; " + tokenName + "=" + tokenVal;

  // Step 5
  const res4 = await get(lpGoUrl, {
    headers: { ...headers, Referer: action2, Cookie: cookies },
    signal,
  });
  const redirectMatch = res4.data.match(/location\.replace\(["']([^"']+)["']\)/);
  if (redirectMatch) return redirectMatch[1].replace(/\\/g, "");

  return res4.url || lpGoUrl;
}


// ===== Inlined from driveseed.js =====
const DRIVE_HEADERS = commonHeaders;

const MEDIA_RE = /\.(mp4|mkv|m3u8)($|\?)/i;
const isMediaHost = (href) =>
  href.includes("workers.dev") ||
  href.includes("r2.dev") ||
  href.includes("drive.google.com") ||
  href.includes("video-seed.dev") ||
  MEDIA_RE.test(href);

const safeDecode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch (e) {
    return s;
  }
};

// VideoSeed is a short-lived redirect/CDN handoff, not a permanent file host.
// Prefer the redirect Location header; do not follow it to an HTML landing page.
function unwrapVideoSeedUrl(candidate) {
  if (!candidate || typeof candidate !== "string") return null;
  try {
    const u = new URL(candidate);
    if (!/(^|\.)video-seed\.dev$/i.test(u.hostname)) return candidate;
    const embedded = u.searchParams.get("url");
    if (embedded && /^https?:\/\//i.test(embedded)) return embedded;
    return null;
  } catch (e) {
    return null;
  }
}

async function resolveVideoSeedUrl(candidate, signal) {
  const embedded = unwrapVideoSeedUrl(candidate);
  if (embedded && embedded !== candidate) return embedded;
  if (!candidate || !/video-seed\.dev/i.test(candidate)) return candidate;

  try {
    const response = await request("HEAD", candidate, {
      headers: { ...commonHeaders, Referer: "https://driveseed.org/" },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      signal,
    });
    const location = response.headers.location;
    if (location) {
      const absolute = new URL(location, candidate).href;
      const fromLocation = unwrapVideoSeedUrl(absolute);
      if (fromLocation && fromLocation !== absolute) return fromLocation;
      if (!/video-seed\.dev/i.test(absolute)) return absolute;
    }
  } catch (e) {
    // Some CDN edges do not support HEAD; try a non-following GET below.
  }

  try {
    const response = await get(candidate, {
      headers: { ...commonHeaders, Referer: "https://driveseed.org/" },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      signal,
    });
    const location = response.headers.location;
    if (location) {
      const absolute = new URL(location, candidate).href;
      const fromLocation = unwrapVideoSeedUrl(absolute);
      if (fromLocation && fromLocation !== absolute) return fromLocation;
      if (!/video-seed\.dev/i.test(absolute)) return absolute;
    }
    const $ = cheerio.load(response.data || "");
    const media = $("video source[src], video[src], a[href]").map((_, el) =>
      $(el).attr("src") || $(el).attr("href")
    ).get().find((value) => value && /^https?:\/\//i.test(value) &&
      /\.(mp4|mkv|m3u8)(?:$|\?)/i.test(value));
    return media ? new URL(media, candidate).href : candidate;
  } catch (e) {
    return candidate;
  }
}

// Ported from extractStreamsFromDriveseed in the original stream.ts
async function extractStreamsFromDriveseed(driveUrl, signal) {
  const streams = [];
  const added = new Set();
  const addStream = (server, link) => {
    if (link && link.startsWith("http") && !added.has(link)) {
      added.add(link);
      streams.push({ server, link, type: "mkv" });
    }
  };

  let fileUrl = driveUrl;

  if (driveUrl.includes("/r?")) {
    try {
      const rRes = await get(driveUrl, {
        headers: { ...DRIVE_HEADERS, Referer: "https://en.thenaukriadda.in/" },
        signal,
      });
      const m = rRes.data.match(/location\.replace\(["']([^"']+)["']\)/);
      if (m) {
        const p = m[1].replace(/\\/g, "");
        fileUrl = p.startsWith("http") ? p : new URL(driveUrl).origin + p;
      }
    } catch (e) {}
  }

  try {
    const fileRes = await get(fileUrl, { headers: { ...DRIVE_HEADERS, Referer: driveUrl }, signal });
    const $file = cheerio.load(fileRes.data);

    // 1. Resume Cloud (/zfile)
    try {
      const zRes = await get(fileUrl.replace("/file/", "/zfile/"), {
        headers: { ...DRIVE_HEADERS, Referer: fileUrl },
        signal,
      });
      const $z = cheerio.load(zRes.data);
      $z("a").each((_, el) => {
        const href = $z(el).attr("href");
        if (href && isMediaHost(href)) {
          addStream(href.includes("drive.google.com") ? "Google Drive" : "Resume Cloud (Fast)", href);
        }
      });
      $z("iframe, video, source").each((_, el) => {
        const src = $z(el).attr("src");
        if (src) {
          const m = src.match(/link=(https?:\/\/[^&"']+)/);
          if (m && m[1]) addStream("Direct Stream", m[1]);
        }
      });
    } catch (e) {}

    // Direct media links on the file page
    $file("a").each((_, el) => {
      const href = $file(el).attr("href");
      if (href && isMediaHost(href)) {
        addStream(href.includes("drive.google.com") ? "Google Drive" : "Direct File Stream", href);
      }
    });

    // 2. Instant Download
    try {
      const instantHref = $file(".btn-danger, a:contains('Instant Download')").attr("href");
      if (instantHref && instantHref.startsWith("http")) {
        let done = false;
        if (instantHref.includes("url=")) {
          const part = safeDecode(instantHref.split("url=")[1]);
          if (part && part.startsWith("http")) {
            addStream("Instant Download", part);
            done = true;
          }
        }
        if (!done) {
          try {
            const vRes = await get(instantHref, {
              headers: { ...DRIVE_HEADERS, Referer: fileUrl },
              maxRedirects: 0,
              validateStatus: (s) => (s >= 200 && s < 400) || s === 0,
              signal,
            });
            const loc = vRes.headers.location;
            if (loc) {
              let direct = null;
              if (loc.includes("url=")) direct = safeDecode(loc.split("url=")[1]);
              else if (loc.startsWith("http")) direct = loc;
              if (direct && direct.startsWith("http")) addStream("Instant Download", direct);
            } else {
              const up = vRes.data.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
              if (up) {
                const upUrl = up[1].startsWith("http") ? up[1] : new URL(instantHref).origin + up[1];
                const upRes = await get(upUrl, {
                  headers: { ...DRIVE_HEADERS, Referer: instantHref },
                  maxRedirects: 0,
                  validateStatus: (s) => (s >= 200 && s < 400) || s === 0,
                  signal,
                });
                const loc2 = upRes.headers.location;
                if (loc2 && loc2.startsWith("http")) {
                  addStream("Instant Download", loc2);
                } else {
                  const $up = cheerio.load(upRes.data);
                  const dl = $up("#downloadBtn, a.btn-danger, a.btn-success").attr("href");
                  if (dl && dl.startsWith("http")) addStream("Instant Download", dl);
                }
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}

    // 3. Worker fallbacks
    for (const t of [1, 2]) {
      try {
        const wRes = await get(fileUrl.replace("/file/", "/wfile/") + "?type=" + t, {
          headers: { ...DRIVE_HEADERS, Referer: fileUrl },
          signal,
        });
        const $w = cheerio.load(wRes.data);
        $w(".btn-success, a.btn").each((i, el) => {
          const href = $w(el).attr("href");
          if (href) addStream("Worker " + t + "." + (i + 1), href);
        });
      } catch (e) {}
    }
  } catch (e) {}

  // Worker/instant buttons can point at VideoSeed's temporary redirect wrapper.
  // Unwrap those links to the underlying media URL before handing them to Nuvio.
  const resolved = await Promise.all(streams.map(async (stream) => ({
    ...stream,
    link: await resolveVideoSeedUrl(stream.link, signal),
  })));
  return resolved;
}


// ===== Inlined from extractors.js =====
// NOTE: best-effort replacements for the original hubcloudExtractor / gdflixExtractor,
// which were not provided. Page layouts on these hosts change often; if you have the
// originals, port them here instead.
const EXTRACTOR_HEADERS = commonHeaders;

const GOOD_LINK =
  /pixeldrain|workers\.dev|r2\.dev|fsl|hubcdn|googleusercontent|\.(mkv|mp4|m3u8)($|\?)/i;

function normalize(href) {
  const m = href.match(/pixeldrain\.[a-z]+\/u\/([A-Za-z0-9]+)/);
  return m ? "https://pixeldrain.com/api/file/" + m[1] + "?download" : href;
}

function scan(html, streams, added) {
  const $ = cheerio.load(html);
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const label = $(el).text().replace(/\s+/g, " ").trim();
    if (!href || !href.startsWith("http") || !GOOD_LINK.test(href)) return;
    const link = normalize(href);
    if (added.has(link)) return;
    added.add(link);
    streams.push({ server: label || "Server", link, type: "mkv" });
  });
}

async function hubcloudExtractor(url, signal) {
  const streams = [];
  const added = new Set();
  try {
    const page = await get(url, { headers: EXTRACTOR_HEADERS, signal });
    let html = page.data;
    const $ = cheerio.load(html);
    const next =
      (html.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/) || [])[1] ||
      $("#download").attr("href") ||
      $("a.btn-primary").attr("href");
    if (next) {
      const abs = next.startsWith("http") ? next : new URL(next, url).href;
      const r = await get(abs, { headers: { ...EXTRACTOR_HEADERS, Referer: url }, signal });
      html = r.data;
    }
    scan(html, streams, added);
  } catch (e) {}
  return streams;
}

async function gdflixExtractor(url, signal) {
  const streams = [];
  const added = new Set();
  try {
    const page = await get(url, { headers: EXTRACTOR_HEADERS, signal });
    scan(page.data, streams, added);
  } catch (e) {}
  if (streams.length === 0) {
    // GDFlix file pages are laid out like DriveSeed pages
    return extractStreamsFromDriveseed(url, signal);
  }
  return streams;
}


// ===== Inlined from search.js =====
// NOTE: the original search/meta code was not provided, so this is a heuristic
// implementation. Selectors may need adjusting to the current site layout.
// Put your own TMDB v3 API key here
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const QUALITY_RE = /(2160p|4k|1080p|720p|480p)/i;
const SIZE_RE = /(\d+(?:\.\d+)?\s?(?:GB|MB))/i;
const SKIP_HOST = /facebook|twitter|telegram|instagram|youtube|t\.me|whatsapp/i;

async function getMeta(tmdbId, mediaType, signal) {
  if (!TMDB_API_KEY) throw new Error("Set TMDB_API_KEY in providers/uhdmovies.js");
  const kind = mediaType === "tv" ? "tv" : "movie";
  const res = await get(
    "https://api.themoviedb.org/3/" + kind + "/" + tmdbId + "?api_key=" + TMDB_API_KEY,
    { signal }
  );
  const j = JSON.parse(res.data);
  const title = j.title || j.name || "";
  const date = j.release_date || j.first_air_date || "";
  return { title, year: date.slice(0, 4) };
}

async function findLinks({ tmdbId, mediaType, season, signal }) {
  const meta = await getMeta(tmdbId, mediaType, signal);
  const q = encodeURIComponent(meta.title + (mediaType === "movie" && meta.year ? " " + meta.year : ""));

  const sRes = await get(BASE_URL + "/?s=" + q, { headers: commonHeaders, signal });
  const $ = cheerio.load(sRes.data);

  let postUrl = null;
  $("article h2 a, .entry-title a, h2.title a").each((_, el) => {
    if (postUrl) return;
    const t = $(el).text();
    const href = $(el).attr("href");
    if (!href || !norm(t).includes(norm(meta.title))) return;
    if (mediaType === "movie" && meta.year && !t.includes(meta.year)) return;
    postUrl = href;
  });
  if (!postUrl) return [];

  const pRes = await get(postUrl, { headers: { ...commonHeaders, Referer: BASE_URL + "/" }, signal });
  const $p = cheerio.load(pRes.data);
  const container = $p(".entry-content, .post-content, article").first();

  const links = [];
  let heading = "";
  let skipSeason = false;

  container.children().each((_, el) => {
    const $el = $p(el);
    const text = $el.text().replace(/\s+/g, " ").trim();
    const anchors = $el.is("a") ? $el : $el.find("a[href]");

    if (anchors.length === 0 || QUALITY_RE.test(text) || /season/i.test(text)) {
      if (text && (QUALITY_RE.test(text) || /season/i.test(text))) {
        heading = text;
        if (mediaType === "tv") {
          const sm = text.match(/season\s*0*(\d+)/i);
          skipSeason = !!(sm && Number(sm[1]) !== Number(season));
        }
      }
    }
    if (skipSeason) return;

    anchors.each((__, a) => {
      const href = $p(a).attr("href");
      const label = $p(a).text().replace(/\s+/g, " ").trim();
      if (!href || !href.startsWith("http") || SKIP_HOST.test(href)) return;
      if (href.indexOf(BASE_URL) === 0) return;
      if (!/download|episode|drive|links|gdflix|hubcloud/i.test(label + href)) return;
      const qm = heading.match(QUALITY_RE);
      const sm = heading.match(SIZE_RE);
      links.push({
        url: href,
        quality: qm ? qm[1].toLowerCase().replace("4k", "2160p") : "",
        size: sm ? sm[1] : "",
        label,
      });
    });
  });

  return links;
}


// ===== Inlined from resolve.js =====
const isKnownHost = (u) => /hubcloud|gdflix|driveseed|driveleech|appdrive|video-seed\.dev/i.test(u);

// Turns one shortlink into a list of { server, link, type } (replaces the original getStream)
async function resolveLink(url, { mediaType, episode, signal } = {}) {
  let target = url;

  if (target.includes("thenaukriadda") || target.includes("sid=")) {
    try {
      const b = await bypassThenaukriadda(target, signal);
      if (b) target = b;
    } catch (e) {
      console.warn("[UHDMovies] bypass failed:", e.message);
    }
  }

  // TV: season packs lead to an episode list page, so pick the right episode
  if (mediaType === "tv" && episode && !isKnownHost(target)) {
    try {
      const page = await get(target, { headers: commonHeaders, signal });
      const $ = cheerio.load(page.data);
      const re = new RegExp("episode\\s*0*" + episode + "\\b", "i");
      let epUrl = null;
      $("a[href]").each((_, el) => {
        if (!epUrl && re.test($(el).text())) epUrl = $(el).attr("href");
      });
      if (epUrl) {
        target = epUrl;
        if (target.includes("thenaukriadda") || target.includes("sid=")) {
          target = (await bypassThenaukriadda(target, signal)) || target;
        }
      }
    } catch (e) {}
  }

  if (/video-seed\.dev/i.test(target)) {
    const mediaUrl = await resolveVideoSeedUrl(target, signal);
    if (mediaUrl && mediaUrl !== target) {
      return [{ server: "VideoSeed", link: mediaUrl, type: /\.m3u8(?:$|\?)/i.test(mediaUrl) ? "m3u8" : "mkv" }];
    }
    return [];
  }

  if (target.includes("hubcloud")) return hubcloudExtractor(target, signal);
  if (target.includes("gdflix")) return gdflixExtractor(target, signal);

  if (/driveseed|driveleech|appdrive/i.test(target)) {
    const s = await extractStreamsFromDriveseed(target, signal);
    if (s.length) return s;
  }

  if (/\.(mp4|mkv|m3u8|avi)($|\?)/i.test(target)) {
    return [{ server: "Direct Stream", link: target, type: target.includes(".m3u8") ? "m3u8" : "mkv" }];
  }
  return [];
}


// ===== Inlined from index.js =====
const MAX_LINKS = 6;

async function getStreams(tmdbId, mediaType, season, episode) {
  const type = mediaType === "tv" ? "tv" : "movie";
  try {
    const links = await findLinks({ tmdbId, mediaType: type, season });
    if (!links.length) return [];

    const batches = await Promise.all(
      links.slice(0, MAX_LINKS).map(async (l) => {
        try {
          const found = await resolveLink(l.url, { mediaType: type, episode });
          return found.map((s) => ({ s, l }));
        } catch (e) {
          console.warn("[UHDMovies] resolve failed:", e.message);
          return [];
        }
      })
    );

    const seen = new Set();
    const out = [];
    batches.forEach((batch) =>
      batch.forEach(({ s, l }) => {
        if (seen.has(s.link)) return;
        seen.add(s.link);
        const stream = {
          name: "UHDMovies",
          title: [l.quality, l.size, s.server].filter(Boolean).join(" • "),
          url: s.link,
          quality: l.quality || "Unknown",
        };
        if (l.size) stream.size = l.size;
        out.push(stream);
      })
    );
    return out;
  } catch (e) {
    console.error("[UHDMovies] Error:", e.message);
    return [];
  }
}

module.exports = { getStreams };

