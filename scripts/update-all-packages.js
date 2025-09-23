#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Package list
const packages = [
  'identity',
  'group',
  'proof',
  'storage',
  'proposal',
  'credential'
];

// Common npm publish configuration
const commonConfig = {
  publishConfig: {
    access: 'public',
    registry: 'https://registry.npmjs.org/'
  },
  author: 'Seohee Park <dvlprsh103@gmail.com>',
  license: 'MIT',
  keywords: [
    'zero-knowledge',
    'multi-party',
    'verifiable-credentials',
    'semaphore',
    'privacy',
    'dao',
    'governance'
  ],
  files: [
    'dist',
    'README.md',
    'LICENSE'
  ]
};

// Update each package
packages.forEach(pkgName => {
  const pkgPath = path.join(__dirname, '..', 'packages', pkgName, 'package.json');

  try {
    // Read existing package.json
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    // Add repository info
    const repoConfig = {
      repository: {
        type: 'git',
        url: 'https://github.com/yourusername/zkmpa.git',
        directory: `packages/${pkgName}`
      }
    };

    // Merge configurations
    const updatedPkgJson = {
      ...pkgJson,
      ...commonConfig,
      ...repoConfig
    };

    // Write back
    fs.writeFileSync(pkgPath, JSON.stringify(updatedPkgJson, null, 2) + '\n');

    console.log(`✓ Updated ${pkgName}/package.json`);
  } catch (error) {
    console.error(`✗ Failed to update ${pkgName}/package.json:`, error.message);
  }
});

console.log('\nAll package.json files updated with npm publishing configuration!');