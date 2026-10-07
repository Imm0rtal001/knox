'use strict';

const cheerio = require('cheerio-without-node-native');

const PROVIDER_NAME = 'Movies4u';
const BASE_URL = 'https://movies4u.cr';
const TMDB_API_KEY = '439c478a771f35c05022f9feabcca01c';
const DOMAINS_JSON_URL = 'https://raw.githubusercontent.com/SaurabhKaperwan/Utils/refs/heads/main/urls.json';
const REQUEST_TIMEOUT = 12000;
const DOMAIN_TIMEOUT = 8000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const MOBILE_HEADERS = {
  ...HEADERS,
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};

const EXCLUDED_BUTTONS = ['filepress', 'gdtot', 'dropgalaxy', 'gdflix', 'gdlink'];
const LINK_HINTS = ['mdrive', 'genxfm', 'fastdl', 'vcloud', 'hubcloud'];

let baseUrl = BASE_URL;
let cachedDomains = null;
let domainCacheTime = 0;
let cachedHubDomain = 'https://hubcloud.ist';
let cachedVcDomain = 'https://vcloud.beer';
const DOMAIN_CACHE_TTL = 4 * 60 * 60 * 1000;

function log(message, ...args) {
  console.log(`[${PROVIDER_NAME}] ${message}`, ...args);
}

function getOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return url || baseUrl;
  }
}

function absoluteUrl(url, origin = baseUrl) {
  if (!url) return '';
  try {
    return new URL(url, origin).href;
  } catch {
    return '';
  }
}

function isHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || ''));
}

function makeTimeoutSignal(timeout) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeout);
  }
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }
  return undefined;
}

async function fetchSafe(url, options = {}, timeout = REQUEST_TIMEOUT) {
  try {
    const headers = { ...HEADERS, ...(options.headers || {}) };
    const signal = options.signal || makeTimeoutSignal(timeout);
    const response = await fetch(url, {
      ...options,
      headers,
      signal,
    });
    return response;
  } catch (error) {
    const reason = error && error.name === 'AbortError' ? 'timeout' : (error && error.message) || String(error);
    log(`Request failed: ${String(url).slice(0, 120)} -> ${reason}`);
    return null;
  }
}

async function fetchText(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const response = await fetchSafe(url, options, timeout);
  if (!response || !response.ok) return null;
  try {
    return await response.text();
  } catch {
    return null;
  }
}

async function fetchJson(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const text = await fetchText(url, options, timeout);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    log(`Invalid JSON from ${String(url).slice(0, 100)}: ${error.message}`);
    return null;
  }
}

async function fetchHtml(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const text = await fetchText(url, options, timeout);
  if (!text) return null;
  try {
    return cheerio.load(text);
  } catch (error) {
    log(`HTML parse failed: ${error.message}`);
    return null;
  }
}

function parseQuality(text) {
  const value = String(text || '').toLowerCase();
  if (value.includes('2160') || value.includes('4k') || value.includes('uhd')) return '2160p';
  if (value.includes('1440') || value.includes('2k')) return '1440p';
  if (value.includes('1080')) return '1080p';
  if (value.includes('720')) return '720p';
  if (value.includes('480')) return '480p';
  return 'HD';
}

function makeStream(name, title, url, quality, headers = {}) {
  return {
    name: `${PROVIDER_NAME} | ${name}`,
    title: title || `${PROVIDER_NAME} Stream`,
    url,
    quality: quality || 'HD',
    behaviorHints: {
      notWebReady: true,
      proxyHeaders: { request: headers },
    },
  };
}

function dedupe(streams) {
  const seen = new Set();
  return (streams || []).filter((stream) => {
    if (!stream || !stream.url || seen.has(stream.url)) return false;
    seen.add(stream.url);
    return true;
  });
}

function normalizeTitle(title) {
  return String(title || '')
    .replace(/\bdownload\b/gi, ' ')
    .replace(/[._-]+/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isStrictMatch(requestedTitle, requestedYear, scrapedTitle, scrapedYear) {
  const requested = normalizeTitle(requestedTitle);
  const scraped = normalizeTitle(scrapedTitle);
  if (!requested || !scraped) return false;

  const titleMatch = scraped.includes(requested) || requested.includes(scraped);
  if (!titleMatch) return false;

  if (requestedYear && scrapedYear) {
    const a = Number.parseInt(requestedYear, 10);
    const b = Number.parseInt(scrapedYear, 10);
    if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) > 1) return false;
  }
  return true;
}

function extractYear(text) {
  const match = String(text || '').match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
}

async function refreshDomains() {
  const now = Date.now();
  if (cachedDomains && now - domainCacheTime < DOMAIN_CACHE_TTL) return cachedDomains;

  const data = await fetchJson(DOMAINS_JSON_URL, {}, DOMAIN_TIMEOUT);
  if (!data || typeof data !== 'object') {
    log('Domain refresh failed; using configured defaults.');
    return cachedDomains || {};
  }

  cachedDomains = data;
  domainCacheTime = now;

  if (typeof data.movies4u === 'string' && data.movies4u.trim()) baseUrl = data.movies4u.replace(/\/$/, '');
  if (typeof data.hubcloud === 'string' && data.hubcloud.trim()) cachedHubDomain = data.hubcloud.replace(/\/$/, '');
  if (typeof data.vcloud === 'string' && data.vcloud.trim()) cachedVcDomain = data.vcloud.replace(/\/$/, '');

  log(`Domains: site=${baseUrl} hub=${cachedHubDomain} vc=${cachedVcDomain}`);
  return cachedDomains;
}

function getLatestHubDomain() {
  return cachedHubDomain;
}

function getLatestVcDomain() {
  return cachedVcDomain;
}

async function getTMDBInfo(id, type) {
  const idStr = String(id || '').trim();
  const isImdb = /^tt\d+$/i.test(idStr);
  const tmdbType = type === 'tv' || type === 'series' ? 'tv' : 'movie';

  try {
    if (isImdb) {
      const data = await fetchJson(
        `https://api.themoviedb.org/3/find/${encodeURIComponent(idStr)}?api_key=${TMDB_API_KEY}&external_source=imdb_id`,
        {},
        REQUEST_TIMEOUT
      );
      const list = data ? (tmdbType === 'tv' ? data.tv_results : data.movie_results) : null;
      const item = Array.isArray(list) && list.length ? list[0] : null;
      if (item) {
        return {
          title: tmdbType === 'tv' ? item.name : item.title,
          year: (item.first_air_date || item.release_date || '').slice(0, 4) || null,
          imdbId: idStr,
          tmdbId: item.id,
        };
      }
      return { title: '', year: null, imdbId: idStr, tmdbId: null };
    }

    if (/^\d+$/.test(idStr)) {
      const data = await fetchJson(
        `https://api.themoviedb.org/3/${tmdbType}/${encodeURIComponent(idStr)}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`,
        {},
        REQUEST_TIMEOUT
      );
      if (data) {
        return {
          title: tmdbType === 'tv' ? data.name : data.title,
          year: (data.first_air_date || data.release_date || '').slice(0, 4) || null,
          imdbId: data.imdb_id || (data.external_ids && data.external_ids.imdb_id) || null,
          tmdbId: data.id,
        };
      }
    }
  } catch (error) {
    log(`TMDB error: ${error.message}`);
  }

  // Do not use a TMDB/IMDb identifier as a title query when metadata fails.
  return {
    title: /^tt\d+$/i.test(idStr) ? '' : idStr,
    year: null,
    imdbId: isImdb ? idStr : null,
    tmdbId: /^\d+$/.test(idStr) ? Number(idStr) : null,
  };
}

function mapSearchHit(hit) {
  const doc = hit && hit.document ? hit.document : hit || {};
  const title = String(doc.post_title || doc.title || '').replace(/\bdownload\b/gi, '').trim();
  return {
    postId: String(doc.id || doc.post_id || ''),
    title,
    permalink: doc.permalink || doc.url || '',
    imdbId: doc.imdb_id || doc.imdb || '',
    year: extractYear(title),
  };
}

async function searchByTitle(query, year) {
  if (!query) return [];

  const cleanQuery = String(query).trim();
  const queryWithYear = year && !new RegExp(`\\b${year}\\b`).test(cleanQuery)
    ? `${cleanQuery} ${year}`
    : cleanQuery;

  const candidates = [
    `${baseUrl}/search.php?q=${encodeURIComponent(queryWithYear)}&page=1&per_page=15`,
    `${baseUrl}/?s=${encodeURIComponent(queryWithYear)}`,
  ];

  for (const url of candidates) {
    log(`Search: ${cleanQuery.slice(0, 60)} -> ${url.slice(0, 120)}`);
    const response = await fetchSafe(url, {}, REQUEST_TIMEOUT);
    if (!response || !response.ok) continue;

    const text = await response.text();
    if (!text) continue;

    // First try the JSON/search API format.
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data.hits)) {
        const results = data.hits.map(mapSearchHit).filter((item) => item.postId || item.permalink);
        if (results.length) return results;
      }
    } catch {
      // Normal HTML page; continue below.
    }

    // WordPress/search HTML fallback.
    try {
      const $ = cheerio.load(text);
      const results = [];
      const seen = new Set();
      $('article, .post, .result, .search-result, .entry, .item').each((i, el) => {
        const anchor = $(el).find('a[href]').first();
        const href = anchor.attr('href');
        const title = ($(el).find('h1,h2,h3,h4,.title,.entry-title').first().text() || anchor.text() || '').trim();
        if (!href || !title) return;
        const absolute = absoluteUrl(href, baseUrl);
        if (!absolute || seen.has(absolute)) return;
        seen.add(absolute);
        results.push({
          postId: '',
          title: title.replace(/\bdownload\b/gi, '').trim(),
          permalink: absolute,
          imdbId: '',
          year: extractYear(title),
        });
      });
      if (results.length) return results.slice(0, 15);
    } catch (error) {
      log(`Search HTML parse failed: ${error.message}`);
    }
  }

  log('Search: no usable results');
  return [];
}

async function fetchPostContent(postId, link) {
  if (postId) {
    const apiUrl = `${baseUrl}/wp-json/wp/v2/posts/${encodeURIComponent(postId)}`;
    log(`Fetching post content ${postId}`);
    const data = await fetchJson(apiUrl, { headers: MOBILE_HEADERS }, 15000);
    if (data && data.content && data.content.rendered) {
      return {
        title: String(data.title && data.title.rendered || '').replace(/\bdownload\b/gi, '').trim(),
        html: data.content.rendered,
      };
    }
  }

  if (!link) return null;
  const fallbackUrl = absoluteUrl(link, baseUrl);
  log(`HTML fallback: ${fallbackUrl}`);
  const $ = await fetchHtml(fallbackUrl, { headers: HEADERS }, 15000);
  if (!$) return null;

  const contentHtml = $('.entry-content, .post-content, .entry, article').first().html() || '';
  if (!contentHtml) return null;

  return {
    title: $('h1.entry-title, h1.post-title, title').first().text().replace(/\bdownload\b/gi, '').trim(),
    html: contentHtml,
  };
}

function extractQualityFromElement($, element, html) {
  const localText = $(element).text() || '';
  const index = html.indexOf($(element).attr('href') || '');
  const context = index >= 0 ? html.slice(Math.max(0, index - 2000), index) : '';
  return parseQuality(`${localText} ${context}`);
}

function extractNexdriveLinks(contentHtml) {
  if (!contentHtml) return [];
  const $ = cheerio.load(contentHtml);
  const links = [];
  const seen = new Set();

  $('a[href]').each((i, el) => {
    try {
      const href = String($(el).attr('href') || '').trim();
      const text = String($(el).text() || '').trim();
      if (!href || href === '#') return;

      const full = absoluteUrl(href, baseUrl);
      const lowerHref = full.toLowerCase();
      const lowerText = text.toLowerCase();

      if (!isHttpUrl(full)) return;
      if (EXCLUDED_BUTTONS.some((name) => lowerHref.includes(name) || lowerText.includes(name))) return;

      const looksUseful = LINK_HINTS.some((hint) => lowerHref.includes(hint)) ||
        /(download|watch|stream|server|mirror|direct)/i.test(text);
      if (!looksUseful) return;
      if (seen.has(full)) return;

      seen.add(full);
      links.push({
        href: full,
        quality: extractQualityFromElement($, el, contentHtml),
        label: text || 'Download',
      });
    } catch {
      // Ignore malformed individual anchors.
    }
  });

  return links;
}

function capLinksForEfficiency(links, maxTotal = 20) {
  return Array.isArray(links) ? links.slice(0, maxTotal) : [];
}

function extractSeasonFromContent(contentHtml, targetSeason) {
  if (!contentHtml || targetSeason == null) return contentHtml;
  const season = Number(targetSeason);
  if (!Number.isFinite(season)) return contentHtml;

  const marker = new RegExp(`(?:Season|Saison|Staffel)\\s+0*${season}\\b`, 'i');
  const match = marker.exec(contentHtml);
  if (!match) return contentHtml;

  const start = Math.max(0, contentHtml.lastIndexOf('<h', match.index));
  const next = new RegExp(`(?:Season|Saison|Staffel)\\s+0*${season + 1}\\b`, 'i').exec(contentHtml.slice(match.index + match[0].length));
  const end = next ? match.index + match[0].length + next.index : contentHtml.length;
  return contentHtml.slice(start, end);
}

function rewriteResolverUrl(url) {
  if (!url) return '';
  try {
    const currentOrigin = getOrigin(url);
    const lower = url.toLowerCase();
    if (lower.includes('hubcloud')) {
      return url.replace(currentOrigin, getLatestHubDomain());
    }
    if (lower.includes('vcloud')) {
      return url.replace(currentOrigin, getLatestVcDomain());
    }
  } catch {
    // Keep original URL.
  }
  return url;
}

function findBridgeUrl($, pageUrl) {
  const candidates = [];
  const add = (value) => {
    if (!value) return;
    const url = absoluteUrl(value, getOrigin(pageUrl));
    if (url && !candidates.includes(url)) candidates.push(url);
  };

  $('script').each((i, el) => {
    const script = $(el).html() || '';
    const patterns = [
      /\bvar\s+url\s*=\s*['"]([^'"]+)['"]/i,
      /\b(?:url|link|download)\s*[:=]\s*['"]([^'"]+)['"]/i,
      /https?:\/\/[^'"\s]+(?:hubcloud|vcloud)[^'"\s]*/i,
    ];
    for (const pattern of patterns) {
      const match = script.match(pattern);
      if (match) add(match[1] || match[0]);
    }
  });

  $('#download, a[href]').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = ($(el).text() || '').toLowerCase();
    if (/hubcloud\.php|token=|download|direct|server/i.test(href) || /download|direct|server/i.test(text)) add(href);
  });

  return candidates[0] || '';
}

async function extractSingleVc(vcUrl, referer, targetSeason, targetEpisode) {
  const streams = [];
  if (!vcUrl) return streams;

  const lower = vcUrl.toLowerCase();
  if (!/(vcloud|hubcloud|mdrive|fastdl)/i.test(lower)) return streams;

  const newUrl = rewriteResolverUrl(vcUrl);
  const $ = await fetchHtml(newUrl, {
    headers: { ...HEADERS, Referer: referer || `${baseUrl}/`, Cookie: 'xla=s4t' },
  }, 15000);
  if (!$) return streams;

  const rawHtml = $.html();
  const pageTitle = $('title').text() || '';

  if (targetSeason != null || targetEpisode != null) {
    const se = pageTitle.match(/(?:S|Season)\s*0*(\d{1,2})\s*(?:E|Ep|Episode)\s*0*(\d{1,3})/i);
    if (se) {
      if (targetSeason != null && Number(se[1]) !== Number(targetSeason)) return streams;
      if (targetEpisode != null && Number(se[2]) !== Number(targetEpisode)) return streams;
    }
  }

  const bridgeUrl = findBridgeUrl($, newUrl);
  if (!bridgeUrl) {
    log(`No bridge URL found: ${newUrl}`);
    return streams;
  }

  const bridge$ = await fetchHtml(bridgeUrl, {
    headers: { ...HEADERS, Referer: newUrl, Cookie: 'xla=s4t' },
  }, 15000);
  if (!bridge$) return streams;

  const headerText = bridge$('.card-header, h1, h2, title').first().text().trim();
  const quality = parseQuality(headerText);
  const seen = new Set();

  bridge$('a[href]').each((i, el) => {
    try {
      const href = absoluteUrl(bridge$(el).attr('href') || '', getOrigin(bridgeUrl));
      const text = (bridge$(el).text() || '').trim();
      const lowerText = text.toLowerCase();
      if (!href || seen.has(href) || href.toLowerCase().includes('.zip')) return;
      if (/10gbps|gdflix|dropgalaxy|telegram|filepress|gdtot/i.test(lowerText)) return;

      const isFsl = /\bfsl\b/i.test(lowerText) || /\/fsl\b/i.test(href);
      const isDirect = /download|direct|server/i.test(lowerText) || /r2\.dev|gofile|diskcdn|lotuscdn|workers\.dev/i.test(href);
      if (!isFsl && !isDirect) return;

      seen.add(href);
      const streamUrl = isFsl ? `${href}${href.includes('?') ? '&' : '?'}s=${1 + new Date().getMinutes()}` : href;
      streams.push(makeStream(isFsl ? `FSL | ${quality}` : `Download | ${quality}`, `${text || 'Download'}${headerText ? ` [${headerText}]` : ''}`, streamUrl, quality, { Referer: bridgeUrl }));
    } catch {
      // Ignore malformed links.
    }
  });

  return streams;
}

async function loadStreamsFromUrl(url, label, quality, referer, targetSeason, targetEpisode) {
  if (!url) return [];
  const lower = url.toLowerCase();

  if (/(vcloud|hubcloud)/i.test(lower)) {
    return extractSingleVc(url, referer || url, targetSeason, targetEpisode);
  }

  if (/(mdrive|genxfm|fastdl)/i.test(lower)) {
    const $ = await fetchHtml(url, { headers: { ...HEADERS, Referer: referer || `${baseUrl}/` } }, 15000);
    if (!$) return [];

    const resolverLinks = [];
    $('a[href]').each((i, el) => {
      const href = absoluteUrl($(el).attr('href') || '', getOrigin(url));
      const text = ($(el).text() || '').trim();
      if (href && /(vcloud|hubcloud)/i.test(href) && !/zip/i.test(href)) {
        resolverLinks.push({ href, text });
      }
    });

    const results = await Promise.all(resolverLinks.slice(0, 10).map(async (item) => {
      try {
        return await extractSingleVc(item.href, url, targetSeason, targetEpisode);
      } catch (error) {
        log(`Resolver failed: ${error.message}`);
        return [];
      }
    }));

    return dedupe(results.flat());
  }

  return [];
}

async function extractFromPost(post, label, isTv, targetSeason, targetEpisode) {
  if (!post || !post.html) return [];

  let contentHtml = post.html;
  let seasonLabel = '';
  if (isTv && targetSeason != null) {
    contentHtml = extractSeasonFromContent(contentHtml, targetSeason) || contentHtml;
    seasonLabel = ` S${targetSeason}`;
    if (targetEpisode != null) seasonLabel += `E${targetEpisode}`;
  }

  const links = capLinksForEfficiency(extractNexdriveLinks(contentHtml));
  log(`Found ${links.length} candidate links${seasonLabel}`);
  if (!links.length) return [];

  const results = await Promise.all(links.map(async (link) => {
    try {
      return await loadStreamsFromUrl(link.href, `${label}${seasonLabel} [${link.quality}]`, link.quality, `${baseUrl}/`, targetSeason, targetEpisode);
    } catch (error) {
      log(`Link resolver failed: ${error.message}`);
      return [];
    }
  }));

  return dedupe(results.flat());
}

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    log(`Request: ID=${tmdbId} Type=${mediaType} S=${season} E=${episode}`);
    await refreshDomains();

    const isTv = mediaType === 'tv' || mediaType === 'series';
    const media = await getTMDBInfo(tmdbId, mediaType);
    const mediaTitle = media.title;
    const mediaYear = media.year;
    let imdbId = media.imdbId;

    if (!mediaTitle) {
      log('TMDB did not provide a usable title; refusing an identifier-only search.');
      return [];
    }

    let searchResults = [];
    if (imdbId && /^tt\d+$/i.test(imdbId)) {
      searchResults = await searchByTitle(imdbId, null);
    }

    if (!searchResults.length) {
      const query = isTv && season != null ? `${mediaTitle} season ${Number(season)}` : mediaTitle;
      searchResults = await searchByTitle(query, mediaYear);
      if (!searchResults.length && isTv && season != null) {
        searchResults = await searchByTitle(mediaTitle, mediaYear);
      }
    }

    if (!searchResults.length) return [];

    const targetImdb = imdbId && /^tt\d+$/i.test(imdbId) ? imdbId.toLowerCase() : null;
    let bestMatch = null;

    for (const result of searchResults) {
      if (targetImdb && result.imdbId && String(result.imdbId).toLowerCase() === targetImdb) {
        bestMatch = result;
        break;
      }
    }

    if (!bestMatch) {
      bestMatch = searchResults.find((result) => isStrictMatch(mediaTitle, mediaYear, result.title, result.year)) || null;
    }

    if (!bestMatch || (!bestMatch.postId && !bestMatch.permalink)) {
      log('No safe title match found.');
      return [];
    }

    log(`Matched: ${bestMatch.title}`);
    const post = await fetchPostContent(bestMatch.postId, bestMatch.permalink);
    if (!post) return [];

    return dedupe(await extractFromPost(
      post,
      mediaTitle,
      isTv,
      season != null ? Number(season) : null,
      episode != null ? Number(episode) : null,
    ));
  } catch (error) {
    log(`Fatal: ${error && error.stack ? error.stack : error}`);
    return [];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams };
} else if (typeof globalThis !== 'undefined') {
  globalThis.getStreams = getStreams;
}
