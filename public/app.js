// Shared helpers for the admin pages: token handling + authenticated fetch.
// Every admin page is opened as e.g. setup.html?token=XXXX - the token is
// pulled out of the URL once, stashed in sessionStorage (shared across all
// admin pages in this tab), and stripped from the visible URL/history.
const AdminApp = (() => {
  function resolveToken() {
    const fromUrl = new URLSearchParams(location.search).get("token");
    if (fromUrl) {
      sessionStorage.setItem("adminToken", fromUrl);
      const url = new URL(location.href);
      url.searchParams.delete("token");
      history.replaceState({}, "", url);
    }
    return sessionStorage.getItem("adminToken") || "";
  }

  const token = resolveToken();

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    let body = options.body;
    if (body && typeof body !== "string" && !(body instanceof Blob)) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }
    const res = await fetch(`/api${path}`, { ...options, headers, body });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
    return res;
  }

  async function apiJson(path, options) {
    const res = await api(path, options);
    return res.json();
  }

  function wsUrl(path, params = {}) {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const query = new URLSearchParams(params);
    if (token) query.set("token", token);
    const qs = query.toString();
    return `${proto}//${location.host}${path}${qs ? `?${qs}` : ""}`;
  }

  return { token, api, apiJson, wsUrl };
})();

// Which agent the admin UI is currently working with, shared across pages
// (same tab) via localStorage so navigating between pages keeps it.
const AgentContext = {
  get: () => localStorage.getItem("currentAgentId") || "",
  set: (id) => localStorage.setItem("currentAgentId", id),
};

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
