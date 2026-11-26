const API_BASE = "https://hicine.biz";
const TMDB_API = "https://api.themoviedb.org/3";
const TMDB_KEY = (typeof TMDB_API_KEY !== "undefined" && TMDB_API_KEY) || "307b7b8ef035c6aa336900aef4e203bd";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36";

let count1080p = 0;
const streamMeta = new WeakMap();

function getSortTag(rank) {
    const inv = 4 - Math.max(0, Math.min(4, rank));
    let bin = inv.toString(2);
    while (bin.length < 20) bin = "0" + bin;
    return bin.split("").map(b => b === "1" ? "\uFEFF" : "\u200B").join("");
}

async function fetchSafe(url, opts = {}) {
    try {
        return await fetch(url, {
            ...opts,
            headers: {
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                ...(opts.headers || {})
            }
        });
    } catch (e) {
        return null;
    }
}

const fetchJson = async (url, opts = {}) => {
    try {
        const r = await fetchSafe(url, opts);
        if (!r || !r.ok) return null;
        const text = await r.text();
        if (!text || !text.trimStart().startsWith("{")) return null;
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
};

function makeStream(title, url, quality, headers, fallbackQ = "HD", serverLabel = "") {
    if (!url || !url.startsWith("https://")) return null;
    const nq = [quality, fallbackQ].find(q => ["2160p", "1440p", "1080p"].includes(q));
    if (!nq || (nq === "1080p" && count1080p >= 4)) return null;

    const t = (title || "").replace(/[\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
    const sizeM = t.match(/\[\s*(\d+(?:\.\d+)?\s*[MG]B)\s*\]/i);
    const sizeStr = sizeM ? sizeM[1].trim() : null;
    const src = /bluray|blu\-ray|bdrip/i.test(t) ? "Blu-ray" : /hdrip|webrip/i.test(t) ? "WEBRip" : "WEB-DL";
    const imax = /imax/i.test(t) ? " • IMAX" : "";
    const range = /dolby\s*vision|dovi/i.test(t) ? "Dolby Vision" : /hdr10\+/i.test(t) ? "HDR10+" : /hdr10/i.test(t) ? "HDR10" : /hdr/i.test(t) ? "HDR" : /10\s*\-?bit/i.test(t) ? "10-Bit" : /sdr/i.test(t) ? "SDR" : "";
    const codec = /hevc|x265|h\.?265/i.test(t) ? "H.265" : /av1/i.test(t) ? "AV1" : "H.264";

    let audio = "AAC";
    const am = t.match(/(TrueHD\s*7\.1|DDP\s*7\.1|DDP\s*5\.1|DD\s*5\.1|5\.1|AAC)/i);
    if (am) {
        audio = am[1].toUpperCase().replace(/\s+/g, "");
        if (audio === "5.1") audio = "DDP5.1";
        if (audio.includes("TRUEHD")) audio = "TrueHD 7.1";
    } else if (/dolby\s*digital|dd/i.test(t)) audio = "Dolby Digital";
    if (/atmos/i.test(t)) audio += " • Atmos";

    const langs = /dual|hindi\-eng|eng\-hin/i.test(t) ? "English • Hindi" : ([/english|eng/i.test(t) && "English", /hindi|hin/i.test(t) && "Hindi"].filter(Boolean).join(" • ") || "English");

    if (nq === "1080p") count1080p++;

    const sortTag = getSortTag({ "2160p": 4, "1440p": 3, "1080p": 2 }[nq]);
    const shortLabel = `VegaMovies • ${nq.toUpperCase()}${imax}${serverLabel ? " • " + serverLabel : ""}`;
    const detailLine1 = `${langs}${sizeStr ? " • " + sizeStr : ""}`;
    const detailLine2 = `${src} • ${audio}${range ? " • " + range : ""} • ${codec}`;

    const stream = {
        name: sortTag + shortLabel,
        title: sortTag + shortLabel,
        quality: nq + " \u2022 " + detailLine1 + "\n" + detailLine2,
        url,
        headers: headers || {}
    };
    streamMeta.set(stream, { host: serverLabel || shortLabel, size: sizeStr ? sizeStr.replace(/\s+/g, "").toUpperCase() : "", lang: langs });
    return stream;
}

const dedupeBySize = streams => {
    const seen = new Set();
    return (streams || []).filter(x => {
        const m = x && streamMeta.get(x);
        if (!m || !m.size) return true;
        const k = m.host + "|" + m.size;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
};

const dedupe = streams => { const s = new Set(); return (streams || []).filter(x => x && x.url && !s.has(x.url) && s.add(x.url)); };

async function getTMDBInfo(tmdbId, mediaType) {
    const t = mediaType === "tv" ? "tv" : "movie";
    const d = await fetchJson(`${TMDB_API}/${t}/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=external_ids`);
    if (d) {
        return {
            title: t === "tv" ? d.name : d.title,
            originalTitle: t === "tv" ? d.original_name : d.original_title,
            year: (d.first_air_date || d.release_date || "").split("-")[0],
            imdb: d.imdb_id || (d.external_ids && d.external_ids.imdb_id) || null
        };
    }
    return { title: String(tmdbId), originalTitle: null, year: null, imdb: null };
}

const hiFetchJson = path => fetchJson(`${API_BASE}${path}`, { headers: { "User-Agent": USER_AGENT, "Accept": "application/json, text/plain, */*", "Referer": `${API_BASE}/` } });

function hiGate(limit) {
    let active = 0;
    const queue = [];
    const next = () => {
        if (active >= limit || !queue.length) return;
        active++;
        const job = queue.shift();
        job.fn().then(job.resolve, job.reject).finally(() => { active--; next(); });
    };
    return fn => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); next(); });
}

const hiQuality = text => {
    const m = String(text || "").match(/\b(2160p|1440p|1080p|720p|480p|360p)\b/i) || String(text || "").match(/\b4k\b/i);
    if (!m) return "";
    const q = m[1] ? m[1].toLowerCase() : "4k";
    return q === "4k" ? "2160p" : q;
};
const hiAllowedQ = q => q === "2160p" || q === "1080p";
const hiSize = text => { const m = String(text || "").match(/(\d+(?:\.\d+)?)\s*(GB|MB)/i); return m ? m[1] + m[2].toUpperCase() : ""; };
const hiLang = text => {
    const s = String(text || "").toLowerCase();
    return ["hindi", "punjabi", "urdu", "tamil", "telugu", "marathi", "kannada", "malayalam", "bengali", "gujarati", "english", "korean", "japanese", "chinese", "spanish", "arabic"].filter(l => s.includes(l)).join("-");
};
const hiLangTier = lang => !lang ? 3 : lang.includes("hindi") ? 0 : (lang.includes("punjabi") || lang.includes("urdu")) ? 1 : lang.includes("english") ? 4 : 2;
const hiOptionRank = id => { const i = ["pixel", "fsl2", "fsl", "server1", "gdirect"].indexOf(id); return i < 0 ? 5 : i; };
const hiHostRank = id => { const i = ["vcloud", "gdirect", "vdrive"].indexOf(id); return i < 0 ? 3 : i; };
const hiNorm = s => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
const hiGroupQuality = g => hiQuality(`${g.quality || ""} ${g.head || ""}`);

async function hiSearch(query) {
    const d = await hiFetchJson(`/hapi/search?q=${encodeURIComponent(query)}&page=1`);
    return (d && Array.isArray(d.items)) ? d.items : [];
}

async function hiFindId(info, mediaType) {
    const wantSeries = mediaType === "tv";
    const queries = [info.title, info.originalTitle, String(info.title || "").replace(/[:\-–—]+/g, " ")]
        .map(q => String(q || "").replace(/\s+/g, " ").trim())
        .filter((q, i, a) => q && a.indexOf(q) === i);
    if (!queries.length) return null;

    const lists = await Promise.all(queries.map(hiSearch));
    const names = [info.title, info.originalTitle].map(hiNorm).filter(Boolean);
    const year = parseInt(info.year, 10) || null;

    const seen = new Set();
    const candidates = [];
    for (const list of lists) {
        for (const card of list) {
            if (!card || !card.id || !card.title || seen.has(card.id)) continue;
            seen.add(card.id);
            if ((card.kind === "series") !== wantSeries) continue;
            const t = hiNorm(card.title);
            if (!t) continue;
            const exact = names.indexOf(t) >= 0;
            const partial = !exact && names.some(n => n.length >= 3 && t.length >= 3 && (t.includes(n) || n.includes(t)));
            if (!exact && !partial) continue;
            const diff = (year && card.year) ? Math.abs(card.year - year) : 0;
            if (diff > 1 && !(wantSeries && exact)) continue;
            candidates.push({ id: card.id, score: (exact ? 0 : 10) + diff });
        }
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => a.score - b.score);

    const details = (await Promise.all(candidates.slice(0, 3).map(c => hiFetchJson(`/hapi/t?c=${encodeURIComponent(c.id)}`))))
        .filter(d => d && d.title);
    if (!details.length) return null;
    if (info.imdb) {
        const byImdb = details.find(d => d.imdb && String(d.imdb) === info.imdb);
        if (byImdb) return byImdb;
    }
    return details[0];
}

const hiDlGate = hiGate(4);

async function hiDlOptions(k) {
    const d = await hiDlGate(() => hiFetchJson(`/hapi/dl?k=${encodeURIComponent(k)}`));
    return (d && Array.isArray(d.options)) ? d.options : [];
}

async function hiCollectSlots(groups, ep) {
    const gate = hiGate(6);
    const perGroup = await Promise.all(groups.map(group => gate(async () => {
        const d = await hiFetchJson(`/hapi/g?k=${encodeURIComponent(group.k)}`);
        const items = (d && Array.isArray(d.items)) ? d.items : [];
        let scoped;
        if (ep != null) {
            const exact = items.filter(i => i.ep === ep);
            scoped = exact.length ? exact : items.filter(i => i.ep == null);
        } else {
            const noEp = items.filter(i => i.ep == null);
            scoped = noEp.length ? noEp : items.slice(0, 1);
        }
        const item = scoped[0];
        if (!item) return [];

        const hosts = (item.hosts || [])
            .filter((h, i, a) => a.findIndex(x => x.id === h.id) === i)
            .sort((a, b) => hiHostRank(a.id) - hiHostRank(b.id))
            .slice(0, 3)
            .filter(h => h.k);

        const slots = await Promise.all(hosts.map(async host => {
            const options = (await hiDlOptions(host.k)).filter(o => !["transferit", "buzzheavier", "vikingfile", "gofile", "ten"].includes(o.id) && (o.k || o.ks));
            return options.length ? { group, hostKey: host.k, options } : null;
        }));
        return slots.filter(Boolean);
    })));
    return perGroup.reduce((acc, list) => acc.concat(list), []);
}

async function hiGoUrl(key) {
    const d = await hiFetchJson(`/hapi/go?k=${encodeURIComponent(key)}&m=u`);
    return d && typeof d.url === "string" && d.url.startsWith("http") ? d.url : null;
}

async function hiResolveOption(option) {
    const short = option.ks || null;
    const long = option.k || null;
    if (short) {
        const u = await hiGoUrl(short);
        if (u) return u;
    }
    if (long && long !== short) {
        const u = await hiGoUrl(long);
        if (u) return u;
    }
    return null;
}

function hiPixelDirect(pageUrl) {
    const id = pageUrl.split("?")[0].split("#")[0].replace(/\/+$/, "").split("/").pop();
    if (!id || id.length < 5 || id.length > 15) return null;
    return `https://pixeldrain.dev/api/file/${id}`;
}

function hiBuild(option, url, group) {
    let finalUrl = url;
    if (option.id === "pixel" || url.indexOf("pixeldrain.dev/u/") >= 0) {
        finalUrl = hiPixelDirect(url);
        if (!finalUrl) return null;
    } else if (/transfer\.it|bzzhr\.co|buzzheavier|vikingfile|gofile\.io/i.test(url)) {
        return null;
    }
    const q = hiGroupQuality(group);
    const size = hiSize(`${group.size || ""} ${group.head || ""}`);
    const t = [group.head, q, size ? "[" + size + "]" : ""].filter(Boolean).join(" ");
    return makeStream(t, finalUrl, q, { "User-Agent": USER_AGENT }, "HD",
        { fsl: "FSL", fsl2: "FSLv2", pixel: "PixelDrain", gdirect: "G-Direct", server1: "Server 1" }[option.id] || option.name || option.id || "");
}

async function hiResolveAll(slots) {
    const targets = [];
    slots.forEach(slot => slot.options.forEach(option => targets.push({ slot, option, q: hiGroupQuality(slot.group), tier: hiLangTier(hiLang(slot.group.head)) })));
    const qRank = { "2160p": 5, "1080p": 3 };
    targets.sort((a, b) => (hiOptionRank(a.option.id) - hiOptionRank(b.option.id)) || (a.tier - b.tier) || ((qRank[b.q] || 0) - (qRank[a.q] || 0)));

    const streams = [];
    const failed = [];
    let deadStreak = 0;

    for (const { slot, option, q } of targets) {
        if (deadStreak >= 8) break;
        if (q === "1080p" && count1080p >= 4) continue;
        const url = await hiResolveOption(option);
        if (!url) { failed.push({ slot, option }); deadStreak++; continue; }
        deadStreak = 0;
        const s = hiBuild(option, url, slot.group);
        if (s) streams.push(s);
    }

    if (failed.length) {
        const wanted = new Map();
        failed.forEach(({ slot, option }) => {
            if (!wanted.has(slot)) wanted.set(slot, []);
            wanted.get(slot).push(option.id);
        });
        let misses = 0;
        for (const [slot, ids] of wanted) {
            if (misses >= 3) break;
            const q = hiGroupQuality(slot.group);
            const fresh = (await hiDlOptions(slot.hostKey)).filter(o => ids.indexOf(o.id) >= 0);
            for (const option of fresh) {
                if (q === "1080p" && count1080p >= 4) break;
                const url = await hiResolveOption(option);
                if (!url) { misses++; continue; }
                misses = 0;
                const s = hiBuild(option, url, slot.group);
                if (s) streams.push(s);
            }
        }
    }
    return streams;
}

async function getHicineStreams(info, mediaType, season, episode) {
    const detail = await hiFindId(info, mediaType);
    if (!detail) return [];

    const all = (detail.groups || []).filter(g => g && g.k);
    let groups;
    if (mediaType === "tv") {
        groups = all.filter(g => g.season === season);
        if (!groups.length && !all.some(g => g.season != null)) groups = all;
    } else {
        groups = all.filter(g => g.season == null);
        if (!groups.length) groups = all;
    }
    groups = groups.filter(g => hiAllowedQ(hiGroupQuality(g)));
    if (!groups.length) return [];

    const slots = await hiCollectSlots(groups, mediaType === "tv" ? episode : null);
    if (!slots.length) return [];

    const streams = dedupeBySize(dedupe(await hiResolveAll(slots)));
    const tierOf = s => { const m = streamMeta.get(s); return m ? hiLangTier(hiLang(m.lang)) : 3; };
    return streams.sort((a, b) => tierOf(a) - tierOf(b));
}

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        if (!/^\d+$/.test(String(tmdbId))) return [];
        if (mediaType !== "tv" && mediaType !== "movie") return [];
        const isTv = mediaType === "tv";
        if (isTv && (season == null || episode == null)) return [];
        count1080p = 0;
        const info = await getTMDBInfo(tmdbId, mediaType);
        if (!info || !info.title) return [];
        return await getHicineStreams(info, mediaType, isTv ? Number(season) : null, isTv ? Number(episode) : null);
    } catch (e) {
        return [];
    }
}

module.exports = { getStreams };
