#!/usr/bin/env bash

echo "=============================="
echo "STEADFAST PRODUCTION CHECK"
echo "=============================="

# Common excludes for all checks
EXCLUDES="--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.claude --exclude-dir=.git"
RUNTIME="--include=*.ts --include=*.tsx --include=*.js --include=*.jsx --include=*.mjs"

echo ""
echo "1. Running build..."
npm run build || { echo "Build failed"; exit 1; }

echo ""
echo "2. Running lint..."
npm run lint || { echo "Lint failed"; exit 1; }

echo ""
echo "3. Checking for localhost in runtime code..."
HITS=$(grep -Rn "localhost" . $EXCLUDES $RUNTIME \
  --exclude="release.sh" \
  | grep -v "// .*localhost" || true)
if [ -n "$HITS" ]; then
  echo "$HITS"
  echo "FAIL: Found localhost references in runtime code. Fix before deploy."
  exit 1
fi
echo "   OK"

echo ""
echo "4. Checking for browser-only PDF libs (pdfjs/DOMMatrix)..."
HITS=$(grep -Rn "pdfjs-dist\|react-pdf\|DOMMatrix" . $EXCLUDES $RUNTIME \
  --exclude="release.sh" \
  | grep -v "// \|/\*\| \* " || true)
if [ -n "$HITS" ]; then
  echo "$HITS"
  echo "WARN: Found browser-only PDF libs. Ensure not used server-side."
fi

echo ""
echo "5. Checking for test Clerk keys in source..."
HITS=$(grep -Rn "pk_test_\|sk_test_" . $EXCLUDES $RUNTIME \
  --exclude="release.sh" --exclude=".env*" || true)
if [ -n "$HITS" ]; then
  echo "$HITS"
  echo "FAIL: Found Clerk test keys in source code. Use env vars."
  exit 1
fi
echo "   OK"

echo ""
echo "6. Checking for console.log in client components..."
HITS=$(grep -Rn "console\.log(" . $EXCLUDES \
  --include="*.tsx" --include="*.jsx" \
  --exclude="release.sh" \
  | grep -v "// " || true)
if [ -n "$HITS" ]; then
  echo "$HITS"
  echo "WARN: Found console.log in client components. Review before deploy."
fi

echo ""
echo "=============================="
echo "Release checks complete."
echo "If no FAIL errors above, safe to deploy."
echo "=============================="
