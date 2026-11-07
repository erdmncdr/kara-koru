// ui/actions.js · Kara Koru
// Satır içi HTML işleyicilerinin (onclick="...") yerine tek olay yönlendirici.
// Düğme: A('menuPage', 'kahraman') → data-act="menuPage" data-a='["kahraman"]'. Tıklayınca kayıttaki işlev argümanlarla çağrılır.
// Kayıt, main.js'in topladığı modül dışa aktarımlarıdır (regActions); kod dizgesi değerlendirilmez.
// Girdi alanları: data-in (input olayı) ve data-ch (change olayı) işlevin adını taşır, işlev öğeyi alır.

const REG = Object.create(null);

export function regActions(mods) {
  for (const m of mods) for (const k in m) if (typeof m[k] == 'function' && !k.startsWith('__init_')) REG[k] = m[k];
}

const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// HTML öznitelikleri: işlev adı ve JSON argümanlar
export function A(name, ...a) {
  return ` data-act="${name}"${a.length ? ` data-a="${attr(JSON.stringify(a))}"` : ''}`;
}

// adla çağrı (ayar geri çağrıları gibi); bilinmeyen ad sessizce atlanmaz, konsola yazılır
export function call(name, ...a) {
  const f = REG[name];
  if (!f) {
    console.warn('Kara Koru: bilinmeyen eylem', name);
    return;
  }
  return f(...a);
}

function run(el) {
  let a = [];
  if (el.dataset.a) {
    try {
      a = JSON.parse(el.dataset.a);
    } catch (e) {
      return;
    }
  }
  return call(el.dataset.act, ...a);
}

export function __init_actions() {
  document.addEventListener('click', e => {
    const el = /** @type {HTMLElement} */ (e.target).closest && /** @type {HTMLElement} */ (e.target).closest('[data-act]');
    if (!el || /** @type {HTMLButtonElement} */ (el).disabled) return;
    run(/** @type {HTMLElement} */ (el));
  });
  // düğme olmayan tıklanabilir öğeler (kartlar: role=button tabindex=0) Enter ile de çalışır
  document.addEventListener('keydown', e => {
    const el = /** @type {HTMLElement} */ (e.target);
    if (e.key != 'Enter' || !el || !el.dataset || !el.dataset.act || el.tagName == 'BUTTON') return;
    e.preventDefault();
    run(el);
  });
  document.addEventListener('input', e => {
    const el = /** @type {HTMLElement} */ (e.target);
    if (el && el.dataset && el.dataset.in) call(el.dataset.in, el);
  });
  document.addEventListener('change', e => {
    const el = /** @type {HTMLElement} */ (e.target);
    if (el && el.dataset && el.dataset.ch) call(el.dataset.ch, el);
  });
}
