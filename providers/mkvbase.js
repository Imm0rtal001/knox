/*
 * MkvBase Fetch Provider for Nuvio / Fire TV
 * Base: https://mkvbase.site/
 *
 * Uses only the runtime fetch API. No Node modules, browser, Puppeteer,
 * FlareSolverr, crypto package, or background timers.
 */

const BASE = "https://mkvbase.site/";
const UA = "Mozilla/5.0 (Linux; Android 11; AFTSSS) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36";

function req(url, options) {
  options = options || {};
  const headers = Object.assign({
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  }, options.headers || {});
  return fetch(url, Object.assign({}, options, { headers: headers }));
}

function esc(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decode(s) {
  return String(s || "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function text(html) {
  return decode(String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function absolute(url) {
  if (!url) return "";
  try { return new URL(url, BASE).href; } catch (_) { return ""; }
}

function quality(name) {
  const s=String(name||"").toLowerCase();
  if (/2160p|4k|uhd/.test(s)) return "2160p";
  if (/1440p|2k/.test(s)) return "1440p";
  if (/1080p/.test(s)) return "1080p";
  if (/720p/.test(s)) return "720p";
  if (/480p/.test(s)) return "480p";
  return "HD";
}

function findLinks(html) {
  const out=[];
  const re=/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m=re.exec(html))) {
    const url=absolute(decode(m[1]));
    const title=text(m[2]);
    if (!url || !title) continue;
    if (/mkv|mp4|m3u8|1080|720|2160|4k|download|stream|watch|hubcloud|vcloud|gdflix/i.test(url+" "+title)) {
      out.push({url,title});
    }
  }
  return out;
}

function matches(item, title, year) {
  const a=String(item.title).toLowerCase();
  const b=String(title).toLowerCase().replace(/[^\w\s]/g," ");
  const words=b.split(/\s+/).filter(x=>x.length>2).slice(0,8);
  const hits=words.filter(x=>a.indexOf(x)>=0).length;
  if (hits < Math.max(1, Math.ceil(words.length*.55))) return false;
  if (year) {
    const y=String(year);
    const hasYear=new RegExp("\\b"+esc(y)+"\\b").test(a);
    if (/\b(19|20)\d{2}\b/.test(a) && !hasYear) return false;
  }
  return true;
}

async function searchPage(query) {
  const urls=[
    BASE+"?s="+encodeURIComponent(query),
    BASE+"search?q="+encodeURIComponent(query),
    BASE+"?q="+encodeURIComponent(query)
  ];

  for (let i=0;i<urls.length;i++) {
    try {
      const r=await req(urls[i]);
      if (!r || !r.ok) continue;
      const html=await r.text();
      const links=findLinks(html);
      if (links.length) return links;
      const hrefs=[];
      const re=/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
      let m;
      while ((m=re.exec(html))) {
        const u=absolute(decode(m[1]));
        if (u && u.indexOf("mkvbase.site")>=0) hrefs.push(u);
      }
      if (hrefs.length) return hrefs.map(u=>({url:u,title:u}));
    } catch (_) {}
  }
  return [];
}

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    let title="";
    let year="";

    if (/^tt\d+$/i.test(String(tmdbId||""))) {
      const r=await req("https://v3-cinemeta.strem.io/meta/" +
        ((mediaType==="tv"||mediaType==="series")?"series":"movie") +
        "/" + encodeURIComponent(tmdbId) + ".json");
      if (r && r.ok) {
        const j=await r.json();
        title=j && j.meta ? (j.meta.name||"") : "";
        year=j && j.meta ? String(j.meta.year||"").slice(0,4) : "";
      }
    }

    if (!title) title=String(tmdbId||"").replace(/^tmdb:/,"");
    const tv=(mediaType==="tv"||mediaType==="series");
    const queries=[];

    if (tv && season && episode) {
      const s=String(season).padStart(2,"0");
      const e=String(episode).padStart(2,"0");
      queries.push(title+" S"+s+"E"+e);
      queries.push(title+" "+season+"x"+e);
    } else {
      queries.push(title+(year?" "+year:""));
      queries.push(title);
    }

    let found=[];
    for (let i=0;i<queries.length && !found.length;i++) {
      const links=await searchPage(queries[i]);
      found=links.filter(x=>matches(x,title,year));
    }

    const seen={};
    return found.filter(x=>{
      if (!x.url || seen[x.url]) return false;
      seen[x.url]=true;
      return true;
    }).slice(0,10).map(x=>({
      name:"[MkvBase] "+quality(x.title),
      title:x.title,
      url:x.url,
      quality:quality(x.title),
      behaviorHints:{notWebReady:true}
    }));
  } catch (_) {
    return [];
  }
}

module.exports={getStreams:getStreams};
