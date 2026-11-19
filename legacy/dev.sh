#!/bin/sh
# local dev server: builds, serves on PORT (default 8090), rebuilds when src/ changes
cd "$(dirname "$0")"
PORT="${PORT:-8090}"
./build.sh
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null; exit 0' INT TERM EXIT
echo "serving http://localhost:$PORT  (edit src/, refresh the page)"
last=""
while :; do
  now=$(ls -lT src 2>/dev/null | md5 -q 2>/dev/null || ls -l --time-style=full-iso src | md5sum)
  if [ "$now" != "$last" ]; then [ -n "$last" ] && ./build.sh; last="$now"; fi
  sleep 1
done
