import { useState, useRef, useEffect, useCallback } from "react";

const API = "/api";
const BASE = window.location.origin;

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (options.raw) return res;
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "something went wrong on the server side.");
  return data;
}

function MiniChart({ data }) {
  if (!data || data.length === 0) return <span className="detail-value">no data yet</span>;
  const max = Math.max(...data, 1);
  const w = 140;
  const h = 36;
  const points = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * w,
    y: h - (v / max) * h,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartFill)" />
      <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2" fill="var(--accent)" />)}
    </svg>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="toast">{message}</div>;
}

function LinkRow({ data, isSelected, onSelect, onDelete, expanded, onExpand, pushToast }) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortUrl = `${BASE}/${data.slug}`;

  useEffect(() => {
    if (expanded && !stats && !loadingStats) {
      setLoadingStats(true);
      api(`/links/${data.slug}/stats`)
        .then(setStats)
        .catch(() => setStats(null))
        .finally(() => setLoadingStats(false));
    }
  }, [expanded, data.slug, stats, loadingStats]);

  const copyLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shortUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const visitLink = (e) => {
    e.stopPropagation();
    window.open(shortUrl, "_blank");
  };

  const daysLeft = () => {
    const diff = new Date(data.expiresAt).getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return "expired lol";
    if (days === 1) return "1 day left";
    return `${days}d left`;
  };

  const statusColor = () => {
    const diff = new Date(data.expiresAt).getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return "var(--danger)";
    if (days <= 3) return "var(--warning)";
    return "var(--alive)";
  };

  const dailyData = stats?.dailyBreakdown?.map((d) => d.clicks) || [];

  return (
    <div className={`link-row ${expanded ? "expanded" : ""} ${isSelected ? "selected" : ""}`}>
      <div className="link-row-main" onClick={onExpand}>
        <label className="checkbox-wrap" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={isSelected} onChange={onSelect} />
          <span className="checkmark" />
        </label>
        <div className="link-row-info">
          <div className="link-row-top">
            <span className="short-url">{data.slug}</span>
            <div className="link-row-badges">
              <span className="badge-status" style={{ color: statusColor() }}>{daysLeft()}</span>
              <span className="badge-clicks">{data.clicks} clicks</span>
            </div>
          </div>
          <span className="original-url">{data.original}</span>
        </div>
        <div className="link-row-actions">
          <button className={`btn-icon ${copied ? "copied" : ""}`} onClick={copyLink} title="copy">
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
          </button>
          <button className="btn-icon" onClick={visitLink} title="visit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
          <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="link-row-detail">
          {loadingStats ? (
            <div className="detail-loading">loading stats...</div>
          ) : (
            <div className="detail-grid">
              <div className="detail-card">
                <span className="detail-label">7-day traffic</span>
                <MiniChart data={dailyData} />
              </div>
              <div className="detail-card">
                <span className="detail-label">qr code</span>
                <a href={`${API}/links/${data.slug}/qr?format=png&size=400`} target="_blank" rel="noreferrer" title="download qr">
                  <img src={`${API}/links/${data.slug}/qr?format=png&size=105`} width="105" height="105" alt="qr" style={{ borderRadius: 4 }} />
                </a>
              </div>
              <div className="detail-card detail-stats">
                <div className="stat-line"><span className="detail-label">created</span><span className="detail-value">{new Date(data.createdAt).toLocaleDateString()}</span></div>
                <div className="stat-line"><span className="detail-label">expires</span><span className="detail-value">{new Date(data.expiresAt).toLocaleDateString()}</span></div>
                <div className="stat-line"><span className="detail-label">total clicks</span><span className="detail-value">{stats?.totalClicks ?? data.clicks}</span></div>
                <div className="stat-line"><span className="detail-label">last 7d</span><span className="detail-value">{stats?.last7Days ?? "---"}</span></div>
                {stats?.topReferrers?.length > 0 && (
                  <div className="stat-line"><span className="detail-label">top source</span><span className="detail-value">{stats.topReferrers[0].source}</span></div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function validateUrl(garbage) {
  const trimmed = garbage.trim();
  if (!trimmed) return "you forgot the url. the one thing we need.";
  if (trimmed.length < 4) return "that's not a url, that's a typo.";
  if (/\s/.test(trimmed)) return "urls don't have spaces. nice try though.";
  const dressed = trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`;
  try {
    const attempt = new URL(dressed);
    if (!attempt.hostname.includes(".")) return "a url without a dot is just a word.";
    if (attempt.hostname.split(".").some(p => p.length === 0)) return "those dots are doing nothing useful.";
    const tld = attempt.hostname.split(".").pop();
    if (tld.length < 2) return "that tld is suspiciously short.";
    if (/^[0-9]+$/.test(attempt.hostname.replace(/\./g, ""))) return "that's just numbers with ambition.";
    return null;
  } catch {
    return "that's not a url. that's keyboard spam.";
  }
}

function validateAlias(slug) {
  if (!slug) return null;
  if (slug.length < 2) return "slug needs at least 2 characters. have some standards.";
  if (slug.length > 20) return "keep it under 20 chars. we're shortening, remember?";
  if (/^-|-$/.test(slug)) return "slugs can't start or end with a dash. it's the law.";
  if (/--/.test(slug)) return "double dashes? what is this, morse code?";
  return null;
}

export default function Skinnk() {
  const [links, setLinks] = useState([]);
  const [globalStats, setGlobalStats] = useState({ totalLinks: 0, activeLinks: 0, totalClicks: 0, avgClicksPerLink: 0 });
  const [victim, setVictim] = useState("");
  const [alias, setAlias] = useState("");
  const [expiry, setExpiry] = useState("7");
  const [isSquishing, setIsSquishing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [view, setView] = useState("list");
  const [urlError, setUrlError] = useState(null);
  const [aliasError, setAliasError] = useState(null);
  const [touched, setTouched] = useState({ url: false, alias: false });
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const toastCounter = useRef(0);

  const pushToast = useCallback((msg) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, msg }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchLinks = useCallback(async (p = 1, search = "") => {
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (search) params.set("search", search);
      const res = await api(`/links?${params}`);
      setLinks(res.data);
      setPagination(res.pagination);
      setApiDown(false);
    } catch {
      setApiDown(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGlobalStats = useCallback(async () => {
    try {
      const res = await api("/stats");
      setGlobalStats(res);
    } catch {}
  }, []);

  useEffect(() => {
    fetchLinks(1);
    fetchGlobalStats();
  }, [fetchLinks, fetchGlobalStats]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      fetchLinks(1, searchQuery);
    }, 400);
    return () => clearTimeout(debounce);
  }, [searchQuery, fetchLinks]);

  const handleShrink = async () => {
    const ue = validateUrl(victim);
    const ae = validateAlias(alias.trim());
    setUrlError(ue);
    setAliasError(ae);
    setTouched({ url: true, alias: true });
    if (ue || ae) return;

    setIsSquishing(true);
    try {
      const body = { url: victim.trim(), expiresInDays: parseInt(expiry) || 7 };
      if (alias.trim()) body.slug = alias.trim();
      const created = await api("/links", { method: "POST", body: JSON.stringify(body) });

      setLinks((prev) => [{
        id: created.id,
        slug: created.slug,
        shortUrl: created.shortUrl,
        original: created.original,
        clicks: 0,
        createdAt: created.createdAt,
        expiresAt: created.expiresAt,
        active: true,
      }, ...prev]);

      setVictim("");
      setAlias("");
      setUrlError(null);
      setAliasError(null);
      setTouched({ url: false, alias: false });
      fetchGlobalStats();
      pushToast(`${created.slug} is alive. go share it.`);
    } catch (err) {
      pushToast(err.message);
    } finally {
      setIsSquishing(false);
    }
  };

  const deleteLink = async (slug) => {
    try {
      await api(`/links/${slug}`, { method: "DELETE" });
      setLinks((prev) => prev.filter((l) => l.slug !== slug));
      setSelected((prev) => { const n = new Set(prev); n.delete(slug); return n; });
      fetchGlobalStats();
      pushToast("link eliminated. it had a good run.");
    } catch (err) {
      pushToast(err.message);
    }
  };

  const bulkDelete = async () => {
    const slugs = [...selected];
    try {
      const res = await api("/links/bulk-delete", { method: "POST", body: JSON.stringify({ slugs }) });
      setLinks((prev) => prev.filter((l) => !selected.has(l.slug)));
      setSelected(new Set());
      fetchGlobalStats();
      pushToast(res.message);
    } catch (err) {
      pushToast(err.message);
    }
  };

  const selectAll = () => {
    if (selected.size === links.length) setSelected(new Set());
    else setSelected(new Set(links.map((l) => l.slug)));
  };

  const goPage = (p) => {
    setPage(p);
    fetchLinks(p, searchQuery);
  };

  const ROASTS = [
    "the void stares back.",
    "baby steps.",
    "getting warmer.",
    "okay you're cooking now.",
    "link dealer energy.",
    "this is a lifestyle at this point.",
    "they should study you.",
    "url menace to society.",
  ];
  const roastIndex = Math.min(globalStats.totalLinks, ROASTS.length - 1);

  return (
    <div className="skinnk-app">
      <header className="topbar">
        <div className="logo-area">
          <div className="logo-stamp">skinnk</div>
          <span className="logo-version">v3</span>
          {apiDown && <span className="api-badge">api offline</span>}
        </div>
        <div className="topbar-right">
          <div className="view-toggle">
            <button className={`vt-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <button className={`vt-btn ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="main-area">
        <section className="composer">
          <div className="composer-header">
            <h2 className="section-title">new victim</h2>
            <span className="section-sub">{ROASTS[roastIndex]}</span>
          </div>
          <div className="composer-fields">
            <div className="field-group">
              <input
                className={`field-url ${touched.url && urlError ? "field-error" : ""}`}
                value={victim}
                onChange={(e) => { setVictim(e.target.value); if (touched.url) setUrlError(validateUrl(e.target.value)); }}
                onBlur={() => { if (victim.trim()) { setTouched(p => ({ ...p, url: true })); setUrlError(validateUrl(victim)); } }}
                onKeyDown={(e) => e.key === "Enter" && handleShrink()}
                placeholder="drop the bloated url here..."
              />
              {touched.url && urlError && <span className="field-hint">{urlError}</span>}
            </div>
            <div className="composer-row">
              <div className="field-group" style={{ flex: 1 }}>
                <input
                  className={`field-alias ${touched.alias && aliasError ? "field-error" : ""}`}
                  value={alias}
                  onChange={(e) => { const c = e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase(); setAlias(c); if (touched.alias) setAliasError(validateAlias(c)); }}
                  onBlur={() => { if (alias.trim()) { setTouched(p => ({ ...p, alias: true })); setAliasError(validateAlias(alias.trim())); } }}
                  placeholder="custom slug (optional)"
                />
                {touched.alias && aliasError && <span className="field-hint">{aliasError}</span>}
              </div>
              <select className="field-expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)}>
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="90">forever-ish</option>
              </select>
              <button
                className="btn-shrink"
                onClick={handleShrink}
                disabled={!victim.trim() || isSquishing || (touched.url && !!urlError) || (touched.alias && !!aliasError)}
                style={{ transform: isSquishing ? "scaleY(0.2) scaleX(1.1)" : "scaleY(1) scaleX(1)" }}
              >
                {isSquishing ? "compressing..." : "shrink"}
              </button>
            </div>
          </div>
        </section>

        <div className="dashboard-strip">
          <div className="dash-card">
            <span className="dash-number">{globalStats.totalLinks}</span>
            <span className="dash-label">total links</span>
          </div>
          <div className="dash-card">
            <span className="dash-number">{globalStats.activeLinks}</span>
            <span className="dash-label">still alive</span>
          </div>
          <div className="dash-card">
            <span className="dash-number">{globalStats.totalClicks.toLocaleString()}</span>
            <span className="dash-label">total clicks</span>
          </div>
          <div className="dash-card">
            <span className="dash-number">{globalStats.avgClicksPerLink}</span>
            <span className="dash-label">avg per link</span>
          </div>
        </div>

        <section className="link-list-section">
          <div className="list-toolbar">
            <div className="toolbar-left">
              <label className="checkbox-wrap" style={{ marginRight: 8 }}>
                <input type="checkbox" checked={links.length > 0 && selected.size === links.length} onChange={selectAll} />
                <span className="checkmark" />
              </label>
              <input
                className="field-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search your victims..."
              />
            </div>
            {selected.size > 0 && (
              <button className="btn-bulk-delete" onClick={bulkDelete}>
                obliterate {selected.size} link{selected.size > 1 ? "s" : ""}
              </button>
            )}
          </div>

          {loading ? (
            <div className="empty-state"><p className="empty-line">fetching links...</p></div>
          ) : apiDown ? (
            <div className="empty-state">
              <div className="empty-face">X_X</div>
              <p className="empty-line">api is not responding.</p>
              <p className="empty-sub">make sure the backend is running on port 3001</p>
              <button className="btn-retry" onClick={() => { setLoading(true); fetchLinks(1); fetchGlobalStats(); }}>try again</button>
            </div>
          ) : links.length === 0 ? (
            <div className="empty-state">
              <div className="empty-face">:/</div>
              <p className="empty-line">{searchQuery ? "nothing matches. try harder." : "no links. just vibes."}</p>
            </div>
          ) : view === "list" ? (
            <div className="link-list">
              {links.map((link) => (
                <LinkRow
                  key={link.id}
                  data={link}
                  pushToast={pushToast}
                  isSelected={selected.has(link.slug)}
                  onSelect={() => setSelected((prev) => {
                    const n = new Set(prev);
                    n.has(link.slug) ? n.delete(link.slug) : n.add(link.slug);
                    return n;
                  })}
                  onDelete={() => deleteLink(link.slug)}
                  expanded={expandedId === link.id}
                  onExpand={() => setExpandedId(expandedId === link.id ? null : link.id)}
                />
              ))}
            </div>
          ) : (
            <div className="link-grid">
              {links.map((link) => (
                <div key={link.id} className="grid-card" onClick={() => { setView("list"); setExpandedId(link.id); }}>
                  <img src={`${API}/links/${link.slug}/qr?format=png&size=105`} width="80" height="80" alt="qr" style={{ borderRadius: 4, opacity: 0.85 }} />
                  <span className="grid-card-slug">{link.slug}</span>
                  <span className="grid-card-clicks">{link.clicks} clicks</span>
                </div>
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => goPage(page - 1)}>prev</button>
              <span className="page-info">{page} / {pagination.pages}</span>
              <button className="page-btn" disabled={page >= pagination.pages} onClick={() => goPage(page + 1)}>next</button>
            </div>
          )}
        </section>
      </main>

      <footer className="bottom-bar">
        <span>&copy;<a href="https://github.com/100martini" target="_blank" rel="noreferrer" className="footer-link">Martini</a></span>
        <span className="footer-sep">--</span>
        <span>Does size really matter?</span>
      </footer>

      <div className="toast-stack">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.msg} onDone={() => dismissToast(t.id)} />
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@300;400;500;600;700&display=swap');
        :root {
          --bg: #f4f1ec; --surface: #ebe7e0; --surface2: #e2ddd5;
          --ink: #1a1815; --ink2: #5c5750; --ink3: #9e978d;
          --accent: #c44d2b; --accent2: #a63d20;
          --danger: #b83232; --warning: #c98a1a; --alive: #3a8a5c;
          --radius: 8px;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .skinnk-app {
          min-height: 100vh; background: var(--bg); font-family: 'Sora', sans-serif; color: var(--ink);
          background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0z' fill='%231a1815' fill-opacity='0.03'/%3E%3C/svg%3E");
        }
        .topbar { display: flex; justify-content: space-between; align-items: center; padding: 18px 32px; border-bottom: 1.5px solid var(--ink); }
        .logo-area { display: flex; align-items: baseline; gap: 8px; }
        .logo-stamp { font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 500; letter-spacing: -1px; }
        .logo-version { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--ink3); border: 1px solid var(--ink3); padding: 1px 5px; border-radius: 3px; }
        .api-badge { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--danger); border: 1px solid var(--danger); padding: 1px 7px; border-radius: 3px; margin-left: 8px; }
        .view-toggle { display: flex; border: 1.5px solid var(--ink); border-radius: var(--radius); overflow: hidden; }
        .vt-btn { background: none; border: none; padding: 6px 10px; color: var(--ink3); cursor: pointer; transition: all 0.15s; display: flex; align-items: center; }
        .vt-btn.active { background: var(--ink); color: var(--bg); }
        .vt-btn:first-child { border-right: 1.5px solid var(--ink); }
        .main-area { max-width: 780px; margin: 0 auto; padding: 32px 24px 40px; }
        .composer { border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 24px; margin-bottom: 24px; background: var(--surface); }
        .composer-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
        .section-title { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px; }
        .section-sub { font-size: 11px; color: var(--ink3); font-style: italic; }
        .composer-fields { display: flex; flex-direction: column; gap: 8px; }
        .field-url, .field-alias, .field-search { padding: 12px 14px; background: var(--bg); border: 1.5px solid var(--ink); border-radius: var(--radius); font-family: 'DM Mono', monospace; font-size: 13px; color: var(--ink); transition: all 0.15s; }
        .field-url:focus, .field-alias:focus, .field-search:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(196,77,43,0.1); }
        .field-url { width: 100%; font-size: 14px; }
        .field-group { display: flex; flex-direction: column; gap: 4px; }
        .field-error { border-color: var(--danger) !important; box-shadow: 0 0 0 3px rgba(184,50,50,0.08) !important; }
        .field-hint { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--danger); padding-left: 2px; animation: hintIn 0.2s ease-out; }
        .composer-row { display: flex; gap: 8px; }
        .field-alias { flex: 1; }
        .field-expiry { padding: 10px 12px; background: var(--bg); border: 1.5px solid var(--ink); border-radius: var(--radius); font-family: 'DM Mono', monospace; font-size: 12px; color: var(--ink); cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%231a1815' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; }
        .btn-shrink { padding: 10px 24px; background: var(--ink); color: var(--bg); border: none; border-radius: var(--radius); font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); white-space: nowrap; }
        .btn-shrink:hover { background: var(--accent); }
        .btn-shrink:disabled { opacity: 0.3; cursor: not-allowed; }
        .btn-shrink:active { transform: scale(0.95) !important; }
        .dashboard-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 24px; }
        .dash-card { background: var(--surface); border: 1.5px solid var(--ink); border-radius: var(--radius); padding: 14px 16px; display: flex; flex-direction: column; gap: 2px; }
        .dash-number { font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 500; }
        .dash-label { font-size: 10px; color: var(--ink3); text-transform: uppercase; letter-spacing: 0.8px; }
        .link-list-section { border: 1.5px solid var(--ink); border-radius: var(--radius); overflow: hidden; }
        .list-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1.5px solid var(--ink); background: var(--surface); }
        .toolbar-left { display: flex; align-items: center; gap: 4px; flex: 1; }
        .field-search { border: none; background: transparent; flex: 1; padding: 6px 8px; }
        .field-search:focus { box-shadow: none; }
        .btn-bulk-delete { background: var(--danger); color: #fff; border: none; padding: 6px 14px; border-radius: var(--radius); font-family: 'DM Mono', monospace; font-size: 11px; cursor: pointer; white-space: nowrap; }
        .btn-bulk-delete:hover { opacity: 0.85; }
        .checkbox-wrap { position: relative; display: inline-flex; width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; }
        .checkbox-wrap input { position: absolute; opacity: 0; width: 0; height: 0; }
        .checkmark { width: 16px; height: 16px; border: 1.5px solid var(--ink); border-radius: 3px; background: var(--bg); transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
        .checkbox-wrap input:checked + .checkmark { background: var(--ink); border-color: var(--ink); }
        .checkbox-wrap input:checked + .checkmark::after { content: ''; width: 4px; height: 8px; border: solid var(--bg); border-width: 0 2px 2px 0; transform: rotate(45deg); margin-top: -2px; }
        .link-row { border-bottom: 1px solid var(--surface2); transition: background 0.15s; }
        .link-row:last-child { border-bottom: none; }
        .link-row:hover { background: rgba(0,0,0,0.015); }
        .link-row.selected { background: rgba(196,77,43,0.04); }
        .link-row-main { display: flex; align-items: center; padding: 14px 16px; gap: 12px; cursor: pointer; }
        .link-row-info { flex: 1; min-width: 0; }
        .link-row-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 8px; }
        .short-url { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 500; color: var(--accent); }
        .link-row-badges { display: flex; gap: 8px; align-items: center; }
        .badge-status { font-size: 10px; font-family: 'DM Mono', monospace; }
        .badge-clicks { font-size: 10px; font-family: 'DM Mono', monospace; color: var(--ink3); background: var(--surface); padding: 2px 7px; border-radius: 3px; }
        .original-url { font-size: 11px; color: var(--ink3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
        .link-row-actions { display: flex; gap: 4px; }
        .btn-icon { width: 30px; height: 30px; border: 1px solid var(--surface2); border-radius: 5px; background: transparent; color: var(--ink3); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .btn-icon:hover { background: var(--surface); color: var(--ink); }
        .btn-icon.copied { color: var(--alive); border-color: var(--alive); }
        .btn-icon.danger:hover { background: var(--danger); color: #fff; border-color: var(--danger); }
        .link-row-detail { padding: 0 16px 16px 44px; animation: slideDown 0.25s ease-out; }
        .detail-loading { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--ink3); padding: 12px 0; }
        .detail-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: start; }
        .detail-card { background: var(--surface); border-radius: var(--radius); padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        .detail-card a { text-decoration: none; }
        .detail-label { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--ink3); }
        .detail-stats { gap: 6px; }
        .stat-line { display: flex; justify-content: space-between; align-items: center; }
        .detail-value { font-family: 'DM Mono', monospace; font-size: 12px; }
        .link-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; padding: 12px; }
        .grid-card { background: var(--surface); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
        .grid-card:hover { border-color: var(--ink); }
        .grid-card-slug { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--accent); text-align: center; word-break: break-all; }
        .grid-card-clicks { font-size: 10px; color: var(--ink3); }
        .empty-state { padding: 60px 20px; text-align: center; }
        .empty-face { font-family: 'DM Mono', monospace; font-size: 40px; color: var(--surface2); margin-bottom: 12px; }
        .empty-line { font-size: 13px; color: var(--ink3); }
        .empty-sub { font-size: 11px; color: var(--ink3); margin-top: 4px; opacity: 0.7; }
        .btn-retry { margin-top: 16px; padding: 8px 20px; background: var(--ink); color: var(--bg); border: none; border-radius: var(--radius); font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; }
        .btn-retry:hover { background: var(--accent); }
        .pagination { display: flex; justify-content: center; align-items: center; gap: 12px; padding: 14px; border-top: 1px solid var(--surface2); }
        .page-btn { background: none; border: 1px solid var(--ink); border-radius: var(--radius); padding: 5px 14px; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--ink); cursor: pointer; }
        .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .page-btn:hover:not(:disabled) { background: var(--ink); color: var(--bg); }
        .page-info { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--ink3); }
        .bottom-bar { text-align: center; padding: 20px; font-family: 'DM Mono', monospace; font-size: 12px; color: var(--ink3); }
        .footer-sep { margin: 0 6px; }
        .footer-link { color: var(--ink3); text-decoration: none; transition: color 0.15s; }
        .footer-link:hover { color: var(--accent); }
        .toast-stack { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 6px; z-index: 100; }
        .toast { background: var(--ink); color: var(--bg); padding: 10px 18px; border-radius: var(--radius); font-family: 'DM Mono', monospace; font-size: 12px; animation: toastIn 0.3s ease-out, toastOut 0.3s ease-in 1.9s forwards; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 400px; } }
        @keyframes hintIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes toastOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(30px); } }
        ::selection { background: var(--accent); color: var(--bg); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 3px; }
        @media (max-width: 600px) {
          .topbar { padding: 14px 16px; }
          .main-area { padding: 20px 14px 80px; }
          .composer { padding: 16px; }
          .composer-row { flex-direction: column; }
          .dashboard-strip { grid-template-columns: repeat(2, 1fr); }
          .detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
