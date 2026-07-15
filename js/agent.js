/* ============================================================
   "Ramon" voice agent widget (Vapi) — shared across every site
   this template builds. Renders the bottom-right avatar + panel
   and drives a Vapi web call. Config lives in js/agent-config.js.
   The Vapi SDK is only downloaded when a call starts.
   ============================================================ */

(function () {
  "use strict";

  const cfg = Object.assign(
    {
      vapiPublicKey: "",
      vapiAssistantId: "",
      agentName: "Ramon",
      tagline: "Your concierge",
      bubbleText: "Hi, I'm Ramon — talk to me!",
      fallbackPhone: "{{PRIMARY_PHONE}}"
    },
    window.HR_AGENT_CONFIG || {}
  );

  const configured = Boolean(cfg.vapiPublicKey && cfg.vapiAssistantId);

  /* ---------- Ramon: illustrated agent avatar ---------- */
  const ramon = `
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="hraBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#35853f"/>
        <stop offset="1" stop-color="#183f20"/>
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="32" fill="url(#hraBg)"/>
    <path d="M10 64a22 15 0 0 1 44 0z" fill="#141d16"/>
    <path d="M25.5 48l6.5 8.5 6.5-8.5-3.2-3.2h-6.6z" fill="#faf6ee"/>
    <path d="M30.6 48.8h2.8l.7 4.4-2.1 5.2-2.1-5.2z" fill="#68bd45"/>
    <path d="M27.5 39.5h9v6.5a4.5 4.5 0 0 1-9 0z" fill="#eab984"/>
    <circle cx="18.6" cy="28" r="3.1" fill="#f2c48f"/>
    <circle cx="45.4" cy="28" r="3.1" fill="#f2c48f"/>
    <circle cx="32" cy="27" r="13.5" fill="#f6cd9a"/>
    <path d="M18.5 27.5c0-9.4 6-15 13.5-15s13.5 5.6 13.5 15c-1.6-4.2-3.1-5.9-4.6-7-2 1.9-4.9 2.7-8.9 2.7s-6.9-.8-8.9-2.7c-1.5 1.1-3 2.8-4.6 7z" fill="#33261b"/>
    <path d="M24.8 23.7c1.7-1.3 3.7-1.3 5.2 0M34 23.7c1.7-1.3 3.7-1.3 5.2 0" stroke="#33261b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <circle cx="27.4" cy="27.5" r="1.7" fill="#241a10"/>
    <circle cx="36.6" cy="27.5" r="1.7" fill="#241a10"/>
    <path d="M32 28.5v2.6c0 .7-.5 1.1-1.2 1.1" stroke="#d9a86e" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <path d="M27.3 33.6c2.9 2.7 6.5 2.7 9.4 0" stroke="#b0623d" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M18 26.5C18 17.9 24.3 12 32 12s14 5.9 14 14.5" stroke="#141d16" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <rect x="15.6" y="24.4" width="4.6" height="8.6" rx="2.3" fill="#141d16"/>
    <rect x="43.8" y="24.4" width="4.6" height="8.6" rx="2.3" fill="#141d16"/>
    <path d="M46 33c0 4.6-4.2 7.7-8.6 8" stroke="#141d16" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="36.8" cy="41.2" r="2.2" fill="#84cf63"/>
  </svg>`;

  const icons = {
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4m-4 0h8"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    end: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>',
    muteOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 9v5a3 3 0 0 0 5.12 2.12M15 9V5a3 3 0 0 0-5.94-.6M5 10v1a7 7 0 0 0 11 5.74M19 10v1a7 7 0 0 1-.11 1.23M12 18v4m-4 0h8M2 2l20 20"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.9 5.7L19.5 9l-5.6 1.9L12 16.5l-1.9-5.6L4.5 9l5.6-1.3L12 2Zm7 12l.95 2.85L22.8 18l-2.85.95L19 21.8l-.95-2.85L15.2 18l2.85-1.15L19 14Z"/></svg>'
  };

  const root = document.createElement("div");
  root.className = "hra-root";
  root.innerHTML = `
    <div class="hra-panel" role="dialog" aria-label="${cfg.agentName} — voice assistant">
      <div class="hra-head">
        <span class="hra-avatar">
          <span class="hra-avatar-img" aria-hidden="true">${ramon}</span>
          <span class="hra-ring"></span>
        </span>
        <div class="hra-head-name">
          <strong>${cfg.agentName}</strong>
          <span>${cfg.tagline}</span>
        </div>
        <span class="hra-status">
          <span class="hra-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
          <span id="hra-status-text" aria-live="polite">Online</span>
        </span>
      </div>
      <div class="hra-body">
        <p class="hra-copy hra-copy-idle">Hey, I'm <strong>${cfg.agentName}</strong> — <em>ask me anything</em>: listings, neighborhoods, what your home might be worth. I can even book you a time with {{TEAM_FIRST_NAMES}}.</p>
        <div class="hra-chips" aria-hidden="true">
          <span class="hra-chip">${icons.cal} Book an appointment</span>
          <span class="hra-chip">${icons.tag} What's my home worth?</span>
          <span class="hra-chip">${icons.home} Ask about a listing</span>
        </div>
        <div class="hra-transcript" id="hra-transcript" aria-live="polite"></div>
        <div class="hra-note" id="hra-note"></div>
        <div class="hra-actions">
          <button class="hra-btn hra-btn--start hra-idle-only" id="hra-start" type="button">
            ${icons.mic} Start voice chat
          </button>
          <button class="hra-btn hra-btn--mute hra-live-only" id="hra-mute" type="button" aria-label="Mute microphone" title="Mute microphone">
            ${icons.muteOn}
          </button>
          <button class="hra-btn hra-btn--end hra-live-only" id="hra-end" type="button">
            ${icons.end} End call
          </button>
        </div>
      </div>
      <div class="hra-foot">
        <span>Voice AI concierge</span>
        <span><b>{{SITE_NAME}}</b></span>
      </div>
    </div>
    <div class="hra-fab-wrap">
      <span class="hra-bubble" id="hra-bubble">
        <span class="hra-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="hra-bubble-text">${cfg.bubbleText.replace(cfg.agentName, `<em>${cfg.agentName}</em>`)}</span>
        <button class="hra-bubble-x" id="hra-bubble-x" type="button" aria-label="Dismiss">${icons.x}</button>
      </span>
      <button class="hra-fab" id="hra-fab" type="button" aria-expanded="false"
              aria-label="Talk to ${cfg.agentName}, our voice assistant">
        <span class="hra-fab-avatar" aria-hidden="true">${ramon}</span>
        <span class="hra-presence" aria-hidden="true"></span>
        <span class="hra-ic-close" aria-hidden="true">${icons.close}</span>
      </button>
    </div>`;
  document.body.appendChild(root);

  const $ = (id) => document.getElementById(id);
  const fab = $("hra-fab");
  const bubble = $("hra-bubble");
  const statusEl = $("hra-status-text");
  const transcriptEl = $("hra-transcript");
  const noteEl = $("hra-note");
  const startBtn = $("hra-start");
  const muteBtn = $("hra-mute");
  const endBtn = $("hra-end");
  const ring = root.querySelector(".hra-ring");

  /* ---------- Bubble: type, then speak ---------- */
  if (sessionStorage.getItem("hra_bubble_dismissed")) {
    bubble.classList.add("is-hidden");
  } else {
    setTimeout(() => bubble.classList.add("is-typed"), 2400);
  }

  $("hra-bubble-x").addEventListener("click", (e) => {
    e.stopPropagation();
    bubble.classList.add("is-hidden");
    sessionStorage.setItem("hra_bubble_dismissed", "1");
  });

  fab.addEventListener("click", () => {
    const open = root.classList.toggle("is-open");
    fab.setAttribute("aria-expanded", String(open));
    bubble.classList.add("is-hidden");
    sessionStorage.setItem("hra_bubble_dismissed", "1");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("is-open")) {
      root.classList.remove("is-open");
      fab.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Call state ---------- */
  let vapi = null;
  let live = false;

  function setStatus(text) { statusEl.textContent = text; }

  function showNote(msg, isError) {
    noteEl.textContent = msg;
    noteEl.classList.add("is-visible");
    noteEl.classList.toggle("hra-note--error", Boolean(isError));
  }
  function hideNote() { noteEl.classList.remove("is-visible"); }

  function addLine(role, text, isFinal) {
    const cls = role === "user" ? "hra-line-user" : "hra-line-agent";
    let last = transcriptEl.lastElementChild;
    if (!last || last.dataset.role !== role || last.dataset.final === "1") {
      last = document.createElement("p");
      last.className = cls;
      last.dataset.role = role;
      transcriptEl.appendChild(last);
    }
    last.dataset.final = isFinal ? "1" : "0";
    last.innerHTML = role === "user" ? text : `<b>${cfg.agentName}:</b> ${text}`;
    while (transcriptEl.children.length > 8) transcriptEl.removeChild(transcriptEl.firstChild);
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
  }

  function enterLive() {
    live = true;
    root.classList.add("is-live");
    transcriptEl.innerHTML = "";
    hideNote();
  }

  function exitLive(message) {
    live = false;
    root.classList.remove("is-live", "is-speaking");
    setStatus("Online");
    startBtn.disabled = false;
    startBtn.innerHTML = `${icons.mic} Start voice chat`;
    muteBtn.classList.remove("is-muted");
    if (message) showNote(message);
  }

  async function startCall() {
    if (live) return;
    hideNote();

    if (!configured) {
      showNote(`${cfg.agentName} is warming up his voice — the line isn't connected just yet. Call us directly at ${cfg.fallbackPhone}, or try again soon!`);
      console.warn(
        "[voice agent] Not configured. Add your Vapi PUBLIC key and assistant ID in js/agent-config.js."
      );
      return;
    }

    try {
      startBtn.disabled = true;
      startBtn.innerHTML = "Connecting…";
      setStatus("Connecting…");

      if (!vapi) {
        const mod = await import("https://esm.sh/@vapi-ai/web");
        const Vapi = mod.default;
        vapi = new Vapi(cfg.vapiPublicKey);

        vapi.on("call-start", () => {
          enterLive();
          setStatus("Listening…");
        });
        vapi.on("call-end", () => exitLive(`Thanks for chatting with ${cfg.agentName}! Start again any time.`));
        vapi.on("speech-start", () => {
          if (!live) return;
          root.classList.add("is-speaking");
          setStatus(`${cfg.agentName} is speaking…`);
        });
        vapi.on("speech-end", () => {
          if (!live) return;
          root.classList.remove("is-speaking");
          setStatus("Listening…");
        });
        vapi.on("volume-level", (v) => {
          if (ring) ring.style.transform = `scale(${1 + Math.min(v || 0, 1) * 0.3})`;
        });
        vapi.on("message", (m) => {
          if (m && m.type === "transcript" && m.transcript) {
            addLine(m.role === "user" ? "user" : "agent", m.transcript, m.transcriptType === "final");
          }
        });
        vapi.on("error", (err) => {
          console.error("[voice agent]", err);
          exitLive(`Hmm, the line dropped. Please try again — or call us at ${cfg.fallbackPhone}.`);
        });
      }

      await vapi.start(cfg.vapiAssistantId);
    } catch (err) {
      console.error("[voice agent]", err);
      exitLive(
        err && String(err).toLowerCase().includes("permission")
          ? "We need microphone access for a voice chat — please allow it and try again."
          : `Couldn't connect just now. Please try again, or call us at ${cfg.fallbackPhone}.`
      );
    }
  }

  startBtn.addEventListener("click", startCall);

  endBtn.addEventListener("click", () => {
    if (vapi) vapi.stop();
    exitLive(`Thanks for chatting with ${cfg.agentName}! Start again any time.`);
  });

  muteBtn.addEventListener("click", () => {
    if (!vapi || !live) return;
    const muted = !vapi.isMuted();
    vapi.setMuted(muted);
    muteBtn.classList.toggle("is-muted", muted);
    muteBtn.setAttribute("aria-label", muted ? "Unmute microphone" : "Mute microphone");
    setStatus(muted ? "Muted" : "Listening…");
  });

  /* end the call if the visitor leaves the page */
  window.addEventListener("pagehide", () => { if (vapi && live) vapi.stop(); });
})();
