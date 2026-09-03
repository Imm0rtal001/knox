"use strict";

/*
 * AnimeWorld provider for Knox / Nuvio TV.
 * - No cheerio/CryptoJS or other npm dependency.
 * - Keeps the required module.exports = { getStreams } interface.
 * - Uses TMDB_API_KEY from the environment when available.
 *
 * IMPORTANT: The Nuvio sandbox must provide TMDB_API_KEY for this provider
 * to resolve titles. Do not hard-code a TMDB key in the provider.
 */

const PROVIDER_NAME = "AnimeWorld.";
const BASE_URL = "https://watchanimeworld.one";
const PLAYER_BASE_URL = "https://play.zephyrix.org";
const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY =
  (typeof process !== "undefined" && process.env && process.env.TMDB_API_KEY) || "";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

const HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const DEBUG =
  typeof process !== "undefined" &&
  process.env &&
  process.env.ANIMEWORLD_DEBUG === "1";

function logError(context, error, extra) {
  if (!DEBUG) return;
  const message = error && error.message ? error.message : String(error);
  console.error(`[${PROVIDER_NAME}] ${context}: ${message}`, extra || "");
}

function fail(message) {
  throw new Error(`[${PROVIDER_NAME}] ${message}`);
}

function addQuery(url, key, value) {
  const separator = url.indexOf("?") >= 0 ? "&" : "?";
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

async function fetchText(url, extraHeaders) {
  const headers = Object.assign({}, HEADERS, extraHeaders || {});
  try {
    const response = await fetch(url, { headers });
    if (!response || !response.ok) {
      logError("HTTP text request failed", new Error(
        `${response ? response.status : "no response"} ${url}`
      ));
      return null;
    }
    return await response.text();
  } catch (error) {
    logError(`GET ${url}`, error);
    return null;
  }
}

async function fetchJson(url, extraHeaders) {
  const headers = Object.assign({}, HEADERS, extraHeaders || {});
  try {
    const response = await fetch(url, { headers });
    if (!response || !response.ok) {
      logError("HTTP JSON request failed", new Error(
        `${response ? response.status : "no response"} ${url}`
      ));
      return null;
    }
    return await response.json();
  } catch (error) {
    logError(`JSON GET ${url}`, error);
    return null;
  }
}

async function postJson(url, body, extraHeaders) {
  const headers = Object.assign(
    {},
    HEADERS,
    {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
    },
    extraHeaders || {}
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    if (!response || !response.ok) {
      logError("HTTP POST failed", new Error(
        `${response ? response.status : "no response"} ${url}`
      ));
      return null;
    }

    return await response.json();
  } catch (error) {
    logError(`POST ${url}`, error);
    return null;
  }
}

async function getTmdbDetails(tmdbId, mediaType) {
  if (!TMDB_API_KEY) {
    fail(
      "TMDB_API_KEY is missing. Configure TMDB_API_KEY in the provider runtime."
    );
  }

  if (tmdbId == null || String(tmdbId).trim() === "") {
    fail("tmdbId is missing.");
  }

  const type = mediaType === "movie" ? "movie" : "tv";
  const url = addQuery(
    addQuery(`${TMDB_API_BASE}/${type}/${encodeURIComponent(tmdbId)}`, "api_key", TMDB_API_KEY),
    "language",
    "en-US"
  );

  const data = await fetchJson(url);
  if (!data) {
    fail(`TMDB did not return metadata for ${type}/${tmdbId}.`);
  }

  return {
    title: data.title || data.name || "",
    year: (data.release_date || data.first_air_date || "").slice(0, 4),
  };
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#8211;|&#x2013;/gi, "-")
    .replace(/&#8212;|&#x2014;/gi, "-")
    .replace(/&#039;|&#x27;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function absoluteUrl(href) {
  if (!href) return "";
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith("/")) return BASE_URL + href;
  return `${BASE_URL}/${href}`;
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&[^;]+;/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function extractSearchResults(html, mediaType, queryTitle, queryYear) {
  const results = [];
  const seen = new Set();
  const expectedType = mediaType === "movie" ? "movies" : "series";
  const query = normalizeTitle(queryTitle);

  // Match links regardless of attribute ordering/quote style.
  const linkRe =
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = linkRe.exec(html || "")) !== null) {
    const href = absoluteUrl(match[1]);
    const pathMatch = href.match(
      /^https:\/\/watchanimeworld\.one\/(series|movies)\/([^/?#]+)\/?/i
    );
    if (!pathMatch) continue;

    const kind = pathMatch[1].toLowerCase();
    const slug = pathMatch[2];
    if (kind !== expectedType || !slug || slug === "page") continue;
    if (seen.has(href)) continue;

    const anchorText = decodeHtml(match[2]);
    const normalizedSlug = normalizeTitle(slug.replace(/-/g, " "));
    const normalizedText = normalizeTitle(anchorText);

    // Search results often contain unrelated links. Prefer title-bearing matches.
    if (
      query &&
      !normalizedSlug.includes(query) &&
      !query.includes(normalizedSlug) &&
      !normalizedText.includes(query) &&
      !query.includes(normalizedText)
    ) {
      continue;
    }

    const context = (html || "").slice(
      Math.max(0, match.index - 600),
      Math.min((html || "").length, match.index + 900)
    );
    const yearMatch = context.match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : "";

    seen.add(href);
    results.push({
      url: href,
      slug,
      title: anchorText || slug.replace(/-/g, " "),
      year,
      yearMatch: !!queryYear && year === String(queryYear),
    });
  }

  // Prefer exact normalized title and then matching year.
  results.sort((a, b) => {
    const aSlug = normalizeTitle(a.slug.replace(/-/g, " "));
    const bSlug = normalizeTitle(b.slug.replace(/-/g, " "));
    const aExact = aSlug === query ? 2 : 0;
    const bExact = bSlug === query ? 2 : 0;
    const aYear = a.yearMatch ? 1 : 0;
    const bYear = b.yearMatch ? 1 : 0;
    return (bExact + bYear) - (aExact + aYear);
  });

  return results;
}

async function searchAnimeSite(title, mediaType, year) {
  const url = `${BASE_URL}/?s=${encodeURIComponent(title)}`;
  const html = await fetchText(url, { Referer: `${BASE_URL}/` });
  if (!html) return [];

  return extractSearchResults(html, mediaType, title, year);
}

async function resolveEpisodeUrl(seriesUrl, season, episode) {
  const html = await fetchText(seriesUrl, { Referer: `${BASE_URL}/` });
  if (!html) return null;

  const postIdMatch =
    html.match(/\bpostid-(\d+)\b/i) ||
    html.match(/\bdata-post\s*=\s*["'](\d+)["']/i);

  if (!postIdMatch) {
    logError("resolveEpisodeUrl", new Error("Series page has no post ID."));
    return null;
  }

  const ajaxUrl =
    `${BASE_URL}/wp-admin/admin-ajax.php` +
    `?action=action_select_season` +
    `&season=${encodeURIComponent(season)}` +
    `&post=${encodeURIComponent(postIdMatch[1])}`;

  const episodeHtml = await fetchText(ajaxUrl, { Referer: seriesUrl });
  if (!episodeHtml) return null;

  const target = `${season}x${episode}/`;
  const hrefRe = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;

  let match;
  while ((match = hrefRe.exec(episodeHtml)) !== null) {
    const href = absoluteUrl(match[1]);
    if (href.toLowerCase().includes(target.toLowerCase())) {
      return href;
    }
  }

  // Some pages omit the trailing slash.
  const targetNoSlash = `${season}x${episode}`;
  hrefRe.lastIndex = 0;
  while ((match = hrefRe.exec(episodeHtml)) !== null) {
    const href = absoluteUrl(match[1]);
    if (href.toLowerCase().includes(targetNoSlash.toLowerCase())) {
      return href;
    }
  }

  return null;
}

function extractVideoHash(html) {
  if (!html) return null;

  const patterns = [
    /(?:src|data-src)\s*=\s*["']https:\/\/play\.zephyrix\.org\/video\/([a-f0-9]+)["']/i,
    /https:\/\/play\.zephyrix\.org\/video\/([a-f0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }

  return null;
}

async function extractStreamData(pageUrl) {
  const html = await fetchText(pageUrl, { Referer: `${BASE_URL}/` });
  if (!html) return null;

  const videoHash = extractVideoHash(html);
  if (!videoHash) {
    logError("extractStreamData", new Error("No Zephyrix video hash found."));
    return null;
  }

  const playerUrl =
    `${PLAYER_BASE_URL}/player/index.php` +
    `?data=${encodeURIComponent(videoHash)}` +
    `&do=getVideo`;

  const body =
    `hash=${encodeURIComponent(videoHash)}` +
    `&r=${encodeURIComponent(`${BASE_URL}/`)}`;

  const data = await postJson(playerUrl, body, {
    Referer: `${BASE_URL}/`,
    Origin: PLAYER_BASE_URL,
  });

  if (!data) return null;

  const streamUrl =
    typeof data.videoSource === "string" && data.videoSource
      ? data.videoSource
      : typeof data.securedLink === "string" && data.securedLink
        ? data.securedLink
        : null;

  if (!streamUrl || !/^https?:\/\//i.test(streamUrl)) {
    logError("extractStreamData", new Error("Player returned no usable stream URL."));
    return null;
  }

  const hashMatch = streamUrl.match(/\/cdn\/hls\/([a-f0-9]+)\//i);
  const contentHash = hashMatch ? hashMatch[1] : videoHash;

  return {
    url: streamUrl,
    subtitle:
      `${PLAYER_BASE_URL}/cdn/down/${contentHash}/Subtitle/subtitle_eng.srt`,
  };
}

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    const type = mediaType === "movie" ? "movie" : "tv";

    if (type === "tv" && (season == null || episode == null)) {
      logError("getStreams", new Error("Season and episode are required."));
      return [];
    }

    const seasonNumber = type === "tv" ? parseInt(season, 10) : null;
    const episodeNumber = type === "tv" ? parseInt(episode, 10) : null;

    if (
      type === "tv" &&
      (!Number.isInteger(seasonNumber) ||
        !Number.isInteger(episodeNumber) ||
        seasonNumber < 1 ||
        episodeNumber < 1)
    ) {
      logError("getStreams", new Error("Invalid season/episode number."));
      return [];
    }

    const metadata = await getTmdbDetails(tmdbId, type);
    if (!metadata.title) {
      logError("getStreams", new Error(`No title for TMDB ID ${tmdbId}.`));
      return [];
    }

    const searchResults = await searchAnimeSite(
      metadata.title,
      type,
      metadata.year
    );

    if (!searchResults.length) {
      logError(
        "getStreams",
        new Error(`No AnimeWorld result for "${metadata.title}".`)
      );
      return [];
    }

    let pageUrl = searchResults[0].url;

    if (type === "tv") {
      pageUrl = await resolveEpisodeUrl(pageUrl, seasonNumber, episodeNumber);
      if (!pageUrl) {
        logError(
          "getStreams",
          new Error(
            `Episode S${seasonNumber}E${episodeNumber} was not found on AnimeWorld.`
          )
        );
        return [];
      }
    }

    const stream = await extractStreamData(pageUrl);
    if (!stream) return [];

    return [
      {
        name: PROVIDER_NAME,
        title: "AnimeWorld",
        url: stream.url,
        quality: "1080p",
        headers: {
          Referer: `${PLAYER_BASE_URL}/`,
          Origin: PLAYER_BASE_URL,
          "User-Agent": USER_AGENT,
        },
        subtitles: stream.subtitle
          ? [
              {
                url: stream.subtitle,
                lang: "en",
                name: "English",
              },
            ]
          : [],
      },
    ];
  } catch (error) {
    logError("getStreams", error, {
      tmdbId,
      mediaType,
      season,
      episode,
    });
    return [];
  }
}

module.exports = { getStreams };
