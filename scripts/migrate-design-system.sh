#!/bin/bash
# Design System Migration Script
# Strips dark: prefixed classes and replaces common legacy patterns

set -e

PROJ="/Users/jadenwong/Dev/Steadfast"

echo "=== Phase 1: Strip dark: prefix classes ==="
# Remove dark:bg-* dark:text-* dark:border-* dark:hover:* dark:ring-* dark:shadow-* dark:brightness-* dark:from-* dark:to-* dark:via-*
# These are space-separated CSS classes so we remove them as individual tokens
find "$PROJ/components" "$PROJ/app" -name '*.tsx' -exec sed -i '' \
  -e 's/ dark:bg-[^ "]*//g' \
  -e 's/ dark:text-[^ "]*//g' \
  -e 's/ dark:border-[^ "]*//g' \
  -e 's/ dark:hover:bg-[^ "]*//g' \
  -e 's/ dark:hover:text-[^ "]*//g' \
  -e 's/ dark:hover:border-[^ "]*//g' \
  -e 's/ dark:ring-[^ "]*//g' \
  -e 's/ dark:shadow-[^ "]*//g' \
  -e 's/ dark:brightness-[^ "]*//g' \
  -e 's/ dark:from-[^ "]*//g' \
  -e 's/ dark:to-[^ "]*//g' \
  -e 's/ dark:via-[^ "]*//g' \
  -e 's/ dark:placeholder-[^ "]*//g' \
  -e 's/ dark:divide-[^ "]*//g' \
  -e 's/ dark:outline-[^ "]*//g' \
  -e 's/ dark:focus:bg-[^ "]*//g' \
  -e 's/ dark:focus:text-[^ "]*//g' \
  -e 's/ dark:focus:border-[^ "]*//g' \
  -e 's/ dark:focus-visible:ring-offset-[^ "]*//g' \
  {} +

echo "  Done. Stripped all dark: prefixed classes."

echo ""
echo "=== Phase 2: Strip leading dark: classes (at start of className) ==="
find "$PROJ/components" "$PROJ/app" -name '*.tsx' -exec sed -i '' \
  -e 's/"dark:bg-[^ "]* /"/' \
  -e 's/"dark:text-[^ "]* /"/' \
  -e 's/"dark:border-[^ "]* /"/' \
  {} +

echo "  Done."

echo ""
echo "=== Phase 3: Count remaining dark: refs ==="
REMAINING=$(grep -rl 'dark:' "$PROJ/components" "$PROJ/app" --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ')
echo "  $REMAINING files still contain dark: references"

echo ""
echo "=== Phase 4: Stats ==="
echo "  bg-[#0a1224]: $(grep -rl 'bg-\[#0a1224\]' "$PROJ/components" "$PROJ/app" --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ') files"
echo "  bg-zinc-800: $(grep -rl 'bg-zinc-800' "$PROJ/components" "$PROJ/app" --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ') files"
echo "  bg-zinc-900: $(grep -rl 'bg-zinc-900' "$PROJ/components" "$PROJ/app" --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ') files"
echo "  border-zinc-700: $(grep -rl 'border-zinc-700' "$PROJ/components" "$PROJ/app" --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ') files"
echo "  border-zinc-800: $(grep -rl 'border-zinc-800' "$PROJ/components" "$PROJ/app" --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ') files"

echo ""
echo "Migration Phase 1 complete!"
