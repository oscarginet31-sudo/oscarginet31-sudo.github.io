/* =============================================================================
 * classic.js — Mode classique : rend toutes les sections depuis PF.CONTENT
 * (la même source que la galaxie 3D), gère FR/EN, thème, animations
 * d'apparition, terminal "whoami", topologie réseau animée, filtres et fiches
 * projets, scrollspy et menu mobile. Aucun texte de contenu dans le HTML.
 * ========================================================================== */
(function (PF) {
  "use strict";
  const C = PF.CONTENT, tx = PF.tx, t = PF.t, U = PF.U;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  /** *texte* → <em>texte</em> (après échappement). */
  const rich = (s) => esc(s).replace(/\*(.+?)\*/g, "<em>$1</em>");
  const reduced = U.env.reducedMotion;

  const SECTIONS = [
    { id: "about", nav: "nav.about" },
    { id: "path", nav: "nav.path" },
    { id: "projects", nav: "nav.projects" },
    { id: "skills", nav: "nav.skills" },
    { id: "engagement", nav: "nav.engagement" },
    { id: "contact", nav: "nav.contact" },
  ];

  const tags = (list) => list.map((x) => `<span class="tag">${esc(tx(x))}</span>`).join("");
  const head = (num, labelKey, title, intro, id) => `
    <header class="sec-head reveal">
      <p class="sec-label"><span>${num}</span>${esc(t(labelKey))}</p>
      <h2 class="sec-title" id="${id}-title">${rich(tx(title))}</h2>
      ${intro ? `<p class="sec-intro">${esc(tx(intro))}</p>` : ""}
    </header>`;

  /* ------------------------------ Sections ----------------------------- */
  function about() {
    const id = C.identity;
    return `<div class="wrap">
      ${head("01", "about.label", id.motto, null, "about")}
      <div class="about-grid">
        <div class="about-bio reveal">${id.bio.map((p) => `<p>${esc(tx(p))}</p>`).join("")}</div>
        <dl class="facts reveal">${id.facts.map((f) => `
          <div><dt>${esc(tx(f.label))}</dt><dd>${esc(tx(f.value))}</dd></div>`).join("")}
        </dl>
      </div>
      <ul class="stats">${id.stats.map((s) => `
        <li class="reveal"><b data-count="${esc(tx(s.value))}">${esc(tx(s.value))}</b><span>${esc(tx(s.label))}</span></li>`).join("")}
      </ul>
    </div>`;
  }

  function path() {
    const X = C.experience;
    const jobs = X.jobs.map((j) => `
      <article class="job reveal">
        <p class="job-date">${esc(tx(j.date))}</p>
        <div class="job-main">
          <h3>${esc(tx(j.title))}</h3>
          <p class="job-org"><b>${esc(tx(j.org))}</b><span>${esc(tx(j.meta))}</span></p>
          <p class="job-desc">${esc(tx(j.desc))}</p>
          ${j.groups ? `<div class="job-groups">${j.groups.map((g) => `
            <div><h4>${esc(tx(g.label))}</h4><ul>${g.points.map((p) => `<li>${esc(tx(p))}</li>`).join("")}</ul></div>`).join("")}
          </div>` : ""}
          <div class="tags">${tags(j.tags)}</div>
        </div>
      </article>`).join("");
    const edu = X.education.map((e) => `
      <li class="reveal">
        <p class="li-date">${esc(e.date)}</p>
        <h4>${esc(tx(e.title))}</h4>
        <p class="li-org">${esc(tx(e.org))}</p>
        ${tx(e.desc) ? `<p class="li-desc">${esc(tx(e.desc))}</p>` : ""}
        ${e.highlight ? `<p class="hl">★ ${esc(tx(e.highlight))}</p>` : ""}
      </li>`).join("");
    const certs = X.certifications.map((c) => `
      <li class="reveal">
        <div><h4>${esc(tx(c.name))}</h4><p>${esc(tx(c.issuer))}${c.note ? " · " + esc(tx(c.note)) : ""}</p></div>
        <span class="li-date">${esc(tx(c.date))}</span>
      </li>`).join("");
    return `<div class="wrap">
      ${head("02", "path.label", X.title, X.intro, "path")}
      <h3 class="sub-label reveal">${esc(t("path.jobs"))}</h3>
      <div class="jobs">${jobs}</div>
      <div class="path-cols">
        <div><h3 class="sub-label reveal">${esc(t("path.edu"))}</h3><ol class="edu">${edu}</ol></div>
        <div><h3 class="sub-label reveal">${esc(t("path.certs"))}</h3><ul class="certs">${certs}</ul></div>
      </div>
    </div>`;
  }

  let filter = "all";
  function projects() {
    const P = C.projects, items = P.items;
    const count = (k) => (k === "all" ? items.length : items.filter((p) => p.ctx === k).length);
    const chips = ["all", "pro", "iut"].map((k) => `
      <button type="button" class="fchip${filter === k ? " on" : ""}" data-filter="${k}" aria-pressed="${filter === k}">
        ${esc(t("proj." + k))}<sup>${count(k)}</sup>
      </button>`).join("");
    const cards = items.map((p, i) => {
      const env = p.env.slice(0, 4).map((e) => `<span class="tag">${esc(e)}</span>`).join("")
        + (p.env.length > 4 ? `<span class="tag more">+${p.env.length - 4}</span>` : "");
      const metrics = p.featured && p.metrics ? `<div class="pc-metrics">${p.metrics.map((m) => `
        <div><b>${esc(tx(m.value))}</b><span>${esc(tx(m.label))}</span></div>`).join("")}</div>` : "";
      return `
      <article class="pc${p.featured ? " featured" : ""} reveal" data-ctx="${p.ctx}" data-id="${p.id}"${filter !== "all" && p.ctx !== filter ? " hidden" : ""}>
        <div class="pc-top">
          <span class="pc-num">/${String(i + 1).padStart(2, "0")}</span>
          <span class="pc-org">${esc(t("proj.org." + p.ctx))}</span>
          ${p.badge ? `<span class="pc-badge">${esc(tx(p.badge))}</span>` : ""}
        </div>
        <h3 class="pc-title">${esc(tx(p.title))}</h3>
        <p class="pc-desc">${esc(tx(p.desc))}</p>
        ${metrics}
        <div class="tags">${env}</div>
        <div class="pc-foot">
          <button type="button" class="pc-open" data-open="${p.id}"><span>${esc(t("proj.open"))}</span><span aria-hidden="true">↗</span></button>
          ${p.link ? `<a class="pc-gh" href="${esc(p.link.href)}" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a>` : ""}
        </div>
      </article>`;
    }).join("");
    return `<div class="wrap">
      ${head("03", "proj.label", P.title, P.intro, "projects")}
      <div class="filters reveal" role="group">${chips}</div>
      <div class="pgrid">${cards}</div>
    </div>`;
  }

  function skills() {
    const S = C.skills;
    const badge = (k) => `<span class="ctx ctx-${k}">${esc(t("ctx." + k))}</span>`;
    const cats = S.categories.map((c) => `
      <div class="scat reveal">
        <p class="scat-code">${esc(c.code)}</p>
        <h3>${esc(tx(c.name))}</h3>
        <ul>${c.items.map((it) => `
          <li>
            <div class="si-head"><span class="si-name">${esc(tx(it.name))}</span><span class="si-ctx">${it.ctx.map(badge).join("")}</span></div>
            <p>${esc(tx(it.note))}</p>
          </li>`).join("")}
        </ul>
      </div>`).join("");
    return `<div class="wrap">
      ${head("04", "skills.label", S.title, S.intro, "skills")}
      <p class="legend reveal">${esc(t("skills.where"))} ${["pro", "iut", "perso"].map(badge).join("")}</p>
      <div class="sgrid">${cats}</div>
    </div>`;
  }

  function engagement() {
    const E = C.engagement;
    return `<div class="wrap">
      ${head("05", "eng.label", E.title, E.intro, "engagement")}
      <div class="egrid">${E.items.map((e) => `
        <article class="ecard${e.featured ? " featured" : ""} reveal">
          <span class="eglyph" aria-hidden="true">${e.glyph}</span>
          <h3>${esc(tx(e.title))}</h3>
          <p class="emeta">${esc(tx(e.meta))}</p>
          <p>${esc(tx(e.desc))}</p>
        </article>`).join("")}
      </div>
    </div>`;
  }

  function galaxyPromo() {
    return `<div class="wrap">
      <a class="promo reveal" href="index.html">
        <span class="promo-sky" aria-hidden="true"></span>
        <span class="promo-text">
          <span class="promo-kicker">✦ ${esc(t("nav.galaxy"))}</span>
          <span class="promo-pitch">${esc(t("galaxy.pitch"))}</span>
        </span>
        <span class="promo-cta">${esc(t("galaxy.cta"))} →</span>
      </a>
    </div>`;
  }

  function contact() {
    const K = C.contact;
    const links = K.links.filter((l) => !String(l.href || "").startsWith("mailto:")).map((l) => {
      const v = esc(tx(l.value)), lab = esc(tx(l.label));
      return l.href
        ? `<a class="cl" href="${esc(l.href)}"${l.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}><span>${lab}</span>${v}<i aria-hidden="true">↗</i></a>`
        : `<div class="cl"><span>${lab}</span>${v}</div>`;
    }).join("");
    return `<div class="wrap">
      <div class="contact-card reveal">
        <div class="cc-main">
          <p class="sec-label"><span>06</span>${esc(t("contact.label"))}</p>
          <h2 class="sec-title" id="contact-title">${rich(tx(K.title))}</h2>
          <p class="cc-intro">${esc(tx(K.intro))}</p>
          <div class="cc-mail">
            <a class="cc-email" href="mailto:${esc(K.email)}">${esc(K.email)}</a>
            <button type="button" class="copy" data-copy="${esc(K.email)}">${esc(t("contact.copy"))}</button>
          </div>
          <div class="cc-cta">
            <a class="btn btn-cream" href="mailto:${esc(K.email)}">${esc(t("contact.write"))} <span aria-hidden="true">→</span></a>
            <a class="btn btn-line" href="${esc(t("cv.file"))}" download>${esc(t("hero.cta.cv"))} <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div class="cc-links">${links}</div>
      </div>
    </div>`;
  }

  /* --------------------------- Chrome & rendu --------------------------- */
  let activeSec = null;
  function chrome() {
    document.documentElement.lang = PF.lang;
    document.title = PF.lang === "fr"
      ? "Oscar Ginet — Systèmes, Réseaux & Cybersécurité"
      : "Oscar Ginet — Systems, Networks & Security";
    $$("[data-t]").forEach((el) => (el.textContent = t(el.dataset.t)));
    $$("[data-t-label]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.tLabel)));
    $$("[data-lang-pill]").forEach((el) => el.classList.toggle("active", el.dataset.langPill === PF.lang));
    $("#nav-links").innerHTML = SECTIONS.map((s, i) =>
      `<a href="#${s.id}" data-sec="${s.id}"${s.id === activeSec ? ' class="on"' : ""}><span class="n">0${i + 1}</span>${esc(t(s.nav))}</a>`).join("");
    $$('a[href^="CV_Ginet_Oscar"]').forEach((a) => a.setAttribute("href", t("cv.file")));   // CV FR ou EN
    $("#hero-status").textContent = tx(C.identity.status);
    $("#hero-role").textContent = tx(C.identity.headline);
  }

  function render(animate) {
    chrome();
    $("#about").innerHTML = about();
    $("#path").innerHTML = path();
    $("#projects").innerHTML = projects();
    $("#skills").innerHTML = skills();
    $("#engagement").innerHTML = engagement();
    $("#galaxy-promo").innerHTML = galaxyPromo();
    $("#contact").innerHTML = contact();
    reveal(animate);
    terminal(animate);
    tagline();
  }

  /* --------------------------- Apparition ------------------------------ */
  let io = null;
  function reveal(animate) {
    if (io) io.disconnect();
    const els = $$(".reveal");
    // Petit décalage entre éléments voisins d'une même grille.
    els.forEach((el) => {
      const sib = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
      el.style.setProperty("--d", (sib.indexOf(el) % 4) * 80 + "ms");
    });
    if (!animate || reduced || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
      const n = e.target.querySelector("[data-count]");
      if (n) countUp(n);
    }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /** "~65" → compte de 0 à 65 en gardant préfixe et suffixe. */
  function countUp(el) {
    const m = /^(~?)(\d+)(.*)$/.exec(el.dataset.count);
    if (!m || reduced) return;
    const [, pre, num, post] = m, target = +num, t0 = performance.now(), dur = 1100;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + Math.round(target * e) + post;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ------------------------------ Tagline ------------------------------ */
  let tagTimer = null, tagIdx = 0;
  function tagline() {
    clearTimeout(tagTimer);
    const el = $("#tagline");
    const lines = C.identity.taglines[PF.lang] || C.identity.taglines.fr;
    if (reduced) { el.textContent = lines[0]; return; }
    const line = lines[tagIdx % lines.length];
    let i = 0;
    const type = () => {
      el.textContent = line.slice(0, i++);
      if (i <= line.length) tagTimer = setTimeout(type, 28 + Math.random() * 34);
      else tagTimer = setTimeout(erase, 3400);
    };
    const erase = () => {
      el.textContent = el.textContent.slice(0, -1);
      if (el.textContent.length) tagTimer = setTimeout(erase, 16);
      else { tagIdx++; tagline(); }
    };
    type();
  }

  /* ----------------------------- Terminal ------------------------------ */
  let termTimer = null;
  function terminal(animate) {
    clearTimeout(termTimer);
    const el = $("#term");
    const lines = C.identity.terminal;
    const prompt = `<span class="tp">oscar@infra</span><span class="tc">:~$</span> `;
    const out = (l) => `<span class="to${l.ok ? " ok" : ""}">${esc(tx(l.out))}</span>\n`;
    const caret = `${prompt}<span class="caret"></span>`;
    if (!animate || reduced) {
      el.innerHTML = lines.map((l) => `${prompt}<span class="tx">${esc(l.cmd)}</span>\n${out(l)}`).join("") + caret;
      return;
    }
    let html = "", li = 0, ci = 0;
    const tick = () => {
      if (li >= lines.length) { el.innerHTML = html + caret; return; }
      const l = lines[li];
      if (ci <= l.cmd.length) {
        el.innerHTML = html + prompt + `<span class="tx">${esc(l.cmd.slice(0, ci))}</span><span class="caret"></span>`;
        ci++;
        termTimer = setTimeout(tick, ci === 1 ? 420 : 38 + Math.random() * 40);
      } else {
        html += `${prompt}<span class="tx">${esc(l.cmd)}</span>\n${out(l)}`;
        el.innerHTML = html + caret;
        li++; ci = 0;
        termTimer = setTimeout(tick, 260);
      }
    };
    termTimer = setTimeout(tick, 700);
  }

  /* --------------------- Topologie réseau (canvas) --------------------- */
  function network() {
    const cv = $("#net"), ctx = cv.getContext("2d");
    let w = 0, h = 0, dpr = 1, nodes = [], packets = [], running = false, visible = true, raf = 0;
    const mouse = { x: -1e4, y: -1e4 };
    let col = {};
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      col = { blue: cs.getPropertyValue("--blue").trim() || "#1d3a5f", accent: cs.getPropertyValue("--accent").trim() || "#bf6a39" };
    };
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(90, Math.round((w * h) / 15000));
      nodes = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        hub: i % 11 === 0,
      }));
      packets = [];
    };
    const MAX = 150;
    const frame = (dt) => {
      ctx.clearRect(0, 0, w, h);
      const links = [];
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < MAX) {
          links.push([a, b]);
          ctx.strokeStyle = U.rgba(col.blue, (1 - d / MAX) * 0.32);
          ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      for (const p of nodes) {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (d < 190) {
          ctx.strokeStyle = U.rgba(col.accent, (1 - d / 190) * 0.55);
          ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      // Paquets de données qui transitent sur les liens.
      if (links.length && packets.length < 14 && Math.random() < 0.08) {
        const [a, b] = links[Math.floor(Math.random() * links.length)];
        packets.push({ a, b, k: 0 });
      }
      packets = packets.filter((pk) => {
        pk.k += dt * 0.9;
        if (pk.k >= 1 || Math.hypot(pk.a.x - pk.b.x, pk.a.y - pk.b.y) > MAX) return false;
        const x = pk.a.x + (pk.b.x - pk.a.x) * pk.k, y = pk.a.y + (pk.b.y - pk.a.y) * pk.k;
        ctx.fillStyle = U.rgba(col.accent, 0.9);
        ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
        return true;
      });
      for (const p of nodes) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.fillStyle = U.rgba(col.blue, p.hub ? 0.85 : 0.6);
        if (p.hub) ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2); ctx.fill(); }
      }
    };
    let last = 0;
    const loop = (now) => {
      if (!running) return;
      frame(Math.min(0.05, (now - last) / 1000 || 0.016)); last = now;
      raf = requestAnimationFrame(loop);
    };
    const sync = () => {
      const want = visible && !document.hidden && !reduced;
      if (want && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
      if (!want) { running = false; cancelAnimationFrame(raf); }
    };
    readColors(); resize();
    if (reduced) frame(0);
    addEventListener("resize", () => { resize(); if (reduced) frame(0); });
    cv.parentElement.addEventListener("pointermove", (e) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    cv.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -1e4; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(cv);
    }
    document.addEventListener("visibilitychange", sync);
    PF.onTheme(() => { readColors(); if (reduced) frame(0); });
    sync();
  }

  /* --------------------------- Fiche projet ---------------------------- */
  const sheet = $("#sheet");
  let sheetId = null;
  function openSheet(id) {
    const p = C.projects.items.find((x) => x.id === id);
    if (!p) return;
    sheetId = id;
    $("#sheet-content").innerHTML = `
      <p class="sheet-eyebrow">${esc(t("proj.org." + p.ctx))}${p.badge ? " · " + esc(tx(p.badge)) : ""}</p>
      <h2 id="sheet-title">${esc(tx(p.title))}</h2>
      <p class="sheet-lead">${esc(tx(p.desc))}</p>
      ${p.metrics ? `<div class="pc-metrics">${p.metrics.map((m) => `<div><b>${esc(tx(m.value))}</b><span>${esc(tx(m.label))}</span></div>`).join("")}</div>` : ""}
      <h3>${esc(t("proj.steps"))}</h3>
      <ul class="sheet-points">${p.points.map((x) => `<li>${esc(tx(x))}</li>`).join("")}</ul>
      <h3>${esc(t("proj.env"))}</h3>
      <div class="tags">${p.env.map((e) => `<span class="tag">${esc(e)}</span>`).join("")}</div>
      ${p.link ? `<p class="sheet-link"><a class="btn btn-primary" href="${esc(p.link.href)}" target="_blank" rel="noopener">${esc(tx(p.link.label))} <span aria-hidden="true">↗</span></a></p>` : ""}`;
    if (!sheet.open) {
      if (sheet.showModal) sheet.showModal(); else sheet.setAttribute("open", "");
    }
    sheet.scrollTop = 0;
  }
  sheet.addEventListener("close", () => { sheetId = null; });
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });   // clic sur le fond

  /* ------------------------------ Événements ---------------------------- */
  document.addEventListener("click", (e) => {
    const f = e.target.closest("[data-filter]");
    if (f) {
      filter = f.dataset.filter;
      $$("[data-filter]").forEach((b) => { const on = b === f; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      $$(".pc").forEach((c) => { c.hidden = filter !== "all" && c.dataset.ctx !== filter; });
      return;
    }
    const card = e.target.closest(".pc");
    if (card && !e.target.closest("a")) { openSheet(card.dataset.id); return; }
    const cp = e.target.closest("[data-copy]");
    if (cp) {
      const done = () => { cp.textContent = t("contact.copied"); cp.classList.add("done"); setTimeout(() => { cp.textContent = t("contact.copy"); cp.classList.remove("done"); }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(cp.dataset.copy).then(done, () => {});
      return;
    }
    if (e.target.closest("#nav-links a")) document.body.classList.remove("nav-open");
  });

  $("#theme-toggle").addEventListener("click", () => PF.toggleTheme());
  $("#lang-toggle").addEventListener("click", () => PF.setLang(PF.lang === "fr" ? "en" : "fr"));
  $("#burger").addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    $("#burger").setAttribute("aria-expanded", open);
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") document.body.classList.remove("nav-open"); });

  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 24);
  addEventListener("scroll", onScroll, { passive: true });

  // Scrollspy : section courante surlignée dans la navigation.
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      activeSec = e.target.id;
      $$("#nav-links a").forEach((a) => a.classList.toggle("on", a.dataset.sec === activeSec));
    }), { rootMargin: "-45% 0px -50% 0px" });
    SECTIONS.forEach((s) => spy.observe($("#" + s.id)));
  }

  PF.onLang(() => { render(false); if (sheetId) openSheet(sheetId); });

  /* ---------------- Nom qui s'envole du hero vers le menu ---------------- */
  /**
   * En haut de page, le coin haut-gauche est vide : seul le grand nom du hero
   * est visible. En défilant, ce nom remonte, rétrécit et glisse jusqu'au coin
   * haut-gauche, où il devient le nom du menu. Animation liée au défilement
   * (elle se rejoue à l'envers en remontant). Un clone en position fixe fait le
   * trajet ; l'original garde sa place dans la page.
   */
  function flyingName() {
    const hero = $(".hero-name"), slot = $(".brand-name");
    if (!hero || !slot) return;

    // Animations réduites : pas de vol, le logo apparaît simplement une fois le hero passé.
    if (reduced) {
      document.body.classList.add("brand-fade");
      const tick = () => document.body.classList.toggle("brand-on", scrollY > hero.getBoundingClientRect().height + hero.offsetTop * 0.5);
      addEventListener("scroll", tick, { passive: true });
      tick();
      return;
    }

    const fly = hero.cloneNode(true);
    fly.classList.add("fly-name");
    fly.setAttribute("aria-hidden", "true");
    document.body.appendChild(fly);
    document.body.classList.add("has-fly");

    let top0 = 0, left0 = 0, h0 = 0, fs = 1, ts = 1, raf = 0;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const update = () => {
      raf = 0;
      const sr = slot.getBoundingClientRect();
      const k1 = ts / fs;
      // Trajet complet = défilement nécessaire pour que le nom atteigne le menu.
      const dist = Math.max(160, top0 - sr.top);
      const p = Math.min(1, Math.max(0, scrollY / dist));
      const e = ease(p);
      const x0 = left0, y0 = top0 - scrollY;                       // position "naturelle" dans la page
      const x1 = sr.left, y1 = sr.top + (sr.height - h0 * k1) / 2;  // emplacement du logo
      const k = 1 + (k1 - 1) * e;
      fly.style.transform = `translate(${x0 + (x1 - x0) * e}px, ${y0 + (y1 - y0) * e}px) scale(${k})`;
      document.body.classList.toggle("name-docked", p >= 1);
    };
    const measure = () => {
      fly.style.transform = "none";
      const r = hero.getBoundingClientRect();
      top0 = r.top + scrollY; left0 = r.left; h0 = r.height;
      fs = parseFloat(getComputedStyle(hero).fontSize);
      ts = parseFloat(getComputedStyle(slot).fontSize);
      update();
    };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener("resize", measure);
    $("#nav").addEventListener("transitionend", update);           // le menu se resserre au défilement
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }

  /* -------------------------------- Boot -------------------------------- */
  render(true);
  onScroll();
  network();
  flyingName();
  if (location.hash) { const target = $(location.hash); if (target) target.scrollIntoView(); }
})(window.PF = window.PF || {});
