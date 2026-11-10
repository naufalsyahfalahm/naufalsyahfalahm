#!/usr/bin/env bash
# Usage: scripts/stills.sh <outdir> <frame> [<frame> ...]   (stills of ErgoAIDeskPitch)
set -euo pipefail
out="$1"; shift
mkdir -p "$out"
printf '%s\n' "$@" | xargs -P 2 -I{} sh -c "npx remotion still ErgoAIDeskPitch '$out/frame-{}.png' --frame={} >/dev/null 2>&1 && echo rendered {} || echo FAILED {}"
