const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot, { isCSSEnabled: true });

// Watch both the mobile app and the workspace root (hoisted node_modules live there)
config.watchFolders = [projectRoot, workspaceRoot];

// Tell Metro to resolve modules from both mobile/node_modules AND lms/node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
