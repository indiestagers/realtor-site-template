/* ============================================================
   REALTOR SITE TEMPLATE — Site behavior
   ============================================================ */

const HR_ICONS = {
  bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9V5m0 4h20m-20 0v10m20-10V5m0 4v10M2 16h20M5 9V7.5A1.5 1.5 0 0 1 6.5 6h3A1.5 1.5 0 0 1 11 7.5V9"/></svg>',
  bath: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2M2 12h20v2a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5v-2Zm4 7-1 2m14-2 1 2"/></svg>',
  sqft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9V3h6M21 15v6h-6M3 3l7 7m11 11-7-7"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z"/><path d="M9 22V12h6v10"/></svg>'
};

/* ---------- Header ---------- */
function hrInitHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = header.querySelector(".nav__toggle");
  const links = header.querySelector(".nav__links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-locked", open);
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-locked");
      })
    );
  }
}

/* ---------- Hero: "empty room becomes home" scroll wipe ---------- */
function hrInitHeroStage() {
  const stage = document.querySelector(".hero-stage");
  if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const hero = stage.querySelector(".hero--story");
  const before = stage.querySelector(".hero__before");
  const seam = stage.querySelector(".hero__seam");
  if (!hero || !before || !seam) return;

  const clamp = (value) => Math.max(0, Math.min(1, value));
  let ticking = false;

  const update = () => {
    const rect = stage.getBoundingClientRect();
    const distance = Math.max(1, stage.offsetHeight - hero.offsetHeight);
    const progress = clamp(-rect.top / distance);
    const complete = progress > 0.985;
    before.style.clipPath = `inset(0 ${progress * 100}% 0 0)`;
    before.style.visibility = complete ? "hidden" : "visible";
    seam.style.left = `${progress * 100}%`;
    seam.style.opacity = complete ? "0" : "0.95";
    ticking = false;
  };

  const requestUpdate = () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
}

/* ---------- Scroll reveal ---------- */
function hrInitReveal() {
  const items = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));
}

/* ---------- Listing card renderer ---------- */
function hrListingCard(l) {
  const chipClass = { "for-sale": "chip--sale", pending: "chip--pending", sold: "chip--sold" }[l.status] || "";
  const sq = l.sqft ? Number(l.sqft).toLocaleString("en-US") : "—";
  const baths = l.baths % 1 ? l.baths : `${l.baths}`;
  return `
  <article class="listing-card">
    <div class="listing-card__media">
      <img src="${l.image}" alt="${l.address}, ${l.city}, ${l.state}" loading="lazy"
           onerror="this.src='https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80'">
      <div class="listing-card__chips">
        <span class="chip ${chipClass}">${HRData.statusLabel(l.status)}</span>
        <span class="listing-card__price">${HRData.formatPrice(l)}</span>
      </div>
    </div>
    <div class="listing-card__body">
      <h3 class="listing-card__addr">${l.address}</h3>
      <p class="listing-card__loc">${HR_ICONS.pin} ${l.city}, ${l.state} ${l.zip || ""}</p>
      ${l.description ? `<p class="listing-card__desc">${l.description}</p>` : ""}
      <div class="listing-card__meta">
        <span>${HR_ICONS.bed} ${l.beds} bd</span>
        <span>${HR_ICONS.bath} ${baths} ba</span>
        <span>${HR_ICONS.sqft} ${sq} sqft</span>
      </div>
    </div>
  </article>`;
}

/* ---------- Homepage: featured + sold rails ---------- */
function hrRenderHome() {
  const featuredWrap = document.getElementById("featured-grid");
  const soldWrap = document.getElementById("sold-rail");
  if (!featuredWrap && !soldWrap) return;

  const all = HRData.getAll();

  if (featuredWrap) {
    let featured = all.filter((l) => l.status !== "sold" && l.featured);
    if (!featured.length) featured = all.filter((l) => l.status !== "sold");
    featured = featured.slice(0, 3);
    if (featured.length) {
      featuredWrap.innerHTML = featured.map(hrListingCard).join("");
    } else {
      featuredWrap.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="ic">${HR_ICONS.home}</div>
          <h3>New listings are on the way</h3>
          <p>Our next homes are being prepared for market right now. Call us to hear about them first.</p>
        </div>`;
    }
  }

  if (soldWrap) {
    const sold = all.filter((l) => l.status === "sold").slice(0, 8);
    soldWrap.innerHTML = sold
      .map(
        (l) => `
      <article class="sold-card">
        <img src="${l.image}" alt="${l.address}, ${l.city}, ${l.state}" loading="lazy">
        <div class="sold-card__body">
          <span class="chip chip--sold">Sold</span>
          <h3 class="sold-card__addr">${l.address}</h3>
          <p class="sold-card__meta">${l.city}, ${l.state} · ${l.beds} bd · ${l.baths} ba · ${Number(l.sqft).toLocaleString("en-US")} sqft</p>
        </div>
      </article>`
      )
      .join("");
  }
}

/* ---------- Listings page ---------- */
function hrRenderListingsPage() {
  const grid = document.getElementById("listings-grid");
  if (!grid) return;

  const chips = document.querySelectorAll(".filter-chip");
  const sortSel = document.getElementById("sort-select");
  const countEl = document.getElementById("listing-count");

  const params = new URLSearchParams(location.search);
  let activeFilter = params.get("filter") || "all";

  function apply() {
    let list = HRData.getAll();
    if (activeFilter !== "all") list = list.filter((l) => l.status === activeFilter);

    const sort = sortSel ? sortSel.value : "newest";
    if (sort === "price-desc") list.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "price-asc") list.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    if (sort === "sqft-desc") list.sort((a, b) => (b.sqft || 0) - (a.sqft || 0));

    if (countEl) countEl.textContent = `${list.length} ${list.length === 1 ? "home" : "homes"}`;

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="ic">${HR_ICONS.home}</div>
          <h3>Nothing here just yet</h3>
          <p>${activeFilter === "for-sale"
            ? "Our next listings are being prepared for market. Reach out and we'll tell you what's coming before it hits the MLS."
            : "No homes match this filter right now — try another view."}</p>
          <a class="btn btn--brass" href="index.html#contact">Talk to us ${HR_ICONS.check}</a>
        </div>`;
      return;
    }
    grid.innerHTML = list.map(hrListingCard).join("");
  }

  chips.forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.filter === activeFilter));
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      const url = new URL(location.href);
      if (activeFilter === "all") url.searchParams.delete("filter");
      else url.searchParams.set("filter", activeFilter);
      history.replaceState(null, "", url);
      apply();
    });
  });
  if (sortSel) sortSel.addEventListener("change", apply);
  apply();
}

/* ---------- Contact form (demo handler) ---------- */
function hrInitContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const success = form.querySelector(".form-success");
    btn.disabled = true;
    btn.textContent = "Sending…";
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = "Send message";
      success.classList.add("is-visible");
      success.textContent = "Thank you — your message is on its way. We typically reply the same day.";
      form.reset();
      success.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 900);
  });
}

/* ---------- Toast (shared) ---------- */
function hrToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.innerHTML = `${HR_ICONS.check}<span>${msg}</span>`;
  toast.classList.add("is-visible");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("is-visible"), 3400);
}

document.addEventListener("DOMContentLoaded", () => {
  hrInitHeader();
  hrInitHeroStage();
  hrRenderHome();
  hrRenderListingsPage();
  hrInitContactForm();
  hrInitReveal(); // last, so rendered cards get observed
});
