#!/bin/sh
# concatenate src/ into the single deliverable index.html
set -e
cd "$(dirname "$0")"
{
  cat src/head.html
  echo '<script>'
  cat src/data.js
  cat src/data-ta.js
  cat src/ta.js
  cat src/lib.js
  cat src/screen-accounts.js
  cat src/screen-account.js
  cat src/screen-portfolio.js
  cat src/screen-states.js
  cat src/screen-home.js
  cat src/boot.js
  echo '</script>'
  echo '</body>'
  echo '</html>'
} > index.html
echo "built index.html ($(wc -c < index.html | tr -d ' ') bytes)"
