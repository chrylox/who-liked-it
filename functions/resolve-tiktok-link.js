// Resolves a short TikTok share link (vm.tiktok.com/..., vt.tiktok.com/...) to
// its canonical https://www.tiktok.com/video/{id} form, by following redirects
// server-side. Browsers can't do this themselves — a cross-origin fetch/redirect
// to tiktok.com is opaque under CORS, so the final resolved URL is unreadable
// from client-side JS. See issue tracker for the real submission this was found
// against (a native "Share > Copy Link" short link never matched our client-side
// ID-extraction regex, so the video silently fell back to a "Watch on TikTok"
// link instead of playing inline).
const https = require("https");

const ALLOWED_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com", "www.tiktok.com", "tiktok.com", "m.tiktok.com"]);

function resolveRedirect(url, hopsLeft) {
  return new Promise((resolve, reject) => {
    if (hopsLeft <= 0) return reject(new Error("Too many redirects"));
    let parsed;
    try {
      parsed = new URL(url);
    } catch (err) {
      return reject(new Error("Invalid URL"));
    }
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return reject(new Error(`Unsupported host: ${parsed.hostname}`));
    }
    const req = https.request(
      parsed,
      { method: "GET", headers: { "User-Agent": "Mozilla/5.0 (compatible; WhoLikedItBot/1.0)" } },
      (res) => {
        res.resume(); // drain the body without reading it — we only care about headers
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = new URL(res.headers.location, parsed).toString();
          resolveRedirect(next, hopsLeft - 1).then(resolve, reject);
        } else {
          resolve(parsed.toString());
        }
      }
    );
    req.on("error", reject);
    req.end();
  });
}

module.exports = async (req, res) => {
  const url = req.body && req.body.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url" });
  }
  try {
    const finalUrl = await resolveRedirect(url, 5);
    const match = finalUrl.match(/\/video\/(\d+)/);
    if (!match) {
      return res.status(200).json({ resolvedUrl: finalUrl, videoId: null });
    }
    return res.status(200).json({ resolvedUrl: `https://www.tiktok.com/video/${match[1]}`, videoId: match[1] });
  } catch (err) {
    return res.status(502).json({ error: "Could not resolve link", message: err.message });
  }
};
