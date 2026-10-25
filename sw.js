/* Piwi Kappen — Service Worker v5
   إصلاح ERR_FAILED: لا تُخزَّن/تُعطِ ردود مُعاد توجيهها (308) للصفحات —
   Chrome يرفضها للتنقل ويعرض ERR_FAILED. الصفحات: شبكة أولًا + كاش نظيف. */
var CACHE = "piwi-v6";
var ASSETS = ["./", "./config.js", "./sw.js"]; /* صفحات .html تُعاد توجيهها (cleanUrls) — لا تُضاف للتنزيل المسبق */
var OFFLINE_HTML = "<!DOCTYPE html><html lang=ar dir=rtl><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Piwi Kappen</title><body style='font-family:-apple-system,sans-serif;text-align:center;padding:60px 20px'><h1>🧢 Piwi Kappen</h1><p>لا يوجد اتصال بالإنترنت — أعد المحاولة لاحقًا</p><button onclick='location.reload()' style='padding:12px 28px;border:0;border-radius:999px;background:#7A1F3D;color:#fff;font-size:16px'>إعادة المحاولة</button></body></html>";

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      /* احذف كل الكاش القديم — يزيل النسخ المسمومة من الإصدارات السابقة */
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener("message", function (e) {
  if (e.data === "clear") caches.delete(CACHE);
});

function safePut(req, res) {
  try {
    if (!res || !res.ok || res.redirected) return; /* لا تخزّن redirected أبدًا */
    var cp = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, cp); }).catch(function () {});
  } catch (e) {}
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  /* ===== الصفحات (تنقّل) — الشبكة أولًا، ردود redirected ممنوعة ===== */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.type === "opaqueredirect") return res; /* المتصفح يتولى التوجيه بنفسه */
        safePut(req, res);
        return res;
      }).catch(function () {
        /* بلا شبكة: كاش نظيف لنفس الصفحة، ثم نسخة مكافئة، ثم صفحة أوفلاين */
        return caches.match(req).then(function (h) {
          if (h && !h.redirected) return h;
          var alt = /admin/i.test(url.pathname) ? "/admin" : (/index/i.test(url.pathname) ? "/" : null);
          var p = alt ? caches.match(alt) : Promise.resolve(null);
          return p.then(function (a) {
            if (a && !a.redirected) return a;
            return caches.match("./").then(function (shell) {
              return shell && !shell.redirected ? shell : new Response(OFFLINE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
            });
          });
        });
      })
    );
    return;
  }

  /* Supabase API — شبكة أولاً، كاش كاحتياط */
  if (url.origin.includes("supabase")) {
    e.respondWith(fetch(req));
    return;
  }

  /* صور Cloudinary — كاش أولاً + تحديث بالخلفية */
  if (url.origin.includes("cloudinary") || /\.(png|jpg|jpeg|webp|gif|svg|avif)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        if (hit) {
          fetch(req).then(function (res) { safePut(req, res); }).catch(function () {});
          return hit;
        }
        return fetch(req).then(function (res) {
          safePut(req, res);
          return res;
        }).catch(function () { return new Response("", { status: 503 }); });
      })
    );
    return;
  }

  /* باقي الملفات (JS/CSS/CDN) — كاش أولاً + تحديث بالخلفية */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) safePut(req, res);
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
