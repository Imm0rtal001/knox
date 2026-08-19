"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const PROVIDER_NAME = "4kHdHub";
const TMDB_API_KEY = "307b7b8ef035c6aa336900aef4e203bd";
const DOMAINS_JSON_URL = "https://codeberg.org/eclipsia-404/eclipsia/raw/branch/main/urls.json";
const MOBILE_UAS = [
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
];
let baseUrl = "https://4khdhub.one";
let sessionUA = MOBILE_UAS[Math.floor(Math.random() * MOBILE_UAS.length)];
const RE_QUALITY = /(2160|1080|720|480)p|(4K|UHD)/i;
const RE_YEAR = /\b(19\d{2}|20\d{2})\b/;
const RE_SIZE_CTX = /(?:^|[\s>])(\d+\.?\d*)\s*(GB|MB)\b/i;
const RE_HUBCLOUD = /https?:\/\/hubcloud\.[a-z0-9]+\/drive\/[a-z0-9]+/ig;
const RE_SXEX = /S0*(\d+)[.\s_\-]*E0*(\d+)/i;
const RE_EP = /Episode\s*0*(\d+)/i;
const RE_HEADER = /<div[^>]*class=['"][^'"]*card-header[^'"]*['"][^>]*>([^<]+)</i;
const RE_SIZE_TD = /<td[^>]*>\s*File\s*Size\s*:\s*<\/td>\s*<td[^>]*>\s*([\d\.]+\s*[MGBtbi]+)\s*<\/td>/i;
const RE_SIZE_STR = /Size\s*:\s*<\/strong>\s*([\d\.]+\s*[MGBtbi]+)/i;
const RE_SLUG_JUNK = /^(movie|series)$|^\d+$/;
const RE_NONALNUM = /[^a-z0-9]/g;
const RE_EXT = /\.(mkv|mp4|avi|rar|zip)$/i;
const RE_ZIP_RAR = /\.zip|\.rar/;
const RE_PIXEL = /pixel\.hubcloud/;
const AUDIO_TABLE = [
    [/ddp.?51.*truehd.*71|truehd.*71.*ddp.?51/i, "DDP 5.1 + TrueHD 7.1"],
    [/ddp.?51.*ddp.?71|ddp.?71.*ddp.?51/i, "DDP 5.1 + DDP 7.1"],
    [/ddp.?51.*aac.?71|aac.?71.*ddp.?51/i, "DDP 5.1 + AAC 7.1"],
    [/ddp.?51/i, "DDP 5.1"],
    [/truehd/i, "TrueHD 7.1"],
    [/aac.*71|71.*aac/i, "AAC 7.1"],
    [/aac/i, "AAC 5.1"],
];
function refreshDomains() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(DOMAINS_JSON_URL, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (res && res.ok) {
                const data = yield res.json();
                if (data && data["4khdhub"]) {
                    baseUrl = data["4khdhub"];
                }
            }
        }
        catch (_) { }
    });
}
function getHeaders(extra = {}) {
    return Object.assign({ "User-Agent": sessionUA, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9" }, extra);
}
function fetchText(url, options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const opts = Object.assign({ headers: getHeaders() }, options);
            const res = yield fetch(url, opts);
            return (res && res.ok) ? res.text() : null;
        }
        catch (_) {
            return null;
        }
    });
}
function fetchJson(url, options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const opts = Object.assign({ headers: getHeaders() }, options);
            const res = yield fetch(url, opts);
            return (res && res.ok) ? res.json() : null;
        }
        catch (_) {
            return null;
        }
    });
}
function getTMDBInfo(tmdbId, type) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const isTV = type === "tv";
        let title = "", year = "", imdbId = "";
        try {
            if (isTV) {
                const d = yield fetchJson(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`);
                if (d) {
                    title = d.name;
                    year = (d.first_air_date || "").slice(0, 4);
                    imdbId = ((_a = d.external_ids) === null || _a === void 0 ? void 0 : _a.imdb_id) || "";
                }
            }
            else {
                const d = yield fetchJson(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
                if (d) {
                    title = d.title;
                    year = (d.release_date || "").slice(0, 4);
                    imdbId = d.imdb_id || "";
                }
            }
        }
        catch (_) { }
        return { title, year, imdbId, type: isTV ? "tv" : "movie" };
    });
}
function searchSite(title, year, imdbId, isSeries) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (imdbId) {
            try {
                const posts = yield fetchJson(`${baseUrl}/wp-json/wp/v2/posts?search=${imdbId}`);
                if (posts && posts.length > 0) {
                    return {
                        url: posts[0].link,
                        title: ((_a = posts[0].title) === null || _a === void 0 ? void 0 : _a.rendered) || title,
                        content: isSeries ? null : (((_b = posts[0].content) === null || _b === void 0 ? void 0 : _b.rendered) || ""),
                    };
                }
            }
            catch (_) { }
        }
        const html = yield fetchText(`${baseUrl}/?s=${encodeURIComponent(title)}`);
        if (!html)
            return null;
        const body = html.split('id="main"')[1] || html;
        const cleanQ = title.toLowerCase().replace(RE_NONALNUM, "");
        const typeStr = isSeries ? "-series-" : "-movie-";
        const antiStr = isSeries ? "-movie-" : "-series-";
        const linkRe = /href="(https?:\/\/[^"\/]+)?(\/[^"]+)"/g;
        let best = null, m;
        while ((m = linkRe.exec(body)) !== null) {
            const domain = m[1] || "";
            const path = m[2];
            if (domain && !domain.includes("4khdhub"))
                continue;
            if (path.includes("/category/") || path.includes("?") || path.includes(antiStr))
                continue;
            if (!path.includes(typeStr))
                continue;
            const slugWords = path.split("/").filter(Boolean).pop().split("-");
            const slugClean = slugWords.filter(w => !RE_SLUG_JUNK.test(w)).join("").toLowerCase().replace(RE_NONALNUM, "");
            if (!slugClean.includes(cleanQ) && !cleanQ.includes(slugClean))
                continue;
            const ctx = body.substring(m.index, m.index + 300);
            const yearMatch = RE_YEAR.exec(ctx);
            const yearHit = year && yearMatch && yearMatch[1] === year;
            if (!best || yearHit) {
                best = { url: baseUrl + path, title };
                if (yearHit)
                    break;
            }
        }
        return best;
    });
}
function extractHubcloudLinks(html, season, episode, isSeries) {
    const results = [];
    let scope = html;
    if (isSeries) {
        let start = html.indexOf('id="episodes"');
        if (start < 0)
            start = html.indexOf('data-tab="episodes"');
        if (start >= 0) {
            scope = html.substring(start);
            const end = scope.indexOf('id="complete-pack"');
            if (end >= 0)
                scope = scope.substring(0, end);
        }
    }
    RE_HUBCLOUD.lastIndex = 0;
    let m;
    while ((m = RE_HUBCLOUD.exec(scope)) !== null) {
        const url = m[0];
        if (isSeries) {
            const ctxBefore = scope.substring(Math.max(0, m.index - 3000), m.index);
            const ctxAfter = scope.substring(m.index, Math.min(scope.length, m.index + 500));
            const ctx = ctxBefore + ctxAfter;
            const epMatch = RE_SXEX.exec(ctx) || RE_EP.exec(ctx);
            if (!epMatch)
                continue;
            let s = season, e;
            if (epMatch[2]) {
                s = +epMatch[1];
                e = +epMatch[2];
            }
            else {
                e = +epMatch[1];
            }
            if (s !== season || e !== episode)
                continue;
            const qm = RE_QUALITY.exec(ctxBefore);
            let quality = "HD";
            if (qm) {
                const v = qm[1] || qm[2];
                quality = (v.toUpperCase() === "4K" || v.toUpperCase() === "UHD") ? "2160P" : v.toUpperCase() + "P";
            }
            if (quality === "480P")
                continue;
            const sm = RE_SIZE_CTX.exec(ctxBefore);
            const size = sm ? sm[1] + " " + sm[2] : "";
            results.push({ url, quality, size });
        }
        else {
            const context = scope.substring(Math.max(0, m.index - 1500), m.index);
            const qm = RE_QUALITY.exec(context);
            let quality = "HD";
            if (qm) {
                const v = qm[1] || qm[2];
                quality = (v.toUpperCase() === "4K" || v.toUpperCase() === "UHD") ? "2160P" : v.toUpperCase() + "P";
            }
            if (quality === "480P")
                continue;
            const sm = RE_SIZE_CTX.exec(context);
            const size = sm ? sm[1] + " " + sm[2] : "";
            results.push({ url, quality, size });
        }
    }
    return results;
}
function makeStream(filename, sourceName, streamUrl, quality, hostLabel, referer, size) {
    const qualityUp = (quality || "1080P").toUpperCase();
    const encodedUrl = streamUrl.replace(/ /g, "%20");
    const combined = (String(filename || "") + " " + String(sourceName || "") + " " + encodedUrl).toLowerCase();
    const langParts = [];
    if (/\b(?:english|eng)\b/.test(combined))
        langParts.push("English");
    if (/\bhindi\b/.test(combined))
        langParts.push("Hindi");
    if (/\btamil\b/.test(combined))
        langParts.push("Tamil");
    if (/\btelugu\b/.test(combined))
        langParts.push("Telugu");
    let source = "WEB-DL";
    if (/\bbluray\b/.test(combined))
        source = "Blu-ray";
    else if (/\b(?:webrip|hdrip)\b/.test(combined))
        source = "WEB-Rip";
    let hdrTag = "";
    if (/\bhdr10\+|hdr10p\b/.test(combined))
        hdrTag = "HDR10+";
    else if (/\bhdr10\b/.test(combined))
        hdrTag = "HDR10";
    else if (/\bhdr\b/.test(combined))
        hdrTag = "HDR";
    else if (/\bsdr\b/.test(combined))
        hdrTag = "SDR";
    const bit10Tag = /\b10bit\b/.test(combined) ? "10Bit" : "";
    const dvTag = /\b(?:dv|dolby\s*vision)\b/.test(combined) ? "DV" : "";
    const codec = (/\b(?:hevc|x265|265)\b/.test(combined) || qualityUp === "2160P") ? "H.265" : "H.264";
    const isImax = /\bimax\b/.test(combined);
    let audio = "DDP 5.1";
    for (const [re, label] of AUDIO_TABLE) {
        if (re.test(combined)) {
            audio = label;
            break;
        }
    }
    if (/\batmos\b/.test(combined))
        audio += " Atmos";
    const mainTitle = [PROVIDER_NAME, qualityUp, size].filter(Boolean).join(" • ");
    const line1 = langParts.join(" • ");
    const line2 = [source, isImax && "IMAX", hostLabel || "FSL"].filter(Boolean).join(" • ");
    const line3 = [bit10Tag, dvTag, hdrTag, codec, audio].filter(Boolean).join(" • ");
    const streamTitle = [line1, line2, line3].filter(Boolean).join("\n");
    return {
        name: mainTitle,
        title: streamTitle,
        size: streamTitle,
        url: encodedUrl,
        quality: qualityUp,
        behaviorHints: {
            notWebReady: true,
            proxyHeaders: { request: { Referer: referer || "https://4khdhub.one/" } },
        },
    };
}
function resolveHubCloud(link, fallbackTitle) {
    return __awaiter(this, void 0, void 0, function* () {
        const { url, quality, size } = link;
        const streams = [];
        try {
            const html = yield fetchText(url, { headers: getHeaders({ Referer: baseUrl + "/" }) });
            if (!html)
                return streams;
            const phpMatch = html.match(/href="([^"]*hubcloud\.php[^"]*)"/i);
            if (!phpMatch)
                return streams;
            const phpUrl = phpMatch[1].replace(/&amp;/g, "&");
            const html2 = yield fetchText(phpUrl, { headers: getHeaders({ Referer: url }) });
            if (!html2)
                return streams;
            const hm = RE_HEADER.exec(html2);
            const filename = hm ? hm[1].trim().replace(RE_EXT, "") : fallbackTitle;
            let fileSize = size || "";
            const sm = RE_SIZE_TD.exec(html2) || RE_SIZE_STR.exec(html2);
            if (sm)
                fileSize = sm[1].trim();
            const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>(?:<i[^>]*><\/i>)?\s*([^<]+)<\/a>/gi;
            let m;
            while ((m = linkRegex.exec(html2)) !== null) {
                let streamUrl = m[1].replace(/&amp;/g, "&");
                const label = m[2].trim();
                if (!streamUrl || streamUrl.startsWith("javascript:"))
                    continue;
                if (RE_ZIP_RAR.test(streamUrl))
                    continue;
                if (RE_PIXEL.test(streamUrl))
                    continue;
                if (/telegram/i.test(label) || /tg\//i.test(streamUrl))
                    continue;
                if (/hubcloud\.cx\/drive\/admin/i.test(streamUrl))
                    continue;
                if (/pixeldrain|bzzhr/i.test(streamUrl))
                    continue;
                let host = "";
                if (/cdn\.fsl-buckets\.life|r2\.cloudflarestorage|r2\.dev/i.test(streamUrl)) {
                    host = "FSL-v2";
                }
                else if (/hub\.(latent|whistle)/i.test(streamUrl)) {
                    host = "FSL";
                    streamUrl = streamUrl + "1" + new Date().getMinutes();
                }
                else {
                    continue;
                }
                streams.push(makeStream(filename, host, streamUrl, quality, host, phpUrl, fileSize));
            }
        }
        catch (_) { }
        return streams;
    });
}
function resWeight(name) {
    const n = (name || "").toLowerCase();
    if (n.includes("2160p") || n.includes("4k"))
        return 4;
    if (n.includes("1080p"))
        return 3;
    if (n.includes("720p"))
        return 2;
    return 1;
}
function srcWeight(name) {
    const n = (name || "").toLowerCase();
    if (n.includes("fsl-v2"))
        return 4;
    if (n.includes("fsl"))
        return 3;
    return 1;
}
function getStreams(tmdbId, type, season, episode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (type === "tv" && (season == null || episode == null))
            return [];
        const isSeries = type === "tv";
        let streams = [];
        try {
            const [, info] = yield Promise.all([
                refreshDomains(),
                getTMDBInfo(tmdbId, type),
            ]);
            if (!info.title)
                return streams;
            const result = yield searchSite(info.title, info.year, info.imdbId, isSeries);
            if (!result)
                return streams;
            const html = (!isSeries && result.content) || (yield fetchText(result.url));
            if (!html)
                return streams;
            const links = extractHubcloudLinks(html, +season, +episode, isSeries);
            const resolved = yield Promise.all(links.map(l => resolveHubCloud(l, info.title)));
            streams = resolved.flat();
            streams.sort((a, b) => {
                const rd = resWeight(b.name) - resWeight(a.name);
                return rd !== 0 ? rd : srcWeight(b.name) - srcWeight(a.name);
            });
            const seen = new Set();
            streams = streams.filter(s => s.url && !seen.has(s.url) && seen.add(s.url));
        }
        catch (_) { }
        return streams;
    });
}
module.exports = { getStreams };


// Knox Fire TV responsiveness guard: every scraper remains enabled.
(function () {
  try {
    var original = (typeof getStreams === "function") ? getStreams : null;
    if (!original) return;
    var TIMEOUT_MS = 20000;
    var responsiveGetStreams = function () {
      var args = arguments;
      var call;
      try { call = Promise.resolve(original.apply(this, args)); }
      catch (e) { return Promise.resolve([]); }
      var timer = new Promise(function (resolve) {
        setTimeout(function () {
          console.warn("[Knox] scraper overall timeout after 20s");
          resolve([]);
        }, TIMEOUT_MS);
      });
      return Promise.race([call, timer]).catch(function () { return []; });
    };
    if (typeof module !== "undefined" && module.exports) module.exports.getStreams = responsiveGetStreams;
    if (typeof global !== "undefined") global.getStreams = responsiveGetStreams;
    if (typeof globalThis !== "undefined") globalThis.getStreams = responsiveGetStreams;
  } catch (e) {}
})();

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
