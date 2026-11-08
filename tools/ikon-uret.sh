#!/bin/zsh
# Simge sayfası üretici: Codex'in yerleşik görsel üretimiyle (ChatGPT hesabı) tarif sayfalarını çizer.
# tools/ikon-uret.sh <sayfalar.json> <çıkış klasörü> <sayfa adı...>
# Her sayfa <klasör>/<ad>.png olarak kaydedilir; kesmek için tools/ikon-kes.mjs.
set -u
JSON=$1; OUT=$2; shift 2
CODEX=${CODEX:-/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex}
mkdir -p "$OUT"
for AD in "$@"; do
  ISTEM=$(node -e "const s=require('$JSON').find(x=>x.ad=='$AD');process.stdout.write(s.istem)")
  "$CODEX" exec -s workspace-write -c model_reasoning_effort=low -o "$OUT/$AD.md" \
    "Use the imagegen skill with the built-in image_gen tool (not the CLI). Generate exactly ONE SQUARE image (same width and height, 1024x1024 or larger). The background must be fully transparent (alpha 0): no white, grey, paper or checkerboard background. Use this prompt, then copy the generated PNG to $OUT/$AD.png and reply only with the path. Prompt:

$ISTEM" > "$OUT/$AD.log" 2>&1
  [ -f "$OUT/$AD.png" ] && echo "$AD tamam" || echo "$AD HATA (bkz. $OUT/$AD.log)"
done
