#!/bin/bash
# Script to generate the deployments index page
# Usage: ./generate-index.sh <gh-pages-dir> <template-file>

set -e

GH_PAGES_DIR="${1:-gh-pages}"
TEMPLATE_FILE="${2:-demo/index-template.html}"

# Find all deployments
DEPLOYMENTS=""

# Check for main deployment (now under main/{sha}/)
if [ -d "${GH_PAGES_DIR}/main" ]; then
  # Find the SHA subdirectory (there should only be one)
  for sha_dir in "${GH_PAGES_DIR}"/main/*/; do
    if [ -d "$sha_dir" ] && [ -f "${sha_dir}meta.json" ]; then
      MAIN_META=$(cat "${sha_dir}meta.json" 2>/dev/null || echo '{}')
      MAIN_BUILD=$(echo "$MAIN_META" | jq -r '.build // "unknown"')
      MAIN_TIME=$(echo "$MAIN_META" | jq -r '.timestamp // ""')
      MAIN_PATH=$(echo "$MAIN_META" | jq -r '.path // "main"')
      DEPLOYMENTS="${DEPLOYMENTS}<div class=\"deployment main\"><a href=\"./${MAIN_PATH}/\"><strong>main</strong></a><span class=\"build\">${MAIN_BUILD}</span><span class=\"time\">${MAIN_TIME}</span></div>"
      break
    fi
  done
fi

# Find PR deployments (now under pr-{number}/{sha}/)
for pr_dir in "${GH_PAGES_DIR}"/pr-*/; do
  if [ -d "$pr_dir" ]; then
    PR_NUM=$(basename "$pr_dir" | sed 's/pr-//')
    # Find the SHA subdirectory (there should only be one)
    for sha_dir in "${pr_dir}"*/; do
      if [ -d "$sha_dir" ] && [ -f "${sha_dir}meta.json" ]; then
        PR_META=$(cat "${sha_dir}meta.json" 2>/dev/null || echo '{}')
        PR_BUILD=$(echo "$PR_META" | jq -r '.build // "unknown"')
        PR_TIME=$(echo "$PR_META" | jq -r '.timestamp // ""')
        PR_PATH=$(echo "$PR_META" | jq -r '.path // "pr-'"${PR_NUM}"'"')
        DEPLOYMENTS="${DEPLOYMENTS}<div class=\"deployment pr\"><a href=\"./${PR_PATH}/\"><strong>PR #${PR_NUM}</strong></a><span class=\"build\">${PR_BUILD}</span><span class=\"time\">${PR_TIME}</span></div>"
        break
      fi
    done
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
