"use strict";
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
var crypto = null;
try {
    crypto = require("crypto");
}
catch (_) { }
var DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
var DEFAULT_REFERER = "https://mkvbase.site/";
var MOBILE_UAS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36"
];
var GOFILE_API = "https://api.gofile.io";
var GOFILE_BROWSER_LANGUAGE = "en-US";
var GOFILE_SECRET = "9844d94d963d30";
function pushUniqueUrl(list, url) {
    if (!url)
        return;
    try {
        url = new URL(url).href;
    }
    catch (_a) {
        return;
    }
    if (!list.includes(url))
        list.push(url);
}
function getCandidateUrl(candidate) {
    return typeof candidate === "string" ? candidate : candidate && candidate.url;
}
function getCandidateHeaders(candidate) {
    return typeof candidate === "string" ? null : candidate && candidate.headers;
}
function pushUniqueCandidate(list, candidate) {
    var url = getCandidateUrl(candidate);
    if (!url)
        return;
    try {
        new URL(url);
    }
    catch (_a) {
        return;
    }
    if (!list.some(function (item) { return getCandidateUrl(item) === url; }))
        list.push(candidate);
}
function originOf(url) {
    try {
        var parsed = new URL(url);
        return parsed.origin;
    }
    catch (_a) {
        return "";
    }
}
function appendSyncParam(url) {
    if (!url || !/^https?:\/\//i.test(url))
        return url;
    try {
        var parsed = new URL(url);
        if (/r2\.cloudflarestorage\.com$/i.test(parsed.hostname) || parsed.searchParams.has("X-Amz-Signature")) {
            return url;
        }
    }
    catch (_a) { }
    var value = String(1 + new Date().getMinutes());
    return url.includes("?") ? "".concat(url, "&s=").concat(value) : "".concat(url, "?s=").concat(value);
}
function mobileHeaders(referer) {
    if (referer === void 0) { referer = DEFAULT_REFERER; }
    return {
        "User-Agent": MOBILE_UAS[Math.floor(Math.random() * MOBILE_UAS.length)],
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "identity",
        "Referer": referer || DEFAULT_REFERER,
        "Cookie": "xla=s4t",
    };
}
function pushReadyCandidate(list, url, headers, title) {
    if (!url)
        return;
    var normalized = normalizeDownloadUrl(url, DEFAULT_REFERER);
    if (!normalized || !isReadyForPlayback(normalized))
        return;
    pushUniqueCandidate(list, { url: normalized, headers: headers, title: title });
}
function formatResolvedUrl(url) {
    try {
        var parsed = new URL(url);
        return parsed.hostname + parsed.pathname;
    }
    catch (_a) {
        return String(url || "");
    }
}
function normalizeDownloadUrl(rawUrl, baseUrl) {
    if (!rawUrl)
        return null;
    var url;
    try {
        url = new URL(rawUrl, baseUrl).href;
    }
    catch (_a) {
        return null;
    }
    try {
        var parsed = new URL(url);
        if (parsed.hostname.includes("gamerxyt.com") && parsed.pathname.includes("dl.php")) {
            var link = parsed.searchParams.get("link");
            if (link)
                return decodeURIComponent(link);
        }
        if (parsed.hostname.includes("pixeldrain.dev") && parsed.pathname.includes("/api/file/")) {
            parsed.hostname = "pixeldrain.com";
            return parsed.href;
        }
        if ((parsed.hostname.includes("pixeldrain.dev") || parsed.hostname.includes("pixeldrain.com")) && parsed.pathname.includes("/u/")) {
            var fileId = parsed.pathname.split("/").filter(Boolean).pop();
            return fileId ? "https://pixeldrain.com/api/file/" + fileId : url;
        }
        if (/fastdl-[^.]+\.pages\.dev$/i.test(parsed.hostname)) {
            var wrapped = parsed.searchParams.get("url");
            if (wrapped)
                return decodeURIComponent(wrapped);
        }
    }
    catch (_b) { }
    return url;
}
function isKnownDownloadHost(url) {
    return /gdflix\.(?:dev|io)\/file\/|new\d*\.gdflix\.io\/(?:file|wfile|cflare|cloud)\/|instant\.busycdn\.xyz|hubcloud\.[^/]+\/(?:video|drive)\/|(?:gamerxyt\.com|sportverse\.cc|hubcloud\.[^/]+)\/hubcloud\.php|gpdl\d*\.|(?:store\d*\.gofile\.io|gofile\.io\/download|gofile\.io\/d\/)|video-downloads\.googleusercontent\.com|pixeldrain\.com\/api\/file\/|hubcloud\.cloudflarefb\.workers\.dev|vcloud\.zip\/|r2\.cloudflarestorage\.com|\.r2\.dev|workers\.dev/i.test(url || "");
}
function isBlockedMediaUrl(url) {
    return /\.(?:gif|png|jpe?g|webp|svg|zip|rar)(?:[?#]|$)|filename.*?\.(?:zip|rar)/i.test(url || "");
}
function isReadyForPlayback(url) {
    if (isBlockedMediaUrl(url))
        return false;
    return /video-downloads\.googleusercontent\.com|pixeldrain\.com\/api\/file\/|store\d*\.gofile\.io|gofile\.io\/download|r2\.cloudflarestorage\.com|\.r2\.dev|workers\.dev/i.test(url || "");
}
function safeBase64Decode(value) {
    try {
        return Buffer.from(String(value || ""), "base64").toString("utf8");
    }
    catch (_a) {
        return "";
    }
}
function extractDoubleAtobUrl(html, pageUrl) {
    var match = String(html || "").match(/var\s+url\s*=\s*atob\s*\(\s*atob\s*\(\s*["']([^"']+)["']\s*\)\s*\)/i)
        || String(html || "").match(/atob\s*\(\s*atob\s*\(\s*["']([^"']+)["']\s*\)\s*\)/i);
    if (!match)
        return null;
    var decoded = safeBase64Decode(safeBase64Decode(match[1]));
    return normalizeDownloadUrl(decoded, pageUrl);
}
function extractScriptUrl(html, pageUrl) {
    var match = String(html || "").match(/var\s+url\s*=\s*["']([^"']+)["']/i);
    return match ? normalizeDownloadUrl(match[1], pageUrl) : null;
}
function extractPixeldrainVar(html, pageUrl) {
    var match = String(html || "").match(/var\s+pxl\s*=\s*["']([^"']+)["']/i);
    if (!match)
        return null;
    return normalizeDownloadUrl(match[1], pageUrl);
}
function extractDownloadLinks(html, pageUrl) {
    var e_1, _a, e_2, _b, e_3, _c;
    var links = [];
    var text = String(html || "");
    try {
        for (var _d = __values([extractDoubleAtobUrl(text, pageUrl), extractScriptUrl(text, pageUrl), extractPixeldrainVar(text, pageUrl)]), _e = _d.next(); !_e.done; _e = _d.next()) {
            var scripted = _e.value;
            if (scripted && isKnownDownloadHost(scripted))
                pushUniqueUrl(links, scripted);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var absoluteMatches = text.match(/https?:\/\/[^"'\s<>]+/gi) || [];
    try {
        for (var absoluteMatches_1 = __values(absoluteMatches), absoluteMatches_1_1 = absoluteMatches_1.next(); !absoluteMatches_1_1.done; absoluteMatches_1_1 = absoluteMatches_1.next()) {
            var match = absoluteMatches_1_1.value;
            var clean = match.replace(/[),.;]+$/, "");
            if (/instant\.busycdn\.xyz|gdflix\.(?:dev|io)\/file\/|new\d*\.gdflix\.io\/(?:file|wfile|cflare|cloud)\/|video-downloads\.googleusercontent\.com|hubcloud\.php|gpdl\d*\.|gofile\.io\/d\/|r2\.cloudflarestorage\.com|\.r2\.dev|workers\.dev|pixeldrain\.(?:dev|com)\/u\/|pixeldrain\.com\/api\/file\/|hubcloud\.cloudflarefb\.workers\.dev|vcloud\.zip\//i.test(clean)) {
                pushUniqueUrl(links, normalizeDownloadUrl(clean, pageUrl));
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (absoluteMatches_1_1 && !absoluteMatches_1_1.done && (_b = absoluteMatches_1.return)) _b.call(absoluteMatches_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var hrefMatches = text.matchAll(/href=["']([^"']+)["']/gi);
    try {
        for (var hrefMatches_1 = __values(hrefMatches), hrefMatches_1_1 = hrefMatches_1.next(); !hrefMatches_1_1.done; hrefMatches_1_1 = hrefMatches_1.next()) {
            var match = hrefMatches_1_1.value;
            var clean = normalizeDownloadUrl(match[1], pageUrl);
            if (/instant\.busycdn\.xyz|gdflix\.(?:dev|io)\/file\/|new\d*\.gdflix\.io\/(?:file|wfile|cflare|cloud)\/|video-downloads\.googleusercontent\.com|hubcloud\.php|gpdl\d*\.|gofile\.io\/d\/|r2\.cloudflarestorage\.com|\.r2\.dev|workers\.dev|pixeldrain\.com\/api\/file\/|hubcloud\.cloudflarefb\.workers\.dev|vcloud\.zip\//i.test(clean || "")) {
                pushUniqueUrl(links, clean);
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (hrefMatches_1_1 && !hrefMatches_1_1.done && (_c = hrefMatches_1.return)) _c.call(hrefMatches_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return links;
}
function fetchWithTimeout(url_1) {
    return __awaiter(this, arguments, void 0, function (url, opts, timeout) {
        var _a;
        if (opts === void 0) { opts = {}; }
        if (timeout === void 0) { timeout = 9000; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.race([
                            fetch(url, __assign(__assign({}, opts), { headers: __assign({ "User-Agent": DEFAULT_UA, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.5" }, (opts.headers || {})) })),
                            new Promise(function (_, reject) { return setTimeout(function () { return reject(new Error("timeout")); }, timeout); })
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
function fetchHtml(url_1, referer_1) {
    return __awaiter(this, arguments, void 0, function (url, referer, timeout) {
        var res;
        var _a;
        if (timeout === void 0) { timeout = 9000; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetchWithTimeout(url, { headers: { Referer: referer || DEFAULT_REFERER } }, timeout)];
                case 1:
                    res = _b.sent();
                    if (!res || !res.ok)
                        return [2 /*return*/, { url: url, html: "" }];
                    _a = { url: res.url || url };
                    return [4 /*yield*/, res.text()];
                case 2: return [2 /*return*/, (_a.html = _b.sent(), _a)];
            }
        });
    });
}
function fetchHtmlWithHeaders(url_1) {
    return __awaiter(this, arguments, void 0, function (url, headers, timeout) {
        var res;
        var _a;
        if (headers === void 0) { headers = {}; }
        if (timeout === void 0) { timeout = 9000; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetchWithTimeout(url, { headers: headers }, timeout)];
                case 1:
                    res = _b.sent();
                    if (!res || !res.ok)
                        return [2 /*return*/, { url: url, html: "" }];
                    _a = { url: res.url || url };
                    return [4 /*yield*/, res.text()];
                case 2: return [2 /*return*/, (_a.html = _b.sent(), _a)];
            }
        });
    });
}
function directLinkRank(url) {
    if (/r2\.cloudflarestorage\.com|\.r2\.dev|workers\.dev/i.test(url))
        return 0;
    if (/pixeldrain\.com\/api\/file\//i.test(url))
        return 1;
    if (/store\d*\.gofile\.io|gofile\.io\/download/i.test(url))
        return 2;
    if (/gofile\.io\/d\//i.test(url))
        return 3;
    if (/video-downloads\.googleusercontent\.com/i.test(url))
        return 4;
    if (/hubcloud\.cloudflarefb\.workers\.dev/i.test(url))
        return 5;
    if (/vcloud\.zip\//i.test(url))
        return 6;
    if (/gpdl\d*\./i.test(url))
        return 7;
    if (/(?:gamerxyt\.com|sportverse\.cc)\/hubcloud\.php/i.test(url))
        return 8;
    if (/(?:gamerxyt\.com|sportverse\.cc|hubcloud\.[^/]+)\/hubcloud\.php/i.test(url))
        return 9;
    if (/hubcloud\.[^/]+\/(?:video|drive)\//i.test(url))
        return 10;
    return 10;
}
function sha256(input) {
    if (crypto && crypto.createHash)
        return crypto.createHash("sha256").update(input, "utf8").digest("hex");
    return "";
}
function generateGofileWebsiteToken(accountToken) {
    if (accountToken === void 0) { accountToken = ""; }
    var timeSlot = Math.floor(Date.now() / 1000 / 14400);
    return sha256("".concat(DEFAULT_UA, "::").concat(GOFILE_BROWSER_LANGUAGE, "::").concat(accountToken, "::").concat(timeSlot, "::").concat(GOFILE_SECRET));
}
function extractGofileId(url) {
    var match = String(url || "").match(/(?:\?c=|\/d\/)([\da-zA-Z-]+)/);
    return match ? match[1] : null;
}
function formatBytes(bytes) {
    var value = Number(bytes || 0);
    if (!value)
        return "";
    if (value < 1024 * 1024 * 1024)
        return (value / (1024 * 1024)).toFixed(2) + " MB";
    return (value / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}
function resolveGofile(gofileUrl_1) {
    return __awaiter(this, arguments, void 0, function (gofileUrl, options) {
        var id, accountRes, accountJson, token, contentRes, contentJson, children, results, _a, _b, file, _c;
        var e_4, _d;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    id = extractGofileId(gofileUrl);
                    if (!id)
                        return [2 /*return*/, []];
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetchWithTimeout("".concat(GOFILE_API, "/accounts"), {
                            method: "POST",
                            headers: {
                                "X-Website-Token": generateGofileWebsiteToken(""),
                                "X-BL": GOFILE_BROWSER_LANGUAGE,
                            }
                        }, options.timeout || 12000)];
                case 2:
                    accountRes = _e.sent();
                    if (!accountRes || !accountRes.ok)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, accountRes.json()];
                case 3:
                    accountJson = _e.sent();
                    token = accountJson && accountJson.data && accountJson.data.token;
                    if (!token)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, fetchWithTimeout("".concat(GOFILE_API, "/contents/").concat(id, "?cache=true&sortField=createTime&sortDirection=1"), {
                            headers: {
                                "Referer": "https://gofile.io/",
                                "Authorization": "Bearer ".concat(token),
                                "X-BL": GOFILE_BROWSER_LANGUAGE,
                                "X-Website-Token": generateGofileWebsiteToken(token),
                            }
                        }, options.timeout || 12000)];
                case 4:
                    contentRes = _e.sent();
                    if (!contentRes || !contentRes.ok)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, contentRes.json()];
                case 5:
                    contentJson = _e.sent();
                    children = contentJson && contentJson.data && contentJson.data.children;
                    if (!children || typeof children !== "object")
                        return [2 /*return*/, []];
                    results = [];
                    try {
                        for (_a = __values(Object.values(children)), _b = _a.next(); !_b.done; _b = _a.next()) {
                            file = _b.value;
                            if (!file || file.type !== "file" || !file.link)
                                continue;
                            pushUniqueCandidate(results, {
                                url: file.link,
                                title: [file.name, formatBytes(file.size)].filter(Boolean).join(" "),
                                headers: { Cookie: "accountToken=".concat(token) },
                            });
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                    return [2 /*return*/, results];
                case 6:
                    _c = _e.sent();
                    return [2 /*return*/, []];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function fetchHtmlWithFlareSolverr(url_1) {
    return __awaiter(this, arguments, void 0, function (url, options) {
        var solverUrl, timeout, res, data, _a;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    solverUrl = process.env.FLARESOLVERR_URL || "http://127.0.0.1:8191/v1";
                    timeout = options.timeout || 45000;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetchWithTimeout(solverUrl, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ cmd: "request.get", url: url, maxTimeout: timeout })
                        }, timeout + 5000)];
                case 2:
                    res = _b.sent();
                    if (!res || !res.ok)
                        return [2 /*return*/, { url: url, html: "" }];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _b.sent();
                    if (data.status !== "ok" || !data.solution)
                        return [2 /*return*/, { url: url, html: "" }];
                    return [2 /*return*/, { url: data.solution.url || url, html: data.solution.response || "", cookies: data.solution.cookies || [] }];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, { url: url, html: "" }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function absoluteUrl(url, baseUrl) {
    try {
        return new URL(url, baseUrl).href;
    }
    catch (_a) {
        return null;
    }
}
function gdflixWfileUrlFromFileUrl(url) {
    try {
        var parsed = new URL(url);
        var id = parsed.pathname.split("/").filter(Boolean).pop();
        if (!id)
            return null;
        return "".concat(parsed.origin, "/wfile/").concat(id);
    }
    catch (_a) {
        return null;
    }
}
function validateReadyPlaybackUrl(url_1) {
    return __awaiter(this, arguments, void 0, function (url, headers, timeout) {
        var res, contentType, _a, _b;
        if (headers === void 0) { headers = {}; }
        if (timeout === void 0) { timeout = 7000; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!url || !isReadyForPlayback(url))
                        return [2 /*return*/, false];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, fetchWithTimeout(url, {
                            headers: __assign(__assign({}, headers), { Range: "bytes=0-511" })
                        }, timeout)];
                case 2:
                    res = _c.sent();
                    if (!res)
                        return [2 /*return*/, false];
                    contentType = res.headers && res.headers.get ? String(res.headers.get("content-type") || "") : "";
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 6, , 7]);
                    if (!(res.body && res.body.cancel)) return [3 /*break*/, 5];
                    return [4 /*yield*/, res.body.cancel()];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    _a = _c.sent();
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, res.status === 206 || (res.ok && /video|octet-stream|matroska/i.test(contentType))];
                case 8:
                    _b = _c.sent();
                    return [2 /*return*/, false];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function pushValidatedReadyCandidate(list_1, url_1, headers_1, title_1) {
    return __awaiter(this, arguments, void 0, function (list, url, headers, title, options) {
        var normalized, ok;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!url)
                        return [2 /*return*/];
                    normalized = normalizeDownloadUrl(url, DEFAULT_REFERER);
                    if (!normalized || !isReadyForPlayback(normalized))
                        return [2 /*return*/];
                    return [4 /*yield*/, validateReadyPlaybackUrl(normalized, headers || {}, options.validationTimeout || 7000)];
                case 1:
                    ok = _a.sent();
                    if (ok)
                        pushUniqueCandidate(list, { url: normalized, headers: headers, title: title });
                    return [2 /*return*/];
            }
        });
    });
}
function resolveBusycdn(busycdnUrl_1, referer_1) {
    return __awaiter(this, arguments, void 0, function (busycdnUrl, referer, options) {
        var page, finalUrl, match, parsed, wrapped, normalized, _a;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetchHtmlWithHeaders(busycdnUrl, mobileHeaders(referer), options.timeout || 12000)];
                case 1:
                    page = _b.sent();
                    finalUrl = normalizeDownloadUrl(page.url, busycdnUrl);
                    if (finalUrl && isReadyForPlayback(finalUrl)) {
                        return [2 /*return*/, { url: finalUrl, headers: mobileHeaders(page.url || busycdnUrl), title: "Instant" }];
                    }
                    match = String(page.html || "").match(/new URLSearchParams\(window\.location\.search\).*?get\(["']url["']\)/i);
                    if (match) {
                        parsed = new URL(page.url || busycdnUrl);
                        wrapped = parsed.searchParams.get("url");
                        if (wrapped) {
                            normalized = normalizeDownloadUrl(wrapped, page.url || busycdnUrl);
                            if (normalized && isReadyForPlayback(normalized))
                                return [2 /*return*/, { url: normalized, headers: mobileHeaders(page.url || busycdnUrl), title: "Instant" }];
                        }
                    }
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/, null];
            }
        });
    });
}
function resolveGdflix(gdflixUrl_1) {
    return __awaiter(this, arguments, void 0, function (gdflixUrl, options) {
        var ready, filePage, headers, pageLinks, pageLinks_1, pageLinks_1_1, link, resolvedBusycdn, e_5_1, wfileLinks, _a, _b, match, wfile, guessedWfile, _c, _d, wfileUrl, wfilePage, _e, _f, link, candidateHeaders, e_6_1, e_7_1;
        var e_5, _g, e_8, _h, e_7, _j, e_6, _k;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    ready = [];
                    return [4 /*yield*/, fetchHtmlWithFlareSolverr(gdflixUrl, { timeout: options.timeout || 45000 })];
                case 1:
                    filePage = _l.sent();
                    if (!filePage.html)
                        return [2 /*return*/, ready];
                    headers = mobileHeaders(filePage.url || gdflixUrl);
                    pageLinks = extractDownloadLinks(filePage.html, filePage.url || gdflixUrl);
                    _l.label = 2;
                case 2:
                    _l.trys.push([2, 8, 9, 10]);
                    pageLinks_1 = __values(pageLinks), pageLinks_1_1 = pageLinks_1.next();
                    _l.label = 3;
                case 3:
                    if (!!pageLinks_1_1.done) return [3 /*break*/, 7];
                    link = pageLinks_1_1.value;
                    if (!/instant\.busycdn\.xyz/i.test(link)) return [3 /*break*/, 6];
                    return [4 /*yield*/, resolveBusycdn(link, filePage.url || gdflixUrl, options)];
                case 4:
                    resolvedBusycdn = _l.sent();
                    if (!resolvedBusycdn) return [3 /*break*/, 6];
                    return [4 /*yield*/, pushValidatedReadyCandidate(ready, resolvedBusycdn.url, resolvedBusycdn.headers || headers, resolvedBusycdn.title || "Instant", options)];
                case 5:
                    _l.sent();
                    _l.label = 6;
                case 6:
                    pageLinks_1_1 = pageLinks_1.next();
                    return [3 /*break*/, 3];
                case 7: return [3 /*break*/, 10];
                case 8:
                    e_5_1 = _l.sent();
                    e_5 = { error: e_5_1 };
                    return [3 /*break*/, 10];
                case 9:
                    try {
                        if (pageLinks_1_1 && !pageLinks_1_1.done && (_g = pageLinks_1.return)) _g.call(pageLinks_1);
                    }
                    finally { if (e_5) throw e_5.error; }
                    return [7 /*endfinally*/];
                case 10:
                    wfileLinks = [];
                    try {
                        for (_a = __values(String(filePage.html).matchAll(/href=["']([^"']*\/wfile\/[^"']+)["']/gi)), _b = _a.next(); !_b.done; _b = _a.next()) {
                            match = _b.value;
                            wfile = absoluteUrl(match[1], filePage.url || gdflixUrl);
                            if (wfile && !wfileLinks.includes(wfile))
                                wfileLinks.push(wfile);
                        }
                    }
                    catch (e_8_1) { e_8 = { error: e_8_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_h = _a.return)) _h.call(_a);
                        }
                        finally { if (e_8) throw e_8.error; }
                    }
                    guessedWfile = gdflixWfileUrlFromFileUrl(filePage.url || gdflixUrl);
                    if (guessedWfile && !wfileLinks.includes(guessedWfile))
                        wfileLinks.push(guessedWfile);
                    _l.label = 11;
                case 11:
                    _l.trys.push([11, 23, 24, 25]);
                    _c = __values(wfileLinks.slice(0, 2)), _d = _c.next();
                    _l.label = 12;
                case 12:
                    if (!!_d.done) return [3 /*break*/, 22];
                    wfileUrl = _d.value;
                    return [4 /*yield*/, fetchHtmlWithFlareSolverr(wfileUrl, { timeout: options.timeout || 45000 })];
                case 13:
                    wfilePage = _l.sent();
                    if (!wfilePage.html)
                        return [3 /*break*/, 21];
                    _l.label = 14;
                case 14:
                    _l.trys.push([14, 19, 20, 21]);
                    _e = (e_6 = void 0, __values(extractDownloadLinks(wfilePage.html, wfilePage.url || wfileUrl))), _f = _e.next();
                    _l.label = 15;
                case 15:
                    if (!!_f.done) return [3 /*break*/, 18];
                    link = _f.value;
                    if (!/workers\.dev|\.r2\.dev|r2\.cloudflarestorage\.com/i.test(link)) return [3 /*break*/, 17];
                    candidateHeaders = mobileHeaders(wfilePage.url || wfileUrl);
                    return [4 /*yield*/, pushValidatedReadyCandidate(ready, appendSyncParam(link), candidateHeaders, "GDIndex", options)];
                case 16:
                    _l.sent();
                    _l.label = 17;
                case 17:
                    _f = _e.next();
                    return [3 /*break*/, 15];
                case 18: return [3 /*break*/, 21];
                case 19:
                    e_6_1 = _l.sent();
                    e_6 = { error: e_6_1 };
                    return [3 /*break*/, 21];
                case 20:
                    try {
                        if (_f && !_f.done && (_k = _e.return)) _k.call(_e);
                    }
                    finally { if (e_6) throw e_6.error; }
                    return [7 /*endfinally*/];
                case 21:
                    _d = _c.next();
                    return [3 /*break*/, 12];
                case 22: return [3 /*break*/, 25];
                case 23:
                    e_7_1 = _l.sent();
                    e_7 = { error: e_7_1 };
                    return [3 /*break*/, 25];
                case 24:
                    try {
                        if (_d && !_d.done && (_j = _c.return)) _j.call(_c);
                    }
                    finally { if (e_7) throw e_7.error; }
                    return [7 /*endfinally*/];
                case 25: return [2 /*return*/, ready.sort(function (a, b) { return directLinkRank(getCandidateUrl(a)) - directLinkRank(getCandidateUrl(b)); })];
            }
        });
    });
}
function resolveFinalRedirect(startUrl_1) {
    return __awaiter(this, arguments, void 0, function (startUrl, maxHops) {
        var cur, i, res, loc, target, e_9;
        if (maxHops === void 0) { maxHops = 5; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cur = startUrl;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < maxHops)) return [3 /*break*/, 6];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fetch(cur, {
                            headers: { "User-Agent": DEFAULT_UA },
                            redirect: "manual"
                        })];
                case 3:
                    res = _a.sent();
                    loc = res.headers.get("location");
                    if (!loc)
                        return [3 /*break*/, 6];
                    cur = new URL(loc, cur).href;
                    if (cur.includes("link=")) {
                        target = decodeURIComponent(cur.split("link=")[1]);
                        if (target.startsWith("http"))
                            return [2 /*return*/, target];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    e_9 = _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, cur];
            }
        });
    });
}
function resolveBuzzServer(buzzUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var res, hx, base, e_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("".concat(buzzUrl, "/download"), {
                            headers: { "User-Agent": DEFAULT_UA, "Referer": buzzUrl },
                            redirect: "manual"
                        })];
                case 1:
                    res = _a.sent();
                    hx = res.headers.get("hx-redirect") || res.headers.get("location");
                    if (hx) {
                        base = new URL(buzzUrl).origin;
                        return [2 /*return*/, hx.startsWith("http") ? hx : "".concat(base).concat(hx)];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    e_10 = _a.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/, null];
            }
        });
    });
}
function resolveGeneratedHubcloud(generateUrl, referer) {
    return __awaiter(this, void 0, void 0, function () {
        var links, page, pageLinks, pageLinks_2, pageLinks_2_1, link, pxlMatch, pdId, _a, _b, link, part, redirected, e_11_1, _c, _d, link, buzzDirect, e_12_1, _e;
        var e_13, _f, e_11, _g, e_12, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    links = [];
                    _j.label = 1;
                case 1:
                    _j.trys.push([1, 19, , 20]);
                    return [4 /*yield*/, fetchHtml(generateUrl, referer, 12000)];
                case 2:
                    page = _j.sent();
                    pushUniqueUrl(links, normalizeDownloadUrl(page.url, generateUrl));
                    pageLinks = extractDownloadLinks(page.html, page.url);
                    try {
                        for (pageLinks_2 = __values(pageLinks), pageLinks_2_1 = pageLinks_2.next(); !pageLinks_2_1.done; pageLinks_2_1 = pageLinks_2.next()) {
                            link = pageLinks_2_1.value;
                            pushUniqueUrl(links, link);
                        }
                    }
                    catch (e_13_1) { e_13 = { error: e_13_1 }; }
                    finally {
                        try {
                            if (pageLinks_2_1 && !pageLinks_2_1.done && (_f = pageLinks_2.return)) _f.call(pageLinks_2);
                        }
                        finally { if (e_13) throw e_13.error; }
                    }
                    pxlMatch = page.html.match(/var\s+pxl\s*=\s*["']([^"']+)["']/);
                    if (pxlMatch && pxlMatch[1]) {
                        pdId = pxlMatch[1].trim().split("/").pop();
                        if (pdId && pdId.length >= 4) {
                            pushUniqueUrl(links, "https://pixeldrain.com/api/file/".concat(pdId, "?download"));
                        }
                    }
                    _j.label = 3;
                case 3:
                    _j.trys.push([3, 9, 10, 11]);
                    _a = __values(pageLinks.filter(function (url) { return /gpdl\d*\.|pixel\.hubcloud/i.test(url); }).slice(0, 3)), _b = _a.next();
                    _j.label = 4;
                case 4:
                    if (!!_b.done) return [3 /*break*/, 8];
                    link = _b.value;
                    if (!link.includes("link=")) return [3 /*break*/, 5];
                    part = decodeURIComponent(link.split("link=")[1]);
                    if (part.startsWith("http"))
                        pushUniqueUrl(links, part);
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, resolveFinalRedirect(link)];
                case 6:
                    redirected = _j.sent();
                    if (redirected && redirected !== link)
                        pushUniqueUrl(links, redirected);
                    _j.label = 7;
                case 7:
                    _b = _a.next();
                    return [3 /*break*/, 4];
                case 8: return [3 /*break*/, 11];
                case 9:
                    e_11_1 = _j.sent();
                    e_11 = { error: e_11_1 };
                    return [3 /*break*/, 11];
                case 10:
                    try {
                        if (_b && !_b.done && (_g = _a.return)) _g.call(_a);
                    }
                    finally { if (e_11) throw e_11.error; }
                    return [7 /*endfinally*/];
                case 11:
                    _j.trys.push([11, 16, 17, 18]);
                    _c = __values(pageLinks.filter(function (url) { return /bzzhr\.co|buzz/i.test(url); }).slice(0, 2)), _d = _c.next();
                    _j.label = 12;
                case 12:
                    if (!!_d.done) return [3 /*break*/, 15];
                    link = _d.value;
                    return [4 /*yield*/, resolveBuzzServer(link)];
                case 13:
                    buzzDirect = _j.sent();
                    if (buzzDirect)
                        pushUniqueUrl(links, buzzDirect);
                    _j.label = 14;
                case 14:
                    _d = _c.next();
                    return [3 /*break*/, 12];
                case 15: return [3 /*break*/, 18];
                case 16:
                    e_12_1 = _j.sent();
                    e_12 = { error: e_12_1 };
                    return [3 /*break*/, 18];
                case 17:
                    try {
                        if (_d && !_d.done && (_h = _c.return)) _h.call(_c);
                    }
                    finally { if (e_12) throw e_12.error; }
                    return [7 /*endfinally*/];
                case 18: return [3 /*break*/, 20];
                case 19:
                    _e = _j.sent();
                    return [3 /*break*/, 20];
                case 20: return [2 /*return*/, links.sort(function (a, b) { return directLinkRank(a) - directLinkRank(b); })];
            }
        });
    });
}
function extractBridgeUrl(html, pageUrl) {
    return extractDoubleAtobUrl(html, pageUrl) || extractScriptUrl(html, pageUrl) || null;
}
function extractButtonLinks(html, pageUrl) {
    var e_14, _a;
    var text = String(html || "");
    var links = [];
    var anchorMatches = text.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
    try {
        for (var anchorMatches_1 = __values(anchorMatches), anchorMatches_1_1 = anchorMatches_1.next(); !anchorMatches_1_1.done; anchorMatches_1_1 = anchorMatches_1.next()) {
            var match = anchorMatches_1_1.value;
            var href = normalizeDownloadUrl(match[1], pageUrl);
            var label = String(match[2] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            if (!href || href === "#" || /telegram|gdflix|dropgalaxy|\.zip/i.test(href + " " + label))
                continue;
            links.push({ url: href, label: label });
        }
    }
    catch (e_14_1) { e_14 = { error: e_14_1 }; }
    finally {
        try {
            if (anchorMatches_1_1 && !anchorMatches_1_1.done && (_a = anchorMatches_1.return)) _a.call(anchorMatches_1);
        }
        finally { if (e_14) throw e_14.error; }
    }
    return links;
}
function resolveBridgePage(bridgeUrl_1, referer_1) {
    return __awaiter(this, arguments, void 0, function (bridgeUrl, referer, options) {
        var ready, page, headers, scriptUrl, _a, _b, _c, url, label, finalUrl, fslMatch, _d, _e, link;
        var e_15, _f, e_16, _g;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    ready = [];
                    return [4 /*yield*/, fetchHtmlWithHeaders(bridgeUrl, mobileHeaders(referer), options.timeout || 12000)];
                case 1:
                    page = _h.sent();
                    if (!page.html)
                        return [2 /*return*/, ready];
                    headers = mobileHeaders(bridgeUrl);
                    scriptUrl = extractScriptUrl(page.html, page.url);
                    if (scriptUrl && /workers\.dev/i.test(scriptUrl)) {
                        pushReadyCandidate(ready, appendSyncParam(scriptUrl), headers, "Worker");
                    }
                    try {
                        for (_a = __values(extractButtonLinks(page.html, page.url)), _b = _a.next(); !_b.done; _b = _a.next()) {
                            _c = _b.value, url = _c.url, label = _c.label;
                            if (/fslv?2?|worker/i.test(label) || /r2\.cloudflarestorage\.com|\.r2\.dev|workers\.dev/i.test(url)) {
                                finalUrl = /\.r2\.dev|workers\.dev/i.test(url) ? appendSyncParam(url) : url;
                                pushReadyCandidate(ready, finalUrl, headers, label);
                            }
                        }
                    }
                    catch (e_15_1) { e_15 = { error: e_15_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_f = _a.return)) _f.call(_a);
                        }
                        finally { if (e_15) throw e_15.error; }
                    }
                    fslMatch = page.html.match(/id=["']fsl["'][^>]*href=["']([^"']+)["']/i) || page.html.match(/href=["']([^"']+)["'][^>]*id=["']fsl["']/i);
                    if (fslMatch)
                        pushReadyCandidate(ready, appendSyncParam(normalizeDownloadUrl(fslMatch[1], page.url)), headers, "FSL");
                    try {
                        for (_d = __values(extractDownloadLinks(page.html, page.url)), _e = _d.next(); !_e.done; _e = _d.next()) {
                            link = _e.value;
                            pushReadyCandidate(ready, link, headers, "Direct");
                        }
                    }
                    catch (e_16_1) { e_16 = { error: e_16_1 }; }
                    finally {
                        try {
                            if (_e && !_e.done && (_g = _d.return)) _g.call(_d);
                        }
                        finally { if (e_16) throw e_16.error; }
                    }
                    return [2 /*return*/, ready];
            }
        });
    });
}
function resolveHubVcloudReady(url_1) {
    return __awaiter(this, arguments, void 0, function (url, options) {
        var ready, referer, page, headers, bridgeUrl, absoluteBridge, _a, _b, candidate, e_17_1, downloadHref, absoluteDownload, _c, _d, candidate, e_18_1, _e, _f, _g, buttonUrl, label, finalUrl;
        var e_17, _h, e_18, _j, e_19, _k;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    ready = [];
                    referer = options.referer || DEFAULT_REFERER;
                    return [4 /*yield*/, fetchHtmlWithHeaders(url, mobileHeaders(referer), options.timeout || 12000)];
                case 1:
                    page = _l.sent();
                    if (!page.html)
                        return [2 /*return*/, ready];
                    headers = mobileHeaders(url);
                    bridgeUrl = extractBridgeUrl(page.html, page.url);
                    if (!bridgeUrl) return [3 /*break*/, 10];
                    if (!/workers\.dev/i.test(bridgeUrl)) return [3 /*break*/, 2];
                    pushReadyCandidate(ready, appendSyncParam(bridgeUrl), headers, "Worker");
                    return [3 /*break*/, 10];
                case 2:
                    absoluteBridge = normalizeDownloadUrl(bridgeUrl, page.url);
                    _l.label = 3;
                case 3:
                    _l.trys.push([3, 8, 9, 10]);
                    return [4 /*yield*/, resolveBridgePage(absoluteBridge, url, options)];
                case 4:
                    _a = __values.apply(void 0, [_l.sent()]), _b = _a.next();
                    _l.label = 5;
                case 5:
                    if (!!_b.done) return [3 /*break*/, 7];
                    candidate = _b.value;
                    pushUniqueCandidate(ready, candidate);
                    _l.label = 6;
                case 6:
                    _b = _a.next();
                    return [3 /*break*/, 5];
                case 7: return [3 /*break*/, 10];
                case 8:
                    e_17_1 = _l.sent();
                    e_17 = { error: e_17_1 };
                    return [3 /*break*/, 10];
                case 9:
                    try {
                        if (_b && !_b.done && (_h = _a.return)) _h.call(_a);
                    }
                    finally { if (e_17) throw e_17.error; }
                    return [7 /*endfinally*/];
                case 10:
                    downloadHref = (page.html.match(/id=["']download["'][^>]*href=["']([^"']+)["']/i) || page.html.match(/href=["']([^"']+)["'][^>]*id=["']download["']/i) || [])[1];
                    if (!downloadHref) return [3 /*break*/, 18];
                    absoluteDownload = normalizeDownloadUrl(downloadHref, page.url);
                    if (!/(?:gamerxyt\.com|sportverse\.cc|hubcloud\.[^/]+)\/hubcloud\.php|token|dl/i.test(absoluteDownload || "")) return [3 /*break*/, 18];
                    _l.label = 11;
                case 11:
                    _l.trys.push([11, 16, 17, 18]);
                    return [4 /*yield*/, resolveBridgePage(absoluteDownload, url, options)];
                case 12:
                    _c = __values.apply(void 0, [_l.sent()]), _d = _c.next();
                    _l.label = 13;
                case 13:
                    if (!!_d.done) return [3 /*break*/, 15];
                    candidate = _d.value;
                    pushUniqueCandidate(ready, candidate);
                    _l.label = 14;
                case 14:
                    _d = _c.next();
                    return [3 /*break*/, 13];
                case 15: return [3 /*break*/, 18];
                case 16:
                    e_18_1 = _l.sent();
                    e_18 = { error: e_18_1 };
                    return [3 /*break*/, 18];
                case 17:
                    try {
                        if (_d && !_d.done && (_j = _c.return)) _j.call(_c);
                    }
                    finally { if (e_18) throw e_18.error; }
                    return [7 /*endfinally*/];
                case 18:
                    try {
                        for (_e = __values(extractButtonLinks(page.html, page.url)), _f = _e.next(); !_f.done; _f = _e.next()) {
                            _g = _f.value, buttonUrl = _g.url, label = _g.label;
                            if (/fslv?2?|worker/i.test(label) || /r2\.cloudflarestorage\.com|\.r2\.dev|workers\.dev/i.test(buttonUrl)) {
                                finalUrl = /\.r2\.dev|workers\.dev/i.test(buttonUrl) ? appendSyncParam(buttonUrl) : buttonUrl;
                                pushReadyCandidate(ready, finalUrl, headers, label);
                            }
                        }
                    }
                    catch (e_19_1) { e_19 = { error: e_19_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_k = _e.return)) _k.call(_e);
                        }
                        finally { if (e_19) throw e_19.error; }
                    }
                    return [2 /*return*/, ready];
            }
        });
    });
}
function resolvePlayableCandidates(candidate_1) {
    return __awaiter(this, arguments, void 0, function (candidate, options, seen, depth) {
        var rawUrl, url, referer, next, readyLinks, _a, _b, item, e_20_1, readyLinks, links, links_1, links_1_1, item, _c, _d, link, e_21_1, page, _e, _f, link, readyLinks, _g, _h, link, e_22_1, page, _j, _k, link, ready, next_1, next_1_1, item, _l, _m, resolved, e_23_1, e_24_1;
        var e_20, _o, e_25, _p, e_21, _q, e_26, _r, e_22, _s, e_27, _t, e_24, _u, e_23, _v;
        if (options === void 0) { options = {}; }
        if (seen === void 0) { seen = new Set(); }
        if (depth === void 0) { depth = 0; }
        return __generator(this, function (_w) {
            switch (_w.label) {
                case 0:
                    rawUrl = getCandidateUrl(candidate);
                    url = normalizeDownloadUrl(rawUrl, options.referer || DEFAULT_REFERER);
                    if (!url || depth > (options.maxDepth || 5))
                        return [2 /*return*/, []];
                    if (isReadyForPlayback(url)) {
                        if (typeof candidate === "string")
                            return [2 /*return*/, [url]];
                        return [2 /*return*/, [__assign(__assign({}, candidate), { url: url })]];
                    }
                    if (seen.has(url))
                        return [2 /*return*/, []];
                    seen.add(url);
                    referer = options.referer || DEFAULT_REFERER;
                    next = [];
                    if (!/gdflix\.(?:dev|io)\/file\/|new\d*\.gdflix\.io\/(?:file|wfile)\//i.test(url)) return [3 /*break*/, 2];
                    return [4 /*yield*/, resolveGdflix(url, options)];
                case 1:
                    readyLinks = _w.sent();
                    if (readyLinks.length)
                        return [2 /*return*/, readyLinks];
                    return [3 /*break*/, 37];
                case 2:
                    if (!/gofile\.io\/d\//i.test(url)) return [3 /*break*/, 11];
                    _w.label = 3;
                case 3:
                    _w.trys.push([3, 8, 9, 10]);
                    return [4 /*yield*/, resolveGofile(url, options)];
                case 4:
                    _a = __values.apply(void 0, [_w.sent()]), _b = _a.next();
                    _w.label = 5;
                case 5:
                    if (!!_b.done) return [3 /*break*/, 7];
                    item = _b.value;
                    pushUniqueCandidate(next, item);
                    _w.label = 6;
                case 6:
                    _b = _a.next();
                    return [3 /*break*/, 5];
                case 7: return [3 /*break*/, 10];
                case 8:
                    e_20_1 = _w.sent();
                    e_20 = { error: e_20_1 };
                    return [3 /*break*/, 10];
                case 9:
                    try {
                        if (_b && !_b.done && (_o = _a.return)) _o.call(_a);
                    }
                    finally { if (e_20) throw e_20.error; }
                    return [7 /*endfinally*/];
                case 10: return [3 /*break*/, 37];
                case 11:
                    if (!/hubcloud\.[^/]+\/(?:video|drive)\//i.test(url)) return [3 /*break*/, 14];
                    return [4 /*yield*/, resolveHubVcloudReady(url, options)];
                case 12:
                    readyLinks = _w.sent();
                    if (readyLinks.length)
                        return [2 /*return*/, readyLinks.sort(function (a, b) { return directLinkRank(getCandidateUrl(a)) - directLinkRank(getCandidateUrl(b)); })];
                    return [4 /*yield*/, resolveHubcloud(url, __assign(__assign({}, options), { includeOriginal: false, readyOnly: false }))];
                case 13:
                    links = _w.sent();
                    try {
                        for (links_1 = __values(links), links_1_1 = links_1.next(); !links_1_1.done; links_1_1 = links_1.next()) {
                            item = links_1_1.value;
                            pushUniqueCandidate(next, item);
                        }
                    }
                    catch (e_25_1) { e_25 = { error: e_25_1 }; }
                    finally {
                        try {
                            if (links_1_1 && !links_1_1.done && (_p = links_1.return)) _p.call(links_1);
                        }
                        finally { if (e_25) throw e_25.error; }
                    }
                    return [3 /*break*/, 37];
                case 14:
                    if (!/(?:gamerxyt\.com|sportverse\.cc|hubcloud\.[^/]+)\/hubcloud\.php/i.test(url)) return [3 /*break*/, 23];
                    _w.label = 15;
                case 15:
                    _w.trys.push([15, 20, 21, 22]);
                    return [4 /*yield*/, resolveGeneratedHubcloud(url, referer)];
                case 16:
                    _c = __values.apply(void 0, [_w.sent()]), _d = _c.next();
                    _w.label = 17;
                case 17:
                    if (!!_d.done) return [3 /*break*/, 19];
                    link = _d.value;
                    pushUniqueCandidate(next, link);
                    _w.label = 18;
                case 18:
                    _d = _c.next();
                    return [3 /*break*/, 17];
                case 19: return [3 /*break*/, 22];
                case 20:
                    e_21_1 = _w.sent();
                    e_21 = { error: e_21_1 };
                    return [3 /*break*/, 22];
                case 21:
                    try {
                        if (_d && !_d.done && (_q = _c.return)) _q.call(_c);
                    }
                    finally { if (e_21) throw e_21.error; }
                    return [7 /*endfinally*/];
                case 22: return [3 /*break*/, 37];
                case 23:
                    if (!/gpdl\d*\./i.test(url)) return [3 /*break*/, 25];
                    return [4 /*yield*/, fetchHtmlWithHeaders(url, mobileHeaders(referer), options.timeout || 12000)];
                case 24:
                    page = _w.sent();
                    pushUniqueUrl(next, normalizeDownloadUrl(page.url, url));
                    try {
                        for (_e = __values(extractDownloadLinks(page.html, page.url)), _f = _e.next(); !_f.done; _f = _e.next()) {
                            link = _f.value;
                            pushUniqueUrl(next, link);
                        }
                    }
                    catch (e_26_1) { e_26 = { error: e_26_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_r = _e.return)) _r.call(_e);
                        }
                        finally { if (e_26) throw e_26.error; }
                    }
                    return [3 /*break*/, 37];
                case 25:
                    if (!/vcloud\.zip\//i.test(url)) return [3 /*break*/, 35];
                    return [4 /*yield*/, resolveHubVcloudReady(url, options)];
                case 26:
                    readyLinks = _w.sent();
                    if (readyLinks.length)
                        return [2 /*return*/, readyLinks.sort(function (a, b) { return directLinkRank(getCandidateUrl(a)) - directLinkRank(getCandidateUrl(b)); })];
                    _w.label = 27;
                case 27:
                    _w.trys.push([27, 32, 33, 34]);
                    return [4 /*yield*/, resolveVcloud(url, __assign(__assign({}, options), { readyOnly: false }))];
                case 28:
                    _g = __values.apply(void 0, [_w.sent()]), _h = _g.next();
                    _w.label = 29;
                case 29:
                    if (!!_h.done) return [3 /*break*/, 31];
                    link = _h.value;
                    pushUniqueCandidate(next, link);
                    _w.label = 30;
                case 30:
                    _h = _g.next();
                    return [3 /*break*/, 29];
                case 31: return [3 /*break*/, 34];
                case 32:
                    e_22_1 = _w.sent();
                    e_22 = { error: e_22_1 };
                    return [3 /*break*/, 34];
                case 33:
                    try {
                        if (_h && !_h.done && (_s = _g.return)) _s.call(_g);
                    }
                    finally { if (e_22) throw e_22.error; }
                    return [7 /*endfinally*/];
                case 34: return [3 /*break*/, 37];
                case 35: return [4 /*yield*/, fetchHtml(url, referer, options.timeout || 9000)];
                case 36:
                    page = _w.sent();
                    pushUniqueUrl(next, normalizeDownloadUrl(page.url, url));
                    try {
                        for (_j = __values(extractDownloadLinks(page.html, page.url)), _k = _j.next(); !_k.done; _k = _j.next()) {
                            link = _k.value;
                            pushUniqueUrl(next, link);
                        }
                    }
                    catch (e_27_1) { e_27 = { error: e_27_1 }; }
                    finally {
                        try {
                            if (_k && !_k.done && (_t = _j.return)) _t.call(_j);
                        }
                        finally { if (e_27) throw e_27.error; }
                    }
                    _w.label = 37;
                case 37:
                    ready = [];
                    _w.label = 38;
                case 38:
                    _w.trys.push([38, 49, 50, 51]);
                    next_1 = __values(next), next_1_1 = next_1.next();
                    _w.label = 39;
                case 39:
                    if (!!next_1_1.done) return [3 /*break*/, 48];
                    item = next_1_1.value;
                    _w.label = 40;
                case 40:
                    _w.trys.push([40, 45, 46, 47]);
                    e_23 = void 0;
                    return [4 /*yield*/, resolvePlayableCandidates(item, options, seen, depth + 1)];
                case 41:
                    _l = (__values.apply(void 0, [_w.sent()])), _m = _l.next();
                    _w.label = 42;
                case 42:
                    if (!!_m.done) return [3 /*break*/, 44];
                    resolved = _m.value;
                    pushUniqueCandidate(ready, resolved);
                    _w.label = 43;
                case 43:
                    _m = _l.next();
                    return [3 /*break*/, 42];
                case 44: return [3 /*break*/, 47];
                case 45:
                    e_23_1 = _w.sent();
                    e_23 = { error: e_23_1 };
                    return [3 /*break*/, 47];
                case 46:
                    try {
                        if (_m && !_m.done && (_v = _l.return)) _v.call(_l);
                    }
                    finally { if (e_23) throw e_23.error; }
                    return [7 /*endfinally*/];
                case 47:
                    next_1_1 = next_1.next();
                    return [3 /*break*/, 39];
                case 48: return [3 /*break*/, 51];
                case 49:
                    e_24_1 = _w.sent();
                    e_24 = { error: e_24_1 };
                    return [3 /*break*/, 51];
                case 50:
                    try {
                        if (next_1_1 && !next_1_1.done && (_u = next_1.return)) _u.call(next_1);
                    }
                    finally { if (e_24) throw e_24.error; }
                    return [7 /*endfinally*/];
                case 51: return [2 /*return*/, ready.sort(function (a, b) { return directLinkRank(getCandidateUrl(a)) - directLinkRank(getCandidateUrl(b)); })];
            }
        });
    });
}
function resolveHubcloud(hubUrl_1) {
    return __awaiter(this, arguments, void 0, function (hubUrl, options) {
        var referer, includeOriginal, page, links, _a, _b, link, generateLinks, hrefMatches, hrefMatches_2, hrefMatches_2_1, match, generateUrl, inlineMatches, inlineMatches_1, inlineMatches_1_1, match, generateUrl, _c, _d, generateUrl, generated, generated_1, generated_1_1, link, e_28_1, candidates, _e, _f, link, _g, _h, gofileCandidate, e_29_1, e_30_1, ready, candidates_1, candidates_1_1, candidate, _j, _k, resolved, e_31_1, e_32_1, _l;
        var e_33, _m, e_34, _o, e_35, _p, e_28, _q, e_36, _r, e_30, _s, e_29, _t, e_32, _u, e_31, _v;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_w) {
            switch (_w.label) {
                case 0:
                    referer = options.referer || DEFAULT_REFERER;
                    includeOriginal = options.includeOriginal !== false;
                    _w.label = 1;
                case 1:
                    _w.trys.push([1, 40, , 41]);
                    return [4 /*yield*/, fetchHtml(hubUrl, referer, options.timeout || 9000)];
                case 2:
                    page = _w.sent();
                    if (!page.html)
                        return [2 /*return*/, includeOriginal ? [hubUrl] : []];
                    links = [];
                    if (includeOriginal)
                        pushUniqueUrl(links, hubUrl);
                    try {
                        for (_a = __values(extractDownloadLinks(page.html, page.url)), _b = _a.next(); !_b.done; _b = _a.next()) {
                            link = _b.value;
                            pushUniqueUrl(links, link);
                        }
                    }
                    catch (e_33_1) { e_33 = { error: e_33_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_m = _a.return)) _m.call(_a);
                        }
                        finally { if (e_33) throw e_33.error; }
                    }
                    generateLinks = [];
                    hrefMatches = page.html.matchAll(/href=["']([^"']*(?:gamerxyt\.com|sportverse\.cc)\/hubcloud\.php[^"']*)["']/gi);
                    try {
                        for (hrefMatches_2 = __values(hrefMatches), hrefMatches_2_1 = hrefMatches_2.next(); !hrefMatches_2_1.done; hrefMatches_2_1 = hrefMatches_2.next()) {
                            match = hrefMatches_2_1.value;
                            generateUrl = normalizeDownloadUrl(match[1], page.url);
                            pushUniqueUrl(generateLinks, generateUrl);
                            pushUniqueUrl(links, generateUrl);
                        }
                    }
                    catch (e_34_1) { e_34 = { error: e_34_1 }; }
                    finally {
                        try {
                            if (hrefMatches_2_1 && !hrefMatches_2_1.done && (_o = hrefMatches_2.return)) _o.call(hrefMatches_2);
                        }
                        finally { if (e_34) throw e_34.error; }
                    }
                    inlineMatches = page.html.match(/https?:\/\/(?:gamerxyt\.com|sportverse\.cc)\/hubcloud\.php[^"'\s<>]+/gi) || [];
                    try {
                        for (inlineMatches_1 = __values(inlineMatches), inlineMatches_1_1 = inlineMatches_1.next(); !inlineMatches_1_1.done; inlineMatches_1_1 = inlineMatches_1.next()) {
                            match = inlineMatches_1_1.value;
                            generateUrl = normalizeDownloadUrl(match, page.url);
                            pushUniqueUrl(generateLinks, generateUrl);
                            pushUniqueUrl(links, generateUrl);
                        }
                    }
                    catch (e_35_1) { e_35 = { error: e_35_1 }; }
                    finally {
                        try {
                            if (inlineMatches_1_1 && !inlineMatches_1_1.done && (_p = inlineMatches_1.return)) _p.call(inlineMatches_1);
                        }
                        finally { if (e_35) throw e_35.error; }
                    }
                    _w.label = 3;
                case 3:
                    _w.trys.push([3, 8, 9, 10]);
                    _c = __values(generateLinks.slice(0, options.maxGenerateLinks || 2)), _d = _c.next();
                    _w.label = 4;
                case 4:
                    if (!!_d.done) return [3 /*break*/, 7];
                    generateUrl = _d.value;
                    return [4 /*yield*/, resolveGeneratedHubcloud(generateUrl, page.url)];
                case 5:
                    generated = _w.sent();
                    try {
                        for (generated_1 = (e_36 = void 0, __values(generated)), generated_1_1 = generated_1.next(); !generated_1_1.done; generated_1_1 = generated_1.next()) {
                            link = generated_1_1.value;
                            pushUniqueUrl(links, link);
                        }
                    }
                    catch (e_36_1) { e_36 = { error: e_36_1 }; }
                    finally {
                        try {
                            if (generated_1_1 && !generated_1_1.done && (_r = generated_1.return)) _r.call(generated_1);
                        }
                        finally { if (e_36) throw e_36.error; }
                    }
                    _w.label = 6;
                case 6:
                    _d = _c.next();
                    return [3 /*break*/, 4];
                case 7: return [3 /*break*/, 10];
                case 8:
                    e_28_1 = _w.sent();
                    e_28 = { error: e_28_1 };
                    return [3 /*break*/, 10];
                case 9:
                    try {
                        if (_d && !_d.done && (_q = _c.return)) _q.call(_c);
                    }
                    finally { if (e_28) throw e_28.error; }
                    return [7 /*endfinally*/];
                case 10:
                    candidates = [];
                    _w.label = 11;
                case 11:
                    _w.trys.push([11, 22, 23, 24]);
                    _e = __values(links.filter(isKnownDownloadHost)), _f = _e.next();
                    _w.label = 12;
                case 12:
                    if (!!_f.done) return [3 /*break*/, 21];
                    link = _f.value;
                    pushUniqueCandidate(candidates, link);
                    if (!(/gofile\.io\/d\//i.test(link) && options.resolveGofile !== false)) return [3 /*break*/, 20];
                    _w.label = 13;
                case 13:
                    _w.trys.push([13, 18, 19, 20]);
                    e_29 = void 0;
                    return [4 /*yield*/, resolveGofile(link, options)];
                case 14:
                    _g = (__values.apply(void 0, [_w.sent()])), _h = _g.next();
                    _w.label = 15;
                case 15:
                    if (!!_h.done) return [3 /*break*/, 17];
                    gofileCandidate = _h.value;
                    pushUniqueCandidate(candidates, gofileCandidate);
                    _w.label = 16;
                case 16:
                    _h = _g.next();
                    return [3 /*break*/, 15];
                case 17: return [3 /*break*/, 20];
                case 18:
                    e_29_1 = _w.sent();
                    e_29 = { error: e_29_1 };
                    return [3 /*break*/, 20];
                case 19:
                    try {
                        if (_h && !_h.done && (_t = _g.return)) _t.call(_g);
                    }
                    finally { if (e_29) throw e_29.error; }
                    return [7 /*endfinally*/];
                case 20:
                    _f = _e.next();
                    return [3 /*break*/, 12];
                case 21: return [3 /*break*/, 24];
                case 22:
                    e_30_1 = _w.sent();
                    e_30 = { error: e_30_1 };
                    return [3 /*break*/, 24];
                case 23:
                    try {
                        if (_f && !_f.done && (_s = _e.return)) _s.call(_e);
                    }
                    finally { if (e_30) throw e_30.error; }
                    return [7 /*endfinally*/];
                case 24:
                    if (!options.readyOnly) return [3 /*break*/, 39];
                    ready = [];
                    _w.label = 25;
                case 25:
                    _w.trys.push([25, 36, 37, 38]);
                    candidates_1 = __values(candidates), candidates_1_1 = candidates_1.next();
                    _w.label = 26;
                case 26:
                    if (!!candidates_1_1.done) return [3 /*break*/, 35];
                    candidate = candidates_1_1.value;
                    _w.label = 27;
                case 27:
                    _w.trys.push([27, 32, 33, 34]);
                    e_31 = void 0;
                    return [4 /*yield*/, resolvePlayableCandidates(candidate, options)];
                case 28:
                    _j = (__values.apply(void 0, [_w.sent()])), _k = _j.next();
                    _w.label = 29;
                case 29:
                    if (!!_k.done) return [3 /*break*/, 31];
                    resolved = _k.value;
                    pushUniqueCandidate(ready, resolved);
                    _w.label = 30;
                case 30:
                    _k = _j.next();
                    return [3 /*break*/, 29];
                case 31: return [3 /*break*/, 34];
                case 32:
                    e_31_1 = _w.sent();
                    e_31 = { error: e_31_1 };
                    return [3 /*break*/, 34];
                case 33:
                    try {
                        if (_k && !_k.done && (_v = _j.return)) _v.call(_j);
                    }
                    finally { if (e_31) throw e_31.error; }
                    return [7 /*endfinally*/];
                case 34:
                    candidates_1_1 = candidates_1.next();
                    return [3 /*break*/, 26];
                case 35: return [3 /*break*/, 38];
                case 36:
                    e_32_1 = _w.sent();
                    e_32 = { error: e_32_1 };
                    return [3 /*break*/, 38];
                case 37:
                    try {
                        if (candidates_1_1 && !candidates_1_1.done && (_u = candidates_1.return)) _u.call(candidates_1);
                    }
                    finally { if (e_32) throw e_32.error; }
                    return [7 /*endfinally*/];
                case 38: return [2 /*return*/, ready.sort(function (a, b) { return directLinkRank(getCandidateUrl(a)) - directLinkRank(getCandidateUrl(b)); })];
                case 39: return [2 /*return*/, candidates.sort(function (a, b) { return directLinkRank(getCandidateUrl(a)) - directLinkRank(getCandidateUrl(b)); })];
                case 40:
                    _l = _w.sent();
                    return [2 /*return*/, includeOriginal ? [hubUrl] : []];
                case 41: return [2 /*return*/];
            }
        });
    });
}
function resolveVcloud(vcloudUrl_1) {
    return __awaiter(this, arguments, void 0, function (vcloudUrl, options) {
        var referer, links, page, _a, _b, link, direct, tokenUrl, tokenPage, _c, _d, link, _e, candidates, ready, candidates_2, candidates_2_1, candidate, _f, _g, resolved, e_37_1, e_38_1;
        var e_39, _h, e_40, _j, e_38, _k, e_37, _l;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    referer = options.referer || DEFAULT_REFERER;
                    links = [];
                    pushUniqueUrl(links, vcloudUrl);
                    _m.label = 1;
                case 1:
                    _m.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, fetchHtmlWithHeaders(vcloudUrl, mobileHeaders(referer), options.timeout || 9000)];
                case 2:
                    page = _m.sent();
                    if (page.html) {
                        try {
                            for (_a = __values(extractDownloadLinks(page.html, page.url)), _b = _a.next(); !_b.done; _b = _a.next()) {
                                link = _b.value;
                                pushUniqueUrl(links, link);
                            }
                        }
                        catch (e_39_1) { e_39 = { error: e_39_1 }; }
                        finally {
                            try {
                                if (_b && !_b.done && (_h = _a.return)) _h.call(_a);
                            }
                            finally { if (e_39) throw e_39.error; }
                        }
                    }
                    return [4 /*yield*/, resolveVcloudApi(vcloudUrl, options)];
                case 3:
                    direct = _m.sent();
                    pushUniqueUrl(links, direct);
                    return [4 /*yield*/, resolveVcloudToken(vcloudUrl, options)];
                case 4:
                    tokenUrl = _m.sent();
                    pushUniqueUrl(links, tokenUrl);
                    if (!tokenUrl) return [3 /*break*/, 6];
                    return [4 /*yield*/, fetchHtmlWithHeaders(tokenUrl, mobileHeaders(vcloudUrl), options.timeout || 9000)];
                case 5:
                    tokenPage = _m.sent();
                    if (tokenPage.html) {
                        try {
                            for (_c = __values(extractDownloadLinks(tokenPage.html, tokenPage.url)), _d = _c.next(); !_d.done; _d = _c.next()) {
                                link = _d.value;
                                pushUniqueUrl(links, link);
                            }
                        }
                        catch (e_40_1) { e_40 = { error: e_40_1 }; }
                        finally {
                            try {
                                if (_d && !_d.done && (_j = _c.return)) _j.call(_c);
                            }
                            finally { if (e_40) throw e_40.error; }
                        }
                    }
                    _m.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    _e = _m.sent();
                    return [3 /*break*/, 8];
                case 8:
                    candidates = links.filter(isKnownDownloadHost).sort(function (a, b) { return directLinkRank(a) - directLinkRank(b); });
                    if (!options.readyOnly)
                        return [2 /*return*/, candidates];
                    ready = [];
                    _m.label = 9;
                case 9:
                    _m.trys.push([9, 20, 21, 22]);
                    candidates_2 = __values(candidates), candidates_2_1 = candidates_2.next();
                    _m.label = 10;
                case 10:
                    if (!!candidates_2_1.done) return [3 /*break*/, 19];
                    candidate = candidates_2_1.value;
                    _m.label = 11;
                case 11:
                    _m.trys.push([11, 16, 17, 18]);
                    e_37 = void 0;
                    return [4 /*yield*/, resolvePlayableCandidates(candidate, options)];
                case 12:
                    _f = (__values.apply(void 0, [_m.sent()])), _g = _f.next();
                    _m.label = 13;
                case 13:
                    if (!!_g.done) return [3 /*break*/, 15];
                    resolved = _g.value;
                    pushUniqueCandidate(ready, resolved);
                    _m.label = 14;
                case 14:
                    _g = _f.next();
                    return [3 /*break*/, 13];
                case 15: return [3 /*break*/, 18];
                case 16:
                    e_37_1 = _m.sent();
                    e_37 = { error: e_37_1 };
                    return [3 /*break*/, 18];
                case 17:
                    try {
                        if (_g && !_g.done && (_l = _f.return)) _l.call(_f);
                    }
                    finally { if (e_37) throw e_37.error; }
                    return [7 /*endfinally*/];
                case 18:
                    candidates_2_1 = candidates_2.next();
                    return [3 /*break*/, 10];
                case 19: return [3 /*break*/, 22];
                case 20:
                    e_38_1 = _m.sent();
                    e_38 = { error: e_38_1 };
                    return [3 /*break*/, 22];
                case 21:
                    try {
                        if (candidates_2_1 && !candidates_2_1.done && (_k = candidates_2.return)) _k.call(candidates_2);
                    }
                    finally { if (e_38) throw e_38.error; }
                    return [7 /*endfinally*/];
                case 22: return [2 /*return*/, ready.sort(function (a, b) { return directLinkRank(getCandidateUrl(a)) - directLinkRank(getCandidateUrl(b)); })];
            }
        });
    });
}
function resolveVcloudApi(url_1) {
    return __awaiter(this, arguments, void 0, function (url, options) {
        var page, match;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchHtml(url, options.referer || DEFAULT_REFERER, options.timeout || 9000)];
                case 1:
                    page = _a.sent();
                    if (!page.html)
                        return [2 /*return*/, null];
                    match = page.html.match(/<a\s+href=["'](https:\/\/vcloud\.zip\/[^"']+)["'][^>]*>Direct\s+Download/i);
                    return [2 /*return*/, match ? match[1].trim() : null];
            }
        });
    });
}
function resolveVcloudToken(url_1) {
    return __awaiter(this, arguments, void 0, function (url, options) {
        var page, match;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchHtml(url, options.referer || DEFAULT_REFERER, options.timeout || 9000)];
                case 1:
                    page = _a.sent();
                    if (!page.html)
                        return [2 /*return*/, null];
                    match = page.html.match(/atob\s*\(\s*atob\s*\(\s*["']([^"']+)["']\s*\)\s*\)/);
                    if (!match)
                        return [2 /*return*/, null];
                    try {
                        return [2 /*return*/, atob(atob(match[1]))];
                    }
                    catch (_b) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
module.exports = {
    directLinkRank: directLinkRank,
    extractDownloadLinks: extractDownloadLinks,
    fetchHtml: fetchHtml,
    fetchHtmlWithHeaders: fetchHtmlWithHeaders,
    fetchWithTimeout: fetchWithTimeout,
    formatResolvedUrl: formatResolvedUrl,
    getCandidateHeaders: getCandidateHeaders,
    getCandidateUrl: getCandidateUrl,
    isKnownDownloadHost: isKnownDownloadHost,
    isReadyForPlayback: isReadyForPlayback,
    isBlockedMediaUrl: isBlockedMediaUrl,
    normalizeDownloadUrl: normalizeDownloadUrl,
    pushUniqueUrl: pushUniqueUrl,
    resolveGeneratedHubcloud: resolveGeneratedHubcloud,
    resolveGdflix: resolveGdflix,
    resolveGofile: resolveGofile,
    resolveHubVcloudReady: resolveHubVcloudReady,
    resolveHubcloud: resolveHubcloud,
    resolvePlayableCandidates: resolvePlayableCandidates,
    resolveVcloud: resolveVcloud,
    resolveVcloudApi: resolveVcloudApi,
    resolveVcloudToken: resolveVcloudToken,
};
