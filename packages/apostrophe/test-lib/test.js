const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const setupPackages = ({ folder = 'test' }) => {
  const testNodeModules = path.join(__dirname, '../', folder, 'node_modules/');
  fs.removeSync(testNodeModules);
  fs.mkdirSync(testNodeModules);
  fs.symlinkSync(path.join(__dirname, '../'), path.join(testNodeModules, 'apostrophe'), 'dir');

  const extras = path.join(__dirname, '../', folder, 'extra_node_modules/');
  const dirs = fs.existsSync(extras) ? fs.readdirSync(extras) : [];
  for (const dir of dirs) {
    fs.symlinkSync(path.join(extras, dir), path.join(testNodeModules, dir), 'dir');
  }

  // Need a "project level" package.json for functionality that checks
  // whether packages in node_modules are project level or not

  const packageJson = path.join(__dirname, '../', folder, 'package.json');
  // Remove it first, in case it's the old-style symlink to the main
  // package.json, which would break
  fs.removeSync(packageJson);
  const packageJsonInfo = {
    name: folder,
    dependencies: {
      apostrophe: 'workspace:*'
    },
    devDependencies: {
      'test-bundle': 'file:./test-bundle'
    }
  };
  for (const dir of dirs) {
    // Add namespaced modules support
    if (dir.startsWith('@')) {
      const submodules = fs.readdirSync(path.join(extras, dir));
      for (const submodule of submodules) {
        packageJsonInfo.dependencies[`${dir}/${submodule}`] = `file:./extra_node_modules/${dir}/${submodule}`;
      }
    } else {
      packageJsonInfo.dependencies[dir] = `file:./extra_node_modules/${dir}`;
    }
  }

  fs.writeFileSync(packageJson, JSON.stringify(packageJsonInfo, null, '  '));

  execSync('pnpm install ./');
};
setupPackages({ folder: 'test' });

module.exports = require('./util.js');
module.exports.setupPackages = setupPackages;
