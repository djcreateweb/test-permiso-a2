(function () {
  const btnVoz = document.getElementById("btnVoz");
  const barra = document.getElementById("vozBarra");
  if (!btnVoz || !barra) return;
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    btnVoz.classList.add("oculto");
    return;
  }
  const synth = window.speechSynthesis;
  const CLAVE = "a2_voz_v1";
  let INDICE = null;
  const prefs = Object.assign({ rate: 1, voz: "", seguir: true }, leer(CLAVE, {}));
  const bPlay = document.getElementById("vozPlay");
  const bParar = document.getElementById("vozParar");
  const selVel = document.getElementById("vozVel");
  const selVoz = document.getElementById("vozSel");
  const chkSeguir = document.getElementById("vozSeguir");
  const aviso = document.getElementById("vozAviso");

  const FEMENINAS = ["mónica", "monica", "marisol", "paulina", "helena", "laura", "elvira", "lucía", "lucia", "sabina", "paloma", "esperanza", "conchita",
    "penélope", "penelope", "isabela", "isabel", "carmen", "dalia", "elena", "ximena", "triana", "irene", "abril", "estrella", "vera", "lola", "angélica", "angelica",
    "google español", "female", "mujer", "femenina"];
  const MASCULINAS = ["jorge", "diego", "pablo", "álvaro", "alvaro", "juan", "carlos", "enrique", "raúl", "raul", "miguel", "antonio", "andrés", "andres", "josé", "jose",
    "alonso", "sergio", "jaime", "darío", "dario", "francisco", "eddy", "reed", "rocko", "grandpa", "male", "hombre", "masculina", "gonzalo", "tomás", "tomas", "arnau", "jordi"];
  const NOVEDAD = ["eddy", "flo", "grandma", "grandpa", "reed", "rocko", "sandy", "shelley", "bad news", "bells", "boing", "bubbles", "cellos", "wobble", "zarvox", "trinoids", "whisper", "superstar", "organ", "albert", "jester", "junior", "kathy", "ralph", "fred"];
  const tiene = (n, lista) => lista.some(x => n.includes(x));

  function puntuar(v) {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/^es[-_]es/i.test(v.lang)) s += 4; else if (/^es/i.test(v.lang)) s += 2;
    if (tiene(n, FEMENINAS)) s += 10;
    if (tiene(n, MASCULINAS)) s -= 100;
    if (tiene(n, NOVEDAD)) s -= 6;
    if (/premium|enhanced|mejorada|natural|neural|online/.test(n)) s += 3;
    return s;
  }
  function voces() {
    return synth.getVoices().filter(v => /^es/i.test(v.lang) && !tiene(v.name.toLowerCase(), MASCULINAS)).sort((a, b) => puntuar(b) - puntuar(a));
  }
  let lista = [];
  function cargarVoces() {
    lista = voces();
    selVoz.innerHTML = "";
    if (INDICE) {
      const o = document.createElement("option");
      o.value = "neural";
      o.textContent = "Dora · alta calidad";
      selVoz.appendChild(o);
    }
    lista.forEach(v => {
      const o = document.createElement("option");
      o.value = v.name;
      o.textContent = `${v.name.replace(/Microsoft |Google |\(.*?\)/g, "").trim() || v.name} · ${v.lang}`;
      selVoz.appendChild(o);
    });
    if (INDICE && (!prefs.voz || prefs.voz === "neural" || !lista.some(v => v.name === prefs.voz))) selVoz.value = "neural";
    else if (prefs.voz && lista.some(v => v.name === prefs.voz)) selVoz.value = prefs.voz;
    const femenina = lista.some(v => tiene(v.name.toLowerCase(), FEMENINAS));
    aviso.textContent = INDICE ? "" : !lista.length
      ? "Tu dispositivo no tiene voces en español. Instálalas en los ajustes de voz del sistema."
      : femenina ? "" : "No encuentro una voz femenina en español en este dispositivo. En iPhone: Ajustes › Accesibilidad › Contenido leído › Voces › Español › Mónica.";
    aviso.classList.toggle("oculto", !aviso.textContent);
  }
  cargarVoces();
  if (typeof synth.onvoiceschanged !== "undefined") synth.onvoiceschanged = cargarVoces;
  setTimeout(cargarVoces, 600);
  setTimeout(cargarVoces, 2000);

  selVel.value = String(prefs.rate);
  chkSeguir.checked = !!prefs.seguir;

  function normalizar(t) {
    return t
      .replace(/\s+/g, " ")
      .replace(/(\d)\s?km\/h/g, "$1 kilómetros por hora")
      .replace(/(\d)\s?kW\/kg/g, "$1 kilovatios por kilo")
      .replace(/(\d)\s?kW/g, "$1 kilovatios")
      .replace(/(\d)\s?mg\/l/g, "$1 miligramos por litro")
      .replace(/(\d)\s?g\/l/g, "$1 gramos por litro")
      .replace(/(\d)\s?cm³/g, "$1 centímetros cúbicos")
      .replace(/(\d)\s?mm(?![\p{L}\d])/gu, "$1 milímetros")
      .replace(/(\d)\s?cm(?![\p{L}\d])/gu, "$1 centímetros")
      .replace(/(\d)\s?kg(?![\p{L}\d])/gu, "$1 kilos")
      .replace(/(\d)\s?m(?![\p{L}\d])/gu, "$1 metros")
      .replace(/(\d)\s?s(?![\p{L}\d])/gu, "$1 segundos")
      .replace(/(\d)\s?h(?![\p{L}\d])/gu, "$1 horas")
      .replace(/(\d)\s?€/g, "$1 euros")
      .replace(/(\d)\s?%/g, "$1 por ciento")
      .replace(/(?<![\p{L}\d])DGT(?![\p{L}\d])/gu, "de ge te")
      .replace(/(?<![\p{L}\d])ITV(?![\p{L}\d])/gu, "i te uve")
      .replace(/(?<![\p{L}\d])ABS(?![\p{L}\d])/gu, "a be ese")
      .replace(/(?<![\p{L}\d])CBS(?![\p{L}\d])/gu, "ce be ese")
      .replace(/(?<![\p{L}\d])A2(?![\p{L}\d])/gu, "A dos")
      .replace(/(?<![\p{L}\d])A1(?![\p{L}\d])/gu, "A uno")
      .replace(/(?<![\p{L}\d])nº/gu, "número")
      .replace(/\bRD\b/g, "Real Decreto")
      .replace(/\bRGC\b/g, "Reglamento General de Circulación")
      .replace(/\bVMP\b/g, "vehículos de movilidad personal")
      .replace(/≠/g, " distinto de ")
      .replace(/[·•]/g, ", ")
      .replace(/[→›»]/g, ". ")
      .replace(/[«»"“”]/g, "")
      .replace(/\s+([,.;:])/g, "$1")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  function trozos(texto) {
    const frases = texto.match(/[^.!?;:]+[.!?;:]*\s*/g) || [texto];
    const out = [];
    let act = "";
    frases.forEach(f => {
      if ((act + f).length > 200 && act) { out.push(act.trim()); act = ""; }
      act += f;
    });
    if (act.trim()) out.push(act.trim());
    return out;
  }
  function textoDe(el) {
    if (el.tagName === "TR") {
      const celdas = [...el.children];
      return celdas.map(td => {
        const l = td.getAttribute("data-l");
        const v = td.textContent.trim();
        return l ? `${l}: ${v}` : v;
      }).filter(Boolean).join(". ");
    }
    return el.textContent;
  }
  function elementos() {
    const els = [...hoja.querySelectorAll(".banda h1, .banda p, h2, h3, p, li, .recuadro .r-cab, tbody tr, .figura-pie")]
      .filter(el => !el.closest(".fin-cap, .borrar-fila, .modos-t, figure"));
    const out = [];
    els.forEach(el => {
      let t = textoDe(el);
      if (el.matches(".recuadro .r-cab")) t = t.replace(/\s*·\s*/g, ". ");
      t = normalizar(t);
      if (t.length >= 2) out.push({ el, txt: t });
    });
    return out;
  }
  function huella(t) {
    let h = 5381;
    for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  window.__vozElementos = () => elementos().map(e => e.txt);
  fetch("audio/indice.json?v=" + (window.AUDIO_VER || "1")).then(r => r.ok ? r.json() : null).then(j => { INDICE = j; cargarVoces(); }).catch(() => {});
  function recoger() {
    const cap = CAPITULOS[pos.c];
    const clave = `c${cap.n}-p${pos.p + 1}`;
    const pista = selVoz.value === "neural" && INDICE ? INDICE[clave] : null;
    const cola = [];
    elementos().forEach(({ el, txt }, i) => {
      if (pista && pista[i] === huella(txt)) cola.push({ el, src: `audio/${clave}-${i}.mp3` });
      else trozos(txt).forEach(t => cola.push({ el, txt: t }));
    });
    return cola;
  }

  const reproductor = new Audio();
  reproductor.preload = "auto";
  function elementosTxt(el) { const e = elementos().find(x => x.el === el); return e ? e.txt : el.textContent; }
  let cola = [], idx = 0, activo = false, pausado = false, marcado = null, gen = 0;
  function marcar(el) {
    if (marcado === el) return;
    if (marcado) marcado.classList.remove("leyendo");
    marcado = el;
    if (!el) return;
    el.classList.add("leyendo");
    const r = el.getBoundingClientRect();
    if (r.top < 90 || r.bottom > window.innerHeight - 150) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  function vozElegida() {
    return lista.find(v => v.name === selVoz.value) || lista.find(v => tiene(v.name.toLowerCase(), FEMENINAS)) || lista[0] || null;
  }
  function hablar() {
    const mi = gen;
    if (!activo || pausado) return;
    if (idx >= cola.length) { finPagina(); return; }
    const { el, txt, src } = cola[idx];
    marcar(el);
    if (src) {
      reproductor.src = src;
      reproductor.playbackRate = Number(selVel.value) || 1;
      reproductor.onended = () => { if (mi !== gen || !activo || pausado) return; idx++; hablar(); };
      reproductor.onerror = () => { if (mi !== gen) return; cola.splice(idx, 1, ...trozos(elementosTxt(el)).map(t => ({ el, txt: t }))); hablar(); };
      const pr = reproductor.play();
      if (pr && pr.catch) pr.catch(() => {});
      return;
    }
    const u = new SpeechSynthesisUtterance(txt);
    const v = vozElegida();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "es-ES";
    u.rate = Number(selVel.value) || 1;
    u.pitch = 1.05;
    u.onend = () => { if (mi !== gen || !activo || pausado) return; idx++; hablar(); };
    u.onerror = e => { if (mi !== gen) return; if (e.error === "interrupted" || e.error === "canceled") return; idx++; hablar(); };
    synth.speak(u);
  }
  function finPagina() {
    const cap = CAPITULOS[pos.c];
    if (chkSeguir.checked && pos.p < cap.paginas.length - 1) { siguiente(); return; }
    parar();
  }
  function empezarPagina() {
    gen++;
    synth.cancel();
    reproductor.pause();
    cola = recoger();
    idx = 0;
    pausado = false;
    actualizarUI();
    setTimeout(hablar, 120);
  }
  function iniciar() {
    activo = true;
    barra.classList.remove("oculto");
    empezarPagina();
  }
  function pausar() {
    pausado = true;
    if (cola[idx] && cola[idx].src && !reproductor.paused) { reproductor.pause(); actualizarUI(); return; }
    gen++;
    synth.cancel();
    actualizarUI();
  }
  function reanudar() {
    pausado = false;
    actualizarUI();
    if (cola[idx] && cola[idx].src && reproductor.src && reproductor.currentTime > 0 && !reproductor.ended) { reproductor.play(); return; }
    gen++;
    hablar();
  }
  function parar() {
    activo = false;
    pausado = false;
    gen++;
    synth.cancel();
    reproductor.pause();
    marcar(null);
    barra.classList.add("oculto");
    actualizarUI();
  }
  function actualizarUI() {
    btnVoz.classList.toggle("on", activo);
    btnVoz.setAttribute("aria-pressed", activo ? "true" : "false");
    bPlay.innerHTML = activo && !pausado ? '<span aria-hidden="true">❚❚</span> Pausa' : '<span aria-hidden="true">▶</span> Seguir';
  }
  function guardarPrefs() {
    prefs.rate = Number(selVel.value) || 1;
    prefs.voz = selVoz.value;
    prefs.seguir = chkSeguir.checked;
    guardar(CLAVE, prefs);
  }

  btnVoz.addEventListener("click", () => { if (activo) parar(); else iniciar(); });
  bPlay.addEventListener("click", () => { if (!activo) iniciar(); else if (pausado) reanudar(); else pausar(); });
  bParar.addEventListener("click", parar);
  selVel.addEventListener("change", () => { guardarPrefs(); reproductor.playbackRate = Number(selVel.value) || 1; if (activo && !pausado && !(cola[idx] && cola[idx].src)) { gen++; synth.cancel(); hablar(); } });
  selVoz.addEventListener("change", () => { guardarPrefs(); if (activo) empezarPagina(); });
  chkSeguir.addEventListener("change", guardarPrefs);
  hoja.addEventListener("dblclick", e => {
    if (!activo) return;
    const i = cola.findIndex(c => c.el === e.target.closest("p, li, h2, h3, tr, .r-cab"));
    if (i >= 0) { idx = i; gen++; synth.cancel(); reproductor.pause(); pausado = false; actualizarUI(); hablar(); }
  });

  const pintarAnterior = pintar;
  pintar = function (d) {
    pintarAnterior(d);
    if (activo) empezarPagina();
  };
  const mostrarAnterior = mostrar;
  mostrar = function (nombre) {
    if (nombre !== "lector" && activo) parar();
    mostrarAnterior(nombre);
  };
  window.addEventListener("pagehide", () => { synth.cancel(); reproductor.pause(); });
  actualizarUI();
})();
