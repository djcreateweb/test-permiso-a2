(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.documentElement.classList.add("tx-js");

  const BLOQUES = [
    ".hero > *", ".t-hero > div > *", ".t-hero .portada", ".caja-uso", ".sec", ".stats .stat", ".modos .modo", ".temas .tema",
    ".caps .cap-env", ".pie-nota", ".l-cab", ".progreso", ".leyenda", ".voz-barra:not(.oculto)", ".hoja", ".l-nav",
    ".test-cab", ".tarjeta", ".resultado > *", ".r-lista > *", ".fall-cab", ".f-lista > *"
  ].join(",");
  const CONTADORES = ".stat b, .cap .estado > b, .r-num span, #lPct, #txtProgreso";

  let ultimoToque = null;
  document.addEventListener("pointerdown", e => {
    if (e.target.closest(".nav-btn, .tab, .marca, [data-vista], [data-ir], [data-leer], [data-ir-test], .btn-pri, .btn-sec, .modo, .tema, .cap"))
      ultimoToque = { x: e.clientX, y: e.clientY, t: Date.now() };
  }, true);

  function barrido() {
    const o = ultimoToque && Date.now() - ultimoToque.t < 1500 ? ultimoToque : { x: innerWidth / 2, y: 80 };
    ultimoToque = null;
    const w = document.createElement("div");
    w.className = "tx-barrido";
    w.style.setProperty("--x", o.x + "px");
    w.style.setProperty("--y", o.y + "px");
    document.body.appendChild(w);
    w.addEventListener("animationend", () => w.remove(), { once: true });
    setTimeout(() => w.remove(), 1200);
  }

  function contar(el) {
    if (el.dataset.txContando) return;
    const txt = el.textContent;
    const m = txt.match(/\d+/);
    if (!m) return;
    const fin = Number(m[0]);
    if (!fin) return;
    el.dataset.txContando = "1";
    const antes = txt.slice(0, m.index), despues = txt.slice(m.index + m[0].length);
    const dur = Math.min(1100, 450 + fin * 6);
    const t0 = performance.now();
    const paso = t => {
      const k = Math.min(1, (t - t0) / dur);
      const v = Math.round(fin * (1 - Math.pow(1 - k, 3)));
      el.textContent = antes + v + despues;
      if (k < 1) requestAnimationFrame(paso);
      else { el.textContent = txt; delete el.dataset.txContando; }
    };
    requestAnimationFrame(paso);
  }

  function construir(vista) {
    const els = [...vista.querySelectorAll(BLOQUES)].filter(el => el.offsetParent !== null);
    let n = 0;
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      const visible = r.top < innerHeight + 40;
      el.classList.remove("tx-in");
      void el.offsetWidth;
      el.style.setProperty("--tx-d", visible ? 200 + Math.min(n++ * 55, 700) + "ms" : "0ms");
      el.classList.add("tx-in");
      const quitar = e => { if (e.target !== el) return; el.classList.remove("tx-in"); el.removeEventListener("animationend", quitar); };
      el.addEventListener("animationend", quitar);
    });
    setTimeout(() => vista.querySelectorAll(CONTADORES).forEach(contar), 380);
  }

  const vistas = [...document.querySelectorAll(".vista")];
  let actual = vistas.find(v => v.classList.contains("activa"));
  const obs = new MutationObserver(() => {
    const nueva = vistas.find(v => v.classList.contains("activa"));
    if (!nueva || nueva === actual) return;
    actual = nueva;
    barrido();
    construir(nueva);
  });
  vistas.forEach(v => obs.observe(v, { attributes: true, attributeFilter: ["class"] }));
  if (actual) requestAnimationFrame(() => construir(actual));
  const TOCABLES = "button, a.btn-sec, a.btn-pri, a.nav-btn, .cap, .tema, .modo, .op, .tab, .flecha";
  document.addEventListener("pointerdown", e => {
    const el = e.target.closest(TOCABLES);
    if (!el || el.disabled || el.closest(".puntos")) return;
    if (navigator.vibrate) { try { navigator.vibrate(6); } catch (x) {} }
    const cs = getComputedStyle(el);
    if (cs.position === "static") el.style.position = "relative";
    if (cs.overflow !== "hidden") el.style.overflow = "hidden";
    const r = el.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 2.2;
    const o = document.createElement("span");
    o.className = "tx-onda";
    o.style.width = o.style.height = d + "px";
    o.style.left = e.clientX - r.left - d / 2 + "px";
    o.style.top = e.clientY - r.top - d / 2 + "px";
    el.appendChild(o);
    o.addEventListener("animationend", () => o.remove(), { once: true });
    setTimeout(() => o.remove(), 900);
  }, { passive: true });

  function escalonar(els, base, paso, tope, clase) {
    els.forEach((el, i) => {
      el.classList.remove(clase);
      void el.offsetWidth;
      el.style.setProperty("--tx-d", base + Math.min(i * paso, tope) + "ms");
      el.classList.add(clase);
      const quitar = ev => { if (ev.target !== el) return; el.classList.remove(clase); el.removeEventListener("animationend", quitar); };
      el.addEventListener("animationend", quitar);
    });
  }
  function rebote(el) {
    if (!el) return;
    el.classList.remove("tx-bump");
    void el.offsetWidth;
    el.classList.add("tx-bump");
  }
  function brillo(barra) {
    if (!barra) return;
    barra.classList.remove("tx-brillo");
    void barra.offsetWidth;
    barra.classList.add("tx-brillo");
  }
  function llenarBarras(raiz) {
    const barras = [...raiz.querySelectorAll(".pct-barra > span, #barraTotal")];
    barras.forEach((b, i) => {
      const fin = b.style.width;
      if (!fin || parseFloat(fin) === 0) return;
      b.style.transition = "none";
      b.style.width = "0%";
      void b.offsetWidth;
      b.style.transition = "";
      b.style.transitionDelay = 250 + Math.min(i * 45, 700) + "ms";
      b.style.width = fin;
      setTimeout(() => { b.style.transitionDelay = ""; brillo(b); }, 900 + Math.min(i * 45, 700));
    });
  }

  if (typeof pintar === "function") {
    const pintarPrevio = pintar;
    let anterior = { c: -1, p: -1 };
    pintar = function (d) {
      pintarPrevio(d);
      const hojaEl = document.getElementById("hoja");
      const dir = d === undefined || d === 0 ? 0 : d;
      const piezas = [...hojaEl.querySelectorAll(":scope > *, :scope ul > li, .galeria figure, tbody tr")]
        .filter(el => !el.matches("ul") && el.getBoundingClientRect().top < innerHeight + 60);
      hojaEl.style.setProperty("--tx-x", dir > 0 ? "16px" : dir < 0 ? "-16px" : "0px");
      escalonar(piezas, 60, 32, 420, "tx-mini");
      const cap = CAPITULOS[pos.c];
      const hechas = typeof vistasCap === "function" ? vistasCap(cap) : [];
      document.querySelectorAll("#puntos button").forEach((b, k) => b.classList.toggle("hecha", hechas.includes(k)));
      if (anterior.c !== pos.c || anterior.p !== pos.p) {
        brillo(document.getElementById("lBarra"));
        rebote(document.getElementById("lPct"));
        const flecha = dir > 0 ? document.getElementById("btnSig") : dir < 0 ? document.getElementById("btnAnt") : null;
        if (flecha) { flecha.classList.remove("tx-empuje-der", "tx-empuje-izq"); void flecha.offsetWidth; flecha.classList.add(dir > 0 ? "tx-empuje-der" : "tx-empuje-izq"); }
      }
      anterior = { c: pos.c, p: pos.p };
    };
  }

  const opciones = document.getElementById("tOpciones");
  if (opciones) {
    new MutationObserver(muts => {
      if (!muts.some(m => m.addedNodes.length)) return;
      const tarjeta = opciones.closest(".tarjeta");
      const piezas = [tarjeta.querySelector(".figura"), document.getElementById("tTema"), document.getElementById("tPregunta"), ...opciones.children];
      escalonar(piezas.filter(Boolean), 0, 60, 400, "tx-mini");
      rebote(document.getElementById("tNum"));
      brillo(document.getElementById("tBarra"));
    }).observe(opciones, { childList: true });
  }

  document.querySelectorAll(".contador, #tMarcador").forEach(c => {
    let previo = c.textContent;
    new MutationObserver(() => {
      if (c.textContent === previo) return;
      previo = c.textContent;
      rebote(c);
    }).observe(c, { childList: true, characterData: true, subtree: true });
  });

  const tabbar = document.querySelector(".tabbar");
  let indicador = null;
  function moverIndicador() {
    if (!tabbar) return;
    const on = tabbar.querySelector(".tab.on");
    if (!indicador) { indicador = document.createElement("span"); indicador.className = "tab-ind"; tabbar.appendChild(indicador); }
    if (!on) { indicador.style.opacity = "0"; return; }
    const rb = tabbar.getBoundingClientRect(), rt = on.getBoundingClientRect();
    indicador.style.opacity = "1";
    indicador.style.transform = `translateX(${rt.left - rb.left + rt.width / 2 - 3}px)`;
  }
  if (tabbar) {
    tabbar.querySelectorAll(".tab").forEach(t => new MutationObserver(moverIndicador).observe(t, { attributes: true, attributeFilter: ["class"] }));
    window.addEventListener("resize", moverIndicador);
    setTimeout(moverIndicador, 300);
  }

  const vistaPortada = document.getElementById("vPortada");
  new MutationObserver(() => { if (vistaPortada.classList.contains("activa")) llenarBarras(vistaPortada); })
    .observe(vistaPortada, { attributes: true, attributeFilter: ["class"] });
  if (vistaPortada.classList.contains("activa")) setTimeout(() => llenarBarras(vistaPortada), 50);
})();
