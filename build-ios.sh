#!/bin/bash
set -e

echo "🚀 FlowCash iOS Build Script"
echo "=============================="

# 1. Build web assets
echo "📦 Building web assets..."
npm run build

# 2. Sync to iOS
echo "📲 Syncing to iOS platform..."
npx cap sync ios

# 3. Open Xcode
echo "🛠 Opening Xcode..."
npx cap open ios

echo ""
echo "✅ Done! Xcode is now open."
echo ""
echo "Next steps in Xcode:"
echo "  1. Select your target device (iPhone or Simulator)"
echo "  2. Set your Apple ID as the signing team"
echo "  3. Click Build (Cmd+B) or Run (Cmd+R)"
echo ""
echo "For free developer signing:"
echo "  - Team: Your personal Apple ID"
echo "  - Provisioning Profile: Xcode will auto-create it"
echo "  - App will expire in 7 days, re-sign via Xcode or AltStore"
