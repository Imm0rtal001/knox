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
const MAIN_URL = "https://animesalt.link";
const TMDB_API_KEY = "307b7b8ef035c6aa336900aef4e203bd";
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149.0.0.0 Safari/537.36",
    "Referer": "https://animesalt.link",
};
function fetchHtml(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, options = {}) {
        const resolvedUrl = url.startsWith("http") ? url : `${MAIN_URL}${url}`;
        try {
            const response = yield fetch(resolvedUrl, Object.assign({ headers: HEADERS }, options));
            if (!response.ok)
                return "";
            return yield response.text();
        }
        catch (_) {
            return "";
        }
    });
}
function fetchJson(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, options = {}) {
        try {
            const response = yield fetch(url, Object.assign({ headers: HEADERS }, options));
            if (!response.ok)
                return null;
            return yield response.json();
        }
        catch (_) {
            return null;
        }
    });
}
function fetchTmdbMetadata(tmdbId, mediaType) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoint = mediaType === "movie" ? "movie" : "tv";
        const data = yield fetchJson(`https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}`);
        if (!data)
            return null;
        const title = data.title || data.name;
        const year = parseInt((data.release_date || data.first_air_date || "").split("-")[0]) || null;
        return { title, year };
    });
}
function fetchEpisodeTitle(tmdbId, season, episode) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const data = yield fetchJson(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${season}?api_key=${TMDB_API_KEY}`);
        const episodeNumber = parseInt(episode) || 1;
        return ((_b = (_a = data === null || data === void 0 ? void 0 : data.episodes) === null || _a === void 0 ? void 0 : _a.find((ep) => ep.episode_number === episodeNumber)) === null || _b === void 0 ? void 0 : _b.name) || "";
    });
}
function normalizeTitle(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}
function extractSearchEntries(html, mediaType) {
    const containerMatch = html.match(/id="movies-a"([\s\S]*?)(?=<footer|id="footer|class="footer)/m);
    const contentHtml = containerMatch ? containerMatch[1] : html;
    const entries = [];
    const visitedSlugs = new Set();
    const articlePattern = /<article[^>]*>([\s\S]*?)<\/article>/g;
    let match;
    while ((match = articlePattern.exec(contentHtml)) !== null) {
        const articleHtml = match[1];
        const linkMatch = articleHtml.match(/href="(https:\/\/animesalt\.link\/(series|movies)\/([^\/\"]+)\/?)"/);
        const titleMatch = articleHtml.match(/class="entry-title"[^>]*>([^<]+)</);
        const yearMatch = articleHtml.match(/class="year"[^>]*>(\d{4})</);
        if (!linkMatch || !titleMatch)
            continue;
        const [, url, type, slug] = linkMatch;
        if (!slug || slug === "page" || visitedSlugs.has(slug))
            continue;
        visitedSlugs.add(slug);
        entries.push({ url, type, slug, title: titleMatch[1].trim(), year: yearMatch ? +yearMatch[1] : null });
    }
    const typed = entries.filter((entry) => entry.type === (mediaType === "movie" ? "movies" : "series"));
    return typed.length ? typed : entries;
}
function selectTopCandidate(entries, title, year) {
    let pool = entries;
    if (year) {
        const yearAligned = entries.filter((e) => e.year !== null && Math.abs(e.year - year) <= 1);
        const undated = entries.filter((e) => e.year === null);
        pool = yearAligned.length ? yearAligned : undated.length ? undated : entries;
    }
    const normalizedQuery = normalizeTitle(title);
    pool.sort((a, b) => {
        const na = normalizeTitle(a.title), nb = normalizeTitle(b.title);
        const exactDiff = (na === normalizedQuery ? 0 : 1) - (nb === normalizedQuery ? 0 : 1);
        if (exactDiff !== 0)
            return exactDiff;
        const prefixDiff = (na.startsWith(normalizedQuery) ? 0 : 1) - (nb.startsWith(normalizedQuery) ? 0 : 1);
        if (prefixDiff !== 0)
            return prefixDiff;
        return na.length - nb.length;
    });
    return pool[0] || null;
}
function resolveAnimePageUrl(title, mediaType, year) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = yield fetchHtml(`/?s=${encodeURIComponent(title)}`);
        if (!html)
            return null;
        const entries = extractSearchEntries(html, mediaType);
        if (!entries.length)
            return null;
        const candidate = selectTopCandidate(entries, title, year);
        return candidate ? candidate.url : null;
    });
}
function extractEpisodeUrl(html, season, episode) {
    var _a, _b;
    const pattern = new RegExp(`href="(https://animesalt\\.link/episode/[^"]*${season}x${episode}[^"]*)"`);
    return (_b = (_a = pattern.exec(html)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : null;
}
function resolveEpisodeUrl(seriesPageUrl, season, episode) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = yield fetchHtml(seriesPageUrl);
        if (!html)
            return null;
        const seasonEntries = [];
        const seasonPattern = /data-post="(\d+)"\s+data-season="(\d+)"/g;
        let match;
        while ((match = seasonPattern.exec(html)) !== null) {
            seasonEntries.push({ post: match[1], season: +match[2] });
        }
        if (!seasonEntries.length)
            return extractEpisodeUrl(html, season, episode);
        const targetSeason = seasonEntries.find((s) => s.season === +season);
        if (!targetSeason)
            return null;
        const seasonHtml = yield fetchHtml(`/wp-admin/admin-ajax.php?action=action_select_season&season=${season}&post=${targetSeason.post}`);
        return seasonHtml ? extractEpisodeUrl(seasonHtml, season, episode) : null;
    });
}
function resolveStreamData(pageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const html = yield fetchHtml(pageUrl);
        if (!html)
            return null;
        const playerMatch = html.match(/src="(https:\/\/as-cdn\d+\.top\/video\/([a-f0-9]+))"/);
        if (!playerMatch)
            return null;
        const [, playerUrl, videoHash] = playerMatch;
        const cdnOrigin = playerUrl.split("/video/")[0];
        try {
            const response = yield fetch(`${cdnOrigin}/player/index.php?data=${videoHash}&do=getVideo`, {
                method: "POST",
                headers: Object.assign(Object.assign({}, HEADERS), { "Content-Type": "application/x-www-form-urlencoded", "Origin": cdnOrigin, "X-Requested-With": "XMLHttpRequest" }),
                body: `hash=${videoHash}&r=${encodeURIComponent(MAIN_URL + "/")}`,
            });
            if (!response.ok)
                return null;
            const payload = yield response.json();
            const m3u8Url = payload.videoSource || payload.securedLink;
            if (!m3u8Url)
                return null;
            const contentHash = (_b = (_a = m3u8Url.match(/\/hls\/([a-f0-9]+)\//)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : videoHash;
            const cdnBase = m3u8Url.split("/cdn/hls/")[0];
            const subtitleUrl = `${cdnBase}/cdn/down/${contentHash}/Subtitle/subtitle_eng.srt`;
            return { url: m3u8Url, subtitle: subtitleUrl, cdnBase };
        }
        catch (_) {
            return null;
        }
    });
}
function getStreams(tmdbId, mediaType, season, episode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (mediaType === "tv" && (season == null || episode == null))
            return [];
        try {
            const metadata = yield fetchTmdbMetadata(tmdbId, mediaType);
            if (!(metadata === null || metadata === void 0 ? void 0 : metadata.title))
                return [];
            const { title, year } = metadata;
            const episodeTitle = mediaType === "tv"
                ? yield fetchEpisodeTitle(tmdbId, season, episode)
                : "";
            const animePageUrl = yield resolveAnimePageUrl(title, mediaType, year);
            if (!animePageUrl)
                return [];
            let stream = null;
            if (mediaType === "movie") {
                stream = yield resolveStreamData(animePageUrl);
            }
            else {
                const episodeUrl = yield resolveEpisodeUrl(animePageUrl, season, episode);
                if (episodeUrl)
                    stream = yield resolveStreamData(episodeUrl);
            }
            if (!stream)
                return [];
            const episodeLabel = mediaType === "tv" && season && episode
                ? ` • Episode ${episode}${episodeTitle ? ` - ${episodeTitle}` : ""}`
                : "";
            return [{
                    name: "AnimeSalt",
                    title: `${title}${episodeLabel} • 1080p`,
                    url: stream.url,
                    quality: "1080p",
                    headers: {
                        "Referer": stream.cdnBase + "/",
                        "Origin": stream.cdnBase,
                        "User-Agent": HEADERS["User-Agent"],
                    },
                    subtitles: stream.subtitle
                        ? [{ url: stream.subtitle, lang: "en", name: "English" }]
                        : [],
                }];
        }
        catch (_) {
            return [];
        }
    });
}
module.exports = { getStreams };

