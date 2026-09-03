/**
 * AnimeWorld diagnostic provider for Knox / Nuvio.
 *
 * Purpose:
 *   Diagnose where an AnimeWorld lookup fails without attempting to
 *   extract or return a playable stream URL.
 *
 * Nuvio provider contract:
 *   getStreams(tmdbId, mediaType, season, episode) -> Promise<Array>
 *
 * Diagnostics are written with console.error/console.log so they can be
 * viewed in the Nuvio Plugin Tester / device logs.
 *
 * TMDB key:
 *   No API key is hard-coded.
 *   Supported sources:
 *     1) globalThis.TMDB_API_KEY
 *     2) process.env.TMDB_API_KEY (Node/local testing only)
 *
 * IMPORTANT:
 *   Some Nuvio builds do not expose environment variables to plugins.
 *   In that case the diagnostic intentionally stops at the TMDB stage
 *   and reports that fact instead of silently failing.
 */

"use strict";

var PROVIDER = "AnimeWorld-Diagnostic";
var BASE_URL = "https://watchanimeworld.one";
var TMDB_BASE = "https://api.themoviedb.org/3";

var USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

var HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9"
};

function log(level, message, data) {
  var prefix = "[" + PROVIDER + "] " + level.toUpperCase() + ": " + message;
  if (data !== undefined) {
    console.log(prefix, data);
  } else {
    console.log(prefix);
  }
}

function error(stage, message, data) {
  var prefix = "[" + PROVIDER + "] [FAILED] [" + stage + "] " + message;
  if (data !== undefined) {
    console.error(prefix, data);
  } else {
    console.error(prefix);
  }
}

function ok(stage, message, data) {
  var prefix = "[" + PROVIDER + "] [OK] [" + stage + "] " + message;
  if (data !== undefined) {
    console.log(prefix, data);
  } else {
    console.log(prefix);
  }
}

function getApiKey() {
  try {
    if (typeof globalThis !== "undefined" && globalThis.TMDB_API_KEY) {
      return String(globalThis.TMDB_API_KEY);
    }
  } catch (_) {}

  try {
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.TMDB_API_KEY
    ) {
      return String(process.env.TMDB_API_KEY);
    }
  } catch (_) {}

  return "";
}

function requestText(url, headers) {
  return fetch(url, {
    headers: Object.assign({}, HEADERS, headers || {})
  }).then(function (response) {
    if (!response) {
      throw new Error("No response object was returned.");
    }

    return response.text().then(function (body) {
      return {
        status: response.status,
        ok: response.ok,
        body: body,
        headers: response.headers
      };
    });
  });
}

function requestJson(url, headers) {
  return fetch(url, {
    headers: Object.assign({}, HEADERS, headers || {})
  }).then(function (response) {
    if (!response) {
      throw new Error("No response object was returned.");
    }

    return response.text().then(function (body) {
      var parsed = null;

      try {
        parsed = JSON.parse(body);
      } catch (parseError) {
        throw new Error(
          "Response was not valid JSON (HTTP " +
            response.status +
            "): " +
            parseError.message
        );
      }

      return {
        status: response.status,
        ok: response.ok,
        data: parsed
      };
    });
  });
}

function getTmdbDetails(tmdbId, mediaType) {
  var key = getApiKey();

  if (!key) {
    error(
      "TMDB",
      "TMDB_API_KEY is not available in this plugin runtime."
    );
    error(
      "TMDB",
      "For local testing set TMDB_API_KEY. For Nuvio, the runtime must expose the key through globalThis.TMDB_API_KEY or another supported configuration mechanism."
    );
    return Promise.reject(
      new Error("TMDB_API_KEY is unavailable in the provider runtime.")
    );
  }

  var type = mediaType === "movie" ? "movie" : "tv";
  var url =
    TMDB_BASE +
    "/" +
    type +
    "/" +
    encodeURIComponent(String(tmdbId)) +
    "?api_key=" +
    encodeURIComponent(key) +
    "&language=en-US";

  log("info", "TMDB request started: " + type + "/" + tmdbId);

  return requestJson(url)
    .then(function (result) {
      if (!result.ok) {
        throw new Error(
          "TMDB returned HTTP " + result.status + "."
        );
      }

      var data = result.data || {};
      var title = data.title || data.name || "";
      var year = (
        data.release_date ||
        data.first_air_date ||
        ""
      ).slice(0, 4);

      if (!title) {
        throw new Error("TMDB response contained no title/name.");
      }

      ok("TMDB", "Metadata resolved.", {
        title: title,
        year: year || null
      });

      return {
        title: title,
        year: year || null
      };
    })
    .catch(function (err) {
      error("TMDB", err.message);
      throw err;
    });
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&[^;]+;/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function inspectSearchHtml(html, title, mediaType) {
  var expected = mediaType === "movie" ? "movies" : "series";
  var wanted = normalize(title);
  var count = 0;
  var matching = 0;

  var linkRe =
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  var match;
  while ((match = linkRe.exec(html || "")) !== null) {
    var href = match[1] || "";
    var path = href.match(
      /^https?:\/\/watchanimeworld\.one\/(series|movies)\/([^/?#]+)/i
    );

    if (!path || path[1].toLowerCase() !== expected) {
      continue;
    }

    count += 1;

    var slug = normalize(path[2].replace(/-/g, " "));
    var text = normalize(
      String(match[2] || "").replace(/<[^>]*>/g, " ")
    );

    if (
      !wanted ||
      slug.indexOf(wanted) !== -1 ||
      wanted.indexOf(slug) !== -1 ||
      text.indexOf(wanted) !== -1 ||
      wanted.indexOf(text) !== -1
    ) {
      matching += 1;
    }
  }

  return {
    candidateLinks: count,
    titleMatches: matching
  };
}

function testAnimeWorldSearch(title, mediaType) {
  var url = BASE_URL + "/?s=" + encodeURIComponent(title);

  log("info", "AnimeWorld search started.", {
    url: url,
    type: mediaType
  });

  return requestText(url, {
    "Referer": BASE_URL + "/"
  })
    .then(function (result) {
      if (!result.ok) {
        throw new Error(
          "AnimeWorld search returned HTTP " + result.status + "."
        );
      }

      if (!result.body || result.body.length < 50) {
        throw new Error(
          "AnimeWorld returned an unexpectedly small/empty HTML response."
        );
      }

      var inspection = inspectSearchHtml(
        result.body,
        title,
        mediaType
      );

      if (inspection.candidateLinks === 0) {
        throw new Error(
          "Search page loaded, but no /series/ or /movies/ candidate links were detected."
        );
      }

      ok("SEARCH", "AnimeWorld search page loaded.", {
        bytes: result.body.length,
        candidateLinks: inspection.candidateLinks,
        titleMatches: inspection.titleMatches
      });

      if (inspection.titleMatches === 0) {
        error(
          "SEARCH-MATCH",
          "AnimeWorld responded, but no candidate matched the TMDB title."
        );
        throw new Error("AnimeWorld title matching failed.");
      }

      ok("SEARCH-MATCH", "At least one title candidate matched.");

      return result.body;
    })
    .catch(function (err) {
      error("SEARCH", err.message);
      throw err;
    });
}

function testEpisodePage(title, mediaType, season, episode) {
  if (mediaType === "movie") {
    ok("EPISODE", "Skipped: media type is movie.");
    return Promise.resolve();
  }

  log("info", "Episode-stage diagnostic cannot continue without a matched series URL.");

  /*
   * Deliberately do not guess an episode URL here. The purpose of this
   * diagnostic provider is to identify the failing stage rather than
   * silently scrape an outdated player endpoint.
   */

  if (season == null || episode == null) {
    throw new Error("Season and episode are required for TV diagnostics.");
  }

  ok(
    "EPISODE",
    "Input is valid, but episode URL resolution requires the matched series page."
  );

  return Promise.resolve();
}

function getStreams(tmdbId, mediaType, season, episode) {
  log("info", "========== diagnostic run ==========");
  log("info", "Input", {
    tmdbId: tmdbId,
    mediaType: mediaType,
    season: season,
    episode: episode
  });

  if (tmdbId == null || String(tmdbId).trim() === "") {
    error("INPUT", "tmdbId is missing.");
    return Promise.resolve([]);
  }
  ok("INPUT", "tmdbId received.");

  if (mediaType !== "movie" && mediaType !== "tv") {
    error(
      "INPUT",
      'Unsupported mediaType. Expected "movie" or "tv".'
    );
    return Promise.resolve([]);
  }
  ok("INPUT", "mediaType is valid.");

  if (mediaType === "tv") {
    var s = Number(season);
    var e = Number(episode);

    if (!Number.isInteger(s) || s < 1) {
      error("INPUT", "Invalid season: " + season);
      return Promise.resolve([]);
    }

    if (!Number.isInteger(e) || e < 1) {
      error("INPUT", "Invalid episode: " + episode);
      return Promise.resolve([]);
    }

    ok("INPUT", "Season/episode are valid.", {
      season: s,
      episode: e
    });
  }

  if (typeof fetch !== "function") {
    error("RUNTIME", "fetch() is not available in the plugin runtime.");
    return Promise.resolve([]);
  }
  ok("RUNTIME", "fetch() is available.");

  return getTmdbDetails(tmdbId, mediaType)
    .then(function (metadata) {
      return testAnimeWorldSearch(
        metadata.title,
        mediaType
      ).then(function () {
        return testEpisodePage(
          metadata.title,
          mediaType,
          season,
          episode
        );
      });
    })
    .then(function () {
      ok(
        "SUMMARY",
        "Diagnostics reached the end without a reported failure."
      );
      log(
        "info",
        "No playable stream is returned by this diagnostic provider."
      );
      return [];
    })
    .catch(function (err) {
      error("SUMMARY", "Pipeline stopped: " + err.message);
      log(
        "info",
        "Fix the FAILED stage above, then run the provider again."
      );
      return [];
    });
}

module.exports = {
  getStreams: getStreams
};
