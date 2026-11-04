#!/usr/bin/env bash
set -e

# OmniAchievements Version Management Tool
# Version scheme: a.b.c
#   a: main version (0 right now)
#   b: big updates
#   c: minor changes

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="$ROOT_DIR/VERSION"

CURRENT_VERSION="$(cat "$VERSION_FILE" 2>/dev/null | tr -d '[:space:]')"
if [ -z "$CURRENT_VERSION" ]; then
  CURRENT_VERSION="0.1.0"
fi

IFS='.' read -r V_A V_B V_C <<< "$CURRENT_VERSION"
V_A=${V_A:-0}
V_B=${V_B:-1}
V_C=${V_C:-0}

ACTION="$1"

if [ -z "$ACTION" ]; then
  echo "Current Version: $CURRENT_VERSION (a=$V_A, b=$V_B, c=$V_C)"
  echo ""
  echo "Usage:"
  echo "  $0 minor      # Bump 'c' for minor changes / bug fixes (e.g. $V_A.$V_B.$((V_C + 1)))"
  echo "  $0 big        # Bump 'b' for big feature updates (e.g. $V_A.$((V_B + 1)).0)"
  echo "  $0 main       # Bump 'a' for main releases (e.g. $((V_A + 1)).0.0)"
  echo "  $0 <a.b.c>    # Set exact version"
  exit 1
fi

case "$ACTION" in
  c|minor|patch)
    NEW_C=$((V_C + 1))
    NEW_VERSION="$V_A.$V_B.$NEW_C"
    ;;
  b|big)
    NEW_B=$((V_B + 1))
    NEW_VERSION="$V_A.$NEW_B.0"
    ;;
  a|main|major)
    NEW_A=$((V_A + 1))
    NEW_VERSION="$NEW_A.0.0"
    ;;
  *)
    if [[ "$ACTION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      NEW_VERSION="$ACTION"
    else
      echo "Error: Invalid version or action '$ACTION'. Must be 'minor', 'big', 'main', or 'a.b.c'."
      exit 1
    fi
    ;;
esac

echo "=========================================="
echo "Bumping OmniAchievements version:"
echo "  $CURRENT_VERSION  ➡️   $NEW_VERSION"
echo "=========================================="

# 1. Update VERSION file
echo "$NEW_VERSION" > "$VERSION_FILE"

# 2. Update client/package.json
sed -i -E "s/\"version\": \"[^\"]+\"/\"version\": \"$NEW_VERSION\"/" "$ROOT_DIR/client/package.json"

# 3. Update server/package.json
sed -i -E "s/\"version\": \"[^\"]+\"/\"version\": \"$NEW_VERSION\"/" "$ROOT_DIR/server/package.json"

# 4. Update decky-plugin/plugin.json & package.json
sed -i -E "s/\"version\": \"[^\"]+\"/\"version\": \"$NEW_VERSION\"/" "$ROOT_DIR/decky-plugin/plugin.json"
sed -i -E "s/\"version\": \"[^\"]+\"/\"version\": \"$NEW_VERSION\"/" "$ROOT_DIR/decky-plugin/package.json"

# 5. Update iOS Xcode project MARKETING_VERSION
sed -i -E "s/MARKETING_VERSION = [0-9.]+;/MARKETING_VERSION = $NEW_VERSION;/" "$ROOT_DIR/client/ios/App/App.xcodeproj/project.pbxproj"

echo "✓ Updated all package files to v$NEW_VERSION."
echo ""
echo "To publish this new release to GitHub, run:"
echo "  git commit -am \"chore(release): v$NEW_VERSION\""
echo "  git tag \"v$NEW_VERSION\""
echo "  git push origin main --tags"
