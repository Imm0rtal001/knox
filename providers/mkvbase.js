var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var ENV = (typeof process !== "undefined" && process.env) ? process.env : {};
var fetch = (typeof globalThis !== "undefined" && globalThis.fetch) ? globalThis.fetch.bind(globalThis) : null;
var getCandidateHeaders, getCandidateUrl, isReadyForPlayback, resolveHubcloud, resolvePlayableCandidates, resolveVcloud;
try {
    var resolver = require("../lib/hostResolver");
    getCandidateHeaders = resolver.getCandidateHeaders;
    getCandidateUrl = resolver.getCandidateUrl;
    isReadyForPlayback = resolver.isReadyForPlayback;
    resolveHubcloud = resolver.resolveHubcloud;
    resolvePlayableCandidates = resolver.resolvePlayableCandidates;
    resolveVcloud = resolver.resolveVcloud;
}
catch (_) {
    getCandidateHeaders = function (c) { return typeof c === "string" ? null : c && c.headers; };
    getCandidateUrl = function (c) { return typeof c === "string" ? c : c && c.url; };
    isReadyForPlayback = function (u) { return /^https?:\/\//i.test(String(u || "")); };
    resolveHubcloud = function (u) { return Promise.resolve([{ url: u }]); };
    resolvePlayableCandidates = function (u) { return Promise.resolve([{ url: getCandidateUrl(u) || u }]); };
    resolveVcloud = function (u) { return Promise.resolve([{ url: u }]); };
}
// ── Performance: In-memory caches ──
var streamCache = new Map(); // key: "movie:tt1234567" → { streams, ts }
var STREAM_CACHE_TTL_MS = Number(ENV.MKVBASE_CACHE_TTL_MS || 30 * 60 * 1000); // 30 min
var resolvedUrlCache = new Map(); // key: hubcloud URL → { candidates, ts }
var URL_CACHE_TTL_MS = 20 * 60 * 1000; // 20 min
var tmdbCache = new Map(); // key: imdbId → { info, ts }
var TMDB_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
function getCachedStreams(cacheKey) {
    var entry = streamCache.get(cacheKey);
    if (!entry)
        return null;
    if (Date.now() - entry.ts > STREAM_CACHE_TTL_MS) {
        streamCache.delete(cacheKey);
        return null;
    }
    return entry.streams;
}
function setCachedStreams(cacheKey, streams) {
    var e_1, _a;
    streamCache.set(cacheKey, { streams: streams, ts: Date.now() });
    // Evict old entries if cache grows too large
    if (streamCache.size > 200) {
        var now = Date.now();
        try {
            for (var streamCache_1 = __values(streamCache), streamCache_1_1 = streamCache_1.next(); !streamCache_1_1.done; streamCache_1_1 = streamCache_1.next()) {
                var _b = __read(streamCache_1_1.value, 2), k = _b[0], v = _b[1];
                if (now - v.ts > STREAM_CACHE_TTL_MS)
                    streamCache.delete(k);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (streamCache_1_1 && !streamCache_1_1.done && (_a = streamCache_1.return)) _a.call(streamCache_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
}
function getCachedResolvedUrl(url) {
    var entry = resolvedUrlCache.get(url);
    if (!entry)
        return null;
    if (Date.now() - entry.ts > URL_CACHE_TTL_MS) {
        resolvedUrlCache.delete(url);
        return null;
    }
    return entry.candidates;
}
function setCachedResolvedUrl(url, candidates) {
    var e_2, _a;
    resolvedUrlCache.set(url, { candidates: candidates, ts: Date.now() });
    if (resolvedUrlCache.size > 500) {
        var now = Date.now();
        try {
            for (var resolvedUrlCache_1 = __values(resolvedUrlCache), resolvedUrlCache_1_1 = resolvedUrlCache_1.next(); !resolvedUrlCache_1_1.done; resolvedUrlCache_1_1 = resolvedUrlCache_1.next()) {
                var _b = __read(resolvedUrlCache_1_1.value, 2), k = _b[0], v = _b[1];
                if (now - v.ts > URL_CACHE_TTL_MS)
                    resolvedUrlCache.delete(k);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (resolvedUrlCache_1_1 && !resolvedUrlCache_1_1.done && (_a = resolvedUrlCache_1.return)) _a.call(resolvedUrlCache_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
}
function encodeQuery(query, timestamp) {
    if (!query)
        return "";
    var key = timestamp % 256;
    var encoded = "";
    for (var i = 0; i < query.length; i++) {
        encoded += (query.charCodeAt(i) ^ key).toString(16).padStart(2, "0");
    }
    return encoded;
}
function sha256Hex(data) {
    try {
        if (typeof CryptoJS !== "undefined" && CryptoJS.SHA256)
            return CryptoJS.SHA256(data).toString();
    }
    catch (_) { }
    throw new Error("MkvBase direct signing requires a SHA-256 implementation");
}
function solvePow(challengePrefix, difficulty, encodedQuery) {
    var targetZeros = "0".repeat(difficulty);
    var nonce = 0;
    while (nonce <= 500000) {
        var hash1 = sha256Hex(challengePrefix + ":" + nonce);
        var finalHash = sha256Hex(hash1 + ":" + encodedQuery);
        if (finalHash.startsWith(targetZeros))
            return nonce;
        nonce++;
    }
    return nonce;
}
function generateSignature(clientKey, message) {
    try {
        if (typeof CryptoJS !== "undefined" && CryptoJS.HmacSHA256)
            return CryptoJS.HmacSHA256(message, clientKey).toString();
    }
    catch (_) { }
    throw new Error("MkvBase direct signing requires HMAC-SHA256");
}
function debugLog() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (MKVBASE_DEBUG)
        console.log.apply(console, __spreadArray(["[MkvBase]"], __read(args), false));
}
function parseCookieHeader(cookieHeader) {
    var out = {};
    String(cookieHeader || "").split(";").map(function (part) { return part.trim(); }).filter(Boolean).forEach(function (part) {
        var idx = part.indexOf("=");
        if (idx > 0)
            out[part.slice(0, idx)] = part.slice(idx + 1);
    });
    return out;
}
function cookieHeaderFromCookies(cookies) {
    return (cookies || []).filter(function (cookie) { return cookie && cookie.name && cookie.value; }).map(function (cookie) { return "".concat(cookie.name, "=").concat(cookie.value); }).join("; ");
}
function setCookieHeadersFromResponse(res) {
    if (!res || !res.headers)
        return [];
    if (typeof res.headers.getSetCookie === "function")
        return res.headers.getSetCookie();
    var combined = res.headers.get ? res.headers.get("set-cookie") : "";
    return combined ? combined.split(/,(?=\s*[^;,=\s]+=)/).map(function (item) { return item.trim(); }).filter(Boolean) : [];
}
function mergeCookieHeader(existingCookieHeader, setCookieHeaders) {
    var e_3, _a;
    var cookies = parseCookieHeader(existingCookieHeader);
    try {
        for (var _b = __values(setCookieHeaders || []), _c = _b.next(); !_c.done; _c = _b.next()) {
            var header = _c.value;
            var firstPart = String(header || "").split(";")[0];
            var idx = firstPart.indexOf("=");
            if (idx > 0)
                cookies[firstPart.slice(0, idx)] = firstPart.slice(idx + 1);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return Object.entries(cookies).map(function (_a) {
        var _b = __read(_a, 2), name = _b[0], value = _b[1];
        return name + "=" + value;
    }).join("; ");
}
function sessionLooksUsable(session) {
    if (!session || !session.cookieHeader || !session.clientKey || !session.challenge || !session.seq)
        return false;
    if (Date.now() - Number(session.savedAt || 0) > DIRECT_SESSION_TTL_MS)
        return false;
    return /cf_clearance=/.test(session.cookieHeader) && /mkv_client_key=/.test(session.cookieHeader);
}
var MEMORY_SESSION = null;
function loadDirectSession() {
    return sessionLooksUsable(MEMORY_SESSION) ? MEMORY_SESSION : null;
}
function clearDirectSession() { MEMORY_SESSION = null; }
function saveDirectSession(cookieHeader, userAgent) {
    var cookies = parseCookieHeader(cookieHeader);
    var session = {
        cookieHeader: cookieHeader,
        userAgent: userAgent || UA, clientKey: cookies.mkv_client_key,
        challenge: decodeURIComponent(cookies.mkv_challenge || ""), seq: cookies.mkv_seq || "1", savedAt: Date.now()
    };
    if (!sessionLooksUsable(session))
        return null;
    MEMORY_SESSION = session;
    return session;
}
function buildMkvBaseApiPath(query, session) {
    var challenge = String(session.challenge || "");
    var parts = challenge.split(":");
    var challengePrefix = parts[0];
    var difficulty = parts[1] ? parseInt(parts[1], 10) : 2;
    if (!challengePrefix || !session.clientKey)
        return null;
    var timestamp = Date.now();
    var encodedQ = encodeQuery(query, timestamp);
    var nonce = solvePow(challengePrefix, difficulty, encodedQ);
    var ent = 10;
    var seq = session.seq || "1";
    var payloadStr = "".concat(encodedQ, ":").concat(timestamp, ":").concat(seq, ":").concat(nonce, ":").concat(ent);
    var sig = generateSignature(session.clientKey, payloadStr);
    return "/api/links?q=".concat(encodeURIComponent(encodedQ), "&t=").concat(timestamp, "&seq=").concat(seq, "&pow=").concat(nonce, "&ent=").concat(ent, "&sig=").concat(sig);
}
function buildMkvBaseApiUrl(query, session) {
    var apiPath = buildMkvBaseApiPath(query, session);
    return apiPath ? "".concat(BASE_URL).concat(apiPath) : null;
}
function fetchMkvBaseApiDirect(query_1) {
    return __awaiter(this, arguments, void 0, function (query, session) {
        var apiUrl, started, res, updatedCookieHeader, json, results, error_1;
        if (session === void 0) { session = loadDirectSession(); }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!sessionLooksUsable(session))
                        return [2 /*return*/, { ok: false, results: [] }];
                    apiUrl = buildMkvBaseApiUrl(query, session);
                    if (!apiUrl)
                        return [2 /*return*/, { ok: false, results: [] }];
                    started = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetchSafe(apiUrl, {
                            headers: {
                                "User-Agent": session.userAgent || UA,
                                "Cookie": session.cookieHeader,
                                "Accept": "application/json, text/plain, */*",
                                "X-Requested-With": "XMLHttpRequest",
                                "Referer": "".concat(BASE_URL, "/")
                            }
                        }, 9000)];
                case 2:
                    res = _a.sent();
                    if (!res || !res.ok) {
                        debugLog("direct API failed", res && res.status);
                        if (res && (res.status === 401 || res.status === 403))
                            clearDirectSession();
                        return [2 /*return*/, { ok: false, results: [] }];
                    }
                    updatedCookieHeader = mergeCookieHeader(session.cookieHeader, setCookieHeadersFromResponse(res));
                    if (updatedCookieHeader && updatedCookieHeader !== session.cookieHeader)
                        saveDirectSession(updatedCookieHeader, session.userAgent);
                    return [4 /*yield*/, res.json()];
                case 3:
                    json = _a.sent();
                    results = json && Array.isArray(json.results) ? json.results : [];
                    debugLog("direct API", query, results.length, "".concat(Date.now() - started, "ms"));
                    return [2 /*return*/, { ok: true, results: results.map(function (item) { return ({ title: item.title, url: item.url }); }).filter(function (item) { return item.url; }) }];
                case 4:
                    error_1 = _a.sent();
                    debugLog("direct API error", error_1.message);
                    return [2 /*return*/, { ok: false, results: [] }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function bootstrapMkvBaseSessionWithFlareSolverr() {
    return __awaiter(this, void 0, void 0, function () {
        var started, attempt, res, data, cookieHeader, session, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!MKVBASE_FLARESOLVERR_ENABLED)
                        return [2 /*return*/, null];
                    started = Date.now();
                    attempt = 1;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= MKVBASE_FLARESOLVERR_ATTEMPTS)) return [3 /*break*/, 11];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    return [4 /*yield*/, fetchSafe(FLARESOLVERR_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                cmd: "request.get",
                                url: BASE_URL,
                                maxTimeout: MKVBASE_FLARESOLVERR_TIMEOUT_MS
                            })
                        }, MKVBASE_FLARESOLVERR_TIMEOUT_MS + 5000)];
                case 3:
                    res = _a.sent();
                    if (!(!res || !res.ok)) return [3 /*break*/, 4];
                    debugLog("FlareSolverr HTTP failed", res && res.status, "attempt " + attempt + "/" + MKVBASE_FLARESOLVERR_ATTEMPTS);
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    data = _a.sent();
                    if (data.status !== "ok" || !data.solution) {
                        debugLog("FlareSolverr solve failed", data.status, data.message, "attempt " + attempt + "/" + MKVBASE_FLARESOLVERR_ATTEMPTS);
                    }
                    else {
                        cookieHeader = cookieHeaderFromCookies(data.solution.cookies || []);
                        session = saveDirectSession(cookieHeader, data.solution.userAgent);
                        debugLog("FlareSolverr bootstrap", session ? "usable" : "missing cookies", (Date.now() - started) + "ms", "attempt " + attempt + "/" + MKVBASE_FLARESOLVERR_ATTEMPTS);
                        if (session)
                            return [2 /*return*/, session];
                    }
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    debugLog("FlareSolverr error", error_2.message, "attempt " + attempt + "/" + MKVBASE_FLARESOLVERR_ATTEMPTS);
                    return [3 /*break*/, 8];
                case 8:
                    if (!(attempt < MKVBASE_FLARESOLVERR_ATTEMPTS)) return [3 /*break*/, 10];
                    return [4 /*yield*/, sleep(1500)];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    attempt++;
                    return [3 /*break*/, 1];
                case 11: return [2 /*return*/, null];
            }
        });
    });
}
function fetchMkvBaseApiInPage(page, query, cookieHeader) {
    return __awaiter(this, void 0, void 0, function () {
        var cookies, session, apiPath, json, results, error_3;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cookies = parseCookieHeader(cookieHeader);
                    session = {
                        cookieHeader: cookieHeader,
                        clientKey: cookies.mkv_client_key,
                        challenge: decodeURIComponent(cookies.mkv_challenge || ""),
                        seq: cookies.mkv_seq || "1",
                        savedAt: Date.now()
                    };
                    if (!session.clientKey || !session.challenge)
                        return [2 /*return*/, []];
                    apiPath = buildMkvBaseApiPath(query, session);
                    if (!apiPath)
                        return [2 /*return*/, []];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, page.evaluate(function (path) { return __awaiter(_this, void 0, void 0, function () {
                            var res;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fetch(path, {
                                            headers: {
                                                "Accept": "application/json, text/plain, */*",
                                                "X-Requested-With": "XMLHttpRequest"
                                            }
                                        })];
                                    case 1:
                                        res = _a.sent();
                                        if (!res.ok)
                                            return [2 /*return*/, null];
                                        return [2 /*return*/, res.json()];
                                }
                            });
                        }); }, apiPath)];
                case 2:
                    json = _a.sent();
                    results = json && Array.isArray(json.results) ? json.results : [];
                    debugLog("in-page API", query, results.length);
                    return [2 /*return*/, results.map(function (item) { return ({ title: item.title, url: item.url }); }).filter(function (item) { return item.url; })];
                case 3:
                    error_3 = _a.sent();
                    debugLog("in-page API error", error_3.message);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function waitForMkvBaseReady(page_1) {
    return __awaiter(this, arguments, void 0, function (page, timeoutMs) {
        var started, deadline, lastState, refreshCount, hasClientCookies, challengeText, looksLikeChallenge, _1, _2;
        if (timeoutMs === void 0) { timeoutMs = 30000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    started = Date.now();
                    deadline = started + timeoutMs;
                    lastState = null;
                    refreshCount = 0;
                    _a.label = 1;
                case 1:
                    if (!(Date.now() < deadline)) return [3 /*break*/, 11];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 8, , 9]);
                    return [4 /*yield*/, page.evaluate(function () { return ({
                            title: document.title || "",
                            href: location.href || "",
                            cookie: document.cookie || "",
                            body: document.body ? document.body.innerText.slice(0, 300) : ""
                        }); })];
                case 3:
                    lastState = _a.sent();
                    hasClientCookies = /mkv_client_key=/.test(lastState.cookie) && /mkv_challenge=/.test(lastState.cookie);
                    if (hasClientCookies)
                        return [2 /*return*/, lastState];
                    challengeText = (lastState.title + " " + lastState.body).toLowerCase();
                    looksLikeChallenge = challengeText.includes("just a moment") || challengeText.includes("enable javascript") || challengeText.includes("checking your browser");
                    if (!(looksLikeChallenge && refreshCount < MKVBASE_CF_REFRESH_MAX && Date.now() - started > MKVBASE_CF_REFRESH_DELAY_MS * (refreshCount + 1))) return [3 /*break*/, 7];
                    refreshCount++;
                    debugLog("refreshing Cloudflare challenge page", refreshCount);
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, page.reload({ waitUntil: "domcontentloaded", timeout: 25000 })];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _1 = _a.sent();
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 9];
                case 8:
                    _2 = _a.sent();
                    return [3 /*break*/, 9];
                case 9: return [4 /*yield*/, sleep(1000)];
                case 10:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 11:
                    debugLog("browser not ready", lastState);
                    return [2 /*return*/, lastState];
            }
        });
    });
}
function mapWithConcurrency(items, limit, worker) {
    return __awaiter(this, void 0, void 0, function () {
        var results, index, workers;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    results = new Array(items.length);
                    index = 0;
                    workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, function () { return __awaiter(_this, void 0, void 0, function () {
                        var current, _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    if (!(index < items.length)) return [3 /*break*/, 2];
                                    current = index++;
                                    _a = results;
                                    _b = current;
                                    return [4 /*yield*/, worker(items[current], current)];
                                case 1:
                                    _a[_b] = _c.sent();
                                    return [3 /*break*/, 0];
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(workers)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, results];
            }
        });
    });
}
var PROVIDER = "MkvBase";
var MKVBASE_FULL_ADDON_ENABLED = ENV.MKVBASE_FULL_ADDON_ENABLED === "1";
var mkvbaseBrowserBusy = false;
var BASE_URL = "https://mkvbase.site";
var SESSION_PATH = "";
var DIRECT_SESSION_TTL_MS = Number(ENV.MKVBASE_DIRECT_SESSION_TTL_MS || 10 * 60 * 60 * 1000);
var MKVBASE_MAX_RESOLVE_ITEMS = Number(ENV.MKVBASE_MAX_RESOLVE_ITEMS || 16);
var MKVBASE_RESOLVE_CONCURRENCY = Number(ENV.MKVBASE_RESOLVE_CONCURRENCY || 8);
var MKVBASE_HOST_RESOLVE_TIMEOUT_MS = Number(ENV.MKVBASE_HOST_RESOLVE_TIMEOUT_MS || 5000);
var MKVBASE_HEADERLESS_STREAMS_ONLY = ENV.MKVBASE_HEADERLESS_STREAMS_ONLY === "1";
var MKVBASE_TARGET_STREAMS = Number(ENV.MKVBASE_TARGET_STREAMS || 16);
var MKVBASE_DEBUG = ENV.MKVBASE_DEBUG === "true";
var MKVBASE_BROWSER_WAIT_MS = Number(ENV.MKVBASE_BROWSER_WAIT_MS || 60000);
var MKVBASE_CF_REFRESH_DELAY_MS = Number(ENV.MKVBASE_CF_REFRESH_DELAY_MS || 8000);
var MKVBASE_CF_REFRESH_MAX = Number(ENV.MKVBASE_CF_REFRESH_MAX || 2);
var MKVBASE_FLARESOLVERR_ENABLED = ENV.MKVBASE_FLARESOLVERR_ENABLED !== "0";
var MKVBASE_FLARESOLVERR_TIMEOUT_MS = Number(ENV.MKVBASE_FLARESOLVERR_TIMEOUT_MS || 60000);
var MKVBASE_FLARESOLVERR_ATTEMPTS = Number(ENV.MKVBASE_FLARESOLVERR_ATTEMPTS || 2);
var FLARESOLVERR_URL = ENV.FLARESOLVERR_URL || "http://127.0.0.1:8191/v1";
var TMDB_BASE = "https://api.themoviedb.org/3";
var TMDB_KEY = "307b7b8ef035c6aa336900aef4e203bd";
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
// ── Performance: Trusted hosts that don't need validation ──
var TRUSTED_HOST_RE = /pixeldrain\.com\/api\/file\/|workers\.dev|r2\.cloudflarestorage\.com|\.r2\.dev|video-downloads\.googleusercontent\.com|store\d*\.gofile\.io/i;
function isTrustedHost(url) { return TRUSTED_HOST_RE.test(url || ""); }
function extractMainTitle(str) {
    if (!str)
        return "";
    var clean = str.replace(/^[a-zA-Z0-9\s]+'s\s+/i, "");
    return clean.split(/[:\-(]/)[0].replace(/['"&]/g, "").replace(/\s+/g, " ").trim();
}
function normalizeQ(q) {
    if (!q)
        return "HD";
    var l = q.toLowerCase();
    if (l === "4k" || l === "2160p")
        return "2160p";
    if (l === "1440p" || l === "2k")
        return "1440p";
    if (l === "1080p")
        return "1080p";
    if (l === "720p")
        return "720p";
    if (l === "480p")
        return "480p";
    return "HD";
}
function parseQuality(text) {
    var match = String(text || "").match(/(2160|1440|1080|720|480)\s*p/i);
    if (match)
        return match[1] + "p";
    if (/\b2k\b/i.test(text))
        return "1440p";
    if (/4k|uhd/i.test(text))
        return "2160p";
    if (/1080p|fullhd/i.test(text))
        return "1080p";
    if (/720p|hd/i.test(text))
        return "720p";
    if (/480p|sd/i.test(text))
        return "480p";
    return "HD";
}
function stripSourcePrefix(text) {
    return String(text || "").replace(/^\s*[a-z0-9 ._-]{2,24}\s*\|\s*/i, "");
}
function normalizeReleaseText(text) {
    return stripSourcePrefix(text)
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function getTitleTokens(title) {
    var stopWords = new Set(["and", "the", "a", "an", "of", "in", "to", "on", "with", "part", "vol", "volume"]);
    return normalizeReleaseText(title).split(/\s+/).filter(function (w) { return w.length > 0 && !stopWords.has(w); });
}
function buildSearchTokens(query) {
    return normalizeReleaseText(query).split(/\s+/).filter(function (t) { return t.length > 2 || t === "4k" || t === "2k"; });
}
function extractReleaseYears(text) {
    var e_4, _a;
    var years = new Set();
    var matches = String(text || "").match(/\b(?:19|20)\d{2}\b/g) || [];
    try {
        for (var matches_1 = __values(matches), matches_1_1 = matches_1.next(); !matches_1_1.done; matches_1_1 = matches_1.next()) {
            var year = matches_1_1.value;
            years.add(year);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (matches_1_1 && !matches_1_1.done && (_a = matches_1.return)) _a.call(matches_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return years;
}
function hasTvReleaseMarker(text) {
    var value = String(text || "");
    return /\bS\d{1,2}(?:E\d{1,3})?\b/i.test(value)
        || /\b\d{1,2}x\d{1,3}\b/i.test(value)
        || /\bSeason\s*\d{1,2}\b/i.test(value)
        || /\b(?:Complete|All)\s+Season(?:s)?\b/i.test(value)
        || /\bEpisode\s*\d{1,3}\b/i.test(value);
}
function movieTitleMatchesResult(itemTitle, targetTitle, targetYear) {
    var itemNorm = normalizeReleaseText(itemTitle);
    var targetNorm = normalizeReleaseText(targetTitle);
    if (!itemNorm || !targetNorm)
        return false;
    if (hasTvReleaseMarker(stripSourcePrefix(itemTitle)))
        return false;
    var targetTokens = getTitleTokens(targetTitle);
    var itemTokens = getTitleTokens(itemTitle);
    if (!targetTokens.length)
        return true;
    // Key target tokens must be present in the leading portion of item tokens
    var firstItemTokens = itemTokens.slice(0, targetTokens.length + 3);
    var allMatch = targetTokens.every(function (t) { return firstItemTokens.includes(t); });
    if (!allMatch) {
        // Fallback: check startsWith regex
        var titlePattern = new RegExp("^".concat(targetNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "(?:\\b|$)"));
        if (!titlePattern.test(itemNorm))
            return false;
    }
    if (targetYear) {
        var years = Array.from(extractReleaseYears(itemTitle));
        if (years.length > 0) {
            var targetY_1 = parseInt(targetYear, 10);
            var matchesYear = years.some(function (y) { return Math.abs(parseInt(y, 10) - targetY_1) <= 1; });
            if (!matchesYear)
                return false;
        }
    }
    return true;
}
function normalizeStreamUrlForDedupe(url) {
    try {
        var parsed = new URL(url);
        parsed.hash = "";
        parsed.searchParams.delete("s");
        return parsed.href;
    }
    catch (_a) {
        return String(url || "");
    }
}
function urlsAreSameResolvedFile(a, b) {
    var first = normalizeStreamUrlForDedupe(a);
    var second = normalizeStreamUrlForDedupe(b);
    if (!first || !second)
        return false;
    if (first === second)
        return true;
    var shorter = first.length <= second.length ? first : second;
    var longer = first.length <= second.length ? second : first;
    if (shorter.length < 80 || !longer.startsWith(shorter))
        return false;
    try {
        var shortUrl = new URL(shorter);
        var longUrl = new URL(longer);
        if (shortUrl.origin !== longUrl.origin)
            return false;
        return /(?:workers\.dev|r2\.cloudflarestorage\.com|\.r2\.dev)$/i.test(shortUrl.hostname);
    }
    catch (_a) {
        return false;
    }
}
function addUniqueResolvedStream(streams, seenUrls, stream) {
    if (!stream || !stream.url)
        return;
    var normalized = normalizeStreamUrlForDedupe(stream.url);
    if (seenUrls.has(normalized))
        return;
    var existingIndex = streams.findIndex(function (existing) { return urlsAreSameResolvedFile(existing.url, stream.url); });
    if (existingIndex >= 0) {
        var existing = streams[existingIndex];
        if (normalizeStreamUrlForDedupe(stream.url).length > normalizeStreamUrlForDedupe(existing.url).length) {
            seenUrls.delete(normalizeStreamUrlForDedupe(existing.url));
            streams[existingIndex] = stream;
            seenUrls.add(normalized);
        }
        return;
    }
    seenUrls.add(normalized);
    streams.push(stream);
}
function extractFileSize(text) {
    var match = String(text || "").match(/(\d+(?:\.\d+)?)\s*(GB|GiB|MB|MiB)\b/i);
    if (!match)
        return "";
    var unit = match[2].toUpperCase().replace("IB", "B");
    return match[1] + " " + unit;
}
function formatFileSize(bytes) {
    var value = Number(bytes || 0);
    if (!value)
        return "";
    if (value < 1024 * 1024 * 1024)
        return (value / (1024 * 1024)).toFixed(2) + " MB";
    return (value / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}
function validateResolvedPlaybackUrl(url_1) {
    return __awaiter(this, arguments, void 0, function (url, headers) {
        var res, contentType, contentLength, _a;
        if (headers === void 0) { headers = {}; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // Skip validation for trusted hosts — they are always playable
                    if (isTrustedHost(url))
                        return [2 /*return*/, true];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchSafe(url, {
                            headers: __assign(__assign({}, (headers || {})), { Range: "bytes=0-511" })
                        }, 4000)];
                case 2:
                    res = _b.sent();
                    if (!res || (!res.ok && res.status !== 206))
                        return [2 /*return*/, false];
                    contentType = res.headers && res.headers.get ? String(res.headers.get("content-type") || "") : "";
                    contentLength = res.headers && res.headers.get ? Number(res.headers.get("content-length") || 0) : 0;
                    return [2 /*return*/, res.status === 206 || /video|octet-stream|matroska|mp4|mpegurl/i.test(contentType) || contentLength > 1024 * 1024];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function probeResolvedFileSize(url_1) {
    return __awaiter(this, arguments, void 0, function (url, headers) {
        var res, contentRange, totalBytes, contentLength, _a;
        if (headers === void 0) { headers = {}; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetchSafe(url, {
                            headers: __assign(__assign({}, (headers || {})), { Range: "bytes=0-0" })
                        }, 4000)];
                case 1:
                    res = _b.sent();
                    if (!res)
                        return [2 /*return*/, ""];
                    contentRange = res.headers && res.headers.get ? String(res.headers.get("content-range") || "") : "";
                    totalBytes = contentRange.includes("/") ? contentRange.split("/").pop().trim() : "";
                    if (totalBytes)
                        return [2 /*return*/, formatFileSize(totalBytes)];
                    contentLength = res.headers && res.headers.get ? res.headers.get("content-length") : "";
                    return [2 /*return*/, formatFileSize(contentLength)];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, ""];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function qualityWeight(quality) {
    return ({ "2160p": 4, "1440p": 3, "1080p": 2, "720p": 1, "480p": 0, "HD": 0 })[quality] || 0;
}
function isAtLeast1080pTitle(text) {
    return qualityWeight(normalizeQ(parseQuality(text))) >= qualityWeight("1080p");
}
function deliveryHostLabel(url) {
    var value = String(url || "").toLowerCase();
    if (value.includes("video-downloads.googleusercontent.com"))
        return "GD";
    if (value.includes("r2.cloudflarestorage.com") || value.includes(".r2.dev"))
        return "R2";
    if (value.includes("workers.dev"))
        return "CF";
    if (value.includes("pixeldrain.com"))
        return "PX";
    if (value.includes("gofile.io") || /store\d*\.gofile\.io/i.test(value))
        return "GF";
    if (value.includes("hubcloud"))
        return "Hubcloud";
    return "Direct";
}
function sourceHostLabel(url) {
    var value = String(url || "").toLowerCase();
    if (value.includes("gdflix"))
        return "GDFlix";
    if (value.includes("hubcloud") || value.includes("sportverse") || value.includes("gpdl"))
        return "Hubcloud";
    if (value.includes("gofile"))
        return "Gofile";
    if (value.includes("pixeldrain"))
        return "Pixeldrain";
    if (value.includes("vcloud"))
        return "VCloud";
    return "Direct";
}
function streamRouteLabel(sourceUrl, resolvedUrl) {
    var delivery = deliveryHostLabel(resolvedUrl);
    var source = sourceHostLabel(sourceUrl);
    if (delivery === source)
        return delivery;
    return "".concat(delivery, "-").concat(source);
}
function formatQualityLabel(q) {
    if (q === "2160p")
        return "4K UHD";
    if (q === "1440p")
        return "2K QHD";
    if (q === "1080p")
        return "1080p FHD";
    return q || "HD";
}
function parseReleaseDetails(title) {
    var t = String(title || "").trim();
    var tags = [];
    if (/remux/i.test(t))
        tags.push("REMUX");
    if (/bluray|blu-ray/i.test(t))
        tags.push("BluRay");
    else if (/web-?dl|webrip/i.test(t))
        tags.push("WEB-DL");
    else if (/hdtv/i.test(t))
        tags.push("HDTV");
    if (/dolby\s*vision|[\b_.]dv[\b_.]/i.test(t))
        tags.push("DV");
    if (/hdr10\+/i.test(t))
        tags.push("HDR10+");
    else if (/hdr10|hdr/i.test(t))
        tags.push("HDR");
    if (/10[-_]?bit/i.test(t))
        tags.push("10-Bit");
    if (/hevc|x265|h\.?265/i.test(t))
        tags.push("HEVC");
    else if (/x264|h\.?264|avc/i.test(t))
        tags.push("x264");
    if (/atmos/i.test(t))
        tags.push("Atmos");
    if (/truehd/i.test(t))
        tags.push("TrueHD");
    else if (/dts-hd\s*ma/i.test(t))
        tags.push("DTS-HD MA");
    else if (/ddp|dd\+|eac3/i.test(t))
        tags.push("DDP 5.1");
    else if (/dts/i.test(t))
        tags.push("DTS");
    if (/dual[-_ ]audio|multi[-_ ]audio/i.test(t))
        tags.push("Multi-Audio");
    else if (/hindi/i.test(t) && /english/i.test(t))
        tags.push("Hindi + English");
    return tags;
}
function dedupeItemsByUrl(items) {
    var seen = new Set();
    return (items || []).filter(function (item) {
        if (!item || !item.url || seen.has(item.url))
            return false;
        seen.add(item.url);
        return true;
    });
}
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
function fetchSafe(url_1) {
    return __awaiter(this, arguments, void 0, function (url, opts, timeout) {
        var _a;
        if (opts === void 0) { opts = {}; }
        if (timeout === void 0) { timeout = 5000; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.race([
                            fetch(url, __assign(__assign({}, opts), { headers: __assign({ "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.5" }, (opts.headers || {})) })),
                            new Promise(function (_, rej) { return setTimeout(function () { return rej(new Error("timeout")); }, timeout); })
                        ])];
                case 1: return [2 /*return*/, _b.sent()];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchTmdbDetails(tmdbId, mediaType) {
    return __awaiter(this, void 0, void 0, function () {
        var lookupId, cacheKey, cached, isTv, typeStr, isImdb, cineRes, cineData, info, e_5, endpoint, res, data, info, e_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lookupId = String(tmdbId || "").replace(/^tmdb:/, "");
                    cacheKey = "".concat(mediaType, ":").concat(lookupId);
                    cached = tmdbCache.get(cacheKey);
                    if (cached && Date.now() - cached.ts < TMDB_CACHE_TTL_MS)
                        return [2 /*return*/, cached.info];
                    isTv = mediaType === "tv" || mediaType === "series";
                    typeStr = isTv ? "series" : "movie";
                    isImdb = lookupId.startsWith("tt");
                    if (!isImdb) return [3 /*break*/, 6];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetchSafe("https://v3-cinemeta.strem.io/meta/".concat(typeStr, "/").concat(lookupId, ".json"), {}, 3000)];
                case 2:
                    cineRes = _a.sent();
                    if (!(cineRes && cineRes.ok)) return [3 /*break*/, 4];
                    return [4 /*yield*/, cineRes.json()];
                case 3:
                    cineData = _a.sent();
                    if (cineData && cineData.meta && cineData.meta.name) {
                        info = {
                            title: cineData.meta.name,
                            year: String(cineData.meta.year || "").substring(0, 4),
                            imdbId: cineData.meta.imdb_id || lookupId
                        };
                        tmdbCache.set(cacheKey, { info: info, ts: Date.now() });
                        return [2 /*return*/, info];
                    }
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_5 = _a.sent();
                    return [3 /*break*/, 6];
                case 6:
                    endpoint = isTv ? "tv" : "movie";
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 11, , 12]);
                    return [4 /*yield*/, fetchSafe("".concat(TMDB_BASE, "/").concat(endpoint, "/").concat(lookupId, "?api_key=").concat(TMDB_KEY, "&append_to_response=external_ids"), { headers: { "User-Agent": UA } }, 4000)];
                case 8:
                    res = _a.sent();
                    if (!(res && res.ok)) return [3 /*break*/, 10];
                    return [4 /*yield*/, res.json()];
                case 9:
                    data = _a.sent();
                    info = {
                        title: isTv ? data.name : data.title,
                        year: (isTv ? data.first_air_date : data.release_date || "").substring(0, 4),
                        imdbId: (data.external_ids && data.external_ids.imdb_id) || (isImdb ? lookupId : null)
                    };
                    tmdbCache.set(cacheKey, { info: info, ts: Date.now() });
                    return [2 /*return*/, info];
                case 10: return [3 /*break*/, 12];
                case 11:
                    e_6 = _a.sent();
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/, null];
            }
        });
    });
}
function getChromiumPath() { return null; }
function resolveGdflix(gdUrl) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Fire TV/Nuvio sandbox has no Chromium/puppeteer. Do not block plugin loading.
            return [2 /*return*/, null];
        });
    });
}
function fetchMkvBaseApi(query_1) {
    return __awaiter(this, arguments, void 0, function (query, options) {
        var direct, solverSession, solverResult;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!options.skipDirect) return [3 /*break*/, 4];
                    return [4 /*yield*/, fetchMkvBaseApiDirect(query)];
                case 1:
                    direct = _a.sent();
                    if (direct.ok)
                        return [2 /*return*/, direct.results];
                    return [4 /*yield*/, bootstrapMkvBaseSessionWithFlareSolverr()];
                case 2:
                    solverSession = _a.sent();
                    if (!solverSession) return [3 /*break*/, 4];
                    return [4 /*yield*/, fetchMkvBaseApiDirect(query, solverSession)];
                case 3:
                    solverResult = _a.sent();
                    if (solverResult.ok)
                        return [2 /*return*/, solverResult.results];
                    _a.label = 4;
                case 4: return [2 /*return*/, []];
            }
        });
    });
}
function getStreams(tmdbId_1, mediaType_1, season_1, episode_1) {
    return __awaiter(this, arguments, void 0, function (tmdbId, mediaType, season, episode, options) {
        // ── Resolve candidate → stream with early-exit when enough streams collected ──
        function resolveOneItem(item, idx) {
            return __awaiter(this, void 0, void 0, function () {
                var itemStart, rawTitleText, quality, size, itemStreams, resolvedHostLinks, e_10, _a, _b, candidate, rUrl, requestHeaders, behaviorHints, rawTitle, tags, qLabel, routeLabel, displaySize, sizeTag, badgeSuffix, streamName, streamTitle, e_11_1;
                var e_11, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            if (!item.url || earlyDone)
                                return [2 /*return*/, []];
                            itemStart = Date.now();
                            rawTitleText = item.title ? item.title.split("\n")[0] : info.title;
                            quality = normalizeQ(parseQuality(rawTitleText));
                            if (qualityWeight(quality) < qualityWeight("1080p"))
                                return [2 /*return*/, []];
                            size = extractFileSize(rawTitleText);
                            itemStreams = [];
                            resolvedHostLinks = getCachedResolvedUrl(item.url);
                            if (!!resolvedHostLinks) return [3 /*break*/, 9];
                            if (earlyDone)
                                return [2 /*return*/, []];
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 7, , 8]);
                            if (!(item.url.includes("hubcloud") || item.url.includes("vcloud"))) return [3 /*break*/, 3];
                            return [4 /*yield*/, resolvePlayableCandidates(item.url, { maxDepth: 4, timeout: MKVBASE_HOST_RESOLVE_TIMEOUT_MS })];
                        case 2:
                            resolvedHostLinks = _d.sent();
                            return [3 /*break*/, 6];
                        case 3:
                            if (!isReadyForPlayback(item.url)) return [3 /*break*/, 4];
                            resolvedHostLinks = [item.url];
                            return [3 /*break*/, 6];
                        case 4: return [4 /*yield*/, resolvePlayableCandidates(item.url, { maxDepth: 4, timeout: MKVBASE_HOST_RESOLVE_TIMEOUT_MS })];
                        case 5:
                            resolvedHostLinks = _d.sent();
                            _d.label = 6;
                        case 6: return [3 /*break*/, 8];
                        case 7:
                            e_10 = _d.sent();
                            resolvedHostLinks = [];
                            return [3 /*break*/, 8];
                        case 8:
                            if (resolvedHostLinks.length)
                                setCachedResolvedUrl(item.url, resolvedHostLinks);
                            _d.label = 9;
                        case 9:
                            _d.trys.push([9, 14, 15, 16]);
                            _a = __values(resolvedHostLinks || []), _b = _a.next();
                            _d.label = 10;
                        case 10:
                            if (!!_b.done) return [3 /*break*/, 13];
                            candidate = _b.value;
                            if (earlyDone)
                                return [3 /*break*/, 13];
                            rUrl = getCandidateUrl(candidate);
                            if (!rUrl)
                                return [3 /*break*/, 12];
                            requestHeaders = getCandidateHeaders(candidate);
                            if (MKVBASE_HEADERLESS_STREAMS_ONLY && requestHeaders)
                                return [3 /*break*/, 12];
                            behaviorHints = { notWebReady: true };
                            return [4 /*yield*/, validateResolvedPlaybackUrl(rUrl, requestHeaders || {})];
                        case 11:
                            if (!(_d.sent()))
                                return [3 /*break*/, 12];
                            if (requestHeaders)
                                behaviorHints.proxyHeaders = { request: requestHeaders };
                            rawTitle = (item.title || info.title || "Release").replace(/\n+/g, " ").trim();
                            tags = parseReleaseDetails(rawTitle);
                            qLabel = formatQualityLabel(quality);
                            routeLabel = streamRouteLabel(item.url, rUrl);
                            displaySize = size || "";
                            sizeTag = displaySize ? "[\uD83D\uDCBE ".concat(displaySize, "] ") : "";
                            badgeSuffix = [
                                tags.includes("REMUX") ? "REMUX" : "",
                                tags.includes("DV") ? "DV" : "",
                                tags.includes("HDR") || tags.includes("HDR10+") ? "HDR" : ""
                            ].filter(Boolean).join(" ");
                            streamName = "[MkvBase] ".concat(qLabel).concat(badgeSuffix ? " " + badgeSuffix : "");
                            streamTitle = "[".concat(routeLabel, "] ").concat(sizeTag).concat(rawTitle, "\n").concat(tags.length > 0 ? tags.join(" • ") : qLabel);
                            itemStreams.push({
                                name: streamName,
                                title: streamTitle,
                                url: rUrl,
                                quality: quality,
                                size: displaySize,
                                behaviorHints: behaviorHints
                            });
                            _d.label = 12;
                        case 12:
                            _b = _a.next();
                            return [3 /*break*/, 10];
                        case 13: return [3 /*break*/, 16];
                        case 14:
                            e_11_1 = _d.sent();
                            e_11 = { error: e_11_1 };
                            return [3 /*break*/, 16];
                        case 15:
                            try {
                                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                            }
                            finally { if (e_11) throw e_11.error; }
                            return [7 /*endfinally*/];
                        case 16:
                            debugLog("item[".concat(idx, "] resolved ").concat(itemStreams.length, " streams in ").concat(Date.now() - itemStart, "ms: ").concat(item.url.slice(0, 60)));
                            return [2 /*return*/, itemStreams];
                    }
                });
            });
        }
        var totalStart, cacheKey, cachedStreams, t0, info, isTv, movieYear, rawT, andT, searchQueries, sStr, eStr, items, matchingItems, _loop_1, searchQueries_1, searchQueries_1_1, searchQuery, state_1, e_7_1, highQualityItems, streams, seenUrls, earlyDone, candidatesToResolve, t2, resolvePromises, settled, settled_1, settled_1_1, result, _a, _b, stream;
        var e_7, _c, e_8, _d, e_9, _e;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    totalStart = Date.now();
                    cacheKey = "".concat(mediaType, ":").concat(tmdbId, ":").concat(season || 0, ":").concat(episode || 0);
                    cachedStreams = getCachedStreams(cacheKey);
                    if (cachedStreams) {
                        console.log("[MkvBase] \u26A1 Cache hit for ".concat(cacheKey, " (").concat(cachedStreams.length, " streams, ").concat(Date.now() - totalStart, "ms)"));
                        return [2 /*return*/, cachedStreams];
                    }
                    t0 = Date.now();
                    return [4 /*yield*/, fetchTmdbDetails(tmdbId, mediaType)];
                case 1:
                    info = _f.sent();
                    console.log("[MkvBase] \u23F1 TMDB lookup: ".concat(Date.now() - t0, "ms"));
                    if (!info || !info.title)
                        return [2 /*return*/, []];
                    isTv = mediaType === "tv" || mediaType === "series";
                    movieYear = !isTv && info.year ? String(info.year) : "";
                    rawT = (info.title || "").toLowerCase()
                        .replace(/\bpart\s+two\b/gi, "part 2")
                        .replace(/\bpart\s+one\b/gi, "part 1")
                        .replace(/\bpart\s+three\b/gi, "part 3")
                        .replace(/[:\-(]/g, " ")
                        .replace(/['"&]/g, "")
                        .replace(/\s+/g, " ")
                        .trim();
                    andT = (info.title || "").toLowerCase()
                        .replace(/&/g, " and ")
                        .replace(/[:\-(]/g, " ")
                        .replace(/['"]/g, "")
                        .replace(/\s+/g, " ")
                        .trim();
                    searchQueries = [];
                    if (isTv && season && episode) {
                        sStr = String(season).padStart(2, "0");
                        eStr = String(episode).padStart(2, "0");
                        searchQueries.push("".concat(andT, " s").concat(sStr, "e").concat(eStr));
                        searchQueries.push("".concat(andT, " season ").concat(season));
                        searchQueries.push(andT);
                    }
                    else if (!isTv && movieYear) {
                        searchQueries.push("".concat(andT, " ").concat(movieYear));
                        if (rawT !== andT)
                            searchQueries.push("".concat(rawT, " ").concat(movieYear));
                        searchQueries.push(andT);
                        if (rawT !== andT)
                            searchQueries.push(rawT);
                    }
                    else {
                        searchQueries.push(andT);
                        if (rawT !== andT)
                            searchQueries.push(rawT);
                    }
                    items = [];
                    matchingItems = [];
                    _loop_1 = function (searchQuery) {
                        var maxAttempts, attempt, sStr, eStr, seToken_1, seAltToken_1, altToken_1, strictMatches, yearMatches;
                        return __generator(this, function (_g) {
                            switch (_g.label) {
                                case 0:
                                    console.log("[MkvBase] query: '".concat(searchQuery, "' (Target: S").concat(season, "E").concat(episode, ")"));
                                    maxAttempts = 1;
                                    attempt = 1;
                                    _g.label = 1;
                                case 1:
                                    if (!(attempt <= maxAttempts)) return [3 /*break*/, 5];
                                    return [4 /*yield*/, fetchMkvBaseApi(searchQuery)];
                                case 2:
                                    items = _g.sent();
                                    console.log("[MkvBase] fetchMkvBaseApi '".concat(searchQuery, "' attempt ").concat(attempt, " returned ").concat(items.length, " items"));
                                    if (items.length)
                                        return [3 /*break*/, 5];
                                    if (!(attempt < maxAttempts)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, sleep(1500)];
                                case 3:
                                    _g.sent();
                                    _g.label = 4;
                                case 4:
                                    attempt++;
                                    return [3 /*break*/, 1];
                                case 5:
                                    if (!items.length)
                                        return [2 /*return*/, "continue"];
                                    if (isTv && season && episode) {
                                        sStr = String(season).padStart(2, "0");
                                        eStr = String(episode).padStart(2, "0");
                                        seToken_1 = "s".concat(sStr, "e").concat(eStr);
                                        seAltToken_1 = "s".concat(sStr, " e").concat(eStr);
                                        altToken_1 = "".concat(season, "x").concat(eStr);
                                        matchingItems = items.filter(function (item) {
                                            var itemTitleLower = (item.title || "").toLowerCase();
                                            if (/\.zip\b|\.rar\b|\bzip\b|\brar\b/i.test(itemTitleLower))
                                                return false;
                                            return itemTitleLower.includes(seToken_1) || itemTitleLower.includes(seAltToken_1) || itemTitleLower.includes(altToken_1);
                                        });
                                        console.log("[MkvBase] series filter kept ".concat(matchingItems.length, "/").concat(items.length, " items for S").concat(sStr, "E").concat(eStr));
                                    }
                                    else if (!isTv) {
                                        strictMatches = items.filter(function (item) { return movieTitleMatchesResult(item.title, info.title, movieYear); });
                                        yearMatches = movieYear ? strictMatches.filter(function (item) { return extractReleaseYears(item.title).has(movieYear); }) : [];
                                        matchingItems = yearMatches.length ? yearMatches : strictMatches;
                                        console.log("[MkvBase] movie filter kept ".concat(matchingItems.length, "/").concat(items.length, " items for '").concat(info.title, "' ").concat(movieYear || "").trim());
                                    }
                                    else {
                                        matchingItems = items;
                                    }
                                    if (matchingItems.length)
                                        return [2 /*return*/, "break"];
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _f.label = 2;
                case 2:
                    _f.trys.push([2, 7, 8, 9]);
                    searchQueries_1 = __values(searchQueries), searchQueries_1_1 = searchQueries_1.next();
                    _f.label = 3;
                case 3:
                    if (!!searchQueries_1_1.done) return [3 /*break*/, 6];
                    searchQuery = searchQueries_1_1.value;
                    return [5 /*yield**/, _loop_1(searchQuery)];
                case 4:
                    state_1 = _f.sent();
                    if (state_1 === "break")
                        return [3 /*break*/, 6];
                    _f.label = 5;
                case 5:
                    searchQueries_1_1 = searchQueries_1.next();
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 9];
                case 7:
                    e_7_1 = _f.sent();
                    e_7 = { error: e_7_1 };
                    return [3 /*break*/, 9];
                case 8:
                    try {
                        if (searchQueries_1_1 && !searchQueries_1_1.done && (_c = searchQueries_1.return)) _c.call(searchQueries_1);
                    }
                    finally { if (e_7) throw e_7.error; }
                    return [7 /*endfinally*/];
                case 9:
                    if (!matchingItems.length)
                        return [2 /*return*/, []];
                    highQualityItems = matchingItems.filter(function (item) { return isAtLeast1080pTitle(item.title); });
                    if (highQualityItems.length) {
                        matchingItems = highQualityItems;
                    }
                    matchingItems = dedupeItemsByUrl(matchingItems);
                    streams = [];
                    seenUrls = new Set();
                    earlyDone = false;
                    candidatesToResolve = matchingItems.slice(0, MKVBASE_MAX_RESOLVE_ITEMS);
                    t2 = Date.now();
                    resolvePromises = candidatesToResolve.map(function (item, idx) { return resolveOneItem(item, idx); });
                    return [4 /*yield*/, Promise.allSettled(resolvePromises)];
                case 10:
                    settled = _f.sent();
                    try {
                        for (settled_1 = __values(settled), settled_1_1 = settled_1.next(); !settled_1_1.done; settled_1_1 = settled_1.next()) {
                            result = settled_1_1.value;
                            if (result.status !== "fulfilled")
                                continue;
                            try {
                                for (_a = (e_9 = void 0, __values(result.value || [])), _b = _a.next(); !_b.done; _b = _a.next()) {
                                    stream = _b.value;
                                    addUniqueResolvedStream(streams, seenUrls, stream);
                                }
                            }
                            catch (e_9_1) { e_9 = { error: e_9_1 }; }
                            finally {
                                try {
                                    if (_b && !_b.done && (_e = _a.return)) _e.call(_a);
                                }
                                finally { if (e_9) throw e_9.error; }
                            }
                            if (streams.length >= MKVBASE_TARGET_STREAMS) {
                                earlyDone = true;
                            }
                        }
                    }
                    catch (e_8_1) { e_8 = { error: e_8_1 }; }
                    finally {
                        try {
                            if (settled_1_1 && !settled_1_1.done && (_d = settled_1.return)) _d.call(settled_1);
                        }
                        finally { if (e_8) throw e_8.error; }
                    }
                    console.log("[MkvBase] \u23F1 Resolve phase: ".concat(Date.now() - t2, "ms (").concat(streams.length, " streams from ").concat(candidatesToResolve.length, " candidates)"));
                    // Quality sorting: 4K (2160p) > 2K (1440p) > 1080p (FHD), then by fastest direct host
                    streams.sort(function (a, b) {
                        var weights = { "2160p": 5, "1440p": 4, "1080p": 3, "720p": 2, "480p": 1, "HD": 1 };
                        var wDiff = (weights[b.quality] || 0) - (weights[a.quality] || 0);
                        if (wDiff !== 0)
                            return wDiff;
                        var hostPriority = function (url) {
                            var u = (url || "").toLowerCase();
                            if (u.includes("workers.dev") || u.includes("r2.dev") || u.includes("cloudflarestorage"))
                                return 4;
                            if (u.includes("pixeldrain.com"))
                                return 3;
                            if (u.includes("googleusercontent.com"))
                                return 2;
                            if (u.includes("gofile.io"))
                                return 1;
                            return 0;
                        };
                        return hostPriority(b.url) - hostPriority(a.url);
                    });
                    // Cache the results
                    setCachedStreams(cacheKey, streams);
                    console.log("[MkvBase] \u2705 Total: ".concat(Date.now() - totalStart, "ms \u2192 ").concat(streams.length, " streams for ").concat(cacheKey));
                    return [2 /*return*/, streams];
            }
        });
    });
}
// Fire TV note: do not start a browser/session refresh at plugin load time.
// MkvBase sessions are created lazily only when the provider actually needs one.
module.exports = { lookupIdType: "imdb", getStreams: getStreams, resolveGdflix: resolveGdflix, fetchMkvBaseApi: fetchMkvBaseApi };
