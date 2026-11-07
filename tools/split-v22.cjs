// Kara Koru: tek dosyalık betiği ES modüllerine bölen araç.
// node split.js <game.js> <çıktı/src>
// Kurallar:
//  - Üst düzey her `let` ortak duruma ($G) taşınır, tüm referanslar $G.ad olur.
//  - Üst düzey fonksiyonlar `export function` olur.
//  - Üst düzey `const` ve diğer tüm çalıştırılabilir kod, orijinal sırayı koruyan
//    __init_N fonksiyonlarına taşınır. main.js bunları sırayla çağırır, böylece
//    döngüsel importlarda bile başlatma sırası tek dosyadaki ile aynı kalır.
//  - Modüller arası referanslar için importlar otomatik üretilir.
const fs = require('fs'), path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const [, , IN, OUT] = process.argv;
const src = fs.readFileSync(IN, 'utf8');
const ast = parse(src, { sourceType: 'script' });

// ---- modül haritası: satır aralıkları, sonra ad ve satır istisnaları
const RANGES = [
  [1, 'core/util'], [3, 'geo/geo'], [81, 'geo/models'], [441, 'geo/anim'], [547, 'world/mapgen'], [629, 'world/mapm'],
  [795, 'core/settings'], [798, 'engine/color'], [801, 'engine/renderer'], [844, 'world/terrain'], [881, 'world/build'],
  [974, 'world/ambient'], [1011, 'game/heroes'], [1020, 'game/creatures'], [1024, 'world/props'], [1034, 'engine/postfx'],
  [1669, 'engine/gfx'], [1707, 'data/content'], [1762, 'ui/icons'], [1778, 'core/state'], [1785, 'audio/synth'],
  [2085, 'audio/engine'], [2191, 'audio/ambience'], [2218, 'audio/music'], [2265, 'core/helpers'], [2274, 'engine/vfx'],
  [2358, 'game/stats'], [2373, 'ui/cards'], [2414, 'game/objects'], [2483, 'game/flow'], [2531, 'ui/leaderboard'],
  [2567, 'game/enemies'], [2603, 'game/interact'], [2636, 'game/weapons'], [2690, 'world/tornado'], [2701, 'ui/screenfx'],
  [2709, 'game/weapon-fx'], [2734, 'game/update'], [2825, 'ui/hud'], [2867, 'ui/bigmap'], [2881, 'input/gamepad'],
  [2926, 'input/input'], [2953, 'core/boot']];
const BYNAME = {
  'game/features': ['drySpot', 'mkGraves', 'wakeGrave', 'graveDone', 'mkDrums', 'hitKos', 'featTick'],
  'ui/menus': ['menu', 'renderMenu', 'selC', 'otag', 'buyMU', 'buyML', 'SFM', 'settings', 'closeSet', 'over', 'pause', 'resume'],
  'game/hero-anim': ['GPK', 'atkG', 'animH'],
  'core/loop': ['last', 'loop'],
  'audio/synth': ['SNDSRC', 'SND'],
};
const BYLINE = { 2896: 'input/input' };
const nameMod = {};
for (const [m, ns] of Object.entries(BYNAME)) for (const n of ns) nameMod[n] = m;

const body = ast.program.body;
const declNames = st => {
  if (st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') return [st.id.name];
  if (st.type === 'VariableDeclaration') return st.declarations.flatMap(d => Object.keys(t.getBindingIdentifiers(d.id)));
  return [];
};
const modOf = st => {
  for (const n of declNames(st)) if (nameMod[n]) return nameMod[n];
  const ln = st.loc.start.line;
  if (BYLINE[ln]) return BYLINE[ln];
  let m = RANGES[0][1];
  for (const [l, mm] of RANGES) if (ln >= l) m = mm;
  return m;
};
const stMod = body.map(modOf);

// ---- kapsam analizi
let prog;
traverse(ast, { Program(p) { prog = p } });
const PB = prog.scope.bindings;
const LETS = new Set(Object.keys(PB).filter(n => PB[n].kind === 'let' || PB[n].kind === 'var'));
const declMod = {};
body.forEach((st, i) => { for (const n of declNames(st)) declMod[n] = stMod[i] });
const STATE = '$G';
if (PB[STATE] || src.includes(STATE + '.')) throw new Error('durum adı çakışıyor');

const isNonRef = p => {
  const par = p.parentPath, k = p.parentKey;
  if (par.isMemberExpression() && k === 'property' && !par.node.computed) return true;
  if (par.isOptionalMemberExpression() && k === 'property' && !par.node.computed) return true;
  if ((par.isObjectProperty() || par.isObjectMethod() || par.isClassMethod() || par.isClassProperty()) && k === 'key' && !par.node.computed) return true;
  if (par.isLabeledStatement() || par.isBreakStatement() || par.isContinueStatement()) return true;
  return false;
};
const topIndex = p => { const s = p.findParent(q => q.parentPath && q.parentPath.isProgram()); return s ? s.key : -1 };

// strict mod denetimleri
const warn = [];
traverse(ast, {
  FunctionDeclaration(p) { if (p.parentPath.isBlockStatement() && !p.parentPath.parentPath.isFunction()) warn.push('blok içi fonksiyon: ' + p.node.id.name + ' satır ' + p.node.loc.start.line) },
  ThisExpression(p) { if (!p.getFunctionParent()) warn.push('üst düzey this satır ' + p.node.loc.start.line) },
  AssignmentExpression(p) { const l = p.node.left; if (l.type === 'Identifier' && !p.scope.getBinding(l.name)) warn.push('örtük global atama: ' + l.name + ' satır ' + l.loc.start.line) },
});

// ---- referansları topla ve let'leri $G'ye çevir
const uses = body.map(() => new Set());
let usesThree = body.map(() => false);
traverse(ast, {
  Identifier(p) {
    const n = p.node.name;
    if (isNonRef(p)) return;
    const b = p.scope.getBinding(n);
    const ti = topIndex(p);
    if (!b) { if (n === 'THREE' && ti >= 0) usesThree[ti] = true; return }
    if (b !== PB[n]) return;
    // üst düzey bildirimin kendi adı
    if (p.parentPath.isVariableDeclarator() && p.parentKey === 'id' && p.parentPath.parentPath.parentPath.isProgram()) return;
    if ((p.parentPath.isFunctionDeclaration() || p.parentPath.isClassDeclaration()) && p.parentKey === 'id' && p.parentPath.parentPath.isProgram()) return;
    if (p.findParent(q => q.isVariableDeclarator() && q.parentPath.parentPath.isProgram() && q.node.id.type !== 'Identifier' && q.get('id').isAncestor && p.isDescendant(q.get('id')))) return;
    if (LETS.has(n)) {
      const par = p.parentPath;
      if (par.isObjectProperty() && par.node.shorthand) par.node.shorthand = false;
      p.replaceWith(t.memberExpression(t.identifier(STATE), t.identifier(n)));
      p.skip();
      return;
    }
    if (ti >= 0) uses[ti].add(n);
  },
});

// ---- çıktı üretimi
const gen = node => generate(node, { comments: true, jsescOption: { minimal: true } }).code;
const mods = {};
const M = m => mods[m] || (mods[m] = { lets: [], items: [], imports: new Set(), three: false });
let initN = 0, initOrder = [], cur = null;
const pushInit = (m, stmts, comments) => {
  if (!stmts.length) return;
  if (comments && comments.length) stmts[0].leadingComments = (comments || []).concat(stmts[0].leadingComments || []);
  if (!cur || cur.m !== m) { cur = { m, name: '__init_' + (++initN), stmts: [] }; M(m).items.push(cur); initOrder.push({ m, name: cur.name }) }
  cur.stmts.push(...stmts);
};
body.forEach((st, i) => {
  const m = stMod[i], mm = M(m);
  for (const u of uses[i]) if (declMod[u] && declMod[u] !== m) mm.imports.add(u);
  if (usesThree[i]) mm.three = true;
  const lc = st.leadingComments; st.leadingComments = null;
  if (st.type === 'FunctionDeclaration') { cur = null; const e = t.exportNamedDeclaration(st, []); e.leadingComments = lc; mm.items.push({ code: e }); return }
  if (st.type === 'VariableDeclaration') {
    const out = [];
    for (const d of st.declarations) {
      const names = Object.keys(t.getBindingIdentifiers(d.id));
      if (st.kind === 'const') {
        mm.lets.push(...names);
        if (d.init) out.push(t.expressionStatement(t.assignmentExpression('=', d.id.type === 'Identifier' ? t.identifier(names[0]) : d.id, d.init)));
      } else {
        if (d.id.type !== 'Identifier') throw new Error('desen let desteklenmiyor satır ' + st.loc.start.line);
        out.push(t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.identifier(STATE), t.identifier(names[0])), d.init || t.identifier('undefined'))));
      }
    }
    pushInit(m, out, lc); return;
  }
  if (st.type === 'EmptyStatement') return;
  pushInit(m, [st], lc);
});

// ---- dosyaları yaz
const rel = (from, to) => { let r = path.posix.relative(path.posix.dirname(from), to); if (!r.startsWith('.')) r = './' + r; return r + '.js' };
const header = m => `// ${m}.js · Kara Koru\n// Bu dosya tek dosyalık sürümden (v22) otomatik ayrıldı. Ortak oyun durumu core/store.js içindeki $G nesnesinde.\n`;
for (const [m, mm] of Object.entries(mods)) {
  const lines = [header(m)];
  lines.push(`import { ${STATE} } from '${rel(m, 'core/store')}';`);
  if (mm.three) lines.push(`import { THREE } from '${rel(m, 'engine/three')}';`);
  const byMod = {};
  for (const u of mm.imports) (byMod[declMod[u]] || (byMod[declMod[u]] = [])).push(u);
  for (const [dm, ns] of Object.entries(byMod).sort()) lines.push(`import { ${ns.sort().join(', ')} } from '${rel(m, dm)}';`);
  lines.push('');
  if (mm.lets.length) lines.push(`export let ${mm.lets.join(', ')};\n`);
  for (const it of mm.items) {
    if (it.code) lines.push(gen(it.code) + '\n');
    else { const fn = t.exportNamedDeclaration(t.functionDeclaration(t.identifier(it.name), [], t.blockStatement(it.stmts)), []); lines.push(gen(fn) + '\n') }
  }
  const f = path.join(OUT, m + '.js');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, lines.join('\n'));
}
// store.js: tüm değişken oyun durumu
const lets = [...LETS];
fs.mkdirSync(path.join(OUT, 'core'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'core/store.js'),
  `// core/store.js · Kara Koru\n// Değişen tüm oyun durumu tek nesnede. Her modül buradan okur ve yazar.\n// Değerler başlatma sırasında (__init_N) atanır.\nexport const ${STATE} = {\n${lets.map(n => `  ${n}: undefined,`).join('\n')}\n};\n`);
// boot sırası
const modsUsed = [...new Set(initOrder.map(o => o.m))];
let mainJs = `// main.js · Kara Koru giriş noktası\nimport './styles/main.css';\nimport { ${STATE} } from './core/store.js';\n`;
modsUsed.forEach((m, i) => { mainJs += `import * as m${i} from './${m}.js';\n` });
const allMods = Object.keys(mods);
allMods.forEach(m => { if (!modsUsed.includes(m)) mainJs += `import * as m${modsUsed.length + allMods.indexOf(m)} from './${m}.js';\n` });
mainJs += `\nconst MODS = { ${allMods.map(m => `'${m}': m${modsUsed.includes(m) ? modsUsed.indexOf(m) : modsUsed.length + allMods.indexOf(m)}`).join(', ')} };\n`;
mainJs += `const BOOT = [\n${initOrder.map(o => `  ['${o.m}', '${o.name}'],`).join('\n')}\n];\n`;
mainJs += `
// Satır içi HTML işleyicileri (onclick="start()" gibi), konsol ve testler için
// modül adlarını ve durum alanlarını window üzerinden erişilebilir yap.
function bridge() {
  for (const mod of Object.values(MODS)) for (const [k, v] of Object.entries(mod)) {
    if (k.startsWith('__init_')) continue;
    try { Object.defineProperty(window, k, { get: () => mod[k], set: v2 => { throw new Error(k + ' salt okunur') }, configurable: true }) } catch (e) {}
  }
  for (const k of Object.keys(${STATE})) {
    try { Object.defineProperty(window, k, { get: () => ${STATE}[k], set: v => { ${STATE}[k] = v }, configurable: true }) } catch (e) {}
  }
}
bridge();
for (const [m, f] of BOOT) MODS[m][f]();
`;
fs.writeFileSync(path.join(OUT, 'main.js'), mainJs);
console.log(JSON.stringify({ modules: allMods.length, lets: lets.length, inits: initN, warnings: warn }, null, 1));
