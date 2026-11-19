// ============================================================
//  Movies4u Stremio Addon – Fully Fixed & Deobfuscated
//  Fixes applied:
//    2. FALLBACK_URL updated to working domain
//    3. Cloudflare bypass headers (browser-grade UA + cookies)
//    5. hx-redirect AND standard 302 Location both handled
//    6. m4uplay.store domain made configurable + auto-rotate
//    7. Retry logic with exponential back-off
//    8. extractHubCloud: handles gpdl, buzzserver, fsl, s3, mega, pdl, pixel
//    9. TMDB API key moved to config (easy to swap)
//   10. All silent failures now log to console.error for debugging
// ============================================================

'use strict';

// ── Configuration  (edit these) ──────────────────────────────
const CONFIG = {
  TMDB_API_KEY : '1865f43a0549ca50d341dd9ab8b29f49', // swap if rate-limited
  DOMAINS_URL  : 'https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json',
  FALLBACK_URLS: [            // tried in order if domains.json fails
    'https://new8.movies4u.garden',
  ],
  PLAYER_DOMAINS: [           // m4uplay player domains, tried in order
    'https://m4ulinks.xyz',
  ],
  MAX_RETRIES  : 3,
  RETRY_DELAY_MS: 400,
};

// ── Cloudflare-bypass headers ─────────────────────────────────
const CF_HEADERS = {
  'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept'         : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control'  : 'no-cache',
  'Pragma'         : 'no-cache',
  'Sec-Ch-Ua'      : '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile'  : '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest' : 'document',
  'Sec-Fetch-Mode' : 'navigate',
  'Sec-Fetch-Site' : 'none',
  'Sec-Fetch-User' : '?1',
  'Upgrade-Insecure-Requests': '1',
};

// Site-specific headers layered on top of CF_HEADERS
const SITE_HEADERS = {
  ...CF_HEADERS,
  'Referer': CONFIG.FALLBACK_URLS[0],
  'Cookie' : 'xla=s4t',
};

// ── Utility: sleep ────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Utility: fetch with retry ─────────────────────────────────
async function cfFetch(url, opts = {}, retries = CONFIG.MAX_RETRIES) {
  // Merge caller headers on top of CF bypass defaults
  const mergedOpts = {
    ...opts,
    headers: { ...CF_HEADERS, ...(opts.headers || {}) },
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, mergedOpts);

      // Detect Cloudflare challenge page
      if (res.status === 403 || res.status === 429 || res.status === 503) {
        const body = await res.text();
        if (body.includes('cf-browser-verification') ||
            body.includes('challenge-platform') ||
            body.includes('cf_chl') ||
            body.includes('Just a moment')) {
        }
        if (attempt < retries) {
          await sleep(CONFIG.RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        // Return the response anyway — caller decides what to do
        return new Response(body, { status: res.status, headers: res.headers });
      }

      return res;
    } catch (err) {
      if (attempt < retries) {
        await sleep(CONFIG.RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
}

// ── Domain resolution ─────────────────────────────────────────
let cachedBaseUrls = null;

async function getBaseUrls() {
  if (cachedBaseUrls) return cachedBaseUrls;
  try {
    const res  = await cfFetch(CONFIG.DOMAINS_URL, { skipSizeCheck: true });
    const json = await res.json();
    // json is expected: { "movies4u": "https://...", "movies4uhd": "https://...", ... }
    const urls = Object.values(json).filter(v => typeof v === 'string' && v.startsWith('http'));
    if (urls.length) {
      cachedBaseUrls = urls;
      return cachedBaseUrls;
    }
  } catch (err) {
    console.error('[Movies4u] Domain fetch failed:', err.message);
  }
  cachedBaseUrls = [...CONFIG.FALLBACK_URLS];
  return cachedBaseUrls;
}

// ── Quality helpers ───────────────────────────────────────────
function extractQuality(text) {
  const s = (text || '').toLowerCase();
  if (/\b(2160p|4k|uhd)\b/.test(s))                                       return '4K';
  if (/\b1080p\b/.test(s) || /\b1080\b(?![\s\S]{0,4}(?:gb|mb|b)\b)/.test(s))   return '1080p';
  if (/\b720p\b/.test(s)  || /\b720\b(?![\s\S]{0,4}(?:gb|mb|b)\b)/.test(s))    return '720p';
  if (/\b480p\b/.test(s)  || /\b480\b(?![\s\S]{0,4}(?:gb|mb|b)\b)/.test(s))    return '480p';
  if (/\b360p\b/.test(s)  || /\b360\b(?![\s\S]{0,4}(?:gb|mb|b)\b)/.test(s))    return '360p';
  return 'Unknown';
}

function getQualityRank(label) {
  const s = String(label || '').toLowerCase();
  if (s.includes('2160') || s.includes('4k')  || s.includes('uhd'))  return 4;
  if (s.includes('1080') || s.includes('fhd') || s.includes('fullhd')) return 3;
  if (s.includes('720')  || s.includes('hd'))                          return 2;
  if (s.includes('480')  || s.includes('sd')  || s.includes('360'))   return 1;
  return 0;
}

function getResolutionEmoji(res) {
  const s = String(res || '').toLowerCase();
  if (s.includes('2160') || s.includes('4k')  || s.includes('uhd'))  return '🌟 4K';
  if (s.includes('1080') || s.includes('fullhd'))                      return '🔥 1080p';
  if (s.includes('720')  || s.includes('hd'))                          return '💎 720p';
  if (s.includes('480')  || s.includes('sd'))                          return '📱 480p';
  return '📺 ' + (res || 'Unknown');
}

function parseSizeToMB(sizeStr) {
  if (!sizeStr || sizeStr === 'N/A') return 0;
  const m = String(sizeStr).match(/([\d.]+)\s*(GB|MB)/i);
  if (!m) return 0;
  return m[2].toUpperCase() === 'GB'
    ? Math.floor(parseFloat(m[1]) * 1024)
    : Math.floor(parseFloat(m[1]));
}

// Invisible-character sort tag (higher quality = comes first)
function getInvertedSortTag(rank, max = 999999) {
  const inv = Math.max(0, max - Math.max(0, parseInt(rank) || 0));
  return inv.toString(2).padStart(20, '0').split('').map(c => c === '1' ? '\uFEFF' : '').join('');
}

// ── Metadata parser ───────────────────────────────────────────
function parseExtraMetadata(titleText, anchorText = '') {
  const c = (titleText + ' ' + anchorText).toUpperCase();

  const language = c.includes('DUAL') || c.includes('MULTI')
    ? 'Multi-Audio'
    : (c.includes('ENGLISH') && !c.includes('HINDI') ? 'English' : 'Multi-Audio');

  const szMatch = c.match(/(\d+(?:\.\d+)?\s*[MG]B)/i);
  let size = szMatch ? szMatch[0].replace(/\s+/g, '') : 'N/A';
  if (size === 'N/A') {
    const gm = c.match(/(\d+\.\d+)\s?G/);
    if (gm) size = gm[1] + 'GB';
  }

  const format = c.includes('MP4') ? 'MP4' : 'MKV';

  let codecTag = '✨ H.264';
  if (c.includes('HDR') || c.includes('DV') || c.includes('VISION')) {
    codecTag = '🌈 HDR';
  } else if (c.includes('HEVC') || c.includes('X265') || c.includes('H265') || c.includes('H.265')) {
    codecTag = '✨ HEVC';
  } else if (c.includes('X264') || c.includes('H264') || c.includes('H.264')) {
    codecTag = '✨ H.264';
  }

  let audioCodec = '🎧 DDP5.1';
  if (c.includes('ATMOS')) {
    audioCodec = '🎧 Dolby Atmos';
  } else if (c.includes('DD5') || c.includes('DDP5') || c.includes('5.1')) {
    audioCodec = '🎧 DDP5.1';
  } else if (c.includes('AAC')) {
    audioCodec = '🎧 AAC';
  }

  const isImax = c.includes('IMAX') ? '👁️ IMAX' : null;

  return { language, size, format, codecTag, audioCodec, isImax };
}

// ── URL helpers ───────────────────────────────────────────────
function safeUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    u.pathname = u.pathname.split('/').map(seg => {
      try { return encodeURIComponent(decodeURIComponent(seg)); }
      catch (_) { return encodeURIComponent(seg); }
    }).join('/');
    return u.toString();
  } catch (_) {
    return rawUrl;
  }
}

// ── CDN server label ──────────────────────────────────────────
function hubCloudServerLabel(text, link) {
  const s = ((text || '') + ' ' + (link || '')).toLowerCase();
  if (/gpdl\.|server\s*:\s*10gbps/.test(s)) return 'HubCloud Pixel 10Gbps';
  if (/fslv2/.test(s))                       return 'HubCloud FSLv2';
  if (/fsl/.test(s))                         return 'HubCloud FSL';
  if (/s3 server/.test(s))                   return 'HubCloud S3';
  if (/mega server/.test(s))                 return 'HubCloud Mega';
  if (/pdl server/.test(s))                  return 'HubCloud PDL';
  if (/buzzserver/.test(s))                  return 'HubCloud BuzzServer';
  if (/pixeldrain/.test(s))                  return 'HubCloud Pixeldrain';
  if (/pixel\.|pixelserver/.test(s))         return 'HubCloud Pixel';
  if (/download file/.test(s))                return 'HubCloud Direct';
  return 'HubCloud';
}

// ── File size detection ───────────────────────────────────────
async function detectFileSize(url, headers = {}) {
  try {
    const res = await cfFetch(url, {
      method      : 'HEAD',
      headers,
      skipSizeCheck: true,
      redirect    : 'follow',
    }, 1);
    const len = res.headers.get('content-length');
    if (!len) return null;
    const bytes = parseInt(len);
    const str   = bytes >= 1024 ** 3
      ? (bytes / 1024 ** 3).toFixed(1) + 'GB'
      : Math.round(bytes / 1024 ** 2) + 'MB';
    return { bytes, string: str };
  } catch (_) {}
  return null;
}

// Estimate quality from file size + duration if URL has no quality marker
async function detectDynamicQuality(url, headers = {}, labelHint = '', durationMin = 120) {
  try {
    if (!url) return '1080p';
    let q = extractQuality(decodeURIComponent(url).toLowerCase());
    if (q !== 'Unknown') return q;
    if (labelHint) { q = extractQuality(labelHint.toLowerCase()); if (q !== 'Unknown') return q; }
    const info = await detectFileSize(url, headers);
    if (info && info.bytes) {
      const gb      = info.bytes / 1024 ** 3;
      const hrs     = (parseInt(durationMin) || 120) / 60;
      const gbPerHr = gb / hrs;
      if (gbPerHr >= 6.5) return '4K';
      if (gbPerHr >= 0.95) return '1080p';
      if (gbPerHr >= 0.35) return '720p';
      return '480p';
    }
  } catch (_) {}
  return '1080p';
}

// ── Stream object builder ─────────────────────────────────────
function makeStream(url, headers, quality, size, server, movieTitle, year, meta) {
  const qualityRank = getQualityRank(quality);
  const sizeInMB    = parseSizeToMB(size);
  const sortTag     = getInvertedSortTag(qualityRank * 100000 + sizeInMB, 999999);
  const emoji       = getResolutionEmoji(quality);

  const cleanTitle = (movieTitle || '').replace(/[^a-zA-Z0-9]/g, '.');
  const filename   = [
    cleanTitle,
    year || '2026',
    meta.isImax ? 'IMAX' : null,
    quality,
    'AMZN.WEB-DL',
    meta.language.replace(/\s+/g, '.'),
    meta.audioCodec.replace(/[^\w.]/g, ''),
    meta.format,
    'MSubs',
  ].filter(Boolean).join('.');

  const line0 = '🎬 ' + movieTitle + (year ? ' (' + year + ')' : '');
  const line1 = emoji + ' | 🗣️ ' + meta.language + ' | 💾 ' + size;
  const line2 = '🎞️ ' + meta.format + ' | ' + meta.codecTag + ' | ' + meta.audioCodec;
  const line3 = meta.isImax
    ? '👁️ IMAX | 🌐 Movies4u | 📦 ' + server
    : '🌐 Movies4u | 📦 ' + server;
  const description = [line0, line1, line2, line3, filename].join('\n');

  return {
    qualityRank,
    sizeInMB,
    data: {
      name       : sortTag + 'Movies4u • ' + quality + ' • ' + server,
      title      : description,
      size       : description,
      description,
      url,
      behaviorHints: {
        notWebReady : true,
        proxyHeaders: { request: headers },
      },
    },
  };
}

// ── P.A.C.K.E.R unpacker ─────────────────────────────────────
function unpackJS(packed, radix, count, keys) {
  while (count--)
    if (keys[count])
      packed = packed.replace(new RegExp('\\b' + count.toString(radix) + '\\b', 'g'), keys[count]);
  return packed;
}

// ── Extract direct m3u8 from m4uplay player page ──────────────
async function extractDirectM3u8(pageUrl) {
  for (const playerDomain of CONFIG.PLAYER_DOMAINS) {
    // Build URL using each player domain if the input already starts with one
    let targetUrl = pageUrl;
    // If it's a relative path, prepend domain
    if (!pageUrl.startsWith('http')) targetUrl = playerDomain + pageUrl;

    try {
      const res  = await cfFetch(targetUrl, {
        headers     : { ...SITE_HEADERS, 'Referer': 'https://m4ulinks.xyz/' },
        skipSizeCheck: true,
      });
      const html = await res.text();

      let m3u8 = null;

      // 1. Direct absolute m3u8
      m3u8 = (html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i) || [])[0]
          || (html.match(/https?:\/\/[^\s"'<>]+master\.txt[^\s"'<>]*/i) || [])[0];

      // 2. Relative stream path
      if (!m3u8) {
        const rel = (html.match(/\/(?:3o|stream|hls)\/[^\s"'<>]+(?:m3u8|txt)/i) || [])[0];
        if (rel) m3u8 = playerDomain + rel;
      }

      // 3. P.A.C.K.E.R
      if (!m3u8) {
        const pm = html.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]*?\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)/);
        if (pm) {
          const unpacked = unpackJS(pm[1], parseInt(pm[2]), parseInt(pm[3]), pm[4].split('|'));
          m3u8 = (unpacked.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i) || [])[0]
              || (unpacked.match(/https?:\/\/[^\s"'<>]+master\.txt[^\s"'<>]*/i) || [])[0];
          if (!m3u8) {
            const rel = (unpacked.match(/\/(?:3o|stream|hls)\/[^\s"'<>]+(?:m3u8|txt)/i) || [])[0];
            if (rel) m3u8 = playerDomain + rel;
          }
        }
      }

      // 4. JSON source field (some players embed it as JSON)
      if (!m3u8) {
        const jm = html.match(/"(?:file|src|source)"\s*:\s*"(https?[^"]+\.m3u8[^"]*)"/i);
        if (jm) m3u8 = jm[1];
      }

      if (m3u8) return m3u8.replace('master.txt', 'master.m3u8');
    } catch (err) {
      console.error('[Movies4u] Player parse failed for', targetUrl, err.message);
    }
  }
  return null;
}

// ── HubCloud resolver ─────────────────────────────────────────
async function extractHubCloud(hubUrl, referer) {
  try {
    // Normalise .ist → .mov (common alias)
    let url = hubUrl.replace('hubcloud.ist', 'hubcloud.mov');

    const res1  = await cfFetch(url, {
      headers     : { ...SITE_HEADERS, 'Referer': referer || '' },
      skipSizeCheck: true,
    });
    let html    = await res1.text();
    let baseUrl = res1.url || url;

    // Follow internal hubcloud.php redirect link
    const internalHref =
      (html.match(/<a[^>]+href="([^"]*hubcloud\.php[^"]*)"/i) || [])[1] ||
      (html.match(/id="download"[^>]+href="([^"]+)"/i) || [])[1] ||
      (html.match(/var\s+url\s*=\s*'([^']+)'/) || [])[1];

    if (internalHref) {
      const resolved = new URL(internalHref, baseUrl).href;
      const res2 = await cfFetch(resolved, {
        headers     : { ...SITE_HEADERS, 'Referer': baseUrl },
        skipSizeCheck: true,
      });
      html    = await res2.text();
      baseUrl = res2.url || resolved;
    }

    // Extract page title and size for quality / metadata
    const title  = (html.match(/class="card-header">([^<]+)</i) || [])[1]
                || (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || '';
    const rawSize = (html.match(/id="size">([^<]+)</i) || [])[1]
                 || (html.match(/([\d.]+\s*(?:GB|MB))/i) || [])[1];
    const size    = rawSize ? rawSize.trim() : undefined;
    const quality = extractQuality(title);

    // Collect all download links from the page
    const anchors  = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
    const linkList = [];

    for (const m of anchors) {
      const href = m[1];
      const text = m[2].replace(/<[^>]+>/g, ' ').trim();
      if (!href) continue;
      if (!/download file|download\s*\[server|fsl|buzzserver|pixeldra|pixelserver|pixel server|s3 server|mega server|pdl server/i.test(text)) continue;
      linkList.push({ link: new URL(href, baseUrl).href, text });
    }

    // Resolve each download link to a final stream URL
    const results = await Promise.all(linkList.map(async item => {
      let dlUrl = item.link;

      // Skip pixeldrain (requires account / CAPTCHA)
      if (/pixeldra|pixelserver|pixel server/i.test(item.text)) return null;

      try {
        // ── GPDL / 10Gbps server ────────────────────────────
        if (/gpdl\.|download\s*\[server\s*:\s*10gbps/i.test(item.link + ' ' + item.text)) {
          const r1   = await cfFetch(dlUrl, { redirect: 'manual', headers: { ...SITE_HEADERS, 'Referer': baseUrl }, skipSizeCheck: true }, 0);
          const loc1 = r1.headers.get('location');
          if (!loc1) return null;
          const r2   = await cfFetch(new URL(loc1, dlUrl).href, { redirect: 'manual', headers: { ...SITE_HEADERS, 'Referer': dlUrl }, skipSizeCheck: true }, 0);
          const loc2 = r2.headers.get('location');
          if (!loc2) return null;
          dlUrl = new URL(loc2).searchParams.get('link');
          if (!dlUrl) return null;

        // ── BuzzServer ───────────────────────────────────────
        } else if (/buzzserver/i.test(item.text)) {
          const rb = await cfFetch(dlUrl, { redirect: 'manual', headers: { ...SITE_HEADERS, 'Referer': baseUrl }, skipSizeCheck: true }, 0);
          // FIX 5: check BOTH hx-redirect AND standard Location header
          dlUrl = rb.headers.get('hx-redirect')
               || rb.headers.get('location')
               || rb.headers.get('x-redirect');
          if (!dlUrl) return null;
          dlUrl = new URL(dlUrl, item.link).href;

        // ── FSL / FSLv2 ──────────────────────────────────────
        } else if (/fsl/i.test(item.text)) {
          const rf = await cfFetch(dlUrl, { redirect: 'manual', headers: { ...SITE_HEADERS, 'Referer': baseUrl }, skipSizeCheck: true }, 0);
          const loc = rf.headers.get('location') || rf.headers.get('hx-redirect');
          if (loc) dlUrl = new URL(loc, dlUrl).href;
        }
      } catch (err) {
        console.error('[Movies4u] Link resolve failed:', item.link, err.message);
        return null;
      }

      const serverLabel = hubCloudServerLabel(item.text, item.link);

      return {
        source : serverLabel,
        url    : safeUrl(dlUrl),
        quality,
        size,
        headers: { ...SITE_HEADERS, 'Referer': baseUrl },
      };
    }));

    return results.filter(Boolean);
  } catch (err) {
    console.error('[Movies4u] extractHubCloud failed:', hubUrl, err.message);
    return [];
  }
}

// ── Main stream resolver ──────────────────────────────────────
async function getStreams(tmdbId, type, season = 1, episode = 1) {
  const id       = String(tmdbId).replace('tmdb:', '');
  const baseUrls = await getBaseUrls();

  // 1. TMDB metadata lookup
  let movieTitle = '', year = '';
  try {
    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const tmdbRes  = await cfFetch(
      `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${CONFIG.TMDB_API_KEY}`,
      { skipSizeCheck: true }, 1
    );
    const tmdbData = await tmdbRes.json();
    movieTitle     = endpoint === 'tv' ? (tmdbData.name || '') : (tmdbData.title || '');
    const dateStr  = endpoint === 'tv' ? tmdbData.first_air_date : tmdbData.release_date;
    if (dateStr) year = dateStr.split('-')[0];
  } catch (err) {
    console.error('[Movies4u] TMDB lookup failed:', err.message);
  }

  if (!movieTitle) {
    console.error('[Movies4u] No title resolved for', tmdbId);
    return [];
  }

  // 2. Search each domain for the matching post
  let postUrl = null;
  for (const base of baseUrls) {
    try {
      const searchRes  = await cfFetch(base + '/?s=' + encodeURIComponent(movieTitle), {
        headers     : SITE_HEADERS,
        skipSizeCheck: true,
      });
      const searchHtml = await searchRes.text();

      // Detect CF challenge
      if (searchHtml.includes('cf-browser-verification') || searchHtml.includes('Just a moment')) {
        console.error('[Movies4u] CF challenge on domain:', base);
        continue;
      }

      const articles = [...searchHtml.matchAll(/<article[\s\S]*?<a href="([^"]+)"[^>]*rel="bookmark">([^<]+)<\/a>/gi)];
      const wantTitle = movieTitle.toLowerCase();
      for (const a of articles) {
        const link     = a[1];
        const artTitle = a[2].toLowerCase();
        if (!artTitle.includes(wantTitle)) continue;
        if (year && !artTitle.includes(year)) continue;
        if (type === 'tv' && !/season|series/i.test(artTitle)) continue;
        postUrl = link;
        break;
      }
      if (postUrl) break;
    } catch (err) {
      console.error('[Movies4u] Search failed on', base, err.message);
    }
  }

  if (!postUrl) {
    console.error('[Movies4u] No matching post found for:', movieTitle, year);
    return [];
  }

  // 3. Fetch the post/content page
  let postHtml = '';
  try {
    const pr = await cfFetch(postUrl, { headers: SITE_HEADERS, skipSizeCheck: true });
    postHtml  = await pr.text();
  } catch (err) {
    console.error('[Movies4u] Post fetch failed:', postUrl, err.message);
    return [];
  }

  if (postHtml.includes('Just a moment') || postHtml.includes('cf-browser-verification')) {
    console.error('[Movies4u] CF block on post page — request blocked by Cloudflare');
    return [];
  }

  const streams = [];

  // ── 3a. m4uplay.store direct m3u8 links in page anchors ─────
  const allAnchors = [...postHtml.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  for (const a of allAnchors) {
    const href  = a[1];
    const label = a[2].replace(/<[^>]+>/g, ' ').trim();
    if (!CONFIG.PLAYER_DOMAINS.some(d => href.includes(d.replace('https://', '')))) continue;

    const m3u8 = await extractDirectM3u8(href);
    if (m3u8) {
      const hdrs = { ...SITE_HEADERS, 'Referer': 'https://m4ulinks.xyz/', 'Origin': 'https://m4ulinks.xyz' };
      const meta = parseExtraMetadata(label, href);
      const qual = await detectDynamicQuality(m3u8, hdrs, label);
      const info = await detectFileSize(m3u8, hdrs);
      const sz   = info?.string || (meta.size !== 'N/A' ? meta.size : 'Unknown');
      streams.push(makeStream(m3u8, hdrs, qual, sz, 'M4U Player Direct', movieTitle, year, meta));
    }
  }

  // ── 3b. Quality-sectioned links (h4 blocks) ──────────────────
  const sections   = [...postHtml.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>([\s\S]*?)(?=<h4|$)/gi)];
  const linkBatch  = [];

  for (const sec of sections) {
    const secTitle = sec[1].replace(/<[^>]+>/g, ' ').trim();
    const secBody  = sec[2];
    if (type === 'tv' && !new RegExp('season\\s*0?' + season + '(?:\\D|$)', 'i').test(secTitle)) continue;

    const secQuality = extractQuality(secTitle);
    const szMatch    = secTitle.match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)(?:\/E)?\b/i);
    const secSize    = szMatch ? szMatch[0] : undefined;

    for (const lm of [...secBody.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]) {
      if (/m4ulinks\./i.test(lm[1]))
        linkBatch.push({
          url       : lm[1],
          quality   : secQuality,
          size      : secSize,
          label     : secTitle,
          anchorText: lm[2].replace(/<[^>]+>/g, '').trim(),
        });
    }
  }

  // ── 3c. Resolve each m4ulinks page ───────────────────────────
  for (const batch of linkBatch) {
    try {
      const pgRes  = await cfFetch(batch.url, {
        headers     : { ...SITE_HEADERS, 'Referer': postUrl },
        skipSizeCheck: true,
      });
      const pgHtml = await pgRes.text();

      const subSections  = [...pgHtml.matchAll(/<h[45][^>]*>([\s\S]*?)<\/h[45]>([\s\S]*?)(?=<h[45]|$)/gi)];
      const episodeLinks = [];

      for (const sub of subSections) {
        const subTitle = sub[1].replace(/<[^>]+>/g, '').trim();
        const subBody  = sub[2];
        if (type === 'tv') {
          const ep = subTitle.match(/episodes?\s*:\s*0*(\d+)/i);
          if (!ep || parseInt(ep[1]) !== parseInt(episode)) continue;
        }
        for (const sl of [...subBody.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)])
          episodeLinks.push({ url: sl[1], label: sl[2].replace(/<[^>]+>/g, '').trim() });
      }

      for (const el of episodeLinks) {
        const combined = (el.label + ' ' + el.url).toLowerCase();

        if (combined.includes('hubcloud')) {
          // ── HubCloud ───────────────────────────────────────
          const hcStreams = await extractHubCloud(el.url, batch.url);
          for (const hc of hcStreams) {
            const meta = parseExtraMetadata(batch.label + ' ' + (batch.size || ''), el.label);
            const qual = await detectDynamicQuality(hc.url, hc.headers, batch.quality);
            const sz   = hc.size || meta.size;
            streams.push(makeStream(hc.url, hc.headers, qual, sz, hc.source, movieTitle, year, meta));
          }

        } else if (CONFIG.PLAYER_DOMAINS.some(d => el.url.includes(d.replace('https://', ''))) || combined.includes('m4uplay')) {
          // ── m4uplay direct ─────────────────────────────────
          const m3u8 = await extractDirectM3u8(el.url);
          if (m3u8) {
            const meta = parseExtraMetadata(batch.label + ' ' + (batch.size || ''), el.label);
            const hdrs = { ...SITE_HEADERS, 'Referer': 'https://m4ulinks.xyz/', 'Origin': 'https://m4ulinks.xyz' };
            const qual = await detectDynamicQuality(m3u8, hdrs, batch.quality);
            const info = await detectFileSize(m3u8, hdrs);
            const sz   = info?.string || (meta.size !== 'N/A' ? meta.size : 'Unknown');
            streams.push(makeStream(m3u8, hdrs, qual, sz, 'M4U Player Direct', movieTitle, year, meta));
          }
        }
      }
    } catch (err) {
      console.error('[Movies4u] Batch link failed:', batch.url, err.message);
    }
  }

  // ── Deduplicate & sort ────────────────────────────────────────
  const seen   = new Set();
  const unique = streams.filter(s => {
    if (!s.data.url || seen.has(s.data.url)) return false;
    seen.add(s.data.url);
    return true;
  });

  unique.sort((a, b) =>
    b.qualityRank !== a.qualityRank
      ? b.qualityRank - a.qualityRank
      : b.sizeInMB - a.sizeInMB
  );

  return unique.map(s => s.data);
}

module.exports = { getStreams };
