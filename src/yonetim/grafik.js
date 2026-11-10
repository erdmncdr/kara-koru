// yonetim/grafik.js · Kara Koru yönetim paneli
// Küçük SVG grafikler (kütüphanesiz). Renkler koyu panel zemininde doğrulandı (dataviz validate_palette: #bd8220, #2e9d8d).
// Fare ya da odakla üstüne gelinen her işaret `data-ip` metnini ipucu kutusunda gösterir (yonetim.js ipucu dinleyicisi).
export const G1 = '#bd8220', G2 = '#2e9d8d';
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const sayi = n => (typeof n == 'number' && isFinite(n) ? Math.round(n).toLocaleString('tr-TR') : '0');

// "güzel" üst sınır: 1, 2, 5 × 10^n
function ust(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

// dikey çubuk: veri [{ e: etiket, d: değer, ip: ipucu }]. Tek seri: başlık adını söyler, lejant yok.
export function cubuk(veri, { yuk = 190, renk = G1, ad = '' } = {}) {
  const W = 640, sol = 44, alt = 22, ustB = 8, n = veri.length || 1, mx = ust(Math.max(1, ...veri.map(v => v.d)));
  const iw = (W - sol - 6) / n, bw = Math.max(3, Math.min(34, iw - 2)), ih = yuk - alt - ustB;
  const y = d => ustB + ih - d / mx * ih;
  const izg = [0, .5, 1].map(k => `<line x1="${sol}" x2="${W - 2}" y1="${y(mx * k)}" y2="${y(mx * k)}" class="iz"/><text x="${sol - 8}" y="${y(mx * k) + 4}" text-anchor="end" class="ek">${sayi(mx * k)}</text>`).join('');
  const adim = Math.ceil(n / 8);
  const cub = veri.map((v, i) => {
    const x = sol + i * iw + (iw - bw) / 2, h = Math.max(v.d > 0 ? 2 : 0, v.d / mx * ih), r = Math.min(4, bw / 2, h);
    const yol = h <= 0 ? '' : `<path d="M${x},${ustB + ih}v${-(h - r)}q0,${-r} ${r},${-r}h${bw - 2 * r}q${r},0 ${r},${r}v${h - r}z" fill="${renk}"/>`;
    return `<g class="isr" tabindex="0" data-ip="${esc(v.ip || v.e + ': ' + sayi(v.d))}"><rect x="${sol + i * iw}" y="${ustB}" width="${iw}" height="${ih}" fill="transparent"/>${yol}</g>`
      + (i % adim == 0 || i == n - 1 ? `<text x="${sol + i * iw + iw / 2}" y="${yuk - 6}" text-anchor="middle" class="ek">${esc(v.e)}</text>` : '');
  }).join('');
  return `<svg viewBox="0 0 ${W} ${yuk}" class="grf" role="img" aria-label="${esc(ad)}">${izg}${cub}</svg>`;
}

// yatay çubuk listesi (HTML): veri [{ e, d, ek }]; değer her satırın sonunda yazılı (ipucuya gerek yok)
export function yatay(veri, { renk = G1, toplam = 0 } = {}) {
  const mx = Math.max(1, ...veri.map(v => v.d)), top = toplam || veri.reduce((a, v) => a + v.d, 0) || 1;
  return `<ul class="ytl">${veri.map(v => `<li><span class="ye">${esc(v.e)}</span><span class="yc"><i style="width:${Math.max(1.5, v.d / mx * 100)}%;background:${v.renk || renk}"></i></span><b>${sayi(v.d)}</b><small>%${Math.round(v.d / top * 100)}</small></li>`).join('')}</ul>`;
}

// çizgi: seriler [{ ad, renk, kesik, y: [..] }], x ekseni 1..n ortak. Lejant üstte; fareyle gezilen x'in değerleri ipucunda.
export function cizgi(seriler, { yuk = 250, xAd = '', ad = '', id = 'cz' } = {}) {
  const W = 640, sol = 56, alt = 26, ustB = 10, n = seriler[0].y.length, mx = ust(Math.max(1, ...seriler.flatMap(s => s.y)));
  const iw = W - sol - 8, ih = yuk - alt - ustB, x = i => sol + i / (n - 1) * iw, y = d => ustB + ih - d / mx * ih;
  const izg = [0, .25, .5, .75, 1].map(k => `<line x1="${sol}" x2="${W - 4}" y1="${y(mx * k)}" y2="${y(mx * k)}" class="iz"/><text x="${sol - 8}" y="${y(mx * k) + 4}" text-anchor="end" class="ek">${sayi(mx * k)}</text>`).join('');
  const xe = []; for (let i = 19; i < n; i += 20) xe.push(`<text x="${x(i)}" y="${yuk - 7}" text-anchor="middle" class="ek">${i + 1}</text>`);
  const yol = seriler.map(s => `<path d="${s.y.map((d, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(Math.min(d, mx)).toFixed(1)).join('')}" fill="none" stroke="${s.renk}" stroke-width="2" stroke-linejoin="round"${s.kesik ? ' stroke-dasharray="5 4"' : ''}/>`).join('');
  const lej = `<div class="lej">${seriler.map(s => `<span><i style="background:${s.renk}"></i>${esc(s.ad)}</span>`).join('')}</div>`;
  return `${lej}<svg viewBox="0 0 ${W} ${yuk}" class="grf czg" id="${id}" role="img" aria-label="${esc(ad)}" data-n="${n}" data-sol="${sol}" data-iw="${iw}" data-w="${W}">${izg}${xe.join('')}<text x="${W - 4}" y="${yuk - 7}" text-anchor="end" class="ek">${esc(xAd)}</text>${yol}<line class="imlec" y1="${ustB}" y2="${ustB + ih}" x1="-9" x2="-9"/></svg>`;
}
