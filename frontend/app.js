// ═══════════════════════════════════════════════════════════════
//  HAPPY BODY CLINIC & SPA — app.js
//  Selección de un servicio por agenda, disponibilidad real desde MongoDB
// ═══════════════════════════════════════════════════════════════

const API_URL = 'http://localhost:3001'; // ← REEMPLAZAR con tu URL real de Railway

// ── Estado global ─────────────────────────────────────────────
let S = {
  CATS:  [],
  SVCS:  [],
  SPECS: [],

  svc:    null,       // servicio seleccionado (uno solo)
  spec:   null,
  date:   null,
  time:   null,

  availableSlots: [],
  blockedSlots:   [],

  calM: new Date().getMonth(),
  calY: new Date().getFullYear(),
};

// ─────────────────────────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────────────────────────

function toMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function fromMin(m) {
  const h = Math.floor(m / 60), mm = m % 60;
  return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}
function fmt(t) {
  const [hh, mm] = t.split(':');
  const h = +hh;
  return `${h > 12 ? h - 12 : h}:${mm} ${h >= 12 ? 'pm' : 'am'}`;
}
function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function durLabel(min) {
  if (min < 60)        return `${min} min`;
  if (min === 60)      return '1 hora';
  if (min % 60 === 0)  return `${min / 60} horas`;
  return `${Math.floor(min/60)}h ${min % 60}min`;
}


// ─────────────────────────────────────────────────────────────
//  INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  checkHealth();
  loadInitialData();
});

async function checkHealth() {
  const dot  = document.getElementById('connection-dot');
  const pill = document.getElementById('connection-pill');
  try {
    const res  = await fetch(`${API_URL}/health`);
    const data = await res.json();
    if (data.ok) {
      pill.textContent     = 'En línea';
      dot.style.background = 'var(--gold)';
    } else throw new Error();
  } catch {
    pill.textContent     = 'Sin conexión';
    dot.style.background = '#e05050';
  }
}

async function loadInitialData() {
  try {
    const [svcRes, specRes] = await Promise.all([
      fetch(`${API_URL}/api/services`),
      fetch(`${API_URL}/api/specialists`),
    ]);
    if (!svcRes.ok || !specRes.ok) throw new Error('Error en la respuesta del servidor');

    const svcData  = await svcRes.json();
    const specData = await specRes.json();
    if (!svcData.ok || !specData.ok) throw new Error('Datos inválidos');

    S.SVCS  = svcData.data;
    S.SPECS = specData.data;

    // Construir categorías únicas en orden de aparición
    const catMap = new Map();
    S.SVCS.forEach(sv => {
      if (!catMap.has(sv.category)) {
        catMap.set(sv.category, { id: sv.category, name: sv.categoryName, color: sv.categoryColor });
      }
    });
    S.CATS = Array.from(catMap.values());

    renderSvcs();
    renderSpecList();
    updateConfirm();

  } catch (err) {
    console.error('Error cargando datos:', err);
    document.getElementById('service-list').innerHTML = `
      <div class="error-banner" style="margin:0;">
        <span>No se pudo conectar. Verifica que el backend esté corriendo.</span>
        <button onclick="loadInitialData()">↻ Reintentar</button>
      </div>`;
  }
}

// ─────────────────────────────────────────────────────────────
//  TABS
// ─────────────────────────────────────────────────────────────

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) =>
    b.classList.toggle('active', ['agendar','especialistas'][i] === name));
  document.querySelectorAll('.tab-panel').forEach(p =>
    p.classList.toggle('active', p.id === 'tab-' + name));
  if (name === 'especialistas') renderSpecs();
}

// ─────────────────────────────────────────────────────────────
//  PASO 1 — SERVICIOS (MULTISELECCIÓN)
// ─────────────────────────────────────────────────────────────

function renderSvcs() {
  let h = '';
  S.CATS.forEach(cat => {
    const items = S.SVCS.filter(sv => sv.category === cat.id);
    if (!items.length) return;
    h += `<div class="cat-header">${cat.name}</div>`;
    items.forEach(sv => {
      const sel    = S.svc?.serviceId === sv.serviceId;
      const durTxt = sv.durationMinutes < 60
        ? sv.durationMinutes + 'min'
        : (sv.durationMinutes === 60 ? '1h' : (sv.durationMinutes/60) + 'h');
      h += `
        <div class="service-row ${sel ? 'selected' : ''}" onclick="selSvc('${sv.serviceId}')">
          <span class="service-row-dot" style="background:${cat.color};"></span>
          <span class="service-row-name">${sv.name}</span>
          <span style="font-size:9px;color:var(--gold-dim);white-space:nowrap;border:1px solid var(--border);padding:1px 5px;margin-left:4px;">⏱${durTxt}</span>
          <span class="service-row-check">✓</span>
        </div>`;
    });
  });
  document.getElementById('service-list').innerHTML = h ||
    '<p style="padding:16px;font-size:12px;color:var(--muted);">No hay servicios disponibles</p>';
}

function selSvc(id) {
  S.svc  = S.SVCS.find(s => s.serviceId === id);
  S.spec = null;
  S.date = null;
  S.time = null;
  S.availableSlots = [];
  S.blockedSlots   = [];

  const di = document.getElementById('slot-dur-info');
  if (di) di.style.display = 'none';
  document.getElementById('slots-section').style.display = 'none';
  document.getElementById('cal-section').style.display   = 'none';

  renderSvcs();
  renderSpecList();
  updateConfirm();
}

// ── Búsqueda en tiempo real ───────────────────────────────────
function filterSvcs(q) {
  const query    = q.trim().toLowerCase();
  const clearBtn = document.getElementById('svc-clear');
  const noRes    = document.getElementById('svc-no-results');
  clearBtn.classList.toggle('visible', q.length > 0);

  const list = document.getElementById('service-list');
  let visibleCount = 0;

  list.querySelectorAll('.service-row').forEach(row => {
    const name  = row.querySelector('.service-row-name').textContent.toLowerCase();
    const match = !query || name.includes(query);
    row.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });

  list.querySelectorAll('.cat-header').forEach(hdr => {
    let next = hdr.nextElementSibling, anyVisible = false;
    while (next && !next.classList.contains('cat-header')) {
      if (next.style.display !== 'none') anyVisible = true;
      next = next.nextElementSibling;
    }
    hdr.style.display = anyVisible ? '' : 'none';
  });

  noRes.classList.toggle('show', visibleCount === 0 && query.length > 0);
}

function clearSearch() {
  const inp = document.getElementById('svc-search');
  inp.value = '';
  filterSvcs('');
  inp.focus();
}

// ─────────────────────────────────────────────────────────────
//  PASO 2A — ESPECIALISTAS
//  Filtra: solo las que realizan TODOS los servicios seleccionados
// ─────────────────────────────────────────────────────────────

function renderSpecList() {
  const el = document.getElementById('spec-list');

  if (!S.svc) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">✦</span><p>Selecciona un tratamiento primero</p></div>';
    document.getElementById('cal-section').style.display = 'none';
    return;
  }

  el.innerHTML = S.SPECS.map(sp => {
    const spServices = Array.isArray(sp.services) ? sp.services : [];
    const ok  = spServices.includes(S.svc.serviceId);
    const sel = S.spec?.specialistId === sp.specialistId;

    return `
      <div class="spec-row ${sel ? 'selected' : ''} ${!ok ? 'unavail' : ''}"
           onclick="${ok ? `selSpec('${sp.specialistId}')` : ''}">
        <div class="spec-mono" style="background:${sp.color};">${sp.initials}</div>
        <div class="spec-info">
          <div class="spec-info-name">${sp.name}</div>
          <div class="spec-info-role">${sp.role}</div>
        </div>
        ${ok
          ? `<div class="spec-badge">Disponible</div>`
          : `<span style="font-size:10px;color:var(--muted);letter-spacing:.5px;">No realiza todos</span>`}
      </div>`;
  }).join('');
}

function selSpec(id) {
  S.spec = S.SPECS.find(s => s.specialistId === id);
  S.date = null;
  S.time = null;
  S.availableSlots = [];
  S.blockedSlots   = [];

  renderSpecList();
  document.getElementById('cal-section').style.display   = 'block';
  document.getElementById('slots-section').style.display = 'none';
  renderCal();
  updateConfirm();
}

// ─────────────────────────────────────────────────────────────
//  PASO 2B — CALENDARIO
// ─────────────────────────────────────────────────────────────

const MNS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
             'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DNS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function renderCal() {
  document.getElementById('cal-lbl').textContent = `${MNS[S.calM]} ${S.calY}`;
  const today    = new Date();
  const firstDay = new Date(S.calY, S.calM, 1).getDay();
  const dim      = new Date(S.calY, S.calM+1, 0).getDate();
  const workDays = Array.isArray(S.spec?.workDays) ? S.spec.workDays : [];

  let h = DNS.map(d => `<div class="cal-dh">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) h += `<div class="cal-d empty"></div>`;
  for (let d = 1; d <= dim; d++) {
    const date = new Date(S.calY, S.calM, d);
    const dow  = date.getDay();
    const past = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isT  = d === today.getDate() && S.calM === today.getMonth() && S.calY === today.getFullYear();
    const isSel = S.date?.getDate() === d && S.date?.getMonth() === S.calM;
    const ok   = workDays.includes(dow) && !past;

    let cls = 'cal-d';
    if (past)       cls += ' past';
    else if (isSel) cls += ' sel';
    else if (ok)    cls += ' avail';
    if (isT && !isSel) cls += ' today-d';

    h += `<div class="${cls}" onclick="${ok ? `selDate(${d})` : ''}">${d}</div>`;
  }
  document.getElementById('cal-grid').innerHTML = h;
}

function selDate(d) {
  S.date = new Date(S.calY, S.calM, d);
  S.time = null;
  S.availableSlots = [];
  S.blockedSlots   = [];

  renderCal();
  document.getElementById('slots-section').style.display = 'block';
  document.getElementById('slot-dur-info').style.display  = 'none';
  fetchSlots();
  updateConfirm();
}

function changeMonth(dir) {
  S.calM += dir;
  if (S.calM < 0)  { S.calM = 11; S.calY--; }
  if (S.calM > 11) { S.calM = 0;  S.calY++; }
  renderCal();
}

// ─────────────────────────────────────────────────────────────
//  PASO 2C — SLOTS
//  La duración que se consulta es la SUMA de todos los servicios
// ─────────────────────────────────────────────────────────────

async function fetchSlots() {
  if (!S.spec || !S.date || !S.svc) return;

  const slotsGrid  = document.getElementById('slots-grid');
  const errorBaner = document.getElementById('slots-error');
  const durInfo    = document.getElementById('slot-dur-info');

  errorBaner.style.display = 'none';
  slotsGrid.innerHTML = `
    <div class="loading-overlay" style="grid-column:1/-1;">
      <div class="spinner"></div>
      <span class="loading-text">Consultando disponibilidad…</span>
    </div>`;

  const dateStr = dateToStr(S.date);
  const dur     = S.svc.durationMinutes;
  const url     = `${API_URL}/api/appointments/available?specialistId=${S.spec.specialistId}&date=${dateStr}&serviceDuration=${dur}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Error al consultar disponibilidad');

    S.availableSlots = data.available || [];
    S.blockedSlots   = data.blocked   || [];

    renderSlots();

    durInfo.innerHTML     = `<span>⏱</span> Duración del tratamiento: <strong>${durLabel(dur)}</strong>`;
    durInfo.style.display = 'flex';

  } catch (err) {
    console.error('Error fetching slots:', err);
    slotsGrid.innerHTML = '';
    document.getElementById('slots-error-msg').textContent = err.message || 'No se pudo cargar la disponibilidad';
    errorBaner.style.display = 'flex';
  }
}

function retrySlots() { fetchSlots(); }

function renderSlots() {
  const slotsGrid = document.getElementById('slots-grid');

  if (S.availableSlots.length === 0 && S.blockedSlots.length === 0) {
    slotsGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:24px;font-size:12px;color:var(--muted);">
        <span style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:28px;
                     color:rgba(196,132,90,0.3);display:block;margin-bottom:8px;">✦</span>
        La especialista no atiende este día
      </div>`;
    return;
  }

  const allSlots = [...S.availableSlots, ...S.blockedSlots]
    .sort((a, b) => toMin(a) - toMin(b));

  const dur    = S.svc.durationMinutes;
  const occSet = new Set();
  if (S.time) {
    const tStart = toMin(S.time);
    for (let m = tStart; m < tStart + dur; m += 30) occSet.add(fromMin(m));
  }

  slotsGrid.innerHTML = allSlots.map(t => {
    const isBlocked    = S.blockedSlots.includes(t);
    const isSel        = S.time === t;
    const isWillOccupy = occSet.has(t) && !isSel && !isBlocked;
    const durBadge     = isSel ? `<span class="slot-dur">${durLabel(dur)}</span>` : '';

    let cls = 'slot';
    if (isSel)             cls += ' sel';
    else if (isBlocked)    cls += ' taken';
    else if (isWillOccupy) cls += ' will-occupy';

    return `<div class="${cls}" onclick="${!isBlocked ? `selTime('${t}')` : ''}">
      ${fmt(t)}${durBadge}
    </div>`;
  }).join('');
}

function selTime(t) {
  S.time = t;
  renderSlots();
  updateConfirm();
}

// ─────────────────────────────────────────────────────────────
//  PASO 3 — CONFIRMACIÓN
// ─────────────────────────────────────────────────────────────

function updateConfirm() {
  const ready = S.svc && S.spec && S.date && S.time;
  document.getElementById('empty-confirm').style.display = ready ? 'none'  : 'block';
  document.getElementById('confirm-form').style.display  = ready ? 'block' : 'none';
  if (!ready) return;

  const ds      = S.date.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const endTime = fmt(fromMin(toMin(S.time) + S.svc.durationMinutes));

  document.getElementById('booking-recap').innerHTML = `
    <div>✦ <strong>Tratamiento:</strong> ${S.svc.name}</div>
    <div>◆ <strong>Duración:</strong> ${durLabel(S.svc.durationMinutes)}</div>
    <div>◈ <strong>Especialista:</strong> ${S.spec.name}</div>
    <div>◆ <strong>Fecha:</strong> ${ds}</div>
    <div>◈ <strong>Horario:</strong> ${fmt(S.time)} – ${endTime}</div>`;
}

// ── POST a la API ─────────────────────────────────────────────
async function confirmBooking() {
  const name  = document.getElementById('pat-name').value.trim();
  const phone = document.getElementById('pat-phone').value.trim();
  if (!name) { document.getElementById('pat-name').focus(); return; }

  const btn    = document.getElementById('btn-book');
  const errEl  = document.getElementById('confirm-error');
  const errMsg = document.getElementById('confirm-error-msg');

  btn.disabled    = true;
  btn.textContent = 'Confirmando…';
  btn.classList.add('loading');
  errEl.style.display = 'none';

  const dateStr = dateToStr(S.date);
  const endTime = fromMin(toMin(S.time) + S.svc.durationMinutes);

  const body = {
    patientName:     name,
    patientPhone:    phone,
    specialistId:    S.spec.specialistId,
    serviceId:       S.svc.serviceId,
    serviceNames:    S.svc.name,
    date:            dateStr,
    startTime:       S.time,
    endTime:         endTime,
    durationMinutes: S.svc.durationMinutes,
  };

  try {
    const res  = await fetch(`${API_URL}/api/appointments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();

    if (res.status === 409) throw new Error(data.error || 'Este horario ya fue ocupado. Elige otro.');
    if (!res.ok || !data.ok) throw new Error(data.error || 'Error al confirmar la cita');

    // ── Éxito ─────────────────────────────────────────────
    const ds     = S.date.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

    document.getElementById('modal-recap').innerHTML = `
      <div>👤 <strong>Paciente:</strong> ${name}</div>
      <div>✦ <strong>Tratamiento:</strong> ${S.svc.name}</div>
      <div>◆ <strong>Duración:</strong> ${durLabel(S.svc.durationMinutes)}</div>
      <div>◈ <strong>Especialista:</strong> ${S.spec.name}</div>
      <div>◆ <strong>Fecha:</strong> ${ds}</div>
      <div>◈ <strong>Horario:</strong> ${fmt(S.time)} – ${fmt(endTime)}</div>
      ${phone ? `<div>📱 <strong>WhatsApp:</strong> ${phone}</div>` : ''}`;

    document.getElementById('modal-bg').classList.add('open');
    await fetchSlots(); // refrescar disponibilidad

  } catch (err) {
    console.error('Error al confirmar:', err);
    errMsg.textContent  = err.message || 'Ocurrió un error. Intenta de nuevo.';
    errEl.style.display = 'flex';
    if (err.message && err.message.includes('ocupado')) {
      S.time = null;
      await fetchSlots();
      updateConfirm();
    }
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Confirmar Cita';
    btn.classList.remove('loading');
  }
}

function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
  S.svc  = null;
  S.spec = S.date = S.time = null;
  S.availableSlots = [];
  S.blockedSlots   = [];
  document.getElementById('pat-name').value  = '';
  document.getElementById('pat-phone').value = '';
  document.getElementById('confirm-error').style.display = 'none';
  clearSearch();
  renderSvcs();
  renderSpecList();
  updateConfirm();
  document.getElementById('cal-section').style.display   = 'none';
  document.getElementById('slots-section').style.display = 'none';
}

// ─────────────────────────────────────────────────────────────
//  TAB ESPECIALISTAS
// ─────────────────────────────────────────────────────────────

const ALBL = { high:'Alta disponibilidad', med:'Disponibilidad media', sat:'Solo Sábados', low:'Baja disponibilidad' };

function renderSpecs() {
  const grid = document.getElementById('specs-grid');
  if (!S.SPECS.length) {
    grid.innerHTML = `<div class="loading-overlay" style="grid-column:1/-1"><div class="spinner"></div><span class="loading-text">Cargando…</span></div>`;
    return;
  }
  grid.innerHTML = S.SPECS.map(sp => {
    const treats = S.SVCS.filter(sv => (sp.services || []).includes(sv.serviceId));
    const schedMap     = sp.scheduleDisplay || {};
    const schedEntries = schedMap instanceof Map ? [...schedMap] : Object.entries(schedMap);
    return `<div class="spec-card">
      <div class="spec-card-top">
        <div class="spec-card-mono" style="background:${sp.color};">${sp.initials}</div>
        <div class="spec-card-ti"><h3>${sp.name}</h3><p>${sp.role}</p></div>
      </div>
      <div class="spec-card-body">
        <div class="sc-lbl">Tratamientos (${treats.length})</div>
        <div class="sc-tags">${treats.map(t => `<span class="sc-tag">${t.name}</span>`).join('')}</div>
        <div class="sc-lbl">Horario</div>
        <table class="sched-t">${schedEntries.map(([d,h]) => `<tr><td>${d}</td><td>${h}</td></tr>`).join('')}</table>
        <div class="avail-row">
          <span>Disponibilidad</span>
          <span class="avail-badge ${sp.availability}">${ALBL[sp.availability] || sp.availability}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}
