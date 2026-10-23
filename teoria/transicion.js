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
})();
