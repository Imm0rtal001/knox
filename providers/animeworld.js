"use strict";

const cheerio = require("cheerio");
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const BASE_URL = "https://watchanimeworld.one";
const PLAYER_BASE_URL = "https://play.zephyrix.org";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const DEFAULT_REQUEST_HEADERS = { "User-Agent": USER_AGENT };
const DEBUG = process.env.ANIMEWORLD_DEBUG === "1";

function logError(context, error, extra = {}) {
  if (!DEBUG && !extra.force) return;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[animeworld] ${context}: ${message}`, {
    ...extra,
    stack: error instanceof Error ? error.stack : undefined
  });
}

function requireTmdbApiKey() {
  if (!TMDB_API_KEY) {
    throw new Error(
      "TMDB_API_KEY is not configured. Set it in the environment before calling getStreams()."
    );
  }
}

async function performGetRequest(url, headers = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: { ...DEFAULT_REQUEST_HEADERS, ...headers }
    });
  } catch (error) {
    throw new Error(`GET request failed for ${url}: ${error.message}`, { cause: error });
  }

  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status} ${response.statusText}`);
  }

  return response;
}

async function performPostRequest(url, body, headers = {}) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        ...DEFAULT_REQUEST_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
        ...headers
      },
      body
    });
  } catch (error) {
    throw new Error(`POST request failed for ${url}: ${error.message}`, { cause: error });
  }

  if (!response.ok) {
    throw new Error(`POST ${url} failed with HTTP ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Invalid JSON response from ${url}: ${error.message}`, { cause: error });
  }
}

async function fetchFromTmdb(path) {
  requireTmdbApiKey();

  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);

  try {
    const response = await fetch(url, { headers: DEFAULT_REQUEST_HEADERS });

    if (!response.ok) {
      throw new Error(
        `TMDB request failed with HTTP ${response.status} ${response.statusText} for ${path}`
      );
    }

    return await response.json();
  } catch (error) {
    logError(`TMDB ${path}`, error, { force: true });
    throw error;
  }
}

async function searchAnimeSite(title, mediaType) {
  try {
    const response = await performGetRequest(`${BASE_URL}/?s=${encodeURIComponent(title)}`, { "Referer": `${BASE_URL}/` });
    const html = await response.text();
    const $ = cheerio.load(html);
    const seenUrls = new Set();
    const results = [];

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href") || "";
      const match = href.match(/^https:\/\/watchanimeworld\.one\/(series|movies)\/([^/]+)\//);
      if (!match || match[2] === "page" || seenUrls.has(href)) return;

      const isCorrectType = mediaType === "movie" ? match[1] === "movies" : match[1] === "series";
      if (!isCorrectType) return;

      seenUrls.add(href);
      results.push(href);
    });

    return results;
  } catch (error) {
    logError(`searchAnimeSite("${title}", ${mediaType})`, error);
    return [];
  }
}

async function resolveEpisodeUrl(seriesUrl, seasonNumber, episodeNumber) {
  const response = await performGetRequest(seriesUrl, { "Referer": `${BASE_URL}/` });
  const html = await response.text();
  const postIdMatch = html.match(/postid-(\d+)/) || html.match(/data-post="(\d+)"/);
  if (!postIdMatch) return null;

  const ajaxResponse = await performGetRequest(
    `${BASE_URL}/wp-admin/admin-ajax.php?action=action_select_season&season=${seasonNumber}&post=${postIdMatch[1]}`,
    { "Referer": seriesUrl }
  );
  const episodeHtml = await ajaxResponse.text();
  const urlSuffix = `${seasonNumber}x${episodeNumber}/`;
  const $ = cheerio.load(episodeHtml);
  let episodeUrl = null;

  $("a[href]").each((_, element) => {
    if (episodeUrl) return;
    const href = $(element).attr("href") || "";
    if (href.includes(urlSuffix)) episodeUrl = href;
  });

  return episodeUrl;
}

async function extractStreamData(pageUrl) {
  const response = await performGetRequest(pageUrl, { "Referer": `${BASE_URL}/` });
  const html = await response.text();
  const streamMatch = html.match(/(?:src|data-src)="(https:\/\/play\.zephyrix\.org\/video\/([a-f0-9]+))"/);
  if (!streamMatch) return null;

  const videoHash = streamMatch[2];
  const postData = await performPostRequest(
    `${PLAYER_BASE_URL}/player/index.php?data=${videoHash}&do=getVideo`,
    `hash=${videoHash}&r=${encodeURIComponent(`${BASE_URL}/`)}`,
    { "Referer": `${BASE_URL}/`, "Origin": PLAYER_BASE_URL, "X-Requested-With": "XMLHttpRequest" }
  );

  const m3u8Url = postData.videoSource || postData.securedLink;
  if (!m3u8Url) return null;

  const hashMatch = m3u8Url.match(/\/cdn\/hls\/([a-f0-9]+)\//);
  const contentHash = hashMatch ? hashMatch[1] : videoHash;

  return {
    url: m3u8Url,
    subtitle: `${PLAYER_BASE_URL}/cdn/down/${contentHash}/Subtitle/subtitle_eng.srt`
  };
}

async function getStreams(tmdbId, mediaType = "tv", seasonNumber = 1, episodeNumber = 1) {
  try {
    if (tmdbId == null || String(tmdbId).trim() === "") {
      throw new Error("tmdbId is required.");
    }

    if (!["tv", "movie"].includes(mediaType)) {
      throw new Error(`Unsupported mediaType "${mediaType}". Expected "tv" or "movie".`);
    }

    if (mediaType === "tv" && (seasonNumber == null || episodeNumber == null)) {
      throw new Error("seasonNumber and episodeNumber are required for TV shows.");
    }

    const [mediaEntry, seasonEpisodes] = await Promise.all([
      fetchFromTmdb(`${mediaType}/${tmdbId}`),
      mediaType === "tv" ? fetchFromTmdb(`tv/${tmdbId}/season/${seasonNumber}`) : Promise.resolve(null)
    ]);

    if (!mediaEntry) throw new Error(`TMDB returned no media for ID ${tmdbId}.`);
    const mediaTitle = mediaEntry.name || mediaEntry.title;
    if (!mediaTitle) throw new Error(`TMDB media ${tmdbId} has no title/name.`);

    const releaseYear = (mediaEntry.release_date || mediaEntry.first_air_date || "").slice(0, 4) || null;

    let episodeTitle = "";
    if (mediaType === "tv" && seasonEpisodes?.episodes) {
      const episodeNumberInt = parseInt(episodeNumber, 10) || 1;
      const episode = seasonEpisodes.episodes.find(ep => ep.episode_number === episodeNumberInt);
      episodeTitle = episode?.name || "";
    }

    const searchResults = await searchAnimeSite(mediaTitle, mediaType);
    if (!searchResults.length) throw new Error(`No AnimeWorld result found for "${mediaTitle}".`);

    let streamData = null;

    if (mediaType === "movie") {
      streamData = await extractStreamData(searchResults[0]);
    } else {
      const episodeUrl = await resolveEpisodeUrl(searchResults[0], seasonNumber, episodeNumber);
      if (episodeUrl) streamData = await extractStreamData(episodeUrl);
    }

    if (!streamData) throw new Error(`No playable stream found for "${mediaTitle}".`);

    return [{
      name: "AnimeWorld.",
      title: "animeWorld",
      url: streamData.url,
      quality: "1080p",
      headers: {
        "Referer": `${PLAYER_BASE_URL}/`,
        "Origin": PLAYER_BASE_URL,
        "User-Agent": USER_AGENT
      },
      subtitles: streamData.subtitle
        ? [{ url: streamData.subtitle, language: "en", name: "English" }]
        : []
    }];
  } catch (error) {
    logError("getStreams", error, {
      force: true,
      tmdbId,
      mediaType,
      seasonNumber,
      episodeNumber
    });
    return [];
  }
}

module.exports = { getStreams };
