/* =====================================================================
   MODEL + VIZUALIZACIJE — čist JS, bez biblioteka.
   ===================================================================== */
'use strict';

const $ = (s) => document.querySelector(s);
const NF = new Intl.NumberFormat('sr-RS');
const fmt = (n) => NF.format(Math.round(n));
const fmtM = (n) => (n / 1e6).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' mil.';
const pct = (n, d = 1) => n.toLocaleString('sr-RS', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' %';
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const COLORS = () => ({ student: css('--c-student'), opp: css('--c-opp'), min: css('--c-min'), sps: css('--c-sps'), sns: css('--c-sns'), rest: css('--c-rest') });

const MAJORITY = 126;
const INVALID_RATE = E2023.invalid / E2023.cast;      // 2,73 %
const byId = Object.fromEntries(E2023.lists.map((l) => [l.id, l]));

/* Opoziciona baza 2023: sve liste bloka 'opp' + polovina Nacionalnog okupljanja (Dveri) */
const OPP_BASE = E2023.lists.filter((l) => l.bloc === 'opp').reduce((s, l) => s + l.votes, 0) + byId.no.votes / 2;
/* SRS + Zavetnici (polovina NO) — 2026. na Vučićevoj listi / u Vladi */
const GOV_EXTRA = byId.srs.votes + byId.no.votes / 2;
const MINORITIES = E2023.lists.filter((l) => l.bloc === 'min');

const DEFAULTS = { turnout: 3815007, sns: 1783701, sps: 249916, oppShare: 85, newShare: 100, otherLists: 2, addSrs: false };
let P = { ...DEFAULTS };

/* ---------- D'Ont ---------- */
function dhondt(entries, seats, threshold) {
  const elig = entries.filter((e) => e.votes >= threshold || (e.minority && e.votes > 0));
  const q = [];
  for (const e of elig) {
    const coef = e.minority && e.votes < threshold ? 1.35 : 1;
    for (let k = 1; k <= seats; k++) q.push({ id: e.id, v: (e.votes * coef) / k });
  }
  q.sort((a, b) => b.v - a.v);
  const out = {};
  for (const e of entries) out[e.id] = 0;
  for (let i = 0; i < seats && i < q.length; i++) out[q[i].id]++;
  return out;
}

/* ---------- simulacija za date parametre ---------- */
function simulate(p) {
  const T = p.turnout;
  const invalid = Math.round(T * INVALID_RATE);
  const valid = T - invalid;
  const threshold = T * 0.03;
  const deltaValid = valid - E2023.valid;             // novi (ili izgubljeni) važeći glasovi

  let student = OPP_BASE * (p.oppShare / 100) + deltaValid * (p.newShare / 100);
  let sns = p.sns + (p.addSrs ? GOV_EXTRA : 0) + deltaValid * (1 - p.newShare / 100);
  student = Math.max(0, student);
  sns = Math.max(0, sns);
  const otherOppTotal = OPP_BASE * (1 - p.oppShare / 100);
  const perOther = otherOppTotal / p.otherLists;

  const entries = [
    { id: 'student', label: 'Studentska lista', votes: student, color: 'student', bloc: 'opp' },
    { id: 'sns', label: 'Aleksandar Vučić – Ujedinjena Srbija (SNS)', votes: sns, color: 'sns', bloc: 'gov' },
    { id: 'sps', label: 'Ivica Dačić – Faktor stabilnosti (SPS–JS)', votes: p.sps, color: 'sps', bloc: 'gov' },
  ];
  for (let i = 0; i < p.otherLists; i++) entries.push({ id: 'opp' + i, label: 'Ostala opoziciona lista ' + (i + 1), votes: perOther, color: 'opp', bloc: 'opp', group: 'other' });
  for (const m of MINORITIES) entries.push({ id: m.id, label: m.short, votes: m.votes, color: 'min', bloc: m.minGov ? 'gov' : 'opp', minority: true, group: 'min' });

  const assigned = entries.reduce((s, e) => s + e.votes, 0);
  const rest = Math.max(0, valid - assigned);          // rasuti glasovi (npr. SRS/Zavetnici ako nisu dodati)
  const seats = dhondt(entries, E2023.seats, threshold);
  for (const e of entries) { e.seats = seats[e.id]; e.pct = (e.votes / T) * 100; e.pass = e.votes >= threshold || (e.minority && e.seats > 0); }

  const govSeats = entries.filter((e) => e.bloc === 'gov').reduce((s, e) => s + e.seats, 0);
  const oppSeats = entries.filter((e) => e.bloc === 'opp').reduce((s, e) => s + e.seats, 0);
  const g = (id) => entries.find((e) => e.id === id);
  return { T, invalid, valid, threshold, entries, rest, govSeats, oppSeats, student: g('student'), sns: g('sns'), sps: g('sps'),
    otherOpp: entries.filter((e) => e.group === 'other'), minorities: entries.filter((e) => e.group === 'min') };
}

/* krivulja mandata po izlaznosti (za glavni dijagram i prelomne tačke) */
const T_MIN = 3000000, T_MAX = 5200000, T_STEP = 10000;
function curve(p) {
  const pts = [];
  for (let T = T_MIN; T <= T_MAX; T += T_STEP) {
    const r = simulate({ ...p, turnout: T });
    pts.push({ T, student: r.student.seats, sns: r.sns.seats, gov: r.govSeats, opp: r.oppSeats, sv: r.student.votes, nv: r.sns.votes });
  }
  return pts;
}
function breakpoints(pts) {
  const first = (f) => { const x = pts.find(f); return x ? x.T : null; };
  return {
    votes: first((x) => x.sv > x.nv),
    govLoses: first((x) => x.gov < MAJORITY),
    oppBloc: first((x) => x.opp >= MAJORITY),
    studentAlone: first((x) => x.student >= MAJORITY),
  };
}

/* ---------- SVG helperi ---------- */
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  return n;
}
const tip = $('#tooltip');
function showTip(html, x, y) {
  tip.innerHTML = html; tip.hidden = false;
  const r = tip.getBoundingClientRect();
  tip.style.left = Math.min(x + 14, window.innerWidth - r.width - 8) + 'px';
  tip.style.top = Math.max(8, y - r.height - 12) + 'px';
}
function hideTip() { tip.hidden = true; }

/* ---------- 1) linijski dijagram: mandati vs izlaznost ---------- */
function drawSeatsChart(pts, bp, current) {
  const C = COLORS();
  const W = 640, H = 340, m = { t: 18, r: 20, b: 40, l: 40 };
  const x = (T) => m.l + ((T - T_MIN) / (T_MAX - T_MIN)) * (W - m.l - m.r);
  const y = (s) => m.t + (1 - s / 250) * (H - m.t - m.b);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' });

  for (const s of [0, 50, 100, 150, 200, 250]) {
    svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: y(s), y2: y(s), class: 'grid' }));
    svg.appendChild(el('text', { x: m.l - 6, y: y(s) + 4, 'text-anchor': 'end', class: 'axis-t' }, s));
  }
  for (let T = 3000000; T <= T_MAX; T += 500000) {
    svg.appendChild(el('text', { x: x(T), y: H - m.b + 18, 'text-anchor': 'middle', class: 'axis-t' }, (T / 1e6).toLocaleString('sr-RS', { minimumFractionDigits: 1 }) + ' mil.'));
  }
  svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), class: 'axis' }));
  // 126
  svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: y(MAJORITY), y2: y(MAJORITY), class: 'rule' }));
  svg.appendChild(el('text', { x: m.l + 6, y: y(MAJORITY) - 5, class: 'lbl-strong' }, 'većina · 126'));
  // 2023 izlaznost
  svg.appendChild(el('line', { x1: x(E2023.cast), x2: x(E2023.cast), y1: m.t, y2: y(0), class: 'grid' }));
  svg.appendChild(el('text', { x: x(E2023.cast) + 4, y: m.t + 10, class: 'axis-t' }, 'izlaznost 2023.'));

  const path = (key, color) => {
    const d = pts.map((p, i) => (i ? 'L' : 'M') + x(p.T).toFixed(1) + ' ' + y(p[key]).toFixed(1)).join(' ');
    svg.appendChild(el('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
  };
  path('sns', C.sns);
  path('student', C.student);
  // direktne oznake na kraju
  const last = pts[pts.length - 1];
  svg.appendChild(el('text', { x: x(last.T) - 4, y: y(last.student) - 8, 'text-anchor': 'end', fill: C.student, class: 'lbl-strong', style: `fill:${C.student}` }, 'Studentska lista'));
  svg.appendChild(el('text', { x: x(last.T) - 4, y: y(last.sns) + 16, 'text-anchor': 'end', style: `fill:${C.sns}`, class: 'lbl-strong' }, 'SNS lista'));

  // prelomna tačka: presek
  if (bp.votes) {
    const p = pts.find((q) => q.T === bp.votes);
    svg.appendChild(el('circle', { cx: x(p.T), cy: y(p.student), r: 5, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 1.5 }));
  }
  // trenutna izlaznost
  const cur = pts.reduce((a, b) => (Math.abs(b.T - current) < Math.abs(a.T - current) ? b : a));
  svg.appendChild(el('line', { x1: x(current), x2: x(current), y1: m.t, y2: y(0), class: 'marker' }));
  for (const [k, c] of [['student', C.student], ['sns', C.sns]]) {
    svg.appendChild(el('circle', { cx: x(current), cy: y(cur[k]), r: 6, fill: c, stroke: 'var(--surface)', 'stroke-width': 2 }));
  }

  // hover
  const hit = el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, class: 'hit' });
  const cross = el('line', { x1: 0, x2: 0, y1: m.t, y2: y(0), class: 'grid', style: 'display:none' });
  svg.appendChild(cross); svg.appendChild(hit);
  const move = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    const T = Math.round((T_MIN + ((px - m.l) / (W - m.l - m.r)) * (T_MAX - T_MIN)) / T_STEP) * T_STEP;
    const p = pts.find((q) => q.T === Math.min(T_MAX, Math.max(T_MIN, T)));
    if (!p) return;
    cross.style.display = ''; cross.setAttribute('x1', x(p.T)); cross.setAttribute('x2', x(p.T));
    showTip(`<b>${fmt(p.T)} birača (${pct((p.T / E2023.registered) * 100)})</b>Studentska lista: ${p.student} mandata<br>SNS lista: ${p.sns} mandata<br>Vladajući blok: ${p.gov} · Opozicioni blok: ${p.opp}`, ev.clientX, ev.clientY);
  };
  hit.addEventListener('mousemove', move);
  hit.addEventListener('mouseleave', () => { cross.style.display = 'none'; hideTip(); });
  hit.addEventListener('click', (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    const T = Math.round((T_MIN + ((px - m.l) / (W - m.l - m.r)) * (T_MAX - T_MIN)) / 5000) * 5000;
    setTurnout(Math.min(T_MAX, Math.max(T_MIN, T)));
  });

  const box = $('#seats-chart'); box.innerHTML = ''; box.appendChild(svg);
  $('#seats-legend').innerHTML = `<span><i style="background:${C.student}"></i>Studentska lista</span><span><i style="background:${C.sns}"></i>Lista oko SNS-a</span><span><i style="background:var(--ink-2);height:2px"></i>126 – većina</span><span><i style="background:var(--ink);height:2px"></i>izabrana izlaznost (klikni na dijagram da je promeniš)</span>`;
}

/* ---------- 2) hemicikl ---------- */
function drawHemicycle(r) {
  const C = COLORS();
  const W = 520, H = 290, cx = W / 2, cy = H - 20;
  const rows = 8, r0 = 90, gap = 22;
  // raspodela sedišta po redovima srazmerno dužini luka
  const radii = Array.from({ length: rows }, (_, i) => r0 + i * gap);
  const total = radii.reduce((s, x) => s + x, 0);
  let counts = radii.map((x) => Math.floor((x / total) * 250));
  let left = 250 - counts.reduce((s, x) => s + x, 0);
  for (let i = rows - 1; left > 0; i = (i - 1 + rows) % rows, left--) counts[i]++;
  const spots = [];
  radii.forEach((rad, i) => {
    const n = counts[i];
    for (let k = 0; k < n; k++) {
      const a = Math.PI - (n === 1 ? Math.PI / 2 : (k / (n - 1)) * Math.PI);
      spots.push({ x: cx + rad * Math.cos(a), y: cy - rad * Math.sin(a), a });
    }
  });
  spots.sort((p, q) => q.a - p.a); // s leva na desno

  // redosled: opozicija (student, ostale, manjine-opp) → manjine-gov → SPS → SNS
  const order = [r.student, ...r.otherOpp, ...r.minorities.filter((m) => m.bloc === 'opp'), ...r.minorities.filter((m) => m.bloc === 'gov'), r.sps, r.sns];
  const seq = [];
  for (const e of order) for (let i = 0; i < e.seats; i++) seq.push(e);

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}` });
  spots.forEach((s, i) => {
    const e = seq[i];
    const c = el('circle', { cx: s.x.toFixed(1), cy: s.y.toFixed(1), r: 7.5, fill: e ? C[e.color] : C.rest });
    if (e) {
      c.addEventListener('mousemove', (ev) => showTip(`<b>${e.label}</b>${e.seats} mandata · ${fmt(e.votes)} glasova (${pct(e.pct)})`, ev.clientX, ev.clientY));
      c.addEventListener('mouseleave', hideTip);
    }
    svg.appendChild(c);
  });
  svg.appendChild(el('text', { x: cx, y: cy - 30, 'text-anchor': 'middle', class: 'lbl-strong', style: 'font-size:30px' }, r.student.seats + ' : ' + r.sns.seats));
  svg.appendChild(el('text', { x: cx, y: cy - 8, 'text-anchor': 'middle', class: 'axis-t' }, 'Studentska lista : SNS lista'));
  const box = $('#hemicycle'); box.innerHTML = ''; box.appendChild(svg);

  const minSeats = r.minorities.reduce((s, m) => s + m.seats, 0);
  const otherSeats = r.otherOpp.reduce((s, m) => s + m.seats, 0);
  $('#hemi-legend').innerHTML = [
    ['student', `Studentska lista ${r.student.seats}`], ['opp', `Ostala opozicija ${otherSeats}`], ['min', `Manjinske liste ${minSeats}`], ['sps', `SPS–JS ${r.sps.seats}`], ['sns', `SNS lista ${r.sns.seats}`],
  ].map(([k, t]) => `<span><i style="background:${C[k]}"></i>${t}</span>`).join('');
}

/* ---------- 3) stubić glasova ---------- */
function drawVoteBar(r) {
  const C = COLORS();
  const W = 900, H = 84, barY = 14, barH = 36;
  const segs = [
    { k: 'student', label: 'Studentska lista', v: r.student.votes },
    { k: 'opp', label: 'Ostala opozicija', v: r.otherOpp.reduce((s, e) => s + e.votes, 0) },
    { k: 'min', label: 'Manjine', v: r.minorities.reduce((s, e) => s + e.votes, 0) },
    { k: 'sps', label: 'SPS–JS', v: r.sps.votes },
    { k: 'sns', label: 'SNS lista', v: r.sns.votes },
    { k: 'rest', label: 'Ostalo / nevažeći', v: r.rest + r.invalid },
  ];
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}` });
  let x = 0;
  for (const s of segs) {
    const w = (s.v / r.T) * W;
    const g = el('rect', { x: x + 1, y: barY, width: Math.max(0, w - 2), height: barH, rx: 4, fill: C[s.k] });
    g.addEventListener('mousemove', (ev) => showTip(`<b>${s.label}</b>${fmt(s.v)} glasova · ${pct((s.v / r.T) * 100)} od izašlih`, ev.clientX, ev.clientY));
    g.addEventListener('mouseleave', hideTip);
    svg.appendChild(g);
    if (w > 120) svg.appendChild(el('text', { x: x + w / 2, y: barY + barH + 22, 'text-anchor': 'middle', class: 'bar-t' }, `${s.label} ${pct((s.v / r.T) * 100)}`));
    x += w;
  }
  // cenzus marker
  const tx = 0.03 * W;
  svg.appendChild(el('line', { x1: tx, x2: tx, y1: barY - 6, y2: barY + barH + 4, class: 'rule' }));
  svg.appendChild(el('text', { x: tx + 6, y: barY - 4, class: 'bar-t' }, 'cenzus 3 %'));
  const box = $('#vote-bar'); box.innerHTML = ''; box.appendChild(svg);
}

/* ---------- 4) ankete (dumbbell) ---------- */
function drawPolls() {
  const C = COLORS();
  const rowH = 34, W = 720, L = 190, R = 30, H = POLLS.length * rowH + 40;
  const x = (v) => L + (v / 60) * (W - L - R);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}` });
  for (const v of [0, 10, 20, 30, 40, 50, 60]) {
    svg.appendChild(el('line', { x1: x(v), x2: x(v), y1: 10, y2: H - 30, class: 'grid' }));
    svg.appendChild(el('text', { x: x(v), y: H - 12, 'text-anchor': 'middle', class: 'axis-t' }, v + ' %'));
  }
  POLLS.forEach((p, i) => {
    const y = 24 + i * rowH;
    svg.appendChild(el('text', { x: L - 12, y: y + 4, 'text-anchor': 'end', class: p.model ? 'axis-t' : '' }, `${p.pollster} · ${p.label}`));
    svg.appendChild(el('line', { x1: x(Math.min(p.sns, p.sl)), x2: x(Math.max(p.sns, p.sl)), y1: y, y2: y, stroke: 'var(--axis)', 'stroke-width': 2 }));
    for (const [k, v, c] of [['SNS lista', p.sns, C.sns], ['Studentska lista', p.sl, C.student]]) {
      const dot = el('circle', { cx: x(v), cy: y, r: 7, fill: c, stroke: 'var(--surface)', 'stroke-width': 2 });
      dot.addEventListener('mousemove', (ev) => showTip(`<b>${p.pollster} (${p.label} 2026)</b>${k}: ${pct(v)}<br>SPS: ${pct(p.sps)}${p.n ? ' · n = ' + fmt(p.n) : ''}${p.flag ? '<br><i>' + p.flag + '</i>' : ''}`, ev.clientX, ev.clientY));
      dot.addEventListener('mouseleave', hideTip);
      svg.appendChild(dot);
    }
    const lead = p.sl - p.sns;
    svg.appendChild(el('text', { x: x(Math.max(p.sns, p.sl)) + 12, y: y + 4, class: 'axis-t', style: `fill:${lead > 0 ? C.student : C.sns}` }, (lead > 0 ? 'SL +' : 'SNS +') + Math.abs(lead).toLocaleString('sr-RS', { maximumFractionDigits: 1 })));
  });
  const box = $('#polls-chart'); box.innerHTML = ''; box.appendChild(svg);
  $('#polls-legend').innerHTML = `<span><i style="background:${C.sns}"></i>Lista oko SNS-a</span><span><i style="background:${C.student}"></i>Studentska lista</span><span class="muted">· sivo = model, ne anketa</span>`;

  $('#bloc-polls').innerHTML = BLOC_POLLS.map((b) => `<div class="tile" style="--tile-color:${C.opp}"><span class="lbl">„Za vlast : protiv vlasti“ · ${b.pollster}, ${b.date}</span><span class="val">${pct(b.gov)} : ${pct(b.opp)}</span><span class="sub">hipotetički scenario sa dve liste</span></div>`).join('');

  $('#polls-table').innerHTML = `<thead><tr><th>Agencija</th><th>Datum</th><th class="num">n</th><th class="num">SNS</th><th class="num">Studentska</th><th class="num">SPS</th><th>Napomena</th></tr></thead><tbody>` +
    POLLS.map((p) => `<tr><td>${p.pollster}</td><td>${p.date}</td><td class="num">${p.n ? fmt(p.n) : '–'}</td><td class="num">${pct(p.sns)}</td><td class="num">${pct(p.sl)}</td><td class="num">${pct(p.sps)}</td><td class="note">${p.flag}</td></tr>`).join('') + '</tbody>';
}

/* ---------- 5) istorija SNS ---------- */
function drawHistory() {
  const C = COLORS();
  const W = 520, H = 200, m = { t: 22, r: 10, b: 28, l: 10 };
  const n = SNS_HISTORY.length, bw = (W - m.l - m.r) / n;
  const y = (v) => m.t + (1 - v / 2200000) * (H - m.t - m.b);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}` });
  for (const v of [500000, 1000000, 1500000, 2000000]) svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: 'grid' }));
  svg.appendChild(el('line', { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), class: 'axis' }));
  SNS_HISTORY.forEach((h, i) => {
    const x0 = m.l + i * bw + 8;
    const rect = el('rect', { x: x0, y: y(h.votes), width: bw - 16, height: y(0) - y(h.votes), rx: 4, fill: C.sns });
    rect.addEventListener('mousemove', (ev) => showTip(`<b>${h.year}</b>${fmt(h.votes)} glasova · izlaznost ${pct(h.turnout)}${h.note ? '<br><i>' + h.note + '</i>' : ''}`, ev.clientX, ev.clientY));
    rect.addEventListener('mouseleave', hideTip);
    svg.appendChild(rect);
    svg.appendChild(el('text', { x: x0 + (bw - 16) / 2, y: y(h.votes) - 6, 'text-anchor': 'middle', class: 'axis-t' }, (h.votes / 1e6).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' M'));
    svg.appendChild(el('text', { x: x0 + (bw - 16) / 2, y: H - 8, 'text-anchor': 'middle', class: 'axis-t' }, h.year));
  });
  $('#history-chart').innerHTML = ''; $('#history-chart').appendChild(svg);

  // izlaznost – zaseban mali dijagram (nikad dvostruka osa)
  const H2 = 90, m2 = { t: 18, b: 6 };
  const y2 = (v) => m2.t + (1 - (v - 40) / 25) * (H2 - m2.t - m2.b);
  const s2 = el('svg', { viewBox: `0 0 ${W} ${H2}` });
  s2.appendChild(el('text', { x: m.l, y: 11, class: 'axis-t' }, 'Izlaznost (%)'));
  const d = SNS_HISTORY.map((h, i) => (i ? 'L' : 'M') + (m.l + i * bw + bw / 2) + ' ' + y2(h.turnout)).join(' ');
  s2.appendChild(el('path', { d, fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2 }));
  SNS_HISTORY.forEach((h, i) => {
    const cx = m.l + i * bw + bw / 2;
    s2.appendChild(el('circle', { cx, cy: y2(h.turnout), r: 4, fill: 'var(--ink-2)' }));
    s2.appendChild(el('text', { x: cx, y: y2(h.turnout) - 8, 'text-anchor': 'middle', class: 'axis-t' }, h.turnout.toLocaleString('sr-RS', { minimumFractionDigits: 1 })));
  });
  $('#history-turnout').innerHTML = ''; $('#history-turnout').appendChild(s2);
}

/* ---------- statični delovi ---------- */
function renderStatic() {
  $('#updated').textContent = LAST_UPDATED;
  $('#opp-base-inline').textContent = fmt(OPP_BASE);

  const tag = { gov: 'vlast', opp: 'opozicija', min: 'manjina', split: 'podeljeno' };
  $('#table-2023').innerHTML = `<thead><tr><th>Lista</th><th class="num">Glasova</th><th class="num">%</th><th class="num">Mand.</th><th>Blok (2026)</th><th>Zašto</th></tr></thead><tbody>` +
    E2023.lists.map((l) => `<tr class="${l.seats ? 'pass' : 'fail'}"><td>${l.name}</td><td class="num">${l.approx ? '≈ ' : ''}${fmt(l.votes)}</td><td class="num">${pct(l.pct, 2)}</td><td class="num">${l.seats}</td><td><span class="tag ${l.bloc}">${tag[l.bloc]}${l.bloc === 'min' ? (l.minGov ? ' · uz vlast' : ' · uz opoz.') : ''}</span></td><td class="note">${l.note}</td></tr>`).join('') + '</tbody>';

  const C = COLORS();
  const govVotes = byId.sns.votes + byId.sps.votes + GOV_EXTRA;
  const minGov = MINORITIES.filter((m) => m.minGov).reduce((s, m) => s + m.votes, 0);
  $('#bloc-summary').innerHTML = [
    ['sns', 'Vladajući blok 2023', govVotes, 'SNS lista + SPS–JS + SRS + Zavetnici (½ NO)'],
    ['student', 'Opozicija 2023 („opoziciona baza“)', OPP_BASE, 'SPN + NADA + MI–GIN + Dveri (½ NO) + liste ispod cenzusa'],
    ['min', 'Manjinske liste', MINORITIES.reduce((s, m) => s + m.votes, 0), `od toga ${fmt(minGov)} uz vlast (SVM, SPP, SDAS, Ruska)`],
  ].map(([k, l, v, s]) => `<div class="tile" style="--tile-color:${C[k]}"><span class="lbl">${l}</span><span class="val">${fmt(v)}</span><span class="sub">${s}</span></div>`).join('');

  $('#lists-2026').innerHTML = LISTS_2026.map((l) => `<li value="${l.no}"><strong>${l.name}</strong> <span class="tag ${l.bloc}">${tag[l.bloc]}</span><small>Nosilac: ${l.carrier} · ${l.parties} · ${l.sigs} potpisa</small></li>`).join('');
  $('#expected-lists').innerHTML = EXPECTED_LISTS.map((t) => `<li>${t}</li>`).join('');
  $('#timeline').innerHTML = TIMELINE.map((t) => `<li class="${t.text.startsWith('DAN') ? 'big' : ''}"><time>${t.date}</time>${t.text}</li>`).join('');

  const presets = [
    ['Izlaznost 2023.', 3815007], ['2016 (3,78 mil.)', 3780000], ['BIRODI procena (4,13 mil.)', 4130000], ['65 % upisanih', 4225000], ['70 % upisanih', 4550000],
  ];
  $('#presets').innerHTML = presets.map(([l, v]) => `<button type="button" class="chip" data-t="${v}">${l}</button>`).join('');
  $('#presets').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setTurnout(+b.dataset.t); });
}

/* ---------- odbrojavanje ---------- */
function countdown() {
  const now = new Date();
  const d = ELECTION_DATE - now;
  const box = $('#countdown');
  if (d <= 0) { box.innerHTML = '<span>Izbori su u toku ili završeni.</span>'; return; }
  const days = Math.floor(d / 864e5), hrs = Math.floor((d % 864e5) / 36e5);
  box.innerHTML = `<span>Do otvaranja biračkih mesta:</span><b>${days}</b><span>dana</span><b>${hrs}</b><span>sati</span>`;
}

/* ---------- glavni render ---------- */
function setTurnout(T) { $('#turnout').value = T; P.turnout = T; render(); }

function render() {
  const r = simulate(P);
  const C = COLORS();
  const pts = curve(P);
  const bp = breakpoints(pts);

  $('#turnout-out').textContent = fmt(r.T) + ' birača';
  $('#turnout-hint').textContent = `To je ${pct((r.T / E2023.registered) * 100)} od 6.500.666 upisanih (2023) · ${r.T >= E2023.cast ? '+' : '−'}${fmt(Math.abs(r.T - E2023.cast))} u odnosu na 2023. · cenzus = ${fmt(r.threshold)} glasova`;
  document.querySelectorAll('#presets .chip').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.t === r.T));

  const otherSeats = r.otherOpp.reduce((s, e) => s + e.seats, 0);
  $('#tiles').innerHTML = [
    ['student', 'Studentska lista', r.student.seats + ' mand.', `${fmt(r.student.votes)} · ${pct(r.student.pct)}`],
    ['sns', 'Lista oko SNS-a', r.sns.seats + ' mand.', `${fmt(r.sns.votes)} · ${pct(r.sns.pct)}`],
    ['sps', 'SPS–JS', r.sps.seats + ' mand.', `${fmt(r.sps.votes)} · ${pct(r.sps.pct)}${r.sps.pass ? '' : ' · ispod cenzusa'}`],
    ['opp', 'Ostala opozicija', otherSeats + ' mand.', r.otherOpp.length ? `${r.otherOpp.length} × ${fmt(r.otherOpp[0].votes)} · ${pct(r.otherOpp[0].pct)}${r.otherOpp[0].pass ? '' : ' · ispod cenzusa'}` : '–'],
    ['min', 'Manjinske liste', r.minorities.reduce((s, e) => s + e.seats, 0) + ' mand.', `${r.minorities.filter((m) => m.bloc === 'gov').reduce((s, e) => s + e.seats, 0)} uz vlast`],
  ].map(([k, l, v, s]) => `<div class="tile" style="--tile-color:${C[k]}"><span class="lbl">${l}</span><span class="val">${v}</span><span class="sub">${s}</span></div>`).join('');

  let verdict, cls;
  if (r.student.seats >= MAJORITY) { cls = 'win'; verdict = `<strong>Studentska lista ima samostalnu većinu</strong> (${r.student.seats} od 250). Opozicioni blok ukupno ${r.oppSeats}, vladajući ${r.govSeats}.`; }
  else if (r.oppSeats >= MAJORITY) { cls = 'win'; verdict = `<strong>Opozicioni blok ima većinu</strong>: ${r.oppSeats} mandata (Studentska lista ${r.student.seats} + ostala opozicija ${otherSeats} + manjine uz opoziciju). Vladajući blok: ${r.govSeats}.`; }
  else if (r.govSeats >= MAJORITY) { cls = 'lose'; verdict = `<strong>Vladajući blok zadržava većinu</strong>: SNS ${r.sns.seats} + SPS ${r.sps.seats} + manjine uz vlast = ${r.govSeats}. Opozicija: ${r.oppSeats}.`; }
  else { cls = ''; verdict = `<strong>Niko nema većinu</strong>: vladajući blok ${r.govSeats}, opozicioni ${r.oppSeats}. Odlučuju manjinske liste.`; }
  $('#verdict').className = 'verdict ' + cls; $('#verdict').innerHTML = verdict;

  drawSeatsChart(pts, bp, r.T);
  drawHemicycle(r);
  drawVoteBar(r);

  // tabela simulacije
  const rows = [r.student, r.sns, r.sps, ...r.otherOpp, ...r.minorities].sort((a, b) => b.votes - a.votes);
  $('#sim-table').innerHTML = `<thead><tr><th>Lista</th><th class="num">Glasova</th><th class="num">% izašlih</th><th class="num">Cenzus</th><th class="num">Mandata</th><th>Blok</th></tr></thead><tbody>` +
    rows.map((e) => `<tr class="${e.pass ? 'pass' : 'fail'}"><td><i class="swatch" style="background:${C[e.color]}"></i>${e.label}</td><td class="num">${fmt(e.votes)}</td><td class="num">${pct(e.pct)}</td><td class="num">${e.minority ? 'manj. ×1,35' : e.pass ? 'prelazi' : 'ne prelazi'}</td><td class="num">${e.seats}</td><td>${e.bloc === 'gov' ? 'vlast' : 'opozicija'}</td></tr>`).join('') +
    `<tr><td class="muted">Rasuti glasovi (SRS/Zavetnici i sl.)</td><td class="num">${fmt(r.rest)}</td><td class="num">${pct((r.rest / r.T) * 100)}</td><td></td><td class="num">0</td><td></td></tr><tr><td class="muted">Nevažeći listići</td><td class="num">${fmt(r.invalid)}</td><td class="num">${pct((r.invalid / r.T) * 100)}</td><td></td><td></td><td></td></tr></tbody>`;

  // prelomne tačke
  const bpDefs = [
    ['votes', 'Studentska lista ima više glasova od SNS liste', 'student'],
    ['govLoses', 'Vladajući blok (SNS + SPS + manjine uz vlast) pada ispod 126', 'sns'],
    ['oppBloc', 'Opozicioni blok dostiže 126', 'opp'],
    ['studentAlone', 'Studentska lista sama dostiže 126', 'student'],
  ];
  $('#bp-grid').innerHTML = bpDefs.map(([k, l, c]) => {
    const T = bp[k];
    return `<div class="bp" style="border-left:4px solid ${C[c]}"><span class="lbl">${l}</span><span class="val">${T ? fmt(T) : 'nikad'}</span><span class="sub">${T ? `${pct((T / E2023.registered) * 100)} upisanih · ${T > E2023.cast ? '+' : ''}${fmt(T - E2023.cast)} vs 2023.` : 'ne dešava se ni pri 5,2 mil. izašlih'}</span>${T ? `<br><button type="button" class="chip" data-t="${T}">Pokaži na dijagramu</button>` : ''}</div>`;
  }).join('');
  $('#bp-grid').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { setTurnout(+b.dataset.t); $('#simulator').scrollIntoView({ behavior: 'smooth', block: 'start' }); }));

  // izlazi pretpostavki
  $('#sns-out').textContent = fmt(P.sns) + (P.addSrs ? ` (+ ${fmt(GOV_EXTRA)} SRS/Zavetnici = ${fmt(P.sns + GOV_EXTRA)})` : '');
  $('#sps-out').textContent = fmt(P.sps);
  $('#opp-share-out').textContent = `${P.oppShare} % = ${fmt(OPP_BASE * P.oppShare / 100)} glasova`;
  $('#new-share-out').textContent = P.newShare + ' %';
}

/* ---------- kontrole ---------- */
function bind() {
  $('#turnout').addEventListener('input', (e) => { P.turnout = +e.target.value; render(); });
  $('#sns').addEventListener('input', (e) => { P.sns = +e.target.value; render(); });
  $('#sps').addEventListener('input', (e) => { P.sps = +e.target.value; render(); });
  $('#opp-share').addEventListener('input', (e) => { P.oppShare = +e.target.value; render(); });
  $('#new-share').addEventListener('input', (e) => { P.newShare = +e.target.value; render(); });
  $('#other-lists').addEventListener('change', (e) => { P.otherLists = +e.target.value; render(); });
  $('#add-srs').addEventListener('change', (e) => { P.addSrs = e.target.checked; render(); });
  $('#reset').addEventListener('click', () => {
    P = { ...DEFAULTS };
    $('#turnout').value = P.turnout; $('#sns').value = P.sns; $('#sps').value = P.sps; $('#opp-share').value = P.oppShare; $('#new-share').value = P.newShare; $('#other-lists').value = P.otherLists; $('#add-srs').checked = P.addSrs;
    render();
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { render(); drawPolls(); drawHistory(); });
}

renderStatic();
bind();
render();
drawPolls();
drawHistory();
countdown();
setInterval(countdown, 60000);
