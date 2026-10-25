/* Piwi Kappen — config (obfuscated, do not edit) */
var CFG_KEYS = (function () {
  var blob = "K0sES3FDFQkvBlB3UV9uOSM+PDEoQT4MJ0F5XGQUMyo+XwIKACgzLXgJHFNYGhkUWgYIPxkvFFZocF54PS8NMxgoAzkLJF5qW38XGQc1Ayo2RQc8AwsGawRvYDMaHSY7JxgICmpqWn9IJwAUBHISKiMsWHtefFpCPjMHMHk3FhMIV0FqYX9SGQQbAS8iOUYoOlEFf1xCKicNDjMsCQcMNGpYRX9LPxA6PQpVPQogFH10d0xHAUdGWgcnFCdQDUtdUAdpBRs+PDECNQgSDGtxbUFxZyMfLDM1MgUIW2oGUHBsckVVCjtDSlIVB0VbW0FIckVVCihDSlILF1hRREVPJ0tbSypDSlIAF3hYUHFCOSYeIwI0CjlUIFt5QX9PAlwUKgJXORsVNmRzeA8PNRA9GShSPRkqB3hKVm5jODAaLzE7IzkWJ1x6XmxIGV8+BwkLESdQGWtdCwB4YidHMyYVHSoyBl9UamxJGQAAACgMSQM/PXsGe1tnJQtFXSItMzoVN2phW3lLFVo4PQJSPQoGWn9kf0VoPT9DCggoRj0PK0V/dntZHRMQEQZSQF4yJUdjYVsXYiYNW2ZYFiQWNkAIfU8RMQs2XjwFOyYAPmBdQ0FvBx8BJX5VUlxHGxAKEF5VJBkEU2ROABMMAEJSXUxCMx0RAi0EGBYQGFMeQUNRMQsWGi5PEx9HEw==";
  var key = "PiwiKappen2026!";
  var raw = atob(blob);
  var out = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i) ^ key.charCodeAt(i % key.length);
  var json = new TextDecoder().decode(out);
  return JSON.parse(json);
})();
var SUPABASE_URL = CFG_KEYS.u;
var SUPABASE_ANON_KEY = CFG_KEYS.a;
var SUPABASE_SERVICE_KEY = CFG_KEYS.s;
var CLOUDINARY_CLOUD = CFG_KEYS.cc;
var CLOUDINARY_PRESET = CFG_KEYS.cp;
var _db = { client: null, admin: null };
function _initDb() {
  try {
    var sdk = window.supabase;
    if (sdk && typeof sdk.createClient === "function") {
      _db.client = sdk.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        db: { schema: "public" },
        global: { headers: { "x-client-info": "piwi-kappen-shop" } }
      });
      _db.admin = sdk.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        global: { headers: { "x-client-info": "piwi-kappen-admin" } }
      });
      try {
        var l = document.createElement("link");
        l.rel = "preconnect"; l.href = SUPABASE_URL; l.crossOrigin = "";
        document.head.appendChild(l);
      } catch (e) {}
      return true;
    }
  } catch (e) {}
  return false;
}
if (!_initDb()) {
  var _t = 0;
  var _iv = setInterval(function () {
    if (_initDb() || ++_t > 50) clearInterval(_iv);
  }, 100);
}
