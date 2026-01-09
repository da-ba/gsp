#!/bin/bash
# Script to generate the deployments index page
# Usage: ./generate-index.sh <gh-pages-dir> <template-file>

set -e

GH_PAGES_DIR="${1:-gh-pages}"
TEMPLATE_FILE="${2:-demo/index-template.html}"

# Find all deployments
DEPLOYMENTS=""

# Check for main deployment (flat structure: main-{sha})
for main_dir in "${GH_PAGES_DIR}"/main-*/; do
  if [ -d "$main_dir" ] && [ -f "${main_dir}meta.json" ]; then
    MAIN_META=$(cat "${main_dir}meta.json" 2>/dev/null || echo '{}')
    MAIN_BUILD=$(echo "$MAIN_META" | jq -r '.build // "unknown"')
    MAIN_TIME=$(echo "$MAIN_META" | jq -r '.timestamp // ""')
    DIR_NAME=$(basename "$main_dir")
    MAIN_PATH=$(echo "$MAIN_META" | jq -r --arg default "${DIR_NAME}" '.path // $default')
    DEPLOYMENTS="${DEPLOYMENTS}<div class=\"deployment main\"><a href=\"./${MAIN_PATH}/\"><strong>main</strong></a><span class=\"build\">${MAIN_BUILD}</span><span class=\"time\">${MAIN_TIME}</span></div>"
    break
  fi
done

# Find PR deployments (flat structure: pr-{number}-{sha})
# Use a temp file to collect unique PR numbers and their deployments
declare -A PR_DEPLOYMENTS

for pr_dir in "${GH_PAGES_DIR}"/pr-*-*/; do
  if [ -d "$pr_dir" ] && [ -f "${pr_dir}meta.json" ]; then
    DIR_NAME=$(basename "$pr_dir")
    # Extract PR number from pr-{NUMBER}-{SHA} format
    PR_NUM=$(echo "$DIR_NAME" | sed -E 's/^pr-([0-9]+)-.*$/\1/')

    # Only process if we haven't seen this PR yet (in case of duplicates)
    if [ -z "${PR_DEPLOYMENTS[$PR_NUM]}" ]; then
      PR_META=$(cat "${pr_dir}meta.json" 2>/dev/null || echo '{}')
      PR_BUILD=$(echo "$PR_META" | jq -r '.build // "unknown"')
      PR_TIME=$(echo "$PR_META" | jq -r '.timestamp // ""')
      PR_PATH=$(echo "$PR_META" | jq -r --arg default "${DIR_NAME}" '.path // $default')
      PR_DEPLOYMENTS[$PR_NUM]="<div class=\"deployment pr\"><a href=\"./${PR_PATH}/\"><strong>PR #${PR_NUM}</strong></a><span class=\"build\">${PR_BUILD}</span><span class=\"time\">${PR_TIME}</span></div>"
    fi
  fi
done

# Add PR deployments sorted by PR number
for pr_num in $(echo "${!PR_DEPLOYMENTS[@]}" | tr ' ' '\n' | sort -n); do
  DEPLOYMENTS="${DEPLOYMENTS}${PR_DEPLOYMENTS[$pr_num]}"
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
