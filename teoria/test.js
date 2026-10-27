const CLAVE_FALLADAS = "a2_falladas_v1";
const CLAVE_STATS = "a2_stats_v1";
const CLAVE_POS = "a2_pos_todas_v1";
const CLAVE_RESP = "a2_resp_v1";
const LETRAS = ["A", "B", "C"];

const vistas = {
  portada: document.getElementById("vPortada"),
  lector: document.getElementById("vLector"),
  inicio: document.getElementById("vInicio"),
  test: document.getElementById("vTest"),
  resultado: document.getElementById("vResultado"),
  falladas: document.getElementById("vFalladas")
};

const tModo = document.getElementById("tModo");
const tNum = document.getElementById("tNum");
const tReloj = document.getElementById("tReloj");
const tMarcador = document.getElementById("tMarcador");
const tBarra = document.getElementById("tBarra");
const tImg = document.getElementById("tImg");
const tTema = document.getElementById("tTema");
const tPregunta = document.getElementById("tPregunta");
const tOpciones = document.getElementById("tOpciones");
const tFeedback = document.getElementById("tFeedback");
const btnSiguiente = document.getElementById("btnSiguiente");

let sesion = null;
let temporizador = null;

function leer(clave, porDefecto) {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : porDefecto;
  } catch (e) {
    return porDefecto;
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (e) {}
}

let falladas = leer(CLAVE_FALLADAS, {});
let stats = leer(CLAVE_STATS, { respondidas: 0, aciertos: 0, examenes: 0, aptos: 0 });

let resp = leer(CLAVE_RESP, {});
if (Object.keys(falladas).some(n => !resp[n])) {
  Object.keys(falladas).forEach(n => { if (!resp[n]) resp[n] = 1; });
  guardar(CLAVE_RESP, resp);
}

function yaRespondida(n) {
  return !!resp[n];
}

function pendientesCap(cap) {
  return (cap.preg || []).filter(n => !yaRespondida(n));
}

function porNumero(n) {
  return PREGUNTAS.find(p => p.n === n);
}

function barajar(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mostrar(nombre) {
  Object.values(vistas).forEach(v => v.classList.remove("activa"));
  vistas[nombre].classList.add("activa");
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelectorAll(".nav-btn, .tab").forEach(b => b.classList.remove("on"));
  const grupo = { portada: "portada", lector: "lector", inicio: "inicio", test: "inicio", resultado: "inicio", falladas: "falladas" }[nombre];
  const sel = grupo === "portada" ? '[data-vista="portada"]' : grupo === "lector" ? "[data-leer]" : `[data-ir="${grupo}"]`;
  document.querySelectorAll(`.nav-btn${sel}, .tab${sel}`).forEach(b => b.classList.add("on"));
  document.body.dataset.vista = nombre;
  if (nombre === "inicio") pintarInicio();
  if (nombre === "falladas") pintarFalladas();
  if (nombre === "portada" && typeof pintarPortada === "function") pintarPortada();
  if (nombre !== "lector" && nombre !== "portada" && location.hash) history.replaceState(null, "", location.pathname);
}

function numFalladas() {
  return Object.keys(falladas).length;
}

function actualizarContadores() {
  const n = numFalladas();
  document.getElementById("navFalladas").textContent = n;
  const tf = document.getElementById("tabFalladas");
  if (tf) { tf.textContent = n; tf.classList.toggle("oculto", !n); }
  document.getElementById("modoFalladas").textContent = n;
}

function pintarInicio() {
  actualizarContadores();
  const pct = stats.respondidas ? Math.round((stats.aciertos / stats.respondidas) * 100) : 0;
  document.getElementById("stats").innerHTML =
    `<div class="stat"><b>${stats.respondidas}</b><span>respondidas</span></div>` +
    `<div class="stat"><b>${pct}%</b><span>de aciertos</span></div>` +
    `<div class="stat"><b>${stats.aptos}/${stats.examenes}</b><span>exámenes aptos</span></div>` +
    `<div class="stat"><b>${numFalladas()}</b><span>por repasar</span></div>`;
  const temas = {};
  PREGUNTAS.forEach(p => { temas[p.tema] = (temas[p.tema] || 0) + 1; });
  const cont = document.getElementById("temas");
  cont.innerHTML = "";
  Object.keys(temas).sort().forEach(t => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tema";
    b.innerHTML = `<span>${t}</span><small>${temas[t]} preg.</small>`;
    b.addEventListener("click", () => empezar("tema", t));
    cont.appendChild(b);
  });
  const contCap = document.getElementById("temasCap");
  if (contCap && typeof CAPITULOS !== "undefined") {
    contCap.innerHTML = "";
    CAPITULOS.forEach((c, i) => {
      if (!c.preg || !c.preg.length) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tema";
      const pend = pendientesCap(c).length;
      b.innerHTML = `<span></span><small>${pend === c.preg.length ? `${pend} preg.` : `${pend} de ${c.preg.length} preg.`}</small>`;
      b.firstChild.textContent = `${c.n}. ${c.titulo}`;
      b.addEventListener("click", () => empezar("capitulo", i));
      contCap.appendChild(b);
    });
  }
}

function empezar(modo, tema) {
  let lista = [];
  let titulo = "";
  let inicio = 0;
  if (modo === "examen") { lista = barajar(PREGUNTAS).slice(0, 20); titulo = "Examen DGT"; }
  if (modo === "trampa") { lista = barajar(PREGUNTAS.filter(p => p.fallada)); titulo = "Más falladas ★"; }
  if (modo === "azar") { lista = barajar(PREGUNTAS); titulo = "Práctica libre"; }
  if (modo === "todas") { lista = PREGUNTAS.slice(); titulo = "Las 200"; inicio = Math.min(leer(CLAVE_POS, 0), lista.length - 1); }
  if (modo === "tema") { lista = barajar(PREGUNTAS.filter(p => p.tema === tema)); titulo = tema; }
  if (modo === "capitulo") {
    const cap = CAPITULOS[tema];
    const pend = pendientesCap(cap);
    if (!pend.length) {
      confirmar(`Ya has respondido las ${cap.preg.length} preguntas de este capítulo. ¿Empezar de nuevo con todas?`, () => {
        cap.preg.forEach(n => { delete resp[n]; });
        guardar(CLAVE_RESP, resp);
        empezar("capitulo", tema);
      });
      return;
    }
    lista = barajar(PREGUNTAS.filter(p => pend.includes(p.n)));
    titulo = `Cap. ${cap.n} · ${cap.titulo}`;
  }
  if (modo === "falladas") {
    lista = barajar(Object.keys(falladas).map(n => porNumero(Number(n))).filter(Boolean));
    titulo = "Repaso de falladas";
    if (!lista.length) { mostrar("falladas"); return; }
  }
  sesion = { modo, tema, titulo, lista, i: inicio, aciertos: 0, fallos: 0, respuestas: [], fin: null };
  tModo.textContent = titulo;
  clearInterval(temporizador);
  tReloj.classList.add("oculto");
  tReloj.classList.remove("aviso");
  if (modo === "examen") {
    sesion.fin = Date.now() + 20 * 60 * 1000;
    tReloj.classList.remove("oculto");
    actualizarReloj();
    temporizador = setInterval(actualizarReloj, 1000);
  }
  mostrar("test");
  pintarPregunta();
}

function actualizarReloj() {
  const resto = Math.max(0, sesion.fin - Date.now());
  const m = Math.floor(resto / 60000);
  const s = Math.floor((resto % 60000) / 1000);
  tReloj.textContent = `${m}:${String(s).padStart(2, "0")}`;
  tReloj.classList.toggle("aviso", resto < 120000);
  if (resto === 0) { clearInterval(temporizador); terminar(true); }
}

function pintarPregunta() {
  const p = sesion.lista[sesion.i];
  const total = sesion.lista.length;
  tNum.textContent = `Pregunta ${sesion.i + 1} de ${total}`;
  tBarra.style.width = `${(sesion.i / total) * 100}%`;
  tMarcador.innerHTML = `<span class="v">${sesion.aciertos} ✓</span> · <span class="r">${sesion.fallos} ✗</span>`;
  tImg.src = p.imagen;
  tImg.alt = p.tema;
  tTema.textContent = `${p.tema} · nº ${p.n}${p.fallada ? " · ★ muy fallada" : ""}`;
  tPregunta.textContent = p.pregunta;
  tOpciones.innerHTML = "";
  p.opciones.forEach((texto, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "op";
    b.dataset.idx = idx;
    b.innerHTML = `<span class="letra">${LETRAS[idx]}</span><span></span>`;
    b.lastChild.textContent = texto;
    b.addEventListener("click", () => responder(idx));
    tOpciones.appendChild(b);
  });
  tFeedback.className = "feedback oculto";
  tFeedback.innerHTML = "";
  btnSiguiente.disabled = true;
  btnSiguiente.textContent = sesion.i === total - 1 ? "Ver resultado" : "Siguiente";
}

function responder(idx) {
  const p = sesion.lista[sesion.i];
  if (btnSiguiente.disabled === false) return;
  const acierto = idx === p.correcta;
  const botones = tOpciones.querySelectorAll(".op");
  botones.forEach((b, k) => {
    b.disabled = true;
    if (k === p.correcta) b.classList.add("correcta");
    else if (k === idx) b.classList.add("incorrecta");
    else b.classList.add("apagada");
  });
  stats.respondidas++;
  if (acierto) {
    stats.aciertos++;
    sesion.aciertos++;
    if (sesion.modo === "falladas" && falladas[p.n]) delete falladas[p.n];
    tFeedback.className = "feedback ok";
    tFeedback.innerHTML = `<p class="fb-tit">¡Correcto!</p><p></p>`;
  } else {
    sesion.fallos++;
    const previa = falladas[p.n];
    falladas[p.n] = { veces: previa ? previa.veces + 1 : 1, ultima: idx };
    tFeedback.className = "feedback mal";
    tFeedback.innerHTML = `<p class="fb-tit">Incorrecto. La respuesta correcta es la ${LETRAS[p.correcta]}.</p><p></p>`;
  }
  tFeedback.lastChild.textContent = p.explicacion;
  sesion.respuestas.push({ n: p.n, elegida: idx, acierto });
  resp[p.n] = 1;
  guardar(CLAVE_RESP, resp);
  guardar(CLAVE_FALLADAS, falladas);
  guardar(CLAVE_STATS, stats);
  if (sesion.modo === "todas") guardar(CLAVE_POS, (sesion.i + 1) % sesion.lista.length);
  tMarcador.innerHTML = `<span class="v">${sesion.aciertos} ✓</span> · <span class="r">${sesion.fallos} ✗</span>`;
  actualizarContadores();
  btnSiguiente.disabled = false;
  btnSiguiente.focus({ preventScroll: true });
}

function siguiente() {
  if (btnSiguiente.disabled) return;
  if (sesion.i < sesion.lista.length - 1) {
    sesion.i++;
    pintarPregunta();
    vistas.test.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    terminar(false);
  }
}

function terminar(porTiempo) {
  clearInterval(temporizador);
  const total = sesion.respuestas.length;
  const rTitulo = document.getElementById("rTitulo");
  const rTexto = document.getElementById("rTexto");
  document.getElementById("rModo").textContent = sesion.titulo;
  document.getElementById("rAciertos").textContent = `${sesion.aciertos}/${total}`;
  if (sesion.modo === "examen") {
    const sinResponder = sesion.lista.length - total;
    const fallosTotales = sesion.fallos + sinResponder;
    const apto = fallosTotales <= 2;
    stats.examenes++;
    if (apto) stats.aptos++;
    guardar(CLAVE_STATS, stats);
    rTitulo.textContent = apto ? "APTO" : "NO APTO";
    rTitulo.className = apto ? "apto" : "noapto";
    rTexto.textContent = (porTiempo ? "Se acabó el tiempo. " : "") +
      `${fallosTotales} ${fallosTotales === 1 ? "fallo" : "fallos"}${sinResponder ? ` (incluye ${sinResponder} sin responder)` : ""}. En el examen real se aprueba con 2 fallos como máximo.`;
  } else {
    const pct = total ? Math.round((sesion.aciertos / total) * 100) : 0;
    rTitulo.textContent = `${pct}% de aciertos`;
    rTitulo.className = pct >= 90 ? "apto" : "";
    rTexto.textContent = sesion.fallos ? "Las que has fallado están guardadas en Falladas." : "Sin fallos. Buen trabajo.";
  }
  const btnVolverCap = document.getElementById("btnVolverCap");
  if (sesion.modo === "capitulo") {
    btnVolverCap.classList.remove("oculto");
    btnVolverCap.textContent = `Volver al capítulo ${CAPITULOS[sesion.tema].n}`;
    btnVolverCap.onclick = () => irCapitulo(sesion.tema, 0);
  } else {
    btnVolverCap.classList.add("oculto");
  }
  const lista = document.getElementById("rLista");
  lista.innerHTML = "";
  sesion.respuestas.filter(r => !r.acierto).forEach(r => lista.appendChild(tarjetaFallada(porNumero(r.n), r.elegida)));
  mostrar("resultado");
}

function tarjetaFallada(p, elegida, veces) {
  const div = document.createElement("div");
  div.className = "fitem";
  div.innerHTML = `<img alt="" loading="lazy"><div><h3></h3><p class="tuya"></p><p class="resp"></p><p class="exp"></p><span class="veces"></span></div>`;
  div.querySelector("img").src = p.imagen;
  div.querySelector("h3").textContent = `${p.n}. ${p.pregunta}`;
  const tuya = div.querySelector(".tuya");
  if (elegida !== undefined && elegida !== null) tuya.textContent = `Tu respuesta: ${LETRAS[elegida]}) ${p.opciones[elegida]}`;
  else tuya.remove();
  div.querySelector(".resp").textContent = `Correcta: ${LETRAS[p.correcta]}) ${p.opciones[p.correcta]}`;
  div.querySelector(".exp").textContent = p.explicacion;
  const v = div.querySelector(".veces");
  if (veces) v.textContent = `Fallada ${veces} ${veces === 1 ? "vez" : "veces"}`;
  else v.remove();
  return div;
}

function pintarFalladas() {
  actualizarContadores();
  const lista = document.getElementById("fLista");
  const n = numFalladas();
  document.getElementById("fTexto").textContent = n
    ? `Tienes ${n} ${n === 1 ? "pregunta" : "preguntas"} por repasar. Cuando aciertes una en el repaso, sale de la lista.`
    : "No tienes preguntas falladas guardadas.";
  document.getElementById("btnRepasar").disabled = !n;
  document.getElementById("btnVaciar").disabled = !n;
  lista.innerHTML = "";
  if (!n) {
    lista.innerHTML = `<div class="vacio">Cuando falles una pregunta aparecerá aquí con la respuesta correcta y la explicación.</div>`;
    return;
  }
  Object.entries(falladas)
    .sort((a, b) => b[1].veces - a[1].veces || a[0] - b[0])
    .forEach(([num, info]) => {
      const p = porNumero(Number(num));
      if (p) lista.appendChild(tarjetaFallada(p, info.ultima, info.veces));
    });
}

function confirmar(texto, alAceptar) {
  const d = document.getElementById("dialogo");
  document.getElementById("dTexto").textContent = texto;
  d.classList.remove("oculto");
  const cerrar = () => d.classList.add("oculto");
  document.getElementById("dNo").onclick = cerrar;
  document.getElementById("dSi").onclick = () => { cerrar(); alAceptar(); };
}

document.querySelectorAll("[data-modo]").forEach(b => b.addEventListener("click", () => empezar(b.dataset.modo)));
document.querySelectorAll("[data-ir]").forEach(b => b.addEventListener("click", () => {
  if (vistas.test.classList.contains("activa") && sesion && sesion.respuestas.length) {
    confirmar("¿Salir del test? Las falladas ya están guardadas.", () => { clearInterval(temporizador); mostrar(b.dataset.ir); });
  } else {
    clearInterval(temporizador);
    mostrar(b.dataset.ir);
  }
}));
document.getElementById("btnMarca").addEventListener("click", () => irVista("portada"));
function irVista(nombre) {
  if (vistas.test.classList.contains("activa") && sesion && sesion.respuestas.length) {
    confirmar("¿Salir del test? Las falladas ya están guardadas.", () => { clearInterval(temporizador); mostrar(nombre); });
  } else {
    clearInterval(temporizador);
    mostrar(nombre);
  }
}
document.querySelectorAll("[data-vista]").forEach(b => b.addEventListener("click", () => irVista(b.dataset.vista)));
document.getElementById("btnSalir").addEventListener("click", () => {
  if (sesion && sesion.respuestas.length) confirmar("¿Terminar el test ahora?", () => terminar(false));
  else { clearInterval(temporizador); mostrar("inicio"); }
});
btnSiguiente.addEventListener("click", siguiente);
document.getElementById("btnRepetir").addEventListener("click", () => empezar(sesion.modo, sesion.tema));
document.getElementById("btnVerFalladas").addEventListener("click", () => mostrar("falladas"));
document.getElementById("btnRepasar").addEventListener("click", () => empezar("falladas"));
document.getElementById("btnVaciar").addEventListener("click", () => confirmar("¿Borrar todas las preguntas falladas?", () => {
  falladas = {};
  guardar(CLAVE_FALLADAS, falladas);
  pintarFalladas();
}));

document.addEventListener("keydown", e => {
  if (!vistas.test.classList.contains("activa")) return;
  const k = e.key.toLowerCase();
  const mapa = { "1": 0, "2": 1, "3": 2, a: 0, b: 1, c: 2 };
  if (k in mapa && btnSiguiente.disabled) responder(mapa[k]);
  if (k === "enter" && !btnSiguiente.disabled) { e.preventDefault(); siguiente(); }
});

actualizarContadores();
function arranqueTest() {
  const parametros = new URLSearchParams(location.search);
  const limpiarUrl = () => history.replaceState(null, "", location.pathname + location.hash);
  if (parametros.get("modo")) { limpiarUrl(); empezar(parametros.get("modo")); return true; }
  if (parametros.get("tema")) { const t = parametros.get("tema"); limpiarUrl(); empezar("tema", t); return true; }
  if (parametros.get("vista") === "test") { limpiarUrl(); mostrar("inicio"); return true; }
  if (parametros.get("vista") === "falladas") { limpiarUrl(); mostrar("falladas"); return true; }
  return false;
}
