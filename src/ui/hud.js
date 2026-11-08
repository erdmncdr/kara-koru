// ui/hud.js · Kara Koru
// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.

import { $G } from '../core/store.js';
import { CR } from '../game/heroes.js';
import { chalFlag } from '../game/challenge.js';
import { toast, tip } from '../core/helpers.js';
import { SET } from '../core/settings.js';
import { fmt } from '../core/state.js';
import { $ } from '../core/util.js';
import { PUD, RAR, SHC, SHD, STL, TOUCH } from '../data/content.js';
import { cam } from '../engine/renderer.js';
import { tv } from '../engine/vfx.js';
import { price } from '../game/objects.js';
import { interact } from '../game/interact.js';
import { BN, KZ_ADIM, MBN, diffPct, gdm, swT } from '../game/stats.js';
import { ASAMA, MBT, ROTA, SWT, stLen } from '../game/run.js';
import { hudItems, hudSlots, buildHTML } from './cards.js';
import { GL, klTarget } from './leaderboard.js';
import { BIO } from '../world/terrain.js';
import { A } from './actions.js';

export let TUT, MM, WL;

export function __init_70() {
  // ---- arayüz
  TUT = [['Ruh kristali topla, seviye atla', () => $G.P.lv >= 2], ['Pot kır ve 15 altın topla', () => $G.P.goldT >= 15], [TOUCH ? 'Bir sandığa git ve aç' : 'Bir sandığın yanında E ile aç', () => $G.P.chests >= 1], ['Bir sunak kullan', () => $G.P.shUsed >= 1]];
}

export function goal() {
  if (!$G.GATE) return '';
  const b = BN(),
    mz = $G.P.mz;
  if (mz && !mz.open) return `Mahzen mühürlü: ${mz.kills}/${mz.need} düşman, ${Math.ceil(mz.t)} sn. Süre dolarsa Kara Kefen uyanır.`;
  if (mz && mz.keys < 4 && $G.GATE.st == 0) return `Dört tabutu aç, anahtarları topla: ${mz.keys}/4. Sonra mühürlü kapıda ${b}’u çağır.`;
  if ($G.GATE.st == 3) return 'Kademe tamamlandı. Çıkış geçidinden çık ve puanını al ya da Son Dalga’da kal, gümüş çarpanı büyüsün.';
  if ($G.GATE.st == 0) {
    if (Math.hypot($G.GATE.x - $G.P.x, $G.GATE.z - $G.P.z) < 30) tip('gate', 'Boss kapısı', 'E ile boss’u çağırırsın. Boss ölünce geçit açılır ve sonraki diyara geçersin: Kara Koru, Kızıl Bozkır, sonra Mühürlü Mahzen.');
    return $G.P.ot ? `Uzatma. Kapıya git ve ${b}’ü çağır.` : `Güçlen, sonra kapıyı bul ve ${b}’ü çağır.`;
  }
  if ($G.GATE.st == 1) return `${b}’ü devir.`;
  return 'Geçit açık. Kapıdan geçip ' + (ROTA[$G.P.stage + 1] == 'mezarlik' ? 'Mühürlü Mahzen’e' : 'Kızıl Bozkır’a') + ' ilerle. Sayaç orada sıfırdan başlar.';
}

export function __init_71() {
  MM = $('mm').getContext('2d');
  $G.hk = '';
  $G.bk = '';
  $G.tk = '';
}

export function mini() {
  if ($G.FRC & 1) return; // 30 Hz yeter; 300 düşman noktası her karede çizilmesin
  if (chalFlag('nomap')) {
    document.body.classList.add('nomap');
    return;
  }
  document.body.classList.remove('nomap');
  const c = MM,
    r = 75,
    k = .75;
  c.clearRect(0, 0, 150, 150);
  c.save();
  c.beginPath();
  c.arc(r, r, r, 0, 6.283);
  c.clip();
  c.translate(r, r);
  if (SET.mr !== 0) c.rotate($G.yaw);
  if ($G.MMBG) {
    c.globalAlpha = .9;
    c.imageSmoothingEnabled = true;
    c.drawImage($G.MMBG, (-300 - $G.P.x) * k, (-300 - $G.P.z) * k, 600 * k, 600 * k);
    c.globalAlpha = 1;
  }
  for (const l of $G.LMS) {
    const dx = (l.x - $G.P.x) * k,
      dz = (l.z - $G.P.z) * k;
    if (dx * dx + dz * dz > r * r) continue;
    c.strokeStyle = l.f ? '#e2c56a' : 'rgba(221,211,188,.55)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(dx, dz, Math.max(4, l.r * k * .5), 0, 6.283);
    c.stroke();
  }
  c.fillStyle = 'rgba(160,151,138,.28)';
  for (const p of $G.PLF) {
    if (Math.abs(p.x0 - $G.P.x) > 120 || Math.abs(p.z0 - $G.P.z) > 120) continue;
    c.fillRect((p.x0 - $G.P.x) * k, (p.z0 - $G.P.z) * k, (p.x1 - p.x0) * k, (p.z1 - p.z0) * k);
  }
  const dot = (x, z, col, s) => {
    const dx = (x - $G.P.x) * k,
      dz = (z - $G.P.z) * k;
    if (dx * dx + dz * dz > r * r) return;
    c.fillStyle = col;
    c.fillRect(dx - s / 2, dz - s / 2, s, s);
  };
  // kenar işaretleri: koyu çerçeveli dolgulu glifler (path çizilir, önce kalın koyu kontur sonra dolgu)
  c.lineJoin = 'round';
  const glyph = (col, path) => {
    c.beginPath();
    path();
    c.strokeStyle = '#140f0c';
    c.lineWidth = 3;
    c.stroke();
    c.fillStyle = col;
    c.fill();
  };
  const edge = (q, col, f) => {
    const dx = (q.x - $G.P.x) * k,
      dz = (q.z - $G.P.z) * k,
      d = Math.hypot(dx, dz),
      m = d > r - 8 ? (r - 8) / d : 1;
    c.fillStyle = col;
    f(dx * m, dz * m, col);
  };
  for (const e of $G.E) if (!e.dead && (e.boss || e.mini)) edge(e.m.position, e.boss ? '#ff3a3a' : '#ff8a4a', (x, z, col) => {
    // kafatası
    glyph(col, () => {
      c.arc(x, z - 1.5, 4.2, 0, 6.283);
      c.rect(x - 3, z + 1, 6, 3.2);
    });
    c.fillStyle = '#1b1410';
    c.fillRect(x - 2.4, z - 2.4, 1.7, 1.7);
    c.fillRect(x + .7, z - 2.4, 1.7, 1.7);
  });
  for (const p of $G.JP) dot(p.x, p.z, '#9fe8d8', 3);
  for (const p of $G.POT) dot(p.m.position.x, p.m.position.z, '#8a5a32', 3);
  for (const e of $G.E) dot(e.m.position.x, e.m.position.z, e.t == 3 ? '#e2452c' : e.mini ? '#ff8a3a' : '#a3241c', e.t == 3 ? 9 : e.mini ? 6 : 2.5);
  for (const u of $G.PU) dot(u.m.position.x, u.m.position.z, '#ddd3bc', 5);
  for (const ch of $G.CH) edge(ch.m.position, ch.free ? '#e2b85a' : '#c49a45', (x, z, col) => {
    // sandık: gövde + kapak bandı
    glyph(col, () => c.rect(x - 4.5, z - 3.5, 9, 8));
    c.fillStyle = '#1b1410';
    c.fillRect(x - 4.5, z - 1, 9, 1.4);
    c.fillRect(x - .8, z - .5, 1.6, 2);
  });
  for (const n of $G.NP) if (!n.d) edge(n.m.position, n.t == 'shop' ? '#ddd3bc' : '#b770e6', (x, z, col) => {
    // tüccar: çadır (üçgen + kapı); diğer NPC: üçgen
    glyph(col, () => {
      c.moveTo(x, z - 6.5);
      c.lineTo(x + 6, z + 4.5);
      c.lineTo(x - 6, z + 4.5);
      c.closePath();
    });
    if (n.t == 'shop') {
      c.fillStyle = '#1b1410';
      c.fillRect(x - 1.3, z + .5, 2.6, 4);
    }
  });
  for (const sh of $G.SH) if (!sh.d) edge(sh.m.position, '#' + SHC[sh.t].toString(16).padStart(6, '0'), (x, z, col) => {
    // sunak: kristal (elmas + yüzey çizgisi)
    glyph(col, () => {
      c.moveTo(x, z - 6.5);
      c.lineTo(x + 5, z - 1);
      c.lineTo(x, z + 6.5);
      c.lineTo(x - 5, z - 1);
      c.closePath();
    });
    c.strokeStyle = 'rgba(255,255,255,.55)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - 5, z - 1);
    c.lineTo(x + 5, z - 1);
    c.stroke();
  });
  if ($G.MZC && $G.MZ.some(g => g.st < 2)) edge($G.MZC, $G.P.mzA ? '#ff8a3a' : '#a9c0e0', (x, z, col) => {
    // mahzen: mezar taşı
    glyph(col, () => {
      c.moveTo(x - 3.5, z + 5);
      c.lineTo(x - 3.5, z - 2);
      c.arc(x, z - 2, 3.5, Math.PI, 0);
      c.lineTo(x + 3.5, z + 5);
      c.closePath();
    });
  });
  for (const k of $G.KS) if (!k.d) edge(k.m.position, '#d0453a', (x, z, col) => {
    // kös: davul (daire + deri bandı)
    glyph(col, () => c.arc(x, z, 5, 0, 6.283));
    c.fillStyle = '#e8d8b0';
    c.fillRect(x - 3, z - 1.2, 6, 2.4);
  });
  if ($G.GATE) edge({
    x: $G.GATE.x,
    z: $G.GATE.z
  }, $G.GATE.st >= 2 ? '#9fe8d8' : '#e2452c', (x, z, col) => {
    // boss kapısı: kırmızı ok; geçit: açık halka
    const a = Math.atan2($G.GATE.z - $G.P.z, $G.GATE.x - $G.P.x);
    c.save();
    c.translate(x, z);
    c.rotate(a);
    glyph(col, () => {
      c.moveTo(7.5, 0);
      c.lineTo(-5.5, -5.5);
      c.lineTo(-2, 0);
      c.lineTo(-5.5, 5.5);
      c.closePath();
    });
    c.restore();
  });
  c.restore();
  c.save();
  c.translate(r, r);
  if (SET.mr === 0) c.rotate(-$G.yaw);
  glyph('#ddd3bc', () => {
    c.moveTo(0, -7.5);
    c.lineTo(-5.5, 5.5);
    c.lineTo(0, 3);
    c.lineTo(5.5, 5.5);
    c.closePath();
  });
  c.restore();
}

export function __init_72() {
  $G.yk = '';
  $G.YEV = [];
}

export function yolUpd() {
  const sw = !!$G.P.swarm,
    span = sw ? 900 : stLen(),
    t = sw ? swT() : $G.P.stT,
    key = (sw ? 's' : 'n') + $G.P.stage + $G.P.map + span;
  if (key != $G.yk) {
    $G.yk = key;
    const mb = MBT();
    $G.YEV = (sw ? [[60, 'gh', 'Albastılar'], [360, 'gh2', 'Mor Albastılar'], [720, 'gh3', 'Kızıl Albastılar']] : [[mb[0], 'mb', 'Ara boss'], ...SWT().map(x => [x, 'ak', 'Akın']), [mb[1], 'mb', 'Ara boss'], [stLen(), 'sd', 'Uzatma'], ...(Array.from({ length: Math.floor((stLen() - 1) / KZ_ADIM) }, (_, i) => [(i + 1) * KZ_ADIM, 'kz', 'Kızışma']))].filter(e => e[0] <= (stLen()))).sort((a, b) => a[0] - b[0]);
    $('yolt').innerHTML = '<i id=yolf></i>' + $G.YEV.map(([x, k, n]) => `<span class="ev ${k}" style="left:${x / span * 100}%" title="${n}"></span>`).join('');
  }
  $('yolf').style.width = Math.min(100, t / span * 100) + '%';
  const evs = $('yolt').querySelectorAll('.ev');
  $G.YEV.forEach((e, i) => evs[i] && evs[i].classList.toggle('done', e[0] <= t));
  const nx = $G.YEV.find(e => e[0] > t);
  $('yolx').innerHTML = nx ? `Sıradaki: <b>${nx[2]}</b>, ${fmt(nx[0] - t)} sonra` : sw ? 'Albastılar giderek hızlanıyor. Dayanabildiğin kadar dayan.' : $G.P.ot ? 'Uzatma: uçan sürüler güçleniyor. Boss’u devir.' : '';
}

export function hud() {
  mini();
  const C = $G.P.C;
  document.body.classList.toggle('kh0', $G.P.tt > 10); // kısayol şeridi yalnız koşunun ilk 10 saniyesi
  $('hp').style.width = Math.max(0, $G.P.hp / $G.P.mh * 100) + '%';
  $('xp').style.width = Math.min(100, $G.P.xp / $G.P.need * 100) + '%';
  if (TOUCH) {
    const bs = $('bs'), cd = $G.P.cd > 0 ? Math.min(1, $G.P.cd / 1.6) : 0;
    bs.style.setProperty('--cd', String(cd));
    bs.classList.toggle('bek', cd > 0);
    // yakında sandık, sunak, tüccar ya da kapı varsa Kullan parlar (5 karede bir bakılır)
    if (($G.hkU = ($G.hkU || 0) + 1) % 5 == 0) $('be').classList.toggle('on', !!interact(false, true));
  }
  const rem = (stLen()) - $G.P.stT,
    s = [Math.floor($G.P.stT), diffPct(), $G.P.lv, Math.ceil(Math.max(0, $G.P.hp)), $G.P.mh, $G.P.gold, $G.kills, Math.floor($G.P.xp), $G.P.need, $G.P.rage > 0 ? Math.ceil($G.P.rage) : 0, $G.P.shieldT > 0 ? Math.ceil($G.P.shieldT) : 0, C.block ? $G.P.blockT <= 0 ? 1 : 2 : 0, price(), $G.P.swarm, $G.GATE ? $G.GATE.st : 0, $G.P.hop, $G.P.stage, $G.P.greed, Math.ceil($G.P.fount || 0), $G.P.bossCur, GL.ok].join('|');
  if (s != $G.hk) {
    $G.hk = s;
    $('tm').textContent = $G.P.swarm ? '+' + fmt(swT()) : rem <= 0 ? '+' + fmt(-rem) : fmt(rem);
    $('tm').className = $G.P.swarm || rem <= 0 ? 'sw' : '';
    $('stn').textContent = `${BIO[$G.BI].n} K${$G.P.tier}, ${$G.P.stage + 1}/${ASAMA}. aşama · Zorluk +%${diffPct()}`;
    $('tml').textContent = $G.P.swarm ? 'son dalgada' : rem <= 0 ? 'uzatmada' : 'uzatmaya';
    $('lvb').textContent = $G.P.lv;
    $('hpt').textContent = Math.ceil(Math.max(0, $G.P.hp)) + ' / ' + $G.P.mh;
    $('shdb').style.width = Math.min(100, Math.max(0, ($G.P.shd || 0) / $G.P.mh * 100)) + '%'; // kalkan: can çubuğunun üstünde mavi dilim
    $('dshf').style.width = ($G.P.cd <= 0 ? 100 : Math.max(0, 1 - $G.P.cd / 1.6) * 100) + '%';
    $('auv').textContent = $G.P.gold;
    {
      const pr = price();
      $('aun').innerHTML = `<i class="${$G.P.gold >= pr ? 'ok' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.500C3 7.500 5 6 7.500 6h9C19 6 21 7.500 21 10.500V18H3Z"/><path d="M3 11h18M12 9.500v4"/></svg>${pr}</i>`;
      $('rtv').textContent = fmt($G.P.tt);
    }
    yolUpd();
    $('klv').textContent = $G.kills;
    $('klr').textContent = klTarget();
    $('xpt').textContent = Math.floor($G.P.xp) + ' / ' + $G.P.need;
    $('goal').textContent = goal();
    $('bf').innerHTML = (CR[$G.CI].k == 'boru' ? `<span class=g>Kan kokusu +%${Math.round((gdm() - 1) * 100)} hasar</span>` : '') + ($G.P.fount > 0 ? `<span>Ab-ı hayat ${Math.ceil($G.P.fount)} sn</span>` : '') + ($G.P.bossCur ? `<span>Kara sunak: ${$G.P.bossCur + 1} boss</span>` : '') + (CR[$G.CI].k == 'bahadir' ? `<span class=g>Ganimet +%${Math.round((gdm() - 1) * 100)} hasar</span>` : '') + (CR[$G.CI].k == 'golge' && $G.P.hop ? `<span>Sıçrama ${$G.P.hop}, +%${$G.P.hop * 8} hız</span>` : '') + ($G.P.greed ? `<span>Açgözlülük +%${Math.round($G.P.greed * 100)} zorluk</span>` : '') + ($G.P.rage > 0 ? `<span>Öfke ${Math.ceil($G.P.rage)} sn</span>` : '') + ($G.P.shieldT > 0 ? `<span>Kalkan ${Math.ceil($G.P.shieldT)} sn</span>` : '') + (C.block ? `<span>${$G.P.blockT <= 0 ? 'Tunç kalkan hazır' : 'Tunç kalkan doluyor'}</span>` : '');
  }
  const bo = $G.E.find(e => e.t == 3) || $G.E.find(e => e.mini);
  $('bb').style.display = bo ? 'block' : 'none';
  document.body.classList.toggle('bbon', !!bo);
  if (bo) {
    $('bn').textContent = bo.boss ? BN() : bo.nm || (bo.bandit ? 'Kara Haydut' : bo.kd ? bo.kd.n : MBN[bo.t] || 'Dev');
    const bf = Math.max(0, bo.hp / bo.mh);
    $('bh').style.width = bf * 100 + '%';
    $('bb').classList.toggle('ph', !!(bo.boss && $G.ARENA)); // final arenası: evre işaretleri
    $('bb').classList.toggle('low', bf < .25);
    $('bb').classList.toggle('inv', !!bo.pyInv);
  }
  if ($G.P.bv + '' != $G.bk) {
    $G.bk = $G.P.bv + '';
    $('bl').innerHTML = hudSlots();
    $('itr').innerHTML = hudItems();
  }
  if ($G.tutDone) {
    $('obj').style.display = 'none';
  } else {
    const st = TUT.map(t => t[1]() ? 1 : 0),
      key = st.join('');
    if (key != $G.tk) {
      $G.tk = key;
      $('obj').style.display = 'block';
      $('obj').innerHTML = '<b>İlk adımlar</b>' + TUT.map((t, i) => `<div class="${st[i] ? 'ok' : ''}"><i></i>${t[0]}</div>`).join('');
      if (st.every(x => x)) {
        $G.tutDone = 1;
        try {
          localStorage.setItem('kk_tut', '1');
        } catch (e) {}
        toast('Temel döngüyü öğrendin. Şimdi kapıyı bul.');
      }
    }
  }
}

export function __init_73() {
  WL = [];
}

export function wl(i) {
  if (!WL[i]) {
    const el = document.createElement('div');
    el.className = 'wl';
    $('wls').appendChild(el);
    WL[i] = {
      el,
      h: ''
    };
  }
  return WL[i];
}

export function wlUpd() {
  let n = 0;
  if ($G.S == 'play') {
    const pr = price(),
      add = (x, y, z, h, far) => {
        if (n >= 8) return;
        const dx = x - $G.P.x,
          dz = z - $G.P.z,
          R2 = far || 11; // minimal HUD: etiketler yalnız yakında
        if (dx * dx + dz * dz > R2 * R2) return;
        tv.set(x, y, z).project(cam);
        if (tv.z > 1 || Math.abs(tv.x) > 1.1 || Math.abs(tv.y) > 1.1) return;
        const w = wl(n++);
        if (w.h != h) {
          w.h = h;
          w.el.innerHTML = h;
        }
        w.el.style.display = 'block';
        w.el.style.left = (tv.x * .5 + .5) * innerWidth + 'px';
        w.el.style.top = (-tv.y * .5 + .5) * innerHeight + 'px';
      },
      E_ = TOUCH ? 'Yanına git: ' : 'E: ',
      // dokunmatikte otomatik etkileşimin atladığı türler (interact.js): Kullan düğmesi gerekir
      AUTO_SKIP = [3, 4, 6, 7, 10, 12];
    if ($G.GATE) {
      const d = Math.hypot($G.GATE.x - $G.P.x, $G.GATE.z - $G.P.z),
        b = BN();
      if (d < 30 || $G.GATE.st == 1) add($G.GATE.x, $G.GATE.m.position.y + 11.5, $G.GATE.z, TOUCH && $G.GATE.st == 0 && d < 12 ? `<span class=gt>Boss kapısı</span><small><button class="tb sm" ${A('summonBoss')}>${b}’ü çağır</button></small>` : $G.GATE.st == 3 ? `<span class=pt>Çıkış geçidi</span><small>${d < 12 ? E_ + 'koşuyu bitir, puanını al' : Math.round(d) + ' m'}</small>` : $G.GATE.st == 2 ? `<span class=pt>Geçit açık</span><small>${d < 12 ? E_ + (ROTA[$G.P.stage + 1] == 'mezarlik' ? 'Mühürlü Mahzen’e' : 'Kızıl Bozkır’a') + ' geç' : Math.round(d) + ' m'}</small>` : `<span class=gt>Boss kapısı</span><small>${$G.GATE.st == 1 ? b + '’ü devir' : d < 12 ? E_ + b + '’ü çağır' : Math.round(d) + ' m'}</small>`, 600);
    }
    for (const c of $G.CH) {
      const q = c.m.position,
        d = Math.hypot(q.x - $G.P.x, q.z - $G.P.z),
        ok = c.free || $G.P.gold >= pr;
      add(q.x, q.y + 2.6, q.z, `<span class="p${ok ? '' : ' no'}">${c.free ? c.gold ? 'Altın sandık' : 'Ücretsiz sandık' : pr + ' altın'}</span>${d < 6 ? `<small>${ok ? TOUCH ? 'Yanına git, açılır' : 'E ile aç' : pr - $G.P.gold + ' altın eksik'}</small>` : ''}`);
    }
    for (const s of $G.SH) {
      if (s.d) continue;
      const q = s.m.position,
        d = Math.hypot(q.x - $G.P.x, q.z - $G.P.z),
        i = SHD[s.t];
      add(q.x, q.y + (s.t == 0 || s.t == 5 ? 3 : s.t == 3 ? 3 : s.t == 4 ? 3.6 : 5.4), q.z, `<span>${i.n}</span>${d < 10 ? `<small>${s.t == 0 || s.t == 5 ? s.p > 0 ? 'Doluyor %' + Math.floor(s.p / 6 * 100) : i.h : (TOUCH && AUTO_SKIP.includes(s.t) ? 'Kullan: ' : E_) + i.h}</small>` : ''}`);
    }
    for (const v of $G.NP) {
      if (v.d) continue;
      const q = v.m.position,
        d = Math.hypot(q.x - $G.P.x, q.z - $G.P.z);
      add(q.x, q.y + 3.4, q.z, `<span>${v.t == 'shop' ? 'Gezgin tüccar' + (v.tier ? ' · ' + RAR[v.tier].n : '') : 'Cadı kazanı'}</span>${d < 10 ? `<small>${E_}${v.t == 'shop' ? 'eşya satın al' : 'eşya çoğalt'}</small>` : ''}`, 60);
    }
    if ($G.MZC) {
      const dc = Math.hypot($G.MZC.x - $G.P.x, $G.MZC.z - $G.P.z),
        left = $G.MZ.filter(g => g.st < 2).length;
      if (dc > 20) {
        if (left && dc < 30) add($G.MZC.x, $G.HT($G.MZC.x, $G.MZC.z) + 3.4, $G.MZC.z, `<span>Mezarlık</span><small>${$G.P.mzA ? 'Bir ruh dolaşıyor' : left + ' huzursuz mezar'}</small>`, 30);
      } else for (const g of $G.MZ) {
        if (g.st >= 2 && g.st != 2) continue;
        const q = g.m.position,
          d = Math.hypot(q.x - $G.P.x, q.z - $G.P.z);
        if (g.st == 1) add(q.x, q.y + 2.6, q.z, '<span class=gt>Ruh dolaşıyor</span>');else if (g.st == 0 && d < 7) add(q.x, q.y + 2.6, q.z, `<span>Eski mezar</span><small>${$G.P.mzA ? 'Önce dolaşan ruhu devir' : E_ + 'mezarı aç, ruh çıkar'}</small>`);
      }
    }
    for (const k of $G.KS) {
      if (k.d) continue;
      const q = k.m.position,
        d = Math.hypot(q.x - $G.P.x, q.z - $G.P.z);
      add(q.x, q.y + 3.8, q.z, `<span>Kös davulu</span>${d < 10 ? `<small>${E_}çal. Düşmanları sese çağırır</small>` : ''}`);
    }
    for (const p of $G.JP) {
      const d = Math.hypot(p.x - $G.P.x, p.z - $G.P.z);
      if (d < 6) add(p.x, p.y + 1.6, p.z, '<small>Sıçrama taşı</small>');
    }
    for (const u of $G.PU) {
      const q = u.m.position;
      add(q.x, q.y + 1.3, q.z, `<span>${PUD[u.t].n}</span>`);
    }
  }
  for (let i = n; i < WL.length; i++) if (WL[i].el.style.display != 'none') WL[i].el.style.display = 'none';
}
// ---- büyük harita (Tab basılıyken)
