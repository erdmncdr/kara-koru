// yonetim/grafik.js · Kara Koru yönetim paneli
// Küçük SVG grafikler (kütüphanesiz). İki ana seri rengi: altın ve turkuaz (koyu gece zemininde; sarı-turuncu ile camgöbeği
// renk körlüğünde de ayrışır). Çubuklar dikey geçişli, tepesi parlak; panel sayfası ilk çizildiğinde (.gir) büyüyerek gelir.
// Fare ya da odakla üstüne gelinen her işaret `data-ip` metnini ipucu kutusunda gösterir (yonetim.js ipucu dinleyicisi).
export const G1 = '#ffb92e', G2 = '#25e2c2';
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const sayi = n => (typeof n == 'number' && isFinite(n) ? Math.round(n).toLocaleString('tr-TR') : '0');
let sira = 0; // geçiş kimlikleri sayfada tekil olsun

// "güzel" üst sınır: 1, 2, 5 × 10^n
function ust(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

// dikey çubuk: veri [{ e: etiket, d: değer, ip: ipucu }]. Tek seri: başlık adını söyler, lejant yok.
export function cubuk(veri, { yuk = 190, renk = G1, ad = '' } = {}) {
  const W = 640, sol = 44, alt = 22, ustB = 10, n = veri.length || 1, mx = ust(Math.max(1, ...veri.map(v => v.d))), gid = 'cg' + (++sira);
  const iw = (W - sol - 6) / n, bw = Math.max(3, Math.min(34, iw - 3)), ih = yuk - alt - ustB;
  const y = d => ustB + ih - d / mx * ih;
  const izg = [0, .5, 1].map(k => `<line x1="${sol}" x2="${W - 2}" y1="${y(mx * k)}" y2="${y(mx * k)}" class="iz"/><text x="${sol - 8}" y="${y(mx * k) + 4}" text-anchor="end" class="ek">${sayi(mx * k)}</text>`).join('');
  const adim = Math.ceil(n / 8), enB = Math.max(...veri.map(v => v.d));
  const cub = veri.map((v, i) => {
    const x = sol + i * iw + (iw - bw) / 2, h = Math.max(v.d > 0 ? 2 : 0, v.d / mx * ih), r = Math.min(5, bw / 2, h);
    const yol = h <= 0 ? '' : `<path class="cb${v.d == enB ? ' en' : ''}" style="--i:${i}" d="M${x},${ustB + ih}v${-(h - r)}q0,${-r} ${r},${-r}h${bw - 2 * r}q${r},0 ${r},${r}v${h - r}z" fill="url(#${gid})"/><rect class="cb ct" style="--i:${i}" x="${x}" y="${ustB + ih - h}" width="${bw}" height="${Math.min(3, h)}" rx="1.5" fill="${renk}"/>`;
    return `<g class="isr" tabindex="0" data-ip="${esc(v.ip || v.e + ': ' + sayi(v.d))}"><rect class="iy" x="${sol + i * iw}" y="${ustB}" width="${iw}" height="${ih}" rx="4" fill="transparent"/>${yol}</g>`
      + (i % adim == 0 || i == n - 1 ? `<text x="${sol + i * iw + iw / 2}" y="${yuk - 6}" text-anchor="middle" class="ek">${esc(v.e)}</text>` : '');
  }).join('');
  return `<svg viewBox="0 0 ${W} ${yuk}" class="grf" role="img" aria-label="${esc(ad)}" style="--r:${renk}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${renk}"/><stop offset="1" stop-color="${renk}" stop-opacity=".22"/></linearGradient></defs>${izg}${cub}</svg>`;
}

// yatay çubuk listesi (HTML): veri [{ e, d, ek }]; değer her satırın sonunda yazılı (ipucuya gerek yok)
export function yatay(veri, { renk = G1, toplam = 0 } = {}) {
  const mx = Math.max(1, ...veri.map(v => v.d)), top = toplam || veri.reduce((a, v) => a + v.d, 0) || 1;
  return `<ul class="ytl">${veri.map((v, i) => `<li><span class="ye">${esc(v.e)}</span><span class="yc"><i style="--w:${Math.max(1.5, v.d / mx * 100)}%;--r:${v.renk || renk};--i:${i}"></i></span><b>${sayi(v.d)}</b><small>%${Math.round(v.d / top * 100)}</small></li>`).join('')}</ul>`;
}

// kıvılcım çizgisi: küçük, eksensiz eğilim (nabız kutularında). degerler [..]
export function kivilcim(degerler, renk = G1) {
  const n = degerler.length;
  if (n < 2) return '';
  const W = 120, H = 34, mx = Math.max(1, ...degerler), mn = Math.min(...degerler), ar = Math.max(1, mx - mn), gid = 'kg' + (++sira);
  const x = i => 2 + i / (n - 1) * (W - 4), y = d => 3 + (1 - (d - mn) / ar) * (H - 8);
  const yol = degerler.map((d, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(d).toFixed(1)).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="kvl" aria-hidden="true" preserveAspectRatio="none"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${renk}" stop-opacity=".45"/><stop offset="1" stop-color="${renk}" stop-opacity="0"/></linearGradient></defs><path d="${yol}L${x(n - 1).toFixed(1)},${H}L${x(0).toFixed(1)},${H}z" fill="url(#${gid})"/><path class="cy" pathLength="1" d="${yol}" fill="none" stroke="${renk}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

// çizgi: seriler [{ ad, renk, kesik, y: [..] }], x ekseni 1..n ortak. Lejant üstte; fareyle gezilen x'in değerleri ipucunda.
export function cizgi(seriler, { yuk = 250, xAd = '', ad = '', id = 'cz' } = {}) {
  const W = 640, sol = 56, alt = 26, ustB = 10, n = seriler[0].y.length, mx = ust(Math.max(1, ...seriler.flatMap(s => s.y))), gid = 'lg' + (++sira);
  const iw = W - sol - 8, ih = yuk - alt - ustB, x = i => sol + i / (n - 1) * iw, y = d => ustB + ih - d / mx * ih;
  const izg = [0, .25, .5, .75, 1].map(k => `<line x1="${sol}" x2="${W - 4}" y1="${y(mx * k)}" y2="${y(mx * k)}" class="iz"/><text x="${sol - 8}" y="${y(mx * k) + 4}" text-anchor="end" class="ek">${sayi(mx * k)}</text>`).join('');
  const xe = []; for (let i = 19; i < n; i += 20) xe.push(`<text x="${x(i)}" y="${yuk - 7}" text-anchor="middle" class="ek">${i + 1}</text>`);
  const d = s => s.y.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(Math.min(v, mx)).toFixed(1)).join('');
  // dolgu: kesiksiz son serinin altı (taslak varsa taslağın, yoksa yayındakinin)
  const dolu = [...seriler].reverse().find(s => !s.kesik) || seriler[0];
  const alan = `<path class="ca" d="${d(dolu)}L${x(n - 1).toFixed(1)},${ustB + ih}L${x(0).toFixed(1)},${ustB + ih}z" fill="url(#${gid})"/>`;
  const yol = seriler.map(s => `<path class="${s.kesik ? 'ck' : 'cy'}"${s.kesik ? '' : ' pathLength="1"'} d="${d(s)}" fill="none" stroke="${s.renk}" stroke-width="${s.kesik ? 2 : 2.6}" stroke-linejoin="round" stroke-linecap="round"${s.kesik ? ' stroke-dasharray="5 5"' : ''}/>`).join('');
  const lej = `<div class="lej">${seriler.map(s => `<span><i style="background:${s.renk}"></i>${esc(s.ad)}</span>`).join('')}</div>`;
  return `${lej}<svg viewBox="0 0 ${W} ${yuk}" class="grf czg" id="${id}" role="img" aria-label="${esc(ad)}" data-n="${n}" data-sol="${sol}" data-iw="${iw}" data-w="${W}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dolu.renk}" stop-opacity=".34"/><stop offset="1" stop-color="${dolu.renk}" stop-opacity="0"/></linearGradient></defs>${izg}${xe.join('')}<text x="${W - 4}" y="${yuk - 7}" text-anchor="end" class="ek">${esc(xAd)}</text>${alan}${yol}<line class="imlec" y1="${ustB}" y2="${ustB + ih}" x1="-9" x2="-9"/></svg>`;
}
