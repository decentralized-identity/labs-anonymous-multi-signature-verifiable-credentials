#!/bin/bash

# Change package scope from @zkmpa to personal scope
NEW_SCOPE="@seohee"
OLD_SCOPE="@zkmpa"

echo "Changing scope from $OLD_SCOPE to $NEW_SCOPE..."

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

# Update each package.json
for pkg in "${PACKAGES[@]}"; do
  echo "Updating $pkg..."

  # Update package name
  cd packages/$pkg
  npm pkg set name="${NEW_SCOPE}/zkmpa-${pkg}"

  # Update dependencies in other packages
  for dep_pkg in "${PACKAGES[@]}"; do
    if [ "$dep_pkg" != "$pkg" ]; then
      # Check if this package has the dependency
      if grep -q "\"${OLD_SCOPE}/${dep_pkg}\"" package.json; then
        npm pkg set dependencies.${NEW_SCOPE}/zkmpa-${dep_pkg}="workspace:*"
      fi
    fi
  done

  cd ../..
done

echo "✅ Scope changed to $NEW_SCOPE"
echo ""
echo "Next steps:"
echo "1. Rebuild packages: ./scripts/prepare-npm-publish.sh"
echo "2. Publish: ./scripts/publish-npm.sh"