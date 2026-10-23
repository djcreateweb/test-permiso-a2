// Inicio de sesión con usuario y contraseña y sincronización del progreso (Firebase).
// Se guardan: páginas leídas, posición de lectura, falladas, estadísticas y posición en "Las 200 seguidas".
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CFG = window.FIREBASE_CONFIG;
const CLAVES = ["a2_falladas_v1", "a2_stats_v1", "a2_pos_todas_v1", "a2_teoria_leido_v1", "a2_teoria_pos_v1"];
const K_T = "a2_sync_t";      // momento del último cambio local
const K_UID = "a2_sync_uid";  // cuenta con la que está enlazado este dispositivo
const DOMINIO = "@permiso-a2.app";

const btn = document.getElementById("btnCuenta");
const caja = document.getElementById("cuenta");
if (!CFG || !btn || !caja) throw new Error("cuenta: sin configurar");
btn.classList.remove("oculto");

const app = initializeApp(CFG);
const auth = getAuth(app);
const db = getFirestore(app);

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { Storage.prototype._set.call(localStorage, k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const json = (s, d) => { try { return s ? JSON.parse(s) : d; } catch (e) { return d; } };

// ---------- detectar cambios locales y subirlos ----------
Storage.prototype._set = Storage.prototype.setItem;
let usuario = null, subiendo = null, cargando = false;
Storage.prototype.setItem = function (k, v) {
  Storage.prototype._set.call(this, k, v);
  if (this === localStorage && CLAVES.includes(k) && !cargando) {
    Storage.prototype._set.call(this, K_T, String(Date.now()));
    programarSubida();
  }
};
function programarSubida() {
  if (!usuario) return;
  clearTimeout(subiendo);
  subiendo = setTimeout(subir, 1500);
}
function datosLocales() {
  const d = {};
  CLAVES.forEach(k => { const v = ls.get(k); if (v != null) d[k] = v; });
  return d;
}
async function subir() {
  if (!usuario) return;
  estado("Guardando…");
  try {
    await setDoc(doc(db, "usuarios", usuario.uid), { datos: datosLocales(), t: Number(ls.get(K_T) || Date.now()), usuario: usuario.displayName || "" });
    estado("Progreso guardado en tu cuenta");
  } catch (e) { estado("Sin conexión: se guardará al volver"); }
}
window.addEventListener("online", programarSubida);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && usuario && subiendo) { clearTimeout(subiendo); subir(); } });

// ---------- mezclar progreso del dispositivo con el de la cuenta (primera vez) ----------
function mezclar(local, remoto) {
  const r = { ...remoto };
  const L = k => json(local[k], null), R = k => json(remoto[k], null);
  // páginas leídas: unión
  const lL = L("a2_teoria_leido_v1") || {}, lR = R("a2_teoria_leido_v1") || {};
  const leido = { ...lR };
  Object.keys(lL).forEach(c => { leido[c] = [...new Set([...(lR[c] || []), ...(lL[c] || [])])].sort((a, b) => a - b); });
  r.a2_teoria_leido_v1 = JSON.stringify(leido);
  // falladas: unión, con el mayor número de veces
  const fL = L("a2_falladas_v1") || {}, fR = R("a2_falladas_v1") || {};
  const fall = { ...fR };
  Object.keys(fL).forEach(n => { if (!fall[n] || fL[n].veces > fall[n].veces) fall[n] = fL[n]; });
  r.a2_falladas_v1 = JSON.stringify(fall);
  // estadísticas: la que tenga más preguntas respondidas
  const sL = L("a2_stats_v1"), sR = R("a2_stats_v1");
  if (sL && (!sR || sL.respondidas > sR.respondidas)) r.a2_stats_v1 = local.a2_stats_v1;
  ["a2_pos_todas_v1", "a2_teoria_pos_v1"].forEach(k => { if (r[k] == null && local[k] != null) r[k] = local[k]; });
  return r;
}

function aplicar(datos) {
  const antes = JSON.stringify(datosLocales());
  cargando = true;
  CLAVES.forEach(k => { if (datos[k] != null) ls.set(k, datos[k]); else ls.del(k); });
  cargando = false;
  return antes !== JSON.stringify(datosLocales());
}

async function sincronizar(u) {
  estado("Sincronizando…");
  let snap;
  try { snap = await getDoc(doc(db, "usuarios", u.uid)); }
  catch (e) { estado("Sin conexión: se sincronizará al volver"); return; }
  const local = datosLocales();
  const tLocal = Number(ls.get(K_T) || 0);
  const enlazado = ls.get(K_UID) === u.uid;
  let cambia = false;
  if (!snap.exists()) {
    ls.set(K_UID, u.uid);
    await subir();
  } else {
    const rem = snap.data();
    if (!enlazado) {
      // primera vez en este dispositivo: se suma lo de aquí a lo de la cuenta
      cambia = aplicar(mezclar(local, rem.datos || {}));
      ls.set(K_UID, u.uid);
      ls.set(K_T, String(Date.now()));
      await subir();
    } else if ((rem.t || 0) > tLocal) {
      cambia = aplicar(rem.datos || {});
      ls.set(K_T, String(rem.t));
      estado("Progreso cargado de tu cuenta");
    } else if (tLocal > (rem.t || 0)) {
      await subir();
    } else estado("Progreso sincronizado");
  }
  if (cambia) location.reload();
}

// ---------- interfaz ----------
const form = document.getElementById("cuentaForm");
const inUser = document.getElementById("cUsuario");
const inPass = document.getElementById("cPass");
const err = document.getElementById("cError");
const enviar = document.getElementById("cEnviar");
const pEntrar = document.getElementById("cPanelEntrar");
const pDentro = document.getElementById("cPanelDentro");
const cEstado = document.getElementById("cEstado");
let modo = "entrar";

function estado(t) { if (cEstado) cEstado.textContent = t; btn.title = t; }
function abrir() { caja.classList.remove("oculto"); err.textContent = ""; if (!usuario) setTimeout(() => inUser.focus(), 50); }
function cerrar() { caja.classList.add("oculto"); }
btn.addEventListener("click", abrir);
document.getElementById("cCerrar").addEventListener("click", cerrar);
caja.addEventListener("click", e => { if (e.target === caja) cerrar(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !caja.classList.contains("oculto")) cerrar(); });

document.querySelectorAll("[data-cmodo]").forEach(b => b.addEventListener("click", () => {
  modo = b.dataset.cmodo;
  document.querySelectorAll("[data-cmodo]").forEach(x => x.classList.toggle("on", x === b));
  enviar.textContent = modo === "entrar" ? "Entrar" : "Crear cuenta";
  inPass.autocomplete = modo === "entrar" ? "current-password" : "new-password";
  document.getElementById("cAyuda").textContent = modo === "entrar"
    ? "Entra con el usuario y la contraseña que creaste."
    : "Elige un usuario (3-20 letras o números, sin espacios) y una contraseña de al menos 6 caracteres.";
  err.textContent = "";
}));

const MENSAJES = {
  "auth/invalid-credential": "Usuario o contraseña incorrectos.",
  "auth/wrong-password": "Usuario o contraseña incorrectos.",
  "auth/user-not-found": "Ese usuario no existe. ¿Quieres crear la cuenta?",
  "auth/email-already-in-use": "Ese usuario ya existe. Elige otro o entra con él.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/too-many-requests": "Demasiados intentos. Espera un poco y vuelve a probar.",
  "auth/network-request-failed": "Sin conexión a internet."
};

form.addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = inUser.value.trim().toLowerCase();
  const pass = inPass.value;
  if (!/^[a-z0-9._-]{3,20}$/.test(nombre)) { err.textContent = "El usuario debe tener de 3 a 20 letras o números, sin espacios ni tildes."; return; }
  if (pass.length < 6) { err.textContent = "La contraseña debe tener al menos 6 caracteres."; return; }
  enviar.disabled = true; err.textContent = "";
  try {
    if (modo === "entrar") await signInWithEmailAndPassword(auth, nombre + DOMINIO, pass);
    else {
      const c = await createUserWithEmailAndPassword(auth, nombre + DOMINIO, pass);
      await updateProfile(c.user, { displayName: nombre });
    }
    inPass.value = "";
  } catch (x) {
    err.textContent = MENSAJES[x.code] || "No se ha podido completar. Inténtalo de nuevo.";
  } finally { enviar.disabled = false; }
});

const proveedor = new GoogleAuthProvider();
proveedor.setCustomParameters({ prompt: "select_account" });
const modoApp = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
const ua = navigator.userAgent || "";
const enApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|GSA\/|; wv\)/i.test(ua);
function avisoGoogle() {
  return modoApp
    ? "Desde el icono de la pantalla de inicio Google no puede volver a la web. Abre la web en Safari o Chrome para entrar con Google, o usa usuario y contraseña."
    : "Este navegador no deja abrir la ventana de Google. Abre la web en Safari o Chrome, o usa usuario y contraseña.";
}
document.getElementById("cGoogle").addEventListener("click", () => {
  err.textContent = "";
  if (modoApp || enApp) { err.textContent = avisoGoogle(); return; }
  signInWithPopup(auth, proveedor).catch(x => {
    if (x.code === "auth/popup-closed-by-user" || x.code === "auth/cancelled-popup-request" || x.code === "auth/user-cancelled") return;
    if (x.code === "auth/popup-blocked") err.textContent = "El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes para esta web y vuelve a pulsar.";
    else if (x.code === "auth/operation-not-supported-in-this-environment" || x.code === "auth/web-storage-unsupported") err.textContent = avisoGoogle();
    else if (x.code === "auth/unauthorized-domain") err.textContent = "Dominio no autorizado para Google.";
    else if (x.code === "auth/account-exists-with-different-credential") err.textContent = "Ya tienes una cuenta con otro método de acceso.";
    else err.textContent = MENSAJES[x.code] || "No se ha podido entrar con Google. Inténtalo de nuevo.";
  });
});

document.getElementById("cSalir").addEventListener("click", async () => {
  if (subiendo) { clearTimeout(subiendo); await subir(); }
  await signOut(auth);
  ls.del(K_UID);
  cerrar();
});

onAuthStateChanged(auth, u => {
  usuario = u;
  const nombre = u ? (u.displayName ? u.displayName.split(" ")[0] : (u.email || "").replace(DOMINIO, "")) : "";
  btn.querySelector("span").textContent = u ? nombre : "Entrar";
  btn.classList.toggle("dentro", !!u);
  pEntrar.classList.toggle("oculto", !!u);
  pDentro.classList.toggle("oculto", !u);
  document.getElementById("cNombre").textContent = nombre;
  if (u) { sincronizar(u); if (!caja.classList.contains("oculto")) setTimeout(cerrar, 900); }
});
