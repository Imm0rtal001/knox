"use strict";

const cheerio = require("cheerio");
const TMDB_API_KEY = "307b7b8ef035c6aa336900aef4e203bd";
const BASE_URL = "https://watchanimeworld.one";
const PLAYER_BASE_URL = "https://play.zephyrix.top";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const DEFAULT_REQUEST_HEADERS = { "User-Agent": USER_AGENT };

async function performGetRequest(url, headers = {}) {
  const response = await fetch(url, { headers: { ...DEFAULT_REQUEST_HEADERS, ...headers } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

async function performPostRequest(url, body, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { ...DEFAULT_REQUEST_HEADERS, "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchFromTmdb(path) {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/${path}?api_key=${TMDB_API_KEY}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
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
  } catch {
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
  const streamMatch = html.match(/(?:src|data-src)="(https:\/\/play\.zephyrix\.top\/video\/([a-f0-9]+))"/);
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
    if (mediaType === "tv" && (seasonNumber == null || episodeNumber == null)) return [];

    const [mediaEntry, seasonEpisodes] = await Promise.all([
      fetchFromTmdb(`${mediaType}/${tmdbId}`),
      mediaType === "tv" ? fetchFromTmdb(`tv/${tmdbId}/season/${seasonNumber}`) : Promise.resolve(null)
    ]);

    if (!mediaEntry) return [];
    const mediaTitle = mediaEntry.name || mediaEntry.title;
    if (!mediaTitle) return [];

    const releaseYear = (mediaEntry.release_date || mediaEntry.first_air_date || "").slice(0, 4) || null;

    let episodeTitle = "";
    if (mediaType === "tv" && seasonEpisodes?.episodes) {
      const episodeNumberInt = parseInt(episodeNumber, 10) || 1;
      const episode = seasonEpisodes.episodes.find(ep => ep.episode_number === episodeNumberInt);
      episodeTitle = episode?.name || "";
    }

    const searchResults = await searchAnimeSite(mediaTitle, mediaType);
    if (!searchResults.length) return [];

    let streamData = null;

    if (mediaType === "movie") {
      streamData = await extractStreamData(searchResults[0]);
    } else {
      const episodeUrl = await resolveEpisodeUrl(searchResults[0], seasonNumber, episodeNumber);
      if (episodeUrl) streamData = await extractStreamData(episodeUrl);
    }

    if (!streamData) return [];

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
  } catch {
    return [];
  }
}

module.exports = { getStreams };
