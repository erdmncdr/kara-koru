// data/challenges.js · Kara Koru
// Meydan okumalar: koşu başına bir tane seçilir, harita + kademe başına ayrı tamamlanır (META.chal["k:map:tier"]).
// m: koşu gümüş çarpanı. st: stat katmanları (calc'a eklenir). fl: bayraklar (game/challenge.js okur).
// Tamamlanan her meydan okuma kalıcı +%1 gümüş verir. Meydan okumalı koşular sıralamaya yüklenmez.

export const CHAL = [
  { k: 'kirilgan', n: 'Kırılgan', d: 'Tek darbede ölürsün.', m: 1.6, fl: { fragile: 1 } },
  { k: 'turbo', n: 'Turbo', d: 'Sandıklar %96 ucuz, düşmanlar 5 kat hızlı ölçeklenir.', m: 1.5, fl: { chestp: .04, scale: 5 } },
  { k: 'uyuyan', n: 'Uyuyan', d: 'Son Dalga’ya kadar yerinden kımıldayamazsın.', m: 1.5, fl: { afk: 1 } },
  { k: 'suru', n: 'Sürü', d: '2 kat düşman, 0.75 kat tecrübe, düşmanlar 1.5 kat hızlı.', m: 1.3, st: { enN: 1, 'xp*': -.25, enSp: .5 } },
  { k: 'kucuk', n: 'Küçük', d: 'Hasar, hız ve alan 0.8 kat.', m: 1.3, st: { 'dmg*': -.2, 'spd*': -.2, 'size*': -.2 } },
  { k: 'ciplak', n: 'Çıplak', d: 'Eşya yok. Sandıklar altın verir.', m: 1.4, fl: { noItems: 1 } },
  { k: 'hiper', n: 'Hiper', d: '2 kat tecrübe ve altın, düşmanlar 4 kat hızlı ölçeklenir.', m: 1.5, st: { 'xp*': 1, 'gold*': 1 }, fl: { scale: 4 } },
  { k: 'eyvah', n: 'Eyvah', d: 'Düşman canı, hasarı ve hızı 1.25 kat.', m: 1.2, st: { enHp: .25, enDmg: .25, enSp: .25 } },
  { k: 'vay', n: 'Vay', d: 'Düşman canı, hasarı ve hızı 1.5 kat.', m: 1.4, st: { enHp: .5, enDmg: .5, enSp: .5 } },
  { k: 'yandik', n: 'Yandık', d: 'Düşman canı, hasarı ve hızı 2 kat.', m: 1.7, st: { enHp: 1, enDmg: 1, enSp: 1 } },
  { k: 'hizli', n: 'Hızlı Koşucu', d: 'Her aşamanın boss’unu 5 dakika içinde devirmezsen koşu biter.', m: 1.5, fl: { speedrun: 300 } },
  { k: 'kor', n: 'Kör', d: 'Mini harita ve büyük harita kapalı.', m: 1.2, fl: { nomap: 1 } },
  { k: 'teksilah', n: 'Tek Silah', d: 'Yalnızca bir silah slotu.', m: 1.4, fl: { ws: 1 } },
  { k: 'zirhsiz', n: 'Zırhsız', d: 'Zırh ve kaçınma işlemez.', m: 1.2, fl: { noarm: 1 } },
  { k: 'acgozlu', n: 'Açgözlü', d: 'Zorluk +%50 ile başlarsın.', m: 1.3, fl: { greed: .5 } },
  { k: 'karanlik', n: 'Karanlık', d: 'Sis burnunun dibinde.', m: 1.2, fl: { fog: 1 } },
  { k: 'lanetli', n: 'Lanetli', d: 'Lanet Tomu 10. seviyeyle başlarsın.', m: 1.4, fl: { curse10: 1 } },
  { k: 'yalniz', n: 'Yalnız', d: 'Haritada sunak yok.', m: 1.3, fl: { noshrine: 1 } },
  { k: 'pinti', n: 'Pinti', d: 'Sandıklar 3 kat pahalı.', m: 1.3, fl: { chestp: 3 } },
  { k: 'elit', n: 'Elit Yürüyüşü', d: 'Elit doğma 10 kat.', m: 1.5, st: { elspawn: 9 } },
  { k: 'hayaletsaati', n: 'Hayalet Saati', d: 'Aşama sayacı 5 dakika.', m: 1.3, fl: { stl: 300 } },
  { k: 'sessiz', n: 'Sessiz', d: 'Güç düşmez.', m: 1.1, st: { 'puc*': -1 } },
  { k: 'devavi', n: 'Dev Avı', d: 'Boss canı 2 kat.', m: 1.3, fl: { bossHp: 2 } },
  { k: 'kanyolu', n: 'Kan Yolu', d: 'Can yenilenmez; yalnız can çalma iyileştirir.', m: 1.3, fl: { noregen: 1 } },
  { k: 'acele', n: 'Acele', d: 'Düşmanlar 2 kat hızlı.', m: 1.4, st: { enSp: 1 } },
  { k: 'sanssiz', n: 'Şanssız', d: 'Şans %50 azalır.', m: 1.2, st: { 'luck*': -.5 } },
  { k: 'agir', n: 'Ağır', d: 'Hareket hızı 0.6 kat.', m: 1.3, st: { 'spd*': -.4 } },
  { k: 'tektom', n: 'Tek Tom', d: 'Yalnızca bir tom slotu.', m: 1.3, fl: { ts: 1 } },
  { k: 'altinsiz', n: 'Altınsız', d: 'Altın düşmez.', m: 1.4, fl: { nogold: 1 } },
  { k: 'erkendalga', n: 'Erken Dalga', d: 'Son Dalga boss’tan sonra değil, 5. dakikada başlar.', m: 1.5, fl: { earlySwarm: 300 } }
];
