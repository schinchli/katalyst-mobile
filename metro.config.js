const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
// When the monorepo root packages aren't installed yet, restrict
// Metro's file watcher to this app only. Once `npm install` is
// run at the repo root, add the shared packages here:
//   watchFolders: [projectRoot, path.resolve(projectRoot, '../packages')]
const config = getDefaultConfig(projectRoot, {
  // Prevent Metro from auto-detecting and watching the workspace root
  // before root node_modules exists.
  isCSSEnabled: true,
});

config.watchFolders = [projectRoot];

module.exports = withNativeWind(config, { input: "./global.css" });
