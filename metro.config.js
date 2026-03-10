const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

// ── CRITICAL: tell Expo Router where the app dir is (monorepo fix) ───────────
process.env.EXPO_ROUTER_APP_ROOT = "app";

const config = getDefaultConfig(projectRoot, { isCSSEnabled: true });

// ── Workspace: watch both mobile and hoisted node_modules ────────────────────
// Merge with Expo defaults to satisfy expo-doctor watchFolders check
config.watchFolders = [...(config.watchFolders ?? []), projectRoot, workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// ── Performance: inline requires for faster JS startup ───────────────────────
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// ── Performance: reduce image transformation overhead ───────────────────────
config.transformer.assetPlugins = [];

module.exports = withNativeWind(config, { input: "./global.css" });
