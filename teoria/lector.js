const CLAVE_LEIDO = "a2_teoria_leido_v1";
const CLAVE_POS_TEORIA = "a2_teoria_pos_v1";
const ETIQUETAS = { clave: "Clave de examen", ojo: "Ojo · pregunta trampa", novedad: "Novedad 2026", consejo: "Consejo práctico" };
const ENLACES = [
  ["Real Decreto 518/2026 en el BOE", "https://www.boe.es/eli/es/rd/2026/06/24/518"],
  ["dgt.es", "https://www.dgt.es"]
];

const vPortada = document.getElementById("vPortada");
const vLector = document.getElementById("vLector");
const hoja = document.getElementById("hoja");
const lChip = document.getElementById("lChip");
const lTitulo = document.getElementById("lTitulo");
const lPag = document.getElementById("lPag");
const lBarra = document.getElementById("lBarra");
const puntos = document.getElementById("puntos");
const btnAnt = document.getElementById("btnAnt");
const btnSig = document.getElementById("btnSig");

function leer(clave, def) {
  try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : def; } catch (e) { return def; }
}
function guardar(clave, v) {
  try { localStorage.setItem(clave, JSON.stringify(v)); } catch (e) {}
}

let leido = leer(CLAVE_LEIDO, {});
Object.keys(leido).forEach(k => { if (!Array.isArray(leido[k])) leido[k] = []; });
// v2: se añadió el capítulo 19 (trucos); el banco y el plan pasan a 20 y 21
if (!leer("a2_teoria_v2", false)) {
  if (leido[20]) leido[21] = leido[20];
  if (leido[19]) leido[20] = leido[19];
  delete leido[19];
  guardar(CLAVE_LEIDO, leido);
  const pv = leer(CLAVE_POS_TEORIA, null);
  if (pv && pv.c >= 18) { pv.c += 1; guardar(CLAVE_POS_TEORIA, pv); }
  guardar("a2_teoria_v2", true);
}

function pctCap(cap) {
  const v = (leido[cap.n] || []).filter(p => p < cap.paginas.length).length;
  return Math.round((v / cap.paginas.length) * 100);
}
let pos = { c: 0, p: 0 };

function paginar(cap) {
  const paginas = [];
  let actual = [];
  cap.bloques.forEach(b => {
    if (b.t === "h2" && actual.length) { paginas.push(actual); actual = []; }
    actual.push(b);
  });
  if (actual.length) paginas.push(actual);
  if (paginas.length > 1) {
    const primera = paginas[0];
    const ligera = primera[0].t !== "h2" && primera.length <= 2 && !primera.some(b => b.t === "imgs" || b.t === "tabla");
    if (ligera) paginas.splice(0, 2, primera.concat(paginas[1]));
  }
  if (!paginas.length) paginas.push([]);
  return paginas;
}

CAPITULOS.forEach((c, ci) => { c.bloques.forEach((b, bi) => { b._id = `${ci}-${bi}`; }); c.paginas = paginar(c); });

const CLAVE_KW = "a2_subrayado_v1";
const KW_PALABRAS = ["en ningún caso", "en todo caso", "como mínimo", "como máximo", "al menos", "no más de",
  "obligatoriamente", "obligatorias", "obligatorios", "obligatoria", "obligatorio", "obligación", "prohibidas", "prohibidos", "prohibida", "prohibido", "prohibición",
  "siempre", "nunca", "jamás", "solamente", "únicamente", "exclusivamente", "sólo", "solo", "salvo", "excepto", "excepcionalmente",
  "no deberá", "no debe", "deberán", "deberá", "deben", "debe", "no podrá", "no puede", "no está permitido", "infracción", "sanción", "multa"];
const LUGAR_PALABRAS = ["vías interurbanas", "vía interurbana", "vías urbanas", "vía urbana", "fuera de poblado", "dentro de poblado", "en poblado", "en ciudad",
  "interurbanas", "interurbana", "urbanas", "urbana", "autopistas", "autopista", "autovías", "autovía", "arcén", "glorietas", "glorieta", "túneles", "túnel",
  "pasajeros", "pasajero", "ciclomotores", "ciclomotor", "noveles", "novel", "de noche", "con lluvia"];
const reLista = l => new RegExp(`(?<![\\p{L}\\d])(${l.map(w => w.replace(/ /g, "\\s+")).join("|")})(?![\\p{L}])`, "giu");
const KW_RE = reLista(KW_PALABRAS);
const LUGAR_RE = reLista(LUGAR_PALABRAS);
const NUM_RE = /(?<![\p{L}\d.,])(\d+(?:[.,]\d+)?(?:\s?[-–]\s?\d+(?:[.,]\d+)?)?\s?(?:km\/h|kW\/kg|kW|kg|cm³|cm3|mm|cm|metros|metro|m|mg\/l|g\/l|años|año|meses|mes|días|día|horas|hora|h|segundos|segundo|s|minutos|min|puntos|punto|€|euros|%|ºC|°C|bar|CV|cc))(?![\p{L}\d³\/])/gu;
const ENTIDADES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };
const MARCAS_MANUALES = typeof MARCAS === "object" ? MARCAS : {};
let subrayado = leer(CLAVE_KW, true);

function resaltar(html, id) {
  const tokens = html.split(/(<[^>]+>)/);
  const unidades = [];
  let dentroA = 0;
  tokens.forEach((t, ti) => {
    if (t.startsWith("<")) {
      if (/^<a[\s>]/i.test(t)) dentroA++;
      else if (/^<\/a>/i.test(t)) dentroA = Math.max(0, dentroA - 1);
      return;
    }
    (t.match(/&[#\w]+;|[\s\S]/g) || []).forEach(raw => unidades.push({ raw, ch: raw.length > 1 ? (ENTIDADES[raw] || "·") : raw, ti, a: dentroA > 0 }));
  });
  const plano = unidades.map(u => u.ch).join("");
  const color = new Array(unidades.length).fill(null);
  const libre = (s, e) => { for (let i = s; i < e; i++) if (color[i] || unidades[i].a) return false; return true; };
  const pintar = (s, e, c) => { if (e > s && libre(s, e)) for (let i = s; i < e; i++) color[i] = c; };
  (MARCAS_MANUALES[id] || []).forEach(([frag, c]) => {
    let s = plano.indexOf(frag);
    if (s < 0) s = plano.toLowerCase().indexOf(frag.toLowerCase());
    if (s >= 0) pintar(s, s + frag.length, c);
  });
  [[NUM_RE, "g"], [KW_RE, "r"], [LUGAR_RE, "b"]].forEach(([re, c]) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(plano))) pintar(m.index, m.index + m[0].length, c);
  });
  let out = "", abierto = null, ui = 0;
  tokens.forEach(t => {
    if (t.startsWith("<")) {
      if (abierto) { out += "</mark>"; abierto = null; }
      out += t;
      return;
    }
    const n = (t.match(/&[#\w]+;|[\s\S]/g) || []).length;
    for (let k = 0; k < n; k++, ui++) {
      const c = color[ui];
      if (c !== abierto) {
        if (abierto) out += "</mark>";
        if (c) out += `<mark class="m-${c}">`;
        abierto = c;
      }
      out += unidades[ui].raw;
    }
  });
  if (abierto) out += "</mark>";
  return out;
}

function enlazar(html, id) {
  return resaltar(enlazarBase(html), id);
}

function enlazarBase(html) {
  let s = html.replace(/(https?:\/\/[^\s<]+[^\s<.,;:)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  ENLACES.forEach(([texto, url]) => {
    if (s.includes(texto) && !s.includes(url)) s = s.replace(texto, `<a href="${url}" target="_blank" rel="noopener">${texto}</a>`);
  });
  return s;
}

function bloqueHTML(b) {
  if (b.t === "h2") return `<h2>${b.txt}</h2>`;
  if (b.t === "h3") return `<h3>${b.txt}</h3>`;
  if (b.t === "p") return `<p class="${b.sz && b.sz < 9 ? "nota" : ""}">${enlazar(b.html, `${b._id}-p-0`)}</p>`;
  if (b.t === "ul") return `<ul>${b.items.map((i, k) => `<li>${enlazar(i, `${b._id}-ul-${k}`)}</li>`).join("")}</ul>`;
  if (b.t === "box") {
    const titulo = b.titulo ? `<span>· ${b.titulo}</span>` : "";
    return `<div class="recuadro ${b.kind}"><div class="r-cab">${ETIQUETAS[b.kind]}${titulo}</div><div class="r-cuerpo">${b.items.map((i, k) => `<p>${enlazar(i, `${b._id}-box-${k}`)}</p>`).join("")}</div></div>`;
  }
  if (b.t === "tabla") {
    const filas = b.filas.slice();
    let cab = "", etiq = [];
    if (b.cab) { etiq = filas.shift(); cab = `<thead><tr>${etiq.map(c => `<th>${c}</th>`).join("")}</tr></thead>`; }
    const cols = b.filas[0].length;
    const apilar = b.cab && cols >= 3;
    const attr = j => apilar && etiq[j] ? ` data-l="${String(etiq[j]).replace(/<[^>]+>/g, "").replace(/"/g, "&quot;")}"` : "";
    const cuerpo = `<tbody>${filas.map((f, fi) => `<tr>${f.map((c, j) => `<td${attr(j)}>${enlazar(c, `${b._id}-td-${(fi + (b.cab ? 1 : 0)) * 100 + j}`)}</td>`).join("")}</tr>`).join("")}</tbody>`;
    return `<div class="tabla-env${apilar ? " apilable" : ""}"><table class="${cols <= 2 ? "estrecha" : ""}">${cab}${cuerpo}</table></div>`;
  }
  if (b.t === "imgs") {
    const senales = b.items.length >= 3 && b.items.every(i => i.ancho < 0.16);
    const figs = b.items.map(i => {
      let estilo = "";
      if (!senales) {
        const ancho = b.items.length === 1 ? Math.min(100, Math.max(40, i.ancho * 100)) : Math.max(22, i.ancho * 100);
        estilo = ` style="width:${ancho}%;max-width:${b.items.length === 1 ? 900 : 420}px"`;
      }
      return `<figure${estilo} data-src="${i.src}" data-cap="${(i.cap || b.figura || "").replace(/"/g, "&quot;")}"><img src="${i.src}" alt="${(i.cap || b.figura || "Imagen").replace(/"/g, "&quot;")}" loading="lazy">${i.cap ? `<figcaption>${i.cap}</figcaption>` : ""}</figure>`;
    }).join("");
    return `<div class="galeria${senales ? " senales" : ""}">${figs}</div>${b.figura ? `<p class="figura-pie">${b.figura}</p>` : ""}`;
  }
  return "";
}

function botonTest(cap) {
  const i = CAPITULOS.indexOf(cap);
  if (cap.preg && cap.preg.length) return `<button type="button" class="btn-pri" data-test-cap="${i}">Test de este capítulo · ${cap.preg.length} preguntas</button>`;
  if (cap.modo === "trampa") return `<button type="button" class="btn-pri" data-test-modo="trampa">Practicar las más falladas ★</button>`;
  if (cap.modo === "examen") return `<button type="button" class="btn-pri" data-test-modo="examen">Hacer un examen DGT</button>`;
  return `<button type="button" class="btn-pri" data-test-modo="azar">Practicar preguntas al azar</button>`;
}

function paginaBanco() {
  const temas = [...new Set(CAPITULOS.filter(c => c.tema).map(c => c.tema))];
  return `<h2>Practica con el test online</h2>
  <p>Las 200 preguntas de la guía están en el test online, con imagen, tres respuestas, corrección en verde y rojo, la explicación de cada fallo y un apartado de falladas para repasar hasta acertarlas.</p>
  <div class="modos-t">
    <button type="button" data-test-modo="examen"><b>Examen DGT</b><small>20 preguntas · 20 minutos · máximo 2 fallos</small></button>
    <button type="button" data-test-modo="trampa"><b>Las más falladas ★</b><small>Preguntas trampa que más suspenden</small></button>
    <button type="button" data-test-modo="falladas"><b>Repasar falladas</b><small>Solo las que has fallado</small></button>
    <button type="button" data-test-modo="todas"><b>Las 200 seguidas</b><small>Todo el banco en orden</small></button>
  </div>
  <h3>Por capítulos</h3>
  <div class="modos-t">${CAPITULOS.map((c, i) => c.preg && c.preg.length ? `<button type="button" data-test-cap="${i}"><b>${c.n}. ${c.titulo}</b><small>${c.preg.length} preguntas</small></button>` : "").join("")}</div>
  <p><button type="button" class="btn-sec" data-ir-test="inicio">Ver todos los modos del test</button></p>
  <p class="nota">También tienes las 200 preguntas con sus soluciones en el PDF descargable, a partir de la página 49.</p>`;
}

function pintar(dir) {
  const cap = CAPITULOS[pos.c];
  const total = cap.paginas.length;
  const bloques = cap.paginas[pos.p];
  let html = "";
  if (pos.p === 0) {
    html += `<div class="banda"><span class="n">${String(cap.n).padStart(2, "0")}</span><div><h1>${cap.titulo}</h1><p>${cap.desc}</p></div></div>`;
  }
  html += cap.banco ? paginaBanco() : bloques.map(bloqueHTML).join("");
  if (pos.p === total - 1) {
    const sig = CAPITULOS[pos.c + 1];
    html += `<div class="fin-cap"><p><b>Fin del capítulo ${cap.n}.</b> ${cap.banco ? "" : "Comprueba lo que acabas de estudiar con las preguntas de este tema."}</p><div class="acc">
      ${cap.banco ? "" : botonTest(cap)}
      ${sig ? `<button type="button" class="btn-sec" data-ir-cap="${pos.c + 1}">Siguiente: ${sig.titulo} →</button>` : `<button type="button" class="btn-sec" data-ir-test="inicio">Ir al test completo</button>`}
    </div></div>`;
  }
  hoja.innerHTML = html;
  hoja.classList.remove("entra-der", "entra-izq");
  void hoja.offsetWidth;
  if (dir) hoja.classList.add(dir > 0 ? "entra-der" : "entra-izq");
  lChip.textContent = `Cap. ${cap.n}`;
  lTitulo.textContent = cap.titulo;
  lPag.textContent = `Página ${pos.p + 1} de ${total}`;
  lBarra.style.width = `${((pos.p + 1) / total) * 100}%`;
  puntos.innerHTML = "";
  if (total > 1 && total <= 14) {
    for (let k = 0; k < total; k++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = k === pos.p ? "on" : "";
      b.setAttribute("aria-label", `Ir a la página ${k + 1}`);
      b.addEventListener("click", () => ir(pos.c, k));
      puntos.appendChild(b);
    }
  }
  btnAnt.disabled = pos.c === 0 && pos.p === 0;
  btnSig.disabled = pos.c === CAPITULOS.length - 1 && pos.p === total - 1;
  btnSig.querySelector("small").textContent = pos.p === total - 1 ? "Siguiente capítulo" : "Siguiente";
  hoja.querySelectorAll("figure[data-src]").forEach(f => f.addEventListener("click", () => abrirVisor(f.dataset.src, f.dataset.cap)));
  hoja.querySelectorAll("[data-ir-cap]").forEach(b => b.addEventListener("click", () => ir(Number(b.dataset.irCap), 0)));
  hoja.querySelectorAll("[data-test-cap]").forEach(b => b.addEventListener("click", () => empezar("capitulo", Number(b.dataset.testCap))));
  hoja.querySelectorAll("[data-test-modo]").forEach(b => b.addEventListener("click", () => empezar(b.dataset.testModo)));
  hoja.querySelectorAll("[data-ir-test]").forEach(b => b.addEventListener("click", () => mostrar(b.dataset.irTest)));
  const vis = leido[cap.n] || [];
  if (!vis.includes(pos.p)) vis.push(pos.p);
  leido[cap.n] = vis;
  guardar(CLAVE_LEIDO, leido);
  document.getElementById("lPct").textContent = `${pctCap(cap)} % leído`;
  guardar(CLAVE_POS_TEORIA, pos);
  const h = `#c${cap.n}-p${pos.p + 1}`;
  if (location.hash !== h) history.replaceState(null, "", h);
}

function ir(c, p, dir) {
  const d = dir !== undefined ? dir : (c > pos.c || (c === pos.c && p > pos.p) ? 1 : -1);
  pos = { c, p };
  mostrarLector();
  pintar(d);
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function siguiente() {
  const cap = CAPITULOS[pos.c];
  if (pos.p < cap.paginas.length - 1) ir(pos.c, pos.p + 1, 1);
  else if (pos.c < CAPITULOS.length - 1) ir(pos.c + 1, 0, 1);
}

function anterior() {
  if (pos.p > 0) ir(pos.c, pos.p - 1, -1);
  else if (pos.c > 0) ir(pos.c - 1, CAPITULOS[pos.c - 1].paginas.length - 1, -1);
}

function mostrarLector() {
  if (!vLector.classList.contains("activa")) mostrar("lector");
}

function irCapitulo(c, p) {
  ir(c, p, 1);
}

function tarjetaCap(c, i) {
  const b = document.createElement("button");
  b.type = "button";
  const pct = pctCap(c);
  const completo = pct >= 100;
  b.className = "cap" + (completo ? " leido" : "") + (vLector.classList.contains("activa") && i === pos.c ? " actual" : "");
  b.innerHTML = `<span class="num">${completo ? "✓" : String(c.n).padStart(2, "0")}</span><span class="txt"><b></b><small></small><span class="pct-barra"><span style="width:${pct}%"></span></span></span><span class="estado"><b>${pct} %</b>leído</span>`;
  b.querySelector("b").textContent = c.titulo;
  b.querySelector("small").textContent = c.desc;
  b.addEventListener("click", () => { cerrarPanel(); ir(i, 0, 1); });
  return b;
}

function pintarPortada() {
  const lista = document.getElementById("listaCaps");
  lista.innerHTML = "";
  CAPITULOS.forEach((c, i) => lista.appendChild(tarjetaCap(c, i)));
  const totalPags = CAPITULOS.reduce((a, c) => a + c.paginas.length, 0);
  const vistas = CAPITULOS.reduce((a, c) => a + (leido[c.n] || []).filter(p => p < c.paginas.length).length, 0);
  document.getElementById("barraTotal").style.width = `${(vistas / totalPags) * 100}%`;
  document.getElementById("txtProgreso").textContent = vistas ? `Has leído el ${Math.round((vistas / totalPags) * 100)} % de la teoría (${vistas} de ${totalPags} páginas).` : `${CAPITULOS.length} capítulos · ${totalPags} páginas para leer.`;
  const guardada = leer(CLAVE_POS_TEORIA, null);
  const btnSeguir = document.getElementById("btnSeguir");
  if (guardada && (guardada.c || guardada.p) && CAPITULOS[guardada.c]) {
    btnSeguir.classList.remove("oculto");
    btnSeguir.textContent = `Seguir por el capítulo ${CAPITULOS[guardada.c].n}, página ${guardada.p + 1}`;
    btnSeguir.onclick = () => ir(guardada.c, Math.min(guardada.p, CAPITULOS[guardada.c].paginas.length - 1), 1);
  } else {
    btnSeguir.classList.add("oculto");
  }
}

const panel = document.getElementById("panelCaps");
function abrirPanel() {
  const l = document.getElementById("listaPanel");
  l.innerHTML = "";
  CAPITULOS.forEach((c, i) => l.appendChild(tarjetaCap(c, i)));
  panel.classList.remove("oculto");
}
function cerrarPanel() { panel.classList.add("oculto"); }

const visor = document.getElementById("visor");
function abrirVisor(src, cap) {
  document.getElementById("visorImg").src = src;
  document.getElementById("visorCap").textContent = cap || "";
  visor.classList.remove("oculto");
}
function cerrarVisor() { visor.classList.add("oculto"); }

document.getElementById("btnLeer").addEventListener("click", () => ir(0, 0, 1));
function seguirLeyendo() {
  const g = leer(CLAVE_POS_TEORIA, null);
  if (g && CAPITULOS[g.c]) ir(g.c, Math.min(g.p, CAPITULOS[g.c].paginas.length - 1), 1);
  else ir(0, 0, 1);
}
document.querySelectorAll("[data-leer]").forEach(b => b.addEventListener("click", () => {
  if (vLector.classList.contains("activa")) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  const go = () => { clearInterval(temporizador); seguirLeyendo(); };
  if (vistas.test.classList.contains("activa") && sesion && sesion.respuestas.length) confirmar("¿Salir del test? Las falladas ya están guardadas.", go);
  else go();
}));
document.getElementById("btnCapitulos").addEventListener("click", abrirPanel);
const btnKw = document.getElementById("btnKw");
function aplicarSubrayado() {
  hoja.classList.toggle("sin-kw", !subrayado);
  document.getElementById("leyenda").classList.toggle("oculto", !subrayado);
  btnKw.setAttribute("aria-pressed", subrayado ? "true" : "false");
  btnKw.title = subrayado ? "Quitar subrayado de palabras clave" : "Subrayar palabras clave";
}
btnKw.addEventListener("click", () => { subrayado = !subrayado; guardar(CLAVE_KW, subrayado); aplicarSubrayado(); });
aplicarSubrayado();
document.getElementById("btnCerrarPanel").addEventListener("click", cerrarPanel);
panel.addEventListener("click", e => { if (e.target === panel) cerrarPanel(); });
visor.addEventListener("click", cerrarVisor);
btnSig.addEventListener("click", siguiente);
btnAnt.addEventListener("click", anterior);

document.addEventListener("keydown", e => {
  if (!visor.classList.contains("oculto")) { if (e.key === "Escape") cerrarVisor(); return; }
  if (!panel.classList.contains("oculto")) { if (e.key === "Escape") cerrarPanel(); return; }
  if (!vLector.classList.contains("activa")) return;
  if (e.key === "ArrowRight") siguiente();
  if (e.key === "ArrowLeft") anterior();
});

let toque = null;
hoja.addEventListener("touchstart", e => {
  if (e.touches.length !== 1) return;
  toque = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
}, { passive: true });
hoja.addEventListener("touchend", e => {
  if (!toque) return;
  const dx = e.changedTouches[0].clientX - toque.x;
  const dy = e.changedTouches[0].clientY - toque.y;
  const enTabla = e.target.closest && e.target.closest(".tabla-env");
  if (!enTabla && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - toque.t < 700) {
    if (dx < 0) siguiente(); else anterior();
  }
  toque = null;
}, { passive: true });

function desdeHash() {
  const m = location.hash.match(/^#c(\d+)-p(\d+)$/);
  if (!m) return false;
  const c = CAPITULOS.findIndex(x => x.n === Number(m[1]));
  if (c < 0) return false;
  pos = { c, p: Math.min(Number(m[2]) - 1, CAPITULOS[c].paginas.length - 1) };
  mostrarLector();
  pintar(0);
  return true;
}

window.addEventListener("hashchange", desdeHash);
if (!arranqueTest() && !desdeHash()) mostrar("portada");
