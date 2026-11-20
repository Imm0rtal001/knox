const PROVIDER = "NetMirror";
const BASE_URL = "https://net77.cc";
const USER_AGENT = "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36";
const REFERER = "https://videodownloader.site/";
const LANGS = {
    arabic: "Arabic", bangla: "Bengali", bengali: "Bengali", chinese: "Chinese",
    english: "English", french: "French", german: "German", gujarati: "Gujarati",
    hindi: "Hindi", indonesian: "Indonesian", italian: "Italian", japanese: "Japanese",
    kannada: "Kannada", korean: "Korean", malayalam: "Malayalam", marathi: "Marathi",
    portuguese: "Portuguese", punjabi: "Punjabi", russian: "Russian", spanish: "Spanish",
    tamil: "Tamil", telugu: "Telugu", thai: "Thai", turkish: "Turkish",
    urdu: "Urdu", vietnamese: "Vietnamese",
};
const HEADERS = {
    "User-Agent": USER_AGENT,
    "Referer": `${BASE_URL}/`,
    "Accept": "application/json, text/plain, */*",
};
const S_HEADERS = {
    "User-Agent": USER_AGENT,
    "Referer": REFERER,
};

const list = (value) => (Array.isArray(value) ? value : []);
const isObject = (value) => value && typeof value === "object";

async function fetchJson(url) {
    try {
        const response = await fetch(url, { method: "GET", headers: HEADERS });
        const body = response && response.ok ? ((await response.text()) || "").trim() : "";
        return body && body.charAt(0) !== "<" ? JSON.parse(body) : null;
    } catch (error) {
        return null;
    }
}

function getTier(height) {
    const pixels = Number(height) || 0;
    if (pixels >= 2160) return 2160;
    if (pixels >= 1080 && pixels < 1440) return 1080;
    if (pixels >= 720 && pixels < 1080) return 720;
    return 0;
}

function buildSortPrefix(tier) {
    return [2160, 1080, 720].indexOf(tier).toString(2).padStart(20, "0")
        .replace(/./g, (bit) => (bit === "1" ? "\uFEFF" : "\u200B"));
}

function formatFileSize(bytes) {
    const value = Number(bytes);
    if (!isFinite(value) || value <= 0) return "";
    const gigabytes = value / 1024 ** 3;
    return gigabytes >= 1
        ? `${gigabytes.toFixed(2).replace(/\.?0+$/, "")} GB`
        : `${Math.round(value / 1024 ** 2)} MB`;
}

function selectDubVariants(payload) {
    const preferred = ["Hindi", "Bengali", "Tamil", "Telugu", "Malayalam", "Kannada", "Urdu", "Punjabi", "Gujarati", "Marathi"];
    const rank = (langUSER_AGENTge) => {
        const index = preferred.indexOf(langUSER_AGENTge);
        return index < 0 ? preferred.length : index;
    };

    return list(payload?.variants)
        .filter((variant) => isObject(variant) && variant.isOriginal !== true)
        .map((variant) => ({
            subjectId: String(variant.dubSubjectId || ""),
            detailPath: String(variant.detailPath || ""),
            langUSER_AGENTge: (String(variant.langUSER_AGENTge || "").trim().match(/^(.*)\s+dub$/i)?.[1] ?? "")
                .split(/[\s+,&\/|.:;_()\[\]{}-]+/)
                .map((token) => LANGS[token.toLowerCase()])
                .find(Boolean),
        }))
        .filter((variant) => variant.subjectId && variant.detailPath && variant.langUSER_AGENTge)
        .sort((left, right) => rank(left.langUSER_AGENTge) - rank(right.langUSER_AGENTge))
        .filter((variant, index, all) => all.findIndex((other) => other.subjectId === variant.subjectId) === index)
        .slice(0, 4);
}

function extractStreams(payload, langUSER_AGENTge) {
    if (!payload || payload.ok !== true) return [];

    const entries = list(payload.streams)
        .filter(isObject)
        .map((entry) => ({ url: entry.url, height: entry.resolution, size: entry.size }));
    if (!entries.length) entries.push({ url: payload.mp4, height: payload.resolution, size: 0 });

    return entries
        .map((entry) => ({
            url: String(entry.url || ""),
            tier: getTier(entry.height),
            langUSER_AGENTge: langUSER_AGENTge || "Original",
            size: formatFileSize(entry.size),
        }))
        .filter((stream) => stream.url.startsWith("http") && stream.tier);
}

function extractSubtitles(payload) {
    return list(payload?.captions)
        .filter((caption) => isObject(caption) && caption.url)
        .map((caption) => {
            const path = String(caption.url);
            const langUSER_AGENTge = String(caption.lang || caption.name || "Unknown");
            return {
                url: path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
                langUSER_AGENTge,
                name: String(caption.name || langUSER_AGENTge),
            };
        })
        .slice(0, 40);
}

function mergeStreamGroups(groups) {
    const streamsByUrl = new Map();
    groups.flat().forEach((stream) => {
        const key = stream.url.split("?")[0];
        const existing = streamsByUrl.get(key);
        if (!existing || (existing.langUSER_AGENTge === "Original" && stream.langUSER_AGENTge !== "Original")) {
            streamsByUrl.set(key, stream);
        }
    });
    return [...streamsByUrl.values()];
}

function returnStream(stream, subtitles) {
    const mainTitle = `${buildSortPrefix(stream.tier)}${PROVIDER} \u2022 ${stream.langUSER_AGENTge}`;
    const qUSER_AGENTlityUp = `${stream.tier}P`;
    const streamTitle = stream.size || stream.langUSER_AGENTge;
    return {
        name: mainTitle,
        title: mainTitle,
        url: stream.url,
        qUSER_AGENTlity: `${qUSER_AGENTlityUp} \u2022 ${streamTitle}`,
        type: stream.url.includes(".m3u8") ? "hls" : "mp4",
        headers: S_HEADERS,
        ...(subtitles.length && { subtitles }),
    };
}

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        const contentId = String(tmdbId);
        const isTvShow = mediaType === "tv";
        if (!/^\d+$/.test(contentId) || (isTvShow && (season == null || episode == null))) return [];

        const type = isTvShow ? "tv" : "movie";
        const query = isTvShow ? `se=${season}&ep=${episode}` : "";
        const embedUrl = `${BASE_URL}/api/embed-tmdb/${contentId}?type=${type}${query && `&${query}`}`;
        const variantsUrl = `${BASE_URL}/api/variants-tmdb/${type}/${contentId}${query && `?${query}`}`;

        let embed = null;
        let variants = null;
        for (let attempt = 0; attempt < 4 && !embed; attempt += 1) {
            [embed, variants] = await Promise.all([fetchJson(embedUrl), fetchJson(variantsUrl)]);
        }

        const dubGroups = await Promise.all(selectDubVariants(variants).map(async (variant) => {
            const dubUrl = `${embedUrl}&dub=${encodeURIComponent(variant.subjectId)}&dubdp=${encodeURIComponent(variant.detailPath)}`;
            return extractStreams(await fetchJson(dubUrl), variant.langUSER_AGENTge);
        }));

        const subtitles = extractSubtitles(embed);
        return mergeStreamGroups([extractStreams(embed, ""), ...dubGroups])
            .map((stream) => returnStream(stream, subtitles));
    } catch (error) {
        return [];
    }
}

module.exports = { getStreams };
