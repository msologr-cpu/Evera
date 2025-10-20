#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
SPDX_LINE="SPDX-License-Identifier: LicenseRef-EVERA-OKL-1.0"
HEADER_BLOCK_JS=$'/*\n * SPDX-License-Identifier: LicenseRef-EVERA-OKL-1.0\n * © 2025 Evera.world | Maximian Solomonidis (Architect Solo)\n * Part of the Evera Dialogical Reconstruction System (“EVERA Format”).\n * Non-commercial use only. No derivatives. No model training or format replication without written permission.\n */\n'
HEADER_BLOCK_HTML=$'<!--\n * SPDX-License-Identifier: LicenseRef-EVERA-OKL-1.0\n * © 2025 Evera.world | Maximian Solomonidis (Architect Solo)\n * Part of the Evera Dialogical Reconstruction System (“EVERA Format”).\n * Non-commercial use only. No derivatives. No model training or format replication without written permission.\n-->\n'

target_dirs=("pages" "en/pages" "js" "css")

add_header() {
  local file="$1"
  local ext
  ext="${file##*.}"

  if grep -Fq "$SPDX_LINE" "$file"; then
    return
  fi

  local header
  case "$ext" in
    html)
      header="$HEADER_BLOCK_HTML"
      ;;
    js|css)
      header="$HEADER_BLOCK_JS"
      ;;
    *)
      return
      ;;
  esac

  tmp_file="$(mktemp)"
  printf '%s' "$header" > "$tmp_file"
  cat "$file" >> "$tmp_file"
  cat "$tmp_file" > "$file"
  rm -f "$tmp_file"
  printf 'Injected header into %s\n' "$file"
}

for dir in "${target_dirs[@]}"; do
  full_dir="$ROOT_DIR/$dir"
  if [ -d "$full_dir" ]; then
    while IFS= read -r -d '' file; do
      add_header "$file"
    done < <(find "$full_dir" -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' \) -print0)
  fi
done
