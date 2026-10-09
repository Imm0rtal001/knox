const BASE_URL = "https://animedekho.tv";
const TMDB_API = "https://api.themoviedb.org/3";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36";
const HEADERS = { "User-Agent": USER_AGENT, Referer: BASE_URL + "/" };

async function get(url, options) {
    try {
        const res = await fetch(url, {
            headers: Object.assign({}, HEADERS, (options && options.headers) || {}),
            method: (options && options.method) || "GET",
            body: options && options.body,
        });
        return res.ok ? await res.text() : "";
    } catch {
        return "";
    }
}

function tryParseJson(text) {
    try { return JSON.parse(text); } catch { return null; }
}

function unescapeHtmlEntities(str) {
    return String(str || "").replace(/&amp;/g, "&").replace(/&#038;/g, "&");
}

function getOrigin(url) {
    const match = String(url).match(/^(https?:\/\/[^/?#]+)/i);
    return match ? match[1] : "";
}

function getHostname(url) {
    const match = String(url).match(/^https?:\/\/([^/?#:]+)/i);
    return match ? match[1].toLowerCase() : "";
}

function resolveUrl(src, base) {
    src = unescapeHtmlEntities(String(src || "").trim());
    if (!src) return "";
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith("//")) return "https:" + src;
    if (src.startsWith("/")) return getOrigin(base || BASE_URL) + src;
    return "";
}

function slugify(str) {
    return String(str || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function stripSiteBoilerplate(title) {
    return String(title || "")
        .replace(/watch online/gi, "")
        .replace(/\s*\|\s*AnimeDekho.*/i, "")
        .replace(/\s+(movie|series)?\s*in\s+(hindi|tamil|telugu).*/i, "")
        .replace(/\s*\(.*$/, "")
        .replace(/\s*\[.*$/, "")
        .trim();
}

function uniqueByUrl(streams) {
    const seen = new Set();
    return streams.filter(s => s.url && !seen.has(s.url) && seen.add(s.url));
}

function extractIframeSrc(html) {
    const match = String(html || "").match(/<iframe[^>]+src=["']([^"']+)["']/i);
    return match ? unescapeHtmlEntities(match[1]) : null;
}

async function fetchTmdbMetadata(tmdbId, mediaType) {
    if (!TMDB_API_KEY) return null;
    const segment = mediaType === "tv" ? "tv" : "movie";
    const body = await get(`${TMDB_API}/${segment}/${tmdbId}?api_key=${TMDB_API_KEY}`);
    const data = tryParseJson(body);
    if (!data) return null;
    const title = mediaType === "tv" ? data.name : data.title;
    const originalTitle = mediaType === "tv" ? data.original_name : data.original_title;
    const year = parseInt(String(data.release_date || data.first_air_date || "").slice(0, 4), 10) || null;
    return { title: title || "", originalTitle: originalTitle || "", year };
}

function parseSearchResults(html) {
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);
    let articles = $("ul[data-results] li article");
    if (!articles.length) articles = $("article");
    const results = [];
    articles.each((i, el) => {
        const href = $(el).find("a.lnk-blk").first().attr("href");
        if (!href) return;
        const imgAlt = ($(el).find("div figure img").first().attr("alt") || "").trim();
        const heading = $(el).find("header h2").first().text().trim();
        const title = imgAlt && !/anime/i.test(imgAlt) && imgAlt.length > 2 ? imgAlt
            : heading && !/animedekho/i.test(heading) && heading.length > 2 ? heading
                : href.replace(/\/$/, "").split("/").pop().replace(/-/g, " ");
        results.push({ href, title });
    });
    return results;
}

function rankTitleMatch(candidateTitle, targets) {
    const normalized = slugify(stripSiteBoilerplate(candidateTitle));
    let best = 0;
    for (const target of targets) {
        const t = slugify(target);
        if (!normalized || !t) continue;
        if (normalized === t) best = Math.max(best, 3);
        else if (normalized.startsWith(t) || t.startsWith(normalized)) best = Math.max(best, 2);
        else if (normalized.includes(t) || t.includes(normalized)) best = Math.max(best, 1);
    }
    return best;
}

async function searchCandidatePages(metadata, mediaType) {
    const targets = [metadata.title, metadata.originalTitle].filter(Boolean);
    const queries = Array.from(new Set(targets));
    const visited = new Set();
    let candidates = [];
    for (const query of queries) {
        const html = await get(`${BASE_URL}/?s=${encodeURIComponent(query)}`);
        if (!html) continue;
        for (const result of parseSearchResults(html)) {
            if (visited.has(result.href)) continue;
            visited.add(result.href);
            const rank = rankTitleMatch(result.title, targets);
            if (rank > 0) candidates.push(Object.assign({ rank }, result));
        }
        if (candidates.some(c => c.rank >= 2)) break;
    }
    const typeKeyword = mediaType === "tv" ? "series" : "movie";
    candidates.sort((a, b) => (b.rank - a.rank) ||
        ((b.href.includes(typeKeyword) ? 1 : 0) - (a.href.includes(typeKeyword) ? 1 : 0)));
    return candidates.slice(0, 4);
}

function parseEpisodeList(html) {
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);
    const episodes = [];
    $("ul.seasons-lst li").each((i, li) => {
        const href = $(li).find("a").first().attr("href");
        if (!href) return;
        const label = $(li).find("h3.title span").first().text() || "";
        const seasonMatch = label.match(/S\s*(\d+)/i);
        episodes.push({ href, season: seasonMatch ? parseInt(seasonMatch[1], 10) : null });
    });
    const episodeCounters = {};
    episodes.forEach(ep => {
        const key = ep.season == null ? "n" : String(ep.season);
        episodeCounters[key] = (episodeCounters[key] || 0) + 1;
        ep.episode = episodeCounters[key];
    });
    return episodes;
}

function extractPageYear(html) {
    const match = html.match(/<span class="year">(\d{4})<\/span>/);
    return match ? parseInt(match[1], 10) : null;
}

async function extractVexal(embedUrl, push) {
    const origin = getOrigin(embedUrl);
    const hash = embedUrl.split("?")[0].split("/").pop();
    const body = await get(`${origin}/player/index.php?data=${hash}&do=getVideo`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest", Referer: embedUrl },
        body: `hash=${encodeURIComponent(hash)}&r=${encodeURIComponent(origin)}`,
    });
    const data = tryParseJson(body);
    if (data && data.videoSource) {
        push({ url: data.videoSource, label: "Vexal", headers: { Referer: origin + "/", "User-Agent": USER_AGENT } });
    }
}

async function extractVidmoly(embedUrl, push) {
    const body = await get(embedUrl, { headers: { Referer: getOrigin(embedUrl) + "/" } });
    const match = body.match(/file\s*:\s*['"]([^'"]+\.m3u8[^'"]*)['"]/) ||
        body.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/);
    if (match) {
        push({ url: match[1] || match[0], label: "VidMoly", headers: { Referer: getOrigin(embedUrl) + "/", "User-Agent": USER_AGENT } });
    }
}

async function dispatchEmbed(rawSrc, push) {
    const url = resolveUrl(rawSrc, BASE_URL);
    if (!url) return;
    const hostname = getHostname(url);
    try {
        if (/vexal/.test(hostname)) return await extractVexal(url, push);
        if (/vidmoly/.test(hostname)) return await extractVidmoly(url, push);
    } catch { }
}

async function scrapeStreamsFromPage(pageUrl, serverIndex) {
    const collected = [];
    const push = stream => { if (stream && stream.url) collected.push(stream); };

    const html = await get(pageUrl, { headers: { Cookie: "toronites_server=vidstream" } });
    if (!html) return collected;

    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const serverFrames = [];
    $("iframe.serversel[src]").each((i, el) => {
        const src = $(el).attr("src");
        if (src) serverFrames.push(src);
    });

    const bodyClass = $("body").attr("class") || "";
    const termId = (bodyClass.match(/(?:term|postid)-(\d+)/) || [])[1];

    const pending = [];

    for (const src of serverFrames) {
        pending.push((async () => {
            const frameHtml = await get(resolveUrl(src, BASE_URL), { headers: { Referer: pageUrl } });
            const embedSrc = extractIframeSrc(frameHtml);
            if (embedSrc) await dispatchEmbed(embedSrc, push);
        })());
    }

    if (termId) {
        for (let slot = 0; slot <= 10; slot++) {
            pending.push((async () => {
                const slotHtml = await get(`${BASE_URL}/?trdekho=${slot}&trid=${termId}&trtype=${serverIndex}`, { headers: { Referer: pageUrl } });
                const embedSrc = extractIframeSrc(slotHtml);
                if (embedSrc) await dispatchEmbed(embedSrc, push);
            })());
        }
    }

    await Promise.allSettled(pending);
    return collected;
}

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        if (mediaType === "tv" && (season == null || episode == null)) return [];

        const metadata = await fetchTmdbMetadata(tmdbId, mediaType);
        if (!metadata || (!metadata.title && !metadata.originalTitle)) return [];

        const candidates = await searchCandidatePages(metadata, mediaType);
        let target = null;

        for (const candidate of candidates) {
            const html = await get(candidate.href);
            if (!html) continue;
            const episodes = parseEpisodeList(html);

            if (mediaType === "tv") {
                if (!episodes.length) continue;
                let match = episodes.find(e => e.season === season && e.episode === episode);
                if (!match && season === 1) match = episodes.find(e => e.season == null && e.episode === episode);
                if (match) { target = { url: match.href, serverIndex: 2 }; break; }
            } else {
                if (episodes.length) continue;
                const year = extractPageYear(html);
                if (metadata.year && year && Math.abs(metadata.year - year) > 1) continue;
                target = { url: candidate.href, serverIndex: 1 };
                break;
            }
        }

        if (!target) return [];

        const raw = await scrapeStreamsFromPage(target.url, target.serverIndex);
        return uniqueByUrl(raw.map(stream => ({
            name: `AnimeDekho \u2022 ${stream.label}`,
            title: `AnimeDekho \u2022 ${stream.label}`,
            url: stream.url,
            quality: "1080p",
            headers: stream.headers || HEADERS,
        })));
    } catch {
        return [];
    }
}

module.exports = { getStreams };
