// ui/console.js · Kara Koru
// Komut konsolu bir geliştirici aracıdır (altın, gümüş, ölümsüzlük, eşya, kilit açma...). Yalnız geliştirme sunucusunda ve
// test derlemesinde (npm run build:test) vardır; yayın derlemesinde kodu pakete girmez, oyunda açılamaz. Eskiden yayında da
// F10 / ters tırnak ile herkese açıktı. Asıl kod: ui/console-impl.js.

export const CON_VAR = __KOPRU__;

/** @type {any} */
let impl = null;
if (__KOPRU__) import('./console-impl.js').then(m => { impl = m; });

export function conToggle(on) {
  if (impl) impl.conToggle(on);
}

export function conOpen() {
  return impl ? impl.conOpen() : false;
}

export function run(line) {
  if (impl) impl.run(line);
}
