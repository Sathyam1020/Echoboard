/* Echoboard widget loader.
 *
 * Drop on any host SaaS page:
 *   <script src="https://echoboard.io/widget.js"
 *           data-board-id="<boardId>" async></script>
 *
 * Then optionally identify the host's signed-in user:
 *   echoboard.identify({ token: '<HMAC-signed-on-your-backend>' })
 *   // or unsigned (lower trust):
 *   echoboard.identify({ externalId: 'user_42', email: 'a@b.com', name: 'Alice' })
 *
 * The loader stores the resulting visitor token in 1st-party localStorage
 * (host-page origin) and forwards it to the iframe via postMessage. The
 * iframe uses Bearer auth for every API call, so this whole flow survives
 * Safari ITP and 3rd-party-cookie blocking.
 */
(function () {
  if (typeof window === "undefined") return
  if (window.echoboard && window.echoboard.__loaded) return

  // The widget panel is itself an iframe pointed at /widget/<boardId>. If
  // this script ever gets loaded inside that iframe (e.g. a customer drops
  // the <script> tag in a root layout that wraps every route), it would
  // mount a recursive floating button inside the open panel. Bail.
  try {
    if (
      window.top !== window.self &&
      window.location &&
      /^\/widget\//.test(window.location.pathname)
    ) {
      return
    }
  } catch (e) { /* cross-origin window.top access — not our iframe, continue */ }

  function findSelfScript() {
    if (document.currentScript) return document.currentScript
    var scripts = document.getElementsByTagName("script")
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (/widget\.js(\?.*)?$/.test(scripts[i].src)) return scripts[i]
    }
    return null
  }

  var self = findSelfScript()
  if (!self) {
    console.warn("[echoboard] could not locate widget script tag")
    return
  }
  var boardId = self.dataset.boardId
  if (!boardId) {
    console.warn("[echoboard] missing data-board-id")
    return
  }
  var origin = (function () {
    try { return new URL(self.src).origin } catch (e) { return "" }
  })()

  var STORAGE_KEY = "eb_visitor_token:" + boardId

  // Visitor token persistence — host-page localStorage, 1st-party.
  function getStoredToken() {
    try { return localStorage.getItem(STORAGE_KEY) } catch (e) { return null }
  }
  function setStoredToken(t) {
    try {
      if (t) localStorage.setItem(STORAGE_KEY, t)
      else localStorage.removeItem(STORAGE_KEY)
    } catch (e) { /* private mode — no-op */ }
  }

  var visitorToken = getStoredToken()
  // workspaceId is needed for the identify() body. Fetched from
  // /api/widget/:boardId/config below; identify() calls before it resolves
  // are queued.
  var workspaceId = null

  // Position + colour can be overridden inline as data attrs; the iframe
  // also fetches the server-side config so customisations applied in the
  // dashboard always win on the panel itself.
  var position = self.dataset.position || "bottom-right"
  var color = self.dataset.color || null
  var buttonText = self.dataset.buttonText || "Feedback"

  // Container — shadow root keeps host CSS sandboxed.
  var host = document.createElement("div")
  host.style.cssText =
    "all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483646;"
  document.body.appendChild(host)
  var root = host.attachShadow({ mode: "open" })

  // Styles (scoped via shadow root)
  var style = document.createElement("style")
  style.textContent = [
    ":host{all:initial;}",
    "*{box-sizing:border-box;font-family:'Inter','Segoe UI',sans-serif;}",
    ".btn{position:fixed;bottom:20px;display:inline-flex;align-items:center;gap:8px;",
    "padding:10px 16px;border-radius:9999px;border:none;cursor:pointer;",
    "background:var(--ebw-color, #262626);color:#fff;font-size:13px;font-weight:500;",
    "box-shadow:0 4px 12px rgba(0,0,0,0.18),0 1px 3px rgba(0,0,0,0.10);",
    "pointer-events:auto;transition:transform .15s ease,box-shadow .15s ease;}",
    ".btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,0.22);}",
    ".btn-right{right:20px;} .btn-left{left:20px;}",
    ".btn svg{width:14px;height:14px;}",
    ".panel{position:fixed;bottom:80px;width:400px;height:580px;max-height:calc(100vh - 100px);",
    "border-radius:14px;overflow:hidden;background:#fff;",
    "box-shadow:0 12px 40px rgba(0,0,0,0.18),0 2px 8px rgba(0,0,0,0.10);",
    "pointer-events:auto;transform:translateY(8px) scale(.98);opacity:0;",
    "transition:transform .18s ease,opacity .18s ease;}",
    ".panel-right{right:20px;} .panel-left{left:20px;}",
    ".panel.open{transform:none;opacity:1;}",
    ".panel iframe{width:100%;height:100%;border:0;display:block;background:#fff;}",
    "@media(max-width:640px){.panel{width:calc(100vw - 24px);height:calc(100vh - 100px);left:12px!important;right:12px!important;bottom:72px;}}",
    "@media(max-width:640px){.btn{bottom:14px;}}",
  ].join("")
  root.appendChild(style)

  var btn = document.createElement("button")
  btn.className = "btn btn-right"
  btn.setAttribute("aria-label", buttonText)
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
    '<span class="ebw-label"></span>'
  var labelEl = btn.querySelector(".ebw-label")
  labelEl.textContent = buttonText

  var panel = null
  var iframe = null
  var isOpen = false
  var iframeReady = false

  function applyPosition() {
    btn.classList.toggle("btn-left", position === "bottom-left")
    btn.classList.toggle("btn-right", position !== "bottom-left")
    if (panel) {
      panel.classList.toggle("panel-left", position === "bottom-left")
      panel.classList.toggle("panel-right", position !== "bottom-left")
    }
  }
  function applyColor() {
    if (color) host.style.setProperty("--ebw-color", color)
  }
  applyPosition()
  applyColor()

  // Server-side config: button text, color, position, workspace id.
  fetch(origin + "/api/widget/" + encodeURIComponent(boardId) + "/config")
    .then(function (r) { return r.ok ? r.json() : null })
    .then(function (cfg) {
      if (!cfg) return
      workspaceId = cfg.workspaceId
      if (!self.dataset.position && cfg.position) position = cfg.position
      if (!self.dataset.color && cfg.color) color = cfg.color
      if (!self.dataset.buttonText && cfg.buttonText) buttonText = cfg.buttonText
      applyPosition()
      applyColor()
      labelEl.textContent = buttonText
      flushPendingIdentify()
    })
    .catch(function () {})

  function ensurePanel() {
    if (panel) return
    panel = document.createElement("div")
    panel.className =
      "panel " + (position === "bottom-left" ? "panel-left" : "panel-right")
    iframe = document.createElement("iframe")
    iframe.src = origin + "/widget/" + encodeURIComponent(boardId)
    iframe.title = "Feedback widget"
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms allow-popups",
    )
    panel.appendChild(iframe)
    root.appendChild(panel)
  }

  function postToIframe(msg) {
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(msg, origin)
    }
  }

  function sendTokenToIframe() {
    postToIframe({ type: "echoboard:visitor-token", token: visitorToken })
  }

  function open() {
    ensurePanel()
    requestAnimationFrame(function () {
      panel.classList.add("open")
    })
    isOpen = true
  }
  function close() {
    if (!panel) return
    panel.classList.remove("open")
    isOpen = false
  }

  btn.addEventListener("click", function () {
    if (isOpen) close()
    else open()
  })
  root.appendChild(btn)

  // Iframe ↔ loader messaging.
  window.addEventListener("message", function (e) {
    if (e.origin !== origin) return
    if (!e.data || typeof e.data !== "object") return
    if (e.data.type === "echoboard:close") {
      close()
    } else if (e.data.type === "echoboard:ready") {
      iframeReady = true
      sendTokenToIframe()
    } else if (e.data.type === "echoboard:visitor-token-set") {
      // Iframe completed a guest signup inline — capture so the token
      // persists across panel reopens.
      visitorToken = e.data.token || null
      setStoredToken(visitorToken)
    }
  })

  // identify() public API.
  // Queue identify calls that happen before the config fetch resolves
  // (and therefore before we know workspaceId).
  var pendingIdentify = null

  function flushPendingIdentify() {
    if (!pendingIdentify || !workspaceId) return
    var p = pendingIdentify
    pendingIdentify = null
    runIdentify(p.payload).catch(function (err) {
      console.warn("[echoboard] identify failed", err)
    })
  }

  function runIdentify(payload) {
    if (payload === null) {
      // Sign out
      visitorToken = null
      setStoredToken(null)
      sendTokenToIframe()
      return Promise.resolve()
    }
    if (!workspaceId) {
      pendingIdentify = { payload: payload }
      return Promise.resolve()
    }
    var body = Object.assign({ workspaceId: workspaceId }, payload)
    return fetch(origin + "/api/visitors/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (res) {
      if (!res.ok) {
        return res.json().then(
          function (b) {
            var msg =
              b && b.error && b.error.message
                ? b.error.message
                : res.status + " " + res.statusText
            throw new Error("identify failed: " + msg)
          },
          function () {
            throw new Error("identify failed: " + res.status)
          },
        )
      }
      return res.json()
    }).then(function (data) {
      visitorToken = (data && data.visitorToken) || null
      setStoredToken(visitorToken)
      if (iframeReady) sendTokenToIframe()
    })
  }

  window.echoboard = {
    __loaded: true,
    show: function () {
      open()
    },
    hide: close,
    destroy: function () {
      if (host && host.parentNode) host.parentNode.removeChild(host)
      delete window.echoboard
    },
    identify: function (payload) {
      return runIdentify(payload).catch(function (err) {
        console.warn("[echoboard] identify failed", err)
        throw err
      })
    },
  }
})()
