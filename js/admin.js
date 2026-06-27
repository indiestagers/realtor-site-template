/* ============================================================
   REALTOR SITE TEMPLATE — Back Office logic
   Demo build: auth is a client-side passcode and data persists
   to this browser's localStorage. Production needs a real
   backend (see README — Supabase upgrade path).
   ============================================================ */

(function () {
  "use strict";

  const PASSCODE = "{{ADMIN_PASSCODE}}"; // demo passcode — change before handoff
  const AUTH_KEY = "hr_admin_auth";
  const MAX_IMG_BYTES = 800 * 1024;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  let listings = HRData.getAll();
  let filter = "all";
  let search = "";
  let editingId = null;
  let pendingDeleteId = null;

  /* ---------- Auth ---------- */
  const gate = $("#gate");
  const app = $("#admin-app");

  function setAuthed(on) {
    gate.classList.toggle("is-authed", on);
    app.classList.toggle("is-authed", on);
    if (on) {
      sessionStorage.setItem(AUTH_KEY, "1");
      renderAll();
    } else {
      sessionStorage.removeItem(AUTH_KEY);
    }
  }

  $("#gate-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#gate-pass");
    if (input.value === PASSCODE) {
      setAuthed(true);
    } else {
      const err = $("#gate-error");
      err.textContent = "That passcode isn't right — please try again.";
      err.classList.add("is-visible");
      input.select();
    }
  });

  $("#btn-signout").addEventListener("click", () => setAuthed(false));

  if (sessionStorage.getItem(AUTH_KEY) === "1") setAuthed(true);

  /* ---------- Persistence ---------- */
  function persist() {
    HRData.saveAll(listings);
  }

  /* ---------- Stats ---------- */
  function renderStats() {
    $("#stat-sale").textContent = listings.filter((l) => l.status === "for-sale").length;
    $("#stat-pending").textContent = listings.filter((l) => l.status === "pending").length;
    $("#stat-sold").textContent = listings.filter((l) => l.status === "sold").length;
    $("#stat-featured").textContent = listings.filter((l) => l.featured && l.status !== "sold").length;
  }

  /* ---------- List ---------- */
  function rowHtml(l) {
    const sq = l.sqft ? Number(l.sqft).toLocaleString("en-US") : "—";
    const price = l.price ? HRData.money(l.price) : (l.status === "sold" ? "Undisclosed" : "Price on request");
    return `
    <div class="admin-row" data-id="${l.id}">
      <div class="admin-row__thumb">
        <img src="${l.image}" alt="" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=60'">
      </div>
      <div class="admin-row__addr">
        <strong>${l.address}${l.featured && l.status !== "sold" ? '<span class="star" title="Featured on homepage">★ Featured</span>' : ""}</strong>
        <span>${l.city}, ${l.state} ${l.zip || ""}</span>
      </div>
      <span class="status-badge status-badge--${l.status}">${HRData.statusLabel(l.status)}</span>
      <div class="admin-row__meta">
        <strong>${price}</strong>
        ${l.beds} bd · ${l.baths} ba · ${sq} sqft
      </div>
      <div class="admin-row__actions">
        <button class="icon-btn icon-btn--star ${l.featured ? "is-on" : ""}" data-act="star" title="${l.featured ? "Remove from featured" : "Feature on homepage"}" aria-label="Toggle featured">
          <svg viewBox="0 0 24 24" fill="${l.featured ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z"/></svg>
        </button>
        <button class="icon-btn" data-act="edit" title="Edit listing" aria-label="Edit listing">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </button>
        <button class="icon-btn icon-btn--danger" data-act="delete" title="Delete listing" aria-label="Delete listing">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </button>
      </div>
    </div>`;
  }

  function renderList() {
    const wrap = $("#admin-list");
    let view = listings;
    if (filter !== "all") view = view.filter((l) => l.status === filter);
    if (search) {
      const q = search.toLowerCase();
      view = view.filter((l) =>
        [l.address, l.city, l.state, l.zip, l.description].join(" ").toLowerCase().includes(q)
      );
    }
    $("#admin-count").textContent = `${view.length} of ${listings.length} listings`;
    if (!view.length) {
      wrap.innerHTML = `
        <div class="admin-empty">
          <h3>No listings here</h3>
          <p>${search ? "Nothing matches your search." : "Add your first listing and it appears on the public site instantly."}</p>
          <button class="btn btn--brass btn--sm" id="empty-add">+ Add a listing</button>
        </div>`;
      const b = $("#empty-add");
      if (b) b.addEventListener("click", () => openEditor());
      return;
    }
    wrap.innerHTML = view.map(rowHtml).join("");
  }

  $("#admin-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.closest(".admin-row").dataset.id;
    const act = btn.dataset.act;
    if (act === "edit") openEditor(id);
    if (act === "star") toggleFeatured(id);
    if (act === "delete") askDelete(id);
  });

  function toggleFeatured(id) {
    const l = listings.find((x) => x.id === id);
    if (!l) return;
    l.featured = !l.featured;
    persist();
    renderAll();
    hrToast(l.featured ? "Listing featured on the homepage." : "Removed from homepage featured.");
  }

  /* ---------- Filters / search ---------- */
  $$(".admin-toolbar .filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      filter = chip.dataset.filter;
      $$(".admin-toolbar .filter-chip").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      renderList();
    });
  });

  $("#admin-search").addEventListener("input", (e) => {
    search = e.target.value.trim();
    renderList();
  });

  /* ---------- Editor modal ---------- */
  const editorModal = $("#editor-modal");
  const form = $("#listing-form");

  function openEditor(id = null) {
    editingId = id;
    form.reset();
    $("#f-image").value = "";
    setPreview("");
    if (id) {
      const l = listings.find((x) => x.id === id);
      if (!l) return;
      $("#editor-title").innerHTML = "Edit <em>listing</em>";
      $("#f-address").value = l.address;
      $("#f-city").value = l.city;
      $("#f-state").value = l.state;
      $("#f-zip").value = l.zip || "";
      $("#f-status").value = l.status;
      $("#f-price").value = l.price ?? "";
      $("#f-beds").value = l.beds;
      $("#f-baths").value = l.baths;
      $("#f-sqft").value = l.sqft;
      $("#f-image").value = l.image.startsWith("data:") ? "" : l.image;
      $("#f-desc").value = l.description || "";
      $("#f-featured").checked = !!l.featured;
      setPreview(l.image);
    } else {
      $("#editor-title").innerHTML = "Add a <em>new listing</em>";
      $("#f-state").value = "KS";
      $("#f-status").value = "for-sale";
    }
    editorModal.classList.add("is-open");
    $("#f-address").focus();
  }

  function closeEditor() {
    editorModal.classList.remove("is-open");
    editingId = null;
    uploadedDataUrl = null;
  }

  $("#btn-add").addEventListener("click", () => openEditor());
  $("#editor-close").addEventListener("click", closeEditor);
  $("#editor-cancel").addEventListener("click", closeEditor);

  /* image preview + upload */
  let uploadedDataUrl = null;

  function setPreview(src) {
    const box = $("#img-preview");
    box.innerHTML = src
      ? `<img src="${src}" alt="Listing photo preview" onerror="this.parentElement.textContent='Image failed to load — check the URL'">`
      : "Photo preview appears here";
  }

  $("#f-image").addEventListener("input", (e) => {
    uploadedDataUrl = null;
    setPreview(e.target.value.trim());
  });

  $("#f-upload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMG_BYTES) {
      hrToast("Image too large — keep uploads under 800 KB, or paste a URL.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      uploadedDataUrl = reader.result;
      $("#f-image").value = "";
      setPreview(uploadedDataUrl);
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const existing = editingId ? listings.find((x) => x.id === editingId) : null;
    const image =
      uploadedDataUrl ||
      $("#f-image").value.trim() ||
      (existing ? existing.image : "") ||
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";

    const data = {
      id: editingId || (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now()),
      status: $("#f-status").value,
      address: $("#f-address").value.trim(),
      city: $("#f-city").value.trim(),
      state: $("#f-state").value.trim().toUpperCase(),
      zip: $("#f-zip").value.trim(),
      price: $("#f-price").value ? Number($("#f-price").value) : null,
      beds: Number($("#f-beds").value || 0),
      baths: Number($("#f-baths").value || 0),
      sqft: Number($("#f-sqft").value || 0),
      image,
      description: $("#f-desc").value.trim(),
      featured: $("#f-featured").checked
    };

    if (editingId) {
      listings = listings.map((l) => (l.id === editingId ? data : l));
      hrToast("Listing updated.");
    } else {
      listings.unshift(data);
      hrToast("Listing added — it's live on the site now.");
    }
    persist();
    closeEditor();
    renderAll();
  });

  /* ---------- Delete confirm ---------- */
  const confirmModal = $("#confirm-modal");

  function askDelete(id) {
    pendingDeleteId = id;
    const l = listings.find((x) => x.id === id);
    $("#confirm-text").textContent = l
      ? `"${l.address}, ${l.city}" will be removed from the site. This can't be undone.`
      : "";
    confirmModal.classList.add("is-open");
  }

  $("#confirm-cancel").addEventListener("click", () => {
    pendingDeleteId = null;
    confirmModal.classList.remove("is-open");
  });

  $("#confirm-delete").addEventListener("click", () => {
    listings = listings.filter((l) => l.id !== pendingDeleteId);
    pendingDeleteId = null;
    confirmModal.classList.remove("is-open");
    persist();
    renderAll();
    hrToast("Listing deleted.");
  });

  /* close modals on backdrop / Escape */
  [editorModal, confirmModal].forEach((m) =>
    m.addEventListener("click", (e) => {
      if (e.target === m) m.classList.remove("is-open");
    })
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      editorModal.classList.remove("is-open");
      confirmModal.classList.remove("is-open");
    }
  });

  /* ---------- Export / import / reset ---------- */
  $("#btn-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(listings, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "{{SLUG}}-listings.json";
    a.click();
    URL.revokeObjectURL(a.href);
    hrToast("Listings exported as JSON.");
  });

  $("#btn-import").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error("not an array");
        listings = parsed;
        persist();
        renderAll();
        hrToast(`Imported ${parsed.length} listings.`);
      } catch {
        hrToast("That file doesn't look like a listings export.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  $("#btn-reset").addEventListener("click", () => {
    HRData.reset();
    listings = HRData.getAll();
    renderAll();
    hrToast("Restored the original seed listings.");
  });

  /* ---------- Render all ---------- */
  function renderAll() {
    renderStats();
    renderList();
  }
})();
