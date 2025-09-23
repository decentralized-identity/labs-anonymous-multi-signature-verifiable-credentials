#!/bin/bash

# Prepare packages for npm publishing
set -e

echo "🚀 Preparing @zkmpa packages for npm publishing..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Package list
PACKAGES=(
  "identity"
  "group"
  "proof"
  "storage"
  "proposal"
  "credential"
  "core"
)

# Function to update package.json with npm publishing config
update_package_config() {
  local pkg=$1
  echo -e "${YELLOW}Updating $pkg package.json...${NC}"

  # Add publishConfig and other npm fields if not present
  # This is handled manually per package
}

# Function to build package
build_package() {
  local pkg=$1
  echo -e "${YELLOW}Building @zkmpa/$pkg...${NC}"

  cd packages/$pkg

  # Clean previous build
  npm run clean 2>/dev/null || rm -rf dist

  # Build the package
  npm run build

  cd ../..

  echo -e "${GREEN}✓ @zkmpa/$pkg built successfully${NC}"
}

# Function to check if logged into npm
check_npm_login() {
  echo "Checking npm login status..."
  npm whoami &>/dev/null
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You need to login to npm first${NC}"
    echo "Run: npm login"
    exit 1
  fi
  echo -e "${GREEN}✓ Logged in to npm${NC}"
}

# Main execution
echo "1. Checking npm login..."
check_npm_login

echo -e "\n2. Building packages..."
for pkg in "${PACKAGES[@]}"; do
  build_package $pkg
done

echo -e "\n${GREEN}✅ All packages are ready for publishing!${NC}"
echo -e "\nTo publish packages, run:"
echo "  ./scripts/publish-npm.sh"
echo ""
echo "Or publish individually:"
for pkg in "${PACKAGES[@]}"; do
  echo "  cd packages/$pkg && npm publish"
done