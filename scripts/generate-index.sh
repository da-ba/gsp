#!/bin/bash
# Script to generate the deployments index page
# Usage: ./generate-index.sh <gh-pages-dir> <template-file>

set -e

GH_PAGES_DIR="${1:-gh-pages}"
TEMPLATE_FILE="${2:-demo/index-template.html}"

# Find all deployments
DEPLOYMENTS=""

# Check for main deployment
if [ -d "${GH_PAGES_DIR}/main" ]; then
  MAIN_META=$(cat "${GH_PAGES_DIR}/main/meta.json" 2>/dev/null || echo '{}')
  MAIN_BUILD=$(echo "$MAIN_META" | jq -r '.build // "unknown"')
  MAIN_TIME=$(echo "$MAIN_META" | jq -r '.timestamp // ""')
  DEPLOYMENTS="${DEPLOYMENTS}<div class=\"deployment main\"><a href=\"./main/\"><strong>main</strong></a><span class=\"build\">${MAIN_BUILD}</span><span class=\"time\">${MAIN_TIME}</span></div>"
fi

# Find PR deployments
for dir in "${GH_PAGES_DIR}"/pr-*/; do
  if [ -d "$dir" ]; then
    PR_NUM=$(basename "$dir" | sed 's/pr-//')
    PR_META=$(cat "${dir}meta.json" 2>/dev/null || echo '{}')
    PR_BUILD=$(echo "$PR_META" | jq -r '.build // "unknown"')
    PR_TIME=$(echo "$PR_META" | jq -r '.timestamp // ""')
    DEPLOYMENTS="${DEPLOYMENTS}<div class=\"deployment pr\"><a href=\"./pr-${PR_NUM}/\"><strong>PR #${PR_NUM}</strong></a><span class=\"build\">${PR_BUILD}</span><span class=\"time\">${PR_TIME}</span></div>"
  fi
done

# If no deployments, show empty message
if [ -z "$DEPLOYMENTS" ]; then
  DEPLOYMENTS='<div class="empty">No deployments available yet.</div>'
fi

# Read template and replace placeholder
if [ -f "$TEMPLATE_FILE" ]; then
  sed "s|<!-- DEPLOYMENTS_PLACEHOLDER -->|${DEPLOYMENTS}|" "$TEMPLATE_FILE" > "${GH_PAGES_DIR}/index.html"
else
  echo "Error: Template file not found: $TEMPLATE_FILE" >&2
  exit 1
fi

echo "Generated index.html with deployments"
