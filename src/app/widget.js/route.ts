/**
 * Floating chat bubble for coaches' websites:
 *   <script src="https://YOUR_DOMAIN/widget.js" data-mind="your-link" async></script>
 */
const SCRIPT = String.raw`(function () {
  var s = document.currentScript || document.querySelector('script[src*="/widget.js"][data-mind]');
  if (!s || window.__sagelyWidget) return;
  window.__sagelyWidget = true;
  var slug = s.getAttribute("data-mind");
  var origin = new URL(s.src).origin;
  var side = s.getAttribute("data-position") === "left" ? "left" : "right";
  if (!slug) return;
  fetch(origin + "/api/widget/" + encodeURIComponent(slug)).then(function (r) { return r.ok ? r.json() : null; }).then(function (cfg) {
    if (!cfg) return;
    var color = /^#[0-9a-f]{6}$/i.test(cfg.color) ? cfg.color : "#7c3aed";
    var root = document.createElement("div");
    root.style.cssText = "position:fixed;bottom:20px;" + side + ":20px;z-index:2147483000;font-family:system-ui,-apple-system,sans-serif";
    var panel = document.createElement("div");
    panel.style.cssText = "display:none;position:absolute;bottom:76px;" + side + ":0;width:min(400px,calc(100vw - 40px));height:min(640px,calc(100vh - 120px));border-radius:20px;overflow:hidden;box-shadow:0 24px 60px -12px rgba(22,19,31,.35);background:#fff";
    var frame = document.createElement("iframe");
    frame.title = cfg.name;
    frame.style.cssText = "border:0;width:100%;height:100%";
    frame.allow = "clipboard-write";
    panel.appendChild(frame);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "Chat with " + cfg.name);
    btn.style.cssText = "width:60px;height:60px;border-radius:999px;border:0;cursor:pointer;background:" + color + ";color:#fff;box-shadow:0 10px 30px -8px " + color + ";display:grid;place-items:center;font-size:28px;transition:transform .15s";
    btn.onmouseenter = function () { btn.style.transform = "scale(1.06)"; };
    btn.onmouseleave = function () { btn.style.transform = ""; };
    var icon = document.createElement("span");
    icon.textContent = cfg.emoji || "💬";
    btn.appendChild(icon);
    var bubble = document.createElement("div");
    bubble.textContent = cfg.greeting ? cfg.greeting.slice(0, 120) : "Hi! Ask me anything.";
    bubble.style.cssText = "position:absolute;bottom:72px;" + side + ":0;width:240px;padding:12px 14px;border-radius:16px;background:#fff;color:#16131f;font-size:14px;line-height:1.45;box-shadow:0 12px 32px -10px rgba(22,19,31,.3);cursor:pointer";
    var open = false;
    function toggle() {
      open = !open;
      if (open && !frame.src) frame.src = origin + "/c/" + encodeURIComponent(slug) + "?embed=1";
      panel.style.display = open ? "block" : "none";
      bubble.style.display = "none";
      icon.textContent = open ? "×" : (cfg.emoji || "💬");
    }
    btn.onclick = toggle;
    bubble.onclick = toggle;
    root.appendChild(panel);
    root.appendChild(btn);
    try { if (!sessionStorage.getItem("mc-greeted")) { root.appendChild(bubble); sessionStorage.setItem("mc-greeted", "1"); setTimeout(function () { bubble.style.display = "none"; }, 9000); } } catch (e) {}
    document.body.appendChild(root);
  });
})();`;

export function GET() {
  return new Response(SCRIPT, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=3600", "access-control-allow-origin": "*" } });
}
