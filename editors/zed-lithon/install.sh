#!/usr/bin/env bash
# Install the Lithon language definition into Zed by *linking* this repo's
# pack (editors/zed-lithon) into ~/.config/zed/languages/lithon — the
# grammar, config and highlights always track this repo, no copies.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEST="$HOME/.config/zed/languages/lithon"
G="$REPO/editors/zed-lithon/grammars/lithon"
L="$REPO/editors/zed-lithon/languages/lithon"
mkdir -p "$DEST"
ln -sfn "$G/grammar.js"        "$DEST/grammar.js"
ln -sfn "$G/package.json"      "$DEST/package.json"
ln -sfn "$G/tree-sitter.json"  "$DEST/tree-sitter.json"
ln -sfn "$G/src"               "$DEST/src"
ln -sfn "$L/config.toml"       "$DEST/config.toml"
ln -sfn "$L/highlights.scm"    "$DEST/highlights.scm"
echo "Lithon language linked: $DEST -> $REPO/editors/zed-lithon"
echo "Reopen Zed and open any .lio file to see highlighting."
