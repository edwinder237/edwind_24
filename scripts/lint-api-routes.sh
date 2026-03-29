#!/bin/bash
# lint-api-routes.sh
# CI check: Ensure ALL API routes use createHandler or withOrgScope.
# Routes not using either must be explicitly exempted.
#
# Usage:
#   bash scripts/lint-api-routes.sh          # Run check
#   bash scripts/lint-api-routes.sh --strict # Fail on legacy withOrgScope too

set -euo pipefail

STRICT=false
if [[ "${1:-}" == "--strict" ]]; then
  STRICT=true
fi

API_DIR="src/pages/api"
EXEMPTIONS_FILE="scripts/api-route-exemptions.txt"
ERRORS=0
WARNINGS=0

# Create exemptions file if it doesn't exist
if [[ ! -f "$EXEMPTIONS_FILE" ]]; then
  echo "# API routes exempt from createHandler requirement." > "$EXEMPTIONS_FILE"
  echo "# Remove entries as routes are migrated." >> "$EXEMPTIONS_FILE"
fi

echo "=== API Route Security Lint ==="
echo ""

# Check each API route file
while IFS= read -r file; do
  # Skip _middleware files
  [[ "$file" == *"_middleware"* ]] && continue

  # Check if file is in exemptions list (grep for exact match)
  if grep -qxF "$file" "$EXEMPTIONS_FILE" 2>/dev/null; then
    continue
  fi

  HAS_CREATE_HANDLER=$(grep -c "createHandler" "$file" 2>/dev/null || true)
  HAS_ORG_SCOPE=$(grep -c "withOrgScope\|withAdminScope\|withOptionalOrgScope\|withPublicScope\|withAdminScopeSkipSubCheck" "$file" 2>/dev/null || true)

  if [[ "$HAS_CREATE_HANDLER" -gt 0 ]]; then
    # Using createHandler — good
    continue
  fi

  if [[ "$HAS_ORG_SCOPE" -gt 0 ]]; then
    if [[ "$STRICT" == true ]]; then
      echo "MIGRATE: $file uses legacy withOrgScope — should migrate to createHandler"
      WARNINGS=$((WARNINGS + 1))
    fi
    continue
  fi

  # Neither createHandler nor withOrgScope
  echo "ERROR: Unprotected route: $file"
  echo "  -> Must use createHandler() or be listed in $EXEMPTIONS_FILE"
  ERRORS=$((ERRORS + 1))
done < <(find "$API_DIR" -name "*.js" -type f | sort)

echo ""

# Check for raw prisma imports alongside createHandler (warning only)
while IFS= read -r file; do
  HAS_CREATE_HANDLER=$(grep -c "createHandler" "$file" 2>/dev/null || true)
  HAS_RAW_PRISMA=$(grep -c "from.*lib/prisma" "$file" 2>/dev/null || true)

  if [[ "$HAS_CREATE_HANDLER" -gt 0 && "$HAS_RAW_PRISMA" -gt 0 ]]; then
    # Allow if scope is public (no req.db available)
    HAS_PUBLIC=$(grep -c "scope.*:.*'public'" "$file" 2>/dev/null || true)
    if [[ "$HAS_PUBLIC" -gt 0 ]]; then
      continue
    fi
    echo "WARNING: $file imports raw prisma alongside createHandler — use req.db instead"
    WARNINGS=$((WARNINGS + 1))
  fi
done < <(find "$API_DIR" -name "*.js" -type f | sort)

# Check for $raw usage
while IFS= read -r file; do
  HAS_RAW=$(grep -c '\$raw' "$file" 2>/dev/null || true)
  if [[ "$HAS_RAW" -gt 0 ]]; then
    echo "REVIEW: $file uses \$raw (unscoped Prisma) — verify this is intentional"
  fi
done < <(find "$API_DIR" -name "*.js" -type f | sort)

echo ""
echo "--- Results ---"
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"

if [[ $ERRORS -gt 0 ]]; then
  echo ""
  echo "FAILED: $ERRORS unprotected route(s) found."
  echo "Fix: wrap with createHandler() or add to $EXEMPTIONS_FILE"
  exit 1
fi

echo "PASSED: All API routes are protected."
exit 0
