#!/bin/bash

# Publish @zkmpa packages to npm
set -e

echo "📦 Publishing @zkmpa packages to npm..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Package list in dependency order
PACKAGES=(
  "identity"
  "group"
  "proof"
  "storage"
  "proposal"
  "credential"
  "core"
)

# Dry run flag
DRY_RUN=false
if [ "$1" == "--dry-run" ]; then
  DRY_RUN=true
  echo -e "${YELLOW}Running in DRY RUN mode - no packages will be published${NC}"
fi

# Function to check if package exists on npm
check_package_exists() {
  local pkg=$1
  npm view @zkmpa/$pkg version &>/dev/null
  return $?
}

# Function to get current version
get_current_version() {
  local pkg=$1
  cd packages/$pkg
  local version=$(node -p "require('./package.json').version")
  cd ../..
  echo $version
}

# Function to publish package
publish_package() {
  local pkg=$1
  local current_version=$(get_current_version $pkg)

  echo -e "\n${YELLOW}Publishing @zkmpa/$pkg v$current_version...${NC}"

  cd packages/$pkg

  # Check if package exists and version is already published
  if check_package_exists $pkg; then
    local published_version=$(npm view @zkmpa/$pkg version 2>/dev/null || echo "0.0.0")
    if [ "$current_version" == "$published_version" ]; then
      echo -e "${YELLOW}⚠️  @zkmpa/$pkg@$current_version is already published. Skipping...${NC}"
      cd ../..
      return 0
    fi
  fi

  # Publish
  if [ "$DRY_RUN" == true ]; then
    npm publish --dry-run
  else
    npm publish --access public
  fi

  cd ../..

  if [ "$DRY_RUN" == false ]; then
    echo -e "${GREEN}✓ @zkmpa/$pkg@$current_version published successfully${NC}"
  fi
}

# Check npm login
echo "Checking npm login status..."
npm whoami &>/dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: You need to login to npm first${NC}"
  echo "Run: npm login"
  exit 1
fi
echo -e "${GREEN}✓ Logged in to npm as $(npm whoami)${NC}"

# Check if packages are built
echo -e "\nChecking if packages are built..."
for pkg in "${PACKAGES[@]}"; do
  if [ ! -d "packages/$pkg/dist" ]; then
    echo -e "${RED}Error: packages/$pkg/dist not found${NC}"
    echo "Please run: ./scripts/prepare-npm-publish.sh"
    exit 1
  fi
done
echo -e "${GREEN}✓ All packages are built${NC}"

# Publish packages
echo -e "\n🚀 Publishing packages in dependency order..."
for pkg in "${PACKAGES[@]}"; do
  publish_package $pkg
done

echo -e "\n${GREEN}✅ Publishing complete!${NC}"

if [ "$DRY_RUN" == false ]; then
  echo -e "\nPublished packages:"
  for pkg in "${PACKAGES[@]}"; do
    local version=$(get_current_version $pkg)
    echo "  • @zkmpa/$pkg@$version"
  done

  echo -e "\nInstall the packages with:"
  echo "  npm install @zkmpa/core"
fi