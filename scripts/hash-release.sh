#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
DIST_DIR="$ROOT_DIR/dist"
CHECKSUMS_FILE="$DIST_DIR/CHECKSUMS.txt"
MANIFEST_FILE="$DIST_DIR/evera_manifest.json"
VERSION="${1:-evera-$(date +%Y.%m.%d)}"
GENERATED_AT="$(date --iso-8601=seconds)"

mkdir -p "$DIST_DIR"

pushd "$ROOT_DIR" >/dev/null
mapfile -t FILES < <(find . \
  \( -path './dist' -o -path './.git' -o -path './scripts' \) -prune -o \
  -type f \
  \( \
    -name '*.html' -o \
    -name '*.js' -o \
    -name '*.css' -o \
    -name '*.webp' -o \
    -name '*.png' -o \
    -name '*.jpg' -o \
    -name '*.jpeg' -o \
    -name '*.gif' -o \
    -name '*.svg' -o \
    -name '*.ico' -o \
    -name 'manifest.json' -o \
    -name 'robots.txt' -o \
    -name 'sitemap.xml' -o \
    -name '_redirects' \
  \) -print | sed 's|^./||' | sort)
popd >/dev/null

: > "$CHECKSUMS_FILE"
for file in "${FILES[@]}"; do
  if [[ -n "$file" ]]; then
    sha="$(sha256sum "$ROOT_DIR/$file" | awk '{print $1}')"
    printf '%s  %s\n' "$sha" "$file" >> "$CHECKSUMS_FILE"
  fi
done

ROOT_HASH="$(sha256sum "$CHECKSUMS_FILE" | awk '{print $1}')"

export CHECKSUMS_FILE MANIFEST_FILE ROOT_HASH VERSION GENERATED_AT

python - <<'PY'
import json
import os
checksums_path = os.environ["CHECKSUMS_FILE"]
root_hash = os.environ["ROOT_HASH"]
version = os.environ["VERSION"]
generated_at = os.environ["GENERATED_AT"]
manifest_file = os.environ["MANIFEST_FILE"]
entries = []
with open(checksums_path, "r", encoding="utf-8") as fh:
    for line in fh:
        line = line.strip()
        if not line:
            continue
        digest, path = line.split("  ", 1)
        entries.append({"path": path, "sha256": digest})
manifest = {
    "generated_at": generated_at,
    "version": version,
    "root_hash": root_hash,
    "artifacts": entries,
}
with open(manifest_file, "w", encoding="utf-8") as fh:
    json.dump(manifest, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
PY

printf 'Generated %s with %d artifacts\n' "$MANIFEST_FILE" "${#FILES[@]}"
