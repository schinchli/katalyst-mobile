const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot, { isCSSEnabled: true });

// ── Workspace: watch both mobile and hoisted node_modules ────────────────────
config.watchFolders = [projectRoot, workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// ── Performance: inline requires for faster JS startup ───────────────────────
// Defers module evaluation until first use — cuts initial parse time significantly
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// ── Performance: reduce image transformation overhead ───────────────────────
config.transformer.assetPlugins = [];

module.exports = withNativeWind(config, { input: "./global.css" });
